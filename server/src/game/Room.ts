import { Player } from './Player';
import { generateProblem, Difficulty, MathProblem } from './mathGenerator';

export enum GameStatus {
    WAITING = 'WAITING',
    PLAYING = 'PLAYING',
    FINISHED = 'FINISHED'
}

export class Room {
    id: string;
    players: Map<string, Player>;
    status: GameStatus;
    currentProblem: MathProblem | null;
    difficulty: Difficulty;
    // Configuration
    maxPlayers: number = 2; // For 1v1 default
    gameDuration: number = 60; // seconds (not always relevant depending on mode)

    constructor(id: string, difficulty: Difficulty = Difficulty.Medium) {
        this.id = id;
        this.players = new Map();
        this.status = GameStatus.WAITING;
        this.currentProblem = null;
        this.difficulty = difficulty;
    }

    addPlayer(player: Player): boolean {
        if (this.players.size >= this.maxPlayers) return false;
        this.players.set(player.id, player);
        return true;
    }

    removePlayer(playerId: string): void {
        this.players.delete(playerId);
        if (this.players.size === 0) {
            // Room empty logic handled by manager
        }
    }

    setReady(playerId: string, isReady: boolean): void {
        const player = this.players.get(playerId);
        if (player) {
            player.isReady = isReady;
        }
    }

    allPlayersReady(): boolean {
        if (this.players.size < 2) return false; // Need at least 2 for 1v1
        return Array.from(this.players.values()).every(p => p.isReady);
    }

    startGame(): void {
        this.status = GameStatus.PLAYING;
        // Reset stats
        this.players.forEach(p => {
            p.score = 0;
            p.hp = 100;
            p.streak = 0;
        });
        this.nextProblem();
    }

    nextProblem(): MathProblem {
        this.currentProblem = generateProblem(this.difficulty);
        return this.currentProblem;
    }

    handleAnswer(playerId: string, answer: number): { correct: boolean; damageDealt: number; newHp: number } {
        const player = this.players.get(playerId);
        if (!player || !this.currentProblem) return { correct: false, damageDealt: 0, newHp: 0 };

        // Check strict equality usually, but for some problem generators we might need range? No, exact matches for now.
        // Floating point issues in JS: mathGenerator uses integers mostly, or easy decimals.

        // Allow small margin for division?
        // Start with exact.
        const isCorrect = Math.abs(player.score - answer) < 0.001; // wait, checking against previous score?? NO.
        // Check against currentProblem.answer
        const isCorrectAnswer = Math.abs(this.currentProblem.answer - answer) < 0.001;

        let damageDealt = 0;

        if (isCorrectAnswer) {
            player.score += 10 + player.streak * 2;
            player.streak++;
            damageDealt = 10 + Math.floor(player.streak / 3) * 5;

            // Damage opponent(s)
            this.players.forEach(p => {
                if (p.id !== playerId) {
                    p.hp = Math.max(0, p.hp - damageDealt);
                }
            });

            // Generate new problem for everyone immediately
            if (this.status === GameStatus.PLAYING) {
                this.nextProblem();
            }

        } else {
            player.streak = 0;
            player.hp = Math.max(0, player.hp - 10); // Penalty
        }

        // Check win condition
        const opponent = Array.from(this.players.values()).find(p => p.id !== playerId);
        if (opponent && opponent.hp <= 0) {
            this.status = GameStatus.FINISHED;
        }

        return { correct: isCorrectAnswer, damageDealt, newHp: player.hp }; // return player's hp? or opponent's? Return result structure.
    }

    getwinner(): Player | null {
        // Basic logic
        if (this.status !== GameStatus.FINISHED) return null;
        // Sort by HP or Score
        const sorted = Array.from(this.players.values()).sort((a, b) => b.hp - a.hp);
        return sorted[0];
    }
}
