import Vue from "vue";
import Vuex from "vuex";
import firebaseSync from "@/services/firebaseSync";

Vue.use(Vuex);

const CONTINUE_WATCHING_KEY = "ej-movie-continue-watching";
const MY_VIEW_KEY = "ej-movie-my-view";
const WATCHED_KEY = "ej-movie-watched";
const OUR_VIEW_KEY = "ej-movie-our-view";
const DATE_NIGHT_KEY = "ej-movie-date-night";
const MAX_CONTINUE_WATCHING_ITEMS = 12;
const MAX_MY_VIEW_ITEMS = 60;
const MAX_WATCHED_ITEMS = 200;
const MAX_OUR_VIEW_ITEMS = 100;

function loadWatched() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(WATCHED_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Unable to restore watched media state.", error);
    return [];
  }
}

function persistWatched(items) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WATCHED_KEY, JSON.stringify(items));
}

function loadContinueWatching() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(CONTINUE_WATCHING_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Unable to restore continue watching state.", error);
    return [];
  }
}

function persistContinueWatching(items) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CONTINUE_WATCHING_KEY, JSON.stringify(items));
}

function loadMyView() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(MY_VIEW_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Unable to restore My View state.", error);
    return [];
  }
}

function persistMyView(items) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(MY_VIEW_KEY, JSON.stringify(items));
}

function loadOurView() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(OUR_VIEW_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Unable to restore Our View state.", error);
    return [];
  }
}

function persistOurView(items) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(OUR_VIEW_KEY, JSON.stringify(items));
}

function loadNextDateNight() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(DATE_NIGHT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn("Unable to restore Date Night state.", error);
    return null;
  }
}

function persistNextDateNight(data) {
  if (typeof window === "undefined") {
    return;
  }

  if (!data) {
    window.localStorage.removeItem(DATE_NIGHT_KEY);
  } else {
    window.localStorage.setItem(DATE_NIGHT_KEY, JSON.stringify(data));
  }
}

function normalizeOurViewItem(item) {
  let notes = [];
  if (Array.isArray(item.notes)) {
    notes = item.notes;
  } else if (item.notes && typeof item.notes === "object") {
    notes = Object.values(item.notes);
  } else if (item.note && typeof item.note === "string") {
    notes = [
      {
        id: `legacy-${item.mediaId || Date.now()}`,
        user: item.addedBy || "Timi",
        text: item.note,
        timestamp: item.savedAt || Date.now(),
      },
    ];
  }

  return {
    id: `${item.mediaType}-${item.mediaId}`,
    mediaId: item.mediaId,
    mediaType: item.mediaType,
    title: item.title,
    posterPath: item.posterPath || "",
    backdropPath: item.backdropPath || "",
    voteAverage: item.voteAverage || 0,
    genreIds: Array.isArray(item.genreIds) ? item.genreIds : [],
    note: item.note || "",
    notes,
    addedBy: item.addedBy || "Timi",
    savedAt: item.savedAt || Date.now(),
  };
}

function normalizeMyViewItem(item) {
  return {
    id: `${item.mediaType}-${item.mediaId}`,
    mediaId: item.mediaId,
    mediaType: item.mediaType,
    title: item.title,
    posterPath: item.posterPath || "",
    backdropPath: item.backdropPath || "",
    voteAverage: item.voteAverage || 0,
    genreIds: Array.isArray(item.genreIds) ? item.genreIds : [],
    savedAt: item.savedAt || Date.now(),
  };
}

function normalizeWatchItem(item) {
  const progressPercent = Number.isFinite(item.progressPercent)
    ? Math.max(0, Math.min(100, Math.round(item.progressPercent)))
    : 0;

  return {
    id: `${item.mediaType}-${item.mediaId}`,
    mediaId: item.mediaId,
    mediaType: item.mediaType,
    title: item.title,
    posterPath: item.posterPath || "",
    backdropPath: item.backdropPath || "",
    voteAverage: item.voteAverage || 0,
    playbackLabel:
      item.playbackLabel ||
      (progressPercent > 0
        ? `Resume ${progressPercent}%`
        : "Continue Watching"),
    currentTime: Number.isFinite(item.currentTime)
      ? Math.max(0, Math.floor(item.currentTime))
      : 0,
    duration: Number.isFinite(item.duration)
      ? Math.max(0, Math.floor(item.duration))
      : 0,
    progressPercent,
    watchedAt: item.watchedAt || Date.now(),
    season: item.season,
    episode: item.episode,
  };
}

