<template>
  <div class="my-view-page mx-3">
    <ContinueWatchingSection show-clear />

    <div class="hero-copy mt-4">
      <p class="eyebrow mb-1">Your Saved Picks</p>
      <h2 class="page-title mb-2">My View</h2>
      <p class="page-description mb-0">
        Titles you add with the `+` button show up here for quick access.
      </p>
    </div>

    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card class="info-card" flat>
          <div class="stat-label">Continue Watching</div>
          <div class="stat-value">{{ continueWatchingCount }}</div>
          <p class="card-copy mb-0">
            Resume progress is saved locally in your browser for this app.
          </p>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="info-card" flat>
          <div class="stat-label">Saved To My View</div>
          <div class="stat-value">{{ myViewCount }}</div>
          <p class="card-copy mb-0">
            Use the `+` on any movie or show card to save it here.
          </p>
        </v-card>
      </v-col>
    </v-row>

    <div class="saved-section mt-8">
      <div class="section-header">
        <div>
          <p class="eyebrow mb-1">Quick Access</p>
          <h3 class="saved-title mb-0">Saved Titles</h3>
        </div>
      </div>

      <v-alert
        v-if="!myViewItems.length"
        outlined
        type="info"
        class="mt-6 info-alert"
      >
        Nothing saved yet. Tap the `+` on a card and it will appear here.
      </v-alert>

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
                <div class="saved-overlay">
                  <span class="saved-type">
                    {{ item.mediaType === "tv" ? "Series" : "Movie" }}
                  </span>
                </div>
              </v-img>
            </router-link>

            <div class="saved-content">
              <div class="saved-name">{{ item.title }}</div>
              <div class="saved-meta">
                <span class="imdb-badge mr-2">IMDb</span>
                <span>{{
                  item.voteAverage ? item.voteAverage.toFixed(1) : "N/A"
                }}</span>
              </div>
              <v-btn
                text
                small
                color="grey lighten-2"
                class="remove-btn px-0"
                @click="removeItem(item.id)"
              >
                Remove
              </v-btn>
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
    continueWatchingCount() {
      return this.$store.getters.continueWatchingItems.length;
    },
    myViewItems() {
      return this.$store.getters.myViewItems;
    },
    myViewCount() {
      return this.myViewItems.length;
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

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.saved-title {
  color: #ffffff;
  font-size: 1.6rem;
}

.info-card {
  height: 100%;
  padding: 22px;
  border-radius: 16px !important;
  background: linear-gradient(
    180deg,
    rgba(18, 21, 33, 0.9),
    rgba(10, 12, 20, 0.96)
  ) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stat-label {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.stat-value {
  margin-top: 12px;
  color: #ffffff;
  font-size: 2.4rem;
  font-weight: 700;
}

.card-copy {
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.66);
  line-height: 1.6;
}

.info-alert {
  color: rgba(255, 255, 255, 0.84);
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
  padding: 12px;
}

.saved-name {
  color: rgba(255, 255, 255, 0.94);
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  min-height: 2.6em;
}

.saved-meta {
  display: flex;
  align-items: center;
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.82rem;
}

.imdb-badge {
  background-color: #f5c518;
  color: #000000;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.72rem;
  font-weight: 700;
}

.remove-btn {
  margin-top: 10px;
  letter-spacing: 0.02em;
}
</style>
