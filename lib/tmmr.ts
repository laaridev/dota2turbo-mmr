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

export function getTier(tmmr: number): 'bronze' | 'silver' | 'gold' | 'diamond' | 'master' | 'divine' {
    if (tmmr < 2000) return 'bronze';
    if (tmmr < 3000) return 'silver';
    if (tmmr < 4000) return 'gold';
    if (tmmr < 5000) return 'diamond';
    if (tmmr < 6000) return 'master';
    return 'divine';
}

export const TIER_NAMES: Record<string, string> = {
    bronze: 'Bronze',
    silver: 'Prata',
    gold: 'Ouro',
    diamond: 'Diamante',
    master: 'Mestre',
    divine: 'Divino'
};
