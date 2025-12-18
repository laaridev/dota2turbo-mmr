'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PrivateProfileModal } from '@/components/private-profile-modal';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { HERO_NAMES, getHeroImageUrl } from '@/lib/heroes';
import { RefreshCw, Shield, Swords, Timer, Trophy, Flame, Clock, Target, TrendingUp, TrendingDown, Gamepad2, BarChart3, Zap, ShieldCheck, Activity, Info, Users, User, Sparkles, Calendar } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
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
    // TMMR v4.0 Transparency Fields
    skillScore?: number;
    confidenceScore?: number;
    difficultyExposure?: number;
    avgKDA?: number;
    avgRankPlayed?: number;
    highRankGames?: number;
    highRankWinrate?: number;
    winrate?: number;
    // v4.0 New Fields
    soloGames?: number;
    partyGames?: number;
    soloWinrate?: number;
    partyWinrate?: number;
    heroNormalizedKDA?: number;
    recencyMultiplier?: number;
    consistencyScore?: number;
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
    partySize?: number;
    averageRank?: number;
};
type MatchData = {
    heroStats: HeroStat[];
    performance: { avgKDA: string; avgDuration: number; positiveKDA: number };
    recentMatches: RecentMatch[];
    dailyStats: DailyStat[];
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

    // Calculate pie chart data for solo vs party
    const soloGames = player.soloGames || 0;
    const partyGames = player.partyGames || 0;
    const totalGames = soloGames + partyGames;
    const soloPercent = totalGames > 0 ? (soloGames / totalGames) * 100 : 50;
    const partyPercent = totalGames > 0 ? (partyGames / totalGames) * 100 : 50;

    return (
        <div className="min-h-screen relative">
            {/* Noise texture */}
            <div className="fixed inset-0 opacity-[0.015] pointer-events-none z-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

            {/* Radial glow behind content */}
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
                    <StatCard icon={player.streak > 0 ? <Flame /> : <TrendingDown />} value={player.streak > 0 ? `+${player.streak}` : player.streak} label="Streak" color={player.streak > 0 ? 'orange' : 'red'} />
                </div>

                {/* TMMR v4.0 Breakdown Section */}
                {player.skillScore !== undefined && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                    >
                        <PremiumCard>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-primary" />
                                    Como seu TMMR foi calculado
                                </h3>
                                <Badge variant="outline" className="text-xs">v4.0</Badge>
                            </div>

                            {/* Main Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Left: Skill Components */}
                                <div className="md:col-span-2 space-y-3">
                                    {/* Solo vs Party Card */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <BreakdownCard
                                            icon={<User className="text-blue-400" />}
                                            title="Solo"
                                            value={`${(player.soloWinrate || 0).toFixed(1)}%`}
                                            subtitle={`${soloGames} partidas`}
                                            progress={(player.soloWinrate || 0)}
                                            color="blue"
                                            weight="1.3x"
                                        />
                                        <BreakdownCard
                                            icon={<Users className="text-violet-400" />}
                                            title="Party"
                                            value={`${(player.partyWinrate || 0).toFixed(1)}%`}
                                            subtitle={`${partyGames} partidas`}
                                            progress={(player.partyWinrate || 0)}
                                            color="purple"
                                            weight="0.85x"
                                        />
                                    </div>

                                    {/* Other metrics */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <BreakdownCard
                                            icon={<Zap className="text-orange-400" />}
                                            title="KDA vs Esperado"
                                            value={`${((player.heroNormalizedKDA || 1) * 100).toFixed(0)}%`}
                                            subtitle={`KDA ${(player.avgKDA || 0).toFixed(2)}`}
                                            progress={Math.min((player.heroNormalizedKDA || 1) * 50, 100)}
                                            color="orange"
                                            infoText="Compara com KDA esperado do role"
                                        />
                                        <BreakdownCard
                                            icon={<Calendar className="text-cyan-400" />}
                                            title="Recência"
                                            value={`${((player.recencyMultiplier || 1) * 100).toFixed(0)}%`}
                                            subtitle="Peso temporal"
                                            progress={(player.recencyMultiplier || 0.7) * 100}
                                            color="cyan"
                                            infoText="Partidas recentes pesam mais"
                                        />
                                    </div>

                                    {/* Third row */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <BreakdownCard
                                            icon={<ShieldCheck className="text-emerald-400" />}
                                            title="Confiança"
                                            value={`${((player.confidenceScore || 0.3) * 100).toFixed(0)}%`}
                                            subtitle={`${player.wins + player.losses} partidas`}
                                            progress={(player.confidenceScore || 0.3) * 100}
                                            color="emerald"
                                            infoText="Mais jogos = mais confiável"
                                        />
                                        <BreakdownCard
                                            icon={<Swords className="text-rose-400" />}
                                            title="Dificuldade"
                                            value={`${((player.difficultyExposure || 1) * 100).toFixed(0)}%`}
                                            subtitle={`${player.highRankGames || 0} Ancient+`}
                                            progress={Math.min(((player.difficultyExposure || 1) / 1.5) * 100, 100)}
                                            color="rose"
                                            infoText="Bônus por jogar em lobbies difíceis"
                                        />
                                    </div>
                                </div>

                                {/* Right: Pie Chart */}
                                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                    <p className="text-xs text-muted-foreground mb-3">Solo vs Party</p>
                                    <div className="relative w-32 h-32">
                                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                            {/* Background circle */}
                                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="20" />
                                            {/* Solo portion */}
                                            <motion.circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                fill="none"
                                                stroke="url(#soloGradient)"
                                                strokeWidth="20"
                                                strokeLinecap="round"
                                                strokeDasharray={`${soloPercent * 2.51} 251`}
                                                initial={{ strokeDasharray: '0 251' }}
                                                animate={{ strokeDasharray: `${soloPercent * 2.51} 251` }}
                                                transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                                            />
                                            {/* Party portion */}
                                            <motion.circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                fill="none"
                                                stroke="url(#partyGradient)"
                                                strokeWidth="20"
                                                strokeLinecap="round"
                                                strokeDasharray={`${partyPercent * 2.51} 251`}
                                                strokeDashoffset={`-${soloPercent * 2.51}`}
                                                initial={{ strokeDasharray: '0 251' }}
                                                animate={{ strokeDasharray: `${partyPercent * 2.51} 251` }}
                                                transition={{ delay: 0.7, duration: 1, ease: 'easeOut' }}
                                            />
                                            <defs>
                                                <linearGradient id="soloGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#3b82f6" />
                                                    <stop offset="100%" stopColor="#60a5fa" />
                                                </linearGradient>
                                                <linearGradient id="partyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#8b5cf6" />
                                                    <stop offset="100%" stopColor="#a78bfa" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-bold">{soloPercent.toFixed(0)}%</span>
                                            <span className="text-[10px] text-muted-foreground">Solo</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-4 text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span>Solo</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-violet-500" />
                                            <span>Party</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Formula explanation */}
                            <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs text-muted-foreground">
                                <span className="text-primary font-medium">Fórmula: </span>
                                TMMR = 3500 + (Skill × 3000 × Confiança × Recência × Dificuldade)
                            </div>
                        </PremiumCard>
                    </motion.div>
                )}

                {/* Chart */}
                {matchData && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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

                {/* Two columns */}
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

                {/* Recent Matches - Improved */}
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
        </div>
    );
}

// Breakdown Card Component
function BreakdownCard({
    icon, title, value, subtitle, progress, color, weight, infoText
}: {
    icon: React.ReactNode;
    title: string;
    value: string;
    subtitle: string;
    progress: number;
    color: string;
    weight?: string;
    infoText?: string;
}) {
    const colorClasses: Record<string, string> = {
        blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
        purple: 'from-violet-500/10 to-violet-500/5 border-violet-500/20',
        orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/20',
        cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20',
        emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
        rose: 'from-rose-500/10 to-rose-500/5 border-rose-500/20',
    };
    const barColors: Record<string, string> = {
        blue: 'from-blue-500 to-blue-400',
        purple: 'from-violet-500 to-violet-400',
        orange: 'from-orange-500 to-orange-400',
        cyan: 'from-cyan-500 to-cyan-400',
        emerald: 'from-emerald-500 to-emerald-400',
        rose: 'from-rose-500 to-rose-400',
    };

    return (
        <div className={`relative p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} border group`}>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>
                    <span className="text-xs text-muted-foreground">{title}</span>
                </div>
                {weight && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground">{weight}</span>
                )}
            </div>
            <div className="text-xl font-bold">{value}</div>
            <div className="text-[10px] text-muted-foreground">{subtitle}</div>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full bg-gradient-to-r ${barColors[color]} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                />
            </div>
            {infoText && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-card border border-white/10 rounded-lg text-[10px] text-muted-foreground opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10">
                    {infoText}
                </div>
            )}
        </div>
    );
}

