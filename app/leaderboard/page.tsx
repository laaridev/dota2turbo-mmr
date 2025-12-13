'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { Trophy, Crown, Medal, TrendingUp, TrendingDown, Clock, Flame, Gamepad2 } from 'lucide-react';
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
            .catch(() => setLoading(false));
    }, []);

    const topThree = players.slice(0, 3);
    const restPlayers = players.slice(3);

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-6 max-w-3xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold">Ranking Semanal</h1>
                        <p className="text-sm text-muted-foreground">Semana {weekInfo.weekNumber}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{weekInfo.daysLeft}d {weekInfo.hoursLeft}h</span>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-44 rounded-xl" />)}
                        </div>
                        <div className="space-y-2">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Grid - same baseline */}
                        {topThree.length >= 3 && (
                            <div className="grid grid-cols-3 gap-3 mb-6 items-end">
                                <TopCard player={topThree[1]} position={2} />
                                <TopCard player={topThree[0]} position={1} />
                                <TopCard player={topThree[2]} position={3} />
                            </div>
                        )}

                        {/* Table */}
                        <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
                            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                                <div className="col-span-1">#</div>
                                <div className="col-span-5">Jogador</div>
                                <div className="col-span-2 text-center hidden sm:block">Jogos</div>
                                <div className="col-span-2 text-center">Streak</div>
                                <div className="col-span-2 text-right">TMMR</div>
                            </div>
                            <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
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
/* TopCard - consistent structure for all 3 positions         */
/* ─────────────────────────────────────────────────────────── */
function TopCard({ player, position }: { player: any; position: number }) {
    const tier = getTier(player.tmmr);
    const tierCategory = getTierCategory(tier);
    const isFirst = position === 1;

    // Subtle differences only
    const config = {
        1: { minH: 'min-h-[180px]', avatar: 'w-16 h-16', border: 'border-primary/40', glow: 'shadow-primary/20 shadow-lg' },
        2: { minH: 'min-h-[160px]', avatar: 'w-14 h-14', border: 'border-border', glow: '' },
        3: { minH: 'min-h-[160px]', avatar: 'w-14 h-14', border: 'border-border', glow: '' },
    }[position]!;

    const medalColor = position === 1 ? 'text-yellow-500' : position === 2 ? 'text-zinc-400' : 'text-orange-600';

    return (
        <Link href={`/profile/${player.steamId}`}>
            <motion.div
                className={`relative ${config.minH} rounded-xl bg-card border ${config.border} ${config.glow} p-4 flex flex-col items-center justify-between hover:bg-secondary/50 transition-colors cursor-pointer`}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                {/* Position # top-left */}
                <div className="absolute top-3 left-3 text-lg font-bold text-muted-foreground">
                    #{position}
                </div>

                {/* Avatar container (relative anchor for crown) */}
                <div className="relative mt-2">
                    {/* Crown/Medal above avatar */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                        {isFirst ? (
                            <Crown className={`h-5 w-5 ${medalColor}`} />
                        ) : (
                            <Medal className={`h-4 w-4 ${medalColor}`} />
                        )}
                    </div>

                    {/* Avatar */}
                    <div className={`${config.avatar} rounded-full overflow-hidden border-2 ${isFirst ? 'border-primary' : 'border-border'}`}>
                        <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                    </div>
                </div>

                {/* Info - consistent gaps */}
                <div className="flex flex-col items-center gap-1 mt-3 text-center w-full">
                    <span className="font-semibold text-sm truncate max-w-full">{player.name}</span>
                    <div className="flex items-center gap-1 text-primary font-bold">
                        <Trophy className="h-4 w-4" />
                        <span>{player.tmmr}</span>
                    </div>
                    <Badge variant={tierCategory as any} className="text-[10px]">
                        {TIER_NAMES[tier]}
                    </Badge>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <span>{player.wins + player.losses} jogos</span>
                    {player.streak !== 0 && (
                        <>
                            <span className="text-border">•</span>
                            {player.streak > 0 ? (
                                <span className="flex items-center gap-0.5 text-orange-500">
                                    <Flame className="h-3 w-3" />{player.streak}
                                </span>
                            ) : (
                                <span className="flex items-center gap-0.5 text-red-500">
                                    <TrendingDown className="h-3 w-3" />{Math.abs(player.streak)}
                                </span>
                            )}
                        </>
                    )}
                </div>
            </motion.div>
        </Link>
    );
}

/* ─────────────────────────────────────────────────────────── */
/* TableRow - clean and consistent                            */
/* ─────────────────────────────────────────────────────────── */
function TableRow({ player, position }: { player: any; position: number }) {
    const tier = getTier(player.tmmr);
    const tierCategory = getTierCategory(tier);

    return (
        <Link
            href={`/profile/${player.steamId}`}
            className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-secondary/30 transition-colors"
        >
            <div className="col-span-1 font-medium text-muted-foreground text-sm">#{position}</div>

            <div className="col-span-5 flex items-center gap-2 min-w-0">
                <img src={player.avatar} alt="" className="w-8 h-8 rounded-full border border-border flex-shrink-0" />
                <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{player.name}</div>
                    <Badge variant={tierCategory as any} className="text-[9px]">{TIER_NAMES[tier]}</Badge>
                </div>
            </div>

            <div className="col-span-2 text-center text-sm text-muted-foreground hidden sm:flex items-center justify-center gap-1">
                <Gamepad2 className="h-3 w-3" />
                {player.wins + player.losses}
            </div>

            <div className="col-span-2 flex justify-center">
                {player.streak > 0 ? (
                    <span className="flex items-center gap-1 text-sm text-orange-500 font-medium">
                        <Flame className="h-3 w-3" />+{player.streak}
                    </span>
                ) : player.streak < 0 ? (
                    <span className="flex items-center gap-1 text-sm text-red-500 font-medium">
                        <TrendingDown className="h-3 w-3" />{player.streak}
                    </span>
                ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                )}
            </div>

            <div className="col-span-2 flex items-center justify-end gap-1 font-bold text-primary text-sm">
                <Trophy className="h-3 w-3" />{player.tmmr}
            </div>
        </Link>
    );
}
