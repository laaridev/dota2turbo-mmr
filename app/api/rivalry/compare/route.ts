import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Player from '@/lib/models/Player';

interface HeadToHeadResult {
    player1Wins: number;
    player2Wins: number;
    totalMatches: number;
    matchDetails: Array<{
        matchId: string;
        winner: string;
        player1Hero: number;
        player2Hero: number;
        timestamp: number;
    }>;
}

interface OpenDotaMatch {
    match_id: number;
    player_slot: number;
    radiant_win: boolean;
    hero_id: number;
    start_time: number;
    game_mode: number;
    lobby_type: number;
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { player1Id, player2Id } = await req.json();

        if (!player1Id || !player2Id) {
            return NextResponse.json({ error: 'IDs dos jogadores são obrigatórios' }, { status: 400 });
        }

        if (player1Id === player2Id) {
            return NextResponse.json({ error: 'Não é possível comparar um jogador com ele mesmo' }, { status: 400 });
        }

        // Buscar dados dos jogadores do banco local primeiro
        let [player1, player2] = await Promise.all([
            Player.findOne({ steamId: player1Id }).lean(),
            Player.findOne({ steamId: player2Id }).lean()
        ]);

        // Se não encontrar no banco, buscar da OpenDota API
        if (!player1) {
            console.log(`Player 1 (${player1Id}) not in DB, fetching from OpenDota...`);
            try {
                const response = await fetch(`https://api.opendota.com/api/players/${player1Id}`);
                if (response.ok) {
                    const odPlayer = await response.json();
                    player1 = {
                        steamId: player1Id,
                        name: odPlayer.profile?.personaname || 'Unknown Player',
                        avatar: odPlayer.profile?.avatarfull || '',
                        tmmr: 0, // Not in DB, no TMMR
                        totalGames: 0,
                        wins: 0
                    } as any;
                }
            } catch (err) {
                console.error('Error fetching player1 from OpenDota:', err);
            }
        }

        if (!player2) {
            console.log(`Player 2 (${player2Id}) not in DB, fetching from OpenDota...`);
            try {
                const response = await fetch(`https://api.opendota.com/api/players/${player2Id}`);
                if (response.ok) {
                    const odPlayer = await response.json();
                    player2 = {
                        steamId: player2Id,
                        name: odPlayer.profile?.personaname || 'Unknown Player',
                        avatar: odPlayer.profile?.avatarfull || '',
                        tmmr: 0,
                        totalGames: 0,
                        wins: 0
                    } as any;
                }
            } catch (err) {
                console.error('Error fetching player2 from OpenDota:', err);
            }
        }

        if (!player1 || !player2) {
            return NextResponse.json({ error: 'Um ou ambos os jogadores não foram encontrados' }, { status: 404 });
        }

        console.log('=== RIVALRY DEBUG ===');
        console.log('Player 1:', player1.name, '-', player1Id);
        console.log('Player 2:', player2.name, '-', player2Id);

