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

    // TMMR v3.0 Transparency Fields
    skillScore: number;         // -1 to 1 (pure skill)
    confidenceScore: number;    // 0.3 to 1 (reliability)
    difficultyExposure: number; // 0.7 to 1.5 (competition level)
    avgKDA: number;             // Average KDA
    avgRankPlayed: number;      // Average rank of matches
    highRankGames: number;      // Games in Ancient+ lobbies
    highRankWinrate: number;    // Winrate in those games

    // Multi-Ranking Stats (legacy)
    winrate: number; // Percentage (0-100)
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

    // TMMR v3.0 Transparency Fields
    skillScore: { type: Number, default: 0, index: true },
    confidenceScore: { type: Number, default: 0.3 },
    difficultyExposure: { type: Number, default: 1.0 },
    avgKDA: { type: Number, default: 0 },
    avgRankPlayed: { type: Number, default: 50 },
    highRankGames: { type: Number, default: 0 },
    highRankWinrate: { type: Number, default: 0 },

    // Multi-Ranking Stats (legacy, indexed for leaderboards)
    winrate: { type: Number, default: 0, index: true },
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
