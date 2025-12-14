import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Player from '@/lib/models/Player';
import Match from '@/lib/models/Match';
import { opendota } from '@/lib/opendota';
import { calculateTMMR } from '@/lib/tmmr';

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
        // Ideally we should handle both SteamID64 and AccountID. 
        // OpenDota uses AccountID (32-bit).
        const accountId = opendota.steamId64to32(steamId);

        console.log(`[Analyze] Received ID: ${steamId} -> AccountID: ${accountId}`);

        // Check existing player
        const existingPlayer = await Player.findOne({ steamId: accountId });

        if (existingPlayer) {
            console.log(`[Analyze] Found existing player: ${existingPlayer.name} (Last Update: ${existingPlayer.lastUpdate})`);
            // Check lock
            const timeDiff = Date.now() - new Date(existingPlayer.lastUpdate).getTime();
            if (timeDiff < UPDATE_LOCK_MS) {
                console.log(`[Analyze] LOCKED. TimeDiff: ${timeDiff} < ${UPDATE_LOCK_MS}`);
                const remainingMs = UPDATE_LOCK_MS - timeDiff;
                const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
                return NextResponse.json({
                    error: 'Profile is locked',
                    remainingDays,
                    player: existingPlayer
                }, { status: 429 });
            }
        } else {
            console.log(`[Analyze] New player. Fetching from OpenDota...`);
        }

        // Fetch from OpenDota
        // We run parallel requests for better performance
        const [profileData, matchesData] = await Promise.all([
            opendota.getPlayerProfile(accountId),
            opendota.getPlayerMatches(accountId)
        ]);

        if (!profileData || !profileData.profile) {
            return NextResponse.json({ error: 'Player not found on OpenDota' }, { status: 404 });
        }

        // Check if profile is private (no matches returned)
        if (!matchesData || matchesData.length === 0) {
            return NextResponse.json({
                error: 'Sem partidas Turbo encontradas',
                isPrivate: true,
                message: 'Não encontramos partidas Turbo para este jogador no OpenDota. Verifique se: 1) O perfil está público no Dota 2, 2) As partidas foram parseadas no OpenDota (visite opendota.com e clique em Refresh).'
            }, { status: 403 });
        }

        // Calculate TMMR
        const calculation = calculateTMMR(matchesData);

        // Save Matches
        // We only save matches that are NOT already in DB or update them?
        // For simplicity and "snapshot" nature, and to avoid huge complexity, 
        // usually we'd upsert. Given the scale, upserting 1000+ matches might be slow.
        // BUT we need to save them to verify history.
        // Optimization: Only insert new ones in a real app. 
        // Here we'll map all processed matches to operations.

        const splitOps = [];
        const BATCH_SIZE = 500;

        // Create bulk write operations
        const bulkOps = calculation.processedMatches.map(m => ({
            updateOne: {
                filter: { matchId: m.matchId },
                update: {
                    $set: {
                        matchId: m.matchId,
                        playerSteamId: accountId,
                        heroId: m.heroId,
                        win: m.win,
                        duration: m.duration,
                        kda: m.kda,
                        timestamp: m.timestamp,
                        tmmrChange: m.tmmrChange,
                        skill: m.skill,
                        averageRank: m.averageRank
                    }
                },
                upsert: true
            }
        }));

        // Execute in batches
        for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
            await Match.bulkWrite(bulkOps.slice(i, i + BATCH_SIZE));
        }

        // Save Player
        const playerUpdate = {
            steamId: accountId,
            name: profileData.profile.personaname,
            avatar: profileData.profile.avatarfull,
            tmmr: calculation.currentTmmr,
            wins: calculation.wins,
            losses: calculation.losses,
            streak: calculation.streak,
            lastUpdate: new Date(),
            matches: calculation.processedMatches.map(m => m.matchId),
            isPrivate: false // assumed public if we got this far
        };

        const player = await Player.findOneAndUpdate(
            { steamId: accountId },
            playerUpdate,
            { new: true, upsert: true }
        );

        return NextResponse.json({ player });

    } catch (error: any) {
        console.error('Analyze Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
