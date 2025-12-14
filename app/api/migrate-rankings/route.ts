import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Player from '@/lib/models/Player';
import Match from '@/lib/models/Match';
import { calculateRankingStats } from '@/lib/ranking-stats';

export async function POST(request: Request) {
    try {
        await connectDB();

        console.log('[Ranking Stats Migration] Starting...');

        // Get all players
        const allPlayers = await Player.find({ isPrivate: false }).lean();
        console.log(`[Ranking Stats Migration] Found ${allPlayers.length} players`);

        let processed = 0;
        let skipped = 0;

        for (const player of allPlayers) {
            try {
                // Get all matches for this player
                const matches = await Match.find({
                    playerSteamId: player.steamId
                }).lean();

                if (matches.length === 0) {
                    skipped++;
                    continue;
                }

                // Convert to format expected by calculateRankingStats
                const matchData = matches.map(m => {
                    const kdaParts = String(m.kda).split('/');
                    return {
                        kills: parseInt(kdaParts[0]) || 0,
                        deaths: parseInt(kdaParts[1]) || 0,
                        assists: parseInt(kdaParts[2]) || 0,
                        radiant_win: m.win, // Using win directly (true if player won)
                        player_slot: m.win ? 0 : 128, // 0-127 = Radiant, 128+ = Dire (simplified)
                        average_rank: m.averageRank
                    };
                });

                // Calculate ranking stats
                const stats = calculateRankingStats(matchData);

                // Update player
                await Player.updateOne(
                    { steamId: player.steamId },
                    {
                        $set: {
                            winrate: stats.winrate,
                            avgKDA: stats.avgKDA,
                            kdaVariance: stats.kdaVariance,
                            proGames: stats.proGames,
                            proWinrate: stats.proWinrate,
                            proKDA: stats.proKDA
                        }
                    }
                );

                processed++;

                if (processed % 10 === 0) {
                    console.log(`[Ranking Stats Migration] Processed ${processed}/${allPlayers.length}`);
                }

            } catch (err) {
                console.error(`[Ranking Stats Migration] Error processing ${player.steamId}:`, err);
                skipped++;
            }
        }

        console.log('[Ranking Stats Migration] Complete!');
        console.log(`Processed: ${processed}, Skipped: ${skipped}`);

        // Get top players for each ranking mode to verify
        const topWinrate = await Player.find({
            isPrivate: false,
            $expr: { $gte: [{ $add: ['$wins', '$losses'] }, 50] }
        })
            .sort({ winrate: -1 })
            .limit(5)
            .select('name winrate wins losses')
            .lean();

        const topKDA = await Player.find({
            isPrivate: false,
            $expr: { $gte: [{ $add: ['$wins', '$losses'] }, 20] }
        })
            .sort({ avgKDA: -1 })
            .limit(5)
            .select('name avgKDA wins losses')
            .lean();

        const topPro = await Player.find({
            isPrivate: false,
            proGames: { $gte: 10 }
        })
            .sort({ proWinrate: -1 })
            .limit(5)
            .select('name proWinrate proGames proKDA')
            .lean();

        return NextResponse.json({
            success: true,
            message: 'Ranking stats migration completed',
            stats: {
                total: allPlayers.length,
                processed,
                skipped
            },
            samples: {
                topWinrate,
                topKDA,
                topPro
            }
        });

    } catch (error) {
        console.error('[Ranking Stats Migration] Error:', error);
        return NextResponse.json({
            error: 'Migration failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
