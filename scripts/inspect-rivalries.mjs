// Script to inspect rivalry data from MongoDB
// Run with: node scripts/inspect-rivalries.mjs

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

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!\n');

        const Rivalry = mongoose.model('Rivalry', RivalrySchema);
        const rivalries = await Rivalry.find({}).sort({ createdAt: -1 }).limit(10);

        console.log(`Found ${rivalries.length} rivalries\n`);

        for (const r of rivalries) {
            console.log(`\n${r.player1Name || r.player1Id} vs ${r.player2Name || r.player2Id}`);
            console.log(`Score: ${r.headToHead?.player1Wins} x ${r.headToHead?.player2Wins}`);

            const matchDetails = r.headToHead?.matchDetails || [];
            const p1Wins = matchDetails.filter(m => m.winner === r.player1Id).length;
            const p2Wins = matchDetails.filter(m => m.winner === r.player2Id).length;

            if (r.headToHead?.player1Wins !== p1Wins || r.headToHead?.player2Wins !== p2Wins) {
                console.log(`⚠️ MISMATCH: stored ${r.headToHead?.player1Wins}x${r.headToHead?.player2Wins}, calculated ${p1Wins}x${p2Wins}`);
            } else {
                console.log('✓ OK');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected');
    }
}

main();
