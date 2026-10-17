// src/data/puzzles.ts
// PUZZLE ARENA — Stage 2 catalog.
// 13 verified logic + pattern puzzles. Every puzzle has exactly one
// defensible correct answer (verified by hand — see the answer key in
// the Stage 2 Atlas package). No coins, no taunts, no scoring hooks:
// this file is questions + answers only.
export type PuzzleKind = 'pattern' | 'logic';

export type Puzzle = {
  id: string;
  kind: PuzzleKind;
  question: string;
  options: string[]; // exactly 4 options
  answerIndex: number; // index into options
};

export const ROUND_SIZE = 5;
export const VICTORY_THRESHOLD = 4; // correct answers needed to win
export const TIMER_SECONDS: Record<'easy' | 'medium' | 'hard', number> = {
  easy: 20,
  medium: 15,
  hard: 10,
};

export const PUZZLES: Puzzle[] = [
  {
    id: 'pattern-n2n',
    kind: 'pattern',
    question: 'What comes next? 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '44', '36'],
    answerIndex: 1, // n(n+1): 6x7 = 42
  },
  {
    id: 'pattern-fib',
    kind: 'pattern',
    question: 'What comes next? 1, 1, 2, 3, 5, 8, ?',
    options: ['11', '12', '13', '15'],
    answerIndex: 2, // Fibonacci: 5 + 8 = 13
  },
  {
    id: 'pattern-x3',
    kind: 'pattern',
    question: 'What comes next? 3, 9, 27, 81, ?',
    options: ['162', '243', '324', '216'],
    answerIndex: 1, // x3: 81 x 3 = 243
  },
  {
    id: 'pattern-x2',
    kind: 'pattern',
    question: 'What comes next? 5, 10, 20, 40, ?',
    options: ['60', '80', '100', '70'],
    answerIndex: 1, // x2: 40 x 2 = 80
  },
  {
    id: 'pattern-letters',
    kind: 'pattern',
    question: 'What comes next? A, C, F, J, O, ?',
    options: ['S', 'T', 'U', 'V'],
    answerIndex: 2, // gaps +2,+3,+4,+5 -> +6: O(15) + 6 = U(21)
  },
  {
    id: 'pattern-squares',
    kind: 'pattern',
    question: 'What comes next? 1, 4, 9, 16, 25, ?',
    options: ['30', '32', '36', '49'],
    answerIndex: 2, // squares: 6^2 = 36
  },
  {
    id: 'logic-syllogism',
    kind: 'logic',
    question: 'If all Bloops are Razzies, and all Razzies are Lazzies, then all Bloops are definitely Lazzies.',
    options: ['True', 'False', 'Cannot tell', 'Sometimes true'],
    answerIndex: 0, // valid syllogism
  },
  {
    id: 'logic-bat-ball',
    kind: 'logic',
    question: 'A bat and a ball cost $1.10 together. The bat costs $1.00 more than the ball. How much does the ball cost?',
    options: ['$0.10', '$0.05', '$0.15', '$0.01'],
    answerIndex: 1, // ball x, bat x+1: 2x + 1 = 1.10 -> x = 0.05
  },
  {
    id: 'logic-mary',
    kind: 'logic',
    question: "Mary's mother has four children. Three are named April, May, and June. What is the fourth child's name?",
    options: ['July', 'Mary', 'August', 'September'],
    answerIndex: 1, // Mary's mother -> the fourth child is Mary
  },
  {
    id: 'logic-sheep',
    kind: 'logic',
    question: 'A farmer has 17 sheep. All but 9 run away. How many are left?',
    options: ['8', '9', '17', '0'],
    answerIndex: 1, // "all but 9" = 9 remain
  },
  {
    id: 'logic-machines',
    kind: 'logic',
    question: 'If it takes 5 machines 5 minutes to make 5 widgets, how long do 100 machines take to make 100 widgets?',
    options: ['5 minutes', '100 minutes', '1 minute', '20 minutes'],
    answerIndex: 0, // each machine makes 1 widget in 5 minutes
  },
  {
    id: 'logic-percent',
    kind: 'logic',
    question: 'What is 15% of 200?',
    options: ['20', '25', '30', '35'],
    answerIndex: 2, // 0.15 x 200 = 30
  },
  {
    id: 'logic-odd-one',
    kind: 'logic',
    question: 'Which is the odd one out: Apple, Banana, Carrot, Grape?',
    options: ['Apple', 'Banana', 'Carrot', 'Grape'],
    answerIndex: 2, // Carrot is the only vegetable; the rest are fruits
  },
];

export type RoundPuzzle = {
  id: string;
  kind: PuzzleKind;
  question: string;
  options: string[]; // shuffled
  answerIndex: number; // remapped to the shuffled options
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build one round: 5 distinct puzzles (no repeat within the round),
// each with its 4 options shuffled so the correct position varies.
export function buildRound(): RoundPuzzle[] {
  return shuffle(PUZZLES)
    .slice(0, ROUND_SIZE)
    .map((p) => {
      const order = shuffle([0, 1, 2, 3]);
      return {
        id: p.id,
        kind: p.kind,
        question: p.question,
        options: order.map((i) => p.options[i]),
        answerIndex: order.indexOf(p.answerIndex),
      };
    });
}
