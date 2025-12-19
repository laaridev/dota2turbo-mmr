'use client';

import { Trophy, TrendingUp, Target, Swords, Star, X } from 'lucide-react';
import { useEffect } from 'react';
import { Portal } from '@/components/portal';

interface RankingInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: string;
}

const INFO_CONTENT: Record<string, { title: string; icon: any; description: string; details: string[] }> = {
    general: {
        title: 'Rank Geral (TMMR v5.2)',
        icon: Trophy,
        description: 'Sistema justo baseado em vitórias ponderadas pelo nível das partidas.',
        details: [
            'Vitórias Ponderadas: Cada vitória vale 1.02^(rank-50) pontos. Ganhar em lobbies Immortal (rank 75) vale 1.64x mais que em Legend (rank 50).',
            'Penalidade de Maturidade: Jogadores com menos de 200 partidas perdem até 300 pontos de TMMR. Isso evita que alguém com 40 jogos e sorte lidere o ranking.',
            'Dificuldade Real: Não usamos apenas a média - cada vitória é pesada individualmente pelo rank daquele lobby específico.',
            'Sem Inflação por Volume: Ter 10.000 partidas não garante vantagem sobre alguém com 500 partidas se o winrate for igual.',
            'Fórmula: TMMR = 3500 + (vitórias_ponderadas - esperado) / jogos × 3500 - penalidade_maturidade'
        ]
    },
    winrate: {
        title: 'Ranking de Winrate',
        icon: TrendingUp,
        description: 'Simplesmente: quantas partidas você ganhou.',
        details: [
            'Mede sua porcentagem de vitórias.',
            'Quanto maior sua taxa de vitória, melhor sua colocação.',
            'Requer no mínimo 50 partidas jogadas.'
        ]
    },
    performance: {
        title: 'Ranking de Performance',
        icon: Target,
        description: 'Seu desempenho médio em combate.',
        details: [
            'Avalia quantos abates e assistências você faz versus quantas mortes.',
            'Assistências contam quase tanto quanto abates.',
            'Morrer menos e participar mais dos abates aumenta sua posição.',
            'Requer no mínimo 20 partidas.'
        ]
    },
    specialist: {
        title: 'Ranking de Especialistas',
        icon: Swords,
        description: 'Os melhores jogadores com um herói específico.',
        details: [
            'Identifica o herói que você mais domina.',
            'Combina sua taxa de vitórias com quantas partidas você jogou com aquele herói.',
            'Jogar muito com um herói e vencer consistentemente te coloca no topo.',
            'Alguém com milhares de jogos e boa taxa de vitória ganha de quem tem poucos jogos perfeitos.',
            'Mostra a foto do herói ao lado do seu nome.'
        ]
    },
    pro: {
        title: 'Ranking Alto Nível',
        icon: Star,
        description: 'Apenas partidas contra jogadores Ancient ou superiores.',
        details: [
            'Filtra apenas seus jogos de mais alto nível.',
            'Combina suas vitórias nessas partidas com quanto você joga nesse nível.',
            'Jogadores dedicados que jogam muito em alto nível são recompensados.',
            'Poucos jogos com sorte não são suficientes para liderar.',
            'É necessário consistência em alto nível para dominar este ranking.'
        ]
    }
};

export function RankingInfoModal({ isOpen, onClose, mode }: RankingInfoModalProps) {
    const info = INFO_CONTENT[mode] || INFO_CONTENT.general;
    const Icon = info.icon;

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
        <Portal>
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                <div
                    className="relative z-10 bg-card border border-white/10 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
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
                        {/* Context sections (only for general mode) */}
                        {mode === 'general' && (
                            <>
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-2">
                                    <h4 className="text-sm font-semibold text-amber-400">O Desafio do Turbo</h4>
                                    <p className="text-xs text-gray-300 leading-relaxed">
                                        O modo Turbo não possui MMR oficial. Trabalhamos apenas com estatísticas
                                        de performance individual e o rank médio dos lobbies onde você joga.
                                    </p>
                                </div>

                                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
                                    <h4 className="text-sm font-semibold text-primary">Nossa Filosofia v5.2</h4>
                                    <p className="text-xs text-gray-300 leading-relaxed">
                                        Vitórias em lobbies difíceis valem mais. Jogadores com poucos jogos
                                        são penalizados até provarem consistência. Volume não infla o rating.
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Technical details */}
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
                            Todas as métricas são atualizadas quando você clica em &quot;Atualizar&quot;.
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
