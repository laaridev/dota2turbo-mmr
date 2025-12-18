import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Player from '@/lib/models/Player';
import { opendota } from '@/lib/opendota';
import { HERO_NAMES } from '@/lib/heroes';

// Minimum games with hero to qualify
const MIN_HERO_GAMES = 50;

// Cache for 10 minutes
let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

interface HeroEntry {
    playerId: string;
    playerName: string;
    playerAvatar: string;
    heroId: number;
    heroName: string;
    games: number;
    wins: number;
    winrate: number;
    avgKDA: string;
    // Score for ranking: winrate * log(games) to reward both skill and dedication
    score: number;
}

export async function GET(request: Request) {
    try {
        // Check cache
        if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
            return NextResponse.json(cache.data);
        }

        await dbConnect();

        // Get all players
        const players = await Player.find({ isPrivate: { $ne: true } })
            .select('steamId name avatar')
            .lean();

        console.log(`[Specialists API] Processing ${players.length} players`);

        const allHeroEntries: HeroEntry[] = [];
        let processed = 0;

        // Process players in parallel batches
        const batchSize = 5;
        for (let i = 0; i < players.length; i += batchSize) {
            const batch = players.slice(i, i + batchSize);

            const batchResults = await Promise.all(
                batch.map(async (player) => {
                    try {
                        const accountId = opendota.steamId64to32(player.steamId);
                        const matches = await opendota.getPlayerMatches(accountId);

                        if (!matches || matches.length === 0) return [];

                        // Aggregate hero stats
                        const heroMap = new Map<number, { wins: number; games: number; kills: number; deaths: number; assists: number }>();

                        const validMatches = matches.filter(m => m.duration >= 480 && (!m.leaver_status || m.leaver_status <= 1));

                        for (const m of validMatches) {
                            const heroId = m.hero_id;
                            const isWin = (m.player_slot < 128) === m.radiant_win;

                            const stats = heroMap.get(heroId) || { wins: 0, games: 0, kills: 0, deaths: 0, assists: 0 };
                            stats.games++;
                            if (isWin) stats.wins++;
                            stats.kills += m.kills || 0;
                            stats.deaths += m.deaths || 0;
                            stats.assists += m.assists || 0;
                            heroMap.set(heroId, stats);
                        }

                        // Filter heroes with MIN_HERO_GAMES and create entries
                        const entries: HeroEntry[] = [];
                        for (const [heroId, stats] of heroMap.entries()) {
                            if (stats.games >= MIN_HERO_GAMES) {
                                const winrate = (stats.wins / stats.games) * 100;
                                const avgK = (stats.kills / stats.games).toFixed(1);
                                const avgD = (stats.deaths / stats.games).toFixed(1);
                                const avgA = (stats.assists / stats.games).toFixed(1);

                                // Score: combines winrate with volume
                                // log2(games) means: 50 games = 5.6, 100 = 6.6, 200 = 7.6, 500 = 8.9
                                const volumeBonus = Math.log2(stats.games);
                                const score = winrate * (1 + volumeBonus * 0.1);

                                entries.push({
                                    playerId: player.steamId,
                                    playerName: player.name,
                                    playerAvatar: player.avatar,
                                    heroId,
                                    heroName: HERO_NAMES[heroId] || `Hero ${heroId}`,
                                    games: stats.games,
                                    wins: stats.wins,
                                    winrate: parseFloat(winrate.toFixed(2)),
                                    avgKDA: `${avgK}/${avgD}/${avgA}`,
                                    score: parseFloat(score.toFixed(2))
                                });
                            }
                        }

                        return entries;
                    } catch (error) {
                        console.error(`[Specialists API] Error for ${player.name}:`, error);
                        return [];
                    }
                })
            );

            // Flatten results
            for (const entries of batchResults) {
                allHeroEntries.push(...entries);
            }

            processed += batch.length;
            console.log(`[Specialists API] Processed ${processed}/${players.length} players`);

            // Rate limit between batches
            if (i + batchSize < players.length) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        // Sort by score (descending)
        allHeroEntries.sort((a, b) => b.score - a.score);

        // Take top 100
        const topSpecialists = allHeroEntries.slice(0, 100);

        console.log(`[Specialists API] Found ${allHeroEntries.length} hero entries, returning top 100`);

        const response = {
            specialists: topSpecialists,
            totalEntries: allHeroEntries.length,
            minGames: MIN_HERO_GAMES,
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
