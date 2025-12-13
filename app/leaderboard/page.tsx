'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { Trophy, Crown, Medal, TrendingUp, TrendingDown } from 'lucide-react';
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
            .catch(err => setLoading(false));
    }, []);

    const topThree = players.slice(0, 3);
    const restPlayers = players.slice(3);

    return (
        <div className="h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
            <div className="container mx-auto px-4 py-6 flex flex-col h-full">
                {loading ? (
                    <div className="space-y-4 flex-1">
                        <div className="flex justify-center gap-4 mb-8">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-40 rounded-2xl" />)}
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        {topThree.length >= 3 && (
                            <motion.div
                                className="flex items-end justify-center gap-3 md:gap-5 mb-6 flex-shrink-0"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {/* 2nd Place */}
                                <PodiumCard player={topThree[1]} position={2} />

                                {/* 1st Place */}
                                <PodiumCard player={topThree[0]} position={1} />

                                {/* 3rd Place */}
                                <PodiumCard player={topThree[2]} position={3} />
                            </motion.div>
                        )}

                        {/* Rest of Leaderboard - Scrollable */}
                        <motion.div
                            className="flex-1 min-h-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden h-full flex flex-col">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5 text-xs uppercase tracking-wider text-muted-foreground font-medium flex-shrink-0">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-5">Jogador</div>
                                    <div className="col-span-2 text-center hidden sm:block">Partidas</div>
                                    <div className="col-span-2 text-center">Streak</div>
                                    <div className="col-span-2 text-right">TMMR</div>
                                </div>

                                {/* Scrollable Player Rows */}
                                <div className="flex-1 overflow-y-auto">
                                    <div className="divide-y divide-white/5">
                                        {restPlayers.map((player, index) => (
                                            <LeaderboardRow
                                                key={player.steamId}
                                                player={player}
                                                position={index + 4}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
}

function PodiumCard({ player, position }: { player: any; position: number }) {
    const tier = getTier(player.tmmr);
    const isFirst = position === 1;

    const positionStyles = {
        1: { height: 'h-44 md:h-52', gradient: 'from-yellow-500/20 to-amber-600/10', border: 'border-yellow-500/40', crown: '#FFD700' },
        2: { height: 'h-36 md:h-44', gradient: 'from-slate-400/20 to-slate-500/10', border: 'border-slate-400/40', crown: '#C0C0C0' },
        3: { height: 'h-32 md:h-40', gradient: 'from-orange-600/20 to-orange-700/10', border: 'border-orange-600/40', crown: '#CD7F32' },
    }[position] || { height: 'h-32', gradient: 'from-white/5 to-white/5', border: 'border-white/10', crown: '#FFF' };

    return (
        <Link href={`/profile/${player.steamId}`}>
            <motion.div
                className={`relative w-28 md:w-36 ${positionStyles.height} rounded-xl bg-gradient-to-b ${positionStyles.gradient} border ${positionStyles.border} backdrop-blur-sm p-3 flex flex-col items-center justify-end hover:scale-105 transition-transform cursor-pointer group`}
                whileHover={{ y: -4 }}
            >
                {/* Crown/Medal */}
                <div className="absolute -top-3">
                    {position === 1 ? (
                        <Crown className="h-6 w-6" style={{ color: positionStyles.crown }} />
                    ) : (
                        <Medal className="h-5 w-5" style={{ color: positionStyles.crown }} />
                    )}
                </div>

                {/* Position */}
                <div className="absolute top-2 left-2 text-lg font-bold text-white/30">
                    #{position}
                </div>

                {/* Avatar */}
                <div className={`relative mb-2 ${isFirst ? 'w-12 h-12 md:w-14 md:h-14' : 'w-10 h-10 md:w-12 md:h-12'}`}>
                    <img
                        src={player.avatar}
                        alt={player.name}
                        className={`w-full h-full rounded-full border-2 ${position === 1 ? 'border-yellow-500' : position === 2 ? 'border-slate-400' : 'border-orange-600'} object-cover`}
                    />
                </div>

                {/* Name */}
                <div className="font-semibold text-xs md:text-sm truncate max-w-full text-center mb-1">
                    {player.name}
                </div>

                {/* TMMR */}
                <div className="flex items-center gap-1 text-primary font-bold text-sm mb-1">
                    <Trophy className="h-3 w-3" />
                    {player.tmmr}
                </div>

                {/* Tier Badge */}
                <Badge variant={getTierCategory(tier) as any} className="text-[9px] md:text-[10px]">
                    {TIER_NAMES[tier]}
                </Badge>
            </motion.div>
        </Link>
    );
}

function LeaderboardRow({ player, position }: { player: any; position: number }) {
    const tier = getTier(player.tmmr);
    const isPositive = player.streak > 0;

    return (
        <Link
            href={`/profile/${player.steamId}`}
            className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-white/5 transition-colors group"
        >
            {/* Position */}
            <div className="col-span-1 font-bold text-muted-foreground text-sm">
                #{position}
            </div>

            {/* Player Info */}
            <div className="col-span-5 flex items-center gap-2">
                <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-8 h-8 rounded-full border border-white/10"
                />
                <div className="min-w-0">
                    <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {player.name}
                    </div>
                    <Badge variant={getTierCategory(tier) as any} className="text-[9px] mt-0.5">
                        {TIER_NAMES[tier]}
                    </Badge>
                </div>
            </div>

            {/* Matches */}
            <div className="col-span-2 text-center text-muted-foreground text-sm hidden sm:block">
                {player.wins + player.losses}
            </div>

            {/* Streak */}
            <div className="col-span-2 flex items-center justify-center gap-1">
                {isPositive ? (
                    <>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-green-500 text-sm font-medium">+{player.streak}</span>
                    </>
                ) : player.streak < 0 ? (
                    <>
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span className="text-red-500 text-sm font-medium">{player.streak}</span>
                    </>
                ) : (
                    <span className="text-muted-foreground text-sm">0</span>
                )}
            </div>

            {/* TMMR */}
            <div className="col-span-2 text-right">
                <div className="font-bold text-primary text-sm flex items-center justify-end gap-1">
                    <Trophy className="h-3 w-3" />
                    {player.tmmr}
                </div>
            </div>
        </Link>
    );
}
