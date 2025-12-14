import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Player from '@/lib/models/Player';
import Match from '@/lib/models/Match';
import { calculateTMMR, TmmrCalculationResult } from '@/lib/tmmr';

// This endpoint recalculates TMMR for all players using stored matches
// Should be protected in production (e.g., admin auth)

export async function POST() {
    try {
        await dbConnect();

        // Get all players
        const players = await Player.find({});
        console.log(`[Recalculate] Found ${players.length} players to process`);

        const results: { steamId: string; name: string; oldTmmr: number; newTmmr: number; matches: number }[] = [];

        for (const player of players) {
            // Get all matches for this player, sorted by timestamp ascending
            const matches = await Match.find({ playerSteamId: player.steamId })
                .sort({ timestamp: 1 })
                .lean();

            if (matches.length === 0) {
                console.log(`[Recalculate] Player ${player.name} has no matches, skipping`);
                continue;
            }

            // Convert stored matches to OpenDotaMatch format for calculation
            const openDotaFormatMatches = matches.map(m => ({
                match_id: m.matchId,
                player_slot: 0, // Will be determined by win field
                radiant_win: m.win, // If player won, assume they were radiant
                duration: m.duration || 0,
                game_mode: 23, // Turbo
                lobby_type: 0,
                hero_id: m.heroId,
                start_time: Math.floor(new Date(m.timestamp).getTime() / 1000),
                version: 0,
                kills: parseInt(m.kda?.split('/')[0]) || 0,
                deaths: parseInt(m.kda?.split('/')[1]) || 0,
                assists: parseInt(m.kda?.split('/')[2]) || 0,
                leaver_status: 0,
                party_size: 1,
                // Use stored win directly by setting player_slot and radiant_win
                // If win=true, we want playerWon=true
                // playerWon = (isRadiant && radiant_win) || (!isRadiant && !radiant_win)
                // Set player_slot=0 (radiant) and radiant_win=win to get correct result
            }));

            // Recalculate TMMR
            const calculation: TmmrCalculationResult = calculateTMMR(openDotaFormatMatches);

            const oldTmmr = player.tmmr;
            const newTmmr = calculation.currentTmmr;

            // Update player
            await Player.updateOne(
                { steamId: player.steamId },
                {
                    $set: {
                        tmmr: newTmmr,
                        wins: calculation.wins,
                        losses: calculation.losses,
                        streak: calculation.streak
                    }
                }
            );

            results.push({
                steamId: player.steamId,
                name: player.name,
                oldTmmr,
                newTmmr,
                matches: matches.length
            });

            console.log(`[Recalculate] ${player.name}: ${oldTmmr} → ${newTmmr} (${matches.length} matches)`);
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            results
        });

    } catch (error) {
        console.error('[Recalculate] Error:', error);
        return NextResponse.json({ error: 'Failed to recalculate' }, { status: 500 });
    }
}
