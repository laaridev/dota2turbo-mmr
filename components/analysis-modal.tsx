'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Trophy, Star, Flame, Sparkles, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTier, getTierCategory, TIER_NAMES, TierKey } from '@/lib/tmmr';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    player?: {
        name: string;
        tmmr: number;
        wins: number;
        losses: number;
        avatar: string;
        steamId: string;
    };
    error?: string;
    onViewProfile: () => void;
}

const TIER_MESSAGES: Record<string, { title: string; message: string; emoji: string }> = {
    herald: {
        title: "Começando a jornada!",
        message: "Todo mestre foi um dia aprendiz. Continue jogando e evoluindo!",
        emoji: "🌱"
    },
    guardian: {
        title: "Guardião em ascensão!",
        message: "Você está no caminho certo. A próxima patente está ao alcance!",
        emoji: "🛡️"
    },
    crusader: {
        title: "Cruzado determinado!",
        message: "Sua dedicação está aparecendo. Continue assim!",
        emoji: "⚔️"
    },
    archon: {
        title: "Arconte promissor!",
        message: "Você está acima da média! Ótimo trabalho nas turbos.",
        emoji: "✨"
    },
    legend: {
        title: "Lendário!",
        message: "Você é uma lenda das turbinhas! Poucos chegam aqui.",
        emoji: "🏆"
    },
    ancient: {
        title: "Anciãozasso!",
        message: "Que skill impressionante! Você domina o modo Turbo.",
        emoji: "👑"
    },
    divine: {
        title: "Divino!",
        message: "Você joga no nível dos deuses! Elite das turbos.",
        emoji: "⭐"
    },
    immortal: {
        title: "IMORTAL!",
        message: "Você é a lenda máxima! O topo absoluto das turbinhas!",
        emoji: "🔥"
    }
};

const TIER_COLORS: Record<string, string> = {
    herald: 'from-zinc-500 to-zinc-600',
    guardian: 'from-teal-500 to-teal-600',
    crusader: 'from-yellow-500 to-yellow-600',
    archon: 'from-sky-400 to-sky-500',
    legend: 'from-emerald-400 to-emerald-500',
    ancient: 'from-indigo-400 to-indigo-500',
    divine: 'from-pink-400 to-pink-500',
    immortal: 'from-amber-400 via-orange-500 to-red-500'
};

export function AnalysisModal({ isOpen, onClose, isLoading, player, error, onViewProfile }: AnalysisModalProps) {
    const tier = player ? getTier(player.tmmr) : null;
    const tierCategory = tier ? getTierCategory(tier) : null;
    const tierInfo = tierCategory ? TIER_MESSAGES[tierCategory] : null;
    const winrate = player ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(1) : "0";

    // Trigger confetti on success
    useEffect(() => {
        if (player && !isLoading && isOpen) {
            const duration = tierCategory === 'immortal' ? 5000 : 3000;
            const intensity = tierCategory === 'immortal' ? 0.8 : tierCategory === 'divine' ? 0.6 : 0.4;

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#f97316', '#fb923c', '#fbbf24', '#ffffff']
            });

            if (tierCategory === 'immortal' || tierCategory === 'divine') {
                setTimeout(() => {
                    confetti({
                        particleCount: 50,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0 }
                    });
                    confetti({
                        particleCount: 50,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1 }
                    });
                }, 500);
            }
        }
    }, [player, isLoading, isOpen, tierCategory]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={isLoading ? undefined : onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="bg-card border border-white/10 rounded-2xl max-w-md w-full p-8 relative overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    {!isLoading && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors z-10"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="text-center py-8">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="inline-block mb-6"
                            >
                                <Loader2 className="h-16 w-16 text-primary" />
                            </motion.div>
                            <h3 className="text-xl font-bold mb-2">Analisando seu perfil...</h3>
                            <p className="text-muted-foreground text-sm">
                                Buscando suas partidas Turbo no OpenDota
                            </p>
                            <div className="mt-4 flex justify-center gap-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ scale: [1, 1.5, 1] }}
                                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                                        className="w-2 h-2 bg-primary rounded-full"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4">😢</div>
                            <h3 className="text-xl font-bold mb-2 text-rose-400">Ops!</h3>
                            <p className="text-muted-foreground text-sm">{error}</p>
                            <Button onClick={onClose} className="mt-6">
                                Tentar novamente
                            </Button>
                        </div>
                    )}

                    {/* Success State */}
                    {player && !isLoading && !error && tierCategory && tierInfo && (
                        <>
                            {/* Background gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${TIER_COLORS[tierCategory]} opacity-10`} />

                            {/* Sparkles for high tiers */}
                            {(tierCategory === 'immortal' || tierCategory === 'divine') && (
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    <Sparkles className="absolute top-4 left-4 h-5 w-5 text-amber-400/50 animate-pulse" />
                                    <Sparkles className="absolute top-8 right-8 h-4 w-4 text-amber-400/30 animate-pulse delay-300" />
                                    <Sparkles className="absolute bottom-12 left-8 h-4 w-4 text-amber-400/40 animate-pulse delay-500" />
                                </div>
                            )}

                            <div className="relative text-center">
                                {/* Emoji */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                                    className="text-5xl mb-4"
                                >
                                    {tierInfo.emoji}
                                </motion.div>

                                {/* Title */}
                                <motion.h3
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className={`text-2xl font-black mb-2 bg-gradient-to-r ${TIER_COLORS[tierCategory]} bg-clip-text text-transparent`}
                                >
                                    {tierInfo.title}
                                </motion.h3>

                                {/* Player name */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-lg font-semibold text-white mb-4"
                                >
                                    {player.name}
                                </motion.p>

                                {/* TMMR and Tier */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5, type: 'spring' }}
                                    className="bg-white/5 rounded-xl p-4 mb-4"
                                >
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Trophy className="h-6 w-6 text-primary" />
                                        <span className="text-3xl font-black text-primary">{player.tmmr}</span>
                                        <span className="text-muted-foreground">TMMR</span>
                                    </div>
                                    <div className={`inline-block px-4 py-1 rounded-full bg-gradient-to-r ${TIER_COLORS[tierCategory]} text-white font-bold text-sm`}>
                                        {TIER_NAMES[tier!]}
                                    </div>
                                </motion.div>

                                {/* Stats */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex justify-center gap-6 text-sm mb-4"
                                >
                                    <div>
                                        <span className="text-muted-foreground">Vitórias:</span>
                                        <span className="text-green-400 font-bold ml-1">{player.wins}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Derrotas:</span>
                                        <span className="text-rose-400 font-bold ml-1">{player.losses}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Winrate:</span>
                                        <span className="text-primary font-bold ml-1">{winrate}%</span>
                                    </div>
                                </motion.div>

                                {/* Message */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                    className="text-muted-foreground text-sm mb-6"
                                >
                                    {tierInfo.message}
                                </motion.p>

                                {/* CTA Button */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                >
                                    <Button onClick={onViewProfile} className="w-full gap-2">
                                        Ver meu perfil completo
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </motion.div>
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
