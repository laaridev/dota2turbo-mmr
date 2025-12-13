import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dota2Turbo | Ranking Premium de Dota 2 Turbo',
  description: 'O leaderboard premium para jogadores de Dota 2 Turbo.',
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
                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary to-orange-500 box-glow" />
                <span className="font-bold text-xl tracking-tight">Dota2<span className="text-primary">Turbo</span></span>
              </div>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <a href="/" className="transition-colors hover:text-primary">Início</a>
                <a href="/leaderboard" className="transition-colors hover:text-primary">Ranking</a>
                <a href="/hall-of-fame" className="transition-colors hover:text-primary">Hall da Fama</a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/5 py-6">
            <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
              <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                Feito para a comunidade de Dota 2 Turbo. Não afiliado à Valve.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
