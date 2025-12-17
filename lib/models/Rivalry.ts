import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRivalry extends Document {
    player1Id: string;
    player2Id: string;
    player1Name: string;
    player2Name: string;
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
    lastMatchDate: Date;
}

const RivalrySchema = new Schema<IRivalry>({
    player1Id: { type: String, required: true },
    player2Id: { type: String, required: true },
    player1Name: { type: String, required: true },
    player2Name: { type: String, required: true },
    headToHead: {
        player1Wins: { type: Number, default: 0 },
        player2Wins: { type: Number, default: 0 },
        totalMatches: { type: Number, default: 0 },
        matchDetails: [{
            matchId: String,
            winner: String,
            player1Hero: Number,
            player2Hero: Number,
            timestamp: Number
        }]
    },
    lastMatchDate: { type: Date, default: Date.now }
});

RivalrySchema.index({ player1Id: 1, player2Id: 1 }, { unique: true });

export const Rivalry: Model<IRivalry> = mongoose.models.Rivalry || mongoose.model<IRivalry>('Rivalry', RivalrySchema);
