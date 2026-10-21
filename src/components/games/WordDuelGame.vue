<template>
  <div class="word-duel-container pa-3 pa-sm-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-4">
      <div class="d-flex align-center">
        <v-icon color="#00E5FF" class="mr-2">mdi-format-letter-case</v-icon>
        <h3 class="white--text text-h6 font-weight-black mb-0">Word Duel 📝 5-Letter Word Challenge</h3>
      </div>
      <div class="d-flex align-center gap-2">
        <v-btn
          x-small
          outlined
          color="#00E5FF"
          class="text-none font-weight-bold"
          @click="showCreateChallengeDialog = true"
        >
          <v-icon x-small left>mdi-plus</v-icon>
          Set Word for Partner
        </v-btn>
        <v-btn
          x-small
          text
          color="grey lighten-1"
          class="text-none"
          @click="startNewCoopGame"
        >
          Daily Word
        </v-btn>
      </div>
    </div>

    <!-- Active Game Card -->
    <div v-if="duelState" class="word-duel-card pa-4 pa-sm-6 rounded-xl">
      <!-- Challenge Info Banner -->
      <div class="challenge-info-bar text-center mb-4">
        <div class="caption grey--text mb-1">
          Challenge created by <strong :style="{ color: duelState.creator === 'Timi' ? '#FF80AB' : '#80D8FF' }">{{ duelState.creator }}</strong>
        </div>
        <div v-if="duelState.hint" class="hint-badge d-inline-flex align-center px-3 py-1 rounded-pill">
          <v-icon x-small color="#FFD54F" class="mr-1">mdi-lightbulb-on-outline</v-icon>
          <span class="caption white--text">Hint: <em>{{ duelState.hint }}</em></span>
        </div>
      </div>

      <!-- 6-Row Guessing Grid -->
      <div class="word-grid mb-6">
        <div
          v-for="(row, rowIndex) in 6"
          :key="rowIndex"
          class="word-row d-flex justify-center gap-2 mb-2"
        >
          <div
            v-for="(col, colIndex) in 5"
            :key="colIndex"
            class="letter-tile font-weight-black d-flex align-center justify-center rounded-lg"
            :class="getTileClass(rowIndex, colIndex)"
          >
            {{ getTileLetter(rowIndex, colIndex) }}
          </div>
        </div>
      </div>

      <!-- Game Status Banner -->
      <div v-if="isGameOver" class="text-center mb-6">
        <v-icon size="40" :color="hasWon ? '#00E676' : '#FF5252'" class="mb-1">
          {{ hasWon ? 'mdi-trophy-variant' : 'mdi-emoticon-sad-outline' }}
        </v-icon>
        <h4 class="white--text text-subtitle-1 font-weight-black mb-1">
          {{ hasWon ? '🎉 Brilliant! Word Solved! 🏆' : `Game Over! The word was "${duelState.secretWord}"` }}
        </h4>
        <v-btn
          small
          rounded
          depressed
          color="#00E5FF"
          class="text-none font-weight-bold black--text mt-2 px-4"
          @click="showCreateChallengeDialog = true"
        >
          Challenge {{ opponentName }} Back 📝
        </v-btn>
      </div>

      <!-- Virtual Keyboard -->
      <div v-if="!isGameOver" class="virtual-keyboard max-w-500 mx-auto">
        <div
          v-for="(row, rIndex) in keyboardLayout"
          :key="rIndex"
          class="keyboard-row d-flex justify-center gap-1 mb-1"
        >
          <v-btn
            v-for="key in row"
            :key="key"
            small
            depressed
            :color="getKeyColor(key)"
            :class="[
              key.length > 1 ? 'px-2 font-weight-bold' : 'px-1',
              'key-btn white--text font-weight-bold'
            ]"
            @click="handleKeyPress(key)"
          >
            <v-icon v-if="key === 'BACK'" small>mdi-backspace-outline</v-icon>
            <span v-else>{{ key }}</span>
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Create Custom Word Dialog -->
    <v-dialog v-model="showCreateChallengeDialog" max-width="450">
      <v-card class="challenge-dialog-card pa-6" dark>
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="d-flex align-center">
            <v-icon color="#00E5FF" class="mr-2">mdi-lead-pencil</v-icon>
            <h3 class="white--text text-h6 font-weight-bold mb-0">Challenge {{ opponentName }}</h3>
          </div>
          <v-btn icon small dark @click="showCreateChallengeDialog = false">
            <v-icon small>mdi-close</v-icon>
          </v-btn>
        </div>
        <p class="grey--text text-caption mb-4">
          Pick a secret 5-letter word for {{ opponentName }} to guess on their screen!
        </p>

        <v-text-field
          v-model="customWordInput"
          label="Secret 5-Letter Word"
          outlined
          dense
          maxlength="5"
          counter="5"
          dark
          color="#00E5FF"
          class="caption-input text-uppercase font-weight-bold mb-2"
        ></v-text-field>

        <v-text-field
          v-model="customHintInput"
          label="Optional Sweet/Playful Hint"
          outlined
          dense
          dark
          color="#00E5FF"
          placeholder="e.g. Something we always share on date night..."
          class="caption-input mb-4"
        ></v-text-field>

        <div class="d-flex justify-end gap-2">
          <v-btn text color="grey" class="text-none font-weight-medium" @click="showCreateChallengeDialog = false">
            Cancel
          </v-btn>
          <v-btn
            depressed
            color="#00E5FF"
            class="text-none font-weight-bold black--text px-4"
            :disabled="!isCustomWordValid"
            @click="submitCustomChallenge"
          >
            Send Challenge 🚀
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import firebaseSync from "@/services/firebaseSync";

