'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { Trophy, Crown, Medal, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

function getWeekInfo() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSunday);
    const hoursLeft = Math.floor((nextSunday.getTime() - now.getTime()) / (1000 * 60 * 60));
    const daysLeft = Math.floor(hoursLeft / 24);
    return { weekNumber, daysLeft, hoursLeft: hoursLeft % 24 };
}

export default function LeaderboardPage() {
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const weekInfo = getWeekInfo();

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
            <div className="container mx-auto px-4 py-4 flex flex-col h-full max-w-4xl">

                {/* Week Header */}
                <motion.div
                    className="text-center mb-4 flex-shrink-0"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-xl md:text-2xl font-bold mb-1">Ranking da Semana</h1>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <span>Semana {weekInfo.weekNumber}</span>
                        <span className="text-white/20">•</span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {weekInfo.daysLeft > 0 ? `${weekInfo.daysLeft}d ${weekInfo.hoursLeft}h` : `${weekInfo.hoursLeft}h`} para reset
                        </span>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="space-y-4 flex-1">
                        <div className="flex items-end justify-center gap-2 mb-4">
                            <Skeleton className="w-28 h-32 rounded-xl" />
                            <Skeleton className="w-36 h-40 rounded-xl" />
                            <Skeleton className="w-28 h-32 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        {topThree.length >= 3 && (
                            <motion.div
                                className="flex items-end justify-center gap-2 mb-4 flex-shrink-0"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <PodiumCard player={topThree[1]} position={2} />
                                <PodiumCard player={topThree[0]} position={1} />
                                <PodiumCard player={topThree[2]} position={3} />
                            </motion.div>
                        )}

                        {/* Rest of Leaderboard */}
                        <motion.div
                            className="flex-1 min-h-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="bg-card/40 border border-white/5 rounded-xl overflow-hidden h-full flex flex-col">
                                <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-white/5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex-shrink-0">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-5">Jogador</div>
                                    <div className="col-span-2 text-center hidden sm:block">Partidas</div>
                                    <div className="col-span-2 text-center">Streak</div>
                                    <div className="col-span-2 text-right">TMMR</div>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <div className="divide-y divide-white/5">
                                        {restPlayers.map((player, index) => (
                                            <LeaderboardRow key={player.steamId} player={player} position={index + 4} />
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

    const styles = {
        1: { w: 'w-40', h: 'h-44', avatar: 'w-16 h-16', bg: 'from-yellow-500/25 to-amber-700/10', border: 'border-yellow-500/50', color: '#FFD700' },
        2: { w: 'w-32', h: 'h-36', avatar: 'w-12 h-12', bg: 'from-slate-400/25 to-slate-600/10', border: 'border-slate-400/50', color: '#C0C0C0' },
        3: { w: 'w-32', h: 'h-36', avatar: 'w-12 h-12', bg: 'from-orange-500/25 to-orange-700/10', border: 'border-orange-600/50', color: '#CD7F32' },
    }[position]!;

    return (
        <Link href={`/profile/${player.steamId}`}>
            <motion.div
                className={`relative ${styles.w} ${styles.h} rounded-xl bg-gradient-to-b ${styles.bg} border ${styles.border} p-2 flex flex-col items-center justify-center hover:scale-[1.03] transition-transform cursor-pointer`}
                whileHover={{ y: -3 }}
            >
                {/* Icon */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2">
                    {isFirst ? <Crown className="h-5 w-5" style={{ color: styles.color }} /> : <Medal className="h-4 w-4" style={{ color: styles.color }} />}
                </div>

                {/* Position */}
                <div className="absolute top-2 left-2 text-sm font-bold text-white/20">#{position}</div>

                {/* Avatar */}
                <div className={`${styles.avatar} mb-2`}>
                    <img src={player.avatar} alt={player.name} className="w-full h-full rounded-full object-cover" style={{ border: `2px solid ${styles.color}` }} />
                </div>

                {/* Name */}
                <div className="font-semibold text-xs truncate max-w-full text-center">{player.name}</div>

                {/* TMMR */}
                <div className="flex items-center gap-1 text-primary font-bold text-sm mt-1">
                    <Trophy className="h-3 w-3" />{player.tmmr}
                </div>

                {/* Badge */}
                <Badge variant={getTierCategory(tier) as any} className="text-[9px] mt-1">{TIER_NAMES[tier]}</Badge>
            </motion.div>
        </Link>
    );
}

function LeaderboardRow({ player, position }: { player: any; position: number }) {
    const tier = getTier(player.tmmr);
    return (
        <Link href={`/profile/${player.steamId}`} className="grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-white/5 transition-colors">
            <div className="col-span-1 font-bold text-muted-foreground text-xs">#{position}</div>
            <div className="col-span-5 flex items-center gap-2">
                <img src={player.avatar} alt={player.name} className="w-7 h-7 rounded-full border border-white/10" />
                <div className="min-w-0">
                    <div className="font-medium text-xs truncate">{player.name}</div>
                    <Badge variant={getTierCategory(tier) as any} className="text-[8px]">{TIER_NAMES[tier]}</Badge>
                </div>
            </div>
            <div className="col-span-2 text-center text-muted-foreground text-xs hidden sm:block">{player.wins + player.losses}</div>
            <div className="col-span-2 flex items-center justify-center gap-1 text-xs">
                {player.streak > 0 ? (
                    <><TrendingUp className="h-3 w-3 text-green-500" /><span className="text-green-500">+{player.streak}</span></>
                ) : player.streak < 0 ? (
                    <><TrendingDown className="h-3 w-3 text-red-500" /><span className="text-red-500">{player.streak}</span></>
                ) : <span className="text-muted-foreground">0</span>}
            </div>
            <div className="col-span-2 text-right font-bold text-primary text-xs flex items-center justify-end gap-1">
                <Trophy className="h-3 w-3" />{player.tmmr}
            </div>
        </Link>
    );
}
