/**
 * TMMR v3.0 Migration Script
 * Run: npx tsx scripts/migrate-tmmr.ts
 */

import mongoose from 'mongoose';
import Player from '../lib/models/Player';
import Match from '../lib/models/Match';
import { calculateTMMR } from '../lib/tmmr';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.p7j79.mongodb.net/dotaturbo?retryWrites=true&w=majority';

async function main() {
    console.log('🚀 Starting TMMR v3.0 Migration...');
    console.log('📡 Connecting to MongoDB...');

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const allPlayers = await Player.find({ isPrivate: false }).lean();
        console.log(`📊 Found ${allPlayers.length} players to process\n`);

        let processed = 0;
        let skipped = 0;
        const results: any[] = [];

        for (const player of allPlayers) {
            try {
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

                // Update in DB
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

                const change = calculation.currentTmmr - (player.tmmr || 0);
                results.push({
                    name: player.name,
                    oldTMMR: player.tmmr || 0,
                    newTMMR: calculation.currentTmmr,
                    change,
                    winrate: ((calculation.wins / (calculation.wins + calculation.losses)) * 100).toFixed(1),
                    games: calculation.wins + calculation.losses,
                    avgDiff: calculation.breakdown?.avgDifficultyRank?.toFixed(1) || 'N/A'
                });

                processed++;
                if (processed % 5 === 0) {
                    console.log(`⚙️  Progress: ${processed}/${allPlayers.length}`);
                }

            } catch (err: any) {
                console.error(`❌ Error processing ${player.name}:`, err.message);
                skipped++;
            }
        }

        console.log('\n🎉 Migration Complete!');
        console.log(`✅ Processed: ${processed}`);
        console.log(`⚠️  Skipped: ${skipped}`);
        console.log(`📊 Total: ${allPlayers.length}\n`);

        // Show top 20 players
        console.log('🏆 New Top 20:');
        results.sort((a, b) => b.newTMMR - a.newTMMR)
            .slice(0, 20)
            .forEach((r, i) => {
                const changeText = r.change > 0 ? `+${r.change}` : r.change;
                console.log(`${i + 1}. ${r.name}: ${r.newTMMR} (${changeText}) | WR: ${r.winrate}% | Avg Diff: ${r.avgDiff}`);
            });

        console.log('\n✨ Done! Closing connection...');
        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('\n💥 Migration failed:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

main();
