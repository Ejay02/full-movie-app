<template>
  <div class="scrabble-container pa-2 pa-sm-4">
    <v-alert v-if="gameError" dense outlined type="warning" role="alert">{{ gameError }}</v-alert>
    <div v-if="gameLoading || gameSaving" class="caption cyan--text mb-3" role="status">{{ gameLoading ? 'Restoring your match…' : 'Saving move…' }}</div>
    <!-- Header: Match Title, Player Switcher & Turn Indicator -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-3">
      <div class="d-flex align-center">
        <v-icon color="#FFD54F" class="mr-2">mdi-grid</v-icon>
        <h3 class="white--text text-subtitle-1 text-sm-h6 font-weight-black mb-0">
          Words with Friends 🔠
        </h3>
      </div>

      <!-- Live Scores -->
      <div class="d-flex align-center gap-2">
        <v-chip small color="rgba(224, 64, 251, 0.2)" class="font-weight-black" style="color: #E040FB;">
          <v-icon x-small left color="#E040FB">mdi-crown</v-icon>
          Timi: {{ gameState ? gameState.timiScore : 0 }} pts
        </v-chip>
        <v-chip small color="rgba(0, 229, 255, 0.2)" class="font-weight-black" style="color: #80D8FF;">
          <v-icon x-small left color="#00E5FF">mdi-lightning-bolt</v-icon>
          Ejay: {{ gameState ? gameState.ejayScore : 0 }} pts
        </v-chip>

        <!-- Couch / Single Screen Player Switcher -->
        <div class="d-flex align-center ml-2">
          <span class="caption grey--text mr-1 hidden-xs-only">Playing as:</span>
          <v-btn-toggle v-model="activePlayer" mandatory dense class="player-couch-toggle">
            <v-btn value="Timi" x-small class="text-none font-weight-black">
              👑 Timi
            </v-btn>
            <v-btn value="Ejay" x-small class="text-none font-weight-black">
              ⚡ Ejay
            </v-btn>
          </v-btn-toggle>
        </div>

        <v-btn x-small outlined color="#FFD54F" class="text-none font-weight-bold ml-1" :disabled="gameLoading || gameSaving" @click="resetGame">
          <v-icon x-small left>mdi-restart</v-icon>
          New Game
        </v-btn>
      </div>
    </div>

    <!-- Turn Banner & Helper Notice -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-3 px-1">
      <div class="d-flex align-center gap-2">
        <v-chip
          small
          :color="isCurrentTurn ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 215, 0, 0.15)'"
          :class="isCurrentTurn ? 'green--text text--accent-3' : 'amber--text text--lighten-2'"
          class="font-weight-black"
        >
          <v-icon left x-small :color="isCurrentTurn ? '#00E676' : '#FFD54F'">
            {{ isCurrentTurn ? 'mdi-account-star' : 'mdi-clock-outline' }}
          </v-icon>
          {{ isCurrentTurn ? `Your Turn (${activePlayer})!` : `${gameState ? gameState.currentTurn : ''}'s Turn` }}
        </v-chip>
        <span class="caption grey--text">
          💡 <em>Drag tiles onto the board or tap to place!</em>
        </span>
      </div>

      <div v-if="gameState && gameState.lastWordPlayed" class="caption grey--text">
        Last: <strong :style="{ color: gameState.lastWordPlayed.player === 'Timi' ? '#E040FB' : '#00E5FF' }">{{ gameState.lastWordPlayed.player }}</strong>
        scored <strong>+{{ gameState.lastWordPlayed.score }} pts</strong> with <em>"{{ gameState.lastWordPlayed.word }}"</em>
      </div>
    </div>

    <!-- Active Game Content -->
    <div v-if="gameState" class="scrabble-card pa-3 pa-sm-5 rounded-xl">
      <!-- 9x9 Scrabble Grid with Drag & Drop + Tap to Place -->
      <div class="board-wrapper d-flex justify-center mb-4">
        <div class="scrabble-grid">
          <div v-for="(row, r) in 9" :key="r" class="scrabble-row d-flex">
            <div
              v-for="(col, c) in 9"
              :key="c"
              class="scrabble-cell cursor-pointer d-flex flex-column align-center justify-center"
              :class="[
                getCellClass(r, c),
                {
                  'cell-drag-hover': dragHoverCell === `${r}-${c}`,
                  'cell-target-glow': selectedRackTile && !getCellTile(r, c),
                }
              ]"
              @dragover.prevent="handleDragOver"
              @dragenter.prevent="dragHoverCell = `${r}-${c}`"
              @dragleave="handleDragLeave(r, c)"
              @drop="handleDrop($event, r, c)"
              @click="handleCellClick(r, c)"
            >
              <!-- Cell Multiplier Label (if no tile placed) -->
              <span v-if="!getCellTile(r, c)" class="cell-multiplier-tag">
                {{ getMultiplierLabel(r, c) }}
              </span>

              <!-- Placed Tile -->
              <template v-else>
                <div
                  class="board-tile"
                  :class="{
                    'pending-tile': isTilePending(r, c),
                    'permanent-tile': !isTilePending(r, c),
                  }"
                  title="Click to recall tile back to rack"
                >
                  <span class="board-tile-letter">{{ getCellTile(r, c).letter }}</span>
                  <span class="board-tile-score">{{ getCellTile(r, c).score }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Turn Action Controls & Pending Score Preview -->
      <div class="action-bar d-flex align-center justify-space-between flex-wrap gap-2 mb-3 px-2">
        <div class="d-flex align-center gap-2">
          <span class="caption grey--text">Bag: <strong>{{ (gameState.bag || []).length }}</strong> tiles</span>
          <span v-if="pendingPlacements.length" class="caption amber--text font-weight-black ml-2 word-preview-badge pa-1 px-2 rounded">
            Word: "{{ pendingWord }}" (Est. +{{ pendingScore }} pts)
          </span>
        </div>

        <div class="d-flex align-center gap-2">
          <v-btn
            small
            depressed
            color="#00E676"
            class="text-none font-weight-black black--text px-4 play-word-btn"
            :disabled="!isCurrentTurn || pendingPlacements.length === 0"
            @click="submitWord"
          >
            <v-icon left small>mdi-check-bold</v-icon>
            Play Word
          </v-btn>
          <v-btn
            small
            outlined
            color="grey lighten-1"
            class="text-none"
            :disabled="pendingPlacements.length === 0"
            @click="recallPendingTiles"
          >
            <v-icon left small>mdi-undo</v-icon>
            Recall
          </v-btn>
          <v-btn
            small
            text
            color="grey"
            class="text-none"
            @click="passTurn"
            :disabled="!isCurrentTurn"
          >
            <v-icon left small>mdi-skip-next</v-icon>
            Pass Turn
          </v-btn>
        </div>
      </div>

      <!-- Player Rack (7 Wooden Tiles) with HTML5 Drag & Drop -->
      <div class="rack-container text-center pt-2">
        <div class="caption grey--text mb-2 font-weight-bold d-flex align-center justify-center gap-2">
          <span>Letter Rack for <strong>{{ activePlayer }}</strong>:</span>
          <v-chip x-small color="rgba(255, 255, 255, 0.1)" class="caption">
            {{ currentRack.length }} tiles remaining
          </v-chip>
        </div>

        <div class="rack-shelf d-inline-flex align-center justify-center pa-2 rounded-xl">
          <div
            v-for="(tile, idx) in currentRack"
            :key="tile.id || idx"
            draggable="true"
            class="rack-tile cursor-grab d-flex flex-column align-center justify-center mx-1"
            :class="{
              'rack-tile-selected': selectedRackTile && selectedRackTile.id === tile.id,
              'rack-tile-dragging': draggedTile && draggedTile.id === tile.id,
            }"
            @dragstart="handleDragStart($event, tile)"
            @dragend="handleDragEnd"
            @click="selectRackTile(tile)"
          >
            <span class="rack-letter">{{ tile.letter }}</span>
            <span class="rack-score">{{ tile.score }}</span>
          </div>
        </div>

        <div class="mt-2 d-flex justify-center align-center gap-2">
          <v-btn x-small text color="grey lighten-1" class="text-none" @click="shuffleRack">
            <v-icon x-small left>mdi-shuffle</v-icon>
            Shuffle Rack
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Game Over Celebration Modal -->
    <v-dialog v-model="showGameOverDialog" max-width="400" persistent>
      <v-card class="pa-6 text-center" dark style="background: #111827; border: 2px solid #FFD54F;">
        <v-icon size="64" color="#FFD54F" class="mb-2">mdi-trophy-variant</v-icon>
        <h2 class="white--text text-h5 font-weight-black mb-1">
          🎉 {{ gameState ? gameState.winner : 'Match' }} Won! 🏆
        </h2>
        <p class="grey--text text-body-2 mb-4">
          Final Score: Timi {{ gameState ? gameState.timiScore : 0 }} - Ejay {{ gameState ? gameState.ejayScore : 0 }}
        </p>
        <v-btn
          large
          rounded
          depressed
          color="#FFD54F"
          class="black--text font-weight-black px-6"
          :disabled="gameLoading || gameSaving" @click="resetGame"
        >
          Play Rematch 🔠
        </v-btn>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import gameSession from "@/services/gameSession";
