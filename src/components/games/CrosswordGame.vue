<template>
  <section class="crossword-game pa-3 pa-sm-6">
    <div class="d-flex align-center justify-space-between flex-wrap mb-2">
      <div><span class="cyan--text caption font-weight-bold">BETTER TOGETHER</span><h3 class="text-h5 font-weight-bold">Crossword Go</h3></div>
      <span v-if="puzzle" class="caption">{{ solvedCount }} / {{ puzzle.words.length }} clues solved</span>
    </div>
    <p class="grey--text text--lighten-1 text-body-2">Solve together, no turns needed. Tap a clue, type your answer, then check it. Correct words fill the shared grid and stay saved.</p>
    <v-alert v-if="gameError" type="warning" dense outlined>{{ gameError }}</v-alert>
    <p v-if="gameLoading" role="status">Restoring your crossword…</p>
    <template v-if="puzzle && crosswordState">
      <h4 class="mb-4">{{ puzzle.title }}</h4>
      <div class="crossword-layout">
        <div>
          <div class="crossword-grid" :style="{ gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)` }" aria-label="Crossword grid">
            <template v-for="cell in cells">
              <button v-if="cell.words.length" :key="cell.key" type="button" class="crossword-cell"
                :class="{ selected: cell.words.includes(selectedId), filled: !!cell.letter }"
                :aria-label="`Row ${cell.row + 1}, column ${cell.col + 1}${cell.number ? ', clue ' + cell.number : ''}: ${cell.letter || 'empty'}`"
                @click="selectCell(cell)">
                <small v-if="cell.number">{{ cell.number }}</small><span>{{ cell.letter }}</span>
              </button>
              <span v-else :key="cell.key" class="crossword-block" aria-hidden="true" />
            </template>
          </div>
          <form v-if="selectedWord" class="clue-answer mt-4 pa-4" @submit.prevent="checkAnswer">
            <label for="crossword-answer" class="d-block font-weight-bold mb-2">{{ selectedWord.number }} {{ selectedWord.direction }} · {{ selectedWord.clue }} ({{ selectedWord.answer.length }})</label>
            <p v-if="crosswordState.solved[selectedId]" class="green--text mb-0" role="status">{{ selectedWord.answer }} · solved by {{ crosswordState.solved[selectedId] }}</p>
            <template v-else>
              <input id="crossword-answer" v-model="draft" class="answer-input" :maxlength="selectedWord.answer.length" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Your answer" :disabled="gameLoading || gameSaving" />
              <v-btn type="submit" block color="cyan" class="black--text text-none mt-3" :disabled="gameLoading || gameSaving || draft.length !== selectedWord.answer.length">{{ gameSaving ? 'Saving…' : 'Check word' }}</v-btn>
            </template>
            <p v-if="feedback" class="caption mt-2 mb-0" role="status">{{ feedback }}</p>
          </form>
        </div>
        <div class="clue-lists">
          <div v-for="direction in ['across', 'down']" :key="direction" class="mb-4">
            <h4 class="text-capitalize mb-2">{{ direction }}</h4>
            <button v-for="word in puzzle.words.filter(item => item.direction === direction)" :key="word.id" type="button" class="clue-button mb-2" :class="{ active: selectedId === word.id }" :aria-pressed="selectedId === word.id" @click="selectWord(word.id)">
              <strong>{{ word.number }}.</strong> {{ word.clue }} <span class="grey--text">({{ word.answer.length }})</span>
              <span v-if="crosswordState.solved[word.id]" class="d-block green--text caption">✓ {{ crosswordState.solved[word.id] }}</span>
            </button>
          </div>
          <div v-if="crosswordState.status === 'complete'" class="completion pa-4" role="status">
            <strong>You solved it together! ♡</strong>
            <v-btn block outlined color="cyan" class="mt-3 text-none" :disabled="gameSaving" @click="nextPuzzle">Next crossword</v-btn>
          </div>
          <p v-else class="caption grey--text">Shared with your partner · {{ currentUser }} is playing</p>
        </div>
      </div>
    </template>
  </section>
</template>

<script>
import gameSession from '@/services/gameSession';
import { CROSSWORDS, newCrossword, solveWord, crosswordCells } from '@/services/crosswordLogic';

export default {
  name: 'CrosswordGame',
  mixins: [gameSession('crossword', 'crosswordState', () => newCrossword())],
  props: { currentUser: { type: String, default: 'Timi' }, roomId: { type: String, default: 'date-night' } },
  data: () => ({ crosswordState: null, selectedId: 'word-0', draft: '', feedback: '' }),
  computed: {
    puzzle() { return CROSSWORDS.find(item => item.id === this.crosswordState?.puzzleId); },
    cells() { return crosswordCells(this.puzzle, this.crosswordState); },
    selectedWord() { return this.puzzle?.words.find(item => item.id === this.selectedId); },
    solvedCount() { return Object.keys(this.crosswordState?.solved || {}).length; },
  },
  watch: {
    'crosswordState.puzzleId'() { this.selectWord('word-0'); },
  },
  methods: {
    selectWord(id) { this.selectedId = id; this.draft = ''; this.feedback = ''; },
    selectCell(cell) {
      const current = cell.words.indexOf(this.selectedId);
      this.selectWord(cell.words[(current + 1) % cell.words.length]);
    },
    async checkAnswer() {
      if (this.gameLoading || this.gameSaving) return;
      const next = solveWord(this.crosswordState, this.selectedId, this.draft, this.currentUser);
      if (!next) { this.feedback = 'Not quite — try again. Use the crossing letters for a hint.'; return; }
      if (await this.saveGameSession(next)) { this.draft = ''; this.feedback = 'Correct! Saved for both of you.'; }
    },
    nextPuzzle() {
      const index = CROSSWORDS.findIndex(item => item.id === this.crosswordState.puzzleId);
      this.saveGameSession(newCrossword(index + 1));
    },
  },
};
</script>

<style scoped>
.crossword-game { max-width: 900px; margin: auto; }
.crossword-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 28px; }
.crossword-grid { display: grid; gap: 3px; max-width: 360px; margin: auto; }
.crossword-cell, .crossword-block { aspect-ratio: 1; min-width: 0; border-radius: 4px; }
.crossword-cell { position: relative; background: #e6edf4; color: #172236; border: 2px solid transparent; font-size: clamp(18px, 3vw, 25px); font-weight: 700; }
.crossword-cell small { position: absolute; top: 1px; left: 3px; font-size: 10px; font-weight: 500; }
.crossword-cell.selected { background: #b5edf2; border-color: #00b8cf; }
.crossword-cell.filled { color: #12604c; }
.crossword-block { background: #0a1020; }
.clue-answer, .completion { border: 1px solid #2a4256; border-radius: 12px; background: #101b2b; }
.answer-input { width: 100%; padding: 12px; color: white; border: 1px solid #5a7d90; border-radius: 8px; text-transform: uppercase; letter-spacing: 6px; }
.clue-button { display: block; text-align: left; width: 100%; padding: 12px; color: #d3dce7; border: 1px solid #273244; border-radius: 8px; line-height: 1.5; }
.clue-button.active { border-color: #00c6db; background: #11323d; }
button:focus-visible, input:focus-visible { outline: 3px solid #ffd54f; outline-offset: 2px; }
@media (max-width: 600px) { .crossword-layout { grid-template-columns: 1fr; gap: 20px; } }
</style>
