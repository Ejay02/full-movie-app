<template>
  <section class="chess-game" aria-label="Chess">
    <header class="chess-header">
      <div>
        <span class="chess-eyebrow">ROOM MATCH</span>
        <h3>Chess</h3>
      </div>
      <v-btn small outlined color="#b7d99a" class="text-none" :disabled="gameLoading || gameSaving" @click="confirmReset = true">
        {{ state && state.status === 'game_over' ? 'Rematch' : 'New Game' }}
      </v-btn>
    </header>

    <v-alert v-if="gameError" dense outlined type="warning">{{ gameError }}</v-alert>
    <p v-if="gameLoading" class="chess-turn" role="status">Restoring your match…</p>
    <template v-else-if="board">
      <div class="chess-turn" role="status" aria-live="polite">
        <strong>{{ gameSaving ? 'Saving move…' : turnLabel }}</strong>
        <span>{{ currentUser }} · {{ myColor === 'w' ? 'White' : 'Black' }}</span>
      </div>
      <div v-if="promotion" class="chess-promotion">
        <strong>Promote your pawn to:</strong>
        <button v-for="choice in promotionChoices" :key="choice" type="button" @click="promote(choice)">{{ pieceNames[choice] }}</button>
        <button type="button" @click="promotion = null">Cancel</button>
      </div>
      <div class="chess-board" role="group" aria-label="Chess board">
        <button v-for="cell in cells" :key="cell.square" type="button" class="chess-square"
          :data-square="cell.square"
          :class="{
            'chess-dark': cell.dark, 'chess-selected': cell.square === selected,
            'chess-target': targets.includes(cell.square), 'chess-last': lastSquares.includes(cell.square),
            'chess-in-check': cell.type === 'k' && cell.color === board.turn() && board.isCheck(),
          }"
          :aria-label="squareLabel(cell)" :aria-pressed="cell.square === selected"
          :aria-disabled="!canMove" @click="chooseSquare(cell)">
          <span v-if="cell.fileLabel" class="chess-file" aria-hidden="true">{{ cell.square[0] }}</span>
          <span v-if="cell.rankLabel" class="chess-rank" aria-hidden="true">{{ cell.square[1] }}</span>
          <span v-if="cell.type" class="chess-piece" :class="{ 'chess-white-piece': cell.color === 'w' }" aria-hidden="true">{{ pieces[cell.type] }}</span>
        </button>
      </div>
      <p class="chess-footer">
        {{ lastMove ? `Last move: ${lastMove.san}` : 'Tap a piece to see where it can move.' }}
      </p>
    </template>
    <p v-else class="chess-turn">This match couldn’t be restored. Start a new game to play.</p>

    <v-dialog v-model="confirmReset" max-width="360">
      <v-card dark class="pa-4">
        <h4 class="mb-2">Start a new chess match?</h4>
        <p class="body-2">This replaces the board for both players. You’ll swap colors.</p>
        <div class="chess-reset">
          <v-btn text class="text-none" @click="confirmReset = false">Cancel</v-btn>
          <v-btn color="#b7d99a" class="black--text text-none" :disabled="gameSaving" @click="resetMatch">Start new match</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </section>
</template>

<script>
import gameSession from '@/services/gameSession';
import { newChessMatch, restoreChess, moveChess, otherPlayer } from '@/services/chessGameLogic';

