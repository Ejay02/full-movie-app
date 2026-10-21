import { initializeApp, getApps } from "firebase/app";
import {
  getDatabase,
  ref,
  get,
  onValue,
  set,
  push,
  update,
  remove,
} from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY || "AIzaSyCVZJIVyKopBk6NWr2Rmnw_pahGQGShy-k",
  authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN || "ejs-db.firebaseapp.com",
  databaseURL: process.env.VUE_APP_FIREBASE_DATABASE_URL || "https://ejs-db.firebaseio.com",
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID || "ejs-db",
  storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET || "ejs-db.firebasestorage.app",
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID || "134053432224",
  appId: process.env.VUE_APP_FIREBASE_APP_ID || "1:134053432224:web:ff9a84c28ef2acbb50f2c5",
  measurementId: process.env.VUE_APP_FIREBASE_MEASUREMENT_ID || "G-J7KMZKCQ19",
};

let app = null;
let db = null;
let isConfigured = false;

if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
  try {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    db = getDatabase(app);
    isConfigured = true;
    console.log("[FirebaseSync] Connected to Realtime Database:", firebaseConfig.databaseURL);
  } catch (error) {
    console.warn("[FirebaseSync] Initialization error:", error);
  }
} else {
  console.info("[FirebaseSync] Missing Firebase credentials; operating in local storage mode.");
}

