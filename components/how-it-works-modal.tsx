'use client';

import { X, Database, Shield, RefreshCw, Trophy, Clock } from 'lucide-react';
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
                                Usamos dados públicos do <strong className="text-white">OpenDota</strong> para
                                acessar todas as suas partidas do modo Turbo.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-0.5">2. Perfil público necessário</h3>
                            <p className="text-muted-foreground text-xs">
                                Suas partidas precisam estar <strong className="text-white">públicas</strong> nas
                                configurações do Dota 2 para que possamos acessá-las.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-0.5">3. Calculamos seu TMMR</h3>
                            <p className="text-muted-foreground text-xs">
                                Com base nas suas partidas, calculamos seu <strong className="text-primary">Turbo MMR</strong> e
                                atribuímos uma patente (Herald até Immortal).
                            </p>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-0.5">4. Mínimo de 30 partidas</h3>
                            <p className="text-muted-foreground text-xs">
                                Você precisa ter pelo menos <strong className="text-white">30 partidas Turbo</strong> para
                                aparecer no ranking.
                            </p>
                        </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <RefreshCw className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm mb-0.5">5. Atualize a cada 7 dias</h3>
                            <p className="text-muted-foreground text-xs">
                                Você pode atualizar seu perfil <strong className="text-white">uma vez por semana</strong> para
                                refletir suas novas partidas.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-5">
                    <Button onClick={onClose} className="w-full h-9 text-sm">
                        Entendi!
                    </Button>
                </div>
            </div>
        </div>
    );
}
