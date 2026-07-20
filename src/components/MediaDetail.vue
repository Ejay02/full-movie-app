<template>
  <div>
    <!-- Loading State -->
    <div
      v-if="loading"
      class="d-flex justify-center align-center loading-container"
    >
      <v-progress-circular
        :size="70"
        :width="7"
        color="primary"
        indeterminate
      ></v-progress-circular>
    </div>

    <!-- Error State -->
    <v-container v-else-if="errorMessage">
      <v-alert outlined type="error" class="mt-6">
        {{ errorMessage }}
      </v-alert>
      <v-btn color="error" class="mt-4" @click="loadMediaDetails"
        >Try Again</v-btn
      >
    </v-container>

    <!-- Content State -->
    <div v-else class="media-detail-page">
      <!-- Backdrop Hero Banner (Cineby / Flixer style) -->
      <div class="hero-banner" :style="bannerStyle">
        <v-container class="hero-container fill-height align-end pa-4 pa-sm-6">
          <v-row class="align-center align-sm-end pb-4">
            <!-- Poster Column -->
            <v-col cols="12" sm="4" md="3" class="d-flex justify-center justify-sm-start">
              <v-card class="hero-poster-card" flat>
                <v-img :src="posterPath" class="hero-poster-img" aspect-ratio="0.667" />
              </v-card>
            </v-col>

            <!-- Metadata Info Column -->
            <v-col cols="12" sm="8" md="9" class="hero-details-col white--text mt-4 mt-sm-0">
              <span class="eyebrow red--text font-weight-bold text-uppercase tracking-wider">
                {{ mediaType === 'tv' ? 'TV Series' : 'Movie' }}
              </span>
              
              <h1 class="hero-title font-weight-bold mt-1 mb-2">
                {{ media.title || media.name }}
              </h1>

              <div class="d-flex align-center flex-wrap gap-2 mb-3">
                <v-rating
                  :value="media.vote_average / 2"
                  color="amber"
                  dense
                  half-increments
                  readonly
                  size="15"
                ></v-rating>
                <span class="detail-meta ml-2 font-weight-medium">
                  <span class="red--text mr-2 font-weight-bold">
                    {{ Math.round(media.vote_average * 10) }}% Match
                  </span>
                  |
                  <span class="mx-2">
                    {{ media.release_date || media.first_air_date }}
                  </span>
                  <span v-if="media.runtime || (media.episode_run_time && media.episode_run_time.length)">
                    |
                    <span class="ml-2">
                      {{ media.runtime ? media.runtime + ' min' : media.episode_run_time[0] + ' min/ep' }}
                    </span>
                  </span>
                </span>
              </div>

              <!-- Genres -->
              <div class="hero-genres mb-4">
                <v-chip
                  v-for="item in media.genres"
                  :key="item.id"
                  x-small
                  outlined
                  color="rgba(255, 255, 255, 0.7)"
                  class="mr-2 mb-1"
                >
                  {{ item.name }}
                </v-chip>
              </div>

              <!-- Description -->
              <p class="hero-overview grey--text text--lighten-3 mb-6">
                {{ media.overview }}
              </p>

              <!-- Actions -->
              <div class="hero-actions d-flex align-center flex-wrap gap-3">
                <v-btn
                  color="error"
                  large
                  rounded
                  class="px-8 font-weight-bold text-none play-btn-glow"
                  @click="startWatching"
                >
                  <v-icon left>mdi-play</v-icon>
                  Watch Now
                </v-btn>

                <v-btn
                  :color="isInMyView ? 'success' : 'white'"
                  outlined
                  large
                  rounded
                  class="px-6 font-weight-bold text-none"
                  @click="toggleMyView"
                >
                  <v-icon left>
                    {{ isInMyView ? 'mdi-check' : 'mdi-plus' }}
                  </v-icon>
                  {{ isInMyView ? 'In My View' : 'Add to List' }}
                </v-btn>
              </div>

              <!-- Crew list in banner -->
              <div class="mt-6" v-if="media.credits && media.credits.crew && media.credits.crew.length">
                <span class="grey--text text--lighten-1 text-caption font-weight-bold d-block mb-2">Featured Crew</span>
                <div class="d-flex flex-wrap gap-4">
                  <div
                    v-for="crew in media.credits.crew.slice(0, 3)"
                    :key="`${crew.name}-${crew.job}`"
                    class="mr-6 mb-2"
                  >
                    <div class="white--text body-2 font-weight-bold">{{ crew.name }}</div>
                    <span class="grey--text text-caption">{{ crew.job }}</span>
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </div>

      <!-- Main Content Container -->
      <v-container class="main-content-wrapper px-4 px-sm-6">
        <!-- TV Episodes Listing Section -->
        <v-card v-if="mediaType === 'tv'" class="episodes-card pa-4 mb-8" flat>
          <div class="d-flex align-center justify-space-between mb-4 flex-wrap gap-2">
            <h3 class="section-heading mb-0 text-h6 font-weight-bold white--text">Episodes</h3>
            
            <!-- Season Dropdown -->
            <div class="season-select-wrapper">
              <v-select
                v-model="selectedSeason"
                :items="seasonOptions"
                label="Season"
                dense
                outlined
                hide-details
                class="season-select"
                @change="handleSeasonChange"
              ></v-select>
            </div>
          </div>

          <!-- Episode Grid Loader -->
          <div v-if="loadingEpisodes" class="d-flex justify-center py-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>

          <!-- Episode grid -->
          <div v-else>
            <v-row dense>
              <v-col
                v-for="ep in episodes"
                :key="ep.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
                class="pa-2"
              >
                <v-card
                  :class="['episode-item-card', { 'active-episode': ep.episode_number === selectedEpisode }]"
                  @click="playEpisode(ep.episode_number)"
                  flat
                >
                  <v-img
                    :src="episodeStillUrl(ep.still_path)"
                    class="episode-still"
                    aspect-ratio="1.777"
                  >
                    <!-- Play overlay -->
                    <div class="episode-still-overlay d-flex align-center justify-center">
                      <v-icon large color="white">
                        {{ ep.episode_number === selectedEpisode ? 'mdi-play-circle' : 'mdi-play-circle-outline' }}
                      </v-icon>
                    </div>
                    <!-- Episode number badge -->
                    <span class="episode-num-badge">Ep {{ ep.episode_number }}</span>
                  </v-img>
                  
                  <div class="episode-item-info pa-3">
                    <div class="episode-item-title font-weight-bold text-truncate white--text mb-1">
                      {{ ep.name }}
                    </div>
                    <div class="episode-item-air-date grey--text text--lighten-1 caption mb-1">
                      {{ ep.air_date }}
                    </div>
                    <p class="episode-item-overview grey--text text-caption mb-0 text-line-clamp-2">
                      {{ ep.overview || 'No description available.' }}
                    </p>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-card>

        <!-- Backdrop Images Gallery -->
        <Images :images="media.images.backdrops" class="mt-4" />
      </v-container>
    </div>
  </div>
