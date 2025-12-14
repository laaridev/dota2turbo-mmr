import { OpenDotaMatch } from './opendota';

export interface CalculatedMatchResult {
    matchId: number;
    heroId: number;
    win: boolean;
    duration: number;
    kda: string;
    timestamp: Date;
    tmmrChange: number;
    tmmrAfter: number;
}

export interface TmmrCalculationResult {
    currentTmmr: number;
    wins: number;
    losses: number;
    streak: number;
    processedMatches: CalculatedMatchResult[];
    isCalibrating: boolean;
    confidence: number;
}

// ============================================
// TURBOMMR CALCULATION SYSTEM (Dota-like)
// ============================================

// Constants
const BASE_TMMR = 2000;
const K_BASE_MIN = 10;
const K_BASE_MAX = 30;
const K_CALIBRATION_MAX = 40;
const CALIBRATION_MATCHES = 50;
const CONFIDENCE_MAX_MATCHES = 300;
const CONFIDENCE_MIN = 0.2;
const SOFT_CAP_THRESHOLD = 3500;
const SOFT_CAP_REDUCTION = 0.5;
const LOW_WINRATE_CAP = 2600;
const LOW_WINRATE_THRESHOLD = 0.48;
const TMMR_FLOOR = 1000;
const TMMR_CEILING = 6000;

/**
 * Clamps a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Calculates confidence factor based on match count
 * More matches = higher confidence = less volatility
 */
function calculateConfidence(matchCount: number): number {
    return clamp(matchCount / CONFIDENCE_MAX_MATCHES, CONFIDENCE_MIN, 1);
}

/**
 * Calculates K factor for a given match
 * During calibration (< 50 matches): K ranges from 40 to 10
 * After calibration: K ranges from 30 to 10
 */
function calculateKFactor(matchCount: number, confidence: number): number {
    const isCalibrating = matchCount < CALIBRATION_MATCHES;
    const Kmax = isCalibrating ? K_CALIBRATION_MAX : K_BASE_MAX;

    // K = Kmax - (confidence × (Kmax - K_BASE_MIN))
    // New accounts: high K (volatile), old accounts: low K (stable)
    const K = Kmax - (confidence * (Kmax - K_BASE_MIN));

    return K;
}

/**
 * Calculates difficulty weight based on average match rank tier
 * Normalized around 50, with soft scaling ±15%
 */
function calculateDifficultyWeight(averageRank: number | undefined): number {
    // If no rank data, use neutral weight
    if (!averageRank || averageRank <= 0 || averageRank > 80) {
        return 1.0;
    }

    // Normalize around tier 50 (Legend 5 / Ancient 1 area)
    // Weight = 1 + (avgRank - 50) × 0.01
    // Results in range: 0.85 (rank 35) to 1.15 (rank 65) approximately
    const weight = 1 + (averageRank - 50) * 0.01;

    return clamp(weight, 0.85, 1.15);
}

/**
 * Applies soft cap reduction for high MMR players
 */
function applySoftCap(tmmr: number, delta: number): number {
    if (tmmr > SOFT_CAP_THRESHOLD && delta > 0) {
        return delta * SOFT_CAP_REDUCTION;
    }
    return delta;
}

/**
 * Applies winrate-based cap for players with < 48% winrate
 */
function applyWinrateCap(tmmr: number, wins: number, losses: number): number {
    const totalGames = wins + losses;
    if (totalGames < 20) return tmmr; // Not enough data

    const winrate = wins / totalGames;
    if (winrate < LOW_WINRATE_THRESHOLD && tmmr > LOW_WINRATE_CAP) {
        return LOW_WINRATE_CAP;
    }
    return tmmr;
}

/**
 * Main TurboMMR calculation function
 * Processes matches chronologically and calculates MMR per-match
 */
