'use client';

import { X, Database, Zap, Trophy, BarChart3, TrendingUp, Calculator } from 'lucide-react';
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
                            <h3 className="font-semibold text-lg mb-1">1. Coletamos seus dados</h3>
                            <p className="text-muted-foreground text-sm">
                                Usamos a API pública do OpenDota para buscar <strong className="text-white">todas as suas partidas do modo Turbo</strong>.
                                Não temos acesso à sua conta Steam, apenas dados públicos de partidas.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <BarChart3 className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1">2. Calculamos sua Winrate</h3>
                            <p className="text-muted-foreground text-sm">
                                Analisamos todas as suas partidas Turbo para calcular sua
                                <strong className="text-white"> taxa de vitória (winrate)</strong>.
                                Este é o fator mais importante do seu ranking!
                            </p>
                        </div>
                    </div>

                    {/* Step 3 - Formula */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <Calculator className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1">3. Fórmula do TMMR</h3>
                            <p className="text-muted-foreground text-sm mb-2">
                                Aplicamos uma fórmula que prioriza <strong className="text-primary">winrate sobre volume</strong>:
                            </p>
                            <div className="p-3 bg-white/5 rounded-lg text-xs font-mono text-white/80 space-y-1">
                                <div>Confiança = √(min(partidas, 500) / 500)</div>
                                <div>Ajuste WR = (winrate - 50%) × 5000</div>
                                <div className="text-primary font-bold">TMMR = 3500 + (Ajuste WR × Confiança)</div>
                            </div>
                            <p className="text-muted-foreground text-xs mt-2">
                                💡 O <strong className="text-white">cap de 500 partidas</strong> garante que
                                quem joga muito não tenha vantagem infinita. Quem tem 57% de WR
                                sempre fica acima de quem tem 53%, independente do volume!
                            </p>
                        </div>
                    </div>

                    {/* Step 4 - Examples */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1">4. Exemplos práticos</h3>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 bg-white/5 rounded">
                                    <div className="text-muted-foreground">50% WR (500 jogos)</div>
                                    <div className="text-white font-bold">~3500 TMMR</div>
                                </div>
                                <div className="p-2 bg-white/5 rounded">
                                    <div className="text-muted-foreground">55% WR (300 jogos)</div>
                                    <div className="text-white font-bold">~3700 TMMR</div>
                                </div>
                                <div className="p-2 bg-white/5 rounded">
                                    <div className="text-muted-foreground">60% WR (200 jogos)</div>
                                    <div className="text-white font-bold">~3800 TMMR</div>
                                </div>
                                <div className="p-2 bg-primary/20 rounded border border-primary/30">
                                    <div className="text-muted-foreground">66% WR (500 jogos)</div>
                                    <div className="text-primary font-bold">~4300 TMMR 🔥</div>
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
                            <h3 className="font-semibold text-lg mb-1">5. Você entra no Ranking</h3>
                            <p className="text-muted-foreground text-sm">
                                Com base no seu TMMR, você recebe uma <strong className="text-white">patente</strong> (Herald → Immortal)
                                e entra no ranking global. Os melhores jogadores aparecem no topo!
                            </p>
                        </div>
                    </div>

                    {/* Step 6 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Zap className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1">6. Atualize semanalmente</h3>
                            <p className="text-muted-foreground text-sm">
                                Seu perfil pode ser atualizado a cada <strong className="text-white">7 dias</strong>.
                                Continue jogando Turbo e suba no ranking!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer note */}
                <div className="mt-6 pt-4 border-t border-white/10">
                    <p className="text-xs text-muted-foreground text-center">
                        💡 Lembre-se: seus dados de partidas precisam estar públicos nas configurações do Dota 2.
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
