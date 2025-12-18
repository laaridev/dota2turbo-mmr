import mongoose, { Schema, Document, Model } from 'mongoose';

// Hero stats for specialist ranking
export interface IHeroStat {
    heroId: number;
    heroName: string;
    games: number;
    wins: number;
    winrate: number;
    avgKDA: string;
}

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

    // TMMR v4.0 Transparency Fields
    skillScore: number;         // -1 to 1 (pure skill)
    confidenceScore: number;    // 0.3 to 1 (reliability)
    difficultyExposure: number; // 0.7 to 1.5 (competition level)
    avgKDA: number;             // Average KDA
    avgRankPlayed: number;      // Average rank of matches
    highRankGames: number;      // Games in Ancient+ lobbies
    highRankWinrate: number;    // Winrate in those games

    // v4.0 New Fields
    soloGames: number;          // Number of solo games
    partyGames: number;         // Number of party games
    soloWinrate: number;        // Solo winrate (0-100)
    partyWinrate: number;       // Party winrate (0-100)
    heroNormalizedKDA: number;  // KDA normalized by hero role
    recencyMultiplier: number;  // Time decay multiplier (0.7-1.0)
    consistencyScore: number;   // Performance consistency (0-1)

    // Multi-Ranking Stats (legacy)
    winrate: number; // Percentage (0-100)
    kdaVariance: number; // Variance for consistency ranking
    proGames: number; // Games with average_rank >= 65
    proWinrate: number; // Winrate in pro games
    proKDA: number; // Average KDA in pro games

    // Hero Specialist Stats (kept for backward compatibility)
    bestHeroId: number; // Hero ID with highest winrate
    bestHeroGames: number; // Games played with best hero
    bestHeroWinrate: number; // Winrate with best hero

    // Hero Stats Array (top heroes with 50+ games for specialist ranking)
    heroStats: IHeroStat[];
}

const HeroStatSchema: Schema = new Schema({
    heroId: { type: Number, required: true },
    heroName: { type: String, required: true },
    games: { type: Number, required: true },
    wins: { type: Number, required: true },
    winrate: { type: Number, required: true },
    avgKDA: { type: String, required: true }
}, { _id: false });

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

    // TMMR v4.0 Transparency Fields
    skillScore: { type: Number, default: 0, index: true },
    confidenceScore: { type: Number, default: 0.3 },
    difficultyExposure: { type: Number, default: 1.0 },
    avgKDA: { type: Number, default: 0 },
    avgRankPlayed: { type: Number, default: 50 },
    highRankGames: { type: Number, default: 0 },
    highRankWinrate: { type: Number, default: 0 },

    // v4.0 New Fields
    soloGames: { type: Number, default: 0 },
    partyGames: { type: Number, default: 0 },
    soloWinrate: { type: Number, default: 0 },
    partyWinrate: { type: Number, default: 0 },
    heroNormalizedKDA: { type: Number, default: 1.0 },
    recencyMultiplier: { type: Number, default: 1.0 },
    consistencyScore: { type: Number, default: 1.0 },

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

    // Hero Stats Array (top heroes with 50+ games)
    heroStats: { type: [HeroStatSchema], default: [] },
}, { timestamps: true });

// Prevent recompilation in development
const Player: Model<IPlayer> = mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);

export default Player;
