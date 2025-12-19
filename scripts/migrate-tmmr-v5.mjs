/**
 * Migration script: TMMR v5.2
 * 
 * Features:
 * - Weighted wins: 1.02^(rank-50) per win
 * - Maturity penalty: -300 for 0 games, -0 for 200+ games
 */

import mongoose from 'mongoose';
import * as fs from 'fs';

// Load env
const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
});

// Constants
const BASE_TMMR = 3500;
const PERFORMANCE_SCALE = 3500;
const MIN_GAMES = 30;
const MATURITY_THRESHOLD = 200;
const MATURITY_MAX_PENALTY = 300;
const TMMR_MIN = 500;
const TMMR_MAX = 7000;
const RANK_WEIGHT_BASE = 1.02;
const RANK_WEIGHT_CENTER = 50;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getRankMultiplier(rank) {
    const r = clamp(rank, 10, 85);
    return Math.pow(RANK_WEIGHT_BASE, r - RANK_WEIGHT_CENTER);
}

function getMaturityPenalty(games) {
    if (games >= MATURITY_THRESHOLD) return 0;
    return ((MATURITY_THRESHOLD - games) / MATURITY_THRESHOLD) * MATURITY_MAX_PENALTY;
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

function calculateTMMRv52(matches) {
    const validMatches = matches.filter(m => m.duration >= 480 && (!m.leaver_status || m.leaver_status <= 1));
    const games = validMatches.length;

    if (games < MIN_GAMES) {
        return {
            tmmr: BASE_TMMR,
            wins: 0, losses: 0, games,
            weightedWins: 0, performance: 0,
            avgRank: 50, maturityPenalty: getMaturityPenalty(games),
            isCalibrating: true
        };
    }

    let weightedWins = 0;
    let totalWins = 0;
    let rankSum = 0;
    let rankedCount = 0;

    for (const match of validMatches) {
        const isWin = (match.player_slot < 128) === match.radiant_win;
        const rank = match.average_rank || 50;

        if (isWin) {
            totalWins++;
            weightedWins += getRankMultiplier(rank);
        }

        if (match.average_rank && match.average_rank > 0) {
            rankSum += match.average_rank;
            rankedCount++;
        }
    }

    const losses = games - totalWins;
    const avgRank = rankedCount > 0 ? rankSum / rankedCount : 50;

    const expectedWins = games * 0.5;
    const performance = (weightedWins - expectedWins) / games;

    const maturityPenalty = getMaturityPenalty(games);
    const rawTMMR = BASE_TMMR + (performance * PERFORMANCE_SCALE);
    const tmmr = Math.round(clamp(rawTMMR - maturityPenalty, TMMR_MIN, TMMR_MAX));

    return {
        tmmr, wins: totalWins, losses, games,
        weightedWins, performance, avgRank, maturityPenalty,
        isCalibrating: games < 50
    };
}

async function main() {
    console.log('==========================================');
    console.log('     TMMR v5.2 Migration Script');
    console.log('  (Weighted Wins + Maturity Penalty)');
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
            process.stdout.write(`[${processed + 1}/${players.length}] ${player.name.substring(0, 25).padEnd(25)}... `);

            const accountId = steamId64to32(player.steamId);
            const matches = await fetchMatches(accountId);

            if (!matches || matches.length === 0) {
                console.log('No matches - skipped');
                processed++;
                continue;
            }

            const calc = calculateTMMRv52(matches);

            await Player.updateOne(
                { steamId: player.steamId },
                {
                    $set: {
                        tmmr: calc.tmmr,
                        wins: calc.wins,
                        losses: calc.losses,
                        winrate: calc.wins / (calc.wins + calc.losses) * 100,
                        avgRankPlayed: calc.avgRank,
                        difficultyExposure: getRankMultiplier(calc.avgRank),
                        confidenceScore: 1.0 - (calc.maturityPenalty / MATURITY_MAX_PENALTY)
                    }
                }
            );

            const penaltyStr = calc.maturityPenalty > 0 ? ` (-${calc.maturityPenalty.toFixed(0)} pen)` : '';
            console.log(`✅ TMMR ${calc.tmmr}${penaltyStr} | WR: ${(calc.wins / calc.games * 100).toFixed(1)}% | Rank: ${calc.avgRank.toFixed(0)} | Games: ${calc.games}`);

            results.push({
                name: player.name,
                tmmr: calc.tmmr,
                games: calc.games,
                avgRank: calc.avgRank,
                penalty: calc.maturityPenalty
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
        const penStr = p.penalty > 0 ? ` (pen: -${p.penalty.toFixed(0)})` : '';
        console.log(`${(i + 1).toString().padStart(2)}. ${p.name.substring(0, 25).padEnd(25)} TMMR: ${p.tmmr} | Rank: ${p.avgRank.toFixed(0)} | Games: ${p.games}${penStr}`);
    });

    await mongoose.disconnect();
}

main();
