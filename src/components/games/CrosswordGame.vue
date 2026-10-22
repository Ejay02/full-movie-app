<template>
  <section class="picture-crossword">
    <header class="crossword-heading">
      <div><span class="crossword-eyebrow">PICTURE & WORD DUEL</span><h3>Crossword Go</h3></div>
      <span v-if="puzzle" class="puzzle-name">{{ puzzle.title }}</span>
    </header>
    <p class="crossword-intro">Read the pictures and word clues in the board. Place your letters, then Go. Each letter earns 1 point; finishing a word earns 5 more.</p>
    <v-alert v-if="gameError" dense outlined type="warning">{{ gameError }}</v-alert>
    <p v-if="gameLoading" role="status">Restoring your board…</p>
    <template v-if="puzzle && crosswordState">
      <div class="crossword-scores">
        <div v-for="person in ['Timi', 'Ejay']" :key="person" :class="['crossword-score', person.toLowerCase(), { active: crosswordState.currentTurn === person && !finished }]">
          <span>{{ person }}{{ person === currentUser ? ' · you' : '' }}</span><strong>{{ crosswordState.scores[person] }}</strong>
        </div>
      </div>
      <div class="picture-board" aria-label="Picture crossword board">
        <template v-for="cell in puzzle.cells">
          <button v-if="cell.kind === 'clue'" :key="cell.key" class="picture-clue" :class="{ chosen: selectedWordId === cell.wordId }" :aria-label="`${cell.image ? 'Picture clue' : cell.label}, ${cell.direction}`" @click="selectClue(cell.wordId)">
            <img v-if="cell.image" :src="`/crossword-clues/${cell.image}.svg`" alt="Picture clue" />
            <span v-else>{{ cell.label }}</span>
            <b class="clue-arrow" aria-hidden="true">{{ cell.direction === 'across' ? '→' : '↓' }}</b>
          </button>
          <button v-else-if="cell.kind === 'letter'" :key="cell.key" class="picture-square"
            :class="squareClasses(cell)" :disabled="gameLoading || gameSaving"
            :aria-label="`Row ${cell.row + 1}, column ${cell.col + 1}: ${letterAt(cell.key) || 'empty'}`"
            @click="tapCell(cell)">{{ letterAt(cell.key) }}</button>
          <div v-else :key="cell.key" class="board-corner" aria-hidden="true">✦</div>
        </template>
      </div>
      <div class="selected-clue" v-if="selectedWord">
        <img v-if="selectedWord.image" :src="`/crossword-clues/${selectedWord.image}.svg`" alt="Selected picture clue" />
        <span>{{ selectedWord.image ? 'What is pictured?' : selectedWord.label }} <small>{{ selectedWord.direction }} · {{ selectedWord.answer.length }} letters</small></span>
      </div>
      <p class="crossword-last-move">{{ crosswordState.lastMove }}</p>
      <div v-if="finished" class="crossword-finished" role="status">
        <strong>{{ crosswordState.winner ? `${crosswordState.winner} wins!` : 'A perfect tie!' }}</strong>
        <p>All {{ puzzle.words.length }} words complete.</p>
        <v-btn color="cyan" class="black--text text-none" :disabled="gameSaving" @click="nextPuzzle">Next picture crossword</v-btn>
      </div>
      <div v-else class="crossword-turn-panel">
        <div class="turn-line" role="status"><strong>{{ canPlay ? 'Your turn' : `${crosswordState.currentTurn}’s turn` }}</strong><span>{{ gameSaving ? 'Saving…' : canPlay ? 'Choose a letter, then a square' : `You’re ${currentUser} · waiting` }}</span></div>
        <div class="letter-rack" aria-label="Your letter rack">
          <button v-for="(letter, index) in crosswordState.rack" :key="index" :class="['rack-tile', { selected: selectedTile === index, used: tileUsed(index) }]"
            :disabled="!canPlay || tileUsed(index)" :aria-label="`Rack letter ${letter}, tile ${index + 1}`" :aria-pressed="selectedTile === index" @click="chooseTile(index)">{{ letter }}</button>
        </div>
        <div class="crossword-actions">
          <v-btn small text :disabled="!pending.length || gameSaving" @click="clearDraft">Clear tiles</v-btn>
          <v-btn small text :disabled="!canPlay" @click="passTurn">Pass</v-btn>
          <v-btn color="cyan" class="black--text font-weight-bold" :disabled="!canPlay || !pending.length" @click="submitTurn">Go · {{ pending.length }} tiles</v-btn>
        </div>
        <p v-if="feedback" class="crossword-feedback" role="status">{{ feedback }}</p>
      </div>
    </template>
  </section>
</template>

