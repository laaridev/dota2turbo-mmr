/**
 * TurboMMR (TMMR) Calculation System v5.0
 * 
 * A simplified, transparent rating system for Dota 2 Turbo mode.
 * 
 * === PHILOSOPHY ===
 * "Quanto você ganha e contra quem?"
 * 
 * === 2 PILLARS ===
 * 
 * 1. SKILL (Wilson Winrate): Conservative winrate that penalizes small samples
 *    - Volume is handled here: 60% with 100 games ≠ 60% with 1000 games
 *    - Wilson Score naturally gives more credit to proven performance
 * 
 * 2. DIFFICULTY (Rank Multiplier): Playing in higher lobbies = more valuable
 *    - Guardian lobbies = penalty
 *    - Ancient/Divine lobbies = bonus
 * 
 * === FORMULA ===
 * 
 * TMMR = 3500 + (WilsonWR - 0.5) × 4000 × DifficultyMod
 * 
 * === REMOVED ===
 * - Solo/Party weighting (unreliable data)
 * - Confidence as multiplier (volume handled by Wilson)
 * - Hero-normalized KDA (complex)
 * - Consistency score (noise)
 */

import { OpenDotaMatch } from './opendota';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface TMMRv5Breakdown {
    // Skill (Wilson Winrate)
    rawWinrate: number;          // Actual winrate (0-1)
    wilsonWinrate: number;       // Conservative winrate (0-1)

    // Volume info (for display, not calculation)
    games: number;

    // Difficulty
    avgRank: number;             // 0-80 scale
    difficultyMod: number;       // 0.7 to 1.7

    // Stats
    wins: number;
    losses: number;

    // Final
    finalTMMR: number;
    isCalibrating: boolean;

    // Version
    version: 5;
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

// Base TMMR (Legend-like center at 50% winrate)
const BASE_TMMR = 3500;

// Scale factor for skill score
// 60% Wilson WR at 1.3x difficulty = 3500 + (0.1 × 4000 × 1.3) = 4020
const SKILL_SCALE = 4000;

// Minimum games to be ranked
const MIN_GAMES = 30;

// Wilson score Z value (1.65 = 90% confidence)
const WILSON_Z = 1.65;

// TMMR clamps
const TMMR_MIN = 500;
const TMMR_MAX = 7000;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Wilson score lower bound for binomial proportion
 * Returns a conservative estimate of true winrate given observed data
 * This penalizes small sample sizes naturally!
 * 
 * Examples:
 * - 60 wins / 100 games = 51.8% Wilson
 * - 600 wins / 1000 games = 57.5% Wilson
 * - 6000 wins / 10000 games = 59.2% Wilson
 * 
 * Volume matters, but with DIMINISHING returns built-in!
 */
function wilsonLowerBound(wins: number, total: number, z: number = WILSON_Z): number {
    if (total === 0) return 0.5;

    const p = wins / total;
    const n = total;

    // Wilson score interval lower bound formula
    const denominator = 1 + (z * z) / n;
    const center = p + (z * z) / (2 * n);
    const spread = z * Math.sqrt((p * (1 - p) / n) + (z * z) / (4 * n * n));

    return (center - spread) / denominator;
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
// PILLAR 1: SKILL (Wilson Winrate)
// ============================================

/**
 * Calculate Wilson winrate - conservative estimate of true skill
 * Volume is handled here - more games = Wilson approaches raw winrate
 */
function calculateWilsonWinrate(wins: number, games: number): number {
    return wilsonLowerBound(wins, games, WILSON_Z);
}

// ============================================
// PILLAR 2: DIFFICULTY (Rank Multiplier)
// ============================================

/**
 * Calculate difficulty modifier based on average lobby rank
 * 
 * Formula: 0.7 + (avgRank / 80) × 1.0
 * 
 * Scale (OpenDota rank 0-80):
 * - Rank 20 (Guardian) = 0.95x
 * - Rank 35 (Archon)   = 1.14x
 * - Rank 50 (Legend)   = 1.33x (neutral reference)
 * - Rank 60 (Ancient)  = 1.45x
 * - Rank 70 (Divine)   = 1.58x
 * - Rank 80 (Immortal) = 1.70x
 */
function calculateDifficultyMod(avgRank: number): number {
    const rank = clamp(avgRank, 0, 80);
    return 0.7 + (rank / 80) * 1.0;
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Calculate TMMR v5
 * 
 * Formula: TMMR = 3500 + (WilsonWR - 0.5) × 4000 × DifficultyMod
 * 
 * NO Confidence multiplier! Volume is handled by Wilson Score.
 */
export function calculateTMMRv5(matches: OpenDotaMatch[]): TMMRv5Result {
    // Filter valid matches
    const validMatches = matches.filter(isValidMatch);

    // Count wins/losses
    const wins = validMatches.filter(inferWin).length;
    const losses = validMatches.length - wins;
    const games = validMatches.length;

    // Not enough games
    if (games < MIN_GAMES) {
        return createCalibratingResult(wins, losses, games);
    }

    // PILLAR 1: Skill (Wilson Winrate)
    const rawWinrate = games > 0 ? wins / games : 0.5;
    const wilsonWinrate = calculateWilsonWinrate(wins, games);

    // PILLAR 2: Difficulty (Rank Multiplier)
    const rankedMatches = validMatches.filter(m => m.average_rank && m.average_rank > 0);
    const avgRank = rankedMatches.length > 0
        ? rankedMatches.reduce((sum, m) => sum + m.average_rank!, 0) / rankedMatches.length
        : 50; // Default to Legend if no rank data
    const difficultyMod = calculateDifficultyMod(avgRank);

    // FINAL CALCULATION
    // TMMR = 3500 + (WilsonWR - 0.5) × 4000 × DifficultyMod
    // NO Confidence multiplier - Wilson handles sample size!
    const skillDelta = wilsonWinrate - 0.5;
    const rawTMMR = BASE_TMMR + (skillDelta * SKILL_SCALE * difficultyMod);
    const finalTMMR = Math.round(clamp(rawTMMR, TMMR_MIN, TMMR_MAX));

    const breakdown: TMMRv5Breakdown = {
        rawWinrate,
        wilsonWinrate,
        games,
        avgRank,
        difficultyMod,
        wins,
        losses,
        finalTMMR,
        isCalibrating: games < 50,
        version: 5
    };

    return {
        currentTmmr: finalTMMR,
        wins,
        losses,
        isCalibrating: games < 50,
        breakdown
    };
}

/**
 * Create result for players still calibrating
 */
function createCalibratingResult(wins: number, losses: number, games: number): TMMRv5Result {
    const breakdown: TMMRv5Breakdown = {
        rawWinrate: games > 0 ? wins / games : 0.5,
        wilsonWinrate: 0.5,
        games,
        avgRank: 50,
        difficultyMod: 1.0,
        wins,
        losses,
        finalTMMR: BASE_TMMR,
        isCalibrating: true,
        version: 5
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

// Export as main function for easy migration
export { calculateTMMRv5 as calculateTMMR };
