import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Player from '@/lib/models/Player';
import Match from '@/lib/models/Match';
import MonthlySnapshot from '@/lib/models/MonthlySnapshot';
import { calculateTMMR } from '@/lib/tmmr';

// Generate monthly snapshots for all periods
export async function POST(request: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period'); // e.g., '2025-11' or 'all'

        const periods = period === 'all' ? [
            '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
            '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'
        ] : [period];

        const results = [];

        for (const p of periods) {
            if (!p) continue;

            const [year, month] = p.split('-').map(Number);
            const periodStart = new Date(year, month - 1, 1);
            const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

            console.log(`Processing ${p}...`);

            // Get all players
            const allPlayers = await Player.find({ isPrivate: false }).lean();
            let processed = 0;
            let skipped = 0;

            for (const player of allPlayers) {
                // Get all matches up to end of period
                const matchesUpToPeriod = await Match.find({
                    playerSteamId: player.steamId,
                    timestamp: { $lte: periodEnd }
                }).sort({ timestamp: 1 }).lean();

                if (matchesUpToPeriod.length < 1) {
                    skipped++;
                    continue;
                }

                // Count games in this specific period
                const gamesInPeriod = matchesUpToPeriod.filter(m =>
                    new Date(m.timestamp) >= periodStart && new Date(m.timestamp) <= periodEnd
                ).length;

                // Skip if no activity in this period
                if (gamesInPeriod < 1) {
                    skipped++;
                    continue;
                }

                // Calculate TMMR with all matches up to period end
                const openDotaMatches = matchesUpToPeriod.map(m => ({
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

                // Upsert snapshot
                await MonthlySnapshot.findOneAndUpdate(
                    { period: p, playerSteamId: player.steamId },
                    {
                        tmmr: calc.currentTmmr,
                        wins: calc.wins,
                        losses: calc.losses,
                        gamesInPeriod,
                        totalGamesUpToPeriod: matchesUpToPeriod.length,
                        calculatedAt: new Date()
                    },
                    { upsert: true, new: true }
                );

                processed++;
            }

            results.push({
                period: p,
                processed,
                skipped,
                total: allPlayers.length
            });

            console.log(`${p}: Processed ${processed}, Skipped ${skipped}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Snapshots generated successfully',
            results
        });

    } catch (error) {
        console.error('Snapshot generation error:', error);
        return NextResponse.json({ error: 'Failed to generate snapshots' }, { status: 500 });
    }
}
