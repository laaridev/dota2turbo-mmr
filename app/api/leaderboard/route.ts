import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Player from '@/lib/models/Player';
import Match from '@/lib/models/Match';
import { calculateTMMR } from '@/lib/tmmr';

// Available periods (descending order - current month first)
const PERIODS = [
    { id: 'all', label: 'Todos os tempos' },
    { id: '2025-12', label: 'Dezembro 2025' },
    { id: '2025-11', label: 'Novembro 2025' },
    { id: '2025-10', label: 'Outubro 2025' },
    { id: '2025-09', label: 'Setembro 2025' },
    { id: '2025-08', label: 'Agosto 2025' },
    { id: '2025-07', label: 'Julho 2025' },
    { id: '2025-06', label: 'Junho 2025' },
    { id: '2025-05', label: 'Maio 2025' },
    { id: '2025-04', label: 'Abril 2025' },
    { id: '2025-03', label: 'Março 2025' },
    { id: '2025-02', label: 'Fevereiro 2025' },
    { id: '2025-01', label: 'Janeiro 2025' },
];

// Robust cache for period calculations
// TTL: 5 minutes - allow new players to appear faster
const periodCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getPeriodDates(periodId: string): { start: Date; end: Date } | null {
    if (periodId === 'all') return null;

    const [year, month] = periodId.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

    return { start, end };
}

export async function GET(request: Request) {
    try {
        const searchParams = new URL(request.url).searchParams;
        const period = searchParams.get('period') || 'all';
        const rankingMode = searchParams.get('mode') || 'general'; // general, winrate, performance, consistency, pro
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '100');
        const skip = (page - 1) * limit;

        await dbConnect();

        // Check cache
        const cacheKey = `${period}-${rankingMode}-${page}-${limit}`;
        const cached = periodCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json(cached.data);
        }

        // For 'all' period, use pre-calculated data
        if (period === 'all') {
            let query: any = { isPrivate: false };
            let sortField: any = {};
            let minGamesFilter: any = {};

            // Define sorting and filtering based on ranking mode
            switch (rankingMode) {
                case 'winrate':
                    sortField = { winrate: -1 };
                    minGamesFilter = { $expr: { $gte: [{ $add: ['$wins', '$losses'] }, 50] } };
                    break;
                case 'performance':
                    sortField = { avgKDA: -1 };
                    minGamesFilter = { $expr: { $gte: [{ $add: ['$wins', '$losses'] }, 20] } };
                    break;
                case 'pro':
                    sortField = { proWinrate: -1, proKDA: -1 };
                    minGamesFilter = { proGames: { $gt: 0 } }; // At least 1 PRO game
                    break;
                case 'general':
                default:
                    sortField = { tmmr: -1 };
                    break;
            }

            // Apply minimum games filter
            if (Object.keys(minGamesFilter).length > 0) {
                query = { ...query, ...minGamesFilter };
            }

            let players = await Player.find(query)
                .sort(sortField)
                .skip(skip)
                .limit(limit)
                .lean();

            // Special handling for PRO ranking: calculate fair score
            if (rankingMode === 'pro') {
                // Get all PRO players (not just paginated)
                const allProPlayers = await Player.find(query).lean();

                // Calculate PRO score combining winrate + volume
                // Philosophy: High-level grinding should be rewarded heavily
                const PRIOR_GAMES = 10; // Assume 10 games at 50% WR as baseline
                const scoredPlayers = allProPlayers.map(p => {
                    const proWins = (p.proWinrate / 100) * p.proGames;

                    // Bayesian average winrate (penalizes low samples)
                    const bayesianWR = ((proWins + PRIOR_GAMES * 0.5) / (p.proGames + PRIOR_GAMES)) * 100;

                    // Volume factor: logarithmic scale to reward consistent grinding
                    // sqrt(games) means 100 games = 10x, 400 games = 20x, 900 games = 30x
                    const volumeFactor = Math.sqrt(p.proGames);

                    // Final PRO Score: 70% skill (Bayesian WR) + 30% dedication (volume)
                    // Normalized so a 55% WR with 400 games > 65% WR with 20 games
                    const proScore = (bayesianWR * 0.7) + (volumeFactor * 0.3);

                    return {
                        ...p,
                        proScore
                    };
                });

                // Sort by PRO score (higher is better)
                scoredPlayers.sort((a, b) => b.proScore - a.proScore);

                // Apply pagination
                players = scoredPlayers.slice(skip, skip + limit) as any;

                const total = scoredPlayers.length;

                const response = {
                    players,
                    periods: PERIODS,
                    currentPeriod: period,
                    rankingMode,
                    pagination: { total, page, pages: Math.ceil(total / limit) }
                };

                periodCache.set(cacheKey, { data: response, timestamp: Date.now() });
                return NextResponse.json(response);
            }

            const total = await Player.countDocuments(query);

            const response = {
                players,
                periods: PERIODS,
                currentPeriod: period,
                rankingMode,
                pagination: { total, page, pages: Math.ceil(total / limit) }
            };

            periodCache.set(cacheKey, { data: response, timestamp: Date.now() });
            return NextResponse.json(response);
        }

        // Period filter - simple version using current TMMR
        const dates = getPeriodDates(period);
        if (!dates) {
            return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
        }

        // Get players who had activity in the period
        const playersWithActivity = await Match.aggregate([
            {
                $match: {
                    timestamp: { $gte: dates.start, $lte: dates.end }
                }
            },
            {
                $group: {
                    _id: '$playerSteamId',
                    periodGames: { $sum: 1 }
                }
            }
        ]);

        const activeSteamIds = playersWithActivity.map(p => p._id);

        const activePlayers = await Player.find({
            steamId: { $in: activeSteamIds },
            isPrivate: false
        }).lean();

        const periodGamesMap = new Map(
            playersWithActivity.map(p => [p._id, p.periodGames])
        );

        const periodResults = activePlayers.map(player => ({
            steamId: player.steamId,
            name: player.name,
            avatar: player.avatar,
            tmmr: player.tmmr,
            wins: player.wins,
            losses: player.losses,
            streak: player.streak,
            periodGames: periodGamesMap.get(player.steamId) || 0
        }));

        periodResults.sort((a, b) => b.tmmr - a.tmmr);

        const paginatedResults = periodResults.slice(skip, skip + limit);
        const total = periodResults.length;

        const response = {
            players: paginatedResults,
            periods: PERIODS,
            currentPeriod: period,
            pagination: { total, page, pages: Math.ceil(total / limit) }
        };

        periodCache.set(cacheKey, { data: response, timestamp: Date.now() });
        return NextResponse.json(response);

    } catch (error) {
        console.error('Leaderboard Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
