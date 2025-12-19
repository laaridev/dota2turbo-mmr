/**
 * Migration script: Recalculate all players with TMMR v5.1
 * 
 * Formula: TMMR = 3500 + (WilsonWR - 0.5) × 4000 × DifficultyMod
 * NO Confidence multiplier - volume handled by Wilson Score!
 */

import mongoose from 'mongoose';
import * as fs from 'fs';

// Load env
const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
});

// TMMR v5.1 Constants
const BASE_TMMR = 3500;
const SKILL_SCALE = 4000;
const MIN_GAMES = 30;
const WILSON_Z = 1.65;
const TMMR_MIN = 500;
const TMMR_MAX = 7000;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function wilsonLowerBound(wins, total, z = WILSON_Z) {
    if (total === 0) return 0.5;
    const p = wins / total;
    const n = total;
    const denominator = 1 + (z * z) / n;
    const center = p + (z * z) / (2 * n);
    const spread = z * Math.sqrt((p * (1 - p) / n) + (z * z) / (4 * n * n));
    return (center - spread) / denominator;
}

function calculateDifficultyMod(avgRank) {
    const rank = clamp(avgRank, 0, 80);
    return 0.7 + (rank / 80) * 1.0;
}

function steamId64to32(steamId64) {
    if (steamId64.length < 12) return steamId64;
    try {
        const base = BigInt('76561197960265728');
        const id = BigInt(steamId64);
        return (id - base).toString();
    } catch (e) {
        return steamId64;
    }
}

async function fetchMatches(accountId) {
    const url = `https://api.opendota.com/api/players/${accountId}/matches?game_mode=23&significant=0`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    return await res.json();
}

function calculateTMMRv5(matches) {
    const validMatches = matches.filter(m => m.duration >= 480 && (!m.leaver_status || m.leaver_status <= 1));

    const wins = validMatches.filter(m => (m.player_slot < 128) === m.radiant_win).length;
    const losses = validMatches.length - wins;
    const games = validMatches.length;

    if (games < MIN_GAMES) {
        return {
            tmmr: BASE_TMMR,
            wins, losses, games,
            rawWinrate: games > 0 ? wins / games : 0.5,
            wilsonWinrate: 0.5,
            avgRank: 50,
            difficultyMod: 1.0,
            isCalibrating: true
        };
    }

    const rawWinrate = wins / games;
    const wilsonWinrate = wilsonLowerBound(wins, games);

    const rankedMatches = validMatches.filter(m => m.average_rank && m.average_rank > 0);
    const avgRank = rankedMatches.length > 0
        ? rankedMatches.reduce((sum, m) => sum + m.average_rank, 0) / rankedMatches.length
        : 50;
    const difficultyMod = calculateDifficultyMod(avgRank);

    // v5.1 Formula: NO Confidence multiplier!
    const skillDelta = wilsonWinrate - 0.5;
    const rawTMMR = BASE_TMMR + (skillDelta * SKILL_SCALE * difficultyMod);
    const tmmr = Math.round(clamp(rawTMMR, TMMR_MIN, TMMR_MAX));

    return {
        tmmr, wins, losses, games,
        rawWinrate, wilsonWinrate,
        avgRank, difficultyMod,
        isCalibrating: games < 50
    };
}

async function main() {
    console.log('==========================================');
    console.log('     TMMR v5.1 Migration Script');
    console.log('   (NO Confidence multiplier!)');
    console.log('==========================================\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const Player = mongoose.model('Player', new mongoose.Schema({}, { strict: false }));

    const players = await Player.find({ isPrivate: { $ne: true } }).lean();
    console.log(`Found ${players.length} players to migrate\n`);

    let processed = 0;
    let errors = 0;
    const results = [];

    for (const player of players) {
        try {
            process.stdout.write(`[${processed + 1}/${players.length}] ${player.name.substring(0, 30).padEnd(30)}... `);

            const accountId = steamId64to32(player.steamId);
            const matches = await fetchMatches(accountId);

            if (!matches || matches.length === 0) {
                console.log('No matches - skipped');
                processed++;
                continue;
            }

            const calc = calculateTMMRv5(matches);

            await Player.updateOne(
                { steamId: player.steamId },
                {
                    $set: {
                        tmmr: calc.tmmr,
                        wins: calc.wins,
                        losses: calc.losses,
                        winrate: calc.rawWinrate * 100,
                        wilsonWinrate: calc.wilsonWinrate * 100,
                        avgRankPlayed: calc.avgRank,
                        difficultyExposure: calc.difficultyMod
                    }
                }
            );

            console.log(`✅ TMMR ${calc.tmmr} | WR: ${(calc.rawWinrate * 100).toFixed(1)}% → Wilson: ${(calc.wilsonWinrate * 100).toFixed(1)}% | Diff: ${calc.difficultyMod.toFixed(2)}`);

            results.push({
                name: player.name,
                tmmr: calc.tmmr,
                rawWR: calc.rawWinrate,
                wilsonWR: calc.wilsonWinrate,
                avgRank: calc.avgRank,
                diffMod: calc.difficultyMod,
                games: calc.games
            });

            processed++;
            await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            errors++;
            processed++;
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    console.log('\n==========================================');
    console.log('         Migration Complete!');
    console.log('==========================================');
    console.log(`Processed: ${processed}`);
    console.log(`Errors: ${errors}`);

    // Show new ranking
    console.log('\n=== NEW RANKING (Top 20) ===');
    const byTMMR = results.sort((a, b) => b.tmmr - a.tmmr);
    byTMMR.slice(0, 20).forEach((p, i) => {
        console.log(`${(i + 1).toString().padStart(2)}. ${p.name.substring(0, 25).padEnd(25)} TMMR: ${p.tmmr} | WR: ${(p.rawWR * 100).toFixed(1)}% | Rank: ${p.avgRank.toFixed(0)} | Games: ${p.games}`);
    });

    await mongoose.disconnect();
}

main();
