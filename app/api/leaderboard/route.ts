import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Player from '@/lib/models/Player';
import Match from '@/lib/models/Match';
import { calculateTMMR } from '@/lib/tmmr';

// Available periods
const PERIODS = [
    { id: 'all', label: 'Todos os tempos' },
    { id: '2025-01', label: 'Janeiro 2025' },
    { id: '2025-02', label: 'Fevereiro 2025' },
    { id: '2025-03', label: 'Março 2025' },
    { id: '2025-04', label: 'Abril 2025' },
    { id: '2025-05', label: 'Maio 2025' },
    { id: '2025-06', label: 'Junho 2025' },
    { id: '2025-07', label: 'Julho 2025' },
    { id: '2025-08', label: 'Agosto 2025' },
    { id: '2025-09', label: 'Setembro 2025' },
    { id: '2025-10', label: 'Outubro 2025' },
    { id: '2025-11', label: 'Novembro 2025' },
    { id: '2025-12', label: 'Dezembro 2025' },
];

// Simple cache for period calculations (in-memory, refreshes on server restart)
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

        // Calculate for specific period
        const dates = getPeriodDates(period);
        if (!dates) {
            return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
        }

        // Get all players and their matches for the period
        const allPlayers = await Player.find({ isPrivate: false }).lean();
        const periodResults: any[] = [];

        for (const player of allPlayers) {
            const matches = await Match.find({
                playerSteamId: player.steamId,
                timestamp: { $gte: dates.start, $lte: dates.end }
            }).sort({ timestamp: 1 }).lean();

            if (matches.length < 10) continue; // Min 10 games in period

            const openDotaMatches = matches.map(m => ({
                match_id: m.matchId,
                player_slot: 0,
                radiant_win: m.win,
                duration: m.duration || 1200,
                game_mode: 23,
                lobby_type: 0,
                hero_id: m.heroId,
                start_time: Math.floor(new Date(m.timestamp).getTime() / 1000),
                version: 0,
                kills: parseInt(String(m.kda).split('/')[0]) || 0,
                deaths: parseInt(String(m.kda).split('/')[1]) || 0,
                assists: parseInt(String(m.kda).split('/')[2]) || 0,
                leaver_status: 0,
                party_size: 1,
                skill: m.skill,
                average_rank: m.averageRank
            }));

            const calc = calculateTMMR(openDotaMatches);

            periodResults.push({
                steamId: player.steamId,
                name: player.name,
                avatar: player.avatar,
                tmmr: calc.currentTmmr,
                wins: calc.wins,
                losses: calc.losses,
                streak: calc.streak,
                periodGames: matches.length
            });
        }

        // Sort by TMMR
        periodResults.sort((a, b) => b.tmmr - a.tmmr);

        const paginatedResults = periodResults.slice(skip, skip + limit);
        const total = periodResults.length;

        const response = {
            players: paginatedResults,
            periods: PERIODS,
            currentPeriod: period,
            pagination: { total, page, pages: Math.ceil(total / limit) }
        };

        // Cache the results
        periodCache.set(cacheKey, { data: response, timestamp: Date.now() });

        return NextResponse.json(response);

    } catch (error) {
        console.error('Leaderboard Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
