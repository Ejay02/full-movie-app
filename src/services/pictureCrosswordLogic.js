// Original arrow crosswords: clues live immediately above or left of their answers.
import { LARGE_PICTURE_CROSSWORDS } from '@/services/largePictureCrosswords';
const text = (label) => ({ label });
const picture = (image, label) => ({ image, label });
const blocks = [
  { rows: ['CAT', 'ORE', 'WED'], across: [picture('cat', 'Pet with whiskers'), text('Metal-bearing rock'), text('Marry')], down: [picture('cow', 'Farm animal'), text('You ___ here'), text('___ talk')] },
  { rows: ['HAT', 'ICE', 'PEN'], across: [picture('hat', 'Headwear'), picture('ice', 'Frozen water'), picture('pen', 'Writing tool')], down: [text('Joint above thigh'), text('Top playing card'), text('Five + five')] },
  { rows: ['DOG', 'ARE', 'NET'], across: [picture('dog', 'Pet that barks'), text('We ___ a team'), picture('net', 'Catches fish')], down: [text('Daniel, briefly'), text('Rock with metal'), text('Receive')] },
  { rows: ['BED', 'ARE', 'TEN'], across: [picture('bed', 'Sleep here'), text('They ___ happy'), text('Nine + one')], down: [picture('bat', 'Flying mammal'), text('Before, in poetry'), text('Animal’s home')] },
  { rows: ['COP', 'ARE', 'NET'], across: [text('Police officer'), text('You ___ welcome'), picture('net', 'Catches fish')], down: [picture('can', 'Food container'), text('Metal-bearing rock'), text('Animal companion')] },
  { rows: ['RAM', 'ICE', 'BED'], across: [text('Male sheep'), picture('ice', 'Frozen water'), picture('bed', 'Sleep here')], down: [text('Chest bone'), text('Expert'), text('___icine')] },
  { rows: ['NET', 'ERA', 'WAX'], across: [picture('net', 'Catches fish'), text('Period in history'), picture('candle', 'Candle material')], down: [text('Opposite of old'), text('An age of history'), text('Government levy')] },
];

function makePuzzle(id, title, indices) {
  const cells = Array.from({ length: 64 }, (_, key) => ({ key: String(key), row: Math.floor(key / 8), col: key % 8, kind: 'corner', words: [] }));
  const words = [];
  indices.forEach((blockIndex, blockNumber) => {
    const block = blocks[blockIndex], row = Math.floor(blockNumber / 2) * 4, col = (blockNumber % 2) * 4;
    for (const direction of ['across', 'down']) for (let n = 0; n < 3; n++) {
      const answer = direction === 'across' ? block.rows[n] : block.rows.map(line => line[n]).join('');
      const clue = (direction === 'across' ? block.across : block.down)[n];
      const clueRow = row + (direction === 'across' ? n + 1 : 0);
      const clueCol = col + (direction === 'down' ? n + 1 : 0);
      const word = { id: `${blockNumber}-${direction}-${n}`, ...clue, direction, answer, cells: [] };
      const clueCell = cells[clueRow * 8 + clueCol];
      Object.assign(clueCell, { kind: 'clue', wordId: word.id, ...clue, direction });
      for (let i = 0; i < 3; i++) {
        const r = row + 1 + (direction === 'across' ? n : i), c = col + 1 + (direction === 'down' ? n : i);
        const cell = cells[r * 8 + c];
        if (cell.answer && cell.answer !== answer[i]) throw new Error('Crossword intersection mismatch');
        Object.assign(cell, { kind: 'letter', answer: answer[i] });
        cell.words.push(word.id);
        word.cells.push(cell.key);
      }
      words.push(word);
    }
  });
  return { id, title, cols: 8, rows: 8, cells, words };
}

export const PICTURE_CROSSWORDS = [
  ...LARGE_PICTURE_CROSSWORDS,
  makePuzzle('picture-night-1', 'Little things', [0, 1, 2, 3]),
  makePuzzle('picture-night-2', 'Around us', [4, 5, 6, 0]),
];

