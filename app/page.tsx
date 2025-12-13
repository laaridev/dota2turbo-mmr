'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, HelpCircle } from 'lucide-react';
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
    <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4 relative overflow-hidden">

      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large floating orb */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/20 to-orange-500/15 blur-[100px]"
          initial={{ x: '-50%', y: '-50%' }}
          animate={{
            x: ['-50%', '-40%', '-60%', '-50%'],
            y: ['-50%', '-40%', '-55%', '-50%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ top: '30%', left: '50%' }}
        />

        {/* Secondary orb */}
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/10 blur-[80px]"
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -30, 40, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          style={{ top: '60%', left: '20%' }}
        />

        {/* Third orb */}
        <motion.div
          className="absolute w-[250px] h-[250px] rounded-full bg-gradient-to-br from-primary/15 to-yellow-500/10 blur-[70px]"
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 50, -20, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          style={{ top: '20%', right: '15%' }}
        />
      </div>

      {/* How it Works Modal */}
      <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center space-y-8 max-w-2xl relative z-10"
      >
        {/* Logo/Title with shimmer animation */}
        <div className="space-y-4">
          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-tight relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="relative inline-block">
              {/* Main gradient text */}
              <span className="bg-gradient-to-r from-primary via-orange-400 to-primary bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
                Dota2Turbo
              </span>
              {/* Glow effect behind text */}
              <span className="absolute inset-0 bg-gradient-to-r from-primary via-orange-400 to-primary bg-[length:200%_100%] bg-clip-text text-transparent blur-2xl opacity-50 animate-shimmer -z-10">
                Dota2Turbo
              </span>
            </span>
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Coloque seu ID do Dota e descubra qual seu MMR nas Turbos.
          </motion.p>
        </div>

        {/* Search Box with entrance animation */}
        <motion.form
          onSubmit={handleAnalyze}
          className="w-full max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="relative group">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/30 to-orange-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative flex items-center bg-secondary/80 backdrop-blur-sm border border-white/10 rounded-full px-6 py-2 hover:border-white/20 focus-within:border-primary/50 transition-all duration-300">
              <Search className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
              <Input
                placeholder="Seu Dota ID (ex: 15998782)"
                className="bg-transparent border-0 focus-visible:ring-0 text-lg h-12 placeholder:text-muted-foreground/60"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
              />
              <Button
                type="submit"
                disabled={loading || !inputId.trim()}
                className="rounded-full px-6 h-10 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-medium transition-all hover:scale-105"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Buscar'
                )}
              </Button>
            </div>
          </div>
        </motion.form>

        {/* How it works link */}
        <motion.button
          onClick={() => setShowHowItWorks(true)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          whileHover={{ scale: 1.05 }}
        >
          <HelpCircle className="h-4 w-4 group-hover:rotate-12 transition-transform" />
          Como funciona?
        </motion.button>

      </motion.div>

      {/* Bottom Stats Teaser */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 text-sm text-muted-foreground"
      >
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-green-500"
            animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span>Ranking ao vivo</span>
        </div>
        <div className="hidden md:block h-4 w-px bg-white/10" />
        <span className="hidden md:block">Exclusivo para modo Turbo</span>
      </motion.div>
    </div>
  );
}
