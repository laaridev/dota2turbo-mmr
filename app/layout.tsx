import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/navbar';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
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
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/5 bg-background/50">
            <div className="container mx-auto px-4 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>© 2025 TurboBuff</span>
              <div className="flex items-center gap-2">
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
