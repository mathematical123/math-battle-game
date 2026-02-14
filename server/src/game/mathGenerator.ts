export enum Difficulty {
    Easy = 'Easy',
    Medium = 'Medium',
    Hard = 'Hard',
    Expert = 'Expert',
    Chaos = 'Chaos'
}

export interface MathProblem {
    question: string;
    answer: number;
    difficulty: Difficulty;
}

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateProblem = (difficulty: Difficulty): MathProblem => {
    let selectedDifficulty = difficulty;
    if (difficulty === Difficulty.Chaos) {
        const levels = [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard, Difficulty.Expert];
        selectedDifficulty = levels[randomInt(0, levels.length - 1)];
    }

    let a, b, answer;
    let question = '';

    switch (selectedDifficulty) {
        case Difficulty.Easy: // Addition, Subtraction (0-20)
            if (Math.random() > 0.5) {
                a = randomInt(1, 20);
                b = randomInt(1, 20);
                answer = a + b;
                question = `${a} + ${b}`;
            } else {
                a = randomInt(5, 20);
                b = randomInt(1, a); // ensure positive result
                answer = a - b;
                question = `${a} - ${b}`;
            }
            break;

        case Difficulty.Medium: // Multiplication (2-10), Division (simple)
            if (Math.random() > 0.5) {
                a = randomInt(2, 12);
                b = randomInt(2, 12);
                answer = a * b;
                question = `${a} × ${b}`;
            } else {
                b = randomInt(2, 10);
                answer = randomInt(2, 10);
                a = b * answer; // ensure clean division
                question = `${a} ÷ ${b}`;
            }
            break;

        case Difficulty.Hard: // Exponents, Square Roots, larger sums
            const type = Math.random();
            if (type < 0.33) {
                // Exponent (small base, small power)
                a = randomInt(2, 9);
                b = randomInt(2, 3);
                answer = Math.pow(a, b);
                question = `${a}^${b}`;
            } else if (type < 0.66) {
                // Square Root (perfect squares)
                answer = randomInt(4, 15);
                a = answer * answer;
                question = `√${a}`;
            } else {
                // Mixed arithmetic
                a = randomInt(10, 50);
                b = randomInt(10, 50);
                let c = randomInt(2, 5);
                answer = a + b * c;
                question = `${a} + ${b} × ${c}`;
            }
            break;

        case Difficulty.Expert: // Algebra, Complex arithmetic
            const expType = Math.random();
            if (expType < 0.5) {
                // Algebra: Solve for x: ax + b = c
                let x = randomInt(1, 15);
                a = randomInt(2, 10);
                b = randomInt(1, 50);
                let c = a * x + b;
                answer = x;
                question = `${a}x + ${b} = ${c}`;
            } else {
                // Larger Multiplication
                a = randomInt(11, 25);
                b = randomInt(11, 25);
                answer = a * b;
                question = `${a} × ${b}`;
            }
            break;

        default: // Fallback to Easy
            a = randomInt(1, 10);
            b = randomInt(1, 10);
            answer = a + b;
            question = `${a} + ${b}`;
            break;
    }

    return {
        question,
        answer,
        difficulty: selectedDifficulty
    };
};
