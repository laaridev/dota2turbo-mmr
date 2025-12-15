/**
 * TMMR v3.0 Migration Script
 * Recalculates all player ratings directly in MongoDB with the new formula
 * Run: node scripts/migrate-tmmr.js
 */

const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.p7j79.mongodb.net/dotaturbo?retryWrites=true&w=majority';

// Import models (we'll use require since this is a Node script)
const playerSchema = new mongoose.Schema({
    steamId: String,
    name: String,
    avatar: String,
    tmmr: Number,
    wins: Number,
    losses: Number,
    streak: Number,
    lastUpdate: Date,
    matches: [Number],
    isPrivate: Boolean,
    winrate: Number,
    avgKDA: Number,
    kdaVariance: Number,
    proGames: Number,
    proWinrate: Number,
    proKDA: Number
}, { timestamps: true });

const matchSchema = new mongoose.Schema({
    matchId: Number,
    playerSteamId: String,
    heroId: Number,
    win: Boolean,
    duration: Number,
    kda: String,
    timestamp: Date,
    tmmrChange: Number,
    skill: Number,
    averageRank: Number
}, { timestamps: true });

const Player = mongoose.models.Player || mongoose.model('Player', playerSchema);
const Match = mongoose.models.Match || mongoose.model('Match', matchSchema);

async function main() {
    console.log('🚀 Starting TMMR v3.0 Migration...');
    console.log('📡 Connecting to MongoDB...');

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Import TMMR calculator (we need to use the compiled version)
        const { calculateTMMR } = require('../.next/server/chunks/ssr/lib_tmmr_ts.js');

        const allPlayers = await Player.find({ isPrivate: false }).lean();
        console.log(`📊 Found ${allPlayers.length} players to process`);

        let processed = 0;
        let skipped = 0;
        const results = [];

        for (const player of allPlayers) {
            try {
                const matches = await Match.find({
                    playerSteamId: player.steamId
                }).sort({ timestamp: 1 }).lean();

                if (matches.length === 0) {
                    console.log(`⚠️  Skipped ${player.name} (no matches)`);
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

                // Calculate new TMMR
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

                const change = calculation.currentTmmr - player.tmmr;
                results.push({
                    name: player.name,
                    oldTMMR: player.tmmr,
                    newTMMR: calculation.currentTmmr,
                    change,
                    winrate: ((calculation.wins / (calculation.wins + calculation.losses)) * 100).toFixed(1),
                    games: calculation.wins + calculation.losses
                });

                processed++;
                if (processed % 5 === 0) {
                    console.log(`⚙️  Processed ${processed}/${allPlayers.length}...`);
                }

            } catch (err) {
                console.error(`❌ Error processing ${player.name}:`, err.message);
                skipped++;
            }
        }

        console.log('\n🎉 Migration Complete!');
        console.log(`✅ Processed: ${processed}`);
        console.log(`⚠️  Skipped: ${skipped}`);
        console.log(`📊 Total: ${allPlayers.length}\n`);

        // Show top 20 with biggest changes
        console.log('📈 Top 20 changes:');
        results.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
            .slice(0, 20)
            .forEach((r, i) => {
                const arrow = r.change > 0 ? '⬆️' : '⬇️';
                console.log(`${i + 1}. ${r.name}: ${r.oldTMMR} → ${r.newTMMR} (${arrow} ${r.change > 0 ? '+' : ''}${r.change})`);
            });

        console.log('\n✨ Done!');
        process.exit(0);

    } catch (error) {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    }
}

main();
