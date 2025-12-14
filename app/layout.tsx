import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Better font loading performance
});

export const metadata: Metadata = {
  title: 'TurboBuff | Seu Rank Real no Dota 2 Turbo',
  description: 'Descubra seu verdadeiro rank no modo Turbo do Dota 2. Ranking exclusivo baseado em partidas Turbo.',
  keywords: ['Dota 2', 'Turbo', 'MMR', 'Ranking', 'TurboBuff'],
  openGraph: {
    title: 'TurboBuff | Seu Rank Real no Dota 2 Turbo',
    description: 'Descubra seu verdadeiro rank no modo Turbo do Dota 2',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={cn(inter.className, "min-h-screen bg-background antialiased selection:bg-primary/30")}>
        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-lg">
            <div className="container flex h-14 items-center justify-between mx-auto px-4">
              <Link href="/" className="flex gap-2 items-center group">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center font-bold text-white text-xs transition-transform group-hover:scale-105">TB</div>
                <span className="font-bold text-lg tracking-tight">
                  <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">Turbo</span>
                  <span className="text-white">Buff</span>
                </span>
              </Link>
              <nav className="flex items-center gap-6 text-sm">
                <Link href="/" className="text-muted-foreground transition-colors hover:text-white">Início</Link>
                <Link href="/leaderboard" className="text-muted-foreground transition-colors hover:text-white">Ranking</Link>
                <Link href="/hall-of-fame" className="text-muted-foreground transition-colors hover:text-white">Hall da Fama</Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/5 bg-background/50">
            <div className="container mx-auto px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>© 2025 TurboBuff</span>
              <div className="flex items-center gap-3">
                <span>Idealizadora: <span className="text-foreground">Yolanda</span></span>
                <span className="text-white/20">•</span>
                <span>Dev: <span className="text-primary">Larissa</span></span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
