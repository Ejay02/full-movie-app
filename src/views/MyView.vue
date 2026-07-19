<template>
  <div class="my-view-page mx-3">
    <ContinueWatchingSection show-clear />

    <div v-if="myViewItems.length || showEmptyState" class="hero-copy mt-6">
      <p class="eyebrow mb-1">Watchlist</p>
      <h2 class="page-title mb-2">My View</h2>
    </div>

    <div v-if="myViewItems.length || showEmptyState" class="saved-section mt-4">
      <div v-if="showEmptyState" class="empty-state-shell">
        <div class="empty-state">
          <v-icon size="56" color="rgba(255, 255, 255, 0.35)">
            mdi-view-grid-plus-outline
          </v-icon>
          <h3 class="empty-title mt-4 mb-2">Your Library is empty</h3>
          <p class="empty-copy mb-5">Browse content to start watching or add items to your watchlist.</p>
          <v-btn color="error" depressed class="text-none" to="/">
            Browse Content
          </v-btn>
        </div>
      </div>

      <v-row v-else dense class="mt-2">
        <v-col
          v-for="item in myViewItems"
          :key="item.id"
          cols="6"
          sm="4"
          md="3"
          lg="2"
        >
          <v-card class="saved-card" flat>
            <router-link :to="detailRoute(item)" class="saved-link">
              <v-img :src="posterPath(item)" class="saved-poster">
                <v-btn
                  icon
                  small
                  class="saved-remove-btn"
                  @click.prevent.stop="removeItem(item.id)"
                >
                  <v-icon small color="white">mdi-close</v-icon>
                </v-btn>
                <div class="saved-overlay">
                  <span class="saved-type">
                    {{ item.mediaType === "tv" ? "Series" : "Movie" }}
                  </span>
                </div>
              </v-img>
            </router-link>

            <div class="saved-content">
              <div class="saved-content-row">
                <div class="saved-name-wrap">
                  <div class="saved-name">{{ item.title }}</div>
                </div>
                <div class="saved-rating">
                  <span class="imdb-badge">IMDb</span>
                  <span class="rating-value">{{
                    item.voteAverage ? item.voteAverage.toFixed(1) : "N/A"
                  }}</span>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import ContinueWatchingSection from "@/components/ContinueWatchingSection.vue";

export default {
  name: "MyView",
  components: {
    ContinueWatchingSection,
  },
  computed: {
    myViewItems() {
      return this.$store.getters.myViewItems;
    },
    continueWatchingItems() {
      return this.$store.getters.continueWatchingItems;
    },
    hasContinueWatching() {
      return this.continueWatchingItems && this.continueWatchingItems.length > 0;
    },
    showEmptyState() {
      return !this.myViewItems.length && !this.hasContinueWatching;
    },
  },
  methods: {
    detailRoute(item) {
      return item.mediaType === "tv"
        ? `/show/${item.mediaId}`
        : `/movie/${item.mediaId}`;
    },
    posterPath(item) {
      return item.posterPath
        ? `https://image.tmdb.org/t/p/w500/${item.posterPath}`
        : "";
    },
    removeItem(itemId) {
      this.$store.dispatch("removeFromMyView", itemId);
    },
  },
};
</script>

<style scoped>
.my-view-page {
  padding-top: 12px;
}

.hero-copy {
  color: #ffffff;
}

.eyebrow {
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.page-title {
  font-size: 2rem;
  line-height: 1.1;
}

.page-description {
  max-width: 680px;
  color: rgba(255, 255, 255, 0.68);
}

.empty-state-shell {
  padding: 28px 0 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  text-align: center;
}

.empty-title {
  color: #ffffff;
  font-size: 1.45rem;
}

.empty-copy {
  color: rgba(255, 255, 255, 0.64);
}

.saved-card {
  overflow: hidden;
  height: 100%;
  border-radius: 12px !important;
  background: linear-gradient(
    180deg,
    rgba(18, 21, 33, 0.92),
    rgba(10, 12, 20, 0.96)
  ) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.saved-link {
  display: block;
  text-decoration: none;
}

.saved-poster {
  aspect-ratio: 2 / 3;
}

.saved-remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  background: rgba(7, 10, 16, 0.58);
  backdrop-filter: blur(10px);
}

.saved-overlay {
  display: flex;
  align-items: flex-end;
  width: 100%;
  height: 100%;
  padding: 12px;
  background: linear-gradient(
    180deg,
    rgba(8, 10, 18, 0.05),
    rgba(8, 10, 18, 0.82)
  );
}

.saved-type {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.saved-content {
  padding: 12px 12px 10px;
}

.saved-content-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.saved-name-wrap {
  flex: 1;
  min-width: 0;
}

.saved-name {
  color: rgba(255, 255, 255, 0.94);
  font-size: 0.93rem;
  font-weight: 600;
  line-height: 1.28;
  word-break: break-word;
}

.saved-rating {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  text-align: right;
}

.imdb-badge {
  background-color: #f5c518;
  color: #000000;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.72rem;
  font-weight: 700;
}

.rating-value {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.88);
  font-weight: 600;
}
</style>
