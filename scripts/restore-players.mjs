// Script to restore deleted players by re-analyzing them
// Run with: node scripts/restore-players.mjs

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const MONGODB_URI = mongoMatch ? mongoMatch[1].trim() : null;
const BASE_URL = 'https://turbobuff.com.br';

// Players that were incorrectly deleted
const PLAYERS_TO_RESTORE = [
    '1838936065', // ~ shattered love
    '828477156',  // NEVERMOREHACK2008GARENARGCBATTLE
    '85013553',   // Mamute86
    '138494626',  // ratolasombra
    '815962646',  // Gui
    '181698115',  // Fcking Tulum
    '204376374',  // K13 Das Turbos OriginaL
    '869452269',  // juju
    '848183340',  // Kikaraio
    '1718349601', // GABZ
    '8561100',    // JuNiNh087
    '353333383'   // feist NZ
];

async function main() {
    console.log('========================================');
    console.log('Restore Deleted Players');
    console.log('========================================\n');

    for (let i = 0; i < PLAYERS_TO_RESTORE.length; i++) {
        const steamId = PLAYERS_TO_RESTORE[i];
        console.log(`[${i + 1}/${PLAYERS_TO_RESTORE.length}] Restoring: ${steamId}`);

        try {
            // Wait 3 seconds between requests to avoid rate limiting
            await new Promise(r => setTimeout(r, 3000));

            const res = await fetch(`${BASE_URL}/api/analyze?steamId=${steamId}`, {
                method: 'POST'
            });

            if (res.ok) {
                const data = await res.json();
                console.log(`    ✅ Restored: ${data.name || 'Unknown'} - TMMR: ${data.tmmr}`);
            } else {
                console.log(`    ❌ Failed: HTTP ${res.status}`);
            }
        } catch (err) {
            console.log(`    ❌ Error: ${err.message}`);
        }
    }

    console.log('\n========================================');
    console.log('Restore Complete!');
    console.log('========================================');
}

main();
