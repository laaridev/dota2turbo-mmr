'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PrivateProfileModal } from '@/components/private-profile-modal';
import { Portal } from '@/components/portal';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { HERO_NAMES, getHeroImageUrl } from '@/lib/heroes';
import { RefreshCw, Shield, Swords, Timer, Trophy, Flame, Clock, Target, TrendingUp, TrendingDown, Gamepad2, BarChart3, Zap, Activity, Sparkles, Award, AlertTriangle, HelpCircle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

type Player = {
    steamId: string;
    name: string;
    avatar: string;
    tmmr: number;
    wins: number;
    losses: number;
    streak: number;
    lastUpdate: string;
    confidenceScore?: number;
    difficultyExposure?: number;
    avgKDA?: number;
    avgRankPlayed?: number;
    winrate?: number;
};

type HeroStat = { heroId: number; games: number; wins: number; winrate: number; avgKDA: string };
type DailyStat = { date: string; wins: number; losses: number };
type RecentMatch = {
    matchId: number;
    heroId: number;
    win: boolean;
    kda: string;
    duration: number;
    tmmrChange: number;
    timestamp?: string;
    averageRank?: number;
};
type RankDistribution = {
    tier: string;
    games: number;
    wins: number;
    losses: number;
    winrate: number;
    points: number;
};
type TMMRBreakdown = {
    games: number;
    wins: number;
    losses: number;
    winrate: number;
    weightedWins: number;
    expectedWins: number;
    performanceScore: number;
    avgRank: number;
    avgMultiplier: number;
    maturityPenalty: number;
    rawTMMR: number;
    finalTMMR: number;
};
type MatchData = {
    heroStats: HeroStat[];
    performance: { avgKDA: string; avgDuration: number; positiveKDA: number };
    recentMatches: RecentMatch[];
    dailyStats: DailyStat[];
    rankDistribution: RankDistribution[];
    tmmrBreakdown: TMMRBreakdown | null;
    totalMatches: number;
};

export default function ProfilePage() {
    const params = useParams();
    const id = params.id as string;
    const [player, setPlayer] = useState<Player | null>(null);
    const [matchData, setMatchData] = useState<MatchData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lockTimer, setLockTimer] = useState<number | null>(null);
    const [showPrivateModal, setShowPrivateModal] = useState(false);
    const [chartDays, setChartDays] = useState<7 | 15 | 30>(30);
    const [showTMMRExplanation, setShowTMMRExplanation] = useState(false);

    const fetchProfile = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 429 && data.player) { setPlayer(data.player); setLockTimer(data.remainingDays); }
                else if (res.status === 403 && data.isPrivate) { setShowPrivateModal(true); setError('Perfil privado'); }
                else { setError(data.error || 'Erro'); }
            } else { setPlayer(data.player); }
        } catch { setError('Erro de conexão'); }
        finally { setLoading(false); }
    };

    const fetchMatches = async () => {
        try {
            const res = await fetch(`/api/player/${id}/matches`);
            if (res.ok) setMatchData(await res.json());
        } catch (err) { console.error(err); }
    };

    useEffect(() => { if (id) { fetchProfile(); fetchMatches(); } }, [id]);

    if (loading && !player) return <LoadingSkeleton />;
    if (error && !player) {
        return (
            <>
                <PrivateProfileModal isOpen={showPrivateModal} onClose={() => setShowPrivateModal(false)} />
                <ErrorState error={error} showPrivateModal={showPrivateModal} onShowModal={() => setShowPrivateModal(true)} />
            </>
        );
    }
    if (!player) return null;

    const tier = getTier(player.tmmr);
    const winrate = ((player.wins / (player.wins + player.losses || 1)) * 100).toFixed(1);
    const filteredDailyStats = matchData?.dailyStats.slice(-chartDays) || [];
    const breakdown = matchData?.tmmrBreakdown;

    return (
        <div className="min-h-screen relative">
            {/* Noise texture */}
            <div className="fixed inset-0 opacity-[0.015] pointer-events-none z-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

            {/* Radial glow */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto p-4 space-y-6 pb-20 max-w-5xl relative z-10">
                <PrivateProfileModal isOpen={showPrivateModal} onClose={() => setShowPrivateModal(false)} />

                {/* Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/80 border border-white/[0.08] shadow-xl shadow-black/20 p-6"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                    <div className="flex flex-col md:flex-row items-center gap-5 relative">
                        <div className="relative group">
                            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <img src={player.avatar} alt={player.name} className="h-24 w-24 rounded-full border-2 border-primary/40 shadow-lg relative z-10" />
                            <div className="absolute -bottom-1 -right-1 z-20">
                                <Badge variant={getTierCategory(tier) as any} className="text-xs px-2 shadow-lg">{TIER_NAMES[tier]}</Badge>
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{player.name}</h1>
                            <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mt-2">
                                <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-primary" /><span className="font-semibold text-foreground">{player.tmmr}</span> TMMR</span>
                                <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" />ID: {player.steamId}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 text-center">
                            {lockTimer ? (
                                <Button variant="secondary" disabled size="sm" className="shadow-md"><Timer className="mr-2 h-4 w-4" />Atualiza em {lockTimer}d</Button>
                            ) : (
                                <Button onClick={fetchProfile} size="sm" disabled={loading} className="shadow-md shadow-primary/20">{loading ? 'Analisando...' : <><RefreshCw className="mr-2 h-4 w-4" />Atualizar</>}</Button>
                            )}
                            <p className="text-xs text-muted-foreground">Atualizado {formatDistanceToNow(new Date(player.lastUpdate), { locale: ptBR, addSuffix: true })}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard icon={<Swords />} value={player.wins + player.losses} label="Partidas" color="blue" />
                    <StatCard icon={<Trophy />} value={`${winrate}%`} label="Winrate" color="yellow" />
                    <StatCard icon={<TrendingUp />} value={player.wins} label="Vitórias" subValue={`${player.losses} derrotas`} color="green" />
                    <StatCard icon={<Award />} value={breakdown?.avgRank?.toFixed(0) || '?'} label="Rank Médio" subValue={`${breakdown?.avgMultiplier?.toFixed(2) || '1.00'}x mult`} color="orange" />
                </div>

                {/* TMMR v5.2 Breakdown Section */}
                {breakdown && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                    >
                        <PremiumCard>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-primary" />
                                        Como seu TMMR foi calculado
                                    </h3>
                                    <button
                                        onClick={() => setShowTMMRExplanation(true)}
                                        className="text-xs text-primary/80 hover:text-primary transition-colors flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-lg border border-primary/20 hover:border-primary/40"
                                    >
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            <HelpCircle className="h-3.5 w-3.5" />
                                        </motion.div>
                                        Como funciona?
                                    </button>
                                </div>
                                <Badge variant="outline" className="text-xs">v5.2</Badge>
                            </div>

                            {/* Main Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left: Stats Cards */}
                                <div className="space-y-3">
                                    {/* Your weighted wins */}
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Sparkles className="w-3 h-3 text-emerald-400" />
                                            <span className="text-xs text-muted-foreground">Suas vitórias</span>
                                        </div>
                                        <p className="text-xl font-bold text-emerald-400">{breakdown.weightedWins}</p>
                                        <p className="text-[10px] text-muted-foreground">créditos de vitória</p>
                                    </div>

                                    {/* Expected */}
                                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Target className="w-3 h-3 text-blue-400" />
                                            <span className="text-xs text-muted-foreground">Esperado (50%)</span>
                                        </div>
                                        <p className="text-xl font-bold text-blue-400">{breakdown.expectedWins}</p>
                                        <p className="text-[10px] text-muted-foreground">{breakdown.games} jogos × 0.5</p>
                                    </div>

                                    {/* Performance explanation */}
                                    <div className={`p-3 rounded-xl ${breakdown.performanceScore >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className={`w-4 h-4 ${breakdown.performanceScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
                                                <span className="text-sm font-medium">
                                                    {breakdown.performanceScore >= 0 ? 'Você superou o esperado!' : 'Abaixo do esperado'}
                                                </span>
                                            </div>
                                            <span className={`text-lg font-bold ${breakdown.performanceScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {breakdown.performanceScore >= 0 ? '+' : ''}{(breakdown.performanceScore * 3500).toFixed(0)} pts
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {breakdown.performanceScore >= 0
                                                ? `${(breakdown.weightedWins - breakdown.expectedWins).toFixed(1)} créditos acima do esperado → +${(breakdown.performanceScore * 3500).toFixed(0)} TMMR`
                                                : `${(breakdown.expectedWins - breakdown.weightedWins).toFixed(1)} créditos abaixo do esperado → ${(breakdown.performanceScore * 3500).toFixed(0)} TMMR`
                                            }
                                        </p>
                                    </div>

                                    {/* Maturity Penalty */}
                                    {breakdown.maturityPenalty > 0 && (
                                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                                    <span className="text-sm font-medium">Penalidade de Maturidade</span>
                                                </div>
                                                <span className="text-lg font-bold text-amber-400">-{breakdown.maturityPenalty}</span>
                                            </div>
                                            <div className="mt-2">
                                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                    <span>{breakdown.games} jogos</span>
                                                    <span>200 jogos</span>
                                                </div>
                                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-amber-400 rounded-full"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min((breakdown.games / 200) * 100, 100)}%` }}
                                                        transition={{ duration: 0.5 }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    Jogue mais {200 - breakdown.games} partidas para remover esta penalidade
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right: Premium TMMR Final Card */}
                                <div className="flex flex-col h-full">
                                    <div className="relative flex-1 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 overflow-hidden flex flex-col">
                                        {/* Glow effects */}
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

                                        <div className="relative z-10 flex-1 flex flex-col">
                                            {/* Header with tier badge */}
                                            <div className="text-center mb-4">
                                                <Badge className="mb-2 bg-primary/20 text-primary border-primary/30">
                                                    {TIER_NAMES[getTier(breakdown.finalTMMR)]}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground uppercase tracking-widest">TMMR Final</p>
                                            </div>

                                            {/* TMMR Value */}
                                            <div className="text-center mb-6 flex-1 flex flex-col justify-center">
                                                <div className="relative inline-block">
                                                    <motion.p
                                                        className="text-6xl font-black bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent"
                                                        initial={{ scale: 0.9, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ delay: 0.2, duration: 0.5 }}
                                                    >
                                                        {breakdown.finalTMMR}
                                                    </motion.p>
                                                    <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full -z-10" />
                                                </div>

                                                {/* Quick stats row */}
                                                <div className="flex justify-center gap-4 mt-4">
                                                    <div className="text-center">
                                                        <p className="text-lg font-bold text-white">{winrate}%</p>
                                                        <p className="text-[10px] text-muted-foreground">Winrate</p>
                                                    </div>
                                                    <div className="w-px bg-white/10" />
                                                    <div className="text-center">
                                                        <p className="text-lg font-bold text-white">{breakdown.games}</p>
                                                        <p className="text-[10px] text-muted-foreground">Partidas</p>
                                                    </div>
                                                    <div className="w-px bg-white/10" />
                                                    <div className="text-center">
                                                        <p className="text-lg font-bold text-white">{breakdown.avgMultiplier?.toFixed(2) || '1.00'}x</p>
                                                        <p className="text-[10px] text-muted-foreground">Mult. Médio</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Calculation breakdown */}
                                            <div className="space-y-1.5 text-sm bg-black/30 rounded-xl p-4 backdrop-blur-sm">
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>Base</span>
                                                    <span className="font-mono">3500</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Performance</span>
                                                    <span className={`font-mono font-semibold ${breakdown.performanceScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {breakdown.performanceScore >= 0 ? '+' : ''}{(breakdown.performanceScore * 3500).toFixed(0)}
                                                    </span>
                                                </div>
                                                {breakdown.maturityPenalty > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Maturidade</span>
                                                        <span className="font-mono font-semibold text-amber-400">-{breakdown.maturityPenalty}</span>
                                                    </div>
                                                )}
                                                <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                                                    <span>Total</span>
                                                    <span className="font-mono text-xl text-primary">{breakdown.finalTMMR}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>
                    </motion.div>
                )}

                {/* TMMR Explanation Modal */}
                <TMMRExplanationModal
                    isOpen={showTMMRExplanation}
                    onClose={() => setShowTMMRExplanation(false)}
                />

                {/* Rank Distribution Chart */}
                {matchData && matchData.rankDistribution && matchData.rankDistribution.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <PremiumCard>
                            <h3 className="font-semibold flex items-center gap-2 mb-4">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                Distribuição por Tier de Rank
                            </h3>

                            <div className="space-y-3">
                                {matchData.rankDistribution.map((tier, i) => {
                                    const maxGames = Math.max(...matchData.rankDistribution.map(t => t.games));
                                    const widthPercent = (tier.games / maxGames) * 100;
                                    const tierColors: Record<string, string> = {
                                        'Herald': 'from-zinc-500 to-zinc-600',
                                        'Guardian': 'from-zinc-400 to-zinc-500',
                                        'Crusader': 'from-lime-600 to-lime-700',
                                        'Archon': 'from-yellow-500 to-yellow-600',
                                        'Legend': 'from-yellow-400 to-amber-500',
                                        'Ancient': 'from-cyan-500 to-cyan-600',
                                        'Divine': 'from-fuchsia-500 to-fuchsia-600',
                                        'Immortal': 'from-amber-400 to-red-500',
                                    };

                                    return (
                                        <motion.div
                                            key={tier.tier}
                                            className="relative"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 + i * 0.05 }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-20 text-sm font-medium">{tier.tier}</span>
                                                <div className="flex-1 h-8 bg-white/5 rounded-lg overflow-hidden relative">
                                                    <motion.div
                                                        className={`h-full bg-gradient-to-r ${tierColors[tier.tier] || 'from-primary to-primary/80'} rounded-lg`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${widthPercent}%` }}
                                                        transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
                                                    />
                                                    <div className="absolute inset-0 flex items-center px-3">
                                                        <span className="text-xs font-bold drop-shadow-lg">
                                                            {tier.games} jogos • {tier.winrate}% WR
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-24 text-right">
                                                    <span className="text-sm font-bold text-emerald-400">+{tier.points}</span>
                                                    <span className="text-[10px] text-muted-foreground"> créditos</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Summary and Explanation */}
                            <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                    <div className="text-center p-2 rounded-lg bg-emerald-500/10">
                                        <p className="text-[10px] text-muted-foreground">Seus Créditos</p>
                                        <p className="text-lg font-bold text-emerald-400">
                                            {matchData.rankDistribution.reduce((sum, t) => sum + t.points, 0).toFixed(1)}
                                        </p>
                                    </div>
                                    <div className="text-center p-2 rounded-lg bg-blue-500/10">
                                        <p className="text-[10px] text-muted-foreground">Esperado (50% WR)</p>
                                        <p className="text-lg font-bold text-blue-400">
                                            {breakdown?.expectedWins?.toFixed(1) || '—'}
                                        </p>
                                    </div>
                                    <div className="text-center p-2 rounded-lg bg-primary/10">
                                        <p className="text-[10px] text-muted-foreground">Diferença ÷ Jogos</p>
                                        <p className="text-lg font-bold text-primary">
                                            {breakdown ? `${breakdown.performanceScore >= 0 ? '+' : ''}${(breakdown.performanceScore * 3500).toFixed(0)}` : '—'} TMMR
                                        </p>
                                    </div>
                                </div>
                                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                                    <strong className="text-white">Créditos ≠ TMMR.</strong> Cada vitória gera créditos (mais em lobbies difíceis).
                                    O bônus de TMMR é calculado pela diferença entre seus créditos e o esperado, dividida pelo número de jogos.
                                </p>
                            </div>
                        </PremiumCard>
                    </motion.div>
                )}

                {/* Daily Chart */}
                {matchData && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <PremiumCard>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Partidas por Dia</h3>
                                <div className="flex gap-1 bg-secondary/50 rounded-lg p-0.5">
                                    {[7, 15, 30].map((d) => (
                                        <button key={d} onClick={() => setChartDays(d as 7 | 15 | 30)} className={`px-3 py-1 text-xs rounded-md transition-all ${chartDays === d ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{d}d</button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-end gap-[2px] h-28">
                                {filteredDailyStats.map((day, i) => {
                                    const total = day.wins + day.losses;
                                    const maxTotal = Math.max(...filteredDailyStats.map(d => d.wins + d.losses), 1);
                                    const height = total > 0 ? (total / maxTotal) * 100 : 0;
                                    const winPercent = total > 0 ? (day.wins / total) * 100 : 0;
                                    return (
                                        <motion.div
                                            key={day.date}
                                            className="flex-1 group relative cursor-pointer h-full flex flex-col justify-end"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.02, duration: 0.3 }}
                                        >
                                            {total > 0 ? (
                                                <div className="w-full rounded-t overflow-hidden group-hover:brightness-125 transition-all relative" style={{ height: `${height}%`, minHeight: '4px' }}>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-600 to-zinc-500" style={{ height: `${100 - winPercent}%` }} />
                                                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-t from-primary to-orange-400" style={{ height: `${winPercent}%` }} />
                                                </div>
                                            ) : (
                                                <div className="w-full h-1 bg-white/10 rounded-t" />
                                            )}
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block bg-card/95 backdrop-blur border border-white/10 rounded-lg px-2 py-1 text-xs whitespace-nowrap z-20 shadow-xl">
                                                <span className="text-emerald-400">{day.wins}W</span> / <span className="text-rose-400">{day.losses}L</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground mt-2 px-1">
                                <span>{filteredDailyStats[0]?.date.slice(5)}</span>
                                <span>{filteredDailyStats[filteredDailyStats.length - 1]?.date.slice(5)}</span>
                            </div>
                        </PremiumCard>
                    </motion.div>
                )}

                {/* Two columns: Performance + Heroes */}
                {matchData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Performance */}
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                            <PremiumCard className="h-full">
                                <h3 className="font-semibold flex items-center gap-2 mb-4"><Target className="h-4 w-4 text-primary" />Desempenho Turbo</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <MetricCard icon={<Zap className="text-primary" />} value={matchData.performance.avgKDA} label="KDA Médio" glow="primary" />
                                    <MetricCard icon={<Clock className="text-blue-400" />} value={`${Math.floor(matchData.performance.avgDuration / 60)}m`} label="Duração Média" />
                                    <MetricCard icon={<TrendingUp className="text-emerald-400" />} value={`${Math.round((matchData.performance.positiveKDA / matchData.totalMatches) * 100)}%`} label="KDA Positivo" glow="green" />
                                    <MetricCard icon={<Swords className="text-violet-400" />} value={matchData.totalMatches.toString()} label="Total Partidas" />
                                </div>
                            </PremiumCard>
                        </motion.div>

                        {/* Heroes */}
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <PremiumCard className="h-full">
                                <h3 className="font-semibold flex items-center gap-2 mb-3"><Gamepad2 className="h-4 w-4 text-primary" />Heróis Mais Jogados</h3>
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {matchData.heroStats.map((hero, i) => (
                                        <motion.div
                                            key={hero.heroId}
                                            className="group flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.08] transition-all cursor-pointer"
                                            whileHover={{ x: 4 }}
                                        >
                                            <span className={`text-xs font-bold w-5 ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>#{i + 1}</span>
                                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10">
                                                <img src={getHeroImageUrl(hero.heroId)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">{HERO_NAMES[hero.heroId] || `Hero ${hero.heroId}`}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${hero.winrate}%` }} transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }} />
                                                    </div>
                                                    <span className={`text-xs font-medium ${hero.winrate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{hero.winrate}%</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold">{hero.games}</div>
                                                <div className="text-[10px] text-muted-foreground">{hero.avgKDA}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </PremiumCard>
                        </motion.div>
                    </div>
                )}

                {/* Recent Matches */}
                {matchData && matchData.recentMatches.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <PremiumCard>
                            <h3 className="font-semibold flex items-center gap-2 mb-3"><Clock className="h-4 w-4 text-primary" />Partidas Recentes</h3>
                            <div className="space-y-2">
                                {matchData.recentMatches.map((match, i) => (
                                    <RecentMatchCard key={match.matchId} match={match} index={i} />
                                ))}
                            </div>
                        </PremiumCard>
                    </motion.div>
                )}

                <p className="text-xs text-center text-muted-foreground">
                    Estatísticas baseadas em {matchData?.totalMatches || 0} partidas Turbo.
                </p>
            </div>
        </div >
    );
}

// Components
function RecentMatchCard({ match, index }: { match: RecentMatch; index: number }) {
    const tierName = match.averageRank ? (
        match.averageRank >= 70 ? 'Immortal' :
            match.averageRank >= 60 ? 'Divine' :
                match.averageRank >= 50 ? 'Ancient' :
                    match.averageRank >= 40 ? 'Legend' :
                        match.averageRank >= 30 ? 'Archon' : 'Legend'
    ) : '?';

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${match.win ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}
        >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10">
                <img src={getHeroImageUrl(match.heroId)} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{HERO_NAMES[match.heroId] || 'Hero'}</span>
                    <Badge variant={match.win ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">{match.win ? 'Vitória' : 'Derrota'}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{match.kda} KDA</span>
                    <span>{Math.floor(match.duration / 60)}m</span>
                    <span className="text-primary">{tierName}</span>
                </div>
            </div>
        </motion.div>
    );
}

function PremiumCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/90 border border-white/[0.06] shadow-xl shadow-black/20 p-5 ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="relative z-10">{children}</div>
        </div>
    );
}

function StatCard({ icon, value, label, subValue, color }: { icon: React.ReactNode; value: string | number; label: string; subValue?: string; color: string }) {
    const colors: Record<string, string> = {
        blue: 'from-blue-500/20 to-blue-500/5 text-blue-400',
        yellow: 'from-yellow-500/20 to-yellow-500/5 text-yellow-400',
        green: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400',
        orange: 'from-orange-500/20 to-orange-500/5 text-orange-400',
        red: 'from-rose-500/20 to-rose-500/5 text-rose-400',
    };
    return (
        <motion.div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-card to-card/80 border border-white/[0.06] p-4 shadow-lg shadow-black/10 hover:shadow-xl transition-all" whileHover={{ y: -2 }}>
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colors[color]} rounded-full blur-2xl opacity-50`} />
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-2 shadow-lg`}>
                <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
            {subValue && <div className="text-[10px] text-muted-foreground mt-0.5">{subValue}</div>}
        </motion.div>
    );
}

function MetricCard({ icon, value, label, glow }: { icon: React.ReactNode; value: string; label: string; glow?: string }) {
    return (
        <div className={`relative p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] ${glow === 'green' ? 'shadow-emerald-500/10 shadow-lg' : glow === 'primary' ? 'shadow-primary/10 shadow-lg' : ''}`}>
            <div className="flex items-center gap-2 mb-1">
                <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>
            </div>
            <div className="text-xl font-bold">{value}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="container mx-auto p-4 space-y-6 max-w-5xl">
            <Skeleton className="h-32 rounded-2xl" />
            <div className="grid grid-cols-4 gap-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
            <div className="grid grid-cols-2 gap-4"><Skeleton className="h-56 rounded-2xl" /><Skeleton className="h-56 rounded-2xl" /></div>
        </div>
    );
}

function ErrorState({ error, onShowModal }: { error: string; showPrivateModal?: boolean; onShowModal?: () => void }) {
    const isPrivateError = error.includes('privado') || error.includes('Turbo');
    return (
        <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <div className="text-yellow-500 mb-2 text-lg">⚠️ {error}</div>
            {isPrivateError && onShowModal && (
                <Button onClick={onShowModal} variant="default">
                    Ver instruções para liberar dados
                </Button>
            )}
            <Button variant="secondary" onClick={() => window.location.reload()}>Tentar Novamente</Button>
        </div>
    );
}

function TMMRExplanationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                <div
                    className="relative z-10 bg-card border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-card border-b border-white/10 p-6 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/20">
                                    <HelpCircle className="w-6 h-6 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Como o TMMR v5.2 funciona</h2>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Introduction */}
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                            <h3 className="font-semibold text-primary mb-2">💡 A ideia principal</h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                O TMMR mede sua performance comparando suas vitórias com o que seria esperado de um jogador
                                com 50% de winrate. Mas aqui está o diferencial: <strong className="text-white">vitórias em lobbies
                                    de rank mais alto valem mais créditos</strong>.
                            </p>
                        </div>

                        {/* Why not just winrate? */}
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                            <h3 className="font-semibold text-amber-400 mb-2">🤔 Por que não apenas Winrate?</h3>
                            <div className="space-y-2 text-sm text-gray-300">
                                <p>
                                    <strong className="text-amber-300">❌ Winrate puro:</strong> Pode ser inflado jogando sempre em lobbies fáceis (Crusader/Archon).
                                    60% WR em Legend não é igual a 60% WR em Divine.
                                </p>
                                <p>
                                    <strong className="text-amber-300">❌ Volume de vitórias:</strong> Premia quem joga muito, não quem joga bem.
                                    5000 vitórias com 50% WR não deveria valer mais que 500 vitórias com 65% WR.
                                </p>
                                <p>
                                    <strong className="text-emerald-400">✓ TMMR:</strong> Equilibra qualidade (rank do lobby) com consistência (superar 50% esperado),
                                    normalizado pelo volume para não beneficiar apenas quem joga muito.
                                </p>
                            </div>
                        </div>

                        {/* Section 1: Weighted Wins */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                Suas Vitórias (Créditos)
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Cada vez que você ganha uma partida, você ganha créditos. Mas a quantidade de créditos
                                depende do <strong className="text-white">rank médio</strong> daquele lobby:
                            </p>
                            <div className="bg-white/5 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-yellow-400">Legend (rank 50)</span>
                                    <span className="font-mono">= 1.00 ponto</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-cyan-400">Ancient (rank 55-60)</span>
                                    <span className="font-mono">= 1.10 - 1.22 pontos</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-fuchsia-400">Divine (rank 60-70)</span>
                                    <span className="font-mono">= 1.22 - 1.49 pontos</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-amber-400">Immortal (rank 70+)</span>
                                    <span className="font-mono">= 1.49+ pontos</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Por exemplo: se você ganhou 100 partidas, mas 30 foram em lobbies Immortal,
                                suas vitórias valem mais do que 100 pontos brutos.
                            </p>
                        </div>

                        {/* Section 2: Expected */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-400" />
                                O Esperado (Baseline 50%)
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Para saber se você está indo bem, comparamos seus pontos com o que seria esperado
                                de alguém com <strong className="text-white">exatamente 50% de winrate</strong>.
                            </p>
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <p className="text-sm text-blue-300">
                                    <strong>Esperado = Número de jogos × 0.5</strong>
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Se você jogou 200 partidas, o esperado seria ~100 pontos (metade).
                                    Se você tem mais que isso, está acima da média!
                                </p>
                            </div>
                        </div>

                        {/* Section 3: Performance */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                Sua Performance
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                A diferença entre seus pontos reais e o esperado determina seu bônus ou penalidade:
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                    <p className="text-sm font-medium text-emerald-400">Acima do esperado</p>
                                    <p className="text-xs text-gray-400 mt-1">Você ganha pontos extras de TMMR</p>
                                </div>
                                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                                    <p className="text-sm font-medium text-rose-400">Abaixo do esperado</p>
                                    <p className="text-xs text-gray-400 mt-1">Você perde pontos de TMMR</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Maturity */}
                        <div className="space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                Penalidade de Maturidade
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Jogadores com <strong className="text-white">menos de 200 partidas</strong> recebem uma penalidade
                                temporária. Isso evita que alguém com 20 jogos e muita sorte lidere o ranking.
                            </p>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>0-50 jogos</span>
                                    <span className="text-amber-400">-400 a -600 pts</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>50-100 jogos</span>
                                    <span className="text-amber-400">-200 a -400 pts</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>100-200 jogos</span>
                                    <span className="text-amber-400">-0 a -200 pts</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-emerald-400">200+ jogos</span>
                                    <span className="text-emerald-400">Sem penalidade! ✓</span>
                                </div>
                            </div>
                        </div>

                        {/* Final formula */}
                        <div className="bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/20 rounded-xl p-4">
                            <h3 className="font-semibold text-white mb-3">📐 O Cálculo Final</h3>
                            <div className="font-mono text-sm bg-black/30 rounded-lg p-3 text-center">
                                <span className="text-muted-foreground">TMMR = </span>
                                <span className="text-white">3500</span>
                                <span className="text-muted-foreground"> + </span>
                                <span className="text-emerald-400">Performance</span>
                                <span className="text-muted-foreground"> - </span>
                                <span className="text-amber-400">Maturidade</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 text-center">
                                3500 é a base (equivalente a Legend). Performance pode ser positiva ou negativa.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
