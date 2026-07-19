<template>
  <div>
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

    <v-container v-else-if="errorMessage">
      <v-alert outlined type="error" class="mt-6">
        {{ errorMessage }}
      </v-alert>
      <v-btn color="error" class="mt-4" @click="loadMediaDetails"
        >Try Again</v-btn
      >
    </v-container>

    <div v-else>
      <v-container class="media-detail-page">
        <v-card v-if="hasPersonalSource" flat class="player-shell mb-6">
          <div class="player-header">
            <div>
              <div class="player-label">Now Watching</div>
              <div class="player-title">{{ media.title || media.name }}</div>
            </div>
            <div class="player-meta">
              {{
                continueWatchingEntry
                  ? formatPlaybackTime(continueWatchingEntry.currentTime)
                  : "Ready to watch"
              }}
            </div>
          </div>

          <div v-if="isEmbedSource">
            <div v-if="activeEmbed" class="iframe-container">
              <iframe
                allowfullscreen
                allow="autoplay; encrypted-media; picture-in-picture"
                :src="mediaSource.sourceUrl"
              ></iframe>
            </div>
            <div v-else class="embed-placeholder">
              <v-btn color="error" large depressed @click="activateEmbedPlayer">
                <v-icon left>mdi-play</v-icon>Start Stream
              </v-btn>
              <p class="embed-copy mb-0">
                This title is configured to open from your private embedded
                player.
              </p>
            </div>
          </div>

          <div v-else class="native-player-shell">
            <video
              ref="player"
              controls
              playsinline
              preload="metadata"
              class="media-player"
              :poster="backdropPath || posterPath"
              @loadedmetadata="handleLoadedMetadata"
              @play="handlePlay"
              @timeupdate="handleTimeUpdate"
              @ended="handlePlaybackEnded"
            >
              <source
                :src="mediaSource.sourceUrl"
                :type="mediaSource.mimeType || 'video/mp4'"
              />
              <track
                v-for="track in mediaSource.subtitleTracks"
                :key="`${track.label}-${track.srclang}`"
                kind="subtitles"
                :src="track.src"
                :srclang="track.srclang"
                :label="track.label"
                :default="!!track.default"
              />
            </video>
          </div>
        </v-card>

        <v-alert v-else outlined type="info" class="mb-6">
          No private stream has been added for this title yet. Add your own
          source in `src/data/personalMediaLibrary.js`.
        </v-alert>

        <v-row>
          <v-col cols="12" sm="4">
            <v-hover v-slot="{ hover }" open-delay="200">
              <v-card
                class="poster-card"
                :elevation="hover ? 16 : 2"
                :class="{ 'on-hover': hover }"
              >
                <v-img :src="posterPath" alt="" class="detail-poster" />
              </v-card>
            </v-hover>
          </v-col>

          <v-col cols="12" sm="8">
            <h1 class="detail-title mt-5">
              {{ media.title || media.name }}
            </h1>

            <v-col>
              <v-rating
                :value="media.vote_average / 2"
                color="amber"
                dense
                half-increments
                readonly
                size="14"
              >
              </v-rating>
            </v-col>

            <v-col class="px-0">
              <span class="detail-meta">
                <span class="mr-2">
                  {{ Math.round(media.vote_average * 10) }}%
                </span>
                |
                <span class="ml-2">
                  {{ media.release_date || media.first_air_date }}
                </span>
              </span>
            </v-col>

            <v-col cols="12" sm="7" class="px-0">
              <div class="subtitle-2 detail-genres">
                <span
                  v-for="(item, index) in media.genres"
                  :key="index"
                  class="ml-1"
                >
                  {{ item.name }}
                  <span v-if="media.genres.length - 1 !== index">,</span>
                </span>
              </div>
            </v-col>

            <p class="mt-5 detail-overview subheader">
              {{ media.overview }}
            </p>

            <div class="detail-actions">
              <v-chip
                v-if="hasPersonalSource"
                color="rgba(255, 255, 255, 0.08)"
                text-color="white"
                class="source-chip mr-3 mb-3"
              >
                <v-icon left small>mdi-play-network</v-icon>
                In Your Library
              </v-chip>
              <v-chip
                v-if="
                  continueWatchingEntry && continueWatchingEntry.progressPercent
                "
                color="rgba(229, 9, 20, 0.18)"
                text-color="white"
                class="source-chip mb-3"
              >
                Resume at {{ continueWatchingEntry.progressPercent }}%
              </v-chip>
            </div>

            <div class="mt-5">
              <h2 class="mt-5 section-heading">Featured Cast</h2>
              <div
                :key="index"
                v-for="(crew, index) in media.credits.crew"
                class="mt-5"
              >
                <div v-if="index < 2" class="">
                  <h3>{{ crew.name }}</h3>
                  <span class="detail-supporting-text">{{ crew.job }}</span>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>

        <v-divider class="mt-8"></v-divider>
        <Cast :casts="media.credits.cast" />
        <Images :images="media.images.backdrops" />
      </v-container>
    </div>
  </div>
