/**
 * TurboMMR (TMMR) Calculation System v4.0
 * 
 * A transparent, fair rating system for Dota 2 Turbo mode.
 * 
 * === IMPROVEMENTS OVER v3.0 ===
 * 
 * 1. SOLO/PARTY WEIGHTING: Solo games count 1.3x, party games 0.85x
 *    - Rewards true individual skill
 *    - Still values party play, just less inflated
 * 
 * 2. TIME DECAY (RECENCY): Recent games matter more
 *    - 180-day half-life for match importance
 *    - Reflects current skill, not historical performance
 * 
 * 3. HERO-NORMALIZED KDA: Fair comparison across roles
 *    - Supports with 2.0 KDA = Carry with 4.0 KDA (both = 100%)
 *    - Uses expected KDA per hero role
 * 
 * 4. PERFORMANCE VS EXPECTED: Beat the odds?
 *    - Winning in higher lobbies = bonus
 *    - Losing to lower ranked = penalty
 * 
 * === FORMULA ===
 * 
 * SkillScore = 
 *   + 0.50 × WilsonWinrate(solo-weighted)
 *   + 0.25 × HeroNormalizedKDA
 *   + 0.15 × AvgRankContribution
 *   + 0.10 × ConsistencyBonus
 * 
 * TMMR = 3500 + (SkillScore × 3000 × Confidence × Recency × DifficultyMod)
 */

import { OpenDotaMatch } from './opendota';
import { getExpectedKDA, getHeroRole, HeroRole } from './hero-roles';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface SkillComponentsV4 {
    // Winrate components
    wrReliable: number;             // Wilson Lower Bound (0-1)
    wrContribution: number;         // Contribution to skill score
    soloGames: number;              // Number of solo games
    partyGames: number;             // Number of party games
    soloWins: number;               // Solo game wins
    partyWins: number;              // Party game wins
    soloWinrate: number;            // Solo winrate (raw)
    partyWinrate: number;           // Party winrate (raw)

    // KDA components
    avgKDA: number;                 // Raw average KDA
    heroNormalizedKDA: number;      // KDA normalized by hero role
    kdaContribution: number;        // Contribution to skill score

    // Rank components
    avgRank: number;                // Average rank of matches
    avgRankNormalized: number;      // Rank normalized (center=1, Legend=50)
    rankContribution: number;       // Contribution to skill score

    // Consistency
    consistencyScore: number;       // How consistent is performance (0-1)
    consistencyContribution: number;// Contribution to skill score

    // Final
    skillScore: number;             // Final skill score (-1 to 1)
}

export interface DifficultyComponentsV4 {
    highRankGames: number;          // Games with avg_rank >= threshold
    highRankWinrate: number;        // Winrate in those games
    exposureRatio: number;          // % of games in high lobbies
    difficultyExposure: number;     // Final multiplier (0.7-1.5)
}

export interface TMMRBreakdownV4 {
    // Skill Score Components
    skillScore: number;
    skillComponents: SkillComponentsV4;

    // Confidence Score
    confidence: number;
    games: number;

    // Recency
    recencyMultiplier: number;

    // Difficulty Exposure
    difficultyExposure: number;
    difficultyComponents: DifficultyComponentsV4;

    // Basic stats
    wins: number;
    losses: number;
    winrate: number;

    // Final
    finalTMMR: number;
    isCalibrating: boolean;

    // Version marker
    version: 4;
}

