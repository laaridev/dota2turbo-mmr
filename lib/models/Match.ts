import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMatch extends Document {
    matchId: number;
    playerSteamId: string;
    heroId: number;
    win: boolean;
    duration: number;
    kda: string;
    timestamp: Date;
    tmmrChange: number;
    skill?: number;        // 1=Normal, 2=High, 3=Very High
    averageRank?: number;  // Average rank tier (0-80 scale, e.g. 50=Legend)
}

const MatchSchema: Schema = new Schema({
    matchId: { type: Number, required: true, unique: true },
    playerSteamId: { type: String, required: true, index: true },
    heroId: { type: Number, required: true },
    win: { type: Boolean, required: true },
    duration: { type: Number, required: true }, // Seconds
    kda: { type: String, required: true }, // User formatted string "K/D/A"
    timestamp: { type: Date, required: true }, // Match end time
    tmmrChange: { type: Number, required: true },
    skill: { type: Number }, // 1=Normal, 2=High, 3=Very High
    averageRank: { type: Number }, // Average rank tier (0-80)
}, { timestamps: true });

// Prevent recompilation in development
const Match: Model<IMatch> = mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);

export default Match;
