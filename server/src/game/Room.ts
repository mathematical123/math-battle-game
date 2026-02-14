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
    gameMode: '1v1' | '2v2';
    isRanked: boolean;
    // Configuration
    maxPlayers: number;
    gameDuration: number = 60; // seconds (not always relevant depending on mode)
    startTime: number | null = null;

    constructor(
        id: string,
        difficulty: Difficulty = Difficulty.Medium,
        gameMode: '1v1' | '2v2' = '1v1',
        isRanked: boolean = false
    ) {
        this.id = id;
        this.players = new Map();
        this.status = GameStatus.WAITING;
        this.currentProblem = null;
        this.difficulty = difficulty;
        this.gameMode = gameMode;
        this.isRanked = isRanked;
        this.maxPlayers = gameMode === '2v2' ? 4 : 2;
    }

    addPlayer(player: Player): boolean {
        if (this.players.size >= this.maxPlayers) return false;

        // Auto-assign teams in 2v2 mode
        if (this.gameMode === '2v2') {
            const team1Count = Array.from(this.players.values()).filter(p => p.teamId === 1).length;
            const team2Count = Array.from(this.players.values()).filter(p => p.teamId === 2).length;
            player.teamId = team1Count <= team2Count ? 1 : 2;
        }

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
        const requiredPlayers = this.gameMode === '2v2' ? 4 : 2;
        if (this.players.size < requiredPlayers) return false;
        return Array.from(this.players.values()).every(p => p.isReady);
    }

    startGame(): void {
        this.status = GameStatus.PLAYING;
        this.startTime = Date.now();
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

        const isCorrectAnswer = Math.abs(this.currentProblem.answer - answer) < 0.001;

        let damageDealt = 0;

        if (isCorrectAnswer) {
            player.score += 10 + player.streak * 2;
            player.streak++;
            damageDealt = 10 + Math.floor(player.streak / 3) * 5;

            // Damage opponents based on game mode
            if (this.gameMode === '2v2') {
                // In 2v2, damage all opponents (enemy team)
                const enemyTeamId = player.teamId === 1 ? 2 : 1;
                this.players.forEach(p => {
                    if (p.teamId === enemyTeamId) {
                        p.hp = Math.max(0, p.hp - damageDealt);
                    }
                });
            } else {
                // In 1v1, damage the opponent
                this.players.forEach(p => {
                    if (p.id !== playerId) {
                        p.hp = Math.max(0, p.hp - damageDealt);
                    }
                });
            }

            // Generate new problem for everyone immediately
            if (this.status === GameStatus.PLAYING) {
                this.nextProblem();
            }

        } else {
            player.streak = 0;
            player.hp = Math.max(0, player.hp - 10); // Penalty (only to self, not teammate)
        }

        // Check win condition
        if (this.checkGameOver()) {
            this.status = GameStatus.FINISHED;
        }

        return { correct: isCorrectAnswer, damageDealt, newHp: player.hp };
    }

    /**
     * Check if game is over based on game mode
     */
    checkGameOver(): boolean {
        if (this.gameMode === '2v2') {
            // In 2v2, game ends when all members of one team are at 0 HP
            const team1Players = Array.from(this.players.values()).filter(p => p.teamId === 1);
            const team2Players = Array.from(this.players.values()).filter(p => p.teamId === 2);

            const team1Defeated = team1Players.every(p => p.hp <= 0);
            const team2Defeated = team2Players.every(p => p.hp <= 0);

            return team1Defeated || team2Defeated;
        } else {
            // In 1v1, game ends when opponent reaches 0 HP
            return Array.from(this.players.values()).some(p => p.hp <= 0);
        }
    }

    getwinner(): Player | Player[] | null {
        if (this.status !== GameStatus.FINISHED) return null;

        if (this.gameMode === '2v2') {
            // Return winning team
            const team1Players = Array.from(this.players.values()).filter(p => p.teamId === 1);
            const team2Players = Array.from(this.players.values()).filter(p => p.teamId === 2);

            const team1Alive = team1Players.some(p => p.hp > 0);
            const team2Alive = team2Players.some(p => p.hp > 0);

            if (team1Alive) return team1Players;
            if (team2Alive) return team2Players;

            // Tie? Return team with higher total HP
            const team1TotalHp = team1Players.reduce((sum, p) => sum + p.hp, 0);
            const team2TotalHp = team2Players.reduce((sum, p) => sum + p.hp, 0);
            return team1TotalHp >= team2TotalHp ? team1Players : team2Players;
        } else {
            // 1v1: return player with highest HP
            const sorted = Array.from(this.players.values()).sort((a, b) => b.hp - a.hp);
            return sorted[0];
        }
    }
}
