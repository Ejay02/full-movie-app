<template>
  <section v-if="items.length" class="continue-watching-section">
    <div class="section-header">
      <div>
        <p class="eyebrow mb-1">{{ eyebrow }}</p>
        <h2 class="section-title mb-2">{{ title }}</h2>
      </div>
      <v-btn
        v-if="showClear"
        text
        color="grey lighten-2"
        class="clear-btn"
        @click="clearItems"
      >
        Clear All
      </v-btn>
    </div>

    <v-slide-group class="continue-slider pa-0" show-arrows>
      <v-slide-item v-for="item in items" :key="item.id">
        <v-card class="continue-card mr-4 my-2" flat>
          <router-link :to="resumeRoute(item)" class="poster-link">
            <v-img :src="posterPath(item)" class="continue-poster">
              <span class="quality-badge">{{ getQualityTag(item) }}</span>
              <div class="poster-overlay">
                <div class="play-chip">
                  <v-icon left small color="white">mdi-play-circle</v-icon>
                  <span>{{ item.playbackLabel }}</span>
                </div>
              </div>
            </v-img>
          </router-link>

          <div class="continue-content">
            <div class="content-top">
              <div>
                <div class="media-label">
                  {{ item.mediaType === "tv" ? "Series" : "Movie" }}
                </div>
                <div class="card-title">{{ item.title }}</div>
              </div>

              <v-btn
                icon
                small
                class="remove-btn"
                @click.stop="removeItem(item.id)"
              >
                <v-icon small color="grey lighten-1">mdi-close</v-icon>
              </v-btn>
            </div>

            <div class="meta-row">
              <div class="d-flex align-center">
                <span class="imdb-badge mr-2">IMDb</span>
                <span class="score-text">
                  {{ item.voteAverage ? item.voteAverage.toFixed(1) : "N/A" }}
                </span>
              </div>
              <span class="watched-at">{{ formatWatchedAt(item.watchedAt) }}</span>
            </div>

            <div v-if="item.progressPercent" class="progress-row">
              <v-progress-linear
                :value="item.progressPercent"
                color="error"
                background-color="rgba(255, 255, 255, 0.12)"
                rounded
                height="6"
              ></v-progress-linear>
              <span class="progress-label">{{ item.progressPercent }}% watched</span>
            </div>

            <v-btn
              :to="resumeRoute(item)"
              color="error"
              depressed
              class="resume-btn text-none"
            >
              Resume
            </v-btn>
          </div>
        </v-card>
      </v-slide-item>
    </v-slide-group>
  </section>
</template>

<script>
export default {
  name: "ContinueWatchingSection",
  props: {
    title: {
      type: String,
      default: "Continue Watching",
    },
    eyebrow: {
      type: String,
      default: "Pick Up Where You Left Off",
    },
    showClear: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    items() {
      return this.$store.getters.continueWatchingItems;
    },
  },
  methods: {
    posterPath(item) {
      if (item.posterPath) {
        return `https://image.tmdb.org/t/p/w500/${item.posterPath}`;
      }

      if (item.backdropPath) {
        return `https://image.tmdb.org/t/p/w780/${item.backdropPath}`;
      }

      return "";
    },
    resumeRoute(item) {
      const basePath = item.mediaType === "tv" ? `/show/${item.mediaId}` : `/movie/${item.mediaId}`;
      const query = { autoplay: "1" };
      
      if (item.mediaType === "tv" && item.season) {
        query.season = String(item.season);
        query.episode = String(item.episode || 1);
      }
      
      return {
        path: basePath,
        query,
      };
    },
    removeItem(itemId) {
      this.$store.dispatch("removeContinueWatching", itemId);
    },
    clearItems() {
      this.$store.dispatch("clearContinueWatching");
    },
    getQualityTag(item) {
      if (item.mediaType === "tv") {
        return "FHD";
      }
      return parseInt(item.mediaId) % 3 === 0 ? "4K" : "FHD";
    },
    formatWatchedAt(timestamp) {
      const elapsed = Date.now() - timestamp;
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;

      if (elapsed < hour) {
        const minutes = Math.max(1, Math.floor(elapsed / minute));
        return `${minutes}m ago`;
      }

      if (elapsed < day) {
        const hours = Math.floor(elapsed / hour);
        return `${hours}h ago`;
      }

      const days = Math.floor(elapsed / day);
      return `${days}d ago`;
    },
  },
};
</script>

<style scoped>
.continue-watching-section {
  margin-bottom: 26px;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 18px;
}

.eyebrow {
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section-title {
  color: #ffffff;
  font-size: 1.8rem;
  line-height: 1.15;
}

.continue-card {
  width: 240px;
  overflow: hidden;
  border-radius: 16px !important;
  background: linear-gradient(180deg, rgba(17, 21, 33, 0.92), rgba(10, 12, 20, 0.96)) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.25);
}

.poster-link {
  display: block;
  text-decoration: none;
}

.continue-poster {
  aspect-ratio: 16 / 9;
}

.poster-overlay {
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  padding: 14px;
  background: linear-gradient(180deg, rgba(8, 10, 18, 0.05), rgba(8, 10, 18, 0.82));
}

.play-chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 0.78rem;
  backdrop-filter: blur(8px);
}

.quality-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 5;
  background: linear-gradient(135deg, #ff5252, #ff1744);
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.continue-content {
  padding: 14px;
}

.content-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.media-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card-title {
  color: rgba(255, 255, 255, 0.94);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  min-height: 2.6em;
}

.remove-btn {
  margin-top: -6px;
  margin-right: -6px;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.62);
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

.score-text,
.watched-at {
  color: rgba(255, 255, 255, 0.7);
}

.resume-btn {
  margin-top: 14px;
  width: 100%;
  border-radius: 10px !important;
}

.progress-row {
  margin-top: 12px;
}

.progress-label {
  display: inline-block;
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.78rem;
}

.clear-btn {
  letter-spacing: 0.02em;
}

@media (max-width: 600px) {
  .section-title {
    font-size: 1.45rem;
  }

  .continue-card {
    width: 210px;
  }
}
</style>
