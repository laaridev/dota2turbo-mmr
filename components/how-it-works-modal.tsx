'use client';

import { X, Database, Zap, Trophy, BarChart3 } from 'lucide-react';
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
                            <h3 className="font-semibold text-lg mb-1">2. Calculamos seu TMMR</h3>
                            <p className="text-muted-foreground text-sm">
                                Criamos um sistema de pontuação exclusivo para Turbo. Você começa com <strong className="text-white">2000 pontos base</strong>.
                                Cada vitória adiciona ~25-30 pontos e cada derrota remove a mesma quantidade.
                                Apenas partidas Turbo contam!
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1">3. Você entra no Ranking</h3>
                            <p className="text-muted-foreground text-sm">
                                Com base no seu TMMR, você recebe uma <strong className="text-white">patente</strong> (Bronze → Divino)
                                e entra no ranking global. Os melhores jogadores aparecem no topo!
                            </p>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <Zap className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1">4. Atualize semanalmente</h3>
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
