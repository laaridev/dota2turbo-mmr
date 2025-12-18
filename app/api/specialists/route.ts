import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Player from '@/lib/models/Player';

// Cache for 2 minutes (lightweight since reading from DB)
let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 2 * 60 * 1000;

interface SpecialistEntry {
    playerId: string;
    playerName: string;
    playerAvatar: string;
    heroId: number;
    heroName: string;
    games: number;
    wins: number;
    winrate: number;
    avgKDA: string;
    score: number;
}

export async function GET() {
    try {
        // Check cache
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.data);
        }

        await dbConnect();

        // Get all players with heroStats
        const players = await Player.find({
            isPrivate: { $ne: true },
            'heroStats.0': { $exists: true } // Has at least one hero stat
        })
            .select('steamId name avatar heroStats')
            .lean();

        console.log(`[Specialists API] Found ${players.length} players with heroStats`);

        // Flatten all hero entries
        const allEntries: SpecialistEntry[] = [];

        for (const player of players) {
            if (!player.heroStats || !Array.isArray(player.heroStats)) continue;

            for (const hero of player.heroStats) {
                // Score: winrate * (1 + log2(games) * 0.1)
                const volumeBonus = Math.log2(hero.games);
                const score = hero.winrate * (1 + volumeBonus * 0.1);

                allEntries.push({
                    playerId: player.steamId,
                    playerName: player.name,
                    playerAvatar: player.avatar,
                    heroId: hero.heroId,
                    heroName: hero.heroName,
                    games: hero.games,
                    wins: hero.wins,
                    winrate: hero.winrate,
                    avgKDA: hero.avgKDA,
                    score: parseFloat(score.toFixed(2))
                });
            }
        }

        // Sort by score (descending)
        allEntries.sort((a, b) => b.score - a.score);

        // Take top 100
        const topSpecialists = allEntries.slice(0, 100);

        console.log(`[Specialists API] Total entries: ${allEntries.length}, returning top 100`);

        const response = {
            specialists: topSpecialists,
            totalEntries: allEntries.length,
            minGames: 50,
            generatedAt: new Date().toISOString()
        };

        // Cache result
        cache = { data: response, timestamp: Date.now() };

        return NextResponse.json(response);
    } catch (error) {
        console.error('[Specialists API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
