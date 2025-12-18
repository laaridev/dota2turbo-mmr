// Script to repair rivalry data by re-fetching from OpenDota API
// This script recalculates winners correctly using radiant_win consistently
// Run with: node scripts/repair-rivalry-from-opendota.mjs

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load MONGODB_URI from .env.local
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch ? mongoMatch[1].trim() : null;

if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
}

// Define Rivalry schema
const RivalrySchema = new mongoose.Schema({
    player1Id: String,
    player2Id: String,
    player1Name: String,
    player2Name: String,
    headToHead: {
        player1Wins: Number,
        player2Wins: Number,
        totalMatches: Number,
        matchDetails: [{
            matchId: String,
            winner: String,
            player1Hero: Number,
            player2Hero: Number,
            timestamp: Number
        }]
    },
    lastUpdated: Date,
    createdAt: Date
});

async function fetchWithDelay(url, delayMs = 500) {
    await new Promise(r => setTimeout(r, delayMs));
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!\n');

        const Rivalry = mongoose.model('Rivalry', RivalrySchema);

        // Get specific rivalry that needs fixing
        const rivalries = await Rivalry.find({
            $or: [
                { player1Id: '1838936065', player2Id: '828477156' },
                { player1Id: '828477156', player2Id: '1838936065' }
            ]
        });

        console.log(`Found ${rivalries.length} rivalries to repair\n`);

        for (const r of rivalries) {
            console.log(`\nRepairing: ${r.player1Name || r.player1Id} vs ${r.player2Name || r.player2Id}`);
            console.log(`Current score: ${r.headToHead?.player1Wins} x ${r.headToHead?.player2Wins}`);

            const matchDetails = r.headToHead?.matchDetails || [];
            if (matchDetails.length === 0) continue;

            let p1Wins = 0;
            let p2Wins = 0;
            const newMatchDetails = [];

            for (const match of matchDetails) {
                console.log(`  Checking match ${match.matchId}...`);

                try {
                    // Fetch match details from OpenDota
                    const matchData = await fetchWithDelay(`https://api.opendota.com/api/matches/${match.matchId}`, 1000);

                    const radiantWon = matchData.radiant_win;

                    // Find p1 and p2 in the match
                    let p1Slot = null;
                    let p2Slot = null;

                    for (const player of matchData.players) {
                        if (String(player.account_id) === r.player1Id) {
                            p1Slot = player.player_slot;
                        }
                        if (String(player.account_id) === r.player2Id) {
                            p2Slot = player.player_slot;
                        }
                    }

                    if (p1Slot === null || p2Slot === null) {
                        console.log(`    Could not find both players in match ${match.matchId}`);
                        continue;
                    }

                    const p1Radiant = p1Slot < 128;
                    const p2Radiant = p2Slot < 128;

                    // Skip if same team
                    if (p1Radiant === p2Radiant) {
                        console.log(`    Same team - skipping`);
                        continue;
                    }

                    const p1Won = (p1Radiant && radiantWon) || (!p1Radiant && !radiantWon);
                    const correctWinner = p1Won ? r.player1Id : r.player2Id;

                    if (p1Won) p1Wins++;
                    else p2Wins++;

                    console.log(`    Radiant won: ${radiantWon}, P1 on Radiant: ${p1Radiant}, P1 won: ${p1Won}`);
                    console.log(`    Correct winner: ${correctWinner}, Was: ${match.winner}`);

                    newMatchDetails.push({
                        matchId: match.matchId,
                        winner: correctWinner,
                        player1Hero: match.player1Hero,
                        player2Hero: match.player2Hero,
                        timestamp: match.timestamp
                    });

                } catch (err) {
                    console.log(`    Error fetching match ${match.matchId}: ${err.message}`);
                    // Keep original data
                    newMatchDetails.push(match);
                    if (match.winner === r.player1Id) p1Wins++;
                    else p2Wins++;
                }
            }

            console.log(`\nCorrected score: ${p1Wins} x ${p2Wins}`);

            // Update in database
            await Rivalry.updateOne(
                { _id: r._id },
                {
                    $set: {
                        'headToHead.player1Wins': p1Wins,
                        'headToHead.player2Wins': p2Wins,
                        'headToHead.totalMatches': p1Wins + p2Wins,
                        'headToHead.matchDetails': newMatchDetails
                    }
                }
            );

            console.log('✅ Updated in database!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

main();
