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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/15 to-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* How it Works Modal */}
      <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center space-y-8 max-w-2xl relative z-10"
      >
        {/* Logo/Title */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="gradient-text">Dota2Turbo</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto">
            Coloque seu ID do Dota e descubra qual seu MMR nas Turbos.
          </p>
        </div>

        {/* Search Box - Google Style */}
        <form onSubmit={handleAnalyze} className="w-full max-w-xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300" />
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
                className="rounded-full px-6 h-10 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-medium transition-all"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Buscar'
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* How it works link */}
        <button
          onClick={() => setShowHowItWorks(true)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
        >
          <HelpCircle className="h-4 w-4 group-hover:rotate-12 transition-transform" />
          Como funciona?
        </button>

      </motion.div>

      {/* Bottom Stats Teaser */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 text-sm text-muted-foreground"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Ranking ao vivo</span>
        </div>
        <div className="hidden md:block h-4 w-px bg-white/10" />
        <span className="hidden md:block">Exclusivo para modo Turbo</span>
      </motion.div>
    </div>
  );
}
