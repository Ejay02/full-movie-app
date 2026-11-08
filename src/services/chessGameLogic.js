import { Chess } from 'chess.js';

export function otherPlayer(player) {
  return player === 'Timi' ? 'Ejay' : 'Timi';
}

export function newChessMatch(white = 'Timi') {
  return { white, moves: [], currentTurn: white, status: 'playing', winner: null };
}

export function restoreChess(state) {
  if (!state || !['Timi', 'Ejay'].includes(state.white)) return null;
  try {
    const board = new Chess();
    for (const move of state.moves || []) board.move(move);
    return board;
  } catch (_) {
    return null;
  }
}

export function moveChess(state, player, move) {
  const board = restoreChess(state);
  if (!board || board.isGameOver() || state.status !== 'playing') return null;
  const turn = board.turn() === 'w' ? state.white : otherPlayer(state.white);
  if (player !== turn) return null;
  try {
    const played = board.move(move);
    if (!played) return null;
    return {
      white: state.white,
      moves: [...(state.moves || []), played.san],
      currentTurn: board.turn() === 'w' ? state.white : otherPlayer(state.white),
      status: board.isGameOver() ? 'game_over' : 'playing',
      winner: board.isCheckmate() ? player : null,
    };
  } catch (_) {
    return null;
  }
}
