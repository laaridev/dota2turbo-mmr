import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Player from '@/lib/models/Player';
import Match from '@/lib/models/Match';
import { opendota } from '@/lib/opendota';
import { calculateTMMRv5 } from '@/lib/tmmr-v5';
import { HERO_NAMES } from '@/lib/heroes';

const UPDATE_LOCK_DAYS = 7;
const UPDATE_LOCK_MS = UPDATE_LOCK_DAYS * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await dbConnect();

        // Normalize ID
        const steamId = id.toString();
        const accountId = opendota.steamId64to32(steamId);

        console.log(`[Analyze v5] Received ID: ${steamId} -> AccountID: ${accountId}`);

        // Check existing player
        const existingPlayer = await Player.findOne({ steamId: accountId });

        if (existingPlayer) {
            console.log(`[Analyze v5] Found existing player: ${existingPlayer.name}`);
            const timeDiff = Date.now() - new Date(existingPlayer.lastUpdate).getTime();
            if (timeDiff < UPDATE_LOCK_MS) {
                const remainingMs = UPDATE_LOCK_MS - timeDiff;
                const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
                return NextResponse.json({
                    error: 'Profile is locked',
                    remainingDays,
                    player: existingPlayer
                }, { status: 429 });
            }
        }

        // Fetch from OpenDota
        const [profileData, matchesData] = await Promise.all([
            opendota.getPlayerProfile(accountId),
            opendota.getPlayerMatches(accountId)
        ]);

        if (!profileData || !profileData.profile) {
            return NextResponse.json({ error: 'Player not found on OpenDota' }, { status: 404 });
        }

        if (!matchesData || matchesData.length === 0) {
            return NextResponse.json({
                error: 'Sem partidas Turbo encontradas',
                isPrivate: true,
                message: 'Não encontramos partidas Turbo para este jogador no OpenDota.'
            }, { status: 403 });
        }

        // Calculate TMMR v5
        const calculation = calculateTMMRv5(matchesData);

        console.log(`[Analyze v5] ${profileData.profile.personaname}: TMMR ${calculation.currentTmmr} (WR: ${(calculation.breakdown.rawWinrate * 100).toFixed(1)}% → Wilson: ${(calculation.breakdown.wilsonWinrate * 100).toFixed(1)}%, Diff: ${calculation.breakdown.difficultyMod.toFixed(2)})`);

        // Save Matches
        const BATCH_SIZE = 500;
        const validMatches = matchesData.filter(m => m.duration >= 480 && (!m.leaver_status || m.leaver_status <= 1));

        const bulkOps = validMatches.slice(0, 50).map((m) => {
            const isWin = (m.player_slot < 128) === m.radiant_win;
            return {
                updateOne: {
                    filter: { matchId: m.match_id, playerSteamId: accountId },
                    update: {
                        $set: {
                            matchId: m.match_id,
                            playerSteamId: accountId,
                            heroId: m.hero_id,
                            win: isWin,
                            duration: m.duration,
                            kda: `${m.kills}/${m.deaths}/${m.assists}`,
                            timestamp: new Date(m.start_time * 1000),
                            averageRank: m.average_rank || 0
                        }
                    },
                    upsert: true
                }
            };
        });

        for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
            await Match.bulkWrite(bulkOps.slice(i, i + BATCH_SIZE));
        }

        // Calculate Hero Stats for specialist ranking
        const MIN_HERO_GAMES = 50;
        const heroMap = new Map<number, { wins: number; games: number; kills: number; deaths: number; assists: number }>();

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

        const heroStats = Array.from(heroMap.entries())
            .filter(([, stats]) => stats.games >= MIN_HERO_GAMES)
            .map(([heroId, stats]) => ({
                heroId,
                heroName: HERO_NAMES[heroId] || `Hero ${heroId}`,
                games: stats.games,
                wins: stats.wins,
                winrate: parseFloat(((stats.wins / stats.games) * 100).toFixed(2)),
                avgKDA: `${(stats.kills / stats.games).toFixed(1)}/${(stats.deaths / stats.games).toFixed(1)}/${(stats.assists / stats.games).toFixed(1)}`
            }))
            .sort((a, b) => b.winrate - a.winrate);

        // Best hero
        const bestHero = heroStats.length > 0
            ? { bestHeroId: heroStats[0].heroId, bestHeroGames: heroStats[0].games, bestHeroWinrate: heroStats[0].winrate }
            : { bestHeroId: 0, bestHeroGames: 0, bestHeroWinrate: 0 };

        // Save Player with v5 data
        const playerUpdate = {
            steamId: accountId,
            name: profileData.profile.personaname,
            avatar: profileData.profile.avatarfull,
            tmmr: calculation.currentTmmr,
            wins: calculation.wins,
            losses: calculation.losses,
            streak: 0, // Deprecated
            lastUpdate: new Date(),
            isPrivate: false,

            // TMMR v5.0 Fields
            winrate: calculation.breakdown.rawWinrate * 100,
            wilsonWinrate: calculation.breakdown.wilsonWinrate * 100,
            // v5.1: no confidence multiplier, kept for UI display only
            confidenceScore: 1.0,
            avgRankPlayed: calculation.breakdown.avgRank,
            difficultyExposure: calculation.breakdown.difficultyMod,

            // Hero Stats
            heroStats: heroStats,
            bestHeroId: bestHero.bestHeroId,
            bestHeroGames: bestHero.bestHeroGames,
            bestHeroWinrate: bestHero.bestHeroWinrate
        };

        const player = await Player.findOneAndUpdate(
            { steamId: accountId },
            playerUpdate,
            { new: true, upsert: true }
        );

        // Invalidate cache
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dotaturbo.vercel.app';
            await fetch(`${baseUrl}/api/leaderboard?revalidate=true`, { method: 'POST' });
        } catch (e) {
            console.log('[Cache] Failed to invalidate');
        }

        return NextResponse.json({
            success: true,
            player,
            calculation,
            message: 'Profile analyzed successfully (TMMR v5)'
        });

    } catch (error: any) {
        console.error('Analysis Error:', error);
        return NextResponse.json({
            error: 'Analysis failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
