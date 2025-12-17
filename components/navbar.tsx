'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';

const PERIODS = [
    { id: 'all', label: 'Todos os tempos' },
    { id: '2025-12', label: 'Dezembro 2025' },
    { id: '2025-11', label: 'Novembro 2025' },
    { id: '2025-10', label: 'Outubro 2025' },
    { id: '2025-09', label: 'Setembro 2025' },
    { id: '2025-08', label: 'Agosto 2025' },
    { id: '2025-07', label: 'Julho 2025' },
    { id: '2025-06', label: 'Junho 2025' },
    { id: '2025-05', label: 'Maio 2025' },
    { id: '2025-04', label: 'Abril 2025' },
    { id: '2025-03', label: 'Março 2025' },
    { id: '2025-02', label: 'Fevereiro 2025' },
    { id: '2025-01', label: 'Janeiro 2025' },
];

export function Navbar() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-lg">
            <div className="container flex h-12 items-center justify-between mx-auto px-4">
                <Link href="/" className="flex gap-2 items-center group">
                    <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center font-bold text-white text-[10px] transition-transform group-hover:scale-105">TB</div>
                    <span className="font-bold text-base tracking-tight">
                        <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">Turbo</span>
                        <span className="text-white">Buff</span>
                    </span>
                </Link>

                {pathname === '/leaderboard' && (
                    <Suspense fallback={<div className="w-72" />}>
                        <NavbarFilters />
                    </Suspense>
                )}

                <nav className="flex items-center gap-4 text-sm">
                    <Link href="/" className={`transition-colors hover:text-white ${pathname === '/' ? 'text-white' : 'text-muted-foreground'}`}>
                        Início
                    </Link>
                    <Link href="/leaderboard" className={`transition-colors hover:text-white ${pathname === '/leaderboard' ? 'text-white' : 'text-muted-foreground'}`}>
                        Ranking
                    </Link>
                    <Link href="/rivalry" className={`transition-colors hover:text-white ${pathname === '/rivalry' ? 'text-white' : 'text-muted-foreground'}`}>
                        Confrontos
                    </Link>
                    <Link href="/faq" className={`transition-colors hover:text-white ${pathname === '/faq' ? 'text-white' : 'text-muted-foreground'}`}>
                        FAQ
                    </Link>
                </nav>
            </div>
        </header>
    );
}

function NavbarFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState('');
    const [period, setPeriod] = useState('all');

    useEffect(() => {
        setSearch(searchParams.get('search') || '');
        setPeriod(searchParams.get('period') || 'all');
    }, [searchParams]);

    const updateParams = (newSearch?: string, newPeriod?: string) => {
        const params = new URLSearchParams();
        const s = newSearch !== undefined ? newSearch : search;
        const p = newPeriod !== undefined ? newPeriod : period;
        if (s) params.set('search', s);
        if (p && p !== 'all') params.set('period', p);
        router.push(`/leaderboard${params.toString() ? '?' + params.toString() : ''}`);
    };

    return (
        <div className="hidden md:flex items-center gap-2">
            <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        updateParams(e.target.value, undefined);
                    }}
                    className="w-48 pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                />
            </div>

            <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                    value={period}
                    onChange={(e) => {
                        setPeriod(e.target.value);
                        updateParams(undefined, e.target.value);
                    }}
                    className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50 cursor-pointer"
                >
                    {PERIODS.map(p => (
                        <option key={p.id} value={p.id} className="bg-card">{p.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
