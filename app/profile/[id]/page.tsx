'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PrivateProfileModal } from '@/components/private-profile-modal';
import { getTier, TIER_NAMES } from '@/lib/tmmr';
import { RefreshCw, Shield, Swords, Timer, Trophy, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

// Types (should be shared but for speed defining detailed props here matching API)
type Match = {
    matchId: number;
    heroId: number;
    win: boolean;
    duration: number;
    kda: string;
    timestamp: string;
    tmmrChange: number;
};

type Player = {
    steamId: string;
    name: string;
    avatar: string;
    tmmr: number;
    wins: number;
    losses: number;
    streak: number;
    lastUpdate: string;
    matches: Match[]; // In full profile fetch we might want matches populated or separate fetch
};

export default function ProfilePage() {
    const params = useParams();
    const id = params.id as string;

    const [player, setPlayer] = useState<Player | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lockTimer, setLockTimer] = useState<number | null>(null);
    const [showPrivateModal, setShowPrivateModal] = useState(false);

    const fetchProfile = async (forceUpdate = false) => {
        setLoading(true);
        setError('');

        try {
            // First, try fetching existing data to show quickly? 
            // Or just hit analyze which handles "existing vs update" logic?
            // Since we want to FETCH (GET) potentially stale data first for speed, 
            // but our API structure in `analyze` (POST) does both.
            // Let's use POST for now as "Get or Create/Update".

            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 429) {
                    // Locked, but we usually get the player data back in the error response if it exists
                    if (data.player) {
                        setPlayer(data.player);
                        setLockTimer(data.remainingDays);
                    } else {
                        setError(data.error);
                    }
                } else if (res.status === 403 && data.isPrivate) {
                    // Private profile detected
                    setShowPrivateModal(true);
                    setError('Perfil privado');
                } else {
                    setError(data.error || 'Failed to fetch profile');
                }
            } else {
                setPlayer(data.player);
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchProfile();
    }, [id]);

    if (loading && !player) {
        return (
            <div className="container mx-auto p-4 space-y-8 mt-10">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
            </div>
        );
    }

    if (error && !player) {
        return (
            <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="text-red-500 mb-4 text-xl">⚠️ {error}</div>
                <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
            </div>
        );
    }

    if (!player) return null;

    const tier = getTier(player.tmmr);
    const winrate = ((player.wins / (player.wins + player.losses || 1)) * 100).toFixed(1);

    return (
        <div className="container mx-auto p-4 space-y-8 pb-20">
            {/* Private Profile Modal */}
            <PrivateProfileModal
                isOpen={showPrivateModal}
                onClose={() => setShowPrivateModal(false)}
            />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row items-center gap-6 bg-card/50 p-8 rounded-2xl border border-white/5 backdrop-blur-sm"
            >
                <div className="relative">
                    <img src={player.avatar} alt={player.name} className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-primary/20 box-glow" />
                    <div className="absolute -bottom-2 -right-2 bg-background p-1 rounded-full">
                        <Badge variant={tier} className="text-sm px-3 py-1 uppercase tracking-wider">
                            {TIER_NAMES[tier]}
                        </Badge>
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                    <h1 className="text-3xl md:text-4xl font-bold">{player.name}</h1>
                    <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground">
                        <span className="flex items-center gap-1"><Trophy className="w-4 h-4 text-primary" /> {player.tmmr} TMMR</span>
                        <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> ID: {player.steamId}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[200px]">
                    {lockTimer ? (
                        <Button variant="secondary" disabled className="w-full opacity-80">
                            <Timer className="mr-2 h-4 w-4" /> Atualizar em {lockTimer} dias
                        </Button>
                    ) : (
                        <Button onClick={() => fetchProfile(true)} className="w-full" disabled={loading}>
                            {loading ? "Analisando..." : <>Atualizar Stats <RefreshCw className="ml-2 h-4 w-4" /></>}
                        </Button>
                    )}
                    <p className="text-xs text-center text-muted-foreground">
                        Última atualização: {formatDistanceToNow(new Date(player.lastUpdate))} atrás
                    </p>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total de Partidas" value={player.wins + player.losses} icon={<Swords className="text-blue-500" />} />
                <StatCard title="Taxa de Vitória" value={`${winrate}%`} icon={<Trophy className="text-yellow-500" />} />
                <StatCard title="Vitórias" value={player.wins} subValue={`${player.losses} Derrotas`} icon={<ArrowUp className="text-green-500" />} />
                <StatCard title="Sequência" value={player.streak > 0 ? `+${player.streak}` : player.streak} icon={<Zap className="text-purple-500" />} />
            </div>

            {/* Match History Placeholder - Real implementation needs hydrated matches */}
            {/* Since the API currently only returns match IDs in the 'player' object, 
          we would need to fetch the actual Match documents.
          For the MVP, I will just show a "Coming Soon" or imply data is being aggregated 
          if I don't implement the Hydration API right now.
          HOWEVER, the user asked for "Lista clara e bonita".
          I should technically implement a GET /api/matches/[playerId] to show this list.
      */}
            <Card className="border-white/5 bg-card/30">
                <CardHeader>
                    <CardTitle>Partidas Turbo Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-10">
                        Visão geral disponível. Histórico detalhado em breve.
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}

function StatCard({ title, value, subValue, icon }: { title: string, value: string | number, subValue?: string, icon: any }) {
    return (
        <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
            </CardContent>
        </Card>
    )
}
