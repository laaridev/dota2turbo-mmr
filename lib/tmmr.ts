/**
 * TurboMMR (TMMR) Calculation System v3.0
 * 
 * A transparent, fair rating system for Dota 2 Turbo mode based on 3 layers:
 * 
 * 1. SKILL SCORE (SS) - Pure skill measurement independent of volume
 *    - Winrate Confiável (Wilson Score) - 60%
 *    - KDA Normalizado - 25%
 *    - Rank Médio das Partidas - 15%
 * 
 * 2. CONFIDENCE SCORE (CS) - Statistical reliability
 *    - Volume-based, exponential saturation
 *    - More games = more confidence
 * 
 * 3. DIFFICULTY EXPOSURE (DE) - Level of competition faced
 *    - Proportion of high-rank games
 *    - Performance in those games
 * 
 * Final Formula:
 * TMMR = 3500 + (SkillScore × SCALE × Confidence × DifficultyExposure)
 */

import { OpenDotaMatch } from './opendota';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface SkillComponents {
    wrReliable: number;         // Wilson Lower Bound (0-1)
    wrContribution: number;     // Contribution to skill score
    avgKDA: number;             // Average KDA
    kdaNormalized: number;      // KDA normalized (center=1)
    kdaContribution: number;    // Contribution to skill score
    avgRank: number;            // Average rank of matches
    avgRankNormalized: number;  // Rank normalized (center=1, Legend=50)
    rankContribution: number;   // Contribution to skill score
    skillScore: number;         // Final skill score (-1 to 1)
}

export interface DifficultyComponents {
    highRankGames: number;      // Games with avg_rank >= threshold
    highRankWinrate: number;    // Winrate in those games
    exposureRatio: number;      // % of games in high lobbies
    difficultyExposure: number; // Final multiplier (0.7-1.5)
}

export interface TMMRBreakdownV3 {
    // Skill Score Components
    skillScore: number;
    skillComponents: SkillComponents;

    // Confidence Score
    confidence: number;
    games: number;

    // Difficulty Exposure
    difficultyExposure: number;
    difficultyComponents: DifficultyComponents;

    // Basic stats
    wins: number;
    losses: number;
    winrate: number;

    // Final
    finalTMMR: number;
    isCalibrating: boolean;
}

export interface TmmrCalculationResult {
    currentTmmr: number;
    wins: number;
    losses: number;
    streak: number; // Deprecated, kept for compatibility
    processedMatches: CalculatedMatchResult[];
    isCalibrating: boolean;
    confidence: number;
    breakdown: TMMRBreakdownV3;
}

export interface CalculatedMatchResult {
    matchId: number;
    heroId: number;
    win: boolean;
    duration: number;
    kda: string;
    timestamp: Date;
    tmmrChange: number;
    tmmrAfter: number;
    skill?: number;
    averageRank?: number;
    difficultyWeight: number;
}

// ============================================
// CONFIGURABLE CONSTANTS
// ============================================

// Base rating (Legend-like center)
const BASE_TMMR = 3500;

// Minimum games to be ranked
const MIN_GAMES = 30;

// Calibration period
const CALIBRATION_GAMES = 50;

// Scale for skill score to TMMR conversion
// ±1 skill score = ±3000 TMMR at full confidence
const SKILL_SCALE = 3000;

// Clamps
const TMMR_MIN = 500;
const TMMR_MAX = 9500;

// Wilson score Z value (1.2 = 88% confidence)
const WILSON_Z = 1.2;

// Skill Score weights
const WEIGHT_WR = 0.60;      // Winrate weight
const WEIGHT_KDA = 0.25;     // KDA weight
const WEIGHT_RANK = 0.15;    // Average rank weight

// KDA normalization center (expected average KDA)
const KDA_CENTER = 2.5;

// Confidence saturation constant
const CONFIDENCE_K = 150;
const CONFIDENCE_MIN = 0.30;

// High rank threshold for difficulty exposure
const HIGH_RANK_THRESHOLD = 55; // Ancient-

// ============================================
// UTILITY FUNCTIONS
// ============================================

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Wilson score lower bound for binomial proportion
 * Returns a conservative estimate of true winrate given observed data
 * This penalizes small sample sizes naturally
 */
function wilsonLowerBound(wins: number, total: number, z: number = WILSON_Z): number {
    if (total === 0) return 0.5;

    const phat = wins / total;
    const n = total;

    // Wilson score interval lower bound formula
    const denominator = 1 + (z * z) / n;
    const center = phat + (z * z) / (2 * n);
    const spread = z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n);

    return (center - spread) / denominator;
}

/**
 * Infer if player won from match data
 */
function inferWin(match: OpenDotaMatch): boolean {
    const playerSlot = match.player_slot;
    const isRadiant = playerSlot < 128;
    return isRadiant === match.radiant_win;
}

