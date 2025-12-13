'use client';

import {
    useEffect, useState

} from 'react';
import { Badge } from '@/components/ui/badge';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { Trophy, Crown, Medal, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

// Calculate week number and time until Sunday reset
function getWeekInfo() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);

    // Time until next Sunday midnight
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
                    className="text-center mb-6 flex-shrink-0"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-2xl md:text-3xl font-bold mb-1">
                        Ranking da Semana
                    </h1>
                    <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                        <span>Semana {weekInfo.weekNumber}</span>
                        <span className="text-white/20">•</span>
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {weekInfo.daysLeft > 0
                                ? `${weekInfo.daysLeft}d ${weekInfo.hoursLeft}h para reset`
                                : `${weekInfo.hoursLeft}h para reset`
                            }
                        </span>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="space-y-4 flex-1">
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium - Grid for equal width */}
                        {topThree.length >= 3 && (
                            <motion.div
                                className="grid grid-cols-3 gap-3 mb-4 flex-shrink-0"
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

    const positionStyles = {
        1: { bg: 'from-yellow-500/30 via-amber-600/20 to-yellow-700/10', border: 'border-yellow-500/50', crown: '#FFD700', ring: 'ring-yellow-500/30' },
        2: { bg: 'from-slate-400/30 via-slate-500/20 to-slate-600/10', border: 'border-slate-400/50', crown: '#C0C0C0', ring: 'ring-slate-400/30' },
        3: { bg: 'from-orange-500/30 via-orange-600/20 to-orange-700/10', border: 'border-orange-600/50', crown: '#CD7F32', ring: 'ring-orange-600/30' },
    }[position] || { bg: 'from-white/10 to-white/5', border: 'border-white/10', crown: '#FFF', ring: '' };

    return (
        <Link href={`/profile/${player.steamId}`}>
            <motion.div
                className={`relative aspect-square rounded-2xl bg-gradient-to-b ${positionStyles.bg} border ${positionStyles.border} backdrop-blur-sm p-4 flex flex-col items-center justify-center hover:scale-[1.02] transition-all cursor-pointer group`}
                whileHover={{ y: -4 }}
            >
                {/* Crown/Medal */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2">
                    {position === 1 ? (
                        <Crown className="h-6 w-6 md:h-7 md:w-7" style={{ color: positionStyles.crown }} />
                    ) : (
                        <Medal className="h-5 w-5 md:h-6 md:w-6" style={{ color: positionStyles.crown }} />
                    )}
                </div>

                {/* Position */}
                <div className="absolute top-3 left-3 text-xl font-bold text-white/20">
                    #{position}
                </div>

                {/* Avatar */}
                <div className={`relative mb-3 ${position === 1 ? 'w-16 h-16 md:w-20 md:h-20' : 'w-14 h-14 md:w-16 md:h-16'}`}>
                    <img
                        src={player.avatar}
                        alt={player.name}
                        className={`w-full h-full rounded-full border-3 object-cover ring-4 ${positionStyles.ring}`}
                        style={{ borderColor: positionStyles.crown }}
                    />
                </div>

                {/* Name */}
                <div className="font-semibold text-sm md:text-base truncate max-w-full text-center mb-1">
                    {player.name}
                </div>

                {/* TMMR */}
                <div className="flex items-center gap-1 text-primary font-bold text-base md:text-lg mb-2">
                    <Trophy className="h-4 w-4" />
                    {player.tmmr}
                </div>

                {/* Tier Badge */}
                <Badge variant={getTierCategory(tier) as any} className="text-[10px] md:text-xs">
                    {TIER_NAMES[tier]}
                </Badge>

                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
