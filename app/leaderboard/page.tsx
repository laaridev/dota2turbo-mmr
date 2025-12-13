'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { Trophy, Crown, Medal, Flame, TrendingUp, TrendingDown } from 'lucide-react';
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
        <div className="min-h-screen pb-20">
            {/* Hero Header */}
            <div className="relative overflow-hidden py-12 mb-8">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[100px] rounded-full" />

                <motion.div
                    className="container mx-auto px-4 text-center relative z-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-4">
                        <Trophy className="h-4 w-4" />
                        <span>Ranking ao Vivo</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
                        <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Ranking </span>
                        <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">Global</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">Os melhores jogadores de Turbo</p>
                </motion.div>
            </div>

            <div className="container mx-auto px-4 space-y-8">
                {loading ? (
                    <div className="space-y-4 max-w-4xl mx-auto">
                        <div className="flex justify-center gap-4 mb-8">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-40 rounded-2xl" />)}
                        </div>
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        {topThree.length >= 3 && (
                            <motion.div
                                className="flex items-end justify-center gap-4 md:gap-6 mb-12"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                {/* 2nd Place */}
                                <PodiumCard player={topThree[1]} position={2} />

                                {/* 1st Place */}
                                <PodiumCard player={topThree[0]} position={1} />

                                {/* 3rd Place */}
                                <PodiumCard player={topThree[2]} position={3} />
                            </motion.div>
                        )}

                        {/* Rest of Leaderboard */}
                        <motion.div
                            className="max-w-4xl mx-auto"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <div className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-5">Jogador</div>
                                    <div className="col-span-2 text-center">Partidas</div>
                                    <div className="col-span-2 text-center">Streak</div>
                                    <div className="col-span-2 text-right">TMMR</div>
                                </div>

                                {/* Player Rows */}
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
        1: { height: 'h-56', gradient: 'from-yellow-500/20 to-amber-600/10', border: 'border-yellow-500/30', crown: '#FFD700' },
        2: { height: 'h-48', gradient: 'from-slate-400/20 to-slate-500/10', border: 'border-slate-400/30', crown: '#C0C0C0' },
        3: { height: 'h-44', gradient: 'from-orange-600/20 to-orange-700/10', border: 'border-orange-600/30', crown: '#CD7F32' },
    }[position] || { height: 'h-44', gradient: 'from-white/5 to-white/5', border: 'border-white/10', crown: '#FFF' };

    return (
        <Link href={`/profile/${player.steamId}`}>
            <motion.div
                className={`relative w-32 md:w-44 ${positionStyles.height} rounded-2xl bg-gradient-to-b ${positionStyles.gradient} border ${positionStyles.border} backdrop-blur-sm p-4 flex flex-col items-center justify-end hover:scale-105 transition-transform cursor-pointer group`}
                whileHover={{ y: -5 }}
            >
                {/* Crown/Medal */}
                <div className="absolute -top-4">
                    {position === 1 ? (
                        <div className="relative">
                            <Crown className="h-8 w-8" style={{ color: positionStyles.crown }} />
                            <motion.div
                                className="absolute inset-0 blur-md"
                                style={{ color: positionStyles.crown }}
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Crown className="h-8 w-8" />
                            </motion.div>
                        </div>
                    ) : (
                        <Medal className="h-7 w-7" style={{ color: positionStyles.crown }} />
                    )}
                </div>

                {/* Position */}
                <div className="absolute top-3 left-3 text-2xl font-bold text-white/40">
                    #{position}
                </div>

                {/* Avatar */}
                <div className={`relative mb-3 ${isFirst ? 'w-16 h-16' : 'w-14 h-14'}`}>
                    <img
                        src={player.avatar}
                        alt={player.name}
                        className={`w-full h-full rounded-full border-2 ${position === 1 ? 'border-yellow-500' : position === 2 ? 'border-slate-400' : 'border-orange-600'} object-cover`}
                    />
                    {isFirst && (
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-yellow-500"
                            animate={{ scale: [1, 1.1, 1], opacity: [1, 0, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    )}
                </div>

                {/* Name */}
                <div className="font-semibold text-sm truncate max-w-full text-center mb-1">
                    {player.name}
                </div>

                {/* TMMR */}
                <div className="flex items-center gap-1 text-primary font-bold mb-2">
                    <Trophy className="h-3 w-3" />
                    {player.tmmr}
                </div>

                {/* Tier Badge */}
                <Badge variant={getTierCategory(tier) as any} className="text-[10px]">
                    {TIER_NAMES[tier]}
                </Badge>

                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-2xl bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
            className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors group"
        >
            {/* Position */}
            <div className="col-span-1 font-bold text-muted-foreground group-hover:text-white transition-colors">
                #{position}
            </div>

            {/* Player Info */}
            <div className="col-span-5 flex items-center gap-3">
                <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-10 h-10 rounded-full border border-white/10"
                />
                <div className="min-w-0">
                    <div className="font-semibold truncate group-hover:text-primary transition-colors">
                        {player.name}
                    </div>
                    <Badge variant={getTierCategory(tier) as any} className="text-[10px] mt-0.5">
                        {TIER_NAMES[tier]}
                    </Badge>
                </div>
            </div>

            {/* Matches */}
            <div className="col-span-2 text-center text-muted-foreground">
                {player.wins + player.losses}
            </div>

            {/* Streak */}
            <div className="col-span-2 flex items-center justify-center gap-1">
                {isPositive ? (
                    <>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-green-500 font-medium">+{player.streak}</span>
                    </>
                ) : player.streak < 0 ? (
                    <>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="text-red-500 font-medium">{player.streak}</span>
                    </>
                ) : (
                    <span className="text-muted-foreground">0</span>
                )}
            </div>

            {/* TMMR */}
            <div className="col-span-2 text-right">
                <div className="font-bold text-primary flex items-center justify-end gap-1">
                    <Trophy className="h-4 w-4" />
                    {player.tmmr}
                </div>
            </div>
        </Link>
    );
}
