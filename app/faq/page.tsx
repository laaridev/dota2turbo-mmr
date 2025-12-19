'use client';

import { motion } from 'framer-motion';
import { HelpCircle, Search, Calculator, Clock, Shield, TrendingUp, Users, Zap, Sparkles } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';

const faqs = [
    {
        icon: Search,
        question: "Como sei que estão sendo contados apenas jogos Turbo?",
        answer: "Buscamos os dados diretamente da API do OpenDota usando um filtro específico para o modo Turbo (game_mode = 23). Isso garante que apenas partidas do modo Turbo sejam contabilizadas no cálculo do seu TMMR. Partidas ranked, unranked normais ou outros modos não são incluídas."
    },
    {
        icon: Calculator,
        question: "Como o sistema calcula meu TMMR? (v5.2)",
        answer: "O TMMR v5.2 usa um sistema de vitórias ponderadas: cada vitória vale 1.02^(rank-50) pontos. Vitórias em lobbies Immortal (rank 75) valem 1.64x mais que em Legend (rank 50). A fórmula é: TMMR = 3500 + (vitórias_ponderadas - esperado) / jogos × 3500 - penalidade_maturidade. Jogadores com menos de 200 partidas perdem até 300 pontos de TMMR."
    },
    {
        icon: TrendingUp,
        question: "O que são vitórias ponderadas?",
        answer: "Cada vitória é pesada pelo nível do lobby onde você ganhou. Se você ganhou em um lobby de rank médio 65 (Divine), essa vitória vale 1.35x mais que uma vitória em Legend (rank 50). Isso significa que vencer contra jogadores melhores te dá mais pontos proporcionalmente ao nível deles."
    },
    {
        icon: Shield,
        question: "Por que existe penalidade de maturidade?",
        answer: "A penalidade de maturidade evita que jogadores com poucos jogos e sorte inicial liderem o ranking. Se você tem menos de 200 partidas, perde até 300 pontos proporcionalmente. Com 40 jogos você perde 240 pontos, com 100 jogos perde 150 pontos, e com 200+ jogos não há penalidade. Isso garante que o ranking reflita desempenho consistente."
    },
    {
        icon: Clock,
        question: "Com que frequência posso atualizar meu perfil?",
        answer: "Atualmente, você pode atualizar seu perfil uma vez a cada 7 dias. Isso é necessário para evitar sobrecarga nos servidores e garantir que todos tenham acesso justo ao sistema."
    },
    {
        icon: Users,
        question: "Por que preciso ter no mínimo 30 partidas?",
        answer: "Com menos de 30 partidas, não temos dados estatísticos suficientes para calcular um TMMR confiável. O sistema usa modelos estatísticos que precisam de uma amostra mínima para determinar com precisão seu nível de habilidade."
    },
    {
        icon: Zap,
        question: "Jogar em party afeta meu TMMR?",
        answer: "Não diretamente. O TMMR v5.2 não diferencia partidas solo de party porque os dados de party_size da OpenDota não são confiáveis para a maioria das partidas. O que importa é o rank do lobby onde você joga e sua taxa de vitórias."
    },
    {
        icon: TrendingUp,
        question: "Como posso subir no ranking?",
        answer: "Para subir no TMMR: 1) Vença mais partidas (fator mais importante); 2) Jogue em lobbies de rank mais alto - vitórias lá valem mais; 3) Acumule pelo menos 200 partidas para eliminar a penalidade de maturidade. Lembre-se: ter muitas partidas não garante posição alta se seu winrate for baixo."
    },
    {
        icon: HelpCircle,
        question: "O sistema leva em conta partidas ranqueadas?",
        answer: "Não. O TMMR é calculado EXCLUSIVAMENTE com base em partidas do modo Turbo. Seu MMR ranked, medalhas ou partidas unranked normais não afetam o cálculo do TMMR de forma alguma. São sistemas completamente independentes."
    },
    {
        icon: Calculator,
        question: "O que é o multiplicador de rank?",
        answer: "O multiplicador de rank é 1.02^(rank-50). Isso significa que cada 10 níveis de rank acima de Legend (50) aumenta o valor da vitória em ~22%. Exemplos: Legend (50) = 1.0x, Ancient (55) = 1.10x, Divine (65) = 1.35x, Immortal (75) = 1.64x. Isso recompensa quem joga contra adversários fortes."
    }
];


export default function FAQPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section - Card Style */}
            <section className="pt-8 pb-6 px-4">
                <div className="container mx-auto max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/5 via-card/50 to-orange-500/5 p-8 md:p-12"
                    >
                        {/* Background Orbs */}
                        <div className="absolute top-0 left-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />

                        <div className="relative z-10 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6"
                            >
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium text-primary">Tire Suas Dúvidas</span>
                            </motion.div>

                            <h1 className="text-5xl md:text-6xl font-black mb-6">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-red-500">
                                    Dúvidas Frequentes
                                </span>
                            </h1>

                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                Tudo que você precisa saber sobre o TurboBuff e como o sistema funciona.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FAQ Content */}
            <div className="container mx-auto px-4 pb-12 max-w-4xl mt-4">
                {/* FAQ Accordion */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-card/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl"
                >
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger className="text-white hover:text-primary">
                                    <div className="flex items-center gap-3 text-left">
                                        <faq.icon className="w-5 h-5 text-primary flex-shrink-0" />
                                        <span className="font-semibold">{faq.question}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </motion.div>

                {/* Still have questions CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-12 text-center"
                >
                    <div className="bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/20 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-2">Ainda tem dúvidas?</h3>
                        <p className="text-muted-foreground mb-1">
                            Explore o sistema ou retorne à página inicial para começar
                        </p>
                        <p className="text-sm text-gray-400 mb-4">
                            Envie sua dúvida ou sugestão para: <a href="mailto:lariideveloper@gmail.com" className="text-primary hover:text-primary/80 transition-colors font-medium">lariideveloper@gmail.com</a>
                        </p>
                        <div className="flex gap-3 justify-center flex-wrap">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium"
                            >
                                <Search className="w-4 h-4" />
                                Analisar Perfil
                            </Link>
                            <Link
                                href="/leaderboard"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Ver Ranking
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
