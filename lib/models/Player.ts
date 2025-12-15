import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlayer extends Document {
    steamId: string;
    name: string;
    avatar: string;
    tmmr: number;
    wins: number;
    losses: number;
    streak: number;
    lastUpdate: Date;
    matches: number[]; // Array of Match IDs
    isPrivate: boolean;

    // Multi-Ranking Stats
    winrate: number; // Percentage (0-100)
    avgKDA: number; // Average KDA across all matches
    kdaVariance: number; // Variance for consistency ranking
    proGames: number; // Games with average_rank >= 65
    proWinrate: number; // Winrate in pro games
    proKDA: number; // Average KDA in pro games

    // Hero Specialist Stats
    bestHeroId: number; // Hero ID with highest winrate
    bestHeroGames: number; // Games played with best hero
    bestHeroWinrate: number; // Winrate with best hero
}

const PlayerSchema: Schema = new Schema({
    steamId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    avatar: { type: String, required: true },
    tmmr: { type: Number, default: 2000, index: true },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastUpdate: { type: Date, default: Date.now },
    matches: [{ type: Number }],
    isPrivate: { type: Boolean, default: false },

    // Multi-Ranking Stats (indexed for leaderboards)
    winrate: { type: Number, default: 0, index: true },
    avgKDA: { type: Number, default: 0, index: true },
    kdaVariance: { type: Number, default: 0, index: true },
    proGames: { type: Number, default: 0, index: true },
    proWinrate: { type: Number, default: 0, index: true },
    proKDA: { type: Number, default: 0, index: true },

    // Hero Specialist Stats (indexed for specialist leaderboard)
    bestHeroId: { type: Number, default: 0 },
    bestHeroGames: { type: Number, default: 0, index: true },
    bestHeroWinrate: { type: Number, default: 0, index: true },
}, { timestamps: true });

// Prevent recompilation in development
const Player: Model<IPlayer> = mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);

export default Player;
