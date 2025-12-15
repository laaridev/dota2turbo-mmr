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
        title: 'Rank Geral (TMMR v3.0)',
        icon: Trophy,
        description: 'Quanto mais forte o oponente, maior sua recompensa ao vencer. Qualidade > Quantidade.',
        details: [
            'Componente de Winrate (50%): Suas vitórias divididas pelo total de partidas.',
            'Componente de Simulação (50%): Rating que considera a força dos oponentes que você enfrentou.',
            'ℹ️  Nível da partida: OpenDota fornece o "Average Rank" estimado de cada partida.',
            '   Esse valor (0-80) representa o nível médio dos 10 jogadores na partida.',
            '🎯 Ganhar contra oponentes fortes = Recompensa MASSIVA:',
            '   • Divine/Immortal (avg rank 70-80): DOBRA seus pontos (+50% a +100%)',
            '   • Ancient (avg rank 60-69): +25% a +50% de pontos',
            '   • Legend (avg rank 50-59): +15% a +25% de pontos',
            'Perder contra oponentes fracos = Punição maior.',
            'Fórmula: (Winrate × 0.5 + Simulação × 0.5) × Multiplicador_de_Dificuldade'
        ]
    },
    winrate: {
        title: 'Ranking de Winrate',
        icon: TrendingUp,
        description: 'Classificação baseada puramente na taxa de vitória.',
        details: [
            'Fórmula: (Vitórias / Total de Partidas) × 100',
            'Mínimo: 50 partidas para aparecer no ranking.',
            'Ordenação: Decrescente pela porcentagem de vitórias.'
        ]
    },
    performance: {
        title: 'Ranking de Performance',
        icon: Target,
        description: 'Média do KDA em todas as partidas.',
        details: [
            'Fórmula: (Kills + Assists × 0.7) / max(Deaths, 1)',
            'Assists têm peso de 70% comparado com Kills.',
            'Mínimo: 20 partidas para aparecer no ranking.',
            'Ordenação: Decrescente pelo KDA médio.'
        ]
    },
    consistency: {
        title: 'Ranking de Consistência',
        icon: Activity,
        description: 'Mede estabilidade da performance, não o nível. Quanto menos você varia, melhor.',
        details: [
            'Calcula KDA de cada partida individualmente.',
            'Mede variância estatística: o quanto seus KDAs flutuam entre partidas.',
            'Menor variância = mais consistente = melhor ranqueado.',
            'Exemplo: KDA sempre entre 4-6 (consistente) vs KDA entre 1-15 (inconsistente).',
            'Mínimo: 30 partidas para aparecer.',
            'Ordenação: Crescente pela variância (menor = mais estável).'
        ]
    },
    pro: {
        title: 'Ranking PRO (High Skill)',
        icon: Star,
        description: 'Considera exclusivamente partidas de alto nível competitivo.',
        details: [
            'Filtro: Average Rank >= 65 (Ancient IV+).',
            'Apenas partidas que passam no filtro são contabilizadas.',
            'Fórmula: (Vitórias PRO / Total Partidas PRO) × 100',
            'Mínimo: 10 partidas PRO para aparecer no ranking.',
            'Ordenação: Decrescente pelo Winrate PRO.'
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
