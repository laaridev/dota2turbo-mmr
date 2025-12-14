'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Wrench, Sparkles, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function BetaNoticeModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if user has seen this modal before
        const hasSeen = localStorage.getItem('turbobuff_beta_notice_v1');
        if (!hasSeen) {
            setIsOpen(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem('turbobuff_beta_notice_v1', 'true');
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
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/20 border border-primary/30 mb-4"
                        >
                            <Wrench className="h-8 w-8 text-primary" />
                        </motion.div>

                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium mb-3"
                        >
                            <Sparkles className="h-3 w-3" />
                            BETA
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-2xl font-bold text-white mb-2"
                        >
                            Bem-vindo ao TurboBuff!
                        </motion.h2>

                        {/* Description */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="space-y-3 mb-6"
                        >
                            <p className="text-muted-foreground text-sm">
                                O sistema de cálculo do <strong className="text-primary">TMMR</strong> ainda está
                                em <strong className="text-white">desenvolvimento ativo</strong>.
                            </p>
                            <p className="text-muted-foreground text-sm">
                                Os valores e rankings podem ser <strong className="text-white">ajustados</strong> conforme
                                refinamos o algoritmo para ser mais justo e preciso.
                            </p>
                        </motion.div>

                        {/* Info box */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6"
                        >
                            <div className="flex items-start gap-3 text-left">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <Bell className="h-4 w-4 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-white mb-1">Fique tranquilo!</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Sua conta e partidas estão seguras. Apenas o cálculo do MMR
                                        será refinado nas próximas atualizações.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
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
