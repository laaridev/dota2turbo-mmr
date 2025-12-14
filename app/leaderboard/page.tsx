'use client';

import { useEffect, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { Trophy, ChevronUp, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface Period {
    id: string;
    label: string;
}

export default function LeaderboardPage() {
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showScrollTop, setShowScrollTop] = useState(false);
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

    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const topTen = players.slice(0, 10);
    const restPlayers = players.slice(10);

    const filteredRest = useMemo(() => {
        if (!searchQuery.trim()) return restPlayers;
        return restPlayers.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [restPlayers, searchQuery]);

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 py-6 max-w-5xl relative z-10">
                {/* Header with filters */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Ranking</h1>
                            <p className="text-muted-foreground text-sm">Os melhores jogadores do Turbo</p>
                        </div>

                        {/* Filters row */}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 sm:w-48">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Buscar jogador..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-card border border-white/10 rounded-lg text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
                                />
                            </div>

                            {/* Period Selector */}
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground hidden sm:block" />
                                <select
                                    value={currentPeriod}
                                    onChange={(e) => handlePeriodChange(e.target.value)}
                                    className="bg-card border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 cursor-pointer"
                                >
                                    {periods.map(p => (
                                        <option key={p.id} value={p.id}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
                        </div>
                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Top 10 */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Trophy className="h-4 w-4 text-primary" />
                                <h2 className="font-semibold text-white text-sm">Top 10</h2>
                            </div>
                            <div className="space-y-2">
                                {topTen.map((player, i) => (
                                    <PlayerRow key={player.steamId} player={player} position={i + 1} isTop10 />
                                ))}
                                {topTen.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        Nenhum jogador neste período
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Rest of players */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-6" /> {/* Spacer to align with top 10 header */}
                                <span className="text-xs text-muted-foreground">{restPlayers.length} jogadores</span>
                            </div>

                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                                {(searchQuery ? filteredRest : restPlayers).map((player, i) => (
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
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        Sem mais jogadores
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Scroll to top */}
                <AnimatePresence>
                    {showScrollTop && (
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            onClick={scrollToTop}
                            className="fixed bottom-6 right-6 w-10 h-10 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
                        >
                            <ChevronUp className="h-5 w-5" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

/* Unified Player Row - same style for both columns */
function PlayerRow({ player, position, isTop10 = false }: { player: any; position: number; isTop10?: boolean }) {
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
                initial={{ opacity: 0, x: isTop10 ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(position * 0.03, 0.3) }}
                className={`flex items-center gap-3 p-2.5 rounded-xl border ${bgClass} hover:bg-white/5 transition-colors cursor-pointer`}
            >
                {/* Position */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${position === 1 ? 'bg-amber-500/20 text-amber-400' :
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
                    className="w-9 h-9 rounded-lg object-cover"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-white text-sm truncate">{player.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{winRate}% WR</span>
                        <span className="text-white/20">•</span>
                        <span>{player.wins + player.losses} jogos</span>
                    </div>
                </div>

                {/* TMMR + Badge */}
                <div className="text-right flex items-center gap-2">
                    <span className="font-bold text-white">{player.tmmr}</span>
                    <Badge variant={category as any} className="text-[10px] px-1.5">
                        {TIER_NAMES[tier]}
                    </Badge>
                </div>
            </motion.div>
        </Link>
    );
}
