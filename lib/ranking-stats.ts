/**
 * Multi-Ranking Stats Calculator
 * Calculates all ranking metrics from match data
 */

export interface MatchData {
    kills: number;
    deaths: number;
    assists: number;
    radiant_win: boolean;
    player_slot: number;
    average_rank?: number;
}

export interface RankingStats {
    winrate: number;
    avgKDA: number;
    kdaVariance: number;
    proGames: number;
    proWinrate: number;
    proKDA: number;
}

const PRO_RANK_THRESHOLD = 60; // Ancient tier and above

/**
 * Calculate KDA for a single match
 */
function calculateMatchKDA(match: MatchData): number {
    const k = match.kills || 0;
    const d = Math.max(1, match.deaths || 0); // Avoid division by zero
    const a = match.assists || 0;

    return (k + a * 0.7) / d;
}

/**
 * Check if player won the match
 * Note: In our Match model, radiant_win is actually stored as 'win' (boolean)
 * So we just return it directly
 */
function isWin(match: MatchData): boolean {
    // radiant_win in our case is actually the player's win status
    return match.radiant_win;
}

/**
 * Calculate variance of an array of numbers
 */
function calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate all ranking stats from matches
 */
export function calculateRankingStats(matches: MatchData[]): RankingStats {
    if (matches.length === 0) {
        return {
            winrate: 0,
            avgKDA: 0,
            kdaVariance: 0,
            proGames: 0,
            proWinrate: 0,
            proKDA: 0
        };
    }

    // Overall stats
    const kdas = matches.map(m => calculateMatchKDA(m));
    const wins = matches.filter(m => isWin(m)).length;
    const totalGames = matches.length;

    const winrate = (wins / totalGames) * 100;
    const avgKDA = kdas.reduce((sum, kda) => sum + kda, 0) / kdas.length;
    const kdaVariance = calculateVariance(kdas);

    // Pro games (average_rank >= 65)
    const proMatches = matches.filter(m =>
        m.average_rank !== undefined && m.average_rank >= PRO_RANK_THRESHOLD
    );

    const proGames = proMatches.length;
    let proWinrate = 0;
    let proKDA = 0;

    if (proGames > 0) {
        const proWins = proMatches.filter(m => isWin(m)).length;
        proWinrate = (proWins / proGames) * 100;

        const proKDAs = proMatches.map(m => calculateMatchKDA(m));
        proKDA = proKDAs.reduce((sum, kda) => sum + kda, 0) / proKDAs.length;
    }

    return {
        winrate: Math.round(winrate * 100) / 100, // 2 decimal places
        avgKDA: Math.round(avgKDA * 100) / 100,
        kdaVariance: Math.round(kdaVariance * 100) / 100,
        proGames,
        proWinrate: Math.round(proWinrate * 100) / 100,
        proKDA: Math.round(proKDA * 100) / 100
    };
}
