<template>
  <div class="watch-theater-view">
    <!-- Loader -->
    <div v-if="loading" class="d-flex justify-center align-center full-screen-loader">
      <v-progress-circular :size="70" :width="7" color="error" indeterminate></v-progress-circular>
    </div>

    <!-- Error state -->
    <div v-else-if="errorMessage" class="d-flex flex-column justify-center align-center full-screen-error">
      <v-alert outlined type="error" class="mb-4" max-width="400">
        {{ errorMessage }}
      </v-alert>
      <v-btn color="error" @click="goBack" large>Go Back</v-btn>
    </div>

    <!-- Player Screen -->
    <div v-else class="theater-player-container">
      <!-- Floating Top Control Bar (Fades out or stays clean) -->
      <div class="theater-control-bar pa-4 d-flex align-center justify-space-between flex-wrap gap-2">
        <div class="d-flex align-center min-w-0">
          <v-btn icon dark large class="back-btn mr-3" @click="goBack">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <div class="min-w-0">
            <div class="white--text text-h6 font-weight-bold text-truncate media-title">
              {{ media.title || media.name }}
            </div>
            <div v-if="mediaType === 'tv'" class="grey--text text-caption text-truncate episode-subtitle">
              S{{ selectedSeason }}:E{{ selectedEpisode }} - {{ currentEpisodeName }}
            </div>
          </div>
        </div>

        <div class="d-flex align-center flex-wrap gap-2">
          <!-- Server toggle -->
          <div class="d-flex align-center mr-3">
            <span class="grey--text text-caption mr-2 hidden-xs-only">Server:</span>
            <v-btn-toggle v-model="activeProviderId" mandatory dense color="error" class="theater-server-toggle">
              <v-btn
                v-for="prov in availableProviders"
                :key="prov.id"
                :value="prov.id"
                x-small
                text
                class="text-none font-weight-bold"
              >
                {{ prov.name }}
              </v-btn>
            </v-btn-toggle>
          </div>

          <!-- Next Ep button -->
          <v-btn
            v-if="hasNextEpisode"
            color="error"
            depressed
            small
            class="text-none font-weight-bold mr-2"
            @click="playNextEpisode"
          >
            <v-icon left small>mdi-skip-next</v-icon>
            Next Ep
          </v-btn>
        </div>
      </div>

      <!-- Playback screen -->
      <div class="theater-playback-area">
        <!-- Native video player -->
        <div v-if="showNativePlayer" class="native-theater-wrapper">
          <video
            ref="player"
            controls
            autoplay
            playsinline
            preload="metadata"
            class="theater-video-player"
            :poster="backdropPath"
            @loadedmetadata="handleLoadedMetadata"
            @play="handlePlay"
            @timeupdate="handleTimeUpdate"
            @ended="handlePlaybackEnded"
            @playing="clearBufferingCheck"
            @waiting="handleVideoWaiting"
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

          <!-- Native Seek Overlays (FF 10 & Backward 10) -->
          <div class="theater-seek-overlay">
            <v-btn fab dark color="rgba(0, 0, 0, 0.55)" class="seek-btn mx-3" @click="seek(-10)" title="Rewind 10s">
              <v-icon>mdi-rewind-10</v-icon>
            </v-btn>
            <v-btn fab dark color="rgba(0, 0, 0, 0.55)" class="seek-btn mx-3" @click="seek(10)" title="Forward 10s">
              <v-icon>mdi-fast-forward-10</v-icon>
            </v-btn>
          </div>
        </div>

        <!-- Iframe streaming player -->
        <div v-else class="iframe-theater-wrapper">
          <iframe
            v-if="activeIframeUrl"
            allowfullscreen
            allow="autoplay; encrypted-media; picture-in-picture"
            :src="activeIframeUrl"
            class="theater-iframe"
            @load="handleIframeLoaded"
          ></iframe>
        </div>
      </div>

      <!-- Bottom warning tip for public embeds -->
      <div v-if="activeProviderId !== 'personal'" class="theater-tip pa-2 text-center text-caption grey--text">
        <span><strong>Tip:</strong> If you see popups, please use an <strong>ad-blocker</strong> like uBlock Origin.</span>
      </div>
    </div>
  </div>
