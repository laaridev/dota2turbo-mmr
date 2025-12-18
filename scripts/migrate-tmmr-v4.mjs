// Migration script to recalculate TMMR v4.0 for all players
// Run with: node scripts/migrate-tmmr-v4.mjs

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

// OpenDota API base
const OPENDOTA_API = 'https://api.opendota.com/api';

// ============================================
// HERO ROLES (simplified from hero-roles.ts)
// ============================================
const HeroRole = {
    HARD_CARRY: 'HARD_CARRY',
    CORE: 'CORE',
    OFFLANE: 'OFFLANE',
    SOFT_SUPPORT: 'SOFT_SUPPORT',
    HARD_SUPPORT: 'HARD_SUPPORT'
};

const ROLE_EXPECTED_KDA = {
    [HeroRole.HARD_CARRY]: 4.0,
    [HeroRole.CORE]: 3.5,
    [HeroRole.OFFLANE]: 3.0,
    [HeroRole.SOFT_SUPPORT]: 2.0,
    [HeroRole.HARD_SUPPORT]: 1.5
};

// Simplified hero role mapping (key roles only)
const HERO_ROLES = {
    // Hard Carries
    1: HeroRole.HARD_CARRY, 6: HeroRole.HARD_CARRY, 8: HeroRole.HARD_CARRY, 10: HeroRole.HARD_CARRY,
    12: HeroRole.HARD_CARRY, 18: HeroRole.HARD_CARRY, 41: HeroRole.HARD_CARRY, 42: HeroRole.HARD_CARRY,
    44: HeroRole.HARD_CARRY, 48: HeroRole.HARD_CARRY, 54: HeroRole.HARD_CARRY, 63: HeroRole.HARD_CARRY,
    67: HeroRole.HARD_CARRY, 70: HeroRole.HARD_CARRY, 72: HeroRole.HARD_CARRY, 77: HeroRole.HARD_CARRY,
    80: HeroRole.HARD_CARRY, 81: HeroRole.HARD_CARRY, 82: HeroRole.HARD_CARRY, 89: HeroRole.HARD_CARRY,
    93: HeroRole.HARD_CARRY, 94: HeroRole.HARD_CARRY, 95: HeroRole.HARD_CARRY, 109: HeroRole.HARD_CARRY,
    114: HeroRole.HARD_CARRY, 145: HeroRole.HARD_CARRY,
    // Cores/Mid
    4: HeroRole.CORE, 11: HeroRole.CORE, 13: HeroRole.CORE, 17: HeroRole.CORE, 19: HeroRole.CORE,
    22: HeroRole.CORE, 32: HeroRole.CORE, 34: HeroRole.CORE, 35: HeroRole.CORE, 36: HeroRole.CORE,
    39: HeroRole.CORE, 43: HeroRole.CORE, 45: HeroRole.CORE, 46: HeroRole.CORE, 47: HeroRole.CORE,
    49: HeroRole.CORE, 52: HeroRole.CORE, 53: HeroRole.CORE, 56: HeroRole.CORE, 59: HeroRole.CORE,
    60: HeroRole.CORE, 61: HeroRole.CORE, 73: HeroRole.CORE, 74: HeroRole.CORE, 76: HeroRole.CORE,
    78: HeroRole.CORE, 98: HeroRole.CORE, 99: HeroRole.CORE, 104: HeroRole.CORE, 106: HeroRole.CORE,
    113: HeroRole.CORE, 120: HeroRole.CORE, 126: HeroRole.CORE, 135: HeroRole.CORE, 138: HeroRole.CORE,
    15: HeroRole.CORE,
    // Offlaners
    2: HeroRole.OFFLANE, 14: HeroRole.OFFLANE, 23: HeroRole.OFFLANE, 28: HeroRole.OFFLANE,
    29: HeroRole.OFFLANE, 33: HeroRole.OFFLANE, 38: HeroRole.OFFLANE, 51: HeroRole.OFFLANE,
    55: HeroRole.OFFLANE, 65: HeroRole.OFFLANE, 69: HeroRole.OFFLANE, 71: HeroRole.OFFLANE,
    88: HeroRole.OFFLANE, 96: HeroRole.OFFLANE, 97: HeroRole.OFFLANE, 100: HeroRole.OFFLANE,
    103: HeroRole.OFFLANE, 105: HeroRole.OFFLANE, 107: HeroRole.OFFLANE, 108: HeroRole.OFFLANE,
    129: HeroRole.OFFLANE, 137: HeroRole.OFFLANE,
    // Soft Supports
    7: HeroRole.SOFT_SUPPORT, 9: HeroRole.SOFT_SUPPORT, 16: HeroRole.SOFT_SUPPORT, 20: HeroRole.SOFT_SUPPORT,
    21: HeroRole.SOFT_SUPPORT, 25: HeroRole.SOFT_SUPPORT, 26: HeroRole.SOFT_SUPPORT, 27: HeroRole.SOFT_SUPPORT,
    40: HeroRole.SOFT_SUPPORT, 62: HeroRole.SOFT_SUPPORT, 64: HeroRole.SOFT_SUPPORT, 75: HeroRole.SOFT_SUPPORT,
    79: HeroRole.SOFT_SUPPORT, 84: HeroRole.SOFT_SUPPORT, 85: HeroRole.SOFT_SUPPORT, 86: HeroRole.SOFT_SUPPORT,
    87: HeroRole.SOFT_SUPPORT, 92: HeroRole.SOFT_SUPPORT, 101: HeroRole.SOFT_SUPPORT, 102: HeroRole.SOFT_SUPPORT,
    110: HeroRole.SOFT_SUPPORT, 119: HeroRole.SOFT_SUPPORT, 121: HeroRole.SOFT_SUPPORT, 123: HeroRole.SOFT_SUPPORT,
    128: HeroRole.SOFT_SUPPORT, 131: HeroRole.SOFT_SUPPORT, 136: HeroRole.SOFT_SUPPORT,
    // Hard Supports
    3: HeroRole.HARD_SUPPORT, 5: HeroRole.HARD_SUPPORT, 30: HeroRole.HARD_SUPPORT, 31: HeroRole.HARD_SUPPORT,
    37: HeroRole.HARD_SUPPORT, 50: HeroRole.HARD_SUPPORT, 57: HeroRole.HARD_SUPPORT, 58: HeroRole.HARD_SUPPORT,
    66: HeroRole.HARD_SUPPORT, 68: HeroRole.HARD_SUPPORT, 83: HeroRole.HARD_SUPPORT, 90: HeroRole.HARD_SUPPORT,
    91: HeroRole.HARD_SUPPORT, 111: HeroRole.HARD_SUPPORT, 112: HeroRole.HARD_SUPPORT, 155: HeroRole.HARD_SUPPORT
};

