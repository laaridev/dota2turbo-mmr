import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Player from '@/lib/models/Player';
import Match from '@/lib/models/Match';
import { calculateTMMR } from '@/lib/tmmr';

export async function GET() {
    try {
        await dbConnect();

        const playersCount = await Player.countDocuments();
        const matchesCount = await Match.countDocuments();

        const samplePlayers = await Player.find().limit(5).lean();

        return NextResponse.json({
            players: playersCount,
            matches: matchesCount,
            sample: samplePlayers.map(p => ({ name: p.name, tmmr: p.tmmr, wins: p.wins, losses: p.losses }))
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST() {
    try {
        await dbConnect();

        const players = await Player.find({});
        console.log(`[Migration] Processing ${players.length} players`);

        const results: any[] = [];

        for (const player of players) {
            const matches = await Match.find({ playerSteamId: player.steamId })
                .sort({ timestamp: 1 })
                .lean();

            if (matches.length === 0) {
                console.log(`[Migration] ${player.name}: no matches, skipping`);
                continue;
            }

            // Convert to OpenDota format
            const openDotaMatches = matches.map(m => ({
                match_id: m.matchId,
                player_slot: 0,
                radiant_win: m.win,
                duration: m.duration || 0,
                game_mode: 23,
                lobby_type: 0,
                hero_id: m.heroId,
                start_time: Math.floor(new Date(m.timestamp).getTime() / 1000),
                version: 0,
                kills: parseInt(String(m.kda).split('/')[0]) || 0,
                deaths: parseInt(String(m.kda).split('/')[1]) || 0,
                assists: parseInt(String(m.kda).split('/')[2]) || 0,
                leaver_status: 0,
                party_size: 1,
            }));

            const calc = calculateTMMR(openDotaMatches);

            const oldTmmr = player.tmmr;

            await Player.updateOne(
                { steamId: player.steamId },
                { $set: { tmmr: calc.currentTmmr, wins: calc.wins, losses: calc.losses, streak: calc.streak } }
            );

            results.push({
                name: player.name,
                oldTmmr,
                newTmmr: calc.currentTmmr,
                diff: calc.currentTmmr - oldTmmr,
                matches: matches.length
            });

            console.log(`[Migration] ${player.name}: ${oldTmmr} → ${calc.currentTmmr} (${matches.length} matches)`);
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            results: results.sort((a, b) => b.newTmmr - a.newTmmr)
        });

    } catch (error) {
        console.error('[Migration] Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
