'use client';

import { Trophy, TrendingUp, Target, Activity, Star, Swords, X } from 'lucide-react';
import { useEffect } from 'react';
import { Portal } from '@/components/portal';

interface RankingInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: string;
}

const INFO_CONTENT: Record<string, { title: string; icon: any; description: string; details: string[] }> = {
    general: {
        title: 'Rank Geral (TMMR v4.0)',
        icon: Trophy,
        description: 'Sistema de classificação justo com ponderação solo/party, decaimento temporal e KDA normalizado por role.',
        details: [
            'Winrate Ponderada (50%): Partidas solo valem 1.3x, partidas em party valem 0.85x. Evita inflação por ser carregado.',
            'KDA Normalizado por Role (25%): Compara seu KDA com o esperado para seu herói. Supports com 2.0 KDA = Carry com 4.0 KDA.',
            'Rank das Partidas (15%): Média de rank dos lobbies onde você joga. Jogar contra melhores = bônus.',
            'Consistência (10%): Quão estável é seu desempenho. Menos variação = mais confiável.',
            'Decaimento Temporal: Partidas recentes pesam mais. Meia-vida de 180 dias. Reflete sua habilidade atual.',
            'Fórmula: TMMR = 3500 + (SkillScore × 3000 × Confiança × Recência × Dificuldade), limite 500-9500.'
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
        <Portal>
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                {/* Modal Content */}
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
                        {/* Context sections as introduction (only for general mode) */}
                        {mode === 'general' && (
                            <>
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-2">
                                    <h4 className="text-sm font-semibold text-amber-400">O Desafio do Turbo</h4>
                                    <p className="text-xs text-gray-300 leading-relaxed">
                                        Ao contrário do Dota competitivo, o modo Turbo não possui um sistema oficial de MMR.
                                        Isso torna extremamente difícil medir com precisão o nível de habilidade dos jogadores.
                                        Não há dados públicos de ranking real, matchmaking oculto ou histórico de partidas ranqueadas.
                                        Trabalhamos apenas com estatísticas de performance individual e algumas inferências sobre o nível das partidas.
                                    </p>
                                </div>

                                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
                                    <h4 className="text-sm font-semibold text-primary">Nossa Filosofia</h4>
                                    <p className="text-xs text-gray-300 leading-relaxed">
                                        Tentamos encontrar uma fórmula ideal e justa que equilibre volume de jogos, consistência e qualidade.
                                        O sistema foi projetado para recompensar jogadores dedicados que evoluem constantemente,
                                        sem permitir que apenas "spammar" partidas garanta o topo.
                                        Estamos sempre refinando o algoritmo com base em feedback da comunidade para torná-lo mais preciso e representativo.
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
                            Todas as métricas são atualizadas automaticamente a cada nova partida analisada.
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