</template>

<script>
import Images from "../components/Images.vue";
import { getPersonalMediaSource } from "@/data/personalMediaLibrary";

function createInitialMedia() {
  return {
    credits: {
      crew: [],
      cast: [],
    },
    genres: [],
    images: {
      backdrops: [],
    },
    videos: {
      results: [],
    },
  };
}

export default {
  name: "MediaDetail",
  components: {
    Images,
  },
  props: {
    mediaType: {
      type: String,
      required: true,
    },
    mediaId: {
      type: [String, Number],
      required: true,
    },
  },
  data() {
    return {
      media: createInitialMedia(),
      errorMessage: "",
      loading: true,

      // TV & Episode Picker State
      selectedSeason: 1,
      selectedEpisode: 1,
      episodes: [],
      loadingEpisodes: false,
    };
  },
  computed: {
    posterPath() {
      if (!this.media.poster_path) {
        return "";
      }
      return "https://image.tmdb.org/t/p/w500/" + this.media.poster_path;
    },
    backdropPath() {
      if (!this.media.backdrop_path) {
        return "";
      }
      return "https://image.tmdb.org/t/p/w1280/" + this.media.backdrop_path;
    },
    requestKey() {
      return `${this.mediaType}:${this.mediaId}`;
    },
    mediaSource() {
      return getPersonalMediaSource(this.mediaType, this.mediaId);
    },
    hasPersonalSource() {
      return !!this.mediaSource;
    },
    continueWatchingEntry() {
      return this.$store.getters.continueWatchingItemByKey(
        this.mediaType,
        this.mediaId,
      );
    },
    seasonOptions() {
      if (!this.media.seasons) return [];
      return this.media.seasons
        .map(s => ({
          text: s.name || `Season ${s.season_number}`,
          value: s.season_number,
        }))
        .sort((a, b) => a.value - b.value);
    },
    isInMyView() {
      return !!this.$store.getters.myViewItemByKey(this.mediaType, this.mediaId);
    },
    bannerStyle() {
      if (!this.backdropPath) {
        return {
          background: "#0a0e18"
        };
      }
      return {
        backgroundImage: `linear-gradient(to bottom, rgba(10, 13, 22, 0.35), #05070d 100%), url(${this.backdropPath})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
      };
    }
  },
  watch: {
    requestKey: {
      handler() {
        this.loadMediaDetails();
      },
      immediate: true,
    },
    "$route.query.season"(newVal) {
      if (this.mediaType === "tv" && newVal && Number(newVal) !== this.selectedSeason) {
        this.selectedSeason = Number(newVal);
        this.fetchEpisodes();
      }
    },
    "$route.query.episode"(newVal) {
      if (this.mediaType === "tv" && newVal && Number(newVal) !== this.selectedEpisode) {
        this.selectedEpisode = Number(newVal);
      }
    }
  },
  methods: {
    async loadMediaDetails() {
      this.loading = true;
      this.errorMessage = "";

      try {
        const response = await this.$http.get(
          `/${this.mediaType}/${this.mediaId}?append_to_response=credits,videos,images`,
        );
        this.media = response.data;

        if (this.mediaType === "tv") {
          const querySeason = Number(this.$route.query.season);
          const queryEpisode = Number(this.$route.query.episode);
          const savedSeason = this.continueWatchingEntry ? this.continueWatchingEntry.season : null;
          const savedEpisode = this.continueWatchingEntry ? this.continueWatchingEntry.episode : null;

          if (querySeason && Number.isInteger(querySeason)) {
            this.selectedSeason = querySeason;
            this.selectedEpisode = Number.isInteger(queryEpisode) ? queryEpisode : 1;
          } else if (savedSeason) {
            this.selectedSeason = Number(savedSeason);
            this.selectedEpisode = savedEpisode ? Number(savedEpisode) : 1;
          } else {
            const validSeasons = (this.media.seasons || []).filter(s => s.season_number > 0);
            this.selectedSeason = validSeasons.length > 0 ? validSeasons[0].season_number : 1;
            this.selectedEpisode = 1;
          }

          await this.fetchEpisodes();
        }
      } catch (error) {
        this.media = createInitialMedia();
        this.errorMessage = "Unable to load details for this title right now.";
        console.log(error);
      } finally {
        this.loading = false;
      }
    },
    async fetchEpisodes() {
      this.loadingEpisodes = true;
      try {
        const response = await this.$http.get(
          `/tv/${this.mediaId}/season/${this.selectedSeason}`
        );
        this.episodes = response.data.episodes || [];
      } catch (error) {
        console.error("Failed to fetch episodes:", error);
        this.episodes = [];
      } finally {
        this.loadingEpisodes = false;
      }
    },
    async handleSeasonChange() {
      this.selectedEpisode = 1;
      await this.fetchEpisodes();
      this.updateUrlParams();
    },
    playEpisode(episodeNum) {
      this.selectedEpisode = episodeNum;
      this.updateUrlParams();

      // Navigate to full-screen watch view
      const watchPath = `/watch/${this.mediaType}/${this.mediaId}`;
      this.$router.push({
        path: watchPath,
        query: {
          autoplay: "1",
          season: String(this.selectedSeason),
          episode: String(episodeNum),
        }
      }).catch(() => {});
    },
    startWatching() {
      // Navigate to full-screen watch view
      const watchPath = `/watch/${this.mediaType}/${this.mediaId}`;
      const query = { autoplay: "1" };
      if (this.mediaType === "tv") {
        query.season = String(this.selectedSeason);
        query.episode = String(this.selectedEpisode);
      }
      
      this.$router.push({
        path: watchPath,
        query
      }).catch(() => {});
    },
    updateUrlParams() {
      const query = {
        ...this.$route.query,
        season: String(this.selectedSeason),
        episode: String(this.selectedEpisode),
      };
      this.$router.replace({ query }).catch(() => {});
    },
    episodeStillUrl(stillPath) {
      if (!stillPath) {
        return this.backdropPath || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500";
      }
      return `https://image.tmdb.org/t/p/w300/${stillPath}`;
    },
    toggleMyView() {
      const itemId = `${this.mediaType}-${this.mediaId}`;
      if (this.isInMyView) {
        this.$store.dispatch("removeFromMyView", itemId);
        return;
      }
      this.$store.dispatch("saveToMyView", {
        mediaType: this.mediaType,
        mediaId: this.mediaId,
        title: this.media.title || this.media.name,
        posterPath: this.media.poster_path,
        backdropPath: this.media.backdrop_path,
        voteAverage: this.media.vote_average,
      });
    }
  },
};
</script>

<style>
.loading-container {
  min-height: 400px;
}

.media-detail-page {
  color: rgba(255, 255, 255, 0.92);
}

/* Cineby/Flixer Backdrop Banner */
.hero-banner {
  position: relative;
  min-height: 55vh;
  display: flex;
  align-items: flex-end;
  padding-top: 100px;
  padding-bottom: 24px;
}

.hero-container {
  background: transparent;
  width: 100%;
}

.hero-poster-card {
  overflow: hidden;
  border-radius: 14px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
  max-width: 240px;
  width: 100%;
}

.hero-poster-img {
  aspect-ratio: 2 / 3;
}

.hero-details-col {
  padding-left: 24px;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.85);
}

