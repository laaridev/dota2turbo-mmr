// Script to delete private profiles (players with no matches accessible)
// Run with: node scripts/delete-private-profiles.mjs

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch ? mongoMatch[1].trim() : null;

if (!MONGODB_URI) {
    console.error('MONGODB_URI not found');
    process.exit(1);
}

const OPENDOTA_API = 'https://api.opendota.com/api';

async function main() {
    console.log('========================================');
    console.log('Delete Private Profiles Script');
    console.log('========================================\n');

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const Player = mongoose.connection.collection('players');
    const players = await Player.find({}).toArray();

    console.log(`Checking ${players.length} players for private profiles...\n`);

    let deleted = 0;
    const deletedPlayers = [];

    for (let i = 0; i < players.length; i++) {
        const player = players[i];

        // Rate limit
        await new Promise(r => setTimeout(r, 600));

        try {
            const res = await fetch(`${OPENDOTA_API}/players/${player.steamId}/matches?game_mode=23&limit=1`);
            const matches = await res.json();

            if (!matches || matches.length === 0) {
                console.log(`[${i + 1}/${players.length}] DELETING: ${player.name} (${player.steamId}) - No matches accessible`);
                await Player.deleteOne({ _id: player._id });
                deletedPlayers.push(player.name);
                deleted++;
            } else {
                console.log(`[${i + 1}/${players.length}] OK: ${player.name}`);
            }
        } catch (err) {
            console.error(`[${i + 1}/${players.length}] ERROR: ${player.name} - ${err.message}`);
        }
    }

    console.log('\n========================================');
    console.log('Cleanup Complete!');
    console.log(`Deleted: ${deleted} private profiles`);
    if (deletedPlayers.length > 0) {
        console.log('Removed players:');
        deletedPlayers.forEach(name => console.log(`  - ${name}`));
    }
    console.log('========================================');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
}

main();
