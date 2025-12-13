import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TurboRank | Seu Rank Real no Dota 2 Turbo',
  description: 'Descubra seu verdadeiro rank no modo Turbo do Dota 2. Ranking exclusivo baseado em partidas Turbo.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={cn(inter.className, "min-h-screen bg-background antialiased selection:bg-primary/30")}>
        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl transition-all">
            <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0 mx-auto px-4">
              <div className="flex gap-2 items-center">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-orange-500 box-glow flex items-center justify-center font-bold text-white text-sm">T</div>
                <span className="font-bold text-xl tracking-tight">Turbo<span className="text-primary">Rank</span></span>
              </div>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <a href="/" className="transition-colors hover:text-primary">Início</a>
                <a href="/leaderboard" className="transition-colors hover:text-primary">Ranking</a>
                <a href="/hall-of-fame" className="transition-colors hover:text-primary">Hall da Fama</a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/5 bg-background/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>© 2024 TurboRank</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Idealizadora: <span className="text-foreground font-medium">Yolanda</span></span>
                <span className="text-white/20">•</span>
                <span>Desenvolvedora: <span className="text-primary font-medium">Larissa</span></span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