function getExpectedKDA(heroId) {
    const role = HERO_ROLES[heroId] || HeroRole.CORE;
    return ROLE_EXPECTED_KDA[role];
}

// ============================================
// TMMR v4.0 CALCULATION (simplified)
// ============================================
const TIME_DECAY_HALF_LIFE_DAYS = 180;
const SOLO_WEIGHT = 1.3;
const PARTY_WEIGHT = 0.85;
const WILSON_Z = 1.2;

function wilsonLowerBound(wins, total, z = WILSON_Z) {
    if (total === 0) return 0.5;
    const phat = wins / total;
    const n = total;
    const denominator = 1 + (z * z) / n;
    const center = phat + (z * z) / (2 * n);
    const spread = z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n);
    return (center - spread) / denominator;
}

function calculateTimeWeight(matchTimestamp) {
    const now = Date.now() / 1000;
    const daysSinceMatch = (now - matchTimestamp) / (60 * 60 * 24);
    return Math.pow(0.5, daysSinceMatch / TIME_DECAY_HALF_LIFE_DAYS);
}

function inferWin(match) {
    const isRadiant = match.player_slot < 128;
    return isRadiant === match.radiant_win;
}

function isValidMatch(match) {
    if (match.duration < 480) return false;
    if (match.leaver_status && match.leaver_status > 1) return false;
    return true;
}