/**
 * Check if match should be considered valid
 * Excludes very short games, abandoned games, etc.
 */
function isValidMatch(match: OpenDotaMatch): boolean {
    // Minimum duration: 8 minutes (Turbo can be fast)
    if (match.duration < 480) return false;

    // Check for leaver status if available
    if (match.leaver_status && match.leaver_status > 1) return false;

    return true;
}

/**
 * Calculate KDA for a match
 */
function calculateMatchKDA(match: OpenDotaMatch): number {
    const k = match.kills || 0;
    const d = Math.max(1, match.deaths || 0);
    const a = match.assists || 0;
    return (k + a * 0.7) / d;
}

// ============================================
// LAYER 1: SKILL SCORE
// ============================================

/**
 * Calculate Skill Score - Pure skill measurement independent of volume
 * 
 * Components:
 * - Winrate (Wilson Score) - 60%
 * - KDA Normalized - 25%
 * - Average Rank - 15%
 */
function calculateSkillScore(matches: OpenDotaMatch[], wins: number, games: number): SkillComponents {
    // 1. Winrate Confiável (Wilson Score)
    const wrReliable = wilsonLowerBound(wins, games, WILSON_Z);
    const wrContribution = (wrReliable - 0.50) * 2; // Normalize to -1 to 1 range

    // 2. KDA Normalizado
    const kdas = matches.map(m => calculateMatchKDA(m));
    const avgKDA = kdas.length > 0
        ? kdas.reduce((a, b) => a + b, 0) / kdas.length
        : KDA_CENTER;
    const kdaNormalized = avgKDA / KDA_CENTER; // Center = 1
    const kdaContribution = clamp((kdaNormalized - 1.0) * 0.5, -0.5, 0.5); // Smaller range

    // 3. Rank Médio das Partidas
    const rankedMatches = matches.filter(m => m.average_rank && m.average_rank > 0);
    const avgRank = rankedMatches.length > 0
        ? rankedMatches.reduce((a, m) => a + m.average_rank!, 0) / rankedMatches.length
        : 50; // Default = Legend
    const avgRankNormalized = avgRank / 50; // 50 = Legend = center
    const rankContribution = clamp((avgRankNormalized - 1.0) * 0.3, -0.3, 0.3); // Smaller range

    // 4. Skill Score Final (weighted)
    const skillScore = clamp(
        wrContribution * WEIGHT_WR +
        kdaContribution * WEIGHT_KDA +
        rankContribution * WEIGHT_RANK,
        -1.0,
        1.0
    );

    return {
        wrReliable,
        wrContribution,
        avgKDA,
        kdaNormalized,
        kdaContribution,
        avgRank,
        avgRankNormalized,
        rankContribution,
        skillScore
    };
}

// ============================================
// LAYER 2: CONFIDENCE SCORE
// ============================================

/**
 * Calculate Confidence Score - How reliable is the skill measurement
 * 
 * Based on number of games with exponential saturation
 * More games = more confidence (but diminishing returns)
 */
function calculateConfidence(games: number): number {
    // Exponential saturation: 1 - e^(-games / K)
    // K = 150 means:
    // 30 games  = 18% → clamped to 30%
    // 50 games  = 28% → clamped to 30%
    // 100 games = 49%
    // 200 games = 74%
    // 500 games = 96%
    // 1000 games = 99.9%

    const raw = 1 - Math.exp(-games / CONFIDENCE_K);

    // Never less than 30% to avoid completely destroying ratings
    return clamp(raw, CONFIDENCE_MIN, 1.0);
}

// ============================================
// LAYER 3: DIFFICULTY EXPOSURE
// ============================================

/**
 * Calculate Difficulty Exposure - At what level was skill demonstrated
 * 
 * Based on:
 * - Proportion of games in high-rank lobbies
 * - Performance (winrate) in those lobbies
 */
