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
    <html lang="pt-BR" className="dark h-full">
      {/* 
        Body: h-full w-full overflow-hidden 
        Isso garante que o body nunca seja maior que a viewport.
        O scroll deve acontecer apenas dentro de componentes específicos.
      */}
      <body className={cn(inter.className, "h-full w-full overflow-hidden bg-background antialiased selection:bg-primary/30")}>

        {/* Layout Wrapper: Flex Column para Navbar (Topo), Main (Meio), Footer (Baixo) */}
        <div className="flex flex-col h-full w-full">

          {/* Navbar: Altura natural, flex-none (não encolhe nem cresce) */}
          <header className="flex-none z-50">
            <Navbar />
          </header>

          {/* Main: Ocupa todo o espaço restante (flex-1). 
              overflow-hidden é CRUCIAL aqui: impede que o conteúdo da página 
              empurre o footer para fora da tela. A página deve lidar com seu próprio scroll. 
          */}
          <main className="flex-1 w-full overflow-hidden relative z-0">
            {children}
          </main>

          {/* Footer: Altura natural, flex-none */}
          <footer className="flex-none border-t border-white/5 bg-background/50 z-50">
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
