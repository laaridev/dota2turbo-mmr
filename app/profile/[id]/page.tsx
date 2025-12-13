'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PrivateProfileModal } from '@/components/private-profile-modal';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { HERO_NAMES, getHeroImageUrl } from '@/lib/heroes';
import { RefreshCw, Shield, Swords, Timer, Trophy, Zap, Flame, Clock, Target, TrendingUp, TrendingDown, Gamepad2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
};

type HeroStat = {
    heroId: number;
    games: number;
    wins: number;
    winrate: number;
    avgKDA: string;
};

type MatchData = {
    heroStats: HeroStat[];
    performance: { avgKDA: string; avgDuration: number; positiveKDA: number };
    recentMatches: { matchId: number; heroId: number; win: boolean; kda: string; duration: number; tmmrChange: number }[];
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

    const fetchProfile = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 429 && data.player) {
                    setPlayer(data.player);
                    setLockTimer(data.remainingDays);
                } else if (res.status === 403 && data.isPrivate) {
                    setShowPrivateModal(true);
                    setError('Perfil privado');
                } else {
                    setError(data.error || 'Erro ao buscar perfil');
                }
            } else {
                setPlayer(data.player);
            }
        } catch (err) {
            setError('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const fetchMatches = async () => {
        try {
            const res = await fetch(`/api/player/${id}/matches`);
            if (res.ok) {
                const data = await res.json();
                setMatchData(data);
            }
        } catch (err) {
            console.error('Erro ao buscar partidas:', err);
        }
    };

    useEffect(() => {
        if (id) {
            fetchProfile();
            fetchMatches();
        }
    }, [id]);

    if (loading && !player) {
        return (
            <div className="container mx-auto p-4 space-y-6 max-w-4xl">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
                </div>
                <Skeleton className="h-48" />
            </div>
        );
    }

    if (error && !player) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="text-red-500 mb-4 text-lg">⚠️ {error}</div>
                <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
            </div>
        );
    }

    if (!player) return null;

    const tier = getTier(player.tmmr);
    const winrate = ((player.wins / (player.wins + player.losses || 1)) * 100).toFixed(1);

    return (
        <div className="container mx-auto p-4 space-y-6 pb-20 max-w-4xl">
            <PrivateProfileModal isOpen={showPrivateModal} onClose={() => setShowPrivateModal(false)} />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row items-center gap-5 bg-card/50 p-6 rounded-xl border border-border"
            >
                <div className="relative">
                    <img src={player.avatar} alt={player.name} className="h-20 w-20 rounded-full border-2 border-primary/30" />
                    <div className="absolute -bottom-1 -right-1">
                        <Badge variant={getTierCategory(tier) as any} className="text-xs px-2">
                            {TIER_NAMES[tier]}
                        </Badge>
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-2xl font-bold">{player.name}</h1>
                    <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Trophy className="w-4 h-4 text-primary" />{player.tmmr} TMMR</span>
                        <span className="flex items-center gap-1"><Shield className="w-4 h-4" />ID: {player.steamId}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2 text-center">
                    {lockTimer ? (
                        <Button variant="secondary" disabled size="sm">
                            <Timer className="mr-2 h-4 w-4" />Atualiza em {lockTimer}d
                        </Button>
                    ) : (
                        <Button onClick={fetchProfile} size="sm" disabled={loading}>
                            {loading ? 'Analisando...' : <><RefreshCw className="mr-2 h-4 w-4" />Atualizar</>}
                        </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Atualizado {formatDistanceToNow(new Date(player.lastUpdate))} atrás
                    </p>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard title="Partidas" value={player.wins + player.losses} icon={<Swords className="text-blue-500 h-4 w-4" />} />
                <StatCard title="Winrate" value={`${winrate}%`} icon={<Trophy className="text-yellow-500 h-4 w-4" />} />
                <StatCard title="Vitórias" value={player.wins} subValue={`${player.losses} derrotas`} icon={<TrendingUp className="text-green-500 h-4 w-4" />} />
                <StatCard title="Streak" value={player.streak > 0 ? `+${player.streak}` : player.streak} icon={player.streak > 0 ? <Flame className="text-orange-500 h-4 w-4" /> : <TrendingDown className="text-red-500 h-4 w-4" />} />
            </div>

            {/* Performance Metrics */}
            {matchData && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    <Card className="border-border bg-card/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" />
                                Desempenho Turbo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-xl font-bold">{matchData.performance.avgKDA}</div>
                                    <div className="text-xs text-muted-foreground">KDA Médio</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold">{Math.floor(matchData.performance.avgDuration / 60)}m</div>
                                    <div className="text-xs text-muted-foreground">Duração Média</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold">{Math.round((matchData.performance.positiveKDA / matchData.totalMatches) * 100)}%</div>
                                    <div className="text-xs text-muted-foreground">KDA Positivo</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Hero Stats */}
            {matchData && matchData.heroStats.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <Card className="border-border bg-card/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Gamepad2 className="h-4 w-4 text-primary" />
                                Heróis Mais Jogados
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {matchData.heroStats.map((hero) => (
                                    <div key={hero.heroId} className="bg-secondary/30 rounded-lg p-3 text-center">
                                        <img
                                            src={getHeroImageUrl(hero.heroId)}
                                            alt={HERO_NAMES[hero.heroId] || `Hero ${hero.heroId}`}
                                            className="w-12 h-12 mx-auto rounded-lg mb-2 bg-black/20"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                        <div className="font-medium text-sm truncate">{HERO_NAMES[hero.heroId] || `Hero ${hero.heroId}`}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {hero.games} jogos • <span className={hero.winrate >= 50 ? 'text-green-500' : 'text-red-500'}>{hero.winrate}%</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">{hero.avgKDA}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Recent Matches */}
            {matchData && matchData.recentMatches.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <Card className="border-border bg-card/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                Partidas Recentes
                                <span className="text-xs text-muted-foreground font-normal ml-auto">Última atualização semanal</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {matchData.recentMatches.map((match) => (
                                    <div key={match.matchId} className={`flex items-center gap-3 px-4 py-2 ${match.win ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                                        <div className={`w-1 h-8 rounded-full ${match.win ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-xs font-medium">
                                            {HERO_NAMES[match.heroId]?.slice(0, 2).toUpperCase() || '??'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{HERO_NAMES[match.heroId] || `Hero ${match.heroId}`}</div>
                                            <div className="text-xs text-muted-foreground">{match.kda} • {Math.floor(match.duration / 60)}m</div>
                                        </div>
                                        <div className={`text-sm font-bold ${match.tmmrChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {match.tmmrChange > 0 ? '+' : ''}{match.tmmrChange}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Weekly update note */}
            <p className="text-xs text-center text-muted-foreground">
                Estatísticas baseadas em partidas Turbo processadas na última atualização semanal.
            </p>
        </div>
    );
}

function StatCard({ title, value, subValue, icon }: { title: string; value: string | number; subValue?: string; icon: React.ReactNode }) {
    return (
        <Card className="bg-card/50 border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent className="px-4 pb-3">
                <div className="text-xl font-bold">{value}</div>
                {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
            </CardContent>
        </Card>
    );
}