</template>

<script>
import Cast from "../components/Cast.vue";
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
    Cast,
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
      activeEmbed: false,
      hasRestoredPosition: false,
      lastTrackedSecond: -15,
      pendingAutoplay: false,
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
    isEmbedSource() {
      return this.mediaSource && this.mediaSource.sourceType === "embed";
    },
    continueWatchingEntry() {
      return this.$store.getters.continueWatchingItemByKey(
        this.mediaType,
        this.mediaId,
      );
    },
  },
  watch: {
    requestKey: {
      handler() {
        this.loadMediaDetails();
      },
      immediate: true,
    },
    "$route.query.autoplay"() {
      this.handleAutoplayRequest();
    },
  },
  methods: {
    async loadMediaDetails() {
      this.loading = true;
      this.errorMessage = "";
      this.activeEmbed = false;
      this.hasRestoredPosition = false;
      this.lastTrackedSecond = -15;
      this.pendingAutoplay = false;

      try {
        const response = await this.$http.get(
          `/${this.mediaType}/${this.mediaId}?append_to_response=credits,videos,images`,
        );
        this.media = response.data;
        this.$nextTick(() => {
          this.handleAutoplayRequest();
        });
      } catch (error) {
        this.media = createInitialMedia();
        this.errorMessage = "Unable to load details for this title right now.";
        console.log(error);
      } finally {
        this.loading = false;
      }
    },
    clearAutoplayQuery() {
      if (!this.$route.query.autoplay) {
        return;
      }

      const query = { ...this.$route.query };
      delete query.autoplay;
      this.$router.replace({ path: this.$route.path, query }).catch(() => {});
    },
    handleAutoplayRequest() {
      if (this.$route.query.autoplay !== "1" || !this.hasPersonalSource) {
        return;
      }

      if (this.isEmbedSource) {
        this.activateEmbedPlayer();
        return;
      }

      const player = this.$refs.player;
      if (!player) {
        this.pendingAutoplay = true;
        return;
      }

      if (player.readyState >= 1) {
        this.playNativeVideo();
        return;
      }

      this.pendingAutoplay = true;
    },
    handleLoadedMetadata() {
      const player = this.$refs.player;
      if (!player) {
        return;
      }

      const savedTime = this.continueWatchingEntry
        ? this.continueWatchingEntry.currentTime
        : 0;

      if (
        !this.hasRestoredPosition &&
        savedTime > 0 &&
        Number.isFinite(player.duration) &&
        player.duration > 0
      ) {
        player.currentTime = Math.min(
          savedTime,
          Math.max(player.duration - 5, 0),
        );
        this.hasRestoredPosition = true;
      }

      if (this.pendingAutoplay) {
        this.playNativeVideo();
      }
    },
    playNativeVideo() {
      const player = this.$refs.player;
      if (!player) {
        return;
      }

      this.pendingAutoplay = false;
      this.recordContinueWatching({
        currentTime: player.currentTime || 0,
        duration: player.duration || 0,
        force: true,
      });

      const playAttempt = player.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {});
      }

      this.clearAutoplayQuery();
    },
    activateEmbedPlayer() {
      this.activeEmbed = true;
      this.recordContinueWatching({ force: true });
      this.clearAutoplayQuery();
    },
    handlePlay() {
      const player = this.$refs.player;
      this.recordContinueWatching({
        currentTime: player ? player.currentTime : 0,
        duration: player ? player.duration : 0,
        force: true,
      });
    },
    handleTimeUpdate() {
      const player = this.$refs.player;
      if (!player) {
        return;
      }

      const currentSecond = Math.floor(player.currentTime || 0);
      if (currentSecond > 0 && currentSecond - this.lastTrackedSecond < 15) {
        return;
      }

      this.lastTrackedSecond = currentSecond;
      this.recordContinueWatching({
        currentTime: player.currentTime,
        duration: player.duration,
      });
    },
    handlePlaybackEnded() {
      this.$store.dispatch(
        "removeContinueWatching",
        `${this.mediaType}-${this.mediaId}`,
      );
    },
    recordContinueWatching({
      currentTime = 0,
      duration = 0,
      force = false,
    } = {}) {
      const progressPercent =
        duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

      if (!force && progressPercent >= 95) {
        this.handlePlaybackEnded();
        return;
      }

      this.$store.dispatch("recordContinueWatching", {
        mediaType: this.mediaType,
        mediaId: this.mediaId,
        title: this.media.title || this.media.name,
        posterPath: this.media.poster_path || "",
        backdropPath: this.media.backdrop_path || "",
        voteAverage: this.media.vote_average || 0,
        playbackLabel:
          progressPercent > 0
            ? `Resume ${progressPercent}%`
            : "Continue Watching",
        currentTime,
        duration,
        progressPercent,
      });
    },
    formatPlaybackTime(totalSeconds) {
      if (!totalSeconds) {
        return "Ready to watch";
      }

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);

      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(
          seconds,
        ).padStart(2, "0")}`;
      }

      return `${minutes}:${String(seconds).padStart(2, "0")}`;
    },
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

.player-shell {
  overflow: hidden;
  border-radius: 18px !important;
  background: linear-gradient(
    180deg,
    rgba(18, 21, 33, 0.95),
    rgba(9, 11, 18, 0.98)
  ) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 26px 60px rgba(0, 0, 0, 0.32);
}

.player-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.player-label {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.player-title {
  color: #ffffff;
  font-size: 1.15rem;
  font-weight: 600;
}

.player-meta {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.native-player-shell {
  background: #000000;
}

.media-player {
  display: block;
  width: 100%;
  max-height: 72vh;
  background: #000000;
}

.iframe-container {
  overflow: hidden;
  padding-top: 56.25%;
  position: relative;
  background: #000000;
}

.iframe-container iframe {
  border: 0;
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
}

.embed-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  padding: 24px;
  background: radial-gradient(
      circle at top,
      rgba(229, 9, 20, 0.18),
      transparent 30%
    ),
    linear-gradient(180deg, rgba(10, 13, 21, 0.95), rgba(6, 8, 14, 0.98));
}

.embed-copy {
  max-width: 420px;
  margin-top: 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.66);
}

.poster-card {
  overflow: hidden;
  border-radius: 16px !important;
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.detail-poster {
  aspect-ratio: 2 / 3;
}

.detail-title {
  color: #ffffff;
}

.detail-meta,
.detail-genres,
.detail-supporting-text {
  color: rgba(255, 255, 255, 0.66);
}

.detail-overview {
  color: rgba(255, 255, 255, 0.82);
  line-height: 1.7;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 18px;
}

.source-chip {
  border-radius: 999px !important;
}

.section-heading {
  color: #ffffff;
}

@media (max-width: 960px) {
  .player-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
