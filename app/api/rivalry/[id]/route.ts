import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Rivalry } from '@/lib/models/Rivalry';
import Player from '@/lib/models/Player';

// GET - Load a specific rivalry by ID with full details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: 'Rivalry ID is required' }, { status: 400 });
        }

        // Find the rivalry by ID
        const rivalry = await Rivalry.findById(id).lean();

        if (!rivalry) {
            return NextResponse.json({ error: 'Rivalry not found' }, { status: 404 });
        }

        // Fetch player data for both players
        const [player1, player2] = await Promise.all([
            Player.findOne({ steamId: rivalry.player1Id }).lean(),
            Player.findOne({ steamId: rivalry.player2Id }).lean()
        ]);

        return NextResponse.json({
            ...rivalry,
            player1: player1 ? {
                steamId: player1.steamId,
                name: player1.name,
                avatar: player1.avatar,
                tmmr: player1.tmmr,
                wins: player1.wins,
                losses: player1.losses
            } : {
                steamId: rivalry.player1Id,
                name: rivalry.player1Name,
                avatar: '',
                tmmr: 0
            },
            player2: player2 ? {
                steamId: player2.steamId,
                name: player2.name,
                avatar: player2.avatar,
                tmmr: player2.tmmr,
                wins: player2.wins,
                losses: player2.losses
            } : {
                steamId: rivalry.player2Id,
                name: rivalry.player2Name,
                avatar: '',
                tmmr: 0
            }
        });
    } catch (error) {
        console.error('Error loading rivalry:', error);
        return NextResponse.json({ error: 'Failed to load rivalry' }, { status: 500 });
    }
}
