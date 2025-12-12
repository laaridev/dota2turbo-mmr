import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Player from '@/lib/models/Player';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const page = parseInt(searchParams.get('page') || '1');
        const skip = (page - 1) * limit;

        await dbConnect();

        const players = await Player.find({ isPrivate: false })
            .sort({ tmmr: -1 })
            .skip(skip)
            .limit(limit)
            .select('steamId name avatar tmmr wins losses streak');

        const total = await Player.countDocuments({ isPrivate: false });

        return NextResponse.json({
            players,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Leaderboard Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
