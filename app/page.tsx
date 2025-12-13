'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, HelpCircle, ChevronRight, Trophy, Zap, Users } from 'lucide-react';
import { HowItWorksModal } from '@/components/how-it-works-modal';
import { motion } from 'framer-motion';

export default function Home() {
  const [inputId, setInputId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const router = useRouter();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputId.trim()) return;
    setLoading(true);
    router.push(`/profile/${inputId.trim()}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-7rem)] p-4 relative overflow-hidden">

      {/* Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/25 to-orange-600/20 blur-[120px]"
          animate={{
            x: ['-50%', '-40%', '-60%', '-50%'],
            y: ['-50%', '-60%', '-40%', '-50%'],
            scale: [1, 1.1, 0.95, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: '30%', left: '40%' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-orange-500/15 to-rose-500/10 blur-[100px]"
          animate={{
            x: ['50%', '60%', '40%', '50%'],
            y: ['50%', '40%', '60%', '50%'],
            scale: [1, 0.95, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: '20%', right: '30%' }}
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-8 max-w-2xl relative z-10 -mt-16"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary"
        >
          <Zap className="w-3.5 h-3.5" />
          Ranking exclusivo para Turbo
        </motion.div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          <span className="gradient-text animate-shimmer bg-[length:200%_100%]">TurboRank</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Descubra seu ranking no modo Turbo.
        </p>

        {/* Search Form */}
        <motion.form
          onSubmit={handleAnalyze}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Seu ID do Dota 2"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              className="pl-12 pr-10 h-14 text-lg rounded-xl border-white/10 bg-card/50 backdrop-blur-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
            {/* Help tooltip */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 group">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center cursor-help text-muted-foreground hover:text-foreground hover:bg-white/20 transition-colors">
                <span className="text-xs font-medium">?</span>
              </div>
              <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-card border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="text-xs space-y-2">
                  <p className="font-medium text-foreground">Como encontrar seu ID:</p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                    <li>Abra o Dota 2</li>
                    <li>Clique no seu perfil</li>
                    <li>O ID aparece na URL ou na tela de perfil</li>
                  </ol>
                  <p className="text-muted-foreground pt-1">Exemplo: <span className="text-primary font-mono">123456789</span></p>
                </div>
                <div className="absolute -bottom-1 right-4 w-2 h-2 bg-card border-r border-b border-white/10 rotate-45" />
              </div>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading || !inputId.trim()}
            variant="premium"
            size="lg"
            className="h-14 px-8 text-lg rounded-xl shadow-lg shadow-primary/20"
          >
            {loading ? 'Analisando...' : 'Analisar'}
          </Button>
        </motion.form>

        {/* Links */}
        <motion.div
          className="flex items-center justify-center gap-6 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => setShowHowItWorks(true)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Como funciona
          </button>
          <a
            href="/leaderboard"
            className="flex items-center gap-1.5 text-primary hover:underline"
          >
            Ver ranking
            <ChevronRight className="w-4 h-4" />
          </a>
        </motion.div>
      </motion.div>

      {/* Bottom Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 text-sm text-muted-foreground"
      >
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <span>Ranking Oficial Turbo</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>Competição Semanal</span>
        </div>
      </motion.div>

      {/* Modal */}
      <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
    </div>
  );
}
