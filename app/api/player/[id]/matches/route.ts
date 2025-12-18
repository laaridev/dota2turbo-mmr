import { NextResponse } from 'next/server';
import { opendota } from '@/lib/opendota';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Convert to Account ID (32-bit) if necessary
        const accountId = opendota.steamId64to32(id);
        console.log(`[Matches API] Fetching from OpenDota for: ${accountId}`);

        // Fetch ALL turbo matches from OpenDota API
        const matches = await opendota.getPlayerMatches(accountId);

        if (!matches || matches.length === 0) {
            console.log(`[Matches API] No matches found`);
            return NextResponse.json({
                heroStats: [],
                performance: { avgKDA: '0/0/0', avgDuration: 0, positiveKDA: 0 },
                recentMatches: [],
                dailyStats: [],
                totalMatches: 0,
            });
        }

        console.log(`[Matches API] Found ${matches.length} matches from OpenDota`);

        // Aggregate hero stats from ALL matches
        const heroMap = new Map<number, { games: number; wins: number; kills: number; deaths: number; assists: number; totalDuration: number }>();

        const validMatches = matches.filter(m => m.duration >= 480 && (!m.leaver_status || m.leaver_status <= 1));

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

        // Convert to array sorted by games played
        const heroStats = Array.from(heroMap.entries())
            .map(([heroId, stats]) => ({
                heroId,
                games: stats.games,
                wins: stats.wins,
                winrate: Math.round((stats.wins / stats.games) * 100),
                avgKDA: `${(stats.kills / stats.games).toFixed(1)}/${(stats.deaths / stats.games).toFixed(1)}/${(stats.assists / stats.games).toFixed(1)}`,
            }))
            .sort((a, b) => b.games - a.games)
            .slice(0, 10); // Top 10 heroes

        // Calculate overall performance metrics
        let totalKills = 0, totalDeaths = 0, totalAssists = 0, totalDuration = 0;
        for (const match of validMatches) {
            totalKills += match.kills || 0;
            totalDeaths += match.deaths || 0;
            totalAssists += match.assists || 0;
            totalDuration += match.duration;
        }

        const matchCount = validMatches.length;
        const performance = {
            avgKDA: matchCount > 0 ? `${(totalKills / matchCount).toFixed(1)}/${(totalDeaths / matchCount).toFixed(1)}/${(totalAssists / matchCount).toFixed(1)}` : '0/0/0',
            avgDuration: matchCount > 0 ? Math.round(totalDuration / matchCount) : 0,
            positiveKDA: validMatches.filter(m => (m.kills + m.assists) > m.deaths).length,
        };

        // Aggregate matches by day for chart
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

        // Convert to array sorted by date ascending, take last 30 days with data
        const dailyStats = Array.from(dailyMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30);

        console.log(`[Matches API] dailyStats count: ${dailyStats.length}`);

        // Recent matches (last 10) - with additional data for display
        const recentMatches = validMatches.slice(0, 10).map(m => ({
            matchId: m.match_id,
            heroId: m.hero_id,
            win: (m.player_slot < 128) === m.radiant_win,
            kda: `${m.kills}/${m.deaths}/${m.assists}`,
            duration: m.duration,
            tmmrChange: 0,
            timestamp: new Date(m.start_time * 1000).toISOString(),
            averageRank: m.average_rank || 0,
            partySize: m.party_size || 1,
        }));

        return NextResponse.json({
            heroStats,
            performance,
            recentMatches,
            dailyStats,
            totalMatches: matchCount,
        });
    } catch (error) {
        console.error('Error fetching player matches:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
