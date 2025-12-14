'use client';

import { Trophy, TrendingUp, Target, Activity, Star, X } from 'lucide-react';
import { useEffect } from 'react';

interface RankingInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: string;
}

const INFO_CONTENT: Record<string, { title: string; icon: any; description: string; details: string[] }> = {
    general: {
        title: 'Rank Geral (TMMR)',
        icon: Trophy,
        description: 'A métrica principal do sistema, projetada para medir sua habilidade real no modo Turbo.',
        details: [
            'Baseado em um sistema complexo que combina Vitória/Derrota e impacto individual.',
            'Ganha mais pontos ao vencer partidas difíceis (Average Rank alto).',
            'Considera seu impacto no jogo (KDA, participação) para calibrar os ganhos.',
            'Não é apenas sobre grindar jogos: qualidade importa mais que quantidade.'
        ]
    },
    winrate: {
        title: 'Ranking de Winrate',
        icon: TrendingUp,
        description: 'Focado puramente na sua capacidade de vencer partidas.',
        details: [
            'Calculado simplesmente como: Vitórias / Total de Jogos.',
            'Requer um mínimo de 50 partidas para aparecer no ranking.',
            'Ideal para identificar jogadores que sabem fechar jogos, independente do KDA.',
            'Ordenado da maior porcentagem para a menor.'
        ]
    },
    performance: {
        title: 'Ranking de Performance',
        icon: Target,
        description: 'Mede seu impacto individual médio nas partidas através do KDA.',
        details: [
            'Fórmula: (Kills + Assists * 0.7) / Deaths.',
            'Deaths tem peso significativo: morrer pouco é crucial para um KDA alto.',
            'Requer um mínimo de 20 partidas para aparecer.',
            'Destaca jogadores que jogam de forma limpa e impactante.'
        ]
    },
    consistency: {
        title: 'Ranking de Consistência',
        icon: Activity,
        description: 'Valoriza jogadores que mantêm um nível alto de jogo constantemente.',
        details: [
            'Calculado através da "Variância do KDA".',
            'Quanto menor a variância, mais constante é o jogador.',
            'Requer mínimo de 30 partidas.',
            'Jogadores aqui raramente têm "jogos ruins", entregando performance sólida sempre.'
        ]
    },
    pro: {
        title: 'Ranking PRO (High Skill)',
        icon: Star,
        description: 'A elite do Turbo. Considera apenas partidas de nível muito alto.',
        details: [
            'Considera APENAS partidas com Average Rank >= 65 (Ancient/Divine+).',
            'Partidas de nível baixo (stomps) são ignoradas.',
            'Ordenado pelo Winrate obtido exclusivamente nesses jogos difíceis.',
            'Requer mínimo de 10 partidas PRO para aparecer.',
            'É o teste definitivo: como você joga contra os melhores?'
        ]
    }
};

export function RankingInfoModal({ isOpen, onClose, mode }: RankingInfoModalProps) {
    const info = INFO_CONTENT[mode] || INFO_CONTENT.general;
    const Icon = info.icon;

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal Content */}
            <div
                className="relative bg-card border border-white/10 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-card border-b border-white/10 p-6 pb-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${mode === 'pro' ? 'bg-amber-500/20' : 'bg-primary/20'}`}>
                                <Icon className={`w-6 h-6 ${mode === 'pro' ? 'text-amber-400' : 'text-primary'}`} />
                            </div>
                            <h2 className="text-xl font-bold text-white">{info.title}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {info.description}
                    </p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="bg-white/5 rounded-lg p-4 space-y-3 border border-white/5">
                        <h4 className="text-sm font-semibold text-white">Como funciona:</h4>
                        <ul className="space-y-2">
                            {info.details.map((detail, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                    <span className="text-primary mt-1.5">•</span>
                                    <span>{detail}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="text-xs text-center text-muted-foreground pt-2">
                        Todas as métricas são atualizadas automaticamente a cada nova partida analisada.
                    </div>
                </div>
            </div>
        </div>
    );
}
