'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Trophy, Zap, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function Home() {
  const [inputId, setInputId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputId.trim()) return;

    setLoading(true);
    // Ideally we might validate ID format here, but we'll let the profile page or API handle it.
    // We direct the user to the profile page which will trigger the fetch if needed (SSR or Client fetch).
    // Actually, for better UX with "fetching", sending to a loading state on the profile page is good.
    router.push(`/profile/${inputId.trim()}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6 max-w-3xl relative z-10"
      >
        <div className="space-y-2">
          <h1 className="text-4xl md:text-7xl font-bold tracking-tighter text-glow">
            Dota2<span className="text-primary">Turbo</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto">
            Chega de papo furado. Cole seu ID, descubra seu Rank Real™ e prove que você não é só mais um "Mono Hero" na fila do Turbo.
          </p>
        </div>

        <Card className="p-2 bg-background/50 border-white/10 backdrop-blur-md max-w-lg mx-auto box-glow">
          <form onSubmit={handleAnalyze} className="flex gap-2">
            <Input
              placeholder="Cole seu Dota ID (ex: 15998782)"
              className="bg-transparent border-0 focus-visible:ring-0 text-lg h-12"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
            />
            <Button size="lg" className="h-12 w-32" type="submit" disabled={loading} variant="premium">
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Quem sou eu? <Zap className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <FeatureCard
            icon={<Trophy className="h-6 w-6 text-yellow-500" />}
            title="Seu MMR de Verdade"
            description="Esqueça o ranking da Valve. Aqui o que conta é ganhar rápido e stompar com estilo."
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6 text-blue-500" />}
            title="Análise Flash"
            description="Buscamos todo o seu histórico num piscar de olhos. Sem enrolação, direto ao ponto."
          />
          <FeatureCard
            icon={<Clock className="h-6 w-6 text-purple-500" />}
            title="Rei da Semana"
            description="Reseta toda semana. Quem spamma mais e ganha mais, vira lenda. Simples assim."
          />
        </div>
      </motion.div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
      <div className="mb-3 p-3 w-fit rounded-lg bg-background/50">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
