'use client';

import { X, Database, Zap, Trophy, TrendingUp, Star, Target } from 'lucide-react';
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
                            <h3 className="font-semibold text-sm mb-0.5">1. Analisamos suas partidas</h3>
                            <p className="text-muted-foreground text-xs">
                                Buscamos <strong className="text-white">todas as suas partidas Turbo</strong> através do OpenDota.
                                Precisamos apenas do seu ID do Dota 2.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <Target className="h-4 w-4 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-0.5">2. Calculamos sua Winrate</h3>
                            <p className="text-muted-foreground text-xs">
                                A <strong className="text-primary">taxa de vitória</strong> é o fator principal do seu TMMR.
                                Ela determina o quão alto você pode subir no ranking.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-0.5">3. Fator de Confiança</h3>
                            <p className="text-muted-foreground text-xs">
                                Quanto mais partidas você tem, mais <strong className="text-white">confiável</strong> é o seu ranking.
                                Mas após <strong className="text-primary">~300 jogos</strong>, o ganho por partida diminui muito.
                            </p>
                        </div>
                    </div>

                    {/* Step 4 - Formula simplified */}
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <Star className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm mb-1">4. Resultado Final</h3>
                            <p className="text-muted-foreground text-xs mb-2">
                                Seu TMMR é calculado assim: partimos de <strong className="text-white">3500 pontos</strong> e
                                ajustamos para cima ou para baixo baseado na sua WR.
                            </p>
                            <div className="bg-white/5 rounded-lg p-2 text-[10px] space-y-1 font-mono">
                                <div><span className="text-muted-foreground">50% WR →</span> <span className="text-emerald-400">~3500 TMMR</span> <span className="text-muted-foreground">(Legend)</span></div>
                                <div><span className="text-muted-foreground">57% WR →</span> <span className="text-indigo-400">~3850 TMMR</span> <span className="text-muted-foreground">(Ancient)</span></div>
                                <div><span className="text-muted-foreground">65% WR →</span> <span className="text-pink-400">~4250 TMMR</span> <span className="text-muted-foreground">(Divine)</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-0.5">5. Você entra no Ranking</h3>
                            <p className="text-muted-foreground text-xs">
                                Receba sua <strong className="text-white">patente</strong> (Herald → Immortal) e compare
                                com outros jogadores. Atualize a cada <strong className="text-primary">7 dias</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Key point */}
                <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-xs text-center">
                        💡 <strong className="text-white">O segredo:</strong> 57% de WR sempre supera 53%,
                        <span className="text-primary"> independente de quantas partidas jogou</span>.
                    </p>
                </div>

                <div className="mt-4">
                    <Button onClick={onClose} className="w-full h-9 text-sm">
                        Entendi!
                    </Button>
                </div>
            </div>
        </div>
    );
}
