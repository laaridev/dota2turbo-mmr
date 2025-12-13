'use client';

import { X, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrivateProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PrivateProfileModal({ isOpen, onClose }: PrivateProfileModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-white/10 rounded-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="bg-yellow-500/20 p-4 rounded-full">
                        <AlertTriangle className="h-10 w-10 text-yellow-500" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center mb-2">Perfil Privado Detectado</h2>

                {/* Message */}
                <p className="text-muted-foreground text-center mb-6">
                    Não conseguimos acessar seu histórico de partidas Turbo.
                    Para ser rankeado, você precisa habilitar a opção de dados públicos no Dota 2.
                </p>

                {/* Instructions */}
                <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-primary">Como liberar seus dados:</h3>
                    <ol className="text-sm space-y-2 text-muted-foreground">
                        <li><span className="text-white font-medium">1.</span> Abra o Dota 2</li>
                        <li><span className="text-white font-medium">2.</span> Vá em <span className="text-white">Configurações → Opções</span></li>
                        <li><span className="text-white font-medium">3.</span> Na aba <span className="text-white">Avançado</span>, procure por "Social"</li>
                        <li><span className="text-white font-medium">4.</span> Ative <span className="text-white">"Expor dados públicos de partidas"</span></li>
                        <li><span className="text-white font-medium">5.</span> Jogue pelo menos 1 partida Turbo para sincronizar</li>
                        <li><span className="text-white font-medium">6.</span> Volte aqui e tente novamente!</li>
                    </ol>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={onClose}>
                        Entendi
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={() => window.open('https://www.opendota.com/players', '_blank')}
                    >
                        Verificar no OpenDota <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