export function calculateTMMR(matches: OpenDotaMatch[]): TmmrCalculationResult {
    // Sort matches by start_time ascending (oldest → newest)
    const sortedMatches = [...matches].sort((a, b) => a.start_time - b.start_time);

    let currentTmmr = BASE_TMMR;
    let wins = 0;
    let losses = 0;
    let currentStreak = 0;

    const processedMatches: CalculatedMatchResult[] = [];

    for (let i = 0; i < sortedMatches.length; i++) {
        const match = sortedMatches[i];
        const matchNumber = i + 1;

        // Determine win/loss
        const isRadiant = match.player_slot < 128;
        const playerWon = (isRadiant && match.radiant_win) || (!isRadiant && !match.radiant_win);

        // Calculate confidence at this point in history
        const confidence = calculateConfidence(matchNumber);

        // Calculate dynamic K factor
        const K = calculateKFactor(matchNumber, confidence);

        // Calculate difficulty weight
        const difficultyWeight = calculateDifficultyWeight(match.average_rank);

        // Calculate base delta
        let delta = playerWon ? K : -K;

        // Apply difficulty weight
        delta *= difficultyWeight;

        // Apply soft cap for high MMR gains
        delta = applySoftCap(currentTmmr, delta);

        // Round to integer
        const tmmrChange = Math.round(delta);

        // Update TMMR
        currentTmmr += tmmrChange;

        // Update win/loss counters
        if (playerWon) {
            wins++;
            currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
        } else {
            losses++;
            currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
        }

        // Apply winrate cap after each match
        currentTmmr = applyWinrateCap(currentTmmr, wins, losses);

        // Apply global clamp
        currentTmmr = clamp(currentTmmr, TMMR_FLOOR, TMMR_CEILING);

        // Record processed match
        processedMatches.push({
            matchId: match.match_id,
            heroId: match.hero_id,
            win: playerWon,
            duration: match.duration,
            kda: `${match.kills}/${match.deaths}/${match.assists}`,
            timestamp: new Date(match.start_time * 1000),
            tmmrChange,
            tmmrAfter: currentTmmr
        });
    }

    // Final winrate cap check
    currentTmmr = applyWinrateCap(currentTmmr, wins, losses);
    currentTmmr = clamp(currentTmmr, TMMR_FLOOR, TMMR_CEILING);

    const totalMatches = wins + losses;

    return {
        currentTmmr: Math.round(currentTmmr),
        wins,
        losses,
        streak: currentStreak,
        processedMatches,
        isCalibrating: totalMatches < CALIBRATION_MATCHES,
        confidence: calculateConfidence(totalMatches)
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

// Tier base category (for badge styling)
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
    herald1: 'Herald 1',
    herald2: 'Herald 2',
    herald3: 'Herald 3',
    herald4: 'Herald 4',
    herald5: 'Herald 5',
    guardian1: 'Guardian 1',
    guardian2: 'Guardian 2',
    guardian3: 'Guardian 3',
    guardian4: 'Guardian 4',
    guardian5: 'Guardian 5',
    crusader1: 'Crusader 1',
    crusader2: 'Crusader 2',
    crusader3: 'Crusader 3',
    crusader4: 'Crusader 4',
    crusader5: 'Crusader 5',
    archon1: 'Archon 1',
    archon2: 'Archon 2',
    archon3: 'Archon 3',
    archon4: 'Archon 4',
    archon5: 'Archon 5',
    legend1: 'Legend 1',
    legend2: 'Legend 2',
    legend3: 'Legend 3',
    legend4: 'Legend 4',
    legend5: 'Legend 5',
    ancient1: 'Ancient 1',
    ancient2: 'Ancient 2',
    ancient3: 'Ancient 3',
    ancient4: 'Ancient 4',
    ancient5: 'Ancient 5',
    divine1: 'Divine 1',
    divine2: 'Divine 2',
    divine3: 'Divine 3',
    divine4: 'Divine 4',
    divine5: 'Divine 5',
    immortal: 'Immortal'
};