import scrabbleGameLogic, { BOARD_MULTIPLIERS } from "@/services/scrabbleGameLogic";

export default {
  mixins: [gameSession("scrabble", "gameState", function () { return scrabbleGameLogic.initGame(this.currentUser); })],
  name: "ScrabbleGame",
  props: {
    currentUser: {
      type: String,
      default: "Timi",
    },
    roomId: {
      type: String,
      default: "date-night",
    },
  },
  data() {
    return {
      activePlayer: this.currentUser || "Timi",
      gameState: null,
      firebaseUnsub: null,
      broadcastChannel: null,
      selectedRackTile: null,
      draggedTile: null,
      dragHoverCell: null,
      pendingPlacements: [], // [{ row, col, tile }]
      showGameOverDialog: false,
    };
  },
  computed: {
    isCurrentTurn() {
      return !this.gameLoading && !this.gameSaving && this.gameState?.status === "playing" && this.gameState.currentTurn === this.activePlayer;
    },
    rawRack() {
      if (!this.gameState) return [];
      return this.activePlayer === "Timi"
        ? this.gameState.timiRack || []
        : this.gameState.ejayRack || [];
    },
    currentRack() {
      // Exclude tiles currently placed on the board pending submission
      const pendingIds = new Set(this.pendingPlacements.map((p) => p.tile.id));
      return this.rawRack.filter((t) => !pendingIds.has(t.id));
    },
    pendingWord() {
      if (!this.pendingPlacements.length) return "";
      const isHorizontal = this.pendingPlacements.every(
        (p) => p.row === this.pendingPlacements[0].row
      );
      const sorted = [...this.pendingPlacements].sort((a, b) =>
        isHorizontal ? a.col - b.col : a.row - b.row
      );
      return sorted.map((p) => p.tile.letter).join("");
    },
    pendingScore() {
      if (!this.pendingPlacements.length || !this.gameState) return 0;
      return scrabbleGameLogic.calculatePlacementScore(this.pendingPlacements);
    },
  },
  watch: {
    currentUser(newVal) {
      if (newVal) this.activePlayer = newVal;
      this.pendingPlacements = [];
    },
    activePlayer() {
      this.pendingPlacements = [];
      // Clear pending selections when switching couch profile
      this.selectedRackTile = null;
      if (this.currentRack.length > 0) {
        this.selectedRackTile = this.currentRack[0];
      }
    },
  },
  created() {

  },
  mounted() {
    if (this.currentRack.length > 0) {
      this.selectedRackTile = this.currentRack[0];
    }
  },
  beforeDestroy() {
    if (typeof this.firebaseUnsub === "function") {
      this.firebaseUnsub();
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
  },
  methods: {
    syncState(nextState) {
      return this.saveGameSession(nextState);
    },
    startNewMatch() {
      const newState = scrabbleGameLogic.initGame(this.activePlayer);
      this.pendingPlacements = [];
      this.selectedRackTile = null;
      this.showGameOverDialog = false;
      this.syncState(newState);
      if (this.currentRack.length > 0) {
        this.selectedRackTile = this.currentRack[0];
      }
    },
    resetGame() {
      this.startNewMatch();
    },
    getMultiplierLabel(r, c) {
      const mult = BOARD_MULTIPLIERS[r][c];
      if (mult === "ST") return "★";
      return mult || "";
    },
    getCellClass(r, c) {
      const mult = BOARD_MULTIPLIERS[r][c];
      return {
        "cell-tw": mult === "TW",
        "cell-dw": mult === "DW",
        "cell-tl": mult === "TL",
        "cell-dl": mult === "DL",
        "cell-star": mult === "ST",
      };
    },
    getCellTile(r, c) {
      // Check pending tiles first
      const pending = this.pendingPlacements.find((p) => p.row === r && p.col === c);
      if (pending) return pending.tile;
      // Check permanent board
      if (this.gameState && this.gameState.board && this.gameState.board[r]) {
        return this.gameState.board[r][c];
      }
      return null;
    },
    isTilePending(r, c) {
      return this.pendingPlacements.some((p) => p.row === r && p.col === c);
    },

    // --- Drag and Drop Handlers ---
    handleDragStart(e, tile) {
      this.draggedTile = tile;
      this.selectedRackTile = tile;
      if (e.dataTransfer) {
        e.dataTransfer.setData("text/plain", JSON.stringify(tile));
        e.dataTransfer.effectAllowed = "move";
      }
    },
    handleDragEnd() {
      this.dragHoverCell = null;
      this.draggedTile = null;
    },
    handleDragOver(e) {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
    },
    handleDragLeave(r, c) {
      if (this.dragHoverCell === `${r}-${c}`) {
        this.dragHoverCell = null;
      }
    },
    handleDrop(e, r, c) {
      e.preventDefault();
      this.dragHoverCell = null;

      let tile = this.draggedTile;
      if (!tile && e.dataTransfer) {
        try {
          const raw = e.dataTransfer.getData("text/plain");
          if (raw) tile = JSON.parse(raw);
        } catch (err) {
          // ignore
        }
      }
      if (!tile) tile = this.selectedRackTile;
      if (!tile) return;

      this.placeTileAt(r, c, tile);
      this.draggedTile = null;
      this.selectedRackTile = null;
    },

    // --- Tap-to-Place Handlers ---
    selectRackTile(tile) {
      if (this.selectedRackTile && this.selectedRackTile.id === tile.id) {
        this.selectedRackTile = null;
      } else {
        this.selectedRackTile = tile;
      }
    },
    handleCellClick(r, c) {
      // 1. If clicked on a pending tile on the board, recall it immediately back to rack
      const pendingIndex = this.pendingPlacements.findIndex(
        (p) => p.row === r && p.col === c
      );
      if (pendingIndex !== -1) {
        this.pendingPlacements.splice(pendingIndex, 1);
        return;
      }

      // 2. If cell already occupied permanently, do nothing
      if (this.gameState && this.gameState.board && this.gameState.board[r][c] !== null) {
        return;
      }

      // 3. If a rack tile is selected, place it right here!
      if (this.selectedRackTile) {
        this.placeTileAt(r, c, this.selectedRackTile);
        // Auto-select next available tile in rack for effortless rapid placement
        const remaining = this.currentRack.filter((t) => t.id !== this.selectedRackTile.id);
        this.selectedRackTile = remaining.length ? remaining[0] : null;
        return;
      }

      // 4. If no rack tile selected, grab the first tile from rack and place it
      if (this.currentRack.length > 0) {
        this.placeTileAt(r, c, this.currentRack[0]);
        const remaining = this.currentRack.filter((t) => t.id !== this.currentRack[0].id);
        this.selectedRackTile = remaining.length ? remaining[0] : null;
      }
    },
    placeTileAt(r, c, tile) {
      if (!tile) return;
      // Remove any existing pending placement on this cell
      const existingIdx = this.pendingPlacements.findIndex((p) => p.row === r && p.col === c);
      if (existingIdx !== -1) {
        this.pendingPlacements.splice(existingIdx, 1);
      }
      // Remove tile if it was placed elsewhere
      const tileIdx = this.pendingPlacements.findIndex((p) => p.tile.id === tile.id);
      if (tileIdx !== -1) {
        this.pendingPlacements.splice(tileIdx, 1);
      }
      this.pendingPlacements.push({
        row: r,
        col: c,
        tile,
      });
    },
    recallPendingTiles() {
      this.pendingPlacements = [];
      if (this.currentRack.length > 0) {
        this.selectedRackTile = this.currentRack[0];
      }
    },
    shuffleRack() {
      if (!this.gameState) return;
      const rackKey = this.activePlayer === "Timi" ? "timiRack" : "ejayRack";
      const rack = [...this.gameState[rackKey]];
      for (let i = rack.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rack[i], rack[j]] = [rack[j], rack[i]];
      }
      this.gameState[rackKey] = rack;
    },
    submitWord() {
      if (!this.isCurrentTurn || !this.pendingPlacements.length) return;
      try {
        const nextState = scrabbleGameLogic.playTurn(
          this.gameState,
          this.activePlayer,
          this.pendingPlacements
        );
        this.pendingPlacements = [];
        this.selectedRackTile = null;
        this.syncState(nextState);
      } catch (err) {
        alert(err.message || "Invalid word placement!");
      }
    },
    passTurn() {
      if (!this.isCurrentTurn) return;
      this.recallPendingTiles();
      const nextState = scrabbleGameLogic.passTurn(
        this.gameState,
        this.activePlayer
      );
      this.syncState(nextState);
    },
  },
};
</script>

