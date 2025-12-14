'use client';

import { X, Database, Zap, Trophy, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HowItWorksModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-card border border-white/10 rounded-2xl max-w-lg w-full p-5 relative animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-muted-foreground hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <h2 className="text-xl font-bold mb-4">Como o TurboBuff Funciona?</h2>

                <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Database className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-0.5">1. Buscamos suas partidas</h3>
                            <p className="text-muted-foreground text-xs">
                                Dados públicos do OpenDota. Só precisa do seu ID!
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-0.5">2. Winrate é o que importa</h3>
                            <p className="text-muted-foreground text-xs">
                                <strong className="text-primary">Taxa de vitória</strong> é o fator principal. Quem ganha mais, sobe mais!
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <Star className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-0.5">3. Qualidade &gt; Quantidade</h3>
                            <p className="text-muted-foreground text-xs">
                                57% de winrate sempre vence 53%, <strong className="text-white">independente do volume</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Step 4 - Escala de Ranks */}
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm mb-2">4. Escala de Ranks</h3>
                            <div className="flex gap-1 text-[10px]">
                                <div className="flex-1 p-1.5 bg-emerald-900/40 rounded text-center">
                                    <div className="text-muted-foreground">~50%</div>
                                    <div className="text-emerald-400 font-semibold">Legend</div>
                                </div>
                                <div className="flex-1 p-1.5 bg-indigo-900/40 rounded text-center">
                                    <div className="text-muted-foreground">~57%</div>
                                    <div className="text-indigo-400 font-semibold">Ancient</div>
                                </div>
                                <div className="flex-1 p-1.5 bg-pink-900/40 rounded text-center">
                                    <div className="text-muted-foreground">~65%</div>
                                    <div className="text-pink-400 font-semibold">Divine</div>
                                </div>
                                <div className="flex-1 p-1.5 bg-primary/20 rounded text-center border border-primary/30">
                                    <div className="text-muted-foreground">70%+</div>
                                    <div className="text-primary font-semibold">Immortal</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Zap className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-0.5">5. Atualize a cada 7 dias</h3>
                            <p className="text-muted-foreground text-xs">
                                Jogue, melhore sua winrate e suba no ranking!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10">
                    <p className="text-[10px] text-muted-foreground text-center mb-3">
                        💡 Seus dados de partidas precisam estar <strong className="text-white">públicos</strong> no Dota 2.
                    </p>
                    <Button onClick={onClose} className="w-full h-9 text-sm">
                        Entendi!
                    </Button>
                </div>
            </div>
        </div>
    );
}