        // Helper function to fetch with timeout
        const fetchWithTimeout = (url: string, timeoutMs = 10000) => {
            return Promise.race([
                fetch(url),
                new Promise<Response>((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
                )
            ]);
        };

        let p1Matches: OpenDotaMatch[] = [];
        let p2Matches: OpenDotaMatch[] = [];
        let p1IsPrivate = false;
        let p2IsPrivate = false;

        try {
            // STEP 1: Check if each player has public Turbo matches
            // This helps us identify WHICH player has a private profile
            console.log('[Privacy Check] Verifying profile accessibility...');

            const [p1Check, p2Check] = await Promise.all([
                fetchWithTimeout(`https://api.opendota.com/api/players/${player1Id}/matches?game_mode=23&significant=0&limit=1`, 5000).catch(() => null),
                fetchWithTimeout(`https://api.opendota.com/api/players/${player2Id}/matches?game_mode=23&significant=0&limit=1`, 5000).catch(() => null)
            ]);

            p1IsPrivate = !p1Check || !p1Check.ok || p1Check.status >= 500;
            p2IsPrivate = !p2Check || !p2Check.ok || p2Check.status >= 500;

            // If we can check bodies, verify they have matches
            // Empty array = private profile or no Turbo matches
            if (p1Check?.ok) {
                const p1Data = await p1Check.json();
                if (p1Data.length === 0) {
                    console.log(`[Privacy Check] Player 1 (${player1.name}) has no public Turbo matches`);
                    p1IsPrivate = true; // MARK AS PRIVATE
                }
            }
            if (p2Check?.ok) {
                const p2Data = await p2Check.json();
                if (p2Data.length === 0) {
                    console.log(`[Privacy Check] Player 2 (${player2.name}) has no public Turbo matches`);
                    p2IsPrivate = true; // MARK AS PRIVATE
                }
            }

            console.log(`[Privacy Check] P1 private: ${p1IsPrivate}, P2 private: ${p2IsPrivate}`);

            // STEP 2: Fetch matches from OpenDota where both players participated
            // game_mode=23 = Turbo, significant=0 = include non-ranked
            // NO LIMIT = returns ALL matches
            // 10 second timeout to avoid hanging on private profiles
            const [p1Response, p2Response] = await Promise.all([
                fetchWithTimeout(`https://api.opendota.com/api/players/${player1Id}/matches?included_account_id=${player2Id}&game_mode=23&significant=0`, 10000),
                fetchWithTimeout(`https://api.opendota.com/api/players/${player2Id}/matches?included_account_id=${player1Id}&game_mode=23&significant=0`, 10000)
            ]);

            // Check for server errors (5xx) which often indicate private profiles
            if (!p1Response.ok || !p2Response.ok) {
                console.error('OpenDota API error:', p1Response.status, p2Response.status);

                // Determine which player is problematic
                let privatePlayerName = 'Um ou ambos os jogadores';
                if (p1IsPrivate && !p2IsPrivate) {
                    privatePlayerName = player1.name;
                } else if (p2IsPrivate && !p1IsPrivate) {
                    privatePlayerName = player2.name;
                } else if (p1IsPrivate && p2IsPrivate) {
                    privatePlayerName = 'Ambos os jogadores';
                }

                // 5xx errors (500-599) often mean private profile or API issues
                if (p1Response.status >= 500 || p2Response.status >= 500) {
                    return NextResponse.json({
                        error: `Perfil privado: ${privatePlayerName}`,
                        isPrivate: true,
                        privatePlayer: privatePlayerName,
                        player1: {
                            steamId: player1.steamId,
                            name: player1.name,
                            avatar: player1.avatar,
                            tmmr: player1.tmmr,
                            wins: player1.wins,
                            losses: player1.losses,
                            avgKDA: player1.avgKDA,
                            skillScore: player1.skillScore,
                            confidenceScore: player1.confidenceScore,
                            difficultyExposure: player1.difficultyExposure
                        },
                        player2: {
                            steamId: player2.steamId,
                            name: player2.name,
                            avatar: player2.avatar,
                            tmmr: player2.tmmr,
                            wins: player2.wins,
                            losses: player2.losses,
                            avgKDA: player2.avgKDA,
                            skillScore: player2.skillScore,
                            confidenceScore: player2.confidenceScore,
                            difficultyExposure: player2.difficultyExposure
                        },
                        headToHead: {
                            player1Wins: 0,
                            player2Wins: 0,
                            totalMatches: 0,
                            matchDetails: []
                        }
                    }, { status: 200 }); // Return 200 to trigger modal instead of error
                }

                return NextResponse.json({ error: 'Erro ao buscar dados do OpenDota' }, { status: 500 });
            }

            p1Matches = await p1Response.json();
            p2Matches = await p2Response.json();

            console.log('P1 matches with P2:', p1Matches.length);
            console.log('P2 matches with P1:', p2Matches.length);
        } catch (error: any) {
            console.error('OpenDota request failed:', error.message);

            // Timeout or network error - likely private profile
            return NextResponse.json({
                error: 'Perfil privado ou tempo esgotado',
                isPrivate: true,
                privatePlayer: 'Não foi possível determinar',
                player1: {
                    steamId: player1.steamId,
                    name: player1.name,
                    avatar: player1.avatar,
                    tmmr: player1.tmmr,
                    wins: player1.wins,
                    losses: player1.losses,
                    avgKDA: player1.avgKDA,
                    skillScore: player1.skillScore,
                    confidenceScore: player1.confidenceScore,
                    difficultyExposure: player1.difficultyExposure
                },
                player2: {
                    steamId: player2.steamId,
                    name: player2.name,
                    avatar: player2.avatar,
                    tmmr: player2.tmmr,
                    wins: player2.wins,
                    losses: player2.losses,
                    avgKDA: player2.avgKDA,
                    skillScore: player2.skillScore,
                    confidenceScore: player2.confidenceScore,
                    difficultyExposure: player2.difficultyExposure
                },
                headToHead: {
                    player1Wins: 0,
                    player2Wins: 0,
                    totalMatches: 0,
                    matchDetails: []
                }
            }, { status: 200 }); // Return 200 to trigger modal
        }

        try {
            // Fetch matches from OpenDota where both players participated
            // game_mode=23 = Turbo, significant=0 = include non-ranked
            // 10 second timeout to avoid hanging on private profiles
            const [p1Response, p2Response] = await Promise.all([
                fetchWithTimeout(`https://api.opendota.com/api/players/${player1Id}/matches?included_account_id=${player2Id}&game_mode=23&significant=0`, 10000),
                fetchWithTimeout(`https://api.opendota.com/api/players/${player2Id}/matches?included_account_id=${player1Id}&game_mode=23&significant=0`, 10000)
            ]);

            // Check for server errors (5xx) which often indicate private profiles
            if (!p1Response.ok || !p2Response.ok) {
                console.error('OpenDota API error:', p1Response.status, p2Response.status);

                // 5xx errors (500-599) often mean private profile or API issues
                if (p1Response.status >= 500 || p2Response.status >= 500) {
                    return NextResponse.json({
                        error: 'Perfil privado ou OpenDota indisponível',
                        isPrivate: true,
                        player1: {
                            steamId: player1.steamId,
                            name: player1.name,
                            avatar: player1.avatar,
                            tmmr: player1.tmmr,
                            wins: player1.wins,
                            losses: player1.losses,
                            avgKDA: player1.avgKDA,
                            skillScore: player1.skillScore,
                            confidenceScore: player1.confidenceScore,
                            difficultyExposure: player1.difficultyExposure
                        },
                        player2: {
                            steamId: player2.steamId,
                            name: player2.name,
                            avatar: player2.avatar,
                            tmmr: player2.tmmr,
                            wins: player2.wins,
                            losses: player2.losses,
                            avgKDA: player2.avgKDA,
                            skillScore: player2.skillScore,
                            confidenceScore: player2.confidenceScore,
                            difficultyExposure: player2.difficultyExposure
                        },
                        headToHead: {
                            player1Wins: 0,
                            player2Wins: 0,
                            totalMatches: 0,
                            matchDetails: []
                        }
                    }, { status: 200 }); // Return 200 to trigger modal instead of error
                }

                return NextResponse.json({ error: 'Erro ao buscar dados do OpenDota' }, { status: 500 });
            }

            p1Matches = await p1Response.json();
            p2Matches = await p2Response.json();

            console.log('P1 matches with P2:', p1Matches.length);
            console.log('P2 matches with P1:', p2Matches.length);
        } catch (error: any) {
            console.error('OpenDota request failed:', error.message);

            // Timeout or network error - likely private profile
            return NextResponse.json({
                error: 'Perfil privado ou tempo esgotado',
                isPrivate: true,
                player1: {
                    steamId: player1.steamId,
                    name: player1.name,
                    avatar: player1.avatar,
                    tmmr: player1.tmmr,
                    wins: player1.wins,
                    losses: player1.losses,
                    avgKDA: player1.avgKDA,
                    skillScore: player1.skillScore,
                    confidenceScore: player1.confidenceScore,
                    difficultyExposure: player1.difficultyExposure
                },
                player2: {
                    steamId: player2.steamId,
                    name: player2.name,
                    avatar: player2.avatar,
                    tmmr: player2.tmmr,
                    wins: player2.wins,
                    losses: player2.losses,
                    avgKDA: player2.avgKDA,
                    skillScore: player2.skillScore,
                    confidenceScore: player2.confidenceScore,
                    difficultyExposure: player2.difficultyExposure
                },
                headToHead: {
                    player1Wins: 0,
                    player2Wins: 0,
                    totalMatches: 0,
                    matchDetails: []
                }
            }, { status: 200 }); // Return 200 to trigger modal
        }

        // Criar map das partidas do P2 para lookup rápido
        const p2MatchMap = new Map<number, {
            radiant_win: boolean;
            player_slot: number;
            hero_id: number;
            start_time: number;
        }>(
            p2Matches.map((m) => [m.match_id, {
                radiant_win: m.radiant_win,
                player_slot: m.player_slot,
                hero_id: m.hero_id,
                start_time: m.start_time
            }])
        );

        // Criar map das partidas do P1 também (para verificação reversa)
        const p1MatchMap = new Map<number, {
            radiant_win: boolean;
            player_slot: number;
            hero_id: number;
            start_time: number;
        }>(
            p1Matches.map((m) => [m.match_id, {
                radiant_win: m.radiant_win,
                player_slot: m.player_slot,
                hero_id: m.hero_id,
                start_time: m.start_time
            }])
        );

        const headToHead: HeadToHeadResult = {
            player1Wins: 0,
            player2Wins: 0,
            totalMatches: 0,
            matchDetails: []
        };

        const processedMatches = new Set<number>();

        // PRIMEIRO: Processar cada partida do P1 e comparar com dados do P2
        for (const p1Match of p1Matches) {
            const p2Match = p2MatchMap.get(p1Match.match_id);

            if (!p2Match) {
                console.log(`Match ${p1Match.match_id} não encontrado em P2 - dados inconsistentes`);
                continue;
            }

            processedMatches.add(p1Match.match_id);

            // Determinar se cada um ganhou
            const p1Radiant = p1Match.player_slot < 128;
            const p2Radiant = p2Match.player_slot < 128;
            const p1Won = (p1Radiant && p1Match.radiant_win) || (!p1Radiant && !p1Match.radiant_win);
            const p2Won = (p2Radiant && p2Match.radiant_win) || (!p2Radiant && !p2Match.radiant_win);

            // Se estavam em times opostos (um ganhou, outro perdeu)
            if (p1Won !== p2Won) {
                headToHead.totalMatches++;

                if (p1Won) {
                    headToHead.player1Wins++;
                } else {
                    headToHead.player2Wins++;
                }

                headToHead.matchDetails.push({
                    matchId: p1Match.match_id.toString(),
                    winner: p1Won ? player1Id : player2Id,
                    player1Hero: p1Match.hero_id || 0,
                    player2Hero: p2Match.hero_id || 0,
                    timestamp: p1Match.start_time || 0
                });

                console.log(`Match ${p1Match.match_id}: P1=${p1Won ? 'WIN' : 'LOSS'} (${p1Radiant ? 'Radiant' : 'Dire'}), P2=${p2Won ? 'WIN' : 'LOSS'} (${p2Radiant ? 'Radiant' : 'Dire'}) → OPPOSING TEAMS`);
            } else {
                console.log(`Match ${p1Match.match_id}: SAME TEAM (both ${p1Won ? 'won' : 'lost'}) - skipped`);
            }
        }

        // SEGUNDO: Processar partidas de P2 que NÃO estão em P1 (caso reverso)
        for (const p2Match of p2Matches) {
            // Pular se já processamos
            if (processedMatches.has(p2Match.match_id)) {
                continue;
            }

            const p1Match = p1MatchMap.get(p2Match.match_id);

            // Se não temos dados de P1 para essa partida, não podemos determinar
            // se estavam em times opostos. Pulamos para evitar contar partidas
            // onde jogaram JUNTOS (mesmo time) como confrontos.
            if (!p1Match) {
                console.log(`Match ${p2Match.match_id} não tem dados de P1 - pulando (não é possível verificar times)`);
                continue;
            }

            processedMatches.add(p2Match.match_id);

            // Agora temos dados de ambos, podemos verificar times
            const p1Radiant = p1Match.player_slot < 128;
            const p2Radiant = p2Match.player_slot < 128;

            // Se estavam no MESMO time, pular (não é confronto)
            if (p1Radiant === p2Radiant) {
                console.log(`Match ${p2Match.match_id}: SAME TEAM (both ${p1Radiant ? 'Radiant' : 'Dire'}) - skipped`);
                continue;
            }

            // Times opostos! Contar como confronto
            const p1Won = (p1Radiant && p1Match.radiant_win) || (!p1Radiant && !p1Match.radiant_win);
            const p2Won = (p2Radiant && p2Match.radiant_win) || (!p2Radiant && !p2Match.radiant_win);

            headToHead.totalMatches++;

            if (p1Won) {
                headToHead.player1Wins++;
            } else {
                headToHead.player2Wins++;
            }

            headToHead.matchDetails.push({
                matchId: p2Match.match_id.toString(),
                winner: p1Won ? player1Id : player2Id,
                player1Hero: p1Match.hero_id || 0,
                player2Hero: p2Match.hero_id || 0,
                timestamp: p2Match.start_time || 0
            });

            console.log(`Match ${p2Match.match_id} (from P2): P1=${p1Won ? 'WIN' : 'LOSS'} (${p1Radiant ? 'Radiant' : 'Dire'}), P2=${p2Won ? 'WIN' : 'LOSS'} (${p2Radiant ? 'Radiant' : 'Dire'}) → OPPOSING TEAMS`);
        }

        console.log('Final count - P1 wins:', headToHead.player1Wins, 'P2 wins:', headToHead.player2Wins, 'Total confrontos:', headToHead.totalMatches);
        console.log('===================');

        // Ordenar por data (mais recente primeiro)
        headToHead.matchDetails.sort((a, b) => b.timestamp - a.timestamp);

        // Determine which player has private profile (if any)
        let privatePlayerName = undefined;
        if (headToHead.totalMatches === 0) {
            if (p1IsPrivate && !p2IsPrivate) {
                privatePlayerName = player1.name;
            } else if (p2IsPrivate && !p1IsPrivate) {
                privatePlayerName = player2.name;
            } else if (p1IsPrivate && p2IsPrivate) {
                privatePlayerName = 'Ambos os jogadores';
            }
        }

        return NextResponse.json({
            player1: {
                steamId: player1.steamId,
                name: player1.name,
                avatar: player1.avatar,
                tmmr: player1.tmmr,
                wins: player1.wins,
                losses: player1.losses,
                winrate: ((player1.wins / (player1.wins + player1.losses)) * 100).toFixed(1),
                avgKDA: player1.avgKDA,
                skillScore: player1.skillScore,
                confidenceScore: player1.confidenceScore,
                difficultyExposure: player1.difficultyExposure
            },
            player2: {
                steamId: player2.steamId,
                name: player2.name,
                avatar: player2.avatar,
                tmmr: player2.tmmr,
                wins: player2.wins,
                losses: player2.losses,
                winrate: ((player2.wins / (player2.wins + player2.losses)) * 100).toFixed(1),
                avgKDA: player2.avgKDA,
                skillScore: player2.skillScore,
                confidenceScore: player2.confidenceScore,
                difficultyExposure: player2.difficultyExposure
            },
            headToHead,
            ...(privatePlayerName && { privatePlayer: privatePlayerName }) // Include only if determined
        });
    } catch (error) {
        console.error('Error comparing players:', error);
        return NextResponse.json({ error: 'Erro ao comparar jogadores' }, { status: 500 });
    }
}
