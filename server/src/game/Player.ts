export interface Player {
    id: string; // socket.id
    userId?: string; // MongoDB user ID (null for guests)
    name: string;
    score: number;
    hp: number;
    maxHp: number;
    streak: number; // consecutive correct answers
    isReady: boolean;
    teamId?: 1 | 2; // For 2v2 mode
}

export const createPlayer = (id: string, name: string, userId?: string): Player => {
    return {
        id,
        userId,
        name,
        score: 0,
        hp: 100,
        maxHp: 100,
        streak: 0,
        isReady: false
    };
};
