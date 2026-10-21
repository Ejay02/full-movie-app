import firebaseSync from "./firebaseSync";

// Firebase omits empty arrays and null board cells. Restore the engine's shape.
export function normalizeGame(type, state) {
  if (!state) return null;
  const result = JSON.parse(JSON.stringify(state));
  const arrayKeys = type === "whot"
    ? ["market", "discard", "timiHand", "ejayHand", "history"]
    : type === "wordDuel" ? ["timiGuesses", "ejayGuesses"] : type === "scrabble" ? ["timiRack", "ejayRack", "bag", "moveHistory"] : [];
  arrayKeys.forEach((key) => { result[key] = Object.values(result[key] || {}); });
  if (type === "crossword") result.solved = result.solved || {};
  if (type === "scrabble") {
    result.board = Array.from({ length: 9 }, (_, r) =>
      Array.from({ length: 9 }, (_, c) => result.board?.[r]?.[c] || null));
  }
  return result;
}

export function gameCacheKey(type, room) {
  return `timi-stream-game:${room}:${type}`;
}

export function readGame(type, room) {
  try { return normalizeGame(type, JSON.parse(localStorage.getItem(gameCacheKey(type, room)))); }
  catch (_) { return null; }
}

export function cacheGame(type, room, state) {
  try { localStorage.setItem(gameCacheKey(type, room), JSON.stringify(state)); }
  catch (_) { /* Cloud persistence is still available when storage is full. */ }
}

export default function gameSession(type, stateKey, initializer) {
  return {
    data: () => ({ gameLoading: true, gameSaving: false, gameError: "", gameSessionStop: null, gameGeneration: 0 }),
    created() { this.openGameSession(); },
    beforeDestroy() { if (this.gameSessionStop) this.gameSessionStop(); },
    watch: {
      roomId() { this.openGameSession(); },
    },
    methods: {
      openGameSession() {
        if (this.gameSessionStop) this.gameSessionStop();
        const room = this.roomId;
        const generation = ++this.gameGeneration;
        this.gameSaving = false;
        this.gameLoading = true;
        this[stateKey] = readGame(type, room);
        const receive = (state) => {
          if (this.roomId !== room || this.gameGeneration !== generation) return;
          const next = normalizeGame(type, state);
          this[stateKey] = next;
          if (next) cacheGame(type, room, next);
          this.gameLoading = false;
          if (type === "scrabble") {
            this.pendingPlacements = [];
            this.selectedRackTile = null;
            this.showGameOverDialog = next?.status === "game_over";
          }
          if (type === "wordDuel") this.currentGuess = "";
        };
        const storageListener = (event) => {
          if (event.key === gameCacheKey(type, room)) receive(readGame(type, room));
        };
        window.addEventListener("storage", storageListener);
        const stop = firebaseSync.subscribeToGame(type, async (remote) => {
          if (this.roomId !== room || this.gameGeneration !== generation) return;
          // Never publish a fresh match before reading the existing cloud match.
          if (remote) receive(remote);
          else {
            const initial = this[stateKey] || (initializer ? initializer.call(this) : null);
            if (initial) {
              try { receive(await firebaseSync.saveGame(type, initial, room, null, true)); }
              catch (error) { this.gameError = error.message; this.gameLoading = false; }
            } else receive(null);
          }
        }, room, (error) => {
          this.gameLoading = false;
          this.gameError = `Cloud unavailable: ${error.message}. Your saved match is kept on this device.`;
          if (!this[stateKey] && initializer) receive(initializer.call(this));
        });
        this.gameSessionStop = () => { stop(); window.removeEventListener("storage", storageListener); };
      },
      async saveGameSession(nextState) {
        if (this.gameLoading || this.gameSaving || !nextState || nextState === this[stateKey]) return;
        const previous = this[stateKey];
        const room = this.roomId;
        const generation = this.gameGeneration;
        this.gameSaving = true;
        this.gameError = "";
        try {
          const saved = await firebaseSync.saveGame(type, nextState, room, previous);
          cacheGame(type, room, normalizeGame(type, saved));
          if (this.roomId !== room || this.gameGeneration !== generation || this._isDestroyed) return false;
          this[stateKey] = normalizeGame(type, saved);
          if (type === "scrabble") this.showGameOverDialog = saved.status === "game_over";
          if (saved.status === "game_over" && saved.winner && previous?.status !== "game_over") {
            firebaseSync.recordGameWin(saved.winner, type, room);
          }
          if (type === "wordDuel") {
            const statusKey = this.currentUser === "Timi" ? "timiStatus" : "ejayStatus";
            if (saved[statusKey] === "won" && previous?.[statusKey] !== "won") {
              firebaseSync.recordGameWin(this.currentUser, type, room);
            }
          }
          return true;
        } catch (error) {
          if (this.roomId === room && this.gameGeneration === generation) this.gameError = error.message;
          return false;
        } finally { if (this.roomId === room && this.gameGeneration === generation) this.gameSaving = false; }
      },
    },
  };
}
