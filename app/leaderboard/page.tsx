'use client';

import { useEffect, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { Trophy, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

interface Period {
    id: string;
    label: string;
}

export default function LeaderboardPage() {
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [periods, setPeriods] = useState<Period[]>([]);
    const [currentPeriod, setCurrentPeriod] = useState('all');

    const fetchLeaderboard = async (period: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/leaderboard?period=${period}&limit=100`);
            const data = await res.json();
            setPlayers(data.players || []);
            setPeriods(data.periods || []);
            setCurrentPeriod(data.currentPeriod || 'all');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard(currentPeriod);
    }, []);

    const handlePeriodChange = (period: string) => {
        setCurrentPeriod(period);
        fetchLeaderboard(period);
    };

    const topTen = players.slice(0, 10);
    const restPlayers = players.slice(10);

    const filteredRest = useMemo(() => {
        if (!searchQuery.trim()) return restPlayers;
        return restPlayers.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [restPlayers, searchQuery]);

    return (
        <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 py-4 max-w-5xl relative z-10 flex flex-col h-full">
                {/* Header with filters */}
                <div className="flex-shrink-0 mb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-bold text-white">Ranking</h1>
                            <p className="text-muted-foreground text-xs">Os melhores jogadores do Turbo</p>
                        </div>

                        {/* Filters row */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 sm:w-44">
                                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-2 py-1.5 bg-card border border-white/10 rounded-lg text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
                                />
                            </div>

                            {/* Period Selector */}
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                                <select
                                    value={currentPeriod}
                                    onChange={(e) => handlePeriodChange(e.target.value)}
                                    className="bg-card border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50 cursor-pointer"
                                >
                                    {periods.map(p => (
                                        <option key={p.id} value={p.id}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content - takes remaining height */}
                <div className="flex-1 min-h-0">
                    {loading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                            <div className="space-y-1.5">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
                            </div>
                            <div className="space-y-1.5">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                            {/* Left: Top 10 */}
                            <div className="flex flex-col h-full min-h-0">
                                <div className="flex items-center gap-1.5 mb-2 flex-shrink-0">
                                    <Trophy className="h-3.5 w-3.5 text-primary" />
                                    <h2 className="font-semibold text-white text-xs">Top 10</h2>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                                    {topTen.map((player, i) => (
                                        <PlayerRow key={player.steamId} player={player} position={i + 1} />
                                    ))}
                                    {topTen.length === 0 && (
                                        <div className="text-center py-6 text-muted-foreground text-xs">
                                            Nenhum jogador neste período
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Rest of players */}
                            <div className="flex flex-col h-full min-h-0">
                                <div className="flex items-center justify-end mb-2 flex-shrink-0">
                                    <span className="text-[10px] text-muted-foreground">{restPlayers.length} jogadores</span>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                                    {(searchQuery ? filteredRest : restPlayers).map((player) => (
                                        <PlayerRow
                                            key={player.steamId}
                                            player={player}
                                            position={players.indexOf(player) + 1}
                                        />
                                    ))}
                                    {filteredRest.length === 0 && searchQuery && (
                                        <div className="text-center py-4 text-muted-foreground text-xs">
                                            Nenhum jogador encontrado
                                        </div>
                                    )}
                                    {restPlayers.length === 0 && !searchQuery && (
                                        <div className="text-center py-6 text-muted-foreground text-xs">
                                            Sem mais jogadores
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* Unified Player Row */
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
                transition={{ delay: Math.min(position * 0.02, 0.2) }}
                className={`flex items-center gap-2 p-2 rounded-lg border ${bgClass} hover:bg-white/5 transition-colors cursor-pointer`}
            >
                {/* Position */}
                <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] ${position === 1 ? 'bg-amber-500/20 text-amber-400' :
                        position === 2 ? 'bg-gray-400/20 text-gray-300' :
                            position === 3 ? 'bg-amber-700/20 text-amber-600' :
                                'bg-white/5 text-muted-foreground'
                    }`}>
                    {position}
                </div>

                {/* Avatar */}
                <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-8 h-8 rounded-md object-cover"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-xs truncate">{player.name}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span>{winRate}% WR</span>
                        <span className="text-white/20">•</span>
                        <span>{player.wins + player.losses} jogos</span>
                    </div>
                </div>

                {/* TMMR + Badge */}
                <div className="text-right flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs">{player.tmmr}</span>
                    <Badge variant={category as any} className="text-[9px] px-1">
                        {TIER_NAMES[tier]}
                    </Badge>
                </div>
            </motion.div>
        </Link>
    );
}
