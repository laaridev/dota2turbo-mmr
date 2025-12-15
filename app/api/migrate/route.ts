import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Player from '@/lib/models/Player';
import Match from '@/lib/models/Match';
import { calculateTMMR } from '@/lib/tmmr';

export async function POST(request: Request) {
    try {
        await connectDB();

        console.log('[TMMR Migration] Starting recalculation with v3.0 formula...');

        // Get all players
        const allPlayers = await Player.find({ isPrivate: false }).lean();
        console.log(`[TMMR Migration] Found ${allPlayers.length} players`);

        let processed = 0;
        let skipped = 0;
        const results = [];

        for (const player of allPlayers) {
            try {
                // Get all matches for this player
                const matches = await Match.find({
                    playerSteamId: player.steamId
                }).sort({ timestamp: 1 }).lean();

                if (matches.length === 0) {
                    skipped++;
                    continue;
                }

                // Convert to OpenDota format
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

                // Calculate new TMMR with v3.0
                const calculation = calculateTMMR(openDotaMatches);

                // Update player
                await Player.updateOne(
                    { steamId: player.steamId },
                    {
                        $set: {
                            tmmr: calculation.currentTmmr,
                            wins: calculation.wins,
                            losses: calculation.losses,
                            streak: calculation.streak
                        }
                    }
                );

                // Store top 20 for display
                if (processed < 20) {
                    results.push({
                        name: player.name,
                        oldTMMR: player.tmmr,
                        newTMMR: calculation.currentTmmr,
                        change: calculation.currentTmmr - player.tmmr,
                        winrate: ((calculation.wins / (calculation.wins + calculation.losses)) * 100).toFixed(1),
                        games: calculation.wins + calculation.losses,
                        avgDifficulty: calculation.breakdown?.avgDifficultyRank?.toFixed(1) || 'N/A'
                    });
                }

                processed++;

                if (processed % 10 === 0) {
                    console.log(`[TMMR Migration] Processed ${processed}/${allPlayers.length}`);
                }

            } catch (err) {
                console.error(`[TMMR Migration] Error processing ${player.steamId}:`, err);
                skipped++;
            }
        }

        console.log('[TMMR Migration] Complete!');
        console.log(`Processed: ${processed}, Skipped: ${skipped}`);

        return NextResponse.json({
            success: true,
            message: 'TMMR v3.0 migration completed',
            stats: {
                total: allPlayers.length,
                processed,
                skipped
            },
            topPlayers: results.sort((a, b) => b.newTMMR - a.newTMMR)
        });

    } catch (error) {
        console.error('[TMMR Migration] Error:', error);
        return NextResponse.json({
            error: 'Migration failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
