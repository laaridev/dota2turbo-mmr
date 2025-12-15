'use client';

import { Trophy, TrendingUp, Target, Activity, Star, Swords, X } from 'lucide-react';
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
        description: 'Quanto mais forte o oponente, maior sua recompensa. Jogar bem contra os melhores vale MUITO mais!',
        details: [
            '📊 Combina sua taxa de vitórias (50%) com a qualidade dos seus oponentes (50%).',
            '🎯 Vencer contra jogadores fortes = Recompensa MASSIVA:',
            '   • Divine/Immortal: Até o DOBRO de pontos!',
            '   • Ancient: +25% a +50% de pontos',
            '   • Legend: +15% a +25% de pontos',
            '⚠️ Atenção: Se você joga muito em nível alto mas perde (WR < 45%), seu bônus é reduzido.',
            '🏆 Bônus de Volume: +1.5 pontos a cada 10 vitórias (máximo +200).',
            '💡 Resumo: Vença consistentemente contra oponentes fortes para subir!'
        ]
    },
    winrate: {
        title: 'Ranking de Winrate',
        icon: TrendingUp,
        description: 'Puro e simples: quantas partidas você ganhou?',
        details: [
            '🎮 Vitórias divididas pelo total de jogos.',
            '📈 Quanto maior sua % de vitórias, melhor sua posição.',
            '🎯 Mínimo: 50 partidas para aparecer no ranking.'
        ]
    },
    performance: {
        title: 'Ranking de Performance',
        icon: Target,
        description: 'Seu desempenho médio em combate (KDA).',
        details: [
            '⚔️ KDA = (Abates + Assistências × 0.7) / Mortes',
            '💀 Assistências valem 70% de um abate.',
            '📊 Mínimo: 20 partidas.',
            '🏅 Quanto menos você morre e mais participa, melhor!'
        ]
    },
    specialist: {
        title: 'Ranking de Especialistas',
        icon: Swords,
        description: 'Os mestres de um herói específico. Dedicação + Habilidade = Topo!',
        details: [
            '🗡️ Mostra seu MELHOR herói (maior winrate com 10+ jogos).',
            '⚖️ Equilibra vitórias (70%) com dedicação (30%).',
            '📈 5000 jogos com 60% WR > 30 jogos com 90% WR.',
            '💪 Jogue MUITO com um herói e vença para dominar!',
            '🖼️ Exibe: Foto do herói + Seu nome + Winrate + Total de jogos.'
        ]
    },
    pro: {
        title: 'Ranking Alto Nível',
        icon: Star,
        description: 'Apenas partidas contra jogadores Ancient ou superior. A elite!',
        details: [
            '👑 Filtro: Apenas jogos com Average Rank 60+ (Ancient ou superior).',
            '⚖️ Equilibra seu winrate (70%) com quantos jogos PRO você jogou (30%).',
            '🎯 1000 jogos PRO @ 55% > 30 jogos @ 90%.',
            '💡 Jogue MUITO em alto nível e vença para liderar!',
            '📊 Mínimo: Pelo menos 1 jogo Ancient+.'
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