function calculateDifficultyExposure(matches: OpenDotaMatch[]): DifficultyComponents {
    const rankedMatches = matches.filter(m => m.average_rank && m.average_rank > 0);
    const highRankMatches = rankedMatches.filter(m => m.average_rank! >= HIGH_RANK_THRESHOLD);

    const highRankGames = highRankMatches.length;
    const highRankWins = highRankMatches.filter(m => inferWin(m)).length;
    const highRankWinrate = highRankGames > 0 ? highRankWins / highRankGames : 0.5;

    // Proportion of games in high lobbies
    const exposureRatio = rankedMatches.length > 0
        ? highRankGames / rankedMatches.length
        : 0;

    // Calculate difficulty exposure multiplier
    let difficultyExposure = 1.0; // Neutral default

    if (highRankGames >= 10) {
        // Volume factor: logarithmic scale (saturates around 100 games)
        const volumeFactor = Math.log10(1 + highRankGames) / Math.log10(100);

        // Performance factor: WR in hard games (45%-70% → 0-1)
        const performanceFactor = clamp((highRankWinrate - 0.45) / 0.25, 0, 1);

        // Combine: 50% volume, 50% performance
        // Max bonus: +50%, max penalty: -30%
        const rawExposure = 1.0 + (volumeFactor * 0.5 + performanceFactor * 0.5) * 0.5;

        difficultyExposure = clamp(rawExposure, 0.7, 1.5);
    } else if (rankedMatches.length > 20 && exposureRatio < 0.1) {
        // Has many games but rarely plays in hard lobbies: slight penalty
        difficultyExposure = 0.85;
    }

    return {
        highRankGames,
        highRankWinrate,
        exposureRatio,
        difficultyExposure
    };
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Calculate TMMR using the 3-layer system
 * 
 * TMMR = 3500 + (SkillScore × SCALE × Confidence × DifficultyExposure)
 */
export function calculateTMMR(matches: OpenDotaMatch[]): TmmrCalculationResult {
    // Filter to valid matches
    const validMatches = matches.filter(isValidMatch);

    // Count wins/losses
    const wins = validMatches.filter(m => inferWin(m)).length;
    const losses = validMatches.length - wins;
    const games = validMatches.length;
    const winrate = games > 0 ? (wins / games) * 100 : 50;

    // If not enough games, return calibrating result
    if (games < MIN_GAMES) {
        return createCalibratingResult(validMatches, wins, losses, games, winrate);
    }

    // LAYER 1: Skill Score
    const skillComponents = calculateSkillScore(validMatches, wins, games);

    // LAYER 2: Confidence
    const confidence = calculateConfidence(games);

    // LAYER 3: Difficulty Exposure
    const difficultyComponents = calculateDifficultyExposure(validMatches);

    // FINAL COMPOSITION
    // TMMR = BASE + (SkillScore × SCALE × Confidence × DifficultyExposure)
    const rawTMMR = BASE_TMMR + (
        skillComponents.skillScore *
        SKILL_SCALE *
        confidence *
        difficultyComponents.difficultyExposure
    );

    const finalTMMR = Math.round(clamp(rawTMMR, TMMR_MIN, TMMR_MAX));

    const isCalibrating = games < CALIBRATION_GAMES;

    // Build breakdown
    const breakdown: TMMRBreakdownV3 = {
        skillScore: skillComponents.skillScore,
        skillComponents,
        confidence,
        games,
        difficultyExposure: difficultyComponents.difficultyExposure,
        difficultyComponents,
        wins,
        losses,
        winrate,
        finalTMMR,
        isCalibrating
    };

    // Process matches for history (simplified - just basic info)
    const processedMatches = createProcessedMatches(validMatches);

    return {
        currentTmmr: finalTMMR,
        wins,
        losses,
        streak: 0, // Deprecated
        processedMatches,
        isCalibrating,
        confidence,
        breakdown
    };
}

/**
 * Create result for players still calibrating
 */
function createCalibratingResult(
    validMatches: OpenDotaMatch[],
    wins: number,
    losses: number,
    games: number,
    winrate: number
): TmmrCalculationResult {
    const skillComponents: SkillComponents = {
        wrReliable: 0.5,
        wrContribution: 0,
        avgKDA: KDA_CENTER,
        kdaNormalized: 1,
        kdaContribution: 0,
        avgRank: 50,
        avgRankNormalized: 1,
        rankContribution: 0,
        skillScore: 0
    };

    const difficultyComponents: DifficultyComponents = {
        highRankGames: 0,
        highRankWinrate: 0.5,
        exposureRatio: 0,
        difficultyExposure: 1.0
    };

    const breakdown: TMMRBreakdownV3 = {
        skillScore: 0,
        skillComponents,
        confidence: CONFIDENCE_MIN,
        games,
        difficultyExposure: 1.0,
        difficultyComponents,
        wins,
        losses,
        winrate,
        finalTMMR: BASE_TMMR,
        isCalibrating: true
    };

    return {
        currentTmmr: BASE_TMMR,
        wins,
        losses,
        streak: 0,
        processedMatches: [],
        isCalibrating: true,
        confidence: CONFIDENCE_MIN,
        breakdown
    };
}

/**
 * Create simplified processed matches for history display
 */
function createProcessedMatches(matches: OpenDotaMatch[]): CalculatedMatchResult[] {
    // Sort by timestamp (newest first for display)
    const sortedMatches = [...matches].sort((a, b) => b.start_time - a.start_time);

    // Only keep last 50 for display
    return sortedMatches.slice(0, 50).map(match => ({
        matchId: match.match_id,
        heroId: match.hero_id,
        win: inferWin(match),
        duration: match.duration,
        kda: `${match.kills}/${match.deaths}/${match.assists}`,
        timestamp: new Date(match.start_time * 1000),
        tmmrChange: 0, // No longer tracking per-match changes
        tmmrAfter: 0,
        skill: match.skill,
        averageRank: match.average_rank,
        difficultyWeight: 1.0
    }));
}

// ============================================
// TIER SYSTEM
// ============================================

export type TierKey =
    | 'herald1' | 'herald2' | 'herald3' | 'herald4' | 'herald5'
    | 'guardian1' | 'guardian2' | 'guardian3' | 'guardian4' | 'guardian5'
    | 'crusader1' | 'crusader2' | 'crusader3' | 'crusader4' | 'crusader5'
    | 'archon1' | 'archon2' | 'archon3' | 'archon4' | 'archon5'
    | 'legend1' | 'legend2' | 'legend3' | 'legend4' | 'legend5'
    | 'ancient1' | 'ancient2' | 'ancient3' | 'ancient4' | 'ancient5'
    | 'divine1' | 'divine2' | 'divine3' | 'divine4' | 'divine5'
    | 'immortal';

export function getTier(tmmr: number): TierKey {
    // Herald: 0-769
    if (tmmr < 154) return 'herald1';
    if (tmmr < 308) return 'herald2';
    if (tmmr < 462) return 'herald3';
    if (tmmr < 616) return 'herald4';
    if (tmmr < 770) return 'herald5';

    // Guardian: 770-1539
    if (tmmr < 924) return 'guardian1';
    if (tmmr < 1078) return 'guardian2';
    if (tmmr < 1232) return 'guardian3';
    if (tmmr < 1386) return 'guardian4';
    if (tmmr < 1540) return 'guardian5';

    // Crusader: 1540-2309
    if (tmmr < 1694) return 'crusader1';
    if (tmmr < 1848) return 'crusader2';
    if (tmmr < 2002) return 'crusader3';
    if (tmmr < 2156) return 'crusader4';
    if (tmmr < 2310) return 'crusader5';

    // Archon: 2310-3079
    if (tmmr < 2464) return 'archon1';
    if (tmmr < 2618) return 'archon2';
    if (tmmr < 2772) return 'archon3';
    if (tmmr < 2926) return 'archon4';
    if (tmmr < 3080) return 'archon5';

    // Legend: 3080-3849
    if (tmmr < 3234) return 'legend1';
    if (tmmr < 3388) return 'legend2';
    if (tmmr < 3542) return 'legend3';
    if (tmmr < 3696) return 'legend4';
    if (tmmr < 3850) return 'legend5';

    // Ancient: 3850-4619
    if (tmmr < 4004) return 'ancient1';
    if (tmmr < 4158) return 'ancient2';
    if (tmmr < 4312) return 'ancient3';
    if (tmmr < 4466) return 'ancient4';
    if (tmmr < 4620) return 'ancient5';

    // Divine: 4620-5619
    if (tmmr < 4820) return 'divine1';
    if (tmmr < 5020) return 'divine2';
    if (tmmr < 5220) return 'divine3';
    if (tmmr < 5420) return 'divine4';
    if (tmmr < 5620) return 'divine5';

    // Immortal: 5620+
    return 'immortal';
}

export function getTierCategory(tier: TierKey): string {
    if (tier.startsWith('herald')) return 'herald';
    if (tier.startsWith('guardian')) return 'guardian';
    if (tier.startsWith('crusader')) return 'crusader';
    if (tier.startsWith('archon')) return 'archon';
    if (tier.startsWith('legend')) return 'legend';
    if (tier.startsWith('ancient')) return 'ancient';
    if (tier.startsWith('divine')) return 'divine';
    return 'immortal';
}

export const TIER_NAMES: Record<TierKey, string> = {
    herald1: 'Herald I', herald2: 'Herald II', herald3: 'Herald III', herald4: 'Herald IV', herald5: 'Herald V',
    guardian1: 'Guardian I', guardian2: 'Guardian II', guardian3: 'Guardian III', guardian4: 'Guardian IV', guardian5: 'Guardian V',
    crusader1: 'Crusader I', crusader2: 'Crusader II', crusader3: 'Crusader III', crusader4: 'Crusader IV', crusader5: 'Crusader V',
    archon1: 'Archon I', archon2: 'Archon II', archon3: 'Archon III', archon4: 'Archon IV', archon5: 'Archon V',
    legend1: 'Legend I', legend2: 'Legend II', legend3: 'Legend III', legend4: 'Legend IV', legend5: 'Legend V',
    ancient1: 'Ancient I', ancient2: 'Ancient II', ancient3: 'Ancient III', ancient4: 'Ancient IV', ancient5: 'Ancient V',
    divine1: 'Divine I', divine2: 'Divine II', divine3: 'Divine III', divine4: 'Divine IV', divine5: 'Divine V',
    immortal: 'Immortal'
};