const store = new Vuex.Store({
  state: {
    continueWatching: loadContinueWatching(),
    myView: loadMyView(),
    watched: loadWatched(),
    ourView: loadOurView(),
    nextDateNight: loadNextDateNight(),
  },
  getters: {
    continueWatchingItems(state) {
      return state.continueWatching;
    },
    hasContinueWatching(state) {
      return state.continueWatching.length > 0;
    },
    continueWatchingItemByKey: (state) => (mediaType, mediaId) =>
      state.continueWatching.find(
        (item) =>
          item.mediaType === mediaType &&
          String(item.mediaId) === String(mediaId),
      ) || null,
    myViewItems(state) {
      return state.myView;
    },
    myViewItemByKey: (state) => (mediaType, mediaId) =>
      state.myView.find(
        (item) =>
          item.mediaType === mediaType && String(item.mediaId) === String(mediaId)
      ) || null,
    ourViewItems(state) {
      return state.ourView;
    },
    ourViewItemByKey: (state) => (mediaType, mediaId) =>
      state.ourView.find(
        (item) =>
          item.mediaType === mediaType && String(item.mediaId) === String(mediaId)
      ) || null,
    nextDateNight(state) {
      return state.nextDateNight;
    },
    watchedItems(state) {
      return state.watched;
    },
    isMediaWatched: (state) => (mediaType, mediaId) =>
      state.watched.some(
        (item) =>
          item.mediaType === mediaType && String(item.mediaId) === String(mediaId)
      ),
  },
  mutations: {
    RECORD_CONTINUE_WATCHING(state, payload) {
      const item = normalizeWatchItem(payload);
      const existingIndex = state.continueWatching.findIndex(
        (entry) => entry.id === item.id,
      );

      if (existingIndex !== -1) {
        state.continueWatching.splice(existingIndex, 1);
      }

      state.continueWatching.unshift(item);
      state.continueWatching = state.continueWatching.slice(
        0,
        MAX_CONTINUE_WATCHING_ITEMS,
      );
      persistContinueWatching(state.continueWatching);
    },
    REMOVE_CONTINUE_WATCHING(state, itemId) {
      state.continueWatching = state.continueWatching.filter(
        (item) => item.id !== itemId,
      );
      persistContinueWatching(state.continueWatching);
    },
    CLEAR_CONTINUE_WATCHING(state) {
      state.continueWatching = [];
      persistContinueWatching(state.continueWatching);
    },
    SAVE_TO_MY_VIEW(state, payload) {
      const item = normalizeMyViewItem(payload);
      const existingIndex = state.myView.findIndex((entry) => entry.id === item.id);

      if (existingIndex !== -1) {
        state.myView.splice(existingIndex, 1);
      }

      state.myView.unshift(item);
      state.myView = state.myView.slice(0, MAX_MY_VIEW_ITEMS);
      persistMyView(state.myView);
    },
    REMOVE_FROM_MY_VIEW(state, itemId) {
      state.myView = state.myView.filter((item) => item.id !== itemId);
      persistMyView(state.myView);
    },
    SAVE_TO_OUR_VIEW(state, payload) {
      const item = normalizeOurViewItem(payload);
      const existingIndex = state.ourView.findIndex((entry) => entry.id === item.id);

      if (existingIndex !== -1) {
        state.ourView.splice(existingIndex, 1);
      }

      state.ourView.unshift(item);
      state.ourView = state.ourView.slice(0, MAX_OUR_VIEW_ITEMS);
      persistOurView(state.ourView);
    },
    UPDATE_OUR_VIEW_NOTE(state, { itemId, note, addedBy }) {
      const item = state.ourView.find((entry) => entry.id === itemId);
      if (item) {
        if (typeof note === "string") item.note = note;
        if (typeof addedBy === "string") item.addedBy = addedBy;
        persistOurView(state.ourView);
      }
    },
    ADD_OUR_VIEW_NOTE(state, { itemId, noteObj }) {
      const item = state.ourView.find((entry) => entry.id === itemId);
      if (item) {
        if (!Array.isArray(item.notes)) item.notes = [];
        // Avoid duplicate note id
        if (!item.notes.some((n) => n.id === noteObj.id)) {
          item.notes.push(noteObj);
        }
        persistOurView(state.ourView);
      }
    },
    REMOVE_OUR_VIEW_NOTE(state, { itemId, noteId }) {
      const item = state.ourView.find((entry) => entry.id === itemId);
      if (item && Array.isArray(item.notes)) {
        item.notes = item.notes.filter((n) => n.id !== noteId);
        persistOurView(state.ourView);
      }
    },
    REMOVE_FROM_OUR_VIEW(state, itemId) {
      state.ourView = state.ourView.filter((item) => item.id !== itemId);
      persistOurView(state.ourView);
    },
    SET_OUR_VIEW(state, items) {
      state.ourView = Array.isArray(items) ? items.map(normalizeOurViewItem) : [];
      persistOurView(state.ourView);
    },
    SET_NEXT_DATE_NIGHT(state, payload) {
      state.nextDateNight = payload;
      persistNextDateNight(state.nextDateNight);
    },
    CLEAR_NEXT_DATE_NIGHT(state) {
      state.nextDateNight = null;
      persistNextDateNight(null);
    },
    MARK_AS_WATCHED(state, payload) {
      const id = `${payload.mediaType}-${payload.mediaId}`;
      const existingIndex = state.watched.findIndex((entry) => entry.id === id);

      if (existingIndex !== -1) {
        state.watched.splice(existingIndex, 1);
      }

      state.watched.unshift({
        id,
        mediaType: payload.mediaType,
        mediaId: payload.mediaId,
        title: payload.title || "",
        watchedAt: Date.now(),
      });
      state.watched = state.watched.slice(0, MAX_WATCHED_ITEMS);
      persistWatched(state.watched);
    },
    UNMARK_AS_WATCHED(state, itemId) {
      state.watched = state.watched.filter((item) => item.id !== itemId);
      persistWatched(state.watched);
    },
    TOGGLE_WATCHED(state, payload) {
      const id = `${payload.mediaType}-${payload.mediaId}`;
      const existingIndex = state.watched.findIndex((entry) => entry.id === id);

      if (existingIndex !== -1) {
        state.watched.splice(existingIndex, 1);
      } else {
        state.watched.unshift({
          id,
          mediaType: payload.mediaType,
          mediaId: payload.mediaId,
          title: payload.title || "",
          watchedAt: Date.now(),
        });
        state.watched = state.watched.slice(0, MAX_WATCHED_ITEMS);
      }
      persistWatched(state.watched);
    },
  },
  actions: {
    recordContinueWatching({ commit }, payload) {
      commit("RECORD_CONTINUE_WATCHING", payload);
    },
    removeContinueWatching({ commit }, itemId) {
      commit("REMOVE_CONTINUE_WATCHING", itemId);
    },
    clearContinueWatching({ commit }) {
      commit("CLEAR_CONTINUE_WATCHING");
    },
    saveToMyView({ commit }, payload) {
      commit("SAVE_TO_MY_VIEW", payload);
    },
    removeFromMyView({ commit }, itemId) {
      commit("REMOVE_FROM_MY_VIEW", itemId);
    },
    saveToOurView({ commit }, payload) {
      const item = normalizeOurViewItem(payload);
      commit("SAVE_TO_OUR_VIEW", payload);
      firebaseSync.addToQueue(item);
    },
    updateOurViewNote({ commit }, payload) {
      commit("UPDATE_OUR_VIEW_NOTE", payload);
      firebaseSync.updateQueueNote(payload.itemId, payload.note, payload.addedBy);
    },
    addOurViewNote({ commit }, { itemId, text, user }) {
      if (!text || !text.trim()) return;
      const noteObj = {
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        user: user || "Timi",
        text: text.trim(),
        timestamp: Date.now(),
      };
      commit("ADD_OUR_VIEW_NOTE", { itemId, noteObj });
      firebaseSync.addQueueNote(itemId, noteObj);
    },
    removeOurViewNote({ commit }, { itemId, noteId }) {
      commit("REMOVE_OUR_VIEW_NOTE", { itemId, noteId });
      firebaseSync.removeQueueNote(itemId, noteId);
    },
    removeFromOurView({ commit }, itemId) {
      commit("REMOVE_FROM_OUR_VIEW", itemId);
      firebaseSync.removeFromQueue(itemId);
    },
    setOurViewItems({ commit }, items) {
      commit("SET_OUR_VIEW", items);
    },
    setNextDateNight({ commit }, payload) {
      commit("SET_NEXT_DATE_NIGHT", payload);
      firebaseSync.setDateNight(payload);
    },
    clearNextDateNight({ commit }) {
      commit("CLEAR_NEXT_DATE_NIGHT");
      firebaseSync.cancelDateNight();
    },
    markAsWatched({ commit }, payload) {
      commit("MARK_AS_WATCHED", payload);
    },
    unmarkAsWatched({ commit }, itemId) {
      commit("UNMARK_AS_WATCHED", itemId);
    },
    toggleWatched({ commit }, payload) {
      commit("TOGGLE_WATCHED", payload);
    },
  },
  modules: {},
});

// Automatic real-time cloud synchronisation subscriptions
if (typeof window !== "undefined") {
  let hasCheckedInitialMigration = false;

  firebaseSync.subscribeToQueue((remoteQueue) => {
    if (remoteQueue && Array.isArray(remoteQueue)) {
      if (!hasCheckedInitialMigration) {
        hasCheckedInitialMigration = true;
        const alreadyMigrated = localStorage.getItem("our_view_firebase_migrated");
        const localQueue = loadOurView();
        if (!alreadyMigrated && !remoteQueue.length && localQueue.length) {
          localStorage.setItem("our_view_firebase_migrated", "true");
          localQueue.forEach((item) => firebaseSync.addToQueue(item));
          return;
        }
        localStorage.setItem("our_view_firebase_migrated", "true");
      }

      store.commit("SET_OUR_VIEW", remoteQueue);
    }
  });

  firebaseSync.subscribeToDateNight((remoteDateNight) => {
    if (remoteDateNight !== undefined) {
      store.commit("SET_NEXT_DATE_NIGHT", remoteDateNight);
    }
  });
}

export default store;
