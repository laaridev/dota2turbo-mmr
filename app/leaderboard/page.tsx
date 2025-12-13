'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { getTier, getTierCategory, TIER_NAMES, TierKey } from '@/lib/tmmr';
import { Trophy, Crown, Medal, TrendingUp, TrendingDown, Clock, Flame, ChevronDown, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

// Rank color schemes
const RANK_THEMES: Record<string, { glow: string; border: string; bg: string }> = {
    immortal: { glow: 'shadow-amber-500/50', border: 'border-amber-400', bg: 'from-amber-500/30 via-yellow-600/20 to-amber-900/10' },
    divine: { glow: 'shadow-rose-500/40', border: 'border-rose-400', bg: 'from-rose-500/25 via-red-600/15 to-rose-900/10' },
    ancient: { glow: 'shadow-purple-500/40', border: 'border-purple-400', bg: 'from-purple-500/25 via-purple-600/15 to-purple-900/10' },
    legend: { glow: 'shadow-sky-500/40', border: 'border-sky-400', bg: 'from-sky-500/25 via-blue-600/15 to-sky-900/10' },
    archon: { glow: 'shadow-yellow-500/40', border: 'border-yellow-500', bg: 'from-yellow-500/20 via-amber-600/10 to-yellow-900/10' },
    crusader: { glow: 'shadow-lime-500/30', border: 'border-lime-500', bg: 'from-lime-500/20 via-green-600/10 to-lime-900/10' },
    guardian: { glow: 'shadow-teal-500/30', border: 'border-teal-500', bg: 'from-teal-500/20 via-cyan-600/10 to-teal-900/10' },
    herald: { glow: 'shadow-zinc-400/20', border: 'border-zinc-500', bg: 'from-zinc-500/15 via-zinc-600/10 to-zinc-900/10' },
};

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
    const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
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
        <div className="min-h-screen relative overflow-hidden">
            {/* Noise overlay */}
            <div className="fixed inset-0 opacity-[0.015] pointer-events-none z-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

            {/* Radial glow behind top 3 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-primary/10 via-orange-500/5 to-transparent rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-4 py-6 max-w-4xl relative z-10">

                {/* Week Header */}
                <motion.div
                    className="flex items-center justify-between mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            Ranking <span className="text-primary">Semanal</span>
                        </h1>
                        <p className="text-muted-foreground text-sm">Semana {weekInfo.weekNumber}</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                            {weekInfo.daysLeft > 0 ? `${weekInfo.daysLeft}d ${weekInfo.hoursLeft}h` : `${weekInfo.hoursLeft}h`}
                        </span>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="space-y-6">
                        <div className="flex items-end justify-center gap-4 h-80">
                            <Skeleton className="w-48 h-56 rounded-2xl" />
                            <Skeleton className="w-56 h-72 rounded-2xl" />
                            <Skeleton className="w-48 h-56 rounded-2xl" />
                        </div>
                        <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        {topThree.length >= 3 && (
                            <motion.div
                                className="flex items-end justify-center gap-3 md:gap-4 mb-8"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <TopPlayerCard player={topThree[1]} position={2} />
                                <TopPlayerCard player={topThree[0]} position={1} />
                                <TopPlayerCard player={topThree[2]} position={3} />
                            </motion.div>
                        )}

                        {/* Leaderboard Table */}
                        <motion.div
                            className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-white/5 text-xs uppercase tracking-wider text-muted-foreground font-medium bg-white/[0.02]">
                                <div className="col-span-1 text-center">#</div>
                                <div className="col-span-5">Jogador</div>
                                <div className="col-span-2 text-center hidden md:block">Partidas</div>
                                <div className="col-span-2 text-center">Streak</div>
                                <div className="col-span-2 text-right">TMMR</div>
                            </div>

                            {/* Scrollable Rows */}
                            <div className="max-h-[400px] overflow-y-auto">
                                <AnimatePresence>
                                    {restPlayers.map((player, index) => (
                                        <LeaderboardRow
                                            key={player.steamId}
                                            player={player}
                                            position={index + 4}
                                            isNearTop={index < 3}
                                            isHovered={hoveredPlayer === player.steamId}
                                            onHover={() => setHoveredPlayer(player.steamId)}
                                            onLeave={() => setHoveredPlayer(null)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
}

function TopPlayerCard({ player, position }: { player: any; position: number }) {
    const tier = getTier(player.tmmr);
    const tierCategory = getTierCategory(tier);
    const theme = RANK_THEMES[tierCategory] || RANK_THEMES.herald;
    const isFirst = position === 1;

    const positionConfig = {
        1: { size: 'w-52 md:w-60', height: 'h-72 md:h-80', avatar: 'w-24 h-24 md:w-28 md:h-28', crownSize: 'h-8 w-8', shadowIntensity: 'shadow-2xl' },
        2: { size: 'w-44 md:w-48', height: 'h-56 md:h-64', avatar: 'w-18 h-18 md:w-20 md:h-20', crownSize: 'h-6 w-6', shadowIntensity: 'shadow-xl' },
        3: { size: 'w-44 md:w-48', height: 'h-56 md:h-64', avatar: 'w-18 h-18 md:w-20 md:h-20', crownSize: 'h-6 w-6', shadowIntensity: 'shadow-xl' },
    }[position]!;

    const medalColors = {
        1: { main: '#FFD700', secondary: '#FFA500', glow: 'rgba(255, 215, 0, 0.4)' },
        2: { main: '#C0C0C0', secondary: '#A0A0A0', glow: 'rgba(192, 192, 192, 0.3)' },
        3: { main: '#CD7F32', secondary: '#B87333', glow: 'rgba(205, 127, 50, 0.3)' },
    }[position]!;

    return (
        <Link href={`/profile/${player.steamId}`}>
            <motion.div
                className={`relative ${positionConfig.size} ${positionConfig.height} rounded-2xl bg-gradient-to-b ${theme.bg} border ${theme.border}/50 backdrop-blur-sm flex flex-col items-center justify-between p-4 cursor-pointer group ${positionConfig.shadowIntensity} ${theme.glow}`}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                {/* Animated glow for #1 */}
                {isFirst && (
                    <motion.div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-b from-yellow-500/20 to-transparent"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                )}

                {/* Position badge */}
                <div className="absolute top-3 left-3 text-2xl font-black" style={{ color: medalColors.main, textShadow: `0 0 20px ${medalColors.glow}` }}>
                    #{position}
                </div>

                {/* Avatar Section with Crown/Medal overlay */}
                <div className="relative mt-6">
                    {/* Crown/Medal on top */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                        {position === 1 ? (
                            <motion.div
                                animate={{ y: [0, -3, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Crown className={positionConfig.crownSize} style={{ color: medalColors.main, filter: `drop-shadow(0 0 8px ${medalColors.glow})` }} />
                            </motion.div>
                        ) : (
                            <Medal className={positionConfig.crownSize} style={{ color: medalColors.main, filter: `drop-shadow(0 0 6px ${medalColors.glow})` }} />
                        )}
                    </div>

                    {/* Avatar with animated border */}
                    <div className={`relative ${positionConfig.avatar}`}>
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: `conic-gradient(from 0deg, ${medalColors.main}, ${medalColors.secondary}, ${medalColors.main})`,
                                padding: '3px'
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        >
                            <div className="w-full h-full rounded-full bg-background" />
                        </motion.div>
                        <img
                            src={player.avatar}
                            alt={player.name}
                            className="absolute inset-[3px] rounded-full object-cover"
                        />

                        {/* Rank badge on avatar */}
                        <div className="absolute -bottom-1 -right-1 z-10">
                            <Badge variant={tierCategory as any} className="text-[9px] px-1.5 py-0.5 shadow-lg">
                                {TIER_NAMES[tier].split(' ')[0]}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Player Info */}
                <div className="text-center space-y-2 mt-auto">
                    <h3 className="font-bold text-base md:text-lg truncate max-w-full">{player.name}</h3>
                    <div className="flex items-center justify-center gap-1.5 text-lg md:text-xl font-bold" style={{ color: medalColors.main }}>
                        <Trophy className="h-5 w-5" />
                        <span>{player.tmmr}</span>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                        <span>{player.wins + player.losses} jogos</span>
                        <span className="text-white/20">•</span>
                        {player.streak > 0 ? (
                            <span className="flex items-center gap-1 text-orange-400">
                                <Flame className="h-3 w-3" />{player.streak}
                            </span>
                        ) : player.streak < 0 ? (
                            <span className="flex items-center gap-1 text-red-400">
                                <ChevronDown className="h-3 w-3" />{Math.abs(player.streak)}
                            </span>
                        ) : (
                            <span>0</span>
                        )}
                    </div>
                </div>

                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
        </Link>
    );
}

function LeaderboardRow({ player, position, isNearTop, isHovered, onHover, onLeave }: {
    player: any;
    position: number;
    isNearTop: boolean;
    isHovered: boolean;
    onHover: () => void;
    onLeave: () => void;
}) {
    const tier = getTier(player.tmmr);
    const tierCategory = getTierCategory(tier);
    const winrate = Math.round((player.wins / (player.wins + player.losses)) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (position - 4) * 0.05 }}
        >
            <Link
                href={`/profile/${player.steamId}`}
                className={`grid grid-cols-12 gap-3 px-4 py-3 items-center transition-all relative group ${isNearTop ? 'bg-primary/5' : ''} hover:bg-white/5`}
                onMouseEnter={onHover}
                onMouseLeave={onLeave}
            >
                {/* Near top indicator */}
                {isNearTop && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-orange-500" />
                )}

                {/* Position */}
                <div className="col-span-1 text-center">
                    <span className={`font-bold ${isNearTop ? 'text-primary' : 'text-muted-foreground'}`}>
                        #{position}
                    </span>
                </div>

                {/* Player */}
                <div className="col-span-5 flex items-center gap-3">
                    <div className="relative">
                        <img
                            src={player.avatar}
                            alt={player.name}
                            className="w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-primary/50 transition-colors"
                        />
                    </div>
                    <div className="min-w-0">
                        <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            {player.name}
                        </div>
                        <Badge variant={tierCategory as any} className="text-[9px]">
                            {TIER_NAMES[tier]}
                        </Badge>
                    </div>
                </div>

                {/* Matches */}
                <div className="col-span-2 text-center text-sm text-muted-foreground hidden md:flex items-center justify-center gap-1">
                    <Gamepad2 className="h-3 w-3" />
                    {player.wins + player.losses}
                </div>

                {/* Streak */}
                <div className="col-span-2 flex items-center justify-center">
                    {player.streak > 0 ? (
                        <div className="flex items-center gap-1 text-orange-400 font-medium">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                <Flame className="h-4 w-4" />
                            </motion.div>
                            <span>+{player.streak}</span>
                        </div>
                    ) : player.streak < 0 ? (
                        <div className="flex items-center gap-1 text-red-400 font-medium">
                            <TrendingDown className="h-4 w-4" />
                            <span>{player.streak}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )}
                </div>

                {/* TMMR */}
                <div className="col-span-2 text-right">
                    <div className="font-bold text-primary flex items-center justify-end gap-1">
                        <Trophy className="h-4 w-4" />
                        <span>{player.tmmr}</span>
                    </div>
                </div>

                {/* Hover tooltip */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            className="absolute right-4 -top-12 bg-card border border-white/10 rounded-lg px-3 py-2 shadow-xl z-50"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            <div className="text-xs space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">Winrate:</span>
                                    <span className={winrate >= 50 ? 'text-green-400' : 'text-red-400'}>{winrate}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">W/L:</span>
                                    <span>{player.wins}/{player.losses}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Link>
        </motion.div>
    );
}