export const picturePuzzle = (state) => PICTURE_CROSSWORDS.find(puzzle => puzzle.id === state?.puzzleId);

function drawRack(puzzle, filled, random = Math.random, returned = []) {
  const letters = puzzle.cells.filter(cell => cell.kind === 'letter' && !filled[cell.key]).map(cell => cell.answer);
  const kept = returned.filter(letter => { const index = letters.indexOf(letter); if (index < 0) return false; letters.splice(index, 1); return true; });
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return [...kept, ...letters.slice(0, Math.max(0, 5 - kept.length))];
}

export function newPictureCrossword(index = 0, player = 'Timi', random = Math.random) {
  const puzzle = PICTURE_CROSSWORDS[index % PICTURE_CROSSWORDS.length];
  return { puzzleId: puzzle.id, filled: {}, solved: {}, scores: { Timi: 0, Ejay: 0 },
    rack: drawRack(puzzle, {}, random), currentTurn: player, status: 'playing', turn: 0, lastMove: 'Place letters from your rack, then press Go.' };
}

export function playPictureTurn(state, player, placements, random = Math.random) {
  const puzzle = picturePuzzle(state);
  if (!puzzle || state.status !== 'playing' || state.currentTurn !== player) return { error: 'Wait for your turn.' };
  if (!Array.isArray(placements) || !placements.length) return { error: 'Place at least one letter first.' };
  const usedTiles = new Set(), usedCells = new Set();
  for (const { cellKey, rackIndex } of placements) {
    const cell = puzzle.cells.find(item => item.key === cellKey);
    if (!Number.isInteger(rackIndex) || rackIndex < 0 || rackIndex >= state.rack.length || usedTiles.has(rackIndex) || usedCells.has(cellKey) || cell?.kind !== 'letter' || state.filled?.[cellKey]) return { error: 'These tiles have changed. Clear your rack placements and try again.' };
    usedTiles.add(rackIndex); usedCells.add(cellKey);
  }
  const filled = { ...state.filled }, solved = { ...state.solved }, scores = { ...state.scores };
  let wrong = 0;
  const correctTiles = new Set();
  placements.forEach(({ cellKey, rackIndex }) => {
    if (puzzle.cells.find(cell => cell.key === cellKey).answer !== state.rack[rackIndex]) { wrong++; return; }
    filled[cellKey] = { letter: state.rack[rackIndex], player }; correctTiles.add(rackIndex);
  });
  let completed = 0;
  puzzle.words.forEach(word => {
    if (!solved[word.id] && word.cells.every(key => filled[key])) { solved[word.id] = player; completed++; }
  });
  const points = correctTiles.size + completed * 5 - wrong;
  scores[player] = (scores[player] || 0) + points;
  const done = puzzle.cells.every(cell => cell.kind !== 'letter' || filled[cell.key]);
  const returned = wrong ? state.rack.filter((_, index) => !correctTiles.has(index)) : [];
  return { wrong, state: { ...state, filled, solved, scores, rack: drawRack(puzzle, filled, random, returned),
    turn: (state.turn || 0) + 1, currentTurn: wrong ? player : player === 'Timi' ? 'Ejay' : 'Timi', status: done ? 'game_over' : 'playing',
    winner: done ? (scores.Timi === scores.Ejay ? null : scores.Timi > scores.Ejay ? 'Timi' : 'Ejay') : null,
    lastMove: `${player} ${points >= 0 ? '+' : ''}${points} · ${correctTiles.size} correct${wrong ? ` · ${wrong} wrong (−${wrong}), tiles returned — try again` : ''}${completed ? ` · ${completed} words completed` : ''}` } };
}

export function passPictureTurn(state, player, random = Math.random) {
  const puzzle = picturePuzzle(state);
  if (!puzzle || state.status !== 'playing' || state.currentTurn !== player) return null;
  return { ...state, rack: drawRack(puzzle, state.filled || {}, random), turn: (state.turn || 0) + 1,
    currentTurn: player === 'Timi' ? 'Ejay' : 'Timi', lastMove: `${player} passed and refreshed the letters.` };
}