</template>

<script>
import { getPersonalMediaSource } from "@/data/personalMediaLibrary";

function createInitialMedia() {
  return {
    genres: [],
  };
}

export default {
  name: "WatchView",
  data() {
    return {
      media: createInitialMedia(),
      loading: true,
      errorMessage: "",
      hasRestoredPosition: false,
      lastTrackedSecond: -15,
      bufferingTimeout: null,

      // TV / episode state
      selectedSeason: 1,
      selectedEpisode: 1,
      episodes: [],
      
      // Streaming details
      activeProviderId: "vidlink",
      providers: [
        {
          name: "VidLink",
          id: "vidlink",
          movieUrl: (id) => `https://vidlink.pro/movie/${id}`,
          tvUrl: (id, season, episode) => `https://vidlink.pro/tv/${id}/${season}/${episode}`,
        },
        {
          name: "Vidsrc.to",
          id: "vidsrc_to",
          movieUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
          tvUrl: (id, season, episode) => `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`,
        },
        {
          name: "AutoEmbed",
          id: "autoembed",
          movieUrl: (id) => `https://autoembed.co/movie/tmdb/${id}`,
          tvUrl: (id, season, episode) => `https://autoembed.co/tv/tmdb/${id}-${season}-${episode}`,
        },
        {
          name: "Vidsrc.me",
          id: "vidsrc_me",
          movieUrl: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
          tvUrl: (id, season, episode) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`,
        }
      ]
    };
  },
  computed: {
    mediaType() {
      return this.$route.params.mediaType || "movie";
    },
    mediaId() {
      return this.$route.params.id;
    },
    backdropPath() {
      if (!this.media.backdrop_path) return "";
      return "https://image.tmdb.org/t/p/w1280/" + this.media.backdrop_path;
    },
    mediaSource() {
      return getPersonalMediaSource(this.mediaType, this.mediaId);
    },
    hasPersonalSource() {
      return !!this.mediaSource;
    },
    availableProviders() {
      const list = [];
      if (this.hasPersonalSource) {
        list.push({
          name: "My Library",
          id: "personal",
        });
      }
      return [...list, ...this.providers];
    },
    activeProviderName() {
      const p = this.availableProviders.find(prov => prov.id === this.activeProviderId);
      return p ? p.name : "";
    },
    showNativePlayer() {
      return this.activeProviderId === "personal" &&
             this.mediaSource &&
             this.mediaSource.sourceType === "video";
    },
    activeIframeUrl() {
      if (this.activeProviderId === "personal") {
        return this.mediaSource && this.mediaSource.sourceType === "embed"
          ? this.mediaSource.sourceUrl
          : "";
      }
      const provider = this.providers.find(p => p.id === this.activeProviderId);
      if (!provider) return "";

      if (this.mediaType === "movie") {
        return provider.movieUrl(this.mediaId);
      } else {
        return provider.tvUrl(this.mediaId, this.selectedSeason, this.selectedEpisode);
      }
    },
    currentEpisodeName() {
      if (!this.episodes.length) return "";
      const ep = this.episodes.find(e => e.episode_number === this.selectedEpisode);
      return ep ? ep.name : "";
    },
    hasNextEpisode() {
      if (this.mediaType !== "tv" || !this.episodes.length) return false;
      const lastEpNum = this.episodes[this.episodes.length - 1].episode_number;
      return this.selectedEpisode < lastEpNum;
    },
    continueWatchingEntry() {
      return this.$store.getters.continueWatchingItemByKey(
        this.mediaType,
        this.mediaId,
      );
    }
  },
  watch: {
    activeProviderId() {
      this.recordContinueWatching({ force: true });
      this.startBufferingCheck();
    }
  },
  async mounted() {
    await this.loadPlayDetails();
    window.addEventListener("keydown", this.handleKeyDown);
  },
  beforeDestroy() {
    this.clearBufferingCheck();
    window.removeEventListener("keydown", this.handleKeyDown);
  },
  methods: {
    async loadPlayDetails() {
      this.loading = true;
      this.errorMessage = "";
      this.hasRestoredPosition = false;

      // Default server
      this.activeProviderId = this.hasPersonalSource ? "personal" : "vidlink";

      try {
        const response = await this.$http.get(`/${this.mediaType}/${this.mediaId}`);
        this.media = response.data;

        // Parse Episode bounds for TV
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
            this.selectedSeason = 1;
            this.selectedEpisode = 1;
          }

          await this.fetchEpisodes();
        }

        // Initialize watching record and buffering trigger
        this.recordContinueWatching({ force: true });
        this.startBufferingCheck();
      } catch (error) {
        this.errorMessage = "Unable to start stream at this moment.";
        console.error("Watch loading failed:", error);
      } finally {
        this.loading = false;
      }
    },
    async fetchEpisodes() {
      try {
        const response = await this.$http.get(
          `/tv/${this.mediaId}/season/${this.selectedSeason}`
        );
        this.episodes = response.data.episodes || [];
      } catch (error) {
        console.error("Failed to load episodes in WatchView:", error);
        this.episodes = [];
      }
    },
    goBack() {
      const backPath = this.mediaType === "tv" ? `/show/${this.mediaId}` : `/movie/${this.mediaId}`;
      this.$router.push(backPath).catch(() => {});
    },
    playEpisode(episodeNum) {
      this.selectedEpisode = episodeNum;
      this.recordContinueWatching({ force: true });
      this.startBufferingCheck();
      this.updateUrlParams();
    },
    playNextEpisode() {
      if (this.hasNextEpisode) {
        this.playEpisode(this.selectedEpisode + 1);
      }
    },
    updateUrlParams() {
      const query = {
        ...this.$route.query,
        season: String(this.selectedSeason),
        episode: String(this.selectedEpisode),
      };
      this.$router.replace({ query }).catch(() => {});
    },
    handleLoadedMetadata() {
      const player = this.$refs.player;
      if (!player) return;

      const savedTime = this.continueWatchingEntry ? this.continueWatchingEntry.currentTime : 0;
      if (savedTime > 0 && Number.isFinite(player.duration)) {
        player.currentTime = Math.min(savedTime, Math.max(player.duration - 5, 0));
        this.hasRestoredPosition = true;
      }
    },
    handlePlay() {
      const player = this.$refs.player;
      this.recordContinueWatching({
        currentTime: player ? player.currentTime : 0,
        duration: player ? player.duration : 0,
        force: true,
      });
      this.clearBufferingCheck();
    },
    handleTimeUpdate() {
      const player = this.$refs.player;
      if (!player) return;

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
      this.$store.dispatch("removeContinueWatching", `${this.mediaType}-${this.mediaId}`);
    },
    recordContinueWatching({ currentTime = 0, duration = 0, force = false } = {}) {
      const isPublicEmbed = this.activeProviderId !== "personal";
      let progressPercent = 0;
      let playbackLabel = "Continue Watching";

      if (isPublicEmbed) {
        if (this.mediaType === "tv") {
          playbackLabel = `S${this.selectedSeason}:E${this.selectedEpisode}`;
        } else {
          playbackLabel = "Watch Now";
        }
      } else {
        progressPercent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
        if (!force && progressPercent >= 95) {
          this.handlePlaybackEnded();
          return;
        }
        playbackLabel = progressPercent > 0 ? `Resume ${progressPercent}%` : "Continue Watching";
      }

      this.$store.dispatch("recordContinueWatching", {
        mediaType: this.mediaType,
        mediaId: this.mediaId,
        title: this.media.title || this.media.name,
        posterPath: this.media.poster_path || "",
        backdropPath: this.media.backdrop_path || "",
        voteAverage: this.media.vote_average || 0,
        playbackLabel,
        currentTime: isPublicEmbed ? 0 : currentTime,
        duration: isPublicEmbed ? 0 : duration,
        progressPercent,
        season: this.mediaType === "tv" ? this.selectedSeason : undefined,
        episode: this.mediaType === "tv" ? this.selectedEpisode : undefined,
      });
    },
    
    // Server Buffering Timeout Logic
    startBufferingCheck() {
      this.clearBufferingCheck();
      
      // Set a 20-second timeout. If the server does not load/start within 20 seconds, we auto-load the next provider.
      if (this.activeProviderId !== "personal") {
        this.bufferingTimeout = setTimeout(() => {
          this.autoSwitchProvider();
        }, 20000); 
      }
    },
    clearBufferingCheck() {
      if (this.bufferingTimeout) {
        clearTimeout(this.bufferingTimeout);
        this.bufferingTimeout = null;
      }
    },
    handleVideoWaiting() {
      this.clearBufferingCheck();
      // Native player stalled/waiting - auto switch to fallback after 12 seconds
      this.bufferingTimeout = setTimeout(() => {
        this.autoSwitchProvider();
      }, 12000);
    },
    handleIframeLoaded() {
      // Clear the loading/buffering timeout once the iframe document loads
      this.clearBufferingCheck();
    },
    autoSwitchProvider() {
      const currentIdx = this.availableProviders.findIndex(p => p.id === this.activeProviderId);
      if (currentIdx !== -1 && currentIdx < this.availableProviders.length - 1) {
        const nextProvider = this.availableProviders[currentIdx + 1];
        console.log(`Connection stalled. Auto-switching to server: ${nextProvider.name}`);
        this.activeProviderId = nextProvider.id;
      }
    },

    // Native Video Controls (seeking)
    seek(secs) {
      const player = this.$refs.player;
      if (player) {
        player.currentTime = Math.max(0, Math.min(player.duration || 0, player.currentTime + secs));
      }
    },
    handleKeyDown(e) {
      // Ignore key events inside inputs
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      if (this.showNativePlayer) {
        const player = this.$refs.player;
        if (!player) return;

        if (e.key === "ArrowLeft") {
          e.preventDefault();
          this.seek(-10);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          this.seek(10);
        } else if (e.key === " ") {
          e.preventDefault();
          if (player.paused) {
            player.play();
          } else {
            player.pause();
          }
        }
      }
    }
  }
};
</script>

<style scoped>
.watch-theater-view {
  background: #000000;
  width: 100vw;
  height: 100vh;
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.full-screen-loader,
.full-screen-error {
  width: 100%;
  height: 100%;
  background: #000000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.theater-player-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Floating controls bar at the top */
.theater-control-bar {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0) 100%);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  transition: opacity 0.3s ease;
}

.back-btn {
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(8px);
}

.media-title {
  font-size: 1.15rem;
  line-height: 1.2;
}

.theater-server-toggle {
  background-color: rgba(255, 255, 255, 0.08) !important;
  border-radius: 8px;
  padding: 2px;
  backdrop-filter: blur(8px);
}

.theater-server-toggle .v-btn {
  color: rgba(255, 255, 255, 0.7) !important;
  border-radius: 6px !important;
  border: none !important;
}

.theater-server-toggle .v-btn--active {
  background-color: #ff5252 !important;
  color: white !important;
}

/* Immersive video wrapper */
.theater-playback-area {
  flex: 1;
  width: 100%;
  height: 100%;
  background: #000000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.native-theater-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.iframe-theater-wrapper {
  width: 100%;
  height: 100%;
}

.theater-video-player,
.theater-iframe {
  width: 100%;
  height: 100%;
  border: 0;
  background: #000000;
  display: block;
}

/* Native Video seek overlay */
.theater-seek-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.25s ease;
  background: rgba(0, 0, 0, 0.2);
}

.native-theater-wrapper:hover .theater-seek-overlay {
  opacity: 1;
}

.seek-btn {
  pointer-events: auto;
  background: rgba(8, 10, 18, 0.6) !important;
  backdrop-filter: blur(6px);
  transition: transform 0.2s ease !important;
}

.seek-btn:hover {
  transform: scale(1.1) !important;
  background: rgba(8, 10, 18, 0.8) !important;
}

.theater-tip {
  background: rgba(0, 0, 0, 0.85);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 5;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.gap-2 {
  gap: 8px;
}

.gap-4 {
  gap: 16px;
}

.min-w-0 {
  min-width: 0;
}

.max-w-250 {
  max-width: 250px;
}
</style>
