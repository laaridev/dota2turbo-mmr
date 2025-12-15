import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Player from '@/lib/models/Player';
import Match from '@/lib/models/Match';
import { calculateTMMR } from '@/lib/tmmr';

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const batchSize = parseInt(searchParams.get('batch') || '5');
        const skip = parseInt(searchParams.get('skip') || '0');

        await connectDB();

        console.log(`[TMMR Migration] Processing batch ${skip}-${skip + batchSize}...`);

        // Get players in batch
        const allPlayers = await Player.find({ isPrivate: false })
            .skip(skip)
            .limit(batchSize)
            .lean();

        const total = await Player.countDocuments({ isPrivate: false });
        console.log(`[TMMR Migration] Batch: ${allPlayers.length} players (${skip}/${total})`);

        if (allPlayers.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Migration complete - no more players',
                done: true,
                stats: { processed: 0, total, skip }
            });
        }

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

                results.push({
                    name: player.name,
                    oldTMMR: player.tmmr,
                    newTMMR: calculation.currentTmmr,
                    change: calculation.currentTmmr - player.tmmr
                });

                processed++;

            } catch (err) {
                console.error(`[TMMR Migration] Error processing ${player.steamId}:`, err);
                skipped++;
            }
        }

        const nextSkip = skip + batchSize;
        const hasMore = nextSkip < total;

        console.log(`[TMMR Migration] Batch complete: ${processed} processed, ${skipped} skipped`);

        return NextResponse.json({
            success: true,
            message: `Batch ${skip}-${skip + batchSize} completed`,
            done: !hasMore,
            stats: {
                processed,
                skipped,
                batchSize: allPlayers.length,
                total,
                skip: nextSkip
            },
            results: results.sort((a, b) => b.newTMMR - a.newTMMR),
            nextUrl: hasMore ? `/api/migrate?batch=${batchSize}&skip=${nextSkip}` : null
        });

    } catch (error) {
        console.error('[TMMR Migration] Error:', error);
        return NextResponse.json({
            error: 'Migration failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
