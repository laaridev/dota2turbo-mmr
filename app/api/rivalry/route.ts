import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Rivalry } from '@/lib/models/Rivalry';

// GET - Listar rivalidades (feed público)
export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const searchParams = req.nextUrl.searchParams;
        const query = searchParams.get('q') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        let filter = {};

        // Se houver busca, filtrar por nome de qualquer um dos jogadores
        if (query && query.length >= 2) {
            filter = {
                $or: [
                    { player1Name: { $regex: query, $options: 'i' } },
                    { player2Name: { $regex: query, $options: 'i' } }
                ]
            };
        }

        const [rivalries, total] = await Promise.all([
            Rivalry.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Rivalry.countDocuments(filter)
        ]);

        // Buscar dados completos dos players
        const Player = (await import('@/lib/models/Player')).default;

        const enrichedRivalries = await Promise.all(
            rivalries.map(async (rivalry: any) => {
                const [player1, player2] = await Promise.all([
                    Player.findOne({ steamId: rivalry.player1Id }).lean(),
                    Player.findOne({ steamId: rivalry.player2Id }).lean()
                ]);

                return {
                    ...rivalry,
                    player1: player1 || { steamId: rivalry.player1Id, name: rivalry.player1Name, avatar: '/default-avatar.png', tmmr: 0 },
                    player2: player2 || { steamId: rivalry.player2Id, name: rivalry.player2Name, avatar: '/default-avatar.png', tmmr: 0 }
                };
            })
        );

        return NextResponse.json({
            rivalries: enrichedRivalries,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error fetching rivalries:', error);
        return NextResponse.json({ error: 'Erro ao buscar rivalidades' }, { status: 500 });
    }
}

// POST - Salvar nova rivalidade
export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { player1Id, player1Name, player2Id, player2Name, headToHead } = await req.json();

        if (!player1Id || !player2Id || !player1Name || !player2Name) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
        }

        // Normalize player order to prevent duplicates (A vs B = B vs A)
        // Always store in alphabetical order by ID
        const [normalizedP1Id, normalizedP1Name, normalizedP2Id, normalizedP2Name] =
            player1Id < player2Id
                ? [player1Id, player1Name, player2Id, player2Name]
                : [player2Id, player2Name, player1Id, player1Name];

        // Also normalize headToHead data if players were swapped
        const normalizedHeadToHead = player1Id < player2Id
            ? headToHead
            : {
                player1Wins: headToHead.player2Wins,
                player2Wins: headToHead.player1Wins,
                totalMatches: headToHead.totalMatches,
                matchDetails: headToHead.matchDetails?.map((match: any) => ({
                    ...match,
                    // Swap winner if needed
                    winner: match.winner === player1Id ? player2Id : match.winner === player2Id ? player1Id : match.winner
                }))
            };

        // Use findOneAndUpdate with upsert to avoid duplicates
        const rivalry = await Rivalry.findOneAndUpdate(
            {
                player1Id: normalizedP1Id,
                player2Id: normalizedP2Id
            },
            {
                player1Id: normalizedP1Id,
                player1Name: normalizedP1Name,
                player2Id: normalizedP2Id,
                player2Name: normalizedP2Name,
                headToHead: normalizedHeadToHead || { player1Wins: 0, player2Wins: 0, totalMatches: 0 }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        return NextResponse.json(rivalry, { status: 201 });
    } catch (error) {
        console.error('Error creating rivalry:', error);
        return NextResponse.json({ error: 'Erro ao salvar rivalidade' }, { status: 500 });
    }
}