.hero-title {
  font-size: 2.8rem;
  line-height: 1.1;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.9);
}

.hero-overview {
  font-size: 1.05rem;
  line-height: 1.6;
  max-width: 780px;
  color: rgba(255, 255, 255, 0.85) !important;
}

.main-content-wrapper {
  margin-top: 16px;
}

.play-btn-glow {
  box-shadow: 0 0 0 0 rgba(229, 9, 20, 0.7);
  animation: pulse-glow 2s infinite;
  transition: transform 0.2s ease !important;
}

.play-btn-glow:hover {
  transform: scale(1.05) !important;
}

@keyframes pulse-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(229, 9, 20, 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(229, 9, 20, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(229, 9, 20, 0);
  }
}

.detail-meta,
.detail-genres,
.detail-supporting-text {
  color: rgba(255, 255, 255, 0.66);
}

.source-chip {
  border-radius: 999px !important;
}

.section-heading {
  color: #ffffff;
}

/* TV episodes section styling */
.episodes-card {
  border-radius: 18px !important;
  background: linear-gradient(
    180deg,
    rgba(18, 21, 33, 0.75),
    rgba(10, 13, 22, 0.88)
  ) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.25) !important;
}

.season-select-wrapper {
  width: 160px;
}

.season-select >>> .v-input__control {
  border-radius: 10px !important;
}

.episode-item-card {
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.episode-item-card:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.16);
  transform: translateY(-4px);
}

.episode-item-card.active-episode {
  background: rgba(255, 82, 82, 0.08) !important;
  border-color: rgba(255, 82, 82, 0.4);
}

.episode-still {
  position: relative;
  overflow: hidden;
}

.episode-still-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.episode-item-card:hover .episode-still-overlay {
  opacity: 1;
}

.episode-item-card.active-episode .episode-still-overlay {
  opacity: 1;
  background: rgba(229, 9, 20, 0.15);
}

.episode-num-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(8, 10, 18, 0.85);
  backdrop-filter: blur(4px);
  color: #fff;
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.episode-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.episode-item-title {
  font-size: 0.88rem;
  line-height: 1.3;
}

.text-line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}

.gap-4 {
  gap: 16px;
}

.w-100 {
  width: 100%;
}

.max-w-250 {
  max-width: 250px;
}

@media (max-width: 960px) {
  .hero-banner {
    min-height: auto;
    padding-top: 80px;
  }

  .hero-poster-card {
    max-width: 180px;
  }

  .hero-title {
    font-size: 2.2rem;
  }

  .hero-details-col {
    padding-left: 0px;
  }
}
</style>