<style scoped>
.scrabble-card {
  background: radial-gradient(circle at center, rgba(30, 25, 45, 0.95) 0%, rgba(12, 14, 24, 0.98) 100%);
  border: 1px solid rgba(255, 213, 79, 0.35);
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.6);
}

.word-preview-badge {
  background: rgba(255, 213, 79, 0.15);
  border: 1px solid rgba(255, 213, 79, 0.4);
}

.player-couch-toggle {
  background: rgba(255, 255, 255, 0.08) !important;
  border-radius: 8px;
}

/* 9x9 Board Layout */
.scrabble-grid {
  display: inline-block;
  background: #181528;
  padding: 8px;
  border-radius: 14px;
  border: 2px solid rgba(255, 213, 79, 0.45);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
}

.scrabble-cell {
  width: 40px;
  height: 40px;
  margin: 1.5px;
  border-radius: 5px;
  background: #25283d;
  position: relative;
  user-select: none;
  transition: all 0.15s ease;
}

@media (max-width: 600px) {
  .scrabble-cell {
    width: 33px;
    height: 33px;
    margin: 1px;
  }
}

.scrabble-cell:hover {
  filter: brightness(1.2);
  transform: scale(1.04);
}

.cell-target-glow {
  box-shadow: inset 0 0 8px rgba(0, 229, 255, 0.45);
  border: 1px dashed rgba(0, 229, 255, 0.6) !important;
}

