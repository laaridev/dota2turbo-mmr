import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Match from '@/lib/models/Match';
import { opendota } from '@/lib/opendota';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        // Convert to Account ID (32-bit) if necessary
        const accountId = opendota.steamId64to32(id);
        console.log(`[Matches API] Looking for playerSteamId: ${accountId} (original: ${id})`);

        // Get ALL matches from MongoDB (no limit!)
        const matches = await Match.find({ playerSteamId: accountId })
            .sort({ timestamp: -1 })
            .lean();

        console.log(`[Matches API] Found ${matches.length} matches`);

        // Aggregate hero stats from ALL matches
        const heroMap = new Map<number, { games: number; wins: number; kills: number; deaths: number; assists: number; totalDuration: number }>();

        for (const match of matches) {
            const existing = heroMap.get(match.heroId) || { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, totalDuration: 0 };
            const [kills, deaths, assists] = (match.kda as string).split('/').map(Number);

            heroMap.set(match.heroId, {
                games: existing.games + 1,
                wins: existing.wins + (match.win ? 1 : 0),
                kills: existing.kills + (kills || 0),
                deaths: existing.deaths + (deaths || 0),
                assists: existing.assists + (assists || 0),
                totalDuration: existing.totalDuration + (match.duration as number),
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
        for (const match of matches) {
            const [k, d, a] = (match.kda as string).split('/').map(Number);
            totalKills += k || 0;
            totalDeaths += d || 0;
            totalAssists += a || 0;
            totalDuration += match.duration as number;
        }

        const matchCount = matches.length;
        const performance = {
            avgKDA: matchCount > 0 ? `${(totalKills / matchCount).toFixed(1)}/${(totalDeaths / matchCount).toFixed(1)}/${(totalAssists / matchCount).toFixed(1)}` : '0/0/0',
            avgDuration: matchCount > 0 ? Math.round(totalDuration / matchCount) : 0,
            positiveKDA: matches.filter(m => {
                const [k, d, a] = (m.kda as string).split('/').map(Number);
                return (k + a) > d;
            }).length,
        };

        // Aggregate matches by day for chart
        const dailyMap = new Map<string, { wins: number; losses: number }>();

        // Fill with match data (use actual match dates)
        for (const match of matches) {
            const date = new Date(match.timestamp as Date).toISOString().split('T')[0];
            const existing = dailyMap.get(date) || { wins: 0, losses: 0 };
            if (match.win) {
                existing.wins++;
            } else {
                existing.losses++;
            }
            dailyMap.set(date, existing);
        }

        // Convert to array sorted by date ascending, take last 30 days with data
        const dailyStats = Array.from(dailyMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30);

        // Recent matches (last 10)
        const recentMatches = matches.slice(0, 10).map(m => ({
            matchId: m.matchId,
            heroId: m.heroId,
            win: m.win,
            kda: m.kda,
            duration: m.duration,
            tmmrChange: m.tmmrChange,
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
