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
// Sem caps artificiais - desaceleração natural
// ============================================

// Constants
const BASE_TMMR = 2000;
const K_BASE_MIN = 10;
const K_BASE_MAX = 30;
const K_CALIBRATION_MAX = 40;
const CALIBRATION_MATCHES = 50;
const CONFIDENCE_MAX_MATCHES = 300;
const CONFIDENCE_MIN = 0.2;

/**
 * Clamps a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Calculates confidence factor based on match count
 * confidence = clamp(partidas / 300, 0.2, 1)
 * More matches = higher confidence = less volatility
 */
function calculateConfidence(matchCount: number): number {
    return clamp(matchCount / CONFIDENCE_MAX_MATCHES, CONFIDENCE_MIN, 1);
}

/**
 * Calculates K factor for a given match
 * K = Kmax - (confidence × (Kmax - K_BASE_MIN))
 * During calibration (< 50 matches): Kmax = 40
 * After calibration: Kmax = 30
 */
function calculateKFactor(matchCount: number, confidence: number): number {
    const isCalibrating = matchCount < CALIBRATION_MATCHES;
    const Kmax = isCalibrating ? K_CALIBRATION_MAX : K_BASE_MAX;

    // K = Kmax - (confidence × (Kmax - K_BASE_MIN))
    const K = Kmax - (confidence * (Kmax - K_BASE_MIN));

    return K;
}

/**
 * Calculates difficulty weight based on average match rank tier
 * tierWeight = clamp(1 + (avg_rank_tier - 50) × 0.01, 0.85, 1.15)
 * Normalized around tier 50, with soft scaling ±15%
 */
function calculateDifficultyWeight(averageRank: number | undefined): number {
    // If no rank data, use neutral weight
    if (!averageRank || averageRank <= 0 || averageRank > 80) {
        return 1.0;
    }

    // tierWeight = 1 + (avg_rank_tier - 50) × 0.01
    // Clamped to range [0.85, 1.15]
    const weight = 1 + (averageRank - 50) * 0.01;

    return clamp(weight, 0.85, 1.15);
}

/**
 * Main TurboMMR calculation function
 * Processes matches chronologically and calculates MMR per-match
 * No artificial caps - natural stabilization via K dynamic and confidence
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

        // Calculate delta: (±K) × confidence × tierWeight
        let delta = playerWon ? K : -K;
        delta *= confidence;
        delta *= difficultyWeight;

        // Round to integer
        const tmmrChange = Math.round(delta);

        // Update TMMR (no caps, natural progression)
        currentTmmr += tmmrChange;

        // Ensure TMMR doesn't go below 0
        if (currentTmmr < 0) currentTmmr = 0;

        // Update win/loss counters
        if (playerWon) {
            wins++;
            currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
        } else {
            losses++;
            currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
        }

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
