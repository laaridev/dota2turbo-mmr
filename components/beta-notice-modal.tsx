'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
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
                    className="bg-gradient-to-b from-card to-card/95 border border-white/10 rounded-2xl max-w-md w-full p-6 relative overflow-hidden shadow-2xl"
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
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium mb-4"
                        >
                            <Sparkles className="h-4 w-4" />
                            BETA
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-white mb-4"
                        >
                            Bem-vindo ao TurboBuff!
                        </motion.h2>

                        {/* Description */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-4 mb-6 text-left"
                        >
                            <p className="text-muted-foreground text-sm">
                                Estamos trabalhando para encontrar a <strong className="text-white">melhor fórmula</strong> de
                                calcular o <strong className="text-primary">TMMR</strong> baseado nas suas partidas Turbo.
                            </p>
                            <p className="text-muted-foreground text-sm">
                                Os <strong className="text-white">valores do ranking</strong> podem variar
                                conforme refinamos o algoritmo durante o desenvolvimento.
                            </p>
                            <p className="text-muted-foreground text-sm">
                                Agradecemos sua paciência enquanto buscamos o equilíbrio perfeito! 🧡
                            </p>
                        </motion.div>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Button onClick={handleClose} variant="premium" className="w-full h-11 text-base">
                                Entendi, vamos lá! 🚀
                            </Button>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