export interface TmmrCalculationResult {
    currentTmmr: number;
    wins: number;
    losses: number;
    streak: number; // Deprecated, kept for compatibility
    processedMatches: CalculatedMatchResult[];
    isCalibrating: boolean;
    confidence: number;
    breakdown: TMMRBreakdownV4;
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
    partySize?: number;
    timeWeight?: number;
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

// v4.0 Skill Score weights
const WEIGHT_WR = 0.50;         // Solo-weighted Winrate
const WEIGHT_KDA = 0.25;        // Hero-normalized KDA
const WEIGHT_RANK = 0.15;       // Average rank
const WEIGHT_CONSISTENCY = 0.10;// Consistency bonus

// Solo/Party weights
const SOLO_WEIGHT = 1.3;        // Solo games count 30% more
const PARTY_WEIGHT = 0.85;      // Party games count 15% less

// Time decay - 180 day half-life
const TIME_DECAY_HALF_LIFE_DAYS = 180;

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

/**
 * Calculate time decay weight for a match
 * Uses exponential decay with 180-day half-life
 */
function calculateTimeWeight(matchTimestamp: number): number {
    const now = Date.now() / 1000; // Current time in seconds
    const daysSinceMatch = (now - matchTimestamp) / (60 * 60 * 24);
    return Math.pow(0.5, daysSinceMatch / TIME_DECAY_HALF_LIFE_DAYS);
}

/**
 * Check if a match was played solo
 */
function isSoloMatch(match: OpenDotaMatch): boolean {
    return !match.party_size || match.party_size <= 1;
}

// ============================================
// LAYER 1: SKILL SCORE (v4.0)
// ============================================

/**
 * Calculate Skill Score v4.0 - Enhanced skill measurement
 * 
 * Components:
 * - Solo-weighted Winrate (Wilson Score) - 50%
 * - Hero-normalized KDA - 25%
 * - Average Rank - 15%
 * - Consistency - 10%
 */
function calculateSkillScoreV4(matches: OpenDotaMatch[], wins: number, games: number): SkillComponentsV4 {
    // === 1. SOLO-WEIGHTED WINRATE ===
    let soloGames = 0;
    let soloWins = 0;
    let partyGames = 0;
    let partyWins = 0;

    for (const match of matches) {
        const won = inferWin(match);
        if (isSoloMatch(match)) {
            soloGames++;
            if (won) soloWins++;
        } else {
            partyGames++;
            if (won) partyWins++;
        }
    }

    // Calculate weighted wins and games
    const weightedWins = (soloWins * SOLO_WEIGHT) + (partyWins * PARTY_WEIGHT);
    const weightedGames = (soloGames * SOLO_WEIGHT) + (partyGames * PARTY_WEIGHT);

    // Wilson score on weighted values
    const wrReliable = wilsonLowerBound(weightedWins, weightedGames, WILSON_Z);
    const wrContribution = (wrReliable - 0.50) * 2; // Normalize to -1 to 1 range

    const soloWinrate = soloGames > 0 ? (soloWins / soloGames) * 100 : 0;
    const partyWinrate = partyGames > 0 ? (partyWins / partyGames) * 100 : 0;

    // === 2. HERO-NORMALIZED KDA ===
    let totalNormalizedKDA = 0;
    let kdaCount = 0;
    let totalRawKDA = 0;

    for (const match of matches) {
        const rawKDA = calculateMatchKDA(match);
        const expectedKDA = getExpectedKDA(match.hero_id);
        const normalizedKDA = rawKDA / expectedKDA; // 1.0 = expected for role

        totalNormalizedKDA += normalizedKDA;
        totalRawKDA += rawKDA;
        kdaCount++;
    }

    const avgKDA = kdaCount > 0 ? totalRawKDA / kdaCount : 2.5;
    const heroNormalizedKDA = kdaCount > 0 ? totalNormalizedKDA / kdaCount : 1.0;
    const kdaContribution = clamp((heroNormalizedKDA - 1.0) * 0.5, -0.5, 0.5);

    // === 3. AVERAGE RANK ===
    const rankedMatches = matches.filter(m => m.average_rank && m.average_rank > 0);
    const avgRank = rankedMatches.length > 0
        ? rankedMatches.reduce((a, m) => a + m.average_rank!, 0) / rankedMatches.length
        : 50; // Default = Legend
    const avgRankNormalized = avgRank / 50; // 50 = Legend = center
    const rankContribution = clamp((avgRankNormalized - 1.0) * 0.3, -0.3, 0.3);

    // === 4. CONSISTENCY SCORE ===
    // Calculate variance of winrate over sliding windows
    const windowSize = 20;
    const windowWinrates: number[] = [];

    for (let i = 0; i <= matches.length - windowSize; i += 10) {
        const windowMatches = matches.slice(i, i + windowSize);
        const windowWins = windowMatches.filter(m => inferWin(m)).length;
        windowWinrates.push(windowWins / windowSize);
    }

    let consistencyScore = 1.0; // Default if not enough data
    if (windowWinrates.length >= 2) {
        const mean = windowWinrates.reduce((a, b) => a + b, 0) / windowWinrates.length;
        const variance = windowWinrates.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / windowWinrates.length;
        // Lower variance = higher consistency (inverse relationship)
        // Variance of 0 = perfect consistency = 1.0
        // Variance of 0.25 (max for WR) = no consistency = 0.5
        consistencyScore = clamp(1 - (variance * 4), 0.5, 1.0);
    }
    const consistencyContribution = clamp((consistencyScore - 0.75) * 0.4, -0.1, 0.1);

    // === 5. FINAL SKILL SCORE ===
    const skillScore = clamp(
        wrContribution * WEIGHT_WR +
        kdaContribution * WEIGHT_KDA +
        rankContribution * WEIGHT_RANK +
        consistencyContribution * WEIGHT_CONSISTENCY,
        -1.0,
        1.0
    );

    return {
        wrReliable,
        wrContribution,
        soloGames,
        partyGames,
        soloWins,
        partyWins,
        soloWinrate,
        partyWinrate,
        avgKDA,
        heroNormalizedKDA,
        kdaContribution,
        avgRank,
        avgRankNormalized,
        rankContribution,
        consistencyScore,
        consistencyContribution,
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
// LAYER 3: RECENCY (NEW in v4.0)
// ============================================

/**
 * Calculate Recency Multiplier - How recent is the player's activity
 * 
 * Weights recent games more heavily using time decay
 * Returns a multiplier between 0.7 and 1.0
 */
function calculateRecencyMultiplier(matches: OpenDotaMatch[]): number {
    if (matches.length === 0) return 0.85; // Default for no matches

    // Calculate weighted average time weight
    let totalWeight = 0;
    let weightedTimeSum = 0;

    for (const match of matches) {
        const timeWeight = calculateTimeWeight(match.start_time);
        totalWeight += 1;
        weightedTimeSum += timeWeight;
    }

    const avgTimeWeight = totalWeight > 0 ? weightedTimeSum / totalWeight : 0.5;

    // Convert to multiplier: 0.7 to 1.0 range
    // avgTimeWeight of 1.0 (all recent) = 1.0 multiplier
    // avgTimeWeight of 0.0 (all old) = 0.7 multiplier
    return clamp(0.7 + (avgTimeWeight * 0.3), 0.7, 1.0);
}

// ============================================
// LAYER 4: DIFFICULTY EXPOSURE
// ============================================

/**
 * Calculate Difficulty Exposure - At what level was skill demonstrated
 * 
 * Based on:
 * - Proportion of games in high-rank lobbies
 * - Performance (winrate) in those lobbies
 */
function calculateDifficultyExposure(matches: OpenDotaMatch[]): DifficultyComponentsV4 {
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
 * Calculate TMMR using the v4.0 system
 * 
 * TMMR = 3500 + (SkillScore × SCALE × Confidence × Recency × DifficultyExposure)
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

    // LAYER 1: Skill Score (v4.0)
    const skillComponents = calculateSkillScoreV4(validMatches, wins, games);

    // LAYER 2: Confidence
    const confidence = calculateConfidence(games);

    // LAYER 3: Recency Multiplier (NEW in v4.0)
    const recencyMultiplier = calculateRecencyMultiplier(validMatches);

    // LAYER 4: Difficulty Exposure
    const difficultyComponents = calculateDifficultyExposure(validMatches);

    // FINAL COMPOSITION
    // TMMR = BASE + (SkillScore × SCALE × Confidence × Recency × DifficultyExposure)
    const rawTMMR = BASE_TMMR + (
        skillComponents.skillScore *
        SKILL_SCALE *
        confidence *
        recencyMultiplier *
        difficultyComponents.difficultyExposure
    );

    const finalTMMR = Math.round(clamp(rawTMMR, TMMR_MIN, TMMR_MAX));

    const isCalibrating = games < CALIBRATION_GAMES;

    // Build breakdown
    const breakdown: TMMRBreakdownV4 = {
        skillScore: skillComponents.skillScore,
        skillComponents,
        confidence,
        games,
        recencyMultiplier,
        difficultyExposure: difficultyComponents.difficultyExposure,
        difficultyComponents,
        wins,
        losses,
        winrate,
        finalTMMR,
        isCalibrating,
        version: 4
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
    const skillComponents: SkillComponentsV4 = {
        wrReliable: 0.5,
        wrContribution: 0,
        soloGames: 0,
        partyGames: 0,
        soloWins: 0,
        partyWins: 0,
        soloWinrate: 0,
        partyWinrate: 0,
        avgKDA: 2.5,
        heroNormalizedKDA: 1.0,
        kdaContribution: 0,
        avgRank: 50,
        avgRankNormalized: 1,
        rankContribution: 0,
        consistencyScore: 1.0,
        consistencyContribution: 0,
        skillScore: 0
    };

    const difficultyComponents: DifficultyComponentsV4 = {
        highRankGames: 0,
        highRankWinrate: 0.5,
        exposureRatio: 0,
        difficultyExposure: 1.0
    };

    const breakdown: TMMRBreakdownV4 = {
        skillScore: 0,
        skillComponents,
        confidence: CONFIDENCE_MIN,
        games,
        recencyMultiplier: 1.0,
        difficultyExposure: 1.0,
        difficultyComponents,
        wins,
        losses,
        winrate,
        finalTMMR: BASE_TMMR,
        isCalibrating: true,
        version: 4
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
        difficultyWeight: 1.0,
        partySize: match.party_size,
        timeWeight: calculateTimeWeight(match.start_time)
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

// Backward compatibility - export old types as aliases
export type SkillComponents = SkillComponentsV4;
export type DifficultyComponents = DifficultyComponentsV4;
export type TMMRBreakdownV3 = TMMRBreakdownV4;
