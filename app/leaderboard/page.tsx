'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function LeaderboardPage() {
    return (
        <Suspense fallback={<LeaderboardSkeleton />}>
            <LeaderboardContent />
        </Suspense>
    );
}

function LeaderboardSkeleton() {
    return (
        <div className="h-full flex flex-col px-4 py-3 container mx-auto max-w-5xl">
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex flex-col h-full overflow-hidden space-y-2">
                    <div className="h-6 w-24 bg-white/5 rounded animate-pulse shrink-0" />
                    <div className="flex-1 min-h-0 overflow-hidden space-y-1.5">
                        {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-11 rounded-lg" />)}
                    </div>
                </div>
                <div className="flex flex-col h-full overflow-hidden space-y-2">
                    <div className="h-6 w-24 bg-white/5 rounded animate-pulse shrink-0 ml-auto" />
                    <div className="flex-1 min-h-0 overflow-hidden space-y-1.5">
                        {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-11 rounded-lg" />)}
                    </div>
                </div>
            </div>
        </div>
    );
}

function LeaderboardContent() {
    const searchParams = useSearchParams();
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const searchQuery = searchParams.get('search') || '';
    const currentPeriod = searchParams.get('period') || 'all';

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/leaderboard?period=${currentPeriod}&limit=100`);
                const data = await res.json();
                setPlayers(data.players || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [currentPeriod]);

    const topTen = players.slice(0, 10);
    const restPlayers = players.slice(10);

    const filteredPlayers = useMemo(() => {
        if (!searchQuery.trim()) return { top: topTen, rest: restPlayers };
        const query = searchQuery.toLowerCase();
        return {
            top: topTen.filter(p => p.name.toLowerCase().includes(query)),
            rest: restPlayers.filter(p => p.name.toLowerCase().includes(query))
        };
    }, [topTen, restPlayers, searchQuery]);

    if (loading) {
        return <LeaderboardSkeleton />;
    }

    return (
        <div className="h-full w-full relative">
            {/* Background Glow - Absoluto para não afetar o layout flex */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none z-0" />

            {/* Container Layout - Flex Column para ocupar 100% da altura disponível */}
            <div className="h-full flex flex-col relative z-10 px-4 py-3 container mx-auto max-w-5xl">

                {/* Grid Wrapper - flex-1 min-h-0 para garantir que o Grid caiba no pai e não cresça */}
                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* COLUNA ESQUERDA (Top 10) - Flex Column para header + lista */}
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Header - Shrink-0 para não amassar */}
                        <div className="flex-shrink-0 flex items-center gap-1.5 mb-2 h-6">
                            <Trophy className="h-3.5 w-3.5 text-primary" />
                            <h2 className="font-semibold text-white text-xs">Top 10</h2>
                        </div>

                        {/* Lista - Flex-1 min-h-0 para ativar o scroll quando conteúdo for maior que espaço */}
                        <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin pb-2">
                            <div className="space-y-1.5">
                                {(searchQuery ? filteredPlayers.top : topTen).map((player) => (
                                    <PlayerRow key={player.steamId} player={player} position={players.indexOf(player) + 1} />
                                ))}
                                {topTen.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-xs">
                                        Nenhum jogador encontrado
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* COLUNA DIREITA (Resto) - Mesma estrutura exata */}
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Header */}
                        <div className="flex-shrink-0 flex items-center justify-end mb-2 h-6">
                            <span className="text-[10px] text-muted-foreground">{restPlayers.length} jogadores</span>
                        </div>

                        {/* Lista */}
                        <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin pb-2">
                            <div className="space-y-1.5">
                                {(searchQuery ? filteredPlayers.rest : restPlayers).map((player) => (
                                    <PlayerRow
                                        key={player.steamId}
                                        player={player}
                                        position={players.indexOf(player) + 1}
                                    />
                                ))}
                                {restPlayers.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-xs">
                                        Sem mais jogadores
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function PlayerRow({ player, position }: { player: any; position: number }) {
    const tier = getTier(player.tmmr);
    const category = getTierCategory(tier);
    const winRate = ((player.wins / (player.wins + player.losses)) * 100).toFixed(1);

    const bgClass = position === 1 ? 'bg-gradient-to-r from-amber-500/15 to-transparent border-amber-500/30' :
        position === 2 ? 'bg-gradient-to-r from-gray-400/10 to-transparent border-gray-400/20' :
            position === 3 ? 'bg-gradient-to-r from-amber-700/10 to-transparent border-amber-700/20' :
                'bg-card/40 border-white/5';

    return (
        <Link href={`/profile/${player.steamId}`}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(position * 0.015, 0.15) }}
                className={`flex items-center gap-2 p-2 rounded-lg border ${bgClass} hover:bg-white/5 transition-colors cursor-pointer group`}
            >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${position === 1 ? 'bg-amber-500/20 text-amber-400' :
                        position === 2 ? 'bg-gray-400/20 text-gray-300' :
                            position === 3 ? 'bg-amber-700/20 text-amber-600' :
                                'bg-white/5 text-muted-foreground'
                    }`}>
                    {position}
                </div>

                <div className="relative w-8 h-8 rounded-md overflow-hidden flex-shrink-0">
                    <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-xs truncate group-hover:text-primary transition-colors">{player.name}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className={Number(winRate) >= 50 ? 'text-green-400' : 'text-red-400'}>{winRate}% WR</span>
                        <span className="text-white/20">•</span>
                        <span>{player.wins + player.losses} jogos</span>
                    </div>
                </div>

                <div className="text-right flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-bold text-white text-xs">{player.tmmr}</span>
                    <Badge variant={category as any} className="text-[9px] px-1 h-4">
                        {TIER_NAMES[tier]}
                    </Badge>
                </div>
            </motion.div>
        </Link>
    );
}