function isSoloMatch(match) {
    return !match.party_size || match.party_size <= 1;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function calculateTMMRv4(matches) {
    const validMatches = matches.filter(isValidMatch);
    const games = validMatches.length;

    if (games < 30) {
        return { tmmr: 3500, breakdown: null, isCalibrating: true };
    }

    // Solo/Party split
    let soloGames = 0, soloWins = 0, partyGames = 0, partyWins = 0;
    let totalNormalizedKDA = 0, totalRawKDA = 0, kdaCount = 0;

    for (const match of validMatches) {
        const won = inferWin(match);
        if (isSoloMatch(match)) {
            soloGames++;
            if (won) soloWins++;
        } else {
            partyGames++;
            if (won) partyWins++;
        }

        // KDA
        const k = match.kills || 0;
        const d = Math.max(1, match.deaths || 0);
        const a = match.assists || 0;
        const rawKDA = (k + a * 0.7) / d;
        const expectedKDA = getExpectedKDA(match.hero_id);

        totalNormalizedKDA += rawKDA / expectedKDA;
        totalRawKDA += rawKDA;
        kdaCount++;
    }

    // Weighted winrate
    const weightedWins = (soloWins * SOLO_WEIGHT) + (partyWins * PARTY_WEIGHT);
    const weightedGames = (soloGames * SOLO_WEIGHT) + (partyGames * PARTY_WEIGHT);
    const wrReliable = wilsonLowerBound(weightedWins, weightedGames);
    const wrContribution = (wrReliable - 0.50) * 2;

    // Hero normalized KDA
    const avgKDA = kdaCount > 0 ? totalRawKDA / kdaCount : 2.5;
    const heroNormalizedKDA = kdaCount > 0 ? totalNormalizedKDA / kdaCount : 1.0;
    const kdaContribution = clamp((heroNormalizedKDA - 1.0) * 0.5, -0.5, 0.5);

    // Average rank
    const rankedMatches = validMatches.filter(m => m.average_rank && m.average_rank > 0);
    const avgRank = rankedMatches.length > 0
        ? rankedMatches.reduce((a, m) => a + m.average_rank, 0) / rankedMatches.length
        : 50;
    const rankContribution = clamp((avgRank / 50 - 1.0) * 0.3, -0.3, 0.3);

    // Consistency (simplified)
    const consistencyScore = 0.85; // Average for migration
    const consistencyContribution = clamp((consistencyScore - 0.75) * 0.4, -0.1, 0.1);

    // Skill score
    const skillScore = clamp(
        wrContribution * 0.50 +
        kdaContribution * 0.25 +
        rankContribution * 0.15 +
        consistencyContribution * 0.10,
        -1.0, 1.0
    );

    // Confidence
    const confidence = clamp(1 - Math.exp(-games / 150), 0.30, 1.0);

    // Recency
    let totalTimeWeight = 0;
    for (const m of validMatches) {
        totalTimeWeight += calculateTimeWeight(m.start_time);
    }
    const avgTimeWeight = validMatches.length > 0 ? totalTimeWeight / validMatches.length : 0.5;
    const recencyMultiplier = clamp(0.7 + (avgTimeWeight * 0.3), 0.7, 1.0);

    // Difficulty exposure
    const highRankMatches = rankedMatches.filter(m => m.average_rank >= 55);
    const highRankGames = highRankMatches.length;
    const highRankWins = highRankMatches.filter(m => inferWin(m)).length;
    const highRankWinrate = highRankGames > 0 ? highRankWins / highRankGames : 0.5;

    let difficultyExposure = 1.0;
    if (highRankGames >= 10) {
        const volumeFactor = Math.log10(1 + highRankGames) / Math.log10(100);
        const performanceFactor = clamp((highRankWinrate - 0.45) / 0.25, 0, 1);
        difficultyExposure = clamp(1.0 + (volumeFactor * 0.5 + performanceFactor * 0.5) * 0.5, 0.7, 1.5);
    }

    // Final TMMR
    const rawTMMR = 3500 + (skillScore * 3000 * confidence * recencyMultiplier * difficultyExposure);
    const finalTMMR = Math.round(clamp(rawTMMR, 500, 9500));

    const wins = validMatches.filter(m => inferWin(m)).length;
    const losses = games - wins;

    return {
        tmmr: finalTMMR,
        breakdown: {
            skillScore,
            soloGames,
            partyGames,
            soloWinrate: soloGames > 0 ? (soloWins / soloGames) * 100 : 0,
            partyWinrate: partyGames > 0 ? (partyWins / partyGames) * 100 : 0,
            heroNormalizedKDA,
            avgKDA,
            avgRank,
            consistencyScore,
            confidence,
            recencyMultiplier,
            difficultyExposure,
            highRankGames,
            highRankWinrate,
            wins,
            losses,
            winrate: games > 0 ? (wins / games) * 100 : 50
        },
        isCalibrating: games < 50
    };
}

// ============================================
// MAIN MIGRATION
// ============================================
async function fetchPlayerMatches(accountId, delay = 1000) {
    await new Promise(r => setTimeout(r, delay));
    try {
        const res = await fetch(`${OPENDOTA_API}/players/${accountId}/matches?game_mode=23&significant=0`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`    Failed to fetch: ${err.message}`);
        return null;
    }
}

async function main() {
    console.log('========================================');
    console.log('TMMR v4.0 Migration Script');
    console.log('========================================\n');

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!\n');

        // Get all players
        const Player = mongoose.connection.collection('players');
        const players = await Player.find({}).toArray();

        console.log(`Found ${players.length} players to migrate\n`);

        let updated = 0;
        let failed = 0;
        let skipped = 0;

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            console.log(`[${i + 1}/${players.length}] Processing: ${player.name} (${player.steamId})`);
            console.log(`    Current TMMR: ${player.tmmr}`);

            // Fetch matches from OpenDota
            const matches = await fetchPlayerMatches(player.steamId, 1200);

            if (!matches || matches.length === 0) {
                console.log('    Skipped: No matches found\n');
                skipped++;
                continue;
            }

            console.log(`    Fetched ${matches.length} matches`);

            // Calculate new TMMR
            const result = calculateTMMRv4(matches);

            if (!result.breakdown) {
                console.log('    Skipped: Calibrating (less than 30 games)\n');
                skipped++;
                continue;
            }

            console.log(`    New TMMR: ${result.tmmr} (${result.tmmr - player.tmmr > 0 ? '+' : ''}${result.tmmr - player.tmmr})`);
            console.log(`    Solo: ${result.breakdown.soloGames} games (${result.breakdown.soloWinrate.toFixed(1)}% WR)`);
            console.log(`    Party: ${result.breakdown.partyGames} games (${result.breakdown.partyWinrate.toFixed(1)}% WR)`);

            // Update player
            await Player.updateOne(
                { _id: player._id },
                {
                    $set: {
                        tmmr: result.tmmr,
                        skillScore: result.breakdown.skillScore,
                        confidenceScore: result.breakdown.confidence,
                        difficultyExposure: result.breakdown.difficultyExposure,
                        avgKDA: result.breakdown.avgKDA,
                        avgRankPlayed: result.breakdown.avgRank,
                        highRankGames: result.breakdown.highRankGames,
                        highRankWinrate: result.breakdown.highRankWinrate,
                        soloGames: result.breakdown.soloGames,
                        partyGames: result.breakdown.partyGames,
                        soloWinrate: result.breakdown.soloWinrate,
                        partyWinrate: result.breakdown.partyWinrate,
                        heroNormalizedKDA: result.breakdown.heroNormalizedKDA,
                        recencyMultiplier: result.breakdown.recencyMultiplier,
                        consistencyScore: result.breakdown.consistencyScore,
                        wins: result.breakdown.wins,
                        losses: result.breakdown.losses,
                        winrate: result.breakdown.winrate
                    }
                }
            );

            console.log('    ✅ Updated!\n');
            updated++;
        }

        console.log('========================================');
        console.log('Migration Complete!');
        console.log(`  Updated: ${updated}`);
        console.log(`  Skipped: ${skipped}`);
        console.log(`  Failed: ${failed}`);
        console.log('========================================');

    } catch (error) {
        console.error('Migration Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

main();
