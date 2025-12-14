'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, HelpCircle, ChevronRight, Trophy, Zap, Users, Crown, Flame } from 'lucide-react';
import { HowItWorksModal } from '@/components/how-it-works-modal';
import { AnalysisModal } from '@/components/analysis-modal';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  const [inputId, setInputId] = useState('');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | undefined>();
  const [playerData, setPlayerData] = useState<any>(undefined);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingDays, setRemainingDays] = useState<number | undefined>();
  const router = useRouter();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputId.trim()) return;

    setShowAnalysisModal(true);
    setAnalysisLoading(true);
    setAnalysisError(undefined);
    setPlayerData(undefined);
    setIsLocked(false);
    setRemainingDays(undefined);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inputId.trim() })
      });

      const data = await response.json();

      if (response.status === 429 && data.player) {
        // Locked - show existing data
        setPlayerData(data.player);
        setIsLocked(true);
        setRemainingDays(data.remainingDays);
        setAnalysisLoading(false);
        return;
      }

      if (!response.ok) {
        setAnalysisError(data.message || data.error || 'Erro ao analisar perfil');
        setAnalysisLoading(false);
        return;
      }

      setPlayerData(data.player);
      setAnalysisLoading(false);
    } catch (error) {
      setAnalysisError('Erro de conexão. Tente novamente.');
      setAnalysisLoading(false);
    }
  };

  const handleViewProfile = () => {
    if (playerData?.steamId) {
      router.push(`/profile/${playerData.steamId}`);
    }
  };

  const handleCloseAnalysisModal = () => {
    setShowAnalysisModal(false);
    setAnalysisError(undefined);
    setPlayerData(undefined);
    setIsLocked(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] p-4 relative overflow-hidden">

      {/* Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/25 to-orange-600/20 blur-[120px]"
          animate={{ x: ['-50%', '-40%', '-60%', '-50%'], y: ['-50%', '-60%', '-40%', '-50%'], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: '20%', left: '40%' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-orange-500/15 to-rose-500/10 blur-[100px]"
          animate={{ x: ['50%', '60%', '40%', '50%'], y: ['50%', '40%', '60%', '50%'], scale: [1, 0.95, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: '30%', right: '30%' }}
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center text-center gap-5 max-w-2xl relative z-10"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary"
        >
          <Zap className="w-3.5 h-3.5" />
          Descubra seu MMR das turbinhos no Dota 2
        </motion.div>

        {/* Title */}
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-primary/30 via-orange-500/20 to-primary/30 opacity-50" />
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter relative">
            <span className="bg-gradient-to-r from-primary via-orange-400 to-amber-400 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%] drop-shadow-2xl">
              Turbo
            </span>
            <span className="text-white drop-shadow-lg">Buff</span>
          </h1>
          <motion.div
            className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mt-2 mx-auto max-w-40"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          />
        </div>

        {/* Search Form */}
        <motion.form
          onSubmit={handleAnalyze}
          className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
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
                    <li>O ID aparece na URL ou na tela</li>
                  </ol>
                  <p className="text-muted-foreground pt-1">Exemplo: <span className="text-primary font-mono">123456789</span></p>
                </div>
                <div className="absolute -bottom-1 right-4 w-2 h-2 bg-card border-r border-b border-white/10 rotate-45" />
              </div>
            </div>
          </div>
          <Button
            type="submit"
            disabled={!inputId.trim()}
            variant="premium"
            size="lg"
            className="h-14 px-8 text-lg rounded-xl shadow-lg shadow-primary/20"
          >
            Analisar
          </Button>
        </motion.form>

        {/* Quick Actions */}
        <motion.div
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => setShowHowItWorks(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-muted-foreground hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            Como funciona
          </button>
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary hover:bg-primary/20 transition-all"
          >
            <Trophy className="w-4 h-4" />
            Ver ranking
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Bottom Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6"
      >
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-white/10">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Crown className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white">Ranking Global</div>
            <div className="text-[10px] text-muted-foreground">Top jogadores Turbo</div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/50 backdrop-blur-sm border border-white/10">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-white">Atualização Semanal</div>
            <div className="text-[10px] text-muted-foreground">Atualize a cada 7 dias</div>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
      <AnalysisModal
        isOpen={showAnalysisModal}
        onClose={handleCloseAnalysisModal}
        isLoading={analysisLoading}
        player={playerData}
        error={analysisError}
        isLocked={isLocked}
        remainingDays={remainingDays}
        onViewProfile={handleViewProfile}
      />
    </div>
  );
}
