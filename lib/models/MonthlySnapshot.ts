import mongoose from 'mongoose';

const monthlySnapshotSchema = new mongoose.Schema({
    period: {
        type: String,
        required: true,
        index: true // e.g., '2025-11'
    },
    playerSteamId: {
        type: String,
        required: true,
        index: true
    },
    tmmr: {
        type: Number,
        required: true
    },
    wins: {
        type: Number,
        required: true
    },
    losses: {
        type: Number,
        required: true
    },
    gamesInPeriod: {
        type: Number,
        required: true
    },
    totalGamesUpToPeriod: {
        type: Number,
        required: true
    },
    calculatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
monthlySnapshotSchema.index({ period: 1, tmmr: -1 });
monthlySnapshotSchema.index({ period: 1, playerSteamId: 1 }, { unique: true });

export default mongoose.models.MonthlySnapshot || mongoose.model('MonthlySnapshot', monthlySnapshotSchema);
