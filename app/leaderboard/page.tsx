'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { Trophy, Crown, Medal, TrendingDown, Flame, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function LeaderboardPage() {
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/leaderboard')
            .then(res => res.json())
            .then(data => {
                setPlayers(data.players || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const topThree = players.slice(0, 3);
    const restPlayers = players.slice(3);

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
                        <div className="space-y-2">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
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

                        {/* Table */}
                        <div className="bg-gradient-to-b from-card/80 to-card/50 backdrop-blur-sm border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
                            <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-white/[0.06] text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                <div className="col-span-1">#</div>
                                <div className="col-span-4">Player</div>
                                <div className="col-span-2 text-center">Rank</div>
                                <div className="col-span-2 text-center hidden sm:block">Jogos</div>
                                <div className="col-span-1 text-center">Streak</div>
                                <div className="col-span-2 text-right">TMMR</div>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto divide-y divide-white/[0.04]">
                                {restPlayers.map((player, i) => (
                                    <TableRow key={player.steamId} player={player} position={i + 4} />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────── */
/* Premium TopCard Component                                    */
/* ─────────────────────────────────────────────────────────── */
function TopCard({ player, position }: { player: any; position: number }) {
    const tier = getTier(player.tmmr);
    const tierCategory = getTierCategory(tier);
    const isFirst = position === 1;
    const isSecond = position === 2;

    const config = {
        1: {
            height: 'h-60',
            avatar: 'w-24 h-24',
            gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
            border: 'border-amber-500/40',
            glow: 'shadow-[0_0_40px_rgba(251,146,60,0.3)]',
            avatarBorder: 'border-4 border-amber-500/60',
        },
        2: {
            height: 'h-52',
            avatar: 'w-20 h-20',
            gradient: 'from-zinc-400/10 via-zinc-500/5 to-transparent',
            border: 'border-zinc-500/30',
            glow: '',
            avatarBorder: 'border-2 border-zinc-400/50',
        },
        3: {
            height: 'h-52',
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
                className={`relative ${config.height} rounded-2xl overflow-hidden border ${config.border} ${config.glow} cursor-pointer group`}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-b ${config.gradient}`} />
                <div className="absolute inset-0 bg-card/80 backdrop-blur-sm" />

                {/* Animated shine for #1 */}
                {isFirst && (
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

                    {/* Avatar - circular with fixed aspect ratio */}
                    <div className={`${config.avatar} aspect-square rounded-full overflow-hidden ${config.avatarBorder} shadow-lg flex-shrink-0`}>
                        <img
                            src={player.avatar}
                            alt={player.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Player name */}
                    <span className={`font-bold truncate max-w-full mt-2 ${isFirst ? 'text-lg text-white drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]' : 'text-sm text-white/90'}`}>
                        {player.name}
                    </span>

                    {/* TMMR only */}
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
                    <motion.div
                        className="absolute top-4 right-4 text-amber-400/60"
                        animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <Sparkles className="h-4 w-4" />
                    </motion.div>
                )}
            </motion.div>
        </Link>
    );
}

/* ─────────────────────────────────────────────────────────── */
/* TableRow Component                                           */
/* ─────────────────────────────────────────────────────────── */
function TableRow({ player, position }: { player: any; position: number }) {
    const tier = getTier(player.tmmr);
    const tierCategory = getTierCategory(tier);

    return (
        <Link href={`/profile/${player.steamId}`}>
            <motion.div
                className="grid grid-cols-12 gap-2 px-5 py-3 items-center hover:bg-white/[0.03] transition-colors cursor-pointer group"
                whileHover={{ x: 4 }}
            >
                <div className="col-span-1 text-muted-foreground font-medium">{position}</div>
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 group-hover:ring-primary/50 transition-all flex-shrink-0">
                        <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">{player.name}</span>
                </div>
                <div className="col-span-2 flex justify-center">
                    <Badge variant={tierCategory as any} className="text-[9px]">{TIER_NAMES[tier]}</Badge>
                </div>
                <div className="col-span-2 text-center text-sm text-muted-foreground hidden sm:block">
                    {player.wins + player.losses}
                </div>
                <div className="col-span-1 text-center">
                    {player.streak !== 0 && (
                        player.streak > 0 ? (
                            <span className="flex items-center justify-center gap-0.5 text-orange-400 text-sm font-medium">
                                <Flame className="h-3.5 w-3.5" />{player.streak}
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-0.5 text-rose-400 text-sm">
                                <TrendingDown className="h-3.5 w-3.5" />{Math.abs(player.streak)}
                            </span>
                        )
                    )}
                </div>
                <div className="col-span-2 text-right">
                    <span className="font-bold text-primary">{player.tmmr}</span>
                </div>
            </motion.div>
        </Link>
    );
}
