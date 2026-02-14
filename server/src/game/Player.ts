export interface Player {
    id: string; // socket.id
    name: string;
    score: number;
    hp: number;
    maxHp: number;
    streak: number; // consecutive correct answers
    isReady: boolean;
}

export const createPlayer = (id: string, name: string): Player => {
    return {
        id,
        name,
        score: 0,
        hp: 100,
        maxHp: 100,
        streak: 0,
        isReady: false
    };
};
