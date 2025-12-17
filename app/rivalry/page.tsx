'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, TrendingUp, ChevronDown, Loader2, AlertCircle, Flame, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { PlayerAutocomplete } from '@/components/player-autocomplete';
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { getTier } from '@/lib/tmmr';

interface Player {
    steamId: string;
    name: string;
    avatar: string;
    tmmr: number;
    wins: number;
    losses: number;
    avgKDA?: number;
}

interface ComparisonResult {
    player1: Player;
    player2: Player;
    headToHead: {
        player1Wins: number;
        player2Wins: number;
        totalMatches: number;
        matchDetails: Array<{
            matchId: string;
            winner: string;
            player1Hero: number;
            player2Hero: number;
            timestamp: number;
        }>;
    };
}

export default function MuralDasTretasPage() {
    const [player1, setPlayer1] = useState<Player | null>(null);
    const [player2, setPlayer2] = useState<Player | null>(null);
    const [comparison, setComparison] = useState<ComparisonResult | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [error, setError] = useState('');
    const [showResultsDialog, setShowResultsDialog] = useState(false);
    const [showPrivateModal, setShowPrivateModal] = useState(false);
    const [privateProfileInfo, setPrivateProfileInfo] = useState<{ player: string; steamId: string } | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    // Input mode: 'autocomplete' or 'id'
    const [inputMode1, setInputMode1] = useState<'autocomplete' | 'id'>('autocomplete');
    const [inputMode2, setInputMode2] = useState<'autocomplete' | 'id'>('autocomplete');
    const [steamId1, setSteamId1] = useState('');
    const [steamId2, setSteamId2] = useState('');

    // History list
    const [historyList, setHistoryList] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [historyPage, setHistoryPage] = useState(1);
    const [totalHistoryPages, setTotalHistoryPages] = useState(1);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
    const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);

    // Fetch history on mount and page change
    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            try {
                const response = await fetch(`/api/rivalry?page=${historyPage}&limit=10`);
                const data = await response.json();
                setHistoryList(data.rivalries || []);
                setTotalHistoryPages(data.totalPages || 1);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setIsLoadingHistory(false);
            }
        };
        fetchHistory();
    }, [historyPage]);

    const loadRivalryDetails = async (item: any) => {
        const itemId = item._id || `${item.player1Id}-${item.player2Id}`;
        setLoadingDetailsId(itemId);
        try {
            // If the item has a MongoDB _id, load from database (fast)
            if (item._id) {
                const response = await fetch(`/api/rivalry/${item._id}`);
                const data = await response.json();

                if (response.ok) {
                    // Check if we have matchDetails from DB
                    const hasMatchDetails = data.headToHead?.matchDetails && data.headToHead.matchDetails.length > 0;

                    if (hasMatchDetails) {
                        // Use data from database directly
                        setSelectedHistoryItem({
                            ...data,
                            headToHead: data.headToHead
                        });
                        setShowHistory(true);
                    } else {
                        // Fallback: fetch from OpenDota for legacy records
                        console.log('No matchDetails in DB, fetching from OpenDota...');
                        const compareResponse = await fetch('/api/rivalry/compare', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                player1Id: data.player1Id || data.player1?.steamId,
                                player2Id: data.player2Id || data.player2?.steamId
                            })
                        });
                        const compareData = await compareResponse.json();

                        if (compareResponse.ok && compareData.headToHead) {
                            setSelectedHistoryItem({
                                ...data,
                                headToHead: compareData.headToHead,
                                player1: compareData.player1 || data.player1,
                                player2: compareData.player2 || data.player2
                            });
                        } else {
                            // Ultimate fallback
                            setSelectedHistoryItem(data);
                        }
                        setShowHistory(true);
                    }
                } else {
                    console.error('Error loading from DB:', data.error);
                    setSelectedHistoryItem(item);
                }
            } else {
                // Fallback to original data if no _id
                setSelectedHistoryItem(item);
            }
        } catch (error) {
            console.error('Error loading rivalry details:', error);
            setSelectedHistoryItem(item);
        } finally {
            setLoadingDetailsId(null);
        }
    };

    const handleCompare = async () => {
        if (!player1 || !player2) {
            setError('Selecione dois jogadores para comparar');
            return;
        }

        setIsComparing(true);
        setError('');
        setComparison(null);
        setPrivateProfileInfo(null);

        try {
            const response = await fetch('/api/rivalry/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player1Id: player1.steamId,
                    player2Id: player2.steamId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Erro ao comparar');
                return;
            }

            // Check if there's actually a private player detected by API
            // (not just 0 matches - they might have never played together)
            if (data.headToHead.totalMatches === 0 && (data as any).privatePlayer) {
                const privatePlayerName = (data as any).privatePlayer;
                setPrivateProfileInfo({
                    player: privatePlayerName,
                    steamId: player1.steamId
                });
                setShowPrivateModal(true);
            } else if (data.headToHead.totalMatches === 0) {
                // No private player but still 0 matches = they never faced each other
                setError('Esses jogadores nunca se enfrentaram em partidas Turbo!');
            }

            setComparison(data);

            // Auto-save removed - explicit action required
            if (data.headToHead.totalMatches > 0) {
                setShowResultsDialog(true);
            }

        } catch (error) {
            console.error('Error comparing:', error);
            setError('Erro ao comparar jogadores');
        } finally {
            setIsComparing(false);
        }
    };

    const handlePublish = async () => {
        if (!comparison || !player1 || !player2) return;

        setIsPublishing(true);
        try {
            await fetch('/api/rivalry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player1Id: player1.steamId,
                    player2Id: player2.steamId,
                    player1Name: player1.name,
                    player2Name: player2.name,
                    headToHead: comparison.headToHead
                })
            });

            // Refresh history list after publishing
            if (historyPage === 1) {
                const res = await fetch(`/api/rivalry?page=1&limit=6`);
                const data = await res.json();
                if (res.ok) {
                    setHistoryList(data.rivalries);
                    setTotalHistoryPages(data.totalPages);
                }
            } else {
                setHistoryPage(1); // Reset to page 1 to see new entry
            }

            setShowResultsDialog(false);
        } catch (error) {
            console.error('Error publishing rivalry:', error);
            // Optionally set error state here if needed
        } finally {
            setIsPublishing(false);
        }
    };

    const winnerPlayer = comparison && comparison.headToHead.player1Wins > comparison.headToHead.player2Wins
        ? comparison.player1
        : comparison?.player2;

    const winPercentage = comparison
        ? (comparison.headToHead.player1Wins / comparison.headToHead.totalMatches * 100).toFixed(0)
        : 0;

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section - Compact for form visibility */}
            <section className="relative overflow-hidden pt-12 pb-16 px-4" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 90%, 0 100%)' }}>
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-background to-orange-500/10" />
                <div className="absolute top-10 left-10 w-48 h-48 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-10 right-10 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />

                <div className="container mx-auto max-w-4xl relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                        <h1 className="text-4xl md:text-5xl font-black mb-4">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-400">
                                Mural de Confrontos
                            </span>
                        </h1>

                        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed text-sm">
                            Selecione dois jogadores para comparar o histórico de vitórias e derrotas entre eles no modo Turbo.
                            Os resultados são salvos automaticamente no mural público!
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Form Section - Visible without scrolling */}
            <div className="container mx-auto max-w-4xl px-4 mt-6">
                {/* PHASE 1: MINIMAL SELECTION */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mx-auto max-w-4xl"
                >
                    <div className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-xl p-8 shadow-lg">
                        <div className="space-y-4">
                            {/* Input Row - Everything same height */}
                            <div className="flex items-center gap-4">
                                {/* Player 1 */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Jogador 1</span>
                                        <button
                                            onClick={() => {
                                                setInputMode1(inputMode1 === 'autocomplete' ? 'id' : 'autocomplete');
                                                setPlayer1(null);
                                                setSteamId1('');
                                            }}
                                            className="text-[10px] text-muted-foreground hover:text-primary transition"
                                        >
                                            {inputMode1 === 'autocomplete' ? 'Inserir ID' : 'Nome'}
                                        </button>
                                    </div>
                                    {inputMode1 === 'autocomplete' ? (
                                        <div className="h-[44px]">
                                            <PlayerAutocomplete
                                                onSelect={setPlayer1}
                                                placeholder="Buscar..."
                                            />
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={steamId1}
                                            onChange={(e) => setSteamId1(e.target.value)}
                                            placeholder="Steam ID"
                                            className="w-full h-[44px] bg-background/50 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        />
                                    )}
                                </div>

                                {/* VS */}
                                <div className="pt-6">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition ${(player1 || steamId1) && (player2 || steamId2)
                                        ? 'border-red-500/50 bg-red-500/10'
                                        : 'border-white/10 bg-card/50'
                                        }`}>
                                        <Swords className={`w-4 h-4 ${(player1 || steamId1) && (player2 || steamId2) ? 'text-red-400' : 'text-muted-foreground'}`} />
                                    </div>
                                </div>

                                {/* Player 2 */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Jogador 2</span>
                                        <button
                                            onClick={() => {
                                                setInputMode2(inputMode2 === 'autocomplete' ? 'id' : 'autocomplete');
                                                setPlayer2(null);
                                                setSteamId2('');
                                            }}
                                            className="text-[10px] text-muted-foreground hover:text-orange-400 transition"
                                        >
                                            {inputMode2 === 'autocomplete' ? 'Inserir ID' : 'Nome'}
                                        </button>
                                    </div>
                                    {inputMode2 === 'autocomplete' ? (
                                        <div className="h-[44px]">
                                            <PlayerAutocomplete
                                                onSelect={setPlayer2}
                                                placeholder="Buscar..."
                                            />
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={steamId2}
                                            onChange={(e) => setSteamId2(e.target.value)}
                                            placeholder="Steam ID"
                                            className="w-full h-[44px] bg-background/50 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                        />
                                    )}
                                </div>

                                {/* Button */}
                                <div className="pt-6">
                                    <motion.button
                                        onClick={handleCompare}
                                        disabled={!(player1 || steamId1) || !(player2 || steamId2) || isComparing}
                                        whileHover={{ scale: (player1 || steamId1) && (player2 || steamId2) ? 1.02 : 1 }}
                                        whileTap={{ scale: (player1 || steamId1) && (player2 || steamId2) ? 0.98 : 1 }}
                                        className={`h-[44px] px-8 rounded-lg font-semibold text-sm whitespace-nowrap transition ${(player1 || steamId1) && (player2 || steamId2) && !isComparing
                                            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:shadow-lg'
                                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            }`}
                                    >
                                        {isComparing ? (
                                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                        ) : (
                                            'Analisar'
                                        )}
                                    </motion.button>
                                </div>
                            </div>

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                                    >
                                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* CONFRONTATION HISTORY LIST */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mx-auto max-w-4xl mt-12"
                >


                    {isLoadingHistory ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : historyList.length === 0 ? (
                        <div className="bg-card/30 backdrop-blur-sm border border-white/5 rounded-xl p-8 text-center">
                            <p className="text-muted-foreground">Nenhum confronto registrado ainda</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {historyList.map((item: any, index: number) => {
                                const p1Wins = item.headToHead?.player1Wins || 0;
                                const p2Wins = item.headToHead?.player2Wins || 0;
                                const totalMatches = item.headToHead?.totalMatches || 0;
                                const isP1Winner = p1Wins > p2Wins;
                                const isDraw = p1Wins === p2Wins;

                                return (
                                    <motion.div
                                        key={item._id || index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition group"
                                    >
                                        <div className="flex items-center p-4">
                                            {/* Player 1 */}
                                            <div className={`flex-1 flex items-center gap-3 transition ${isP1Winner && !isDraw ? 'opacity-100' : 'opacity-60'}`}>
                                                <div className="relative">
                                                    <img
                                                        src={item.player1?.avatar || '/default-avatar.png'}
                                                        alt={item.player1?.name}
                                                        className="w-14 h-14 rounded-xl border-2 border-white/10"
                                                    />
                                                    {isP1Winner && !isDraw && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                                                            <Trophy className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">{item.player1?.name || 'Jogador 1'}</p>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className="text-primary font-semibold">{item.player1?.tmmr || 0} TMMR</span>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-muted-foreground">{p1Wins} {p1Wins === 1 ? 'vitória' : 'vitórias'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* VS Score */}
                                            <div className="flex flex-col items-center px-6">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xl font-black ${isP1Winner && !isDraw ? 'text-green-400' : 'text-muted-foreground'}`}>
                                                        {p1Wins}
                                                    </span>
                                                    <span className="text-muted-foreground text-sm">×</span>
                                                    <span className={`text-xl font-black ${!isP1Winner && !isDraw ? 'text-green-400' : 'text-muted-foreground'}`}>
                                                        {p2Wins}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1">
                                                    {totalMatches} {totalMatches === 1 ? 'partida' : 'partidas'}
                                                </p>
                                            </div>

                                            {/* Player 2 */}
                                            <div className={`flex-1 flex items-center gap-3 flex-row-reverse transition ${!isP1Winner && !isDraw ? 'opacity-100' : 'opacity-60'}`}>
                                                <div className="relative">
                                                    <img
                                                        src={item.player2?.avatar || '/default-avatar.png'}
                                                        alt={item.player2?.name}
                                                        className="w-14 h-14 rounded-xl border-2 border-white/10"
                                                    />
                                                    {!isP1Winner && !isDraw && (
                                                        <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                                                            <Trophy className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 text-right">
                                                    <p className="font-bold text-sm truncate">{item.player2?.name || 'Jogador 2'}</p>
                                                    <div className="flex items-center gap-2 text-xs justify-end">
                                                        <span className="text-muted-foreground">{p2Wins} {p2Wins === 1 ? 'vitória' : 'vitórias'}</span>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-orange-400 font-semibold">{item.player2?.tmmr || 0} TMMR</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* View Details Button */}
                                            <button
                                                onClick={() => loadRivalryDetails(item)}
                                                disabled={loadingDetailsId !== null}
                                                className="ml-4 px-5 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-xs font-semibold text-primary transition whitespace-nowrap group-hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {loadingDetailsId === (item._id || `${item.player1Id}-${item.player2Id}`) ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        Carregando...
                                                    </>
                                                ) : (
                                                    'Ver Detalhes'
                                                )}
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* Pagination */}
                            {totalHistoryPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-6">
                                    <button
                                        onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                                        disabled={historyPage === 1}
                                        className="p-2 bg-card/40 border border-white/10 rounded-lg hover:bg-card/60 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm text-muted-foreground min-w-[100px] text-center">
                                        Página {historyPage} de {totalHistoryPages}
                                    </span>
                                    <button
                                        onClick={() => setHistoryPage(prev => Math.min(totalHistoryPages, prev + 1))}
                                        disabled={historyPage === totalHistoryPages}
                                        className="p-2 bg-card/40 border border-white/10 rounded-lg hover:bg-card/60 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Results Dialog */}
                <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                        {comparison && (
                            <div className="space-y-6">
                                {/* Header */}
                                <DialogHeader>
                                    <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                                        Resultado do Confronto
                                    </DialogTitle>
                                </DialogHeader>

                                {/* Large Scoreboard with animations */}
                                <div className="bg-gradient-to-br from-card/50 to-card/30 border border-white/10 rounded-xl p-8">
                                    <div className="grid grid-cols-3 gap-6 items-center">
                                        {/* Player 1 */}
                                        <motion.div
                                            className="text-center"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <div className="relative">
                                                <img
                                                    src={comparison.player1.avatar}
                                                    alt={comparison.player1.name}
                                                    className={`w-20 h-20 rounded-full border-4 mx-auto mb-3 transition-all ${comparison.headToHead.player1Wins > comparison.headToHead.player2Wins
                                                        ? 'border-primary shadow-lg shadow-primary/50'
                                                        : 'border-white/20'
                                                        }`}
                                                />
                                                {comparison.headToHead.player1Wins > comparison.headToHead.player2Wins && (
                                                    <motion.div
                                                        initial={{ scale: 0, rotate: -180 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 200,
                                                            damping: 10,
                                                            delay: 0.5
                                                        }}
                                                        className="absolute -top-2 -right-2"
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-2 border-white shadow-lg">
                                                            <Trophy className="w-5 h-5 text-white" />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                            <p className="font-bold text-base truncate mb-1">{comparison.player1.name}</p>
                                            <p className="text-xs text-muted-foreground">{comparison.player1.tmmr} TMMR</p>
                                        </motion.div>

                                        {/* Score - Animated */}
                                        <motion.div
                                            className="text-center"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 200,
                                                damping: 15,
                                                delay: 0.3
                                            }}
                                        >
                                            <div className="flex items-center justify-center gap-4 mb-3">
                                                <motion.span
                                                    className={`text-5xl font-black tracking-tight ${comparison.headToHead.player1Wins > comparison.headToHead.player2Wins
                                                        ? 'text-primary'
                                                        : 'text-muted-foreground'
                                                        }`}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.4 }}
                                                >
                                                    {comparison.headToHead.player1Wins}
                                                </motion.span>
                                                <span className="text-3xl text-muted-foreground font-light">×</span>
                                                <motion.span
                                                    className={`text-5xl font-black tracking-tight ${comparison.headToHead.player2Wins > comparison.headToHead.player1Wins
                                                        ? 'text-orange-400'
                                                        : 'text-muted-foreground'
                                                        }`}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.4 }}
                                                >
                                                    {comparison.headToHead.player2Wins}
                                                </motion.span>
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {comparison.headToHead.totalMatches} confrontos
                                            </p>
                                        </motion.div>

                                        {/* Player 2 */}
                                        <motion.div
                                            className="text-center"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <div className="relative">
                                                <img
                                                    src={comparison.player2.avatar}
                                                    alt={comparison.player2.name}
                                                    className={`w-20 h-20 rounded-full border-4 mx-auto mb-3 transition-all ${comparison.headToHead.player2Wins > comparison.headToHead.player1Wins
                                                        ? 'border-orange-500 shadow-lg shadow-orange-500/50'
                                                        : 'border-white/20'
                                                        }`}
                                                />
                                                {comparison.headToHead.player2Wins > comparison.headToHead.player1Wins && (
                                                    <motion.div
                                                        initial={{ scale: 0, rotate: -180 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 200,
                                                            damping: 10,
                                                            delay: 0.5
                                                        }}
                                                        className="absolute -top-2 -right-2"
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-2 border-white shadow-lg">
                                                            <Trophy className="w-5 h-5 text-white" />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                            <p className="font-bold text-base truncate mb-1">{comparison.player2.name}</p>
                                            <p className="text-xs text-muted-foreground">{comparison.player2.tmmr} TMMR</p>
                                        </motion.div>
                                    </div>

                                    {/* Winner Indication - ANIMATED! */}
                                    {comparison.headToHead.player1Wins !== comparison.headToHead.player2Wins && (
                                        <motion.div
                                            className="mt-6 text-center"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 }}
                                        >
                                            <motion.div
                                                className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500/50 rounded-full px-6 py-3 relative overflow-hidden"
                                                animate={{
                                                    boxShadow: [
                                                        "0 0 20px rgba(234, 179, 8, 0.3)",
                                                        "0 0 40px rgba(234, 179, 8, 0.6)",
                                                        "0 0 20px rgba(234, 179, 8, 0.3)",
                                                    ]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                {/* Animated background glow */}
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20"
                                                    animate={{
                                                        opacity: [0.5, 1, 0.5],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                />

                                                <motion.div
                                                    animate={{
                                                        rotate: [0, -10, 10, -10, 0],
                                                        scale: [1, 1.2, 1, 1.2, 1]
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                >
                                                    <Trophy className="w-6 h-6 text-yellow-300 drop-shadow-lg relative z-10" />
                                                </motion.div>

                                                <div className="relative z-10">
                                                    <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-200">
                                                        {winnerPlayer?.name} DOMINA
                                                    </span>
                                                    <p className="text-xs text-yellow-300/80 font-semibold mt-0.5">
                                                        {winPercentage}% de vitórias
                                                    </p>
                                                </div>

                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.3, 1],
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                        delay: 0.5
                                                    }}
                                                    className="relative z-10"
                                                >
                                                    <Flame className="w-6 h-6 text-orange-400 drop-shadow-lg" />
                                                </motion.div>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </div>


                                {/* Collapsible Match History */}
                                <div className="border-t border-white/10 pt-4">
                                    <button
                                        onClick={() => setShowHistory(!showHistory)}
                                        className="w-full flex items-center justify-between text-sm font-medium hover:text-primary transition-colors"
                                    >
                                        <span>Histórico de Confrontos ({comparison.headToHead.matchDetails.length})</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {showHistory && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3 space-y-2 max-h-36 overflow-y-auto"
                                            >
                                                {comparison.headToHead.matchDetails.slice(0, 10).map((match, index) => (
                                                    <motion.div
                                                        key={match.matchId}
                                                        className="bg-card/20 border border-white/5 rounded-lg p-3 text-xs"
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="flex-1 flex items-center justify-between">
                                                                <span className="text-muted-foreground">
                                                                    {new Date(match.timestamp * 1000).toLocaleDateString('pt-BR')}
                                                                </span>
                                                                <span className={`font-semibold ${match.winner === comparison.player1.steamId
                                                                    ? 'text-primary'
                                                                    : 'text-orange-400'
                                                                    }`}>
                                                                    {match.winner === comparison.player1.steamId ? comparison.player1.name : comparison.player2.name} venceu
                                                                </span>
                                                            </div>
                                                            <a
                                                                href={`https://www.dotabuff.com/matches/${match.matchId}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 px-2 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded text-[10px] font-semibold text-primary transition whitespace-nowrap"
                                                            >
                                                                Dotabuff
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                {/* Action Buttons */}
                                <DialogFooter className="gap-2 sm:gap-0">
                                    <button
                                        onClick={() => setShowResultsDialog(false)}
                                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white transition"
                                    >
                                        Fechar
                                    </button>
                                    <button
                                        onClick={handlePublish}
                                        disabled={isPublishing}
                                        className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-lg shadow-lg shadow-red-900/20 transform hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {isPublishing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Publicando...
                                            </>
                                        ) : (
                                            <>
                                                <Trophy className="w-4 h-4" />
                                                Publicar no Mural
                                            </>
                                        )}
                                    </button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Private Profile Modal */}
                {
                    showPrivateModal && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-br from-card to-card/80 border border-yellow-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
                            >
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 border border-yellow-500/30 mb-4">
                                        <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        Perfil Privado Detectado
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {privateProfileInfo && (
                                            <span className="text-yellow-400 font-semibold">{privateProfileInfo.player}</span>
                                        )} - Não foram encontradas partidas Turbo
                                    </p>
                                </div>

                                <div className="bg-card/50 border border-white/10 rounded-lg p-4 mb-6">
                                    <p className=" text-sm text-muted-foreground mb-3">
                                        <strong className="text-white">
                                            {privateProfileInfo?.player === 'Ambos os jogadores'
                                                ? 'Ambos os perfis estão privados'
                                                : privateProfileInfo?.player === 'Não foi possível determinar'
                                                    ? 'Causa provável:'
                                                    : 'Confirmado:'
                                            }
                                        </strong>
                                    </p>
                                    <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                                        {privateProfileInfo?.player === 'Ambos os jogadores' ? (
                                            <>
                                                <li>Ambos os perfis estão privados no Dota 2</li>
                                                <li>Partidas ainda não indexadas pela OpenDota</li>
                                            </>
                                        ) : privateProfileInfo?.player === 'Não foi possível determinar' ? (
                                            <>
                                                <li>Um ou ambos os perfis estão privados no Dota 2</li>
                                                <li>Nunca se enfrentaram em partidas Turbo</li>
                                                <li>Partidas ainda não indexadas pela OpenDota</li>
                                            </>
                                        ) : (
                                            <>
                                                <li>O perfil de <strong className="text-yellow-400">{privateProfileInfo?.player}</strong> está privado no Dota 2</li>
                                                <li>Ou as partidas ainda não foram indexadas pela OpenDota</li>
                                            </>
                                        )}
                                    </ul>
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-blue-200 mb-2">
                                        <strong>💡 Como resolver:</strong>
                                    </p>
                                    <ol className="text-sm text-blue-300/80 space-y-1 list-decimal list-inside">
                                        <li>Ative "Expose Public Match Data" no Dota 2</li>
                                        <li>Aguarde ~10 min após jogar partidas</li>
                                        <li>Visite OpenDota.com e clique em "Refresh"</li>
                                    </ol>
                                </div>

                                <button
                                    onClick={() => setShowPrivateModal(false)}
                                    className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg"
                                >
                                    Entendi
                                </button>
                            </motion.div>
                        </div>
                    )
                }

                {/* History Details Modal */}
                {selectedHistoryItem && (
                    <Dialog open={!!selectedHistoryItem} onOpenChange={() => setSelectedHistoryItem(null)}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            {selectedHistoryItem.headToHead && (
                                <div className="space-y-6">
                                    {/* Header */}
                                    <DialogHeader>
                                        <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                                            Confronto Direto
                                        </DialogTitle>
                                    </DialogHeader>

                                    {/* Players & Score - Premium Design */}
                                    <div className="grid grid-cols-3 gap-6 items-start">
                                        {/* Player 1 */}
                                        <motion.div
                                            className="text-center"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <div className="relative">
                                                <img
                                                    src={selectedHistoryItem.player1?.avatar || '/default-avatar.png'}
                                                    alt={selectedHistoryItem.player1?.name}
                                                    className={`w-20 h-20 rounded-full border-4 mx-auto mb-3 transition-all ${(selectedHistoryItem.headToHead?.player1Wins || 0) > (selectedHistoryItem.headToHead?.player2Wins || 0)
                                                        ? 'border-primary shadow-lg shadow-primary/50'
                                                        : 'border-white/20'
                                                        }`}
                                                />
                                                {(selectedHistoryItem.headToHead?.player1Wins || 0) > (selectedHistoryItem.headToHead?.player2Wins || 0) && (
                                                    <motion.div
                                                        initial={{ scale: 0, rotate: -180 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 200,
                                                            damping: 10,
                                                            delay: 0.5
                                                        }}
                                                        className="absolute -top-2 -right-2"
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-2 border-white shadow-lg">
                                                            <Trophy className="w-5 h-5 text-white" />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                            <p className="font-bold text-base truncate mb-1">{selectedHistoryItem.player1?.name || 'Jogador 1'}</p>
                                            <p className="text-xs text-muted-foreground">{selectedHistoryItem.player1?.tmmr || 0} TMMR</p>
                                        </motion.div>

                                        {/* Score - Animated */}
                                        <motion.div
                                            className="text-center"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 200,
                                                damping: 15,
                                                delay: 0.3
                                            }}
                                        >
                                            <div className="flex items-center justify-center gap-4 mb-3">
                                                <motion.span
                                                    className={`text-5xl font-black tracking-tight ${(selectedHistoryItem.headToHead?.player1Wins || 0) > (selectedHistoryItem.headToHead?.player2Wins || 0)
                                                        ? 'text-primary'
                                                        : 'text-muted-foreground'
                                                        }`}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.4 }}
                                                >
                                                    {selectedHistoryItem.headToHead?.player1Wins || 0}
                                                </motion.span>
                                                <span className="text-3xl text-muted-foreground font-light">×</span>
                                                <motion.span
                                                    className={`text-5xl font-black tracking-tight ${(selectedHistoryItem.headToHead?.player2Wins || 0) > (selectedHistoryItem.headToHead?.player1Wins || 0)
                                                        ? 'text-orange-400'
                                                        : 'text-muted-foreground'
                                                        }`}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.4 }}
                                                >
                                                    {selectedHistoryItem.headToHead?.player2Wins || 0}
                                                </motion.span>
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {selectedHistoryItem.headToHead?.totalMatches || 0} confrontos
                                            </p>
                                        </motion.div>

                                        {/* Player 2 */}
                                        <motion.div
                                            className="text-center"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 }}
                                        >
                                            <div className="relative">
                                                <img
                                                    src={selectedHistoryItem.player2?.avatar || '/default-avatar.png'}
                                                    alt={selectedHistoryItem.player2?.name}
                                                    className={`w-20 h-20 rounded-full border-4 mx-auto mb-3 transition-all ${(selectedHistoryItem.headToHead?.player2Wins || 0) > (selectedHistoryItem.headToHead?.player1Wins || 0)
                                                        ? 'border-orange-500 shadow-lg shadow-orange-500/50'
                                                        : 'border-white/20'
                                                        }`}
                                                />
                                                {(selectedHistoryItem.headToHead?.player2Wins || 0) > (selectedHistoryItem.headToHead?.player1Wins || 0) && (
                                                    <motion.div
                                                        initial={{ scale: 0, rotate: -180 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        transition={{
                                                            type: "spring",
                                                            stiffness: 200,
                                                            damping: 10,
                                                            delay: 0.5
                                                        }}
                                                        className="absolute -top-2 -right-2"
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-2 border-white shadow-lg">
                                                            <Trophy className="w-5 h-5 text-white" />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                            <p className="font-bold text-base truncate mb-1">{selectedHistoryItem.player2?.name || 'Jogador 2'}</p>
                                            <p className="text-xs text-muted-foreground">{selectedHistoryItem.player2?.tmmr || 0} TMMR</p>
                                        </motion.div>
                                    </div>

                                    {/* Winner Indication - ANIMATED! */}
                                    {(selectedHistoryItem.headToHead?.player1Wins || 0) !== (selectedHistoryItem.headToHead?.player2Wins || 0) && (
                                        <motion.div
                                            className="mt-6 text-center"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 }}
                                        >
                                            <motion.div
                                                className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500/50 rounded-full px-6 py-3 relative overflow-hidden"
                                                animate={{
                                                    boxShadow: [
                                                        "0 0 20px rgba(234, 179, 8, 0.3)",
                                                        "0 0 40px rgba(234, 179, 8, 0.6)",
                                                        "0 0 20px rgba(234, 179, 8, 0.3)",
                                                    ]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                {/* Animated background glow */}
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20"
                                                    animate={{
                                                        scale: [1, 1.05, 1],
                                                        opacity: [0.5, 0.8, 0.5]
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                />
                                                <Flame className="w-5 h-5 text-yellow-400 relative z-10" />
                                                <span className="font-bold text-white relative z-10">
                                                    {(selectedHistoryItem.headToHead?.player1Wins || 0) > (selectedHistoryItem.headToHead?.player2Wins || 0)
                                                        ? selectedHistoryItem.player1?.name
                                                        : selectedHistoryItem.player2?.name
                                                    } domina este confronto!
                                                </span>
                                                <Flame className="w-5 h-5 text-orange-400 relative z-10" />
                                            </motion.div>
                                        </motion.div>
                                    )}

                                    {/* Match History */}
                                    {selectedHistoryItem.headToHead?.matchDetails && selectedHistoryItem.headToHead.matchDetails.length > 0 && (
                                        <div>
                                            <button
                                                onClick={() => setShowHistory(!showHistory)}
                                                className="w-full flex items-center justify-between bg-card/30 border border-white/10 rounded-lg p-3 hover:bg-card/50 transition"
                                            >
                                                <span>Histórico de Confrontos ({selectedHistoryItem.headToHead.matchDetails.length})</span>
                                                <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                                            </button>
                                            <AnimatePresence>
                                                {showHistory && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="space-y-2 mt-2 max-h-36 overflow-y-auto"
                                                    >
                                                        {selectedHistoryItem.headToHead.matchDetails.slice(0, 20).map((match: any, index: number) => (
                                                            <motion.div
                                                                key={match.matchId}
                                                                className="bg-card/20 border border-white/5 rounded-lg p-3 text-xs"
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: index * 0.05 }}
                                                            >
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div className="flex-1 flex items-center justify-between">
                                                                        <span className="text-muted-foreground">
                                                                            {new Date(match.timestamp * 1000).toLocaleDateString('pt-BR')}
                                                                        </span>
                                                                        <span className={`font-semibold ${match.winner === (selectedHistoryItem.player1Id || selectedHistoryItem.player1?.steamId)
                                                                            ? 'text-primary'
                                                                            : 'text-orange-400'
                                                                            }`}>
                                                                            {match.winner === (selectedHistoryItem.player1Id || selectedHistoryItem.player1?.steamId)
                                                                                ? selectedHistoryItem.player1?.name
                                                                                : selectedHistoryItem.player2?.name
                                                                            } venceu
                                                                        </span>
                                                                    </div>
                                                                    <a
                                                                        href={`https://www.dotabuff.com/matches/${match.matchId}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-1 px-2 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded text-[10px] font-semibold text-primary transition whitespace-nowrap"
                                                                    >
                                                                        Dotabuff
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                )}
            </div >
        </div >
    );
}
