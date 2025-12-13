import { OpenDotaMatch } from './opendota';

export interface CalculatedMatchResult {
    matchId: number;
    heroId: number;
    win: boolean;
    duration: number;
    kda: string;
    timestamp: Date;
    tmmrChange: number;
}

export interface TmmrCalculationResult {
    currentTmmr: number;
    wins: number;
    losses: number;
    streak: number;
    processedMatches: CalculatedMatchResult[];
}

const BASE_TMMR = 2000;
const MIN_CHANGE = 25;
const MAX_CHANGE = 30;

function getRandomChange() {
    return Math.floor(Math.random() * (MAX_CHANGE - MIN_CHANGE + 1)) + MIN_CHANGE;
}

/**
 * Calculates TMMR history from a list of matches.
 * Matches should be passed in descending order (newest first) or ascending (oldest first).
 * We will sort them ascending to calculate progression.
 */
export function calculateTMMR(matches: OpenDotaMatch[]): TmmrCalculationResult {
    // 1. Sort matches by start_time ascending (Oldest -> Newest)
    const sortedMatches = [...matches].sort((a, b) => a.start_time - b.start_time);

    let currentTmmr = BASE_TMMR;
    let wins = 0;
    let losses = 0;
    let currentStreak = 0;

    const processedMatches: CalculatedMatchResult[] = [];

    for (const match of sortedMatches) {
        // Determine win
        // Player slot 0-127 is Radiant, 128-255 is Dire
        const isRadiant = match.player_slot < 128;
        const playerWon = (isRadiant && match.radiant_win) || (!isRadiant && !match.radiant_win);

        // Calculate change
        const delta = getRandomChange();
        const tmmrChange = playerWon ? delta : -delta;

        // Update stats
        currentTmmr += tmmrChange;
        if (playerWon) {
            wins++;
            currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
        } else {
            losses++;
            currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
        }

        processedMatches.push({
            matchId: match.match_id,
            heroId: match.hero_id,
            win: playerWon,
            duration: match.duration,
            kda: `${match.kills}/${match.deaths}/${match.assists}`,
            timestamp: new Date(match.start_time * 1000),
            tmmrChange
        });
    }

    return {
        currentTmmr,
        wins,
        losses,
        streak: currentStreak,
        processedMatches
    };
}

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
    // Herald: 1-769
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

    // Divine: 4620-5620
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