export default {
  name: 'ChessGame',
  mixins: [gameSession('chess', 'state', () => newChessMatch())],
  props: {
    currentUser: { type: String, required: true },
    roomId: { type: String, required: true },
  },
  data: () => ({
    state: null, selected: '', promotion: null, confirmReset: false,
    pieces: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
    pieceNames: { k: 'King', q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn' },
    promotionChoices: ['q', 'r', 'b', 'n'],
  }),
  computed: {
    board() { return restoreChess(this.state); },
    myColor() { return this.state?.white === this.currentUser ? 'w' : 'b'; },
    canMove() {
      return !this.gameLoading && !this.gameSaving && this.state?.status === 'playing' &&
        this.state.currentTurn === this.currentUser;
    },
    turnLabel() {
      if (this.board.isCheckmate()) return `Checkmate · ${this.state.winner} wins`;
      if (this.board.isStalemate()) return 'Draw · Stalemate';
      if (this.board.isDraw()) return 'Draw';
      const turn = this.canMove ? 'Your turn' : `${this.state.currentTurn}’s turn`;
      return this.board.isCheck() ? `${turn} · Check` : turn;
    },
    cells() {
      if (!this.board) return [];
      const cells = this.board.board().flatMap((row, r) => row.map((piece, c) => ({
        ...piece, square: `${'abcdefgh'[c]}${8 - r}`, dark: (r + c) % 2 === 1,
      })));
      if (this.myColor === 'b') cells.reverse();
      return cells.map((cell, i) => ({ ...cell, fileLabel: i >= 56, rankLabel: i % 8 === 0 }));
    },
    legalMoves() {
      return this.selected && this.canMove ? this.board.moves({ square: this.selected, verbose: true }) : [];
    },
    targets() { return this.legalMoves.map(move => move.to); },
    lastMove() {
      const moves = this.board?.history({ verbose: true }) || [];
      return moves[moves.length - 1];
    },
    lastSquares() { return this.lastMove ? [this.lastMove.from, this.lastMove.to] : []; },
  },
  watch: {
    state() { this.clearSelection(); },
    currentUser() { this.clearSelection(); },
  },
  methods: {
    clearSelection() { this.selected = ''; this.promotion = null; },
    squareLabel(cell) {
      return [
        cell.square,
        cell.type && `${cell.color === 'w' ? 'White' : 'Black'} ${this.pieceNames[cell.type]}`,
        this.targets.includes(cell.square) && 'legal move',
      ].filter(Boolean).join(', ');
    },
    chooseSquare(cell) {
      if (!this.canMove || this.promotion) return;
      if (this.selected === cell.square) { this.clearSelection(); return; }
      const move = this.legalMoves.find(item => item.to === cell.square);
      if (move?.promotion) { this.promotion = { from: move.from, to: move.to }; return; }
      if (move) { this.submitMove({ from: move.from, to: move.to }); return; }
      this.selected = cell.color === this.myColor ? cell.square : '';
    },
    promote(choice) { if (this.promotion) this.submitMove({ ...this.promotion, promotion: choice }); },
    submitMove(move) {
      if (!this.canMove) return;
      const next = moveChess(this.state, this.currentUser, move);
      if (next) { this.clearSelection(); this.saveGameSession(next); }
    },
    async resetMatch() {
      const white = this.state?.white ? otherPlayer(this.state.white) : 'Timi';
      if (await this.saveGameSession(newChessMatch(white))) this.confirmReset = false;
    },
  },
};
</script>

<style scoped>
.chess-game {
  --chess-ink: #edf6e7;
  max-width: 550px;
  margin: 0 auto;
  padding: clamp(10px, 3vw, 20px);
  border: 1px solid #a9ce983d;
  border-radius: 18px;
  background: linear-gradient(150deg, #202c27, #141c1b 75%);
  color: var(--chess-ink);
}
.chess-header, .chess-turn, .chess-promotion, .chess-reset {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.chess-header { margin-bottom: 12px; }
.chess-header h3 { font-size: 1.5rem; line-height: 1.1; }
.chess-eyebrow { color: #b7d99a; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.14em; }
.chess-turn {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #a7d99319;
  font-size: 0.84rem;
}
.chess-turn span, .chess-footer { color: #c0d1bd; font-size: 0.76rem; }
.chess-promotion { margin-bottom: 10px; font-size: 0.8rem; }
.chess-promotion button { border: 1px solid #bdd8b2; padding: 4px 8px; border-radius: 5px; }
.chess-board {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  border: 2px solid #c9e1b5;
  border-radius: 9px;
  overflow: hidden;
}
.chess-square {
  display: grid;
  place-items: center;
  min-width: 0;
  aspect-ratio: 1;
  position: relative;
  background: #e1e8cf;
  color: #25382d;
}
.chess-square.chess-dark { background: #688568; color: #f5f7e7; }
.chess-square.chess-last { background: #a8bd69; color: #203222; }
.chess-square.chess-selected { background: #e6ca64; color: #203222; box-shadow: inset 0 0 0 2px #785c17; }
.chess-square.chess-in-check { background: #d37568; color: #251713; }
.chess-square:focus-visible { z-index: 1; outline: 3px solid #18251c; outline-offset: -3px; }
.chess-target::after {
  content: '';
  position: absolute;
  width: 28%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #15281977;
  pointer-events: none;
}
.chess-target:has(.chess-piece)::after { width: 85%; background: transparent; border: 3px solid #15281988; }
.chess-piece {
  font-family: 'Segoe UI Symbol', 'DejaVu Sans', serif;
  font-size: clamp(21px, 8vw, 43px);
  line-height: 1;
  color: #17221e;
  text-shadow: 0 1px 1px #fff7;
}
.chess-white-piece { color: #fffbe9; text-shadow: 0 1px 2px #17221e, 1px 0 #17221e, -1px 0 #17221e; }
.chess-file, .chess-rank { position: absolute; font-size: 0.58rem; font-weight: 700; }
.chess-file { right: 2px; bottom: 0; }
.chess-rank { left: 2px; top: 0; }
.chess-footer { margin: 9px 0 0; }
.chess-reset { justify-content: flex-end; }
</style>
