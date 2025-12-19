import { NextResponse } from 'next/server';
import { opendota } from '@/lib/opendota';

// Rank multiplier from TMMR v5.2
function getRankMultiplier(rank: number): number {
    const r = Math.max(10, Math.min(85, rank));
    return Math.pow(1.02, r - 50);
}

function getRankTier(rank: number): string {
    if (rank < 10) return 'Herald';
    if (rank < 20) return 'Guardian';
    if (rank < 30) return 'Crusader';
    if (rank < 40) return 'Archon';
    if (rank < 50) return 'Legend';
    if (rank < 60) return 'Ancient';
    if (rank < 70) return 'Divine';
    return 'Immortal';
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const accountId = opendota.steamId64to32(id);
        console.log(`[Matches API] Fetching from OpenDota for: ${accountId}`);

        const matches = await opendota.getPlayerMatches(accountId);

        if (!matches || matches.length === 0) {
            console.log(`[Matches API] No matches found`);
            return NextResponse.json({
                heroStats: [],
                performance: { avgKDA: '0/0/0', avgDuration: 0, positiveKDA: 0 },
                recentMatches: [],
                dailyStats: [],
                rankDistribution: [],
                tmmrBreakdown: null,
                totalMatches: 0,
            });
        }

        console.log(`[Matches API] Found ${matches.length} matches from OpenDota`);

        const validMatches = matches.filter(m => m.duration >= 480 && (!m.leaver_status || m.leaver_status <= 1));

        // ============================================
        // HERO STATS
        // ============================================
        const heroMap = new Map<number, { games: number; wins: number; kills: number; deaths: number; assists: number; totalDuration: number }>();

        for (const match of validMatches) {
            const existing = heroMap.get(match.hero_id) || { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, totalDuration: 0 };
            const isWin = (match.player_slot < 128) === match.radiant_win;

            heroMap.set(match.hero_id, {
                games: existing.games + 1,
                wins: existing.wins + (isWin ? 1 : 0),
                kills: existing.kills + (match.kills || 0),
                deaths: existing.deaths + (match.deaths || 0),
                assists: existing.assists + (match.assists || 0),
                totalDuration: existing.totalDuration + match.duration,
            });
        }

        const heroStats = Array.from(heroMap.entries())
            .map(([heroId, stats]) => ({
                heroId,
                games: stats.games,
                wins: stats.wins,
                winrate: Math.round((stats.wins / stats.games) * 100),
                avgKDA: `${(stats.kills / stats.games).toFixed(1)}/${(stats.deaths / stats.games).toFixed(1)}/${(stats.assists / stats.games).toFixed(1)}`,
            }))
            .sort((a, b) => b.games - a.games)
            .slice(0, 10);

        // ============================================
        // RANK DISTRIBUTION & TMMR BREAKDOWN
        // ============================================
        const rankTiers = {
            'Herald': { games: 0, wins: 0, losses: 0, points: 0 },
            'Guardian': { games: 0, wins: 0, losses: 0, points: 0 },
            'Crusader': { games: 0, wins: 0, losses: 0, points: 0 },
            'Archon': { games: 0, wins: 0, losses: 0, points: 0 },
            'Legend': { games: 0, wins: 0, losses: 0, points: 0 },
            'Ancient': { games: 0, wins: 0, losses: 0, points: 0 },
            'Divine': { games: 0, wins: 0, losses: 0, points: 0 },
            'Immortal': { games: 0, wins: 0, losses: 0, points: 0 },
        };

        let totalWeightedWins = 0;
        let totalGamesWithRank = 0;
        let totalWins = 0;
        let avgRankSum = 0;

        for (const match of validMatches) {
            const isWin = (match.player_slot < 128) === match.radiant_win;
            const rank = match.average_rank || 50;
            const tier = getRankTier(rank);
            const multiplier = getRankMultiplier(rank);

            if (match.average_rank && match.average_rank > 0) {
                rankTiers[tier as keyof typeof rankTiers].games++;
                if (isWin) {
                    rankTiers[tier as keyof typeof rankTiers].wins++;
                    rankTiers[tier as keyof typeof rankTiers].points += multiplier;
                } else {
                    rankTiers[tier as keyof typeof rankTiers].losses++;
                }
                totalGamesWithRank++;
                avgRankSum += match.average_rank;
            }

            if (isWin) {
                totalWins++;
                totalWeightedWins += multiplier;
            }
        }

        // Convert to array for frontend
        const rankDistribution = Object.entries(rankTiers)
            .filter(([_, data]) => data.games > 0)
            .map(([tier, data]) => ({
                tier,
                games: data.games,
                wins: data.wins,
                losses: data.losses,
                winrate: data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0,
                points: parseFloat(data.points.toFixed(1)),
            }));

        // Calculate TMMR breakdown
        const games = validMatches.length;
        const expectedWins = games * 0.5;
        const performance_score = games > 0 ? (totalWeightedWins - expectedWins) / games : 0;
        // Exponential maturity penalty: <100 games = 200-600pts, 100-200 = 0-200pts
        let maturityPenalty = 0;
        if (games < 200) {
            if (games < 100) {
                const ratio = games / 100;
                maturityPenalty = 200 + (1 - ratio) * 400;
            } else {
                maturityPenalty = ((200 - games) / 100) * 200;
            }
        }
        const avgRank = totalGamesWithRank > 0 ? avgRankSum / totalGamesWithRank : 50;

        const tmmrBreakdown = {
            games,
            wins: totalWins,
            losses: games - totalWins,
            winrate: games > 0 ? parseFloat(((totalWins / games) * 100).toFixed(1)) : 0,
            weightedWins: parseFloat(totalWeightedWins.toFixed(1)),
            expectedWins: parseFloat(expectedWins.toFixed(1)),
            performanceScore: parseFloat(performance_score.toFixed(3)),
            avgRank: parseFloat(avgRank.toFixed(1)),
            avgMultiplier: parseFloat(getRankMultiplier(avgRank).toFixed(2)),
            maturityPenalty: Math.round(maturityPenalty),
            rawTMMR: Math.round(3500 + performance_score * 3500),
            finalTMMR: Math.round(3500 + performance_score * 3500 - maturityPenalty),
        };

        // ============================================
        // PERFORMANCE
        // ============================================
        let totalKills = 0, totalDeaths = 0, totalAssists = 0, totalDuration = 0;
        for (const match of validMatches) {
            totalKills += match.kills || 0;
            totalDeaths += match.deaths || 0;
            totalAssists += match.assists || 0;
            totalDuration += match.duration;
        }

        const matchCount = validMatches.length;
        const matchPerformance = {
            avgKDA: matchCount > 0 ? `${(totalKills / matchCount).toFixed(1)}/${(totalDeaths / matchCount).toFixed(1)}/${(totalAssists / matchCount).toFixed(1)}` : '0/0/0',
            avgDuration: matchCount > 0 ? Math.round(totalDuration / matchCount) : 0,
            positiveKDA: validMatches.filter(m => (m.kills + m.assists) > m.deaths).length,
        };

        // ============================================
        // DAILY STATS
        // ============================================
        const dailyMap = new Map<string, { wins: number; losses: number }>();

        for (const match of validMatches) {
            if (!match.start_time) continue;
            try {
                const date = new Date(match.start_time * 1000).toISOString().split('T')[0];
                const existing = dailyMap.get(date) || { wins: 0, losses: 0 };
                const isWin = (match.player_slot < 128) === match.radiant_win;
                if (isWin) {
                    existing.wins++;
                } else {
                    existing.losses++;
                }
                dailyMap.set(date, existing);
            } catch {
                console.log(`[Matches API] Invalid timestamp:`, match.start_time);
            }
        }

        const dailyStats = Array.from(dailyMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30);

        // ============================================
        // RECENT MATCHES
        // ============================================
        const recentMatches = validMatches.slice(0, 10).map(m => ({
            matchId: m.match_id,
            heroId: m.hero_id,
            win: (m.player_slot < 128) === m.radiant_win,
            kda: `${m.kills}/${m.deaths}/${m.assists}`,
            duration: m.duration,
            tmmrChange: 0,
            timestamp: new Date(m.start_time * 1000).toISOString(),
            averageRank: m.average_rank || 0,
        }));

        return NextResponse.json({
            heroStats,
            performance: matchPerformance,
            recentMatches,
            dailyStats,
            rankDistribution,
            tmmrBreakdown,
            totalMatches: matchCount,
        });
    } catch (error) {
        console.error('Error fetching player matches:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
