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
}

const PlayerSchema: Schema = new Schema({
    steamId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    avatar: { type: String, required: true },
    tmmr: { type: Number, default: 2000, index: true }, // Initial TMMR default
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastUpdate: { type: Date, default: Date.now },
    matches: [{ type: Number }], // Store match IDs for reference
    isPrivate: { type: Boolean, default: false },
}, { timestamps: true });

// Prevent recompilation in development
const Player: Model<IPlayer> = mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);

export default Player;
