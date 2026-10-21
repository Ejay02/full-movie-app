// Original mini crosswords. Coordinates are zero-based; all intersections agree.
const makePuzzle = (id, title, words) => {
  const starts = [...new Set(words.map((word) => word.row * 6 + word.col))].sort((a, b) => a - b);
  return { id, title, rows: 8, cols: 6, words: words.map((word, index) => ({
    ...word, id: `word-${index}`, number: starts.indexOf(word.row * 6 + word.col) + 1,
  })) };
};

export const CROSSWORDS = [
  makePuzzle('movie-night', 'A little movie night', [
    { answer: 'DATE', clue: 'An evening planned for just the two of you', row: 0, col: 4, direction: 'down' },
    { answer: 'LEAF', clue: 'A flat green part of a plant', row: 1, col: 2, direction: 'across' },
    { answer: 'LOVE', clue: 'What brings you back to each other', row: 1, col: 2, direction: 'down' },
    { answer: 'MOVIE', clue: 'Pick one from Our Queue', row: 3, col: 0, direction: 'across' },
    { answer: 'MUSIC', clue: 'A soundtrack is full of this', row: 3, col: 0, direction: 'down' },
    { answer: 'COZY', clue: 'Warm, snug and comfortable', row: 7, col: 0, direction: 'across' },
  ]),
  makePuzzle('close-to-home', 'Close to home', [
    { answer: 'MEET', clue: 'Come together at an agreed place', row: 0, col: 4, direction: 'down' },
    { answer: 'POEM', clue: 'Words in verse, perhaps written for a loved one', row: 1, col: 2, direction: 'across' },
    { answer: 'PEACE', clue: 'Calm, without conflict', row: 1, col: 2, direction: 'down' },
    { answer: 'HEART', clue: 'It beats faster when you see your person', row: 3, col: 0, direction: 'across' },
    { answer: 'HOUSE', clue: 'A building that can become a home', row: 3, col: 0, direction: 'down' },
    { answer: 'EASY', clue: 'The opposite of difficult', row: 7, col: 0, direction: 'across' },
  ]),
];

export function wordCells(word) {
  return [...word.answer].map((letter, index) => ({ letter,
    row: word.row + (word.direction === 'down' ? index : 0),
    col: word.col + (word.direction === 'across' ? index : 0),
  }));
}

export function newCrossword(index = 0) {
  return { puzzleId: CROSSWORDS[index % CROSSWORDS.length].id, solved: {}, status: 'playing' };
}

export function solveWord(state, wordId, answer, player) {
  const puzzle = CROSSWORDS.find((item) => item.id === state?.puzzleId);
  const word = puzzle?.words.find((item) => item.id === wordId);
  if (!word || state.solved?.[wordId] || answer.trim().toUpperCase() !== word.answer) return null;
  const solved = { ...state.solved, [wordId]: player };
  return { ...state, solved, lastEditor: player,
    status: puzzle.words.every((item) => solved[item.id]) ? 'complete' : 'playing' };
}

export function crosswordCells(puzzle, state) {
  const grid = Array.from({ length: puzzle.rows * puzzle.cols }, (_, index) => ({
    key: index, row: Math.floor(index / puzzle.cols), col: index % puzzle.cols, words: [], letter: '', number: null,
  }));
  puzzle.words.forEach((word) => wordCells(word).forEach((cell, index) => {
    const square = grid[cell.row * puzzle.cols + cell.col];
    square.words.push(word.id);
    if (index === 0) square.number = word.number;
    if (state.solved?.[word.id]) square.letter = cell.letter;
  }));
  return grid;
}