<script>
import gameSession from '@/services/gameSession';
import { PICTURE_CROSSWORDS, picturePuzzle, newPictureCrossword, playPictureTurn, passPictureTurn } from '@/services/pictureCrosswordLogic';

export default {
  name: 'CrosswordGame',
  mixins: [gameSession('crosswordGo', 'crosswordState', () => newPictureCrossword())],
  props: { currentUser: { type: String, default: 'Timi' }, roomId: { type: String, default: 'date-night' } },
  data: () => ({ crosswordState: null, selectedWordId: null, selectedTile: null, selectedCell: null, pending: [], feedback: '' }),
  computed: {
    puzzle() { return picturePuzzle(this.crosswordState); },
    selectedWord() { return this.puzzle?.words.find(word => word.id === this.selectedWordId); },
    finished() { return this.crosswordState?.status === 'game_over'; },
    canPlay() { return !this.gameLoading && !this.gameSaving && !this.finished && this.crosswordState?.currentTurn === this.currentUser; },
    draftKey() { return `picture-crossword-draft:${this.roomId}:${this.currentUser}:${this.crosswordState?.puzzleId}:${this.crosswordState?.revision || this.crosswordState?.turn || 0}`; },
  },
  watch: {
    draftKey: { immediate: true, handler() {
      this.selectedTile = null; this.selectedCell = null; this.selectedWordId = null; this.feedback = '';
      try {
        const draft = JSON.parse(localStorage.getItem(this.draftKey) || '[]');
        this.pending = Array.isArray(draft) ? draft.filter(item => this.puzzle?.cells.some(cell => cell.key === item.cellKey && cell.kind === 'letter') && Number.isInteger(item.rackIndex) && item.rackIndex >= 0 && item.rackIndex < (this.crosswordState?.rack.length || 0) && !this.crosswordState?.filled[item.cellKey]) : [];
      } catch (_) { this.pending = []; }
    } },
  },
  methods: {
    rememberDraft() { try { localStorage.setItem(this.draftKey, JSON.stringify(this.pending)); } catch (_) { /* Submitted turns are saved to the room. */ } },
    tileUsed(index) { return this.pending.some(item => item.rackIndex === index); },
    letterAt(key) { const draft = this.pending.find(item => item.cellKey === key); return this.crosswordState.filled[key]?.letter || (draft ? this.crosswordState.rack[draft.rackIndex] : ''); },
    squareClasses(cell) { return { selected: this.selectedCell === cell.key, highlighted: cell.words.includes(this.selectedWordId), draft: this.pending.some(item => item.cellKey === cell.key), timi: this.crosswordState.filled[cell.key]?.player === 'Timi', ejay: this.crosswordState.filled[cell.key]?.player === 'Ejay' }; },
    selectClue(id) {
      this.selectedWordId = id;
      const word = this.puzzle.words.find(item => item.id === id);
      this.selectedCell = word.cells.find(key => !this.letterAt(key)) || null;
    },
    chooseTile(index) {
      if (!this.canPlay || this.tileUsed(index)) return;
      this.selectedTile = index;
    },
    tapCell(cell) {
      const draftIndex = this.pending.findIndex(item => item.cellKey === cell.key);
      if (draftIndex !== -1 && this.canPlay) { this.pending.splice(draftIndex, 1); this.rememberDraft(); }
      if (!cell.words.includes(this.selectedWordId)) this.selectedWordId = cell.words[0];
      this.selectedCell = cell.key;
      if (this.selectedTile !== null && !this.crosswordState.filled[cell.key] && this.canPlay) this.placeTile(cell.key);
    },
    placeTile(key) {
      if (!this.canPlay || this.selectedTile === null || this.letterAt(key)) return;
      this.pending.push({ cellKey: key, rackIndex: this.selectedTile });
      this.selectedTile = null; this.feedback = ''; this.rememberDraft();
      this.selectedCell = this.selectedWord?.cells.find(cellKey => !this.letterAt(cellKey)) || null;
    },
    clearDraft() { this.pending = []; this.selectedTile = null; this.feedback = ''; this.rememberDraft(); },
    async submitTurn() {
      if (!this.canPlay) return;
      const result = playPictureTurn(this.crosswordState, this.currentUser, this.pending);
      if (result.error) { this.feedback = result.error; return; }
      const key = this.draftKey;
      if (await this.saveGameSession(result.state)) { try { localStorage.removeItem(key); } catch (_) { /* optional cache */ } this.pending = []; this.selectedTile = null; }
    },
    async passTurn() {
      if (!this.canPlay) return;
      const next = passPictureTurn(this.crosswordState, this.currentUser);
      if (next && await this.saveGameSession(next)) this.clearDraft();
    },
    nextPuzzle() {
      if (!this.finished) return;
      const index = PICTURE_CROSSWORDS.findIndex(puzzle => puzzle.id === this.crosswordState.puzzleId);
      this.saveGameSession(newPictureCrossword(index + 1, this.currentUser));
    },
  },
};
</script>

