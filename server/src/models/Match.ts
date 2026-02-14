import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
    gameMode: '1v1' | '2v2';
    isRanked: boolean;
    winners: mongoose.Types.ObjectId[];
    losers: mongoose.Types.ObjectId[];
    finalScores: { userId: string; score: number; hp: number }[];
    duration: number; // seconds
    playedAt: Date;
}

const MatchSchema = new Schema<IMatch>({
    gameMode: {
        type: String,
        enum: ['1v1', '2v2'],
        required: true
    },
    isRanked: {
        type: Boolean,
        default: false
    },
    winners: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    losers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    finalScores: [{
        userId: String,
        score: Number,
        hp: Number
    }],
    duration: {
        type: Number,
        default: 0
    },
    playedAt: {
        type: Date,
        default: Date.now
    }
});

export const Match = mongoose.model<IMatch>('Match', MatchSchema);
