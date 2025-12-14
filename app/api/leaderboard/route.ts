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
// TTL: 1 hour - period rankings don't change frequently
const periodCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getPeriodDates(periodId: string): { start: Date; end: Date } | null {
    if (periodId === 'all') return null;

    const [year, month] = periodId.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

    return { start, end };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const page = parseInt(searchParams.get('page') || '1');
        const period = searchParams.get('period') || 'all';
        const skip = (page - 1) * limit;

        await dbConnect();

        // For 'all' period, use the stored TMMR values
        if (period === 'all') {
            const players = await Player.find({ isPrivate: false })
                .sort({ tmmr: -1 })
                .skip(skip)
                .limit(limit)
                .select('steamId name avatar tmmr wins losses streak');

            const total = await Player.countDocuments({ isPrivate: false });

            return NextResponse.json({
                players,
                periods: PERIODS,
                currentPeriod: period,
                pagination: { total, page, pages: Math.ceil(total / limit) }
            });
        }

        // Check cache for period-specific calculations
        const cacheKey = `${period}-${page}-${limit}`;
        const cached = periodCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json(cached.data);
        }

        // Calculate for specific period - USE SNAPSHOTS
        const dates = getPeriodDates(period);
        if (!dates) {
            return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
        }

        // Try to use pre-calculated snapshots first
        const MonthlySnapshot = (await import('@/lib/models/MonthlySnapshot')).default;
        const snapshots = await MonthlySnapshot.find({ period }).lean();

        if (snapshots.length > 0) {
            // Use snapshots (fast path)
            const players = await Player.find({
                steamId: { $in: snapshots.map(s => s.playerSteamId) },
                isPrivate: false
            }).lean();

            const playerMap = new Map(players.map(p => [p.steamId, p]));

            const periodResults = snapshots
                .filter(s => playerMap.has(s.playerSteamId))
                .map(s => {
                    const player = playerMap.get(s.playerSteamId)!;
                    return {
                        steamId: s.playerSteamId,
                        name: player.name,
                        avatar: player.avatar,
                        tmmr: s.tmmr,
                        wins: s.wins,
                        losses: s.losses,
                        streak: 0,
                        periodGames: s.gamesInPeriod
                    };
                })
                .sort((a, b) => b.tmmr - a.tmmr);

            const paginatedResults = periodResults.slice(skip, skip + limit);
            const total = periodResults.length;

            const response = {
                players: paginatedResults,
                periods: PERIODS,
                currentPeriod: period,
                pagination: { total, page, pages: Math.ceil(total / limit) },
                usingSnapshot: true
            };

            periodCache.set(cacheKey, { data: response, timestamp: Date.now() });
            return NextResponse.json(response);
        }

        // Fallback: Use current TMMR with activity filter (slower but works)
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
            pagination: { total, page, pages: Math.ceil(total / limit) },
            usingSnapshot: false
        };

        periodCache.set(cacheKey, { data: response, timestamp: Date.now() });
        return NextResponse.json(response);

    } catch (error) {
        console.error('Leaderboard Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
