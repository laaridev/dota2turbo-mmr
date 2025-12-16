'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { Trophy, TrendingUp, Target, Star, Zap, Info, Swords, ShieldCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { RankingInfoModal } from '@/components/ranking-info-modal';

const RANKING_MODES = [
    { id: 'general', label: 'Geral', icon: Trophy, description: 'TMMR Principal' },
    { id: 'winrate', label: 'Winrate', icon: TrendingUp, description: 'Taxa de Vitória' },
    { id: 'performance', label: 'Performance', icon: Target, description: 'KDA Médio' },
    { id: 'specialist', label: 'Especialistas', icon: Swords, description: 'Heróis', premium: true },
    { id: 'pro', label: 'Alto Nível', icon: Star, description: 'Rank 60+', premium: true },
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
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

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
                    <div className="flex gap-2 min-w-max pb-2 justify-center">
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
                    <button
                        onClick={() => setIsInfoModalOpen(true)}
                        className="ml-2 px-2.5 py-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors flex items-center gap-1.5 text-sm"
                        title="Como funciona este ranking?"
                    >
                        <span className="font-medium">Como funciona</span>
                        <Info className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-muted-foreground ml-auto">
                        {filteredPlayers.length} jogadores
                    </span>
                </div>

                {/* Info Modal */}
                <RankingInfoModal
                    isOpen={isInfoModalOpen}
                    onClose={() => setIsInfoModalOpen(false)}
                    mode={rankingMode}
                />

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
    const totalGames = (player.wins || 0) + (player.losses || 0);

    // Get the metric value based on ranking mode
    let metricValue = '';
    let metricLabel = '';

    switch (rankingMode) {
        case 'winrate':
            const wr = player.winrate ?? ((player.wins || 0) / Math.max(1, totalGames) * 100);
            metricValue = `${wr.toFixed(1)}%`;
            metricLabel = 'WR';
            break;
        case 'performance':
            metricValue = (player.avgKDA ?? 0).toFixed(2);
            metricLabel = 'KDA';
            break;
        case 'consistency':
            metricValue = (player.kdaVariance ?? 0).toFixed(2);
            metricLabel = 'Variância';
            break;
        case 'specialist':
            metricValue = `${(player.bestHeroWinrate ?? 0).toFixed(1)}%`;
            metricLabel = `${player.bestHeroGames || 0} jogos`;
            break;
        case 'pro':
            metricValue = `${(player.proWinrate ?? 0).toFixed(1)}%`;
            metricLabel = `${player.proGames || 0} jogos PRO`;
            break;
        default:
            metricValue = (player.tmmr || 0).toString();
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
                transition={{ delay: Math.min(position * 0.03, 0.4) }}
                className={`flex items-center gap-4 p-4 rounded-2xl border ${bgClass} hover:bg-white/5 hover:border-primary/20 hover:scale-[1.01] transition-all cursor-pointer group backdrop-blur-sm mb-3 shadow-sm`}
            >
                {/* Position Badge */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${position === 1 ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/50' :
                    position === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-400/50' :
                        position === 3 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white shadow-lg shadow-amber-700/50' :
                            'bg-white/5 text-muted-foreground'
                    }`}>
                    {position}
                </div>

                {/* Avatar or Hero Image */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-white/10">
                    {rankingMode === 'specialist' ? (
                        player.bestHeroId && player.bestHeroId > 0 ? (
                            <img
                                src={`https://api.opendota.com/api/heroes/${player.bestHeroId}/icon`}
                                alt={`Hero ${player.bestHeroId}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                    console.error('Hero icon failed for:', player.name, 'heroId:', player.bestHeroId);
                                    (e.target as HTMLImageElement).src = player.avatar;
                                }}
                            />
                        ) : (
                            <>
                                {console.log('No hero ID for', player.name, player.bestHeroId)}
                                <img
                                    src={player.avatar}
                                    alt={player.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                            </>
                        )
                    ) : (
                        <img
                            src={player.avatar}
                            alt={player.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                    )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <span className={`font-bold text-base truncate group-hover:text-primary transition-colors ${position <= 3 ? 'text-white' : 'text-gray-200'}`}>
                            {player.name}
                        </span>

                        {/* Badges Row */}
                        <div className="flex items-center gap-1.5">
                            {/* Confidence Badge */}
                            {player.confidenceScore !== undefined && (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger>
                                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${player.confidenceScore > 0.8 ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'}`}>
                                                <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                                                <span className="text-[10px] font-semibold tabular-nums">{(player.confidenceScore * 100).toFixed(0)}%</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p>Confiança: {(player.confidenceScore * 100).toFixed(0)}%</p>
                                            <p className="text-xs text-gray-400">Baseado em {totalGames} jogos</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}

                            {/* Difficulty Badge - Only for high difficulty exposure */}
                            {player.difficultyExposure !== undefined && player.difficultyExposure > 1.1 && (
                                <TooltipProvider>
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger>
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                                <Swords className="w-3 h-3 flex-shrink-0" />
                                                <span className="text-[10px] font-semibold tabular-nums">+{((player.difficultyExposure - 1) * 100).toFixed(0)}%</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <p>Bônus de Dificuldade</p>
                                            <p className="text-xs text-gray-400">Joga contra adversários de alto nível</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                            <Swords className="w-3 h-3" /> {totalGames} jogos
                        </span>
                    </div>
                </div>

                {/* Metric Value */}
                <div className="text-right flex flex-col items-end gap-0.5 justify-center">
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div className={`font-black text-lg tabular-nums tracking-tight cursor-help ${position === 1 ? 'text-amber-400' : 'text-white'}`}>
                                    {metricValue}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>{rankingMode === 'winrate' ? 'Taxa de Vitória exata' : 'Pontuação atual'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {rankingMode === 'general' ? (
                        <Badge variant={category as any} className="text-[10px] px-2 h-5 font-medium shadow-sm">
                            {metricLabel}
                        </Badge>
                    ) : (
                        <span className="text-[10px] text-muted-foreground font-medium">{metricLabel}</span>
                    )}
                </div>
            </motion.div>
        </Link>
    );
}
