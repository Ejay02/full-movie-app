import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const CONTINUE_WATCHING_KEY = "ej-movie-continue-watching";
const MY_VIEW_KEY = "ej-movie-my-view";
const MAX_CONTINUE_WATCHING_ITEMS = 12;
const MAX_MY_VIEW_ITEMS = 60;

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

export default new Vuex.Store({
  state: {
    continueWatching: loadContinueWatching(),
    myView: loadMyView(),
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
  },
  modules: {},
});
