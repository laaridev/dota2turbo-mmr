'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, HelpCircle, ChevronRight, Trophy, Zap, Users } from 'lucide-react';
import { HowItWorksModal } from '@/components/how-it-works-modal';
import { motion } from 'framer-motion';
import Particles from "@tsparticles/react";
import { loadSlim } from "tsparticles-slim";
import type { Engine } from "tsparticles-engine";

export default function Home() {
  const [inputId, setInputId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const router = useRouter();

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputId.trim()) return;
    setLoading(true);
    router.push(`/profile/${inputId.trim()}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4 relative overflow-hidden">

      {/* Particle Background */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        className="absolute inset-0 -z-10"
        options={{
          background: { color: { value: "transparent" } },
          fpsLimit: 60,
          particles: {
            color: { value: ["#ff6b35", "#ff8c42", "#ffa94d"] },
            links: {
              color: "#ff6b35",
              distance: 150,
              enable: true,
              opacity: 0.1,
              width: 1,
            },
            move: {
              enable: true,
              speed: 0.8,
              direction: "none",
              random: true,
              straight: false,
              outModes: { default: "out" },
            },
            number: {
              density: { enable: true },
              value: 40,
            },
            opacity: { value: { min: 0.1, max: 0.4 } },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 3 } },
          },
          detectRetina: true,
        }}
      />

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
          style={{ top: '40%', left: '50%' }}
        />
      </div>

      {/* How it Works Modal */}
      <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />

      {/* Main Content - Elevated */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-6 max-w-3xl relative z-10 -mt-16"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary"
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Ranking exclusivo para Turbo</span>
        </motion.div>

        {/* Title */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                Turbo
              </span>
              <span className="bg-gradient-to-r from-primary via-orange-400 to-primary bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
                Rank
              </span>
            </span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
            Descubra seu verdadeiro rank no modo Turbo.
            <br className="hidden md:block" />
            <span className="text-white/80">Só colar o ID e pronto.</span>
          </p>
        </motion.div>

        {/* Search Box */}
        <motion.form
          onSubmit={handleAnalyze}
          className="w-full max-w-lg mx-auto pt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-orange-500/50 rounded-full blur-lg opacity-0 group-hover:opacity-70 group-focus-within:opacity-70 transition-all duration-500" />
            <div className="relative flex items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-5 py-1.5 hover:border-white/20 focus-within:border-primary/60 transition-all duration-300 shadow-2xl">
              <Search className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
              <Input
                placeholder="Seu Dota ID"
                className="bg-transparent border-0 focus-visible:ring-0 text-lg h-12 placeholder:text-muted-foreground/50 font-medium"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
              />
              <Button
                type="submit"
                disabled={loading || !inputId.trim()}
                className="rounded-full px-6 h-11 bg-gradient-to-r from-primary to-orange-500 hover:from-primary hover:to-orange-400 text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Buscar
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.form>

        {/* Quick Links */}
        <motion.div
          className="flex items-center justify-center gap-6 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <button
            onClick={() => setShowHowItWorks(true)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            Como funciona
          </button>
          <span className="text-white/10">|</span>
          <a
            href="/leaderboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <Trophy className="h-4 w-4" />
            Ver ranking
          </a>
        </motion.div>

      </motion.div>

      {/* Bottom Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-8 text-sm text-muted-foreground/80"
      >
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-green-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span>Online</span>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Apenas Turbo</span>
        </div>
      </motion.div>
    </div>
  );
}