export const firebaseSync = {
  isConfigured() {
    return isConfigured && db !== null;
  },

  /* -------------------------------------------------------------
     1. SHARED QUEUE (Our Queue)
     Path: movie_app/rooms/{roomId}/queue/{itemId}
  ------------------------------------------------------------- */
  subscribeToQueue(callback, roomId = "date-night") {
    if (!this.isConfigured()) return () => {};
    const queueRef = ref(db, `movie_app/rooms/${roomId}/queue`);
    return onValue(queueRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }
      // Convert map object { [id]: item } to sorted array (latest first)
      const list = Object.values(data).sort(
        (a, b) => (b.savedAt || 0) - (a.savedAt || 0)
      );
      callback(list);
    });
  },

  async addToQueue(item, roomId = "date-night") {
    if (!this.isConfigured() || !item || !item.id) return;
    try {
      const cleanItem = JSON.parse(JSON.stringify(item));
      const itemRef = ref(db, `movie_app/rooms/${roomId}/queue/${item.id}`);
      await set(itemRef, cleanItem);
    } catch (err) {
      console.warn("[FirebaseSync] addToQueue error:", err);
    }
  },

  async removeFromQueue(itemId, roomId = "date-night") {
    if (!this.isConfigured() || !itemId) return;
    try {
      const itemRef = ref(db, `movie_app/rooms/${roomId}/queue/${itemId}`);
      await remove(itemRef);
    } catch (err) {
      console.warn("[FirebaseSync] removeFromQueue error:", err);
    }
  },

  async updateQueueNote(itemId, note, user, roomId = "date-night") {
    if (!this.isConfigured() || !itemId) return;
    try {
      const itemRef = ref(db, `movie_app/rooms/${roomId}/queue/${itemId}`);
      await update(itemRef, {
        note: note || "",
        addedBy: user || "Timi",
      });
    } catch (err) {
      console.warn("[FirebaseSync] updateQueueNote error:", err);
    }
  },

  async addQueueNote(itemId, noteObj, roomId = "date-night") {
    if (!this.isConfigured() || !itemId || !noteObj) return;
    try {
      const cleanNote = JSON.parse(JSON.stringify(noteObj));
      const noteRef = ref(db, `movie_app/rooms/${roomId}/queue/${itemId}/notes/${cleanNote.id}`);
      await set(noteRef, cleanNote);
    } catch (err) {
      console.warn("[FirebaseSync] addQueueNote error:", err);
    }
  },

  async removeQueueNote(itemId, noteId, roomId = "date-night") {
    if (!this.isConfigured() || !itemId || !noteId) return;
    try {
      const noteRef = ref(db, `movie_app/rooms/${roomId}/queue/${itemId}/notes/${noteId}`);
      await remove(noteRef);
    } catch (err) {
      console.warn("[FirebaseSync] removeQueueNote error:", err);
    }
  },

  /* -------------------------------------------------------------
     2. LIVE CHAT & REACTIONS
     Path: movie_app/rooms/{roomId}/chat
     Path: movie_app/rooms/{roomId}/lastReaction
  ------------------------------------------------------------- */
  subscribeToChat(callback, roomId = "date-night") {
    if (!this.isConfigured()) return () => {};
    const chatRef = ref(db, `movie_app/rooms/${roomId}/chat`);
    return onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }
      const messages = Object.values(data).sort(
        (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
      );
      callback(messages);
    });
  },

  async sendChatMessage(messageObj, roomId = "date-night") {
    if (!this.isConfigured() || !messageObj) return;
    try {
      const chatRef = ref(db, `movie_app/rooms/${roomId}/chat`);
      await push(chatRef, messageObj);
    } catch (err) {
      console.warn("[FirebaseSync] sendChatMessage error:", err);
    }
  },

  subscribeToReaction(callback, roomId = "date-night") {
    if (!this.isConfigured()) return () => {};
    const reactionRef = ref(db, `movie_app/rooms/${roomId}/lastReaction`);
    return onValue(reactionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });
  },

  async sendReaction(symbol, sender, roomId = "date-night") {
    if (!this.isConfigured() || !symbol) return;
    try {
      const reactionRef = ref(db, `movie_app/rooms/${roomId}/lastReaction`);
      await set(reactionRef, {
        symbol,
        sender,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn("[FirebaseSync] sendReaction error:", err);
    }
  },

  /* -------------------------------------------------------------
     3. WATCH TOGETHER ACTIVE PLAYER
     Path: movie_app/rooms/{roomId}/activeMedia
  ------------------------------------------------------------- */
  subscribeToActiveMedia(callback, roomId = "date-night") {
    if (!this.isConfigured()) return () => {};
    const mediaRef = ref(db, `movie_app/rooms/${roomId}/activeMedia`);
    return onValue(mediaRef, (snapshot) => {
      callback(snapshot.val());
    });
  },

  async setActiveMedia(media, roomId = "date-night") {
    if (!this.isConfigured()) return;
    try {
      const mediaRef = ref(db, `movie_app/rooms/${roomId}/activeMedia`);
      await set(mediaRef, media || null);
    } catch (err) {
      console.warn("[FirebaseSync] setActiveMedia error:", err);
    }
  },

  async closeActiveMedia(roomId = "date-night") {
    if (!this.isConfigured()) return;
    try {
      const mediaRef = ref(db, `movie_app/rooms/${roomId}/activeMedia`);
      await set(mediaRef, null);
    } catch (err) {
      console.warn("[FirebaseSync] closeActiveMedia error:", err);
    }
  },

  /* -------------------------------------------------------------
     4. CO-OP PASS THE REMOTE (DICE ROLLING & VOTING)
     Path: movie_app/rooms/{roomId}/dice
  ------------------------------------------------------------- */
  subscribeToDice(callback, roomId = "date-night") {
    if (!this.isConfigured()) return () => {};
    const diceRef = ref(db, `movie_app/rooms/${roomId}/dice`);
    return onValue(diceRef, (snapshot) => {
      callback(snapshot.val());
    });
  },

  async broadcastDiceRoll(movie, rolledBy, roomId = "date-night") {
    if (!this.isConfigured() || !movie) return;
    try {
      const diceRef = ref(db, `movie_app/rooms/${roomId}/dice`);
      await set(diceRef, {
        movie,
        rolledBy,
        status: "pending",
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn("[FirebaseSync] broadcastDiceRoll error:", err);
    }
  },

  async voteDiceDecision(decision, user, media = null, roomId = "date-night") {
    if (!this.isConfigured()) return;
    try {
      const diceRef = ref(db, `movie_app/rooms/${roomId}/dice`);
      await update(diceRef, {
        status: decision,
        votedBy: user,
        timestamp: Date.now(),
      });

      if (decision === "accepted" && media) {
        await this.setActiveMedia(media, roomId);
      }
    } catch (err) {
      console.warn("[FirebaseSync] voteDiceDecision error:", err);
    }
  },

  async resetDice(roomId = "date-night") {
    if (!this.isConfigured()) return;
    try {
      const diceRef = ref(db, `movie_app/rooms/${roomId}/dice`);
      await set(diceRef, {
        status: "reset",
        movie: null,
        rolledBy: null,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn("[FirebaseSync] resetDice error:", err);
    }
  },

  /* -------------------------------------------------------------
     5. DATE NIGHT SCHEDULING
     Path: movie_app/rooms/{roomId}/dateNight
  ------------------------------------------------------------- */
  subscribeToDateNight(callback, roomId = "date-night") {
    if (!this.isConfigured()) return () => {};
    const dnRef = ref(db, `movie_app/rooms/${roomId}/dateNight`);
    return onValue(dnRef, (snapshot) => {
      callback(snapshot.val());
    });
  },

  async setDateNight(plan, roomId = "date-night") {
    if (!this.isConfigured()) return;
    try {
      const dnRef = ref(db, `movie_app/rooms/${roomId}/dateNight`);
      await set(dnRef, plan || null);
    } catch (err) {
      console.warn("[FirebaseSync] setDateNight error:", err);
    }
  },

  async cancelDateNight(roomId = "date-night") {
    if (!this.isConfigured()) return;
    try {
      const dnRef = ref(db, `movie_app/rooms/${roomId}/dateNight`);
      await set(dnRef, null);
    } catch (err) {
      console.warn("[FirebaseSync] cancelDateNight error:", err);
    }
  },

  /* -------------------------------------------------------------
     6. GAME NIGHT (WHOT!, WORD DUEL & SCOREBOARD)
     Path: movie_app/rooms/{roomId}/games
  ------------------------------------------------------------- */
  subscribeToWhot(callback, roomId = "date-night") {
    if (!this.isConfigured()) return () => {};
    const whotRef = ref(db, `movie_app/rooms/${roomId}/games/whot`);
    return onValue(whotRef, (snapshot) => {
      callback(snapshot.val());
    });
  },

  async updateWhotState(gameState, roomId = "date-night") {
    if (!this.isConfigured() || !gameState) return;
    try {
      const whotRef = ref(db, `movie_app/rooms/${roomId}/games/whot`);
      await set(whotRef, gameState);
    } catch (err) {
      console.warn("[FirebaseSync] updateWhotState error:", err);
    }
  },

  subscribeToWordDuel(callback, roomId = "date-night") {
    if (!this.isConfigured()) return () => {};
    const wordRef = ref(db, `movie_app/rooms/${roomId}/games/wordDuel`);
    return onValue(wordRef, (snapshot) => {
      callback(snapshot.val());
    });
  },

  async updateWordDuelState(duelState, roomId = "date-night") {
    if (!this.isConfigured() || !duelState) return;
    try {
      const wordRef = ref(db, `movie_app/rooms/${roomId}/games/wordDuel`);
      await set(wordRef, duelState);
    } catch (err) {
      console.warn("[FirebaseSync] updateWordDuelState error:", err);
    }
  },

  subscribeToScrabble(callback, roomId = "date-night") {
    if (!this.isConfigured()) return () => {};
    const scrabbleRef = ref(db, `movie_app/rooms/${roomId}/games/scrabble`);
    return onValue(scrabbleRef, (snapshot) => {
      callback(snapshot.val());
    });
  },

  async updateScrabbleState(scrabbleState, roomId = "date-night") {
    if (!this.isConfigured() || !scrabbleState) return;
    try {
      const scrabbleRef = ref(db, `movie_app/rooms/${roomId}/games/scrabble`);
      await set(scrabbleRef, scrabbleState);
    } catch (err) {
      console.warn("[FirebaseSync] updateScrabbleState error:", err);
    }
  },

  subscribeToScoreboard(callback, roomId = "date-night") {
    if (!this.isConfigured()) return () => {};
    const scoresRef = ref(db, `movie_app/rooms/${roomId}/games/scores`);
    return onValue(scoresRef, (snapshot) => {
      callback(snapshot.val() || { timi: 0, ejay: 0 });
    });
  },

  async recordGameWin(winner, gameType = "whot", roomId = "date-night") {
    if (!this.isConfigured() || !winner) return;
    try {
      const key = winner.toLowerCase() === "timi" ? "timi" : "ejay";
      const scoreKeyRef = ref(db, `movie_app/rooms/${roomId}/games/scores/${key}`);
      const snap = await get(scoreKeyRef);
      const current = snap.exists() ? snap.val() : 0;
      await set(scoreKeyRef, current + 1);

      if (gameType) {
        const gameScoreRef = ref(db, `movie_app/rooms/${roomId}/games/${gameType}_scores/${key}`);
        const gameSnap = await get(gameScoreRef);
        const gameCurrent = gameSnap.exists() ? gameSnap.val() : 0;
        await set(gameScoreRef, gameCurrent + 1);
      }
    } catch (err) {
      console.warn("[FirebaseSync] recordGameWin error:", err);
    }
  },
};

export default firebaseSync;
