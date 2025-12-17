'use client';

import { motion } from 'framer-motion';
import { Heart, Code, Users, Gamepad2, Coffee, Github, Sparkles, Trophy, Zap } from 'lucide-react';
import Link from 'next/link';

const features = [
    {
        icon: Trophy,
        title: 'TMMR - Turbo MMR',
        description: 'Sistema exclusivo de ranking para o modo Turbo, calculado com base em performance, KDA e dificuldade dos adversários.',
        gradient: 'from-yellow-500 to-orange-500'
    },
    {
        icon: Users,
        title: 'Confrontos Diretos',
        description: 'Compare seu histórico de vitórias e derrotas contra seus amigos. Descubra quem realmente domina nos duelos.',
        gradient: 'from-red-500 to-pink-500'
    },
    {
        icon: Zap,
        title: 'Dados em Tempo Real',
        description: 'Integração com OpenDota API para trazer estatísticas atualizadas de todas as suas partidas Turbo.',
        gradient: 'from-blue-500 to-cyan-500'
    },
    {
        icon: Trophy,
        title: 'Ranking de Winrate',
        description: 'Classificação baseada na sua taxa de vitória. Quanto mais você vence, mais sobe no ranking!',
        gradient: 'from-green-500 to-emerald-500'
    },
    {
        icon: Trophy,
        title: 'Ranking de Performance',
        description: 'Avaliação focada no seu KDA médio. Premia jogadores que consistemente performam bem nas partidas.',
        gradient: 'from-purple-500 to-violet-500'
    },
    {
        icon: Trophy,
        title: 'Ranking de Especialistas',
        description: 'Destaque para jogadores que dominam heróis específicos. Mostra sua maestria em personagens favoritos.',
        gradient: 'from-pink-500 to-rose-500'
    },
    {
        icon: Trophy,
        title: 'Ranking Alto Nível',
        description: 'Competição para jogadores de elite. Baseado no avg_rank da API, que indica a dificuldade média das partidas. Apenas jogadores que enfrentam adversários de nível 60+ entram aqui.',
        gradient: 'from-amber-500 to-yellow-500'
    }
];

const values = [
    { icon: Heart, text: 'Feito com amor pela comunidade' },
    { icon: Coffee, text: 'Desenvolvido nos fins de semana' },
    { icon: Code, text: '100% Open Source' },
    { icon: Gamepad2, text: 'Por jogadores, para jogadores' }
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 px-4">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-orange-500/10" />
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />

                <div className="container mx-auto max-w-4xl relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6"
                        >
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Projeto da Comunidade</span>
                        </motion.div>

                        <h1 className="text-5xl md:text-6xl font-black mb-6">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-red-500">
                                Sobre o TurboRank
                            </span>
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            Um projeto de hobby feito com carinho para a comunidade brasileira de Dota 2 Turbo.
                            Sem fins lucrativos, apenas diversão e competição saudável entre amigos.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-10 px-4">
                <div className="container mx-auto max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12"
                    >
                        <h2 className="text-3xl font-bold mb-6 text-center">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                                ✨ Nossa Motivação
                            </span>
                        </h2>

                        <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                            <p>
                                O modo <strong className="text-white">Turbo</strong> do Dota 2 não possui ranking oficial da Valve.
                                Muitos jogadores dedicados a esse modo ficavam sem uma forma de medir sua evolução
                                ou comparar habilidades com amigos.
                            </p>
                            <p>
                                O <strong className="text-primary">TurboRank</strong> nasceu dessa necessidade! Criamos um sistema
                                de pontuação próprio chamado <strong className="text-orange-400">TMMR (Turbo MMR)</strong> que
                                analisa suas partidas e calcula um ranking baseado em múltiplos fatores.
                            </p>
                            <p>
                                Este é um projeto 100% voluntário, desenvolvido nos <strong className="text-white">fins de semana
                                    e tempo livre</strong>, sem qualquer intenção de lucro. É feito por jogadores, para jogadores! 🎮
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section - Vertical List */}
            <section className="py-8 px-4">
                <div className="container mx-auto max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12"
                    >
                        <h2 className="text-3xl font-bold mb-8 text-center">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                                🚀 O que oferecemos
                            </span>
                        </h2>

                        <div className="space-y-6">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-start gap-4"
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}>
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold mb-1 text-white">{feature.title}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>




            {/* Disclaimer Section */}
            <section className="py-8 px-4">
                <div className="container mx-auto max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-card/30 border border-white/10 rounded-2xl p-6 text-center"
                    >
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            <strong className="text-white">Aviso Legal:</strong> Este projeto não é afiliado, associado,
                            autorizado, endossado ou de qualquer forma conectado oficialmente à Valve Corporation
                            ou ao Dota 2. Os dados utilizados são obtidos através da API pública do OpenDota.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 px-4">
                <div className="container mx-auto max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-bold mb-4">
                            Pronto para descobrir seu TMMR?
                        </h2>
                        <p className="text-muted-foreground mb-8">
                            Analise seu perfil e entre no ranking da comunidade!
                        </p>

                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary/30 transition-all"
                            >
                                <Zap className="w-5 h-5" />
                                Analisar Meu Perfil
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
