'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Need to build avatar or use img
import { getTier, TIER_NAMES } from '@/lib/tmmr';
import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function LeaderboardPage() {
    const [players, setPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/leaderboard')
            .then(res => res.json())
            .then(data => {
                setPlayers(data.players || []);
                setLoading(false);
            })
            .catch(err => setLoading(false));
    }, []);

    return (
        <div className="container mx-auto p-4 space-y-8 pb-20 mt-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-glow">Ranking Global</h1>
                <p className="text-muted-foreground">TOP 100 Guerreiros do Turbo</p>
            </div>

            <Card className="bg-card/30 border-white/5 backdrop-blur-sm max-w-4xl mx-auto">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {players.map((player, index) => {
                                const tier = getTier(player.tmmr);
                                return (
                                    <Link href={`/profile/${player.steamId}`} key={player.steamId} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                                        <div className="w-8 text-center font-bold text-muted-foreground">
                                            #{index + 1}
                                        </div>
                                        <img src={player.avatar} alt={player.name} className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold truncate">{player.name}</div>
                                            <div className="text-xs text-muted-foreground flex gap-2">
                                                <span>{player.wins + player.losses} Partidas</span>
                                                <span className={player.streak > 0 ? "text-green-500" : "text-red-500"}>
                                                    {player.streak > 0 ? `+${player.streak}` : player.streak}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-primary flex items-center justify-end gap-1">
                                                <Trophy className="h-3 w-3" /> {player.tmmr}
                                            </div>
                                            <Badge variant={tier} className="text-[10px] px-1.5 h-4">
                                                {TIER_NAMES[tier]}
                                            </Badge>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    )
}
