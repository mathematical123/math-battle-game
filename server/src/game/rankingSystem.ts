export const K_FACTOR = 32; // Standard ELO K-factor

export enum Rank {
    UNRANKED = 'Unranked',
    BRONZE = 'Bronze',
    SILVER = 'Silver',
    GOLD = 'Gold',
    PLATINUM = 'Platinum',
    DIAMOND = 'Diamond'
}

export interface RankThresholds {
    rank: Rank;
    minRR: number;
    maxRR: number;
}

export const RANK_THRESHOLDS: RankThresholds[] = [
    { rank: Rank.UNRANKED, minRR: 0, maxRR: 499 },
    { rank: Rank.BRONZE, minRR: 500, maxRR: 999 },
    { rank: Rank.SILVER, minRR: 1000, maxRR: 1499 },
    { rank: Rank.GOLD, minRR: 1500, maxRR: 1999 },
    { rank: Rank.PLATINUM, minRR: 2000, maxRR: 2499 },
    { rank: Rank.DIAMOND, minRR: 2500, maxRR: Infinity }
];

/**
 * Calculate expected score for ELO system
 */
function expectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate RR change based on ELO algorithm
 * @param winnerRR - Current RR of winner
 * @param loserRR - Current RR of loser
 * @returns Object with RR changes for both players
 */
export function calculateRRChange(winnerRR: number, loserRR: number): { winnerChange: number; loserChange: number } {
    const expectedWin = expectedScore(winnerRR, loserRR);
    const winnerChange = Math.round(K_FACTOR * (1 - expectedWin));
    const loserChange = -Math.round(K_FACTOR * expectedWin);

    return { winnerChange, loserChange };
}

/**
 * Get rank tier from RR points
 */
export function getRankFromRR(rr: number): Rank {
    for (const threshold of RANK_THRESHOLDS) {
        if (rr >= threshold.minRR && rr <= threshold.maxRR) {
            return threshold.rank;
        }
    }
    return Rank.UNRANKED;
}

/**
 * Update user ranking in database
 */
export async function updateUserRating(userId: string, rrChange: number, didWin: boolean): Promise<void> {
    const { User } = await import('../models/User');

    const user = await User.findById(userId);
    if (!user) return;

    user.rr = Math.max(0, user.rr + rrChange); // RR can't go below 0
    user.rank = getRankFromRR(user.rr);

    if (didWin) {
        user.wins += 1;
    } else {
        user.losses += 1;
    }

    await user.save();
}
