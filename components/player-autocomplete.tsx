'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { getTier } from '@/lib/tmmr';

interface Player {
    steamId: string;
    name: string;
    avatar: string;
    tmmr: number;
    wins: number;
    losses: number;
}

interface PlayerAutocompleteProps {
    onSelect: (player: Player) => void;
    placeholder?: string;
    excludeId?: string; // Para não permitir selecionar o mesmo jogador
}

export function PlayerAutocomplete({ onSelect, placeholder = "Buscar jogador...", excludeId }: PlayerAutocompleteProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Player[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchPlayers = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                // Filtrar o jogador excluído se houver
                const filtered = excludeId ? data.filter((p: Player) => p.steamId !== excludeId) : data;
                setResults(filtered);
                setIsOpen(true);
            } catch (error) {
                console.error('Error searching players:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(searchPlayers, 300);
        return () => clearTimeout(debounce);
    }, [query, excludeId]);

    const handleSelect = (player: Player) => {
        setQuery(player.name);
        setIsOpen(false);
        onSelect(player);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full h-[44px] pl-10 pr-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-card border border-white/10 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
                    {results.map((player) => {
                        const tierKey = getTier(player.tmmr);
                        const tierName = tierKey as string;
                        const totalGames = player.wins + player.losses;

                        // Map tier to color (simplified)
                        const getTierColor = (tier: string) => {
                            if (tier.startsWith('herald')) return 'text-gray-400';
                            if (tier.startsWith('guardian')) return 'text-green-400';
                            if (tier.startsWith('crusader')) return 'text-yellow-400';
                            if (tier.startsWith('archon')) return 'text-orange-400';
                            if (tier.startsWith('legend')) return 'text-purple-400';
                            if (tier.startsWith('ancient')) return 'text-cyan-400';
                            if (tier.startsWith('divine')) return 'text-blue-400';
                            return 'text-pink-400'; // immortal
                        };

                        return (
                            <button
                                key={player.steamId}
                                onClick={() => handleSelect(player)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                            >
                                <img
                                    src={player.avatar}
                                    alt={player.name}
                                    className="w-10 h-10 rounded-lg flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-white text-sm">{player.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {player.tmmr} TMMR • {totalGames} jogos
                                    </div>
                                </div>
                                <div className={`px-2 py-1 rounded text-[10px] font-bold flex-shrink-0 ${getTierColor(tierName)}`}>
                                    {tierName.toUpperCase()}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
                <div className="absolute z-50 w-full mt-2 bg-card border border-white/10 rounded-lg shadow-2xl p-4 text-center text-muted-foreground text-sm">
                    Nenhum jogador encontrado
                </div>
            )}
        </div>
    );
}
