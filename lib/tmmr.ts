/**
 * TurboMMR (TMMR) Calculation System v2.0
 * 
 * A fair, robust rating system for Dota 2 Turbo mode that balances:
 * - Winrate reliability (statistical correction for small samples)
 * - Match simulation (natural MMR progression)
 * - Difficulty weighting (avg_rank, skill bracket)
 * 
 * Key principles:
 * - Consistency > Peak: 55% WR over thousands of games is valuable
 * - Small samples are volatile: 80% WR in 50 games gets low confidence
 * - Difficulty matters: winning hard games = more points
 * - No volume exploitation: 5000 games at 52% WR shouldn't explode rating
 */

import { OpenDotaMatch } from './opendota';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface TMMRBreakdown {
    // Basic stats
    wins: number;
    losses: number;
    games: number;

    // Winrate components
    wrObserved: number;      // Raw winrate
    wrReliable: number;      // Wilson lower bound adjusted

    // Difficulty stats
    avgDifficultyRank: number;
    avgDifficultySkill: number;
    difficultyMultiplier: number;

    // Component scores
    wrMMR: number;           // Winrate-based MMR
    simMMR: number;          // Simulation-based MMR

    // Final weights and result
    wrWeight: number;
    simWeight: number;
    finalTMMR: number;

    // Confidence
    confidence: number;      // 0-1, how reliable is this rating
    isCalibrating: boolean;
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

export interface TmmrCalculationResult {
    currentTmmr: number;
    wins: number;
    losses: number;
    streak: number;
    processedMatches: CalculatedMatchResult[];
    isCalibrating: boolean;
    confidence: number;
    breakdown: TMMRBreakdown;
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

// WR to MMR scale (each 1% above 50% = SCALE/100 MMR)
const WR_SCALE = 10000;  // 1% = 100 MMR

// K-factor for simulation
const K_CALIBRATION = 40;  // High K during calibration
const K_BASE = 20;         // Normal K
const K_MIN = 2;           // Minimum K (for very high volume) - prevents volume explosion
const K_DECAY_RATE = 100;  // Games at which K starts decaying (faster decay)

// Clamps
const TMMR_MIN = 500;
const TMMR_MAX = 9500;

// Component weights base - Balanced between WR and Difficulty
const WR_WEIGHT_BASE = 0.50;   // Base weight for WR component
const SIM_WEIGHT_BASE = 0.50;  // Base weight for simulation component (includes difficulty)

// Wilson score Z value (1.0 = 84% confidence, 1.65 = 95%)
const WILSON_Z = 1.0;

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
 * Calculate confidence based on sample size and WR stability
 * Returns 0-1 where 1 is fully confident
 */
function calculateConfidence(games: number, wrObserved: number): number {
    // Volume confidence: more games = more confident
    // Logarithmic scale with diminishing returns
    const volumeConf = Math.min(1, Math.log10(games + 1) / Math.log10(500));

    // WR stability: closer to 50% = potentially more stable (less extreme)
    // But very high WR with many games is also stable
    const wrDistance = Math.abs(wrObserved - 0.5);
    const wrStability = games >= 200 ? 1 : 0.7 + 0.3 * (games / 200);

    // Combined confidence
    return clamp(volumeConf * wrStability, 0, 1);
}

/**
 * Calculate K-factor based on games played
 * High K during calibration, then decays with volume
 */
function calculateK(gamesSoFar: number): number {
    if (gamesSoFar < CALIBRATION_GAMES) {
        // Calibration: high and stable K
        return K_CALIBRATION;
    }

    // Post-calibration: K decays slowly with volume
    // This prevents 5000-game accounts from exploding
    const decayFactor = Math.sqrt(K_DECAY_RATE / (gamesSoFar - CALIBRATION_GAMES + K_DECAY_RATE));
    return clamp(K_BASE * decayFactor, K_MIN, K_BASE);
}

/**
 * Calculate difficulty weight based on match data
 * Uses both average_rank and skill bracket, with fallbacks
 * IMPORTANT: This is the main differentiator in Turbo - playing hard games should be rewarded!
 */
function calculateDifficultyWeight(avgRank: number | undefined, skill: number | undefined): number {
    let rankWeight = 1.0;
    let skillWeight = 1.0;

    // Primary: average_rank (0-80 scale, 50 = Legend, 60 = Ancient, 70 = Divine)
    // AMPLIFIED bonuses for higher tiers - reward playing against strong opponents
    if (avgRank !== undefined && avgRank > 0 && avgRank <= 80) {
        if (avgRank >= 70) {
            // Divine/Immortal: +50% to +100%
            rankWeight = 1.50 + (avgRank - 70) * 0.05;
        } else if (avgRank >= 60) {
            // Ancient: +25% to +50%
            rankWeight = 1.25 + (avgRank - 60) * 0.025;
        } else if (avgRank >= 50) {
            // Legend: +15% to +25%
            rankWeight = 1.15 + (avgRank - 50) * 0.01;
        } else if (avgRank >= 40) {
            // Archon: +0% to +15%
            rankWeight = 1.0 + (avgRank - 40) * 0.015;
        } else {
            // Crusader and below: -10% to 0%
            rankWeight = 0.90 + (avgRank - 30) * 0.01;
        }
        rankWeight = clamp(rankWeight, 0.70, 2.00); // Allow up to 2x for highest difficulty
    }

    // Secondary: skill bracket (fallback when avg_rank is not available)
    if (skill !== undefined && skill >= 1 && skill <= 3) {
        const skillMap: Record<number, number> = {
            1: 0.85,  // Normal bracket = -15%
            2: 1.00,  // High bracket = neutral
            3: 1.30   // Very High = +30%
        };
        skillWeight = skillMap[skill] || 1.0;
    }

    // Combine multiplicatively, then clamp
    // Allow up to 2x for highest-tier games
    const combined = rankWeight * skillWeight;
    return clamp(combined, 0.60, 2.00);
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

// ============================================
// MAIN CALCULATION FUNCTIONS
// ============================================

/**
 * Component 1: WR-based MMR with Wilson score correction
 * This gives a conservative (reliable) winrate estimate
 */
function calculateWRComponent(wins: number, games: number): { wrObserved: number; wrReliable: number; wrMMR: number } {
    if (games === 0) {
        return { wrObserved: 0.5, wrReliable: 0.5, wrMMR: BASE_TMMR };
    }

    const wrObserved = wins / games;
    const wrReliable = wilsonLowerBound(wins, games, WILSON_Z);

    // Convert reliable WR to MMR
    // Each 1% above 50% = WR_SCALE/100 MMR
    const wrMMR = BASE_TMMR + (wrReliable - 0.50) * WR_SCALE;

    return {
        wrObserved,
        wrReliable,
        wrMMR: clamp(wrMMR, TMMR_MIN, TMMR_MAX)
    };
}

/**
 * Component 2: Simulation-based MMR
 * Processes matches chronologically like Dota's ELO system
 * But with decaying K to prevent volume exploitation
 */
function calculateSimComponent(matches: OpenDotaMatch[]): {
    simMMR: number;
    processedMatches: CalculatedMatchResult[];
    streak: number;
    difficultyStats: { avgRank: number; avgSkill: number };
} {
    let currentMMR = BASE_TMMR;
    let streak = 0;
    const processedMatches: CalculatedMatchResult[] = [];

    // For difficulty stats
    let totalRank = 0;
    let rankCount = 0;
    let totalSkill = 0;
    let skillCount = 0;

    // Sort by timestamp
    const sortedMatches = [...matches].sort((a, b) => a.start_time - b.start_time);

    for (let i = 0; i < sortedMatches.length; i++) {
        const match = sortedMatches[i];

        // Skip invalid matches
        if (!isValidMatch(match)) continue;

        const win = inferWin(match);
        const diffWeight = calculateDifficultyWeight(match.average_rank, match.skill);
        const K = calculateK(i);

        // Track difficulty stats
        if (match.average_rank && match.average_rank > 0) {
            totalRank += match.average_rank;
            rankCount++;
        }
        if (match.skill && match.skill >= 1) {
            totalSkill += match.skill;
            skillCount++;
        }

        // Calculate MMR change
        let delta = win ? K : -K;
        delta *= diffWeight;

        // Streak bonus/penalty (small, max 20% modifier)
        if (win) {
            streak = streak > 0 ? streak + 1 : 1;
            if (streak >= 3) {
                delta *= 1 + Math.min(streak - 2, 5) * 0.02; // Max +10%
            }
        } else {
            streak = streak < 0 ? streak - 1 : -1;
            if (streak <= -3) {
                delta *= 1 + Math.min(Math.abs(streak) - 2, 5) * 0.02; // Max +10% penalty
            }
        }

        const change = Math.round(delta);
        currentMMR += change;
        currentMMR = clamp(currentMMR, TMMR_MIN, TMMR_MAX);

        processedMatches.push({
            matchId: match.match_id,
            heroId: match.hero_id,
            win,
            duration: match.duration,
            kda: `${match.kills}/${match.deaths}/${match.assists}`,
            timestamp: new Date(match.start_time * 1000),
            tmmrChange: change,
            tmmrAfter: currentMMR,
            skill: match.skill,
            averageRank: match.average_rank,
            difficultyWeight: diffWeight
        });
    }

    return {
        simMMR: currentMMR,
        processedMatches,
        streak,
        difficultyStats: {
            avgRank: rankCount > 0 ? totalRank / rankCount : 50,
            avgSkill: skillCount > 0 ? totalSkill / skillCount : 2
        }
    };
}

/**
 * Calculate component weights based on data quality
 * WR component should ALWAYS dominate to ensure WR is the primary factor
 * Simulation is just for consistency/smoothing, not for exploiting volume
 */
function calculateWeights(games: number, wrObserved: number, wrReliable: number): { wrWeight: number; simWeight: number } {
    // Base: Balanced (50/50)
    let wrWeight = WR_WEIGHT_BASE;
    let simWeight = SIM_WEIGHT_BASE;

    // For extreme WR, slightly increase WR weight (but not as much as before)
    const wrDistance = Math.abs(wrObserved - 0.5);
    if (wrDistance > 0.15) { // More than 65% or less than 35% WR
        wrWeight = 0.60;
        simWeight = 0.40;
    }

    // For very high volume (1000+), slightly favor WR to prevent infinite grinding
    if (games >= 1000) {
        wrWeight = Math.min(wrWeight + 0.10, 0.65);
        simWeight = 1 - wrWeight;
    }

    // Few games: WR component dominates even more (Wilson already penalizes)
    if (games < 100) {
        wrWeight = 0.85;
        simWeight = 0.15;
    }

    // Normalize
    const total = wrWeight + simWeight;
    wrWeight /= total;
    simWeight /= total;

    return { wrWeight, simWeight };
}

// ============================================
// MAIN EXPORT FUNCTION
// ============================================

export function calculateTMMR(matches: OpenDotaMatch[]): TmmrCalculationResult {
    // Filter to valid matches
    const validMatches = matches.filter(isValidMatch);

    // If not enough games, return minimal result
    if (validMatches.length < MIN_GAMES) {
        return {
            currentTmmr: BASE_TMMR,
            wins: validMatches.filter(m => inferWin(m)).length,
            losses: validMatches.filter(m => !inferWin(m)).length,
            streak: 0,
            processedMatches: [],
            isCalibrating: true,
            confidence: 0.1,
            breakdown: {
                wins: validMatches.filter(m => inferWin(m)).length,
                losses: validMatches.filter(m => !inferWin(m)).length,
                games: validMatches.length,
                wrObserved: 0.5,
                wrReliable: 0.5,
                avgDifficultyRank: 50,
                avgDifficultySkill: 2,
                difficultyMultiplier: 1,
                wrMMR: BASE_TMMR,
                simMMR: BASE_TMMR,
                wrWeight: 0.5,
                simWeight: 0.5,
                finalTMMR: BASE_TMMR,
                confidence: 0.1,
                isCalibrating: true
            }
        };
    }

    // Count wins/losses
    const wins = validMatches.filter(m => inferWin(m)).length;
    const losses = validMatches.length - wins;
    const games = validMatches.length;

    // Component 1: WR-based
    const wrComponent = calculateWRComponent(wins, games);

    // Component 2: Simulation-based
    const simComponent = calculateSimComponent(validMatches);

    // Calculate overall difficulty multiplier
    const avgDiffMultiplier = calculateDifficultyWeight(
        simComponent.difficultyStats.avgRank,
        Math.round(simComponent.difficultyStats.avgSkill)
    );

    // Get weights
    const weights = calculateWeights(games, wrComponent.wrObserved, wrComponent.wrReliable);

    // Blend components
    let blendedMMR = (wrComponent.wrMMR * weights.wrWeight) + (simComponent.simMMR * weights.simWeight);

    // Apply difficulty multiplier to the deviation from base
    // This ensures high-difficulty players get a bonus, low-difficulty get penalty
    const deviation = blendedMMR - BASE_TMMR;
    const adjustedDeviation = deviation * avgDiffMultiplier;
    blendedMMR = BASE_TMMR + adjustedDeviation;

    // Final clamp
    const finalTMMR = Math.round(clamp(blendedMMR, TMMR_MIN, TMMR_MAX));

    // Calculate confidence
    const confidence = calculateConfidence(games, wrComponent.wrObserved);
    const isCalibrating = games < CALIBRATION_GAMES;

    // Build breakdown
    const breakdown: TMMRBreakdown = {
        wins,
        losses,
        games,
        wrObserved: wrComponent.wrObserved,
        wrReliable: wrComponent.wrReliable,
        avgDifficultyRank: simComponent.difficultyStats.avgRank,
        avgDifficultySkill: simComponent.difficultyStats.avgSkill,
        difficultyMultiplier: avgDiffMultiplier,
        wrMMR: wrComponent.wrMMR,
        simMMR: simComponent.simMMR,
        wrWeight: weights.wrWeight,
        simWeight: weights.simWeight,
        finalTMMR,
        confidence,
        isCalibrating
    };

    return {
        currentTmmr: finalTMMR,
        wins,
        losses,
        streak: simComponent.streak,
        processedMatches: simComponent.processedMatches,
        isCalibrating,
        confidence,
        breakdown
    };
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
