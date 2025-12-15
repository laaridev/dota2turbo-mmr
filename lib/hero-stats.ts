/**
 * Calculate best hero stats for a player
 * Returns hero with highest winrate (minimum 10 games)
 */

interface MatchData {
    heroId: number;
    win: boolean;
}

interface HeroStats {
    heroId: number;
    games: number;
    wins: number;
    winrate: number;
}

interface BestHeroResult {
    bestHeroId: number;
    bestHeroGames: number;
    bestHeroWinrate: number;
}

const MIN_HERO_GAMES = 10; // Minimum games to qualify as "best hero"

export function calculateBestHero(matches: MatchData[]): BestHeroResult {
    if (matches.length === 0) {
        return {
            bestHeroId: 0,
            bestHeroGames: 0,
            bestHeroWinrate: 0
        };
    }

    // Group matches by hero
    const heroMap = new Map<number, { wins: number; games: number }>();

    for (const match of matches) {
        if (!match.heroId) continue;

        const stats = heroMap.get(match.heroId) || { wins: 0, games: 0 };
        stats.games++;
        if (match.win) stats.wins++;
        heroMap.set(match.heroId, stats);
    }

    // Calculate winrates and filter by minimum games
    const heroStats: HeroStats[] = [];
    for (const [heroId, stats] of heroMap.entries()) {
        if (stats.games >= MIN_HERO_GAMES) {
            heroStats.push({
                heroId,
                games: stats.games,
                wins: stats.wins,
                winrate: (stats.wins / stats.games) * 100
            });
        }
    }

    // No hero with minimum games
    if (heroStats.length === 0) {
        return {
            bestHeroId: 0,
            bestHeroGames: 0,
            bestHeroWinrate: 0
        };
    }

    // Sort by winrate (descending), then by games (descending) as tiebreaker
    heroStats.sort((a, b) => {
        if (Math.abs(a.winrate - b.winrate) < 0.1) {
            return b.games - a.games; // More games if winrate is equal
        }
        return b.winrate - a.winrate;
    });

    const best = heroStats[0];
    return {
        bestHeroId: best.heroId,
        bestHeroGames: best.games,
        bestHeroWinrate: parseFloat(best.winrate.toFixed(2))
    };
}
