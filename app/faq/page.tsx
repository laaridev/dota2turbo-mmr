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
        question: "Como o sistema calcula meu TMMR?",
        answer: "O TMMR v3.0 usa uma fórmula em 3 camadas: Skill Score (baseado em winrate confiável via Wilson Score, KDA e rank das partidas) × Confidence Score (baseado na quantidade de jogos) × Difficulty Exposure (bônus por jogar contra oponentes de alto nível). A fórmula final é: TMMR = 3500 + (SkillScore × 3000 × Confidence × Difficulty), limitado entre 500-9500."
    },
    {
        icon: TrendingUp,
        question: "Por que meu TMMR é diferente do meu MMR normal?",
        answer: "O Dota 2 Turbo não possui um sistema oficial de MMR. Criamos o TMMR especificamente para o modo Turbo, que tem dinâmicas muito diferentes do ranked tradicional. O TMMR leva em conta fatores específicos do Turbo e não tem relação com seu MMR de partidas ranqueadas normais."
    },
    {
        icon: Clock,
        question: "Com que frequência posso atualizar meu perfil?",
        answer: "Atualmente, você pode atualizar seu perfil uma vez a cada 7 dias. Isso é necessário para evitar sobrecarga nos servidores e garantir que todos tenham acesso justo ao sistema. No futuro, planejamos implementar atualizações automáticas em tempo real."
    },
    {
        icon: Users,
        question: "Por que preciso ter no mínimo 30 partidas?",
        answer: "Com menos de 30 partidas, não temos dados estatísticos suficientes para calcular um TMMR confiável. O sistema usa modelos estatísticos que precisam de uma amostra mínima para determinar com precisão seu nível de habilidade e evitar flutuações excessivas causadas por sorte/azar."
    },
    {
        icon: Shield,
        question: "Meu perfil não foi encontrado, o que fazer?",
        answer: "Verifique se: 1) Seu perfil do Dota 2 está configurado como público nas configurações de privacidade do Steam; 2) Você digitou o ID correto (Steam ID, Friend ID ou link do perfil); 3) Você tem pelo menos 30 partidas no modo Turbo; 4) Suas partidas estão visíveis publicamente (opção 'Expor Dados Públicos de Partidas' habilitada no Dota 2)."
    },
    {
        icon: Zap,
        question: "Por que alguns valores podem mudar?",
        answer: "O sistema está em BETA e em desenvolvimento contínuo. Estamos constantemente refinando a fórmula com base em feedback da comunidade e análise de dados reais. Pequenos ajustes podem ser feitos para tornar o ranking mais justo e representativo. Mudanças significativas serão sempre comunicadas."
    },
    {
        icon: Calculator,
        question: "O que são Skill Score, Confidence e Difficulty?",
        answer: "São os 3 pilares do TMMR: Skill Score mede sua habilidade bruta (60% winrate, 25% KDA, 15% rank médio das partidas). Confidence Score reflete a confiabilidade dos dados (cresce com mais jogos, satura em ~300-500 partidas). Difficulty Exposure é um multiplicador (0.7-1.5x) baseado em quão frequentemente você enfrenta jogadores de alto nível (Ancient+)."
    },
    {
        icon: TrendingUp,
        question: "Como posso subir no ranking?",
        answer: "Para subir no TMMR: 1) Vença mais partidas (fator mais importante); 2) Mantenha um KDA consistente; 3) Jogue contra oponentes de nível mais alto quando possível; 4) Acumule mais partidas para aumentar sua Confidence. Lembre-se: não basta apenas 'spammar' jogos - você precisa evoluir e vencer para subir."
    },
    {
        icon: HelpCircle,
        question: "O sistema leva em conta partidas ranqueadas?",
        answer: "Não. O TMMR é calculado EXCLUSIVAMENTE com base em partidas do modo Turbo. Seu MMR ranked, medalhas ou partidas unranked normais não afetam o cálculo do TMMR de forma alguma. São sistemas completamente independentes."
    }
];

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section - Same style as About */}
            <section className="relative overflow-hidden py-20 px-4 pb-28">
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
                    </motion.div>
                </div>

                {/* Curved Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-16 md:h-20">
                        <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="hsl(var(--background))" />
                    </svg>
                </div>
            </section>

            {/* FAQ Content */}
            <div className="container mx-auto px-4 pb-12 max-w-4xl -mt-8">
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
