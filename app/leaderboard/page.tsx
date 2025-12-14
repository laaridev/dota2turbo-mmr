'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { getTier, getTierCategory, TIER_NAMES } from '@/lib/tmmr';
import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function LeaderboardPage() {
    return (
        <Suspense fallback={<LeaderboardSkeleton />}>
            <LeaderboardContent />
        </Suspense>
    );
}

function LeaderboardSkeleton() {
    return (
        <div className="container mx-auto px-4 py-6 max-w-3xl">
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
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const searchQuery = searchParams.get('search') || '';
    const currentPeriod = searchParams.get('period') || 'all';

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/leaderboard?period=${currentPeriod}&limit=100`);
                const data = await res.json();
                setPlayers(data.players || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [currentPeriod]);

    const filteredPlayers = useMemo(() => {
        if (!searchQuery.trim()) return players;
        const query = searchQuery.toLowerCase();
        return players.filter(p => p.name.toLowerCase().includes(query));
    }, [players, searchQuery]);

    if (loading) {
        return <LeaderboardSkeleton />;
    }

    return (
        <>
            {/* Background glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none z-0" />

            {/* Main content */}
            <div className="container mx-auto px-4 py-6 max-w-3xl relative z-10">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold text-white">Ranking</h1>
                    <span className="text-sm text-muted-foreground ml-auto">
                        {filteredPlayers.length} jogadores
                    </span>
                </div>

                {/* Single unified list */}
                <div className="space-y-2">
                    {filteredPlayers.map((player, index) => (
                        <PlayerRow
                            key={player.steamId}
                            player={player}
                            position={index + 1}
                            isTopThree={index < 3}
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

function PlayerRow({ player, position, isTopThree }: { player: any; position: number; isTopThree: boolean }) {
    const tier = getTier(player.tmmr);
    const category = getTierCategory(tier);
    const winRate = ((player.wins / (player.wins + player.losses)) * 100).toFixed(1);

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
                        <span className={Number(winRate) >= 50 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                            {winRate}% WR
                        </span>
                        <span className="text-white/20">•</span>
                        <span>{player.wins + player.losses} jogos</span>
                    </div>
                </div>

                {/* TMMR + Badge */}
                <div className="text-right flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                        <div className="font-bold text-white text-lg">{player.tmmr}</div>
                        <Badge variant={category as any} className="text-[10px] px-2 h-5 mt-1">
                            {TIER_NAMES[tier]}
                        </Badge>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