// Recent Match Card with better info
function RecentMatchCard({ match, index }: { match: RecentMatch; index: number }) {
    const [k, d, a] = match.kda.split('/').map(Number);
    const kda = d > 0 ? ((k + a * 0.7) / d).toFixed(2) : 'Perfect';
    const isGoodKDA = d === 0 || (k + a) / Math.max(d, 1) >= 2;

    return (
        <motion.div
            className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01] ${match.win ? 'bg-gradient-to-r from-emerald-500/10 to-transparent' : 'bg-gradient-to-r from-rose-500/10 to-transparent'}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.03 }}
        >
            {/* Win/Loss indicator */}
            <div className={`w-1 h-12 rounded-full ${match.win ? 'bg-gradient-to-b from-emerald-400 to-emerald-600' : 'bg-gradient-to-b from-rose-400 to-rose-600'}`} />

            {/* Hero image */}
            <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white/10 flex-shrink-0">
                <img src={getHeroImageUrl(match.heroId)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>

            {/* Match info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{HERO_NAMES[match.heroId] || `Hero ${match.heroId}`}</span>
                    <Badge variant={match.win ? 'default' : 'destructive'} className="text-[10px] h-4">
                        {match.win ? 'Vitória' : 'Derrota'}
                    </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className={`font-medium ${isGoodKDA ? 'text-emerald-400' : 'text-muted-foreground'}`}>{match.kda}</span>
                    <span>•</span>
                    <span>{Math.floor(match.duration / 60)}m</span>
                    {match.averageRank && match.averageRank > 0 && (
                        <>
                            <span>•</span>
                            <span className="text-violet-400">Rank {match.averageRank}</span>
                        </>
                    )}
                </div>
            </div>

            {/* KDA Score */}
            <div className="text-right">
                <div className={`text-lg font-bold ${isGoodKDA ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                    {kda}
                </div>
                <div className="text-[10px] text-muted-foreground">KDA</div>
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
            <div className="grid grid-cols-2 gap-4"><Skeleton className="h-56 rounded-2xl" /><Skeleton className="h-56 rounded-2xl" /></div>
        </div>
    );
}

function ErrorState({ error, showPrivateModal, onShowModal }: { error: string; showPrivateModal?: boolean; onShowModal?: () => void }) {
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