const DEFAULT_COUPLE_WORDS = [
  { word: "HEART", hint: "What beats faster when I see you" },
  { word: "MOVIE", hint: "Our favorite way to spend the evening" },
  { word: "SNACK", hint: "Timi's essential food group" },
  { word: "SWEET", hint: "How you make every day feel" },
  { word: "SMILE", hint: "The first thing that caught my eye" },
  { word: "NIGHT", hint: "Date night is our favorite time" },
  { word: "CHEER", hint: "Pop the champagne!" },
  { word: "DANCE", hint: "Slow songs in the living room" },
  { word: "FLAME", hint: "Still burning bright" },
  { word: "MAGIC", hint: "What happens when we are together" },
];

export default {
  name: "WordDuelGame",
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
      duelState: null,
      firebaseUnsub: null,
      broadcastChannel: null,
      currentGuess: "",
      showCreateChallengeDialog: false,
      customWordInput: "",
      customHintInput: "",
      keyboardLayout: [
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
        ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"],
      ],
    };
  },
  computed: {
    opponentName() {
      return this.currentUser === "Timi" ? "Ejay" : "Timi";
    },
    userGuesses() {
      if (!this.duelState) return [];
      const key = this.currentUser === "Timi" ? "timiGuesses" : "ejayGuesses";
      return this.duelState[key] || [];
    },
    isGameOver() {
      if (!this.duelState) return false;
      const key = this.currentUser === "Timi" ? "timiStatus" : "ejayStatus";
      return this.duelState[key] === "won" || this.duelState[key] === "lost";
    },
    hasWon() {
      if (!this.duelState) return false;
      const key = this.currentUser === "Timi" ? "timiStatus" : "ejayStatus";
      return this.duelState[key] === "won";
    },
    isCustomWordValid() {
      return (this.customWordInput || "").trim().length === 5;
    },
  },
  created() {
    this.startNewCoopGame();
    this.initSync();
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.handleKeyDown);
    }
  },
  beforeDestroy() {
    if (typeof this.firebaseUnsub === "function") {
      this.firebaseUnsub();
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleKeyDown);
    }
  },
  methods: {
    initSync() {
      this.firebaseUnsub = firebaseSync.subscribeToWordDuel((remoteState) => {
        if (remoteState) {
          this.duelState = remoteState;
        } else {
          this.startNewCoopGame();
        }
      }, this.roomId);

      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          this.broadcastChannel = new BroadcastChannel("word-duel-sync");
          this.broadcastChannel.onmessage = (event) => {
            if (event.data && event.data.roomId === this.roomId) {
              this.duelState = event.data.state;
            }
          };
        } catch (e) {
          // ignore
        }
      }
    },
    syncState(nextState) {
      this.duelState = nextState;
      firebaseSync.updateWordDuelState(nextState, this.roomId);
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          roomId: this.roomId,
          state: nextState,
        });
      }
    },
    startNewCoopGame() {
      const pick = DEFAULT_COUPLE_WORDS[Math.floor(Math.random() * DEFAULT_COUPLE_WORDS.length)];
      const newState = {
        secretWord: pick.word,
        hint: pick.hint,
        creator: "Timi & Ejay Date Night",
        timiGuesses: [],
        ejayGuesses: [],
        timiStatus: "playing",
        ejayStatus: "playing",
        updatedAt: Date.now(),
      };
      this.syncState(newState);
      this.currentGuess = "";
    },
    submitCustomChallenge() {
      const cleanWord = (this.customWordInput || "").trim().toUpperCase();
      if (cleanWord.length !== 5) return;

      const newState = {
        secretWord: cleanWord,
        hint: (this.customHintInput || "").trim(),
        creator: this.currentUser,
        timiGuesses: [],
        ejayGuesses: [],
        timiStatus: "playing",
        ejayStatus: "playing",
        updatedAt: Date.now(),
      };
      this.syncState(newState);
      this.showCreateChallengeDialog = false;
      this.customWordInput = "";
      this.customHintInput = "";
      this.currentGuess = "";
    },
    handleKeyDown(e) {
      if (this.isGameOver) return;
      if (e.key === "Enter") {
        this.submitGuess();
      } else if (e.key === "Backspace") {
        this.currentGuess = this.currentGuess.slice(0, -1);
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        if (this.currentGuess.length < 5) {
          this.currentGuess += e.key.toUpperCase();
        }
      }
    },
    handleKeyPress(key) {
      if (this.isGameOver) return;
      if (key === "ENTER") {
        this.submitGuess();
      } else if (key === "BACK") {
        this.currentGuess = this.currentGuess.slice(0, -1);
      } else {
        if (this.currentGuess.length < 5) {
          this.currentGuess += key;
        }
      }
    },
    submitGuess() {
      if (this.currentGuess.length !== 5) return;
      if (this.userGuesses.length >= 6) return;

      const guess = this.currentGuess.toUpperCase();
      const nextState = JSON.parse(JSON.stringify(this.duelState));
      const guessesKey = this.currentUser === "Timi" ? "timiGuesses" : "ejayGuesses";
      const statusKey = this.currentUser === "Timi" ? "timiStatus" : "ejayStatus";

      nextState[guessesKey].push(guess);

      if (guess === nextState.secretWord) {
        nextState[statusKey] = "won";
        firebaseSync.recordGameWin(this.currentUser, "wordDuel", this.roomId);
      } else if (nextState[guessesKey].length >= 6) {
        nextState[statusKey] = "lost";
      }

      this.currentGuess = "";
      this.syncState(nextState);
    },
    getTileLetter(rowIndex, colIndex) {
      if (rowIndex < this.userGuesses.length) {
        return this.userGuesses[rowIndex][colIndex] || "";
      }
      if (rowIndex === this.userGuesses.length) {
        return this.currentGuess[colIndex] || "";
      }
      return "";
    },
    getTileClass(rowIndex, colIndex) {
      if (rowIndex < this.userGuesses.length) {
        const guess = this.userGuesses[rowIndex];
        const letter = guess[colIndex];
        const secret = this.duelState.secretWord;

        if (secret[colIndex] === letter) {
          return "tile-correct"; // Green
        }
        if (secret.includes(letter)) {
          return "tile-present"; // Yellow
        }
        return "tile-absent"; // Grey
      }
      if (rowIndex === this.userGuesses.length && this.currentGuess[colIndex]) {
        return "tile-active";
      }
      return "tile-empty";
    },
    getKeyColor(key) {
      if (key === "ENTER" || key === "BACK") return "rgba(255, 255, 255, 0.15)";
      const secret = this.duelState?.secretWord || "";

      let isCorrect = false;
      let isPresent = false;
      let isAbsent = false;

      this.userGuesses.forEach((guess) => {
        for (let i = 0; i < 5; i++) {
          if (guess[i] === key) {
            if (secret[i] === key) {
              isCorrect = true;
            } else if (secret.includes(key)) {
              isPresent = true;
            } else {
              isAbsent = true;
            }
          }
        }
      });

      if (isCorrect) return "#00E676";
      if (isPresent) return "#FFD600";
      if (isAbsent) return "rgba(255, 255, 255, 0.08)";
      return "rgba(255, 255, 255, 0.2)";
    },
  },
};
</script>