.cell-drag-hover {
  background: rgba(0, 229, 255, 0.35) !important;
  border: 2px solid #00E5FF !important;
  transform: scale(1.08) !important;
}

/* Multiplier Colors */
.cell-tw {
  background: #d32f2f !important;
}
.cell-dw {
  background: #c2185b !important;
}
.cell-tl {
  background: #1976d2 !important;
}
.cell-dl {
  background: #0288d1 !important;
}
.cell-star {
  background: #f57f17 !important;
}

.cell-multiplier-tag {
  font-size: 10px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
}

/* Placed Tiles */
.board-tile {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 2px 4px rgba(0, 0, 0, 0.4);
  cursor: pointer;
}

.pending-tile {
  background: linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%) !important;
  border: 2px solid #00E676;
  animation: pendingPulse 1.2s infinite ease-in-out;
}

.board-tile-letter {
  font-size: 17px;
  font-weight: 900;
  color: #1f2937;
  line-height: 1;
}

.board-tile-score {
  font-size: 8px;
  font-weight: 900;
  color: #4b5563;
  position: absolute;
  bottom: 2px;
  right: 3px;
}

/* Player Rack (Wooden Shelf) */
.rack-shelf {
  background: linear-gradient(180deg, #78350f 0%, #451a03 100%);
  border: 2px solid #92400e;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
}

.rack-tile {
  width: 44px;
  height: 48px;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-radius: 6px;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
}

.rack-tile:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.6);
}

.rack-tile-selected {
  transform: translateY(-8px) scale(1.1) !important;
  border: 2px solid #00E5FF !important;
  box-shadow: 0 0 16px rgba(0, 229, 255, 0.9) !important;
}

.rack-tile-dragging {
  opacity: 0.4;
  transform: scale(0.9);
}

.rack-letter {
  font-size: 22px;
  font-weight: 900;
  color: #1e1b2e;
}

.rack-score {
  font-size: 9px;
  font-weight: 900;
  color: #6b7280;
  position: absolute;
  bottom: 2px;
  right: 4px;
}

@keyframes pendingPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}
</style>
