'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { Trophy, TrendingUp, Target, Activity, Star, Zap } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const RANKING_MODES = [
    { id: 'general', label: 'Geral', icon: Trophy, description: 'TMMR Principal' },
    { id: 'winrate', label: 'Winrate', icon: TrendingUp, description: 'Taxa de Vitória' },
    { id: 'performance', label: 'Performance', icon: Target, description: 'KDA Médio' },
    { id: 'consistency', label: 'Consistência', icon: Activity, description: 'Estabilidade' },
    { id: 'pro', label: 'PRO', icon: Star, description: 'Alto Nível (Rank 65+)', premium: true },
];

export default function LeaderboardPage() {
    return (
        <Suspense fallback={<LeaderboardSkeleton />}>
            <LeaderboardContent />
        </Suspense>
    );
}

function LeaderboardSkeleton() {
    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="space-y-2">
                {[...Array(15)].map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

function LeaderboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const searchQuery = searchParams.get('search') || '';
    const currentPeriod = searchParams.get('period') || 'all';
    const rankingMode = searchParams.get('mode') || 'general';

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/leaderboard?period=${currentPeriod}&mode=${rankingMode}&limit=100`);
                const data = await res.json();
                setPlayers(data.players || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [currentPeriod, rankingMode]);

    const filteredPlayers = useMemo(() => {
        if (!searchQuery.trim()) return players;
        const query = searchQuery.toLowerCase();
        return players.filter(p => p.name.toLowerCase().includes(query));
    }, [players, searchQuery]);

    const handleModeChange = (mode: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('mode', mode);
        router.push(`/leaderboard?${params.toString()}`);
    };

    if (loading) {
        return <LeaderboardSkeleton />;
    }

    const currentMode = RANKING_MODES.find(m => m.id === rankingMode) || RANKING_MODES[0];

    return (
        <>
            {/* Background glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none z-0" />

            {/* Main content */}
            <div className="container mx-auto px-4 py-6 max-w-4xl relative z-10">
                {/* Ranking Mode Tabs */}
                <div className="mb-6 overflow-x-auto">
                    <div className="flex gap-2 min-w-max pb-2">
                        {RANKING_MODES.map((mode) => {
                            const Icon = mode.icon;
                            const isActive = rankingMode === mode.id;
                            return (
                                <button
                                    key={mode.id}
                                    onClick={() => handleModeChange(mode.id)}
                                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${isActive
                                            ? mode.premium
                                                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 text-amber-400'
                                                : 'bg-primary/20 border-2 border-primary text-primary'
                                            : 'bg-card/40 border border-white/10 text-muted-foreground hover:bg-white/5'
                                        }`}
                                >
                                    {mode.premium && isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg animate-pulse" />
                                    )}
                                    <Icon className={`h-4 w-4 ${mode.premium && isActive ? 'animate-pulse' : ''}`} />
                                    <div className="text-left relative z-10">
                                        <div className="font-semibold text-sm flex items-center gap-1">
                                            {mode.label}
                                            {mode.premium && <Zap className="h-3 w-3 text-amber-400" />}
                                        </div>
                                        <div className="text-[10px] opacity-70">{mode.description}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <currentMode.icon className={`h-5 w-5 ${currentMode.premium ? 'text-amber-400' : 'text-primary'}`} />
                    <h1 className="text-xl font-bold text-white">Ranking {currentMode.label}</h1>
                    <span className="text-sm text-muted-foreground ml-auto">
                        {filteredPlayers.length} jogadores
                    </span>
                </div>

                {/* Single unified list */}
                <div className="space-y-3">
                    {filteredPlayers.map((player, index) => (
                        <PlayerRow
                            key={player.steamId}
                            player={player}
                            position={index + 1}
                            isTopThree={index < 3}
                            rankingMode={rankingMode}
                        />
                    ))}
                    {filteredPlayers.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            Nenhum jogador encontrado
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function PlayerRow({ player, position, isTopThree, rankingMode }: {
    player: any;
    position: number;
    isTopThree: boolean;
    rankingMode: string;
}) {
    const tier = getTier(player.tmmr);
    const category = getTierCategory(tier);
    const totalGames = player.wins + player.losses;

    // Get the metric value based on ranking mode
    let metricValue = '';
    let metricLabel = '';

    switch (rankingMode) {
        case 'winrate':
            metricValue = `${player.winrate?.toFixed(1)}%`;
            metricLabel = 'WR';
            break;
        case 'performance':
            metricValue = player.avgKDA?.toFixed(2) || '0';
            metricLabel = 'KDA';
            break;
        case 'consistency':
            metricValue = player.kdaVariance?.toFixed(2) || '0';
            metricLabel = 'Variância';
            break;
        case 'pro':
            metricValue = `${player.proWinrate?.toFixed(1)}%`;
            metricLabel = `${player.proGames} jogos PRO`;
            break;
        default:
            metricValue = player.tmmr?.toString() || '0';
            metricLabel = TIER_NAMES[tier];
            break;
    }

    const bgClass = position === 1 ? 'bg-gradient-to-r from-amber-500/20 to-transparent border-amber-500/40' :
        position === 2 ? 'bg-gradient-to-r from-gray-400/15 to-transparent border-gray-400/30' :
            position === 3 ? 'bg-gradient-to-r from-amber-700/15 to-transparent border-amber-700/30' :
                'bg-card/40 border-white/5';

    return (
        <Link href={`/profile/${player.steamId}`}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(position * 0.02, 0.3) }}
                className={`flex items-center gap-3 p-3 rounded-xl border ${bgClass} hover:bg-white/5 hover:border-primary/30 transition-all cursor-pointer group ${isTopThree ? 'shadow-lg' : ''}`}
            >
                {/* Position Badge */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${position === 1 ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/50' :
                        position === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-400/50' :
                            position === 3 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white shadow-lg shadow-amber-700/50' :
                                'bg-white/5 text-muted-foreground'
                    }`}>
                    {position}
                </div>

                {/* Avatar */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-white/10">
                    <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-base truncate group-hover:text-primary transition-colors">
                        {player.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{totalGames} jogos</span>
                    </div>
                </div>

                {/* Metric Value */}
                <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="font-bold text-white text-lg">{metricValue}</div>
                    {rankingMode === 'general' ? (
                        <Badge variant={category as any} className="text-[10px] px-2 h-5">
                            {metricLabel}
                        </Badge>
                    ) : (
                        <span className="text-[10px] text-muted-foreground">{metricLabel}</span>
                    )}
                </div>
            </motion.div>
        </Link>
    );
}