<style scoped>
.picture-crossword { max-width: 660px; margin: auto; padding: 20px 12px 0; }
.crossword-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.crossword-heading h3 { font-size: 26px; font-weight: 800; letter-spacing: -1px; }
.crossword-eyebrow { color: #61e1dd; font-size: 10px; letter-spacing: 2px; font-weight: 800; }
.puzzle-name { color: #b4bbd5; font-size: 12px; }
.crossword-intro { font-size: 12px; line-height: 1.6; color: #aebbd0; margin: 12px 0; }
.crossword-scores { display: flex; gap: 12px; margin-bottom: 16px; }
.crossword-score { flex: 1; padding: 10px 18px; border: 2px solid transparent; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; background: #1c263e; }
.crossword-score strong { font-size: 25px; }
.crossword-score.timi { color: #ffacda; }.crossword-score.ejay { color: #72e5ef; }
.crossword-score.active { border-color: currentColor; }
.picture-board { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 2px; padding: 3px; border: 2px solid #9cb6d1; background: #60758c; border-radius: 9px; overflow: hidden; }
.picture-clue, .picture-square, .board-corner { aspect-ratio: 1; min-width: 0; }
.picture-clue { background: #fff1d4; color: #334058; position: relative; display: flex; justify-content: center; align-items: center; padding: 4px 6px 10px 3px; font-size: clamp(8px, 1.7vw, 12px); font-weight: 700; line-height: 1.05; overflow-wrap: anywhere; }
.picture-clue img { width: 85%; height: 85%; object-fit: contain; }
.picture-clue.chosen { background: #ffe29a; box-shadow: inset 0 0 0 2px #d5981e; }
.clue-arrow { position: absolute; bottom: 0; right: 3px; font-size: 13px; color: #42647d; }
.picture-square { background: #f5f8fc; color: #23354b; font-weight: 800; font-size: clamp(20px, 4vw, 32px); border: 2px solid transparent; }
.picture-square.highlighted { background: #dceefb; }.picture-square.selected { border-color: #125ca0; }
.picture-square.timi { color: #8c2456; background: #ffe0ed; }.picture-square.ejay { color: #086675; background: #c7f3f5; }
.picture-square.draft { background: #ffe4a0; color: #664309; }
.board-corner { display: grid; place-items: center; color: #7895b0; background: #20354e; font-size: 25px; }
.selected-clue { min-height: 58px; display: flex; align-items: center; gap: 12px; margin-top: 8px; color: #eef4ff; }
.selected-clue img { width: 52px; height: 52px; background: #fff1d4; border-radius: 8px; }
.selected-clue small { display: block; color: #9eafc6; text-transform: capitalize; }
.crossword-last-move { color: #9eafc6; font-size: 12px; margin: 10px 0; }
.crossword-turn-panel { position: sticky; bottom: 0; z-index: 5; border: 1px solid #3a4c6e; border-radius: 16px 16px 0 0; background: #111d34; box-shadow: 0 -6px 24px #0005; padding: 12px 10px calc(12px + env(safe-area-inset-bottom)); }
.turn-line { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; color: #b3c2d8; }
.turn-line strong { color: #7be6ec; font-size: 16px; }.letter-rack { display: flex; justify-content: center; gap: 10px; margin: 12px 0; }
.rack-tile { width: 46px; height: 49px; border-radius: 8px; border: 2px solid #a5f0f3; background: #a9e7e8; color: #153c47; font-weight: 800; font-size: 27px; box-shadow: 0 3px #59949e; }
.rack-tile.selected { background: #ffe3a0; border-color: #e7aa35; }.rack-tile.used { opacity: .2; }.rack-tile:disabled { cursor: default; }
.crossword-actions { display: flex; align-items: center; justify-content: space-between; gap: 4px; }.crossword-feedback { color: #ffd493; font-size: 12px; margin: 8px 0 0; }
.crossword-finished { padding: 20px; text-align: center; border-radius: 12px; background: #153b42; }.crossword-finished strong { font-size: 24px; }
button:focus-visible { outline: 3px solid #e6a72e; outline-offset: -3px; }
@media (max-width: 600px) { .picture-crossword { padding: 12px 0 0; }.turn-line span { font-size: 10px; }.crossword-intro { font-size: 11px; }.picture-board { gap: 1px; padding: 2px; }.picture-clue { padding: 2px 2px 8px; }.crossword-heading h3 { font-size: 23px; } }
</style>
