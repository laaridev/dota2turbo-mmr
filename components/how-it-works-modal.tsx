'use client';

import { X, Database, Zap, Trophy, BarChart3, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HowItWorksModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-white/10 rounded-2xl max-w-2xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Title */}
                <h2 className="text-2xl font-bold mb-6">Como o TurboBuff Funciona?</h2>

                {/* Steps */}
                <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Database className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1">1. Buscamos suas partidas</h3>
                            <p className="text-muted-foreground text-sm">
                                Usamos dados públicos do OpenDota para ver <strong className="text-white">todas as suas partidas de Turbo</strong>.
                                Não precisa de senha, só seu ID do Dota!
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <BarChart3 className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1">2. Sua Winrate é o que importa</h3>
                            <p className="text-muted-foreground text-sm">
                                O fator principal é sua <strong className="text-primary">taxa de vitória</strong>.
                                Quem ganha mais, sobe mais! Simples assim.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <Star className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1">3. Qualidade &gt; Quantidade</h3>
                            <p className="text-muted-foreground text-sm">
                                Um jogador com <strong className="text-white">57% de winrate</strong> sempre fica acima de
                                alguém com 53%, <strong className="text-primary">mesmo que tenha jogado menos partidas</strong>.
                                Jogar muito não substitui jogar bem!
                            </p>
                        </div>
                    </div>

                    {/* Step 4 - Examples */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1">4. Quanto mais você ganha, mais sobe</h3>
                            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                <div className="p-2 bg-white/5 rounded">
                                    <div className="text-muted-foreground">50% winrate</div>
                                    <div className="text-white font-bold">~3500 TMMR</div>
                                    <div className="text-[10px] text-muted-foreground">Archon</div>
                                </div>
                                <div className="p-2 bg-white/5 rounded">
                                    <div className="text-muted-foreground">55% winrate</div>
                                    <div className="text-white font-bold">~3750 TMMR</div>
                                    <div className="text-[10px] text-muted-foreground">Legend</div>
                                </div>
                                <div className="p-2 bg-white/5 rounded">
                                    <div className="text-muted-foreground">60% winrate</div>
                                    <div className="text-white font-bold">~4000 TMMR</div>
                                    <div className="text-[10px] text-muted-foreground">Ancient</div>
                                </div>
                                <div className="p-2 bg-primary/20 rounded border border-primary/30">
                                    <div className="text-muted-foreground">65%+ winrate</div>
                                    <div className="text-primary font-bold">~4500+ TMMR 🔥</div>
                                    <div className="text-[10px] text-primary/80">Divine / Immortal</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1">5. Receba sua patente</h3>
                            <p className="text-muted-foreground text-sm">
                                Com base no seu TMMR, você ganha uma <strong className="text-white">patente</strong> igual
                                ao Dota: de Herald até Immortal! E entra no ranking global.
                            </p>
                        </div>
                    </div>

                    {/* Step 6 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Zap className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1">6. Atualize quando quiser</h3>
                            <p className="text-muted-foreground text-sm">
                                Seu perfil pode ser atualizado a cada <strong className="text-white">7 dias</strong>.
                                Jogue mais Turbo, melhore sua winrate e suba no ranking!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer note */}
                <div className="mt-6 pt-4 border-t border-white/10">
                    <p className="text-xs text-muted-foreground text-center">
                        💡 Seus dados de partidas precisam estar <strong className="text-white">públicos</strong> nas configurações do Dota 2.
                    </p>
                </div>

                {/* Close action */}
                <div className="mt-6">
                    <Button onClick={onClose} className="w-full">
                        Entendi!
                    </Button>
                </div>
            </div>
        </div>
    );
}
