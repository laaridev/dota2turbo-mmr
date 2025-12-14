'use client';

import { useEffect, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { Trophy, Crown, Medal, TrendingDown, Flame, Sparkles, ChevronUp, Search } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeaderboardPage() {
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetch('/api/leaderboard')
            .then(res => res.json())
            .then(data => {
                setPlayers(data.players || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Scroll to top button visibility
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const topThree = players.slice(0, 3);
    const restPlayers = players.slice(3);

    // Filter players by search query
    const filteredPlayers = useMemo(() => {
        if (!searchQuery.trim()) return restPlayers;
        return restPlayers.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [restPlayers, searchQuery]);

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 py-8 max-w-3xl relative z-10">

                {loading ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-52 rounded-2xl" />)}
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        {topThree.length >= 3 && (
                            <div className="grid grid-cols-3 gap-4 mb-8 items-end">
                                <TopCard player={topThree[1]} position={2} />
                                <TopCard player={topThree[0]} position={1} />
                                <TopCard player={topThree[2]} position={3} />
                            </div>
                        )}

                        {/* Search Input */}
                        <div className="relative mb-6">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar jogador..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-card border border-white/10 rounded-xl text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>

                        {/* Player List */}
                        <div className="flex flex-col gap-3">
                            {filteredPlayers.map((player, i) => (
                                <PlayerListItem key={player.steamId} player={player} position={restPlayers.indexOf(player) + 4} />
                            ))}
                            {filteredPlayers.length === 0 && searchQuery && (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    Nenhum jogador encontrado
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Scroll to top button */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        onClick={scrollToTop}
                        className="fixed bottom-6 right-6 w-12 h-12 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
                    >
                        <ChevronUp className="h-6 w-6" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────── */
/* Premium TopCard Component                                    */
/* ─────────────────────────────────────────────────────────── */
function TopCard({ player, position }: { player: any; position: number }) {
    const isFirst = position === 1;
    const tier = getTier(player.tmmr);
    const tierCategory = getTierCategory(tier);

    const config = {
        1: {
            height: 'h-72',
            avatar: 'w-24 h-24',
            gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
            border: 'border-amber-500/40',
            glow: 'shadow-[0_0_40px_rgba(251,146,60,0.3)]',
            avatarBorder: 'border-4 border-amber-500/60',
        },
        2: {
            height: 'h-64',
            avatar: 'w-20 h-20',
            gradient: 'from-zinc-400/10 via-zinc-500/5 to-transparent',
            border: 'border-zinc-500/30',
            glow: '',
            avatarBorder: 'border-2 border-zinc-400/50',
        },
        3: {
            height: 'h-64',
            avatar: 'w-20 h-20',
            gradient: 'from-orange-700/15 via-orange-600/5 to-transparent',
            border: 'border-orange-700/30',
            glow: '',
            avatarBorder: 'border-2 border-orange-600/50',
        },
    }[position]!;

    const medalColor = position === 1 ? 'text-amber-400' : position === 2 ? 'text-zinc-300' : 'text-orange-600';
    const winrate = ((player.wins / (player.wins + player.losses || 1)) * 100).toFixed(0);

    return (
        <Link href={`/profile/${player.steamId}`}>
            <motion.div
                className={`relative ${config.height} rounded-2xl bg-gradient-to-b ${config.gradient} border ${config.border} ${config.glow} backdrop-blur-sm overflow-hidden group cursor-pointer`}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
            >
                {/* Shine effect on hover */}
                {!isFirst && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                )}

                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-center p-4 gap-2">
                    {/* Position badge */}
                    <div className="absolute top-3 left-3">
                        <span className={`text-lg font-black ${position === 1 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                            #{position}
                        </span>
                    </div>

                    {/* Medal/Crown above avatar */}
                    <div className={`${medalColor} mb-1`}>
                        {isFirst ? (
                            <motion.div
                                animate={{ rotateZ: [-5, 5, -5] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            >
                                <Crown className="h-6 w-6 drop-shadow-lg" />
                            </motion.div>
                        ) : (
                            <Medal className="h-5 w-5" />
                        )}
                    </div>

                    {/* Avatar */}
                    <div className={`${config.avatar} aspect-square rounded-full overflow-hidden ${config.avatarBorder} shadow-lg flex-shrink-0`}>
                        <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Player name */}
                    <span className={`font-bold truncate max-w-full mt-2 ${isFirst ? 'text-lg text-white drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]' : 'text-sm text-white/90'}`}>
                        {player.name}
                    </span>

                    {/* TMMR */}
                    <div className="flex items-center gap-1">
                        <Trophy className={`h-4 w-4 ${isFirst ? 'text-amber-400' : 'text-primary'}`} />
                        <span className={`font-black ${isFirst ? 'text-lg text-amber-400' : 'text-primary'}`}>
                            {player.tmmr}
                        </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{player.wins + player.losses} jogos</span>
                        <span>•</span>
                        <span>{winrate}%</span>
                        {player.streak > 0 && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 text-orange-400">
                                    <Flame className="h-3 w-3" />{player.streak}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Sparkle effect for #1 */}
                {isFirst && (
                    <div className="absolute inset-0 pointer-events-none">
                        <Sparkles className="absolute top-4 right-4 h-4 w-4 text-amber-400/50 animate-pulse" />
                        <Sparkles className="absolute bottom-6 left-4 h-3 w-3 text-amber-400/30 animate-pulse delay-300" />
                    </div>
                )}
            </motion.div>
        </Link>
    );
}

/* ─────────────────────────────────────────────────────────── */
/* Player List Item Component                                   */
/* ─────────────────────────────────────────────────────────── */
function PlayerListItem({ player, position }: { player: any; position: number }) {
    const tier = getTier(player.tmmr);
    const tierCategory = getTierCategory(tier);
    const winrate = ((player.wins / (player.wins + player.losses || 1)) * 100).toFixed(0);

    return (
        <Link href={`/profile/${player.steamId}`}>
            <motion.div
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-card/80 to-card/50 backdrop-blur-sm border border-white/[0.08] rounded-xl hover:border-primary/30 transition-all cursor-pointer group"
                whileHover={{ x: 4, scale: 1.01 }}
            >
                {/* Position */}
                <div className="w-8 text-center">
                    <span className="text-lg font-bold text-muted-foreground">{position}</span>
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-primary/40 transition-all flex-shrink-0">
                    <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                </div>

                {/* Name and Badge */}
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white group-hover:text-primary transition-colors truncate">
                        {player.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant={tierCategory as any} className="text-[9px]">{TIER_NAMES[tier]}</Badge>
                        <span className="text-xs text-muted-foreground">{player.wins + player.losses} jogos • {winrate}%</span>
                    </div>
                </div>

                {/* Streak */}
                <div className="hidden sm:block">
                    {player.streak !== 0 && (
                        player.streak > 0 ? (
                            <span className="flex items-center gap-1 text-orange-400 text-sm font-medium">
                                <Flame className="h-4 w-4" />{player.streak}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-rose-400 text-sm">
                                <TrendingDown className="h-4 w-4" />{Math.abs(player.streak)}
                            </span>
                        )
                    )}
                </div>

                {/* TMMR */}
                <div className="text-right">
                    <div className="flex items-center gap-1.5">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="font-bold text-lg text-primary">{player.tmmr}</span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