<style scoped>
.word-duel-container {
  max-width: 650px;
  margin: 0 auto;
}

.word-duel-card {
  background: radial-gradient(circle at center, rgba(13, 25, 45, 0.85) 0%, rgba(8, 12, 22, 0.95) 100%);
  border: 1px solid rgba(0, 229, 255, 0.25);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
}

.hint-badge {
  background: rgba(255, 213, 79, 0.15);
  border: 1px solid rgba(255, 213, 79, 0.4);
}

/* 5x6 Wordle Tiles */
.letter-tile {
  width: 52px;
  height: 52px;
  font-size: 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.15);
  transition: all 0.2s ease;
  user-select: none;
}

.tile-empty {
  background: rgba(255, 255, 255, 0.02);
  color: #fff;
}

.tile-active {
  border-color: #00E5FF !important;
  background: rgba(0, 229, 255, 0.08);
  color: #fff;
  transform: scale(1.05);
}

.tile-correct {
  background: #00E676 !important;
  border-color: #00E676 !important;
  color: #000 !important;
}

.tile-present {
  background: #FFD600 !important;
  border-color: #FFD600 !important;
  color: #000 !important;
}

.tile-absent {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  color: #888 !important;
}

/* Virtual Keyboard */
.virtual-keyboard {
  user-select: none;
}

.key-btn {
  min-width: 32px !important;
  height: 42px !important;
  font-size: 0.85rem;
}

.max-w-500 {
  max-width: 500px;
}

.challenge-dialog-card {
  background: #0c1220 !important;
  border-radius: 20px !important;
  border: 1px solid rgba(0, 229, 255, 0.35) !important;
}
</style>
