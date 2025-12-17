import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Player from '@/lib/models/Player';


export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const searchParams = req.nextUrl.searchParams;
        const query = searchParams.get('q') || '';

        if (query.length < 2) {
            return NextResponse.json([]);
        }

        // Buscar jogadores por nome (case insensitive, partial match)
        const players = await Player.find({
            name: { $regex: query, $options: 'i' },
            wins: { $gte: 1 } // Apenas jogadores com pelo menos 1 jogo
        })
            .select('steamId name avatar tmmr wins losses')
            .limit(10)
            .lean();

        return NextResponse.json(players);
    } catch (error) {
        console.error('Error searching players:', error);
        return NextResponse.json({ error: 'Erro ao buscar jogadores' }, { status: 500 });
    }
}
