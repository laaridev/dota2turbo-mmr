/**
 * TurboMMR (TMMR) Calculation System v5.2
 * 
 * === PHILOSOPHY ===
 * "Vitórias contra oponentes fortes valem mais"
 * 
 * === COMPONENTS ===
 * 
 * 1. WEIGHTED WINS: Each win is worth 1.02^(rank-50) points
 *    - Legend (50) = 1.0x, Divine (65) = 1.35x, Immortal (75) = 1.64x
 * 
 * 2. MATURITY PENALTY: Players with < 200 games lose up to 300 TMMR
 *    - Prevents inflated ratings from small samples
 * 
 * === FORMULA ===
 * 
 * weightedWins = Σ(win × 1.02^(rank-50))
 * performance = (weightedWins - games×0.5) / games
 * maturityPenalty = max(0, (200 - games) / 200 × 300)
 * 
 * TMMR = 3500 + performance × 3500 - maturityPenalty
 */

import { OpenDotaMatch } from './opendota';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface TMMRv5Breakdown {
    // Raw stats
    games: number;
    wins: number;
    losses: number;
    rawWinrate: number;

    // Weighted system
    weightedWins: number;
    expectedWins: number;
    performance: number;

    // Difficulty
    avgRank: number;

    // Maturity
    maturityPenalty: number;

    // Final
    rawTMMR: number;
    finalTMMR: number;
    isCalibrating: boolean;

    version: string;
}

export interface TMMRv5Result {
    currentTmmr: number;
    wins: number;
    losses: number;
    isCalibrating: boolean;
    breakdown: TMMRv5Breakdown;
}

// ============================================
// CONSTANTS
// ============================================

const BASE_TMMR = 3500;
const PERFORMANCE_SCALE = 3500;
const MIN_GAMES = 30;
const MATURITY_THRESHOLD = 200;
const MATURITY_MAX_PENALTY = 300;
const TMMR_MIN = 500;
const TMMR_MAX = 7000;

// Rank weight: 1.02^(rank-50)
// Legend (50) = 1.0x, Divine (65) = 1.35x, Immortal (75) = 1.64x
const RANK_WEIGHT_BASE = 1.02;
const RANK_WEIGHT_CENTER = 50;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Calculate rank multiplier for a win
 * Higher rank = more valuable win
 */
function getRankMultiplier(rank: number): number {
    // Clamp rank to reasonable range
    const r = clamp(rank, 10, 85);

    // Exponential: 1.02^(rank-50)
    return Math.pow(RANK_WEIGHT_BASE, r - RANK_WEIGHT_CENTER);
}

/**
 * Calculate maturity penalty for players with few games
 * Linear decay from 300 at 0 games to 0 at 200 games
 */
function getMaturityPenalty(games: number): number {
    if (games >= MATURITY_THRESHOLD) return 0;
    return ((MATURITY_THRESHOLD - games) / MATURITY_THRESHOLD) * MATURITY_MAX_PENALTY;
}

/**
 * Infer if player won from match data
 */
function inferWin(match: OpenDotaMatch): boolean {
    const isRadiant = match.player_slot < 128;
    return isRadiant === match.radiant_win;
}

/**
 * Check if match is valid
 */
function isValidMatch(match: OpenDotaMatch): boolean {
    if (match.duration < 480) return false;
    if (match.leaver_status && match.leaver_status > 1) return false;
    return true;
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

export function calculateTMMRv5(matches: OpenDotaMatch[]): TMMRv5Result {
    // Filter valid matches
    const validMatches = matches.filter(isValidMatch);
    const games = validMatches.length;

    // Not enough games
    if (games < MIN_GAMES) {
        return createCalibratingResult(validMatches);
    }

    // Calculate weighted wins
    let weightedWins = 0;
    let totalWins = 0;
    let rankSum = 0;
    let rankedCount = 0;

    for (const match of validMatches) {
        const isWin = inferWin(match);
        const rank = match.average_rank || 50; // Default to Legend if no rank

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
    const rawWinrate = totalWins / games;
    const avgRank = rankedCount > 0 ? rankSum / rankedCount : 50;

    // Performance: how much better than expected (50% at rank 50)
    const expectedWins = games * 0.5;
    const performance = (weightedWins - expectedWins) / games;

    // Maturity penalty
    const maturityPenalty = getMaturityPenalty(games);

    // Final TMMR
    const rawTMMR = BASE_TMMR + (performance * PERFORMANCE_SCALE);
    const finalTMMR = Math.round(clamp(rawTMMR - maturityPenalty, TMMR_MIN, TMMR_MAX));

    const breakdown: TMMRv5Breakdown = {
        games,
        wins: totalWins,
        losses,
        rawWinrate,
        weightedWins,
        expectedWins,
        performance,
        avgRank,
        maturityPenalty,
        rawTMMR: Math.round(rawTMMR),
        finalTMMR,
        isCalibrating: games < 50,
        version: '5.2'
    };

    return {
        currentTmmr: finalTMMR,
        wins: totalWins,
        losses,
        isCalibrating: games < 50,
        breakdown
    };
}

/**
 * Create result for players still calibrating
 */
function createCalibratingResult(validMatches: OpenDotaMatch[]): TMMRv5Result {
    const games = validMatches.length;
    const wins = validMatches.filter(inferWin).length;
    const losses = games - wins;

    const breakdown: TMMRv5Breakdown = {
        games,
        wins,
        losses,
        rawWinrate: games > 0 ? wins / games : 0.5,
        weightedWins: 0,
        expectedWins: 0,
        performance: 0,
        avgRank: 50,
        maturityPenalty: getMaturityPenalty(games),
        rawTMMR: BASE_TMMR,
        finalTMMR: BASE_TMMR,
        isCalibrating: true,
        version: '5.2'
    };

    return {
        currentTmmr: BASE_TMMR,
        wins,
        losses,
        isCalibrating: true,
        breakdown
    };
}

// ============================================
// TIER SYSTEM
// ============================================

export type TierKey =
    | 'herald' | 'guardian' | 'crusader' | 'archon'
    | 'legend' | 'ancient' | 'divine' | 'immortal';

export function getTierV5(tmmr: number): TierKey {
    if (tmmr < 1500) return 'herald';
    if (tmmr < 2200) return 'guardian';
    if (tmmr < 2900) return 'crusader';
    if (tmmr < 3500) return 'archon';
    if (tmmr < 4100) return 'legend';
    if (tmmr < 4700) return 'ancient';
    if (tmmr < 5300) return 'divine';
    return 'immortal';
}

export const TIER_NAMES_V5: Record<TierKey, string> = {
    herald: 'Herald',
    guardian: 'Guardian',
    crusader: 'Crusader',
    archon: 'Archon',
    legend: 'Legend',
    ancient: 'Ancient',
    divine: 'Divine',
    immortal: 'Immortal'
};

// Backward compatibility
export { calculateTMMRv5 as calculateTMMR };
