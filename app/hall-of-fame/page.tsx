import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, Star } from 'lucide-react';

export default function HallOfFamePage() {
    return (
        <div className="container mx-auto p-4 space-y-8 pb-20 mt-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-glow">Hall da Fama</h1>
                <p className="text-muted-foreground">Onde os tryhards viram imortais.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Weekly Champions */}
                <Card className="bg-card/30 border-white/5 backdrop-blur-sm border-t-4 border-t-yellow-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Crown className="text-yellow-500" /> Campeões Semanais
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <div>
                                    <div className="font-bold">Semana 1</div>
                                    <div className="text-xs text-muted-foreground">Out 2025</div>
                                </div>
                                <Badge variant="gold">TBD</Badge>
                            </div>
                            <div className="text-center text-sm text-muted-foreground pt-4">
                                Calma lá, a temporada mal começou. Vá jogar!
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* All Time High */}
                <Card className="bg-card/30 border-white/5 backdrop-blur-sm border-t-4 border-t-purple-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="text-purple-500" /> Lendas de Todos os Tempos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-center text-sm text-muted-foreground pt-4">
                                Vago. Você tem coragem de tomar esse lugar?
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Longest Streaks */}
                <Card className="bg-card/30 border-white/5 backdrop-blur-sm border-t-4 border-t-blue-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="text-blue-500" /> Sequências Imparáveis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-center text-sm text-muted-foreground pt-4">
                                Ninguém conseguiu 10 vitórias seguidas ainda? Sério?
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
