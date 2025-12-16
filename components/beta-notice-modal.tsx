'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, TrendingUp, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function BetaNoticeModal() {
    const [isOpen, setIsOpen] = useState(true);

    const handleClose = () => {
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="bg-gradient-to-b from-card to-card/95 border border-white/10 rounded-2xl max-w-lg w-full p-6 relative z-10 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
                >
                    {/* Decorative gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-orange-500/10 pointer-events-none" />

                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors z-10"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="relative text-center">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-semibold mb-4"
                        >
                            <Sparkles className="h-4 w-4" />
                            VERSÃO BETA
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-white mb-3"
                        >
                            Bem-vindo ao TurboBuff!
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="text-sm text-gray-300 mb-5"
                        >
                            O primeiro sistema de ranking para Dota 2 Turbo
                        </motion.p>

                        {/* Current Status */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4 text-left"
                        >
                            <h3 className="text-sm font-semibold text-amber-400 mb-2">⚠️ Estamos em Desenvolvimento Ativo</h3>
                            <p className="text-xs text-gray-300 leading-relaxed mb-2">
                                O sistema de <strong className="text-white">TMMR v3.0</strong> está em fase beta.
                                Os valores de ranking podem sofrer ajustes enquanto refinamos a fórmula com base em dados reais e feedback da comunidade.
                            </p>
                            <p className="text-xs text-gray-400">
                                Atualmente, os perfis são atualizados <strong className="text-white">manualmente a cada 7 dias</strong>.
                            </p>
                        </motion.div>

                        {/* Coming Soon Features */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 text-left"
                        >
                            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-1.5">
                                <Rocket className="h-4 w-4" />
                                Em Breve
                            </h3>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2 text-xs text-gray-300">
                                    <Zap className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                                    <span><strong className="text-white">Atualizações em tempo real:</strong> Perfis sincronizados automaticamente com novas partidas</span>
                                </li>
                                <li className="flex items-start gap-2 text-xs text-gray-300">
                                    <TrendingUp className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                                    <span><strong className="text-white">Sistema de conquistas:</strong> Badges e recompensas por marcos alcançados</span>
                                </li>
                                <li className="flex items-start gap-2 text-xs text-gray-300">
                                    <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                                    <span><strong className="text-white">Análises avançadas:</strong> Estatísticas detalhadas de performance por herói e período</span>
                                </li>
                            </ul>
                        </motion.div>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="space-y-2"
                        >
                            <Button onClick={handleClose} variant="premium" className="w-full h-11 text-base">
                                Vamos Começar! 🚀
                            </Button>
                            <p className="text-[10px] text-muted-foreground">
                                Estamos em melhoria contínua. Seu feedback é valioso!
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
