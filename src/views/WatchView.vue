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
    <div
      v-else
      class="theater-player-container"
      @mousemove="resetControlsTimer"
      @touchstart="resetControlsTimer"
    >
      <!-- Floating Top Control Bar -->
      <div
        :class="[
          'theater-control-bar pa-4 d-flex align-center justify-space-between flex-wrap gap-2',
          { 'controls-hidden': controlsHidden && !showEpisodeDrawer }
        ]"
      >
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

          <!-- Next Server quick button -->
          <v-btn
            small
            depressed
            color="rgba(0, 229, 255, 0.15)"
            class="cyan--text text--accent-2 text-none font-weight-bold mr-2"
            title="Switch to next stream server"
            @click="autoSwitchProvider"
          >
            <v-icon left x-small color="#00E5FF">mdi-skip-next</v-icon>
            Next Server
          </v-btn>

          <!-- Quick Episode Drawer toggle (TV Series only) -->
          <v-btn
            v-if="mediaType === 'tv'"
            color="rgba(255, 255, 255, 0.12)"
            depressed
            small
            class="text-none font-weight-bold mr-2 episode-drawer-btn"
            @click="toggleEpisodeDrawer"
          >
            <v-icon left small>mdi-playlist-play</v-icon>
            Episodes
          </v-btn>

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

      <!-- Server switch notification pill -->
      <transition name="fade">
        <div v-if="showSwitchToast" class="theater-switch-toast pa-3 px-4 d-flex align-center">
          <v-icon small color="#00E5FF" class="mr-2">mdi-server-network</v-icon>
          <span class="white--text caption font-weight-medium">{{ switchToastMessage }}</span>
        </div>
      </transition>

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
            <v-btn fab dark color="rgba(0, 0, 0, 0.55)" class="seek-btn mx-3" @click="triggerQuickSeek(-10)" title="Rewind 10s">
              <v-icon>mdi-rewind-10</v-icon>
            </v-btn>
            <v-btn fab dark color="rgba(0, 0, 0, 0.55)" class="seek-btn mx-3" @click="triggerQuickSeek(10)" title="Forward 10s">
              <v-icon>mdi-fast-forward-10</v-icon>
            </v-btn>
          </div>

          <!-- Quick Seek Visual Feedback Indicators -->
          <transition name="scale">
            <div v-if="showRewindIndicator" class="quick-seek-feedback rewind-feedback">
              <v-icon large color="white">mdi-rewind-10</v-icon>
              <span class="caption white--text font-weight-bold">-10s</span>
            </div>
          </transition>
          <transition name="scale">
            <div v-if="showForwardIndicator" class="quick-seek-feedback forward-feedback">
              <v-icon large color="white">mdi-fast-forward-10</v-icon>
              <span class="caption white--text font-weight-bold">+10s</span>
            </div>
          </transition>

          <!-- Netflix-Style Autoplay Countdown Card overlay -->
          <v-fade-transition>
            <div v-if="showNextEpisodeCountdown" class="netflix-autoplay-overlay pa-4">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="white--text font-weight-bold body-2">Next Episode in {{ countdownSeconds }}s</span>
                <v-btn icon x-small dark @click="cancelAutoplay" title="Cancel autoplay">
                  <v-icon x-small>mdi-close</v-icon>
                </v-btn>
              </div>
              <div class="next-ep-details d-flex align-center mb-3">
                <v-img :src="nextEpisodeStill" width="100" height="56" class="rounded mr-3" cover></v-img>
                <div class="min-w-0 flex-grow-1">
                  <div class="white--text text-caption font-weight-bold text-truncate">
                    S{{ selectedSeason }}:E{{ selectedEpisode + 1 }}
                  </div>
                  <div class="grey--text text-caption text-truncate">
                    {{ nextEpisodeName }}
                  </div>
                </div>
              </div>
              <v-btn color="error" block small class="text-none font-weight-bold" @click="triggerNextEpisodeNow">
                Play Now
              </v-btn>
            </div>
          </v-fade-transition>
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

      <!-- Bottom warning tip for public embeds (auto-dismisses after 7s to unblock controls) -->
      <transition name="fade">
        <div
          v-if="showTheaterTip && activeProviderId !== 'personal'"
          class="theater-tip pa-2 d-flex align-center justify-center text-caption grey--text"
        >
          <span><strong>Tip:</strong> If you see popups, please use an <strong>ad-blocker</strong> like uBlock Origin.</span>
          <v-btn icon x-small class="ml-2 grey--text" @click="showTheaterTip = false" title="Dismiss">
            <v-icon x-small>mdi-close</v-icon>
          </v-btn>
        </div>
      </transition>

      <!-- In-Player Quick Episode Drawer (TV series) -->
      <transition name="drawer-slide">
        <div v-if="showEpisodeDrawer && mediaType === 'tv'" class="theater-episode-drawer">
          <div class="drawer-header pa-4 d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon color="#00E5FF" class="mr-2">mdi-playlist-play</v-icon>
              <span class="white--text font-weight-bold text-subtitle-1">Episodes</span>
            </div>
            <v-btn icon small dark @click="showEpisodeDrawer = false" title="Close drawer">
              <v-icon small>mdi-close</v-icon>
            </v-btn>
          </div>

          <!-- Season Selector -->
          <div class="px-4 pb-3">
            <v-select
              v-model="selectedSeason"
              :items="seasonOptions"
              label="Season"
              dense
              outlined
              dark
              hide-details
              class="theater-season-select"
              @change="handleSeasonChange"
            ></v-select>
          </div>

          <!-- Episodes list -->
          <div class="drawer-episode-list pa-4 pt-0">
            <div v-if="loadingSeasonEpisodes" class="d-flex justify-center py-8">
              <v-progress-circular indeterminate color="#00E5FF" size="32"></v-progress-circular>
            </div>
            <div v-else-if="!episodes.length" class="text-center py-8 grey--text text-caption">
              No episodes found for Season {{ selectedSeason }}.
            </div>
            <div v-else class="episode-list-items">
              <div
                v-for="ep in episodes"
                :key="ep.id"
                :class="[
                  'drawer-episode-item mb-2 pa-2 d-flex align-center',
                  { 'active-episode-item': ep.episode_number === selectedEpisode }
                ]"
                @click="selectDrawerEpisode(ep.episode_number)"
              >
                <div class="drawer-ep-thumb-wrapper mr-3">
                  <v-img
                    :src="episodeStillUrl(ep.still_path)"
                    width="80"
                    height="48"
                    class="rounded"
                    cover
                  >
                    <div
                      v-if="ep.episode_number === selectedEpisode"
                      class="drawer-thumb-playing d-flex align-center justify-center"
                    >
                      <v-icon small color="#00E5FF">mdi-play</v-icon>
                    </div>
                  </v-img>
                </div>
                <div class="min-w-0 flex-grow-1">
                  <div class="d-flex align-center justify-space-between gap-1 mb-1">
                    <span class="white--text text-caption font-weight-bold text-truncate">
                      E{{ ep.episode_number }}. {{ ep.name }}
                    </span>
                    <span v-if="ep.episode_number === selectedEpisode" class="drawer-playing-chip">
                      Playing
                    </span>
                  </div>
                  <div class="grey--text text-caption text-truncate">
                    {{ ep.air_date || (ep.overview ? ep.overview : '') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Episode Drawer Backdrop -->
      <transition name="fade">
        <div
          v-if="showEpisodeDrawer && mediaType === 'tv'"
          class="theater-drawer-backdrop"
          @click="showEpisodeDrawer = false"
        ></div>
      </transition>
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
      
      // Autoplay Countdown
      showNextEpisodeCountdown: false,
      countdownSeconds: 15,
      countdownInterval: null,
      autoplayCancelled: false,

      // Streaming details
      activeProviderId: localStorage.getItem("preferred_stream_server") || "vidlink",
      providers: [
        {
          name: "VidLink",
          id: "vidlink",
          movieUrl: (id) => `https://vidlink.pro/movie/${id}`,
          tvUrl: (id, season, episode) => `https://vidlink.pro/tv/${id}/${season}/${episode}`,
        },
        {
          name: "Embed.su",
          id: "embed_su",
          movieUrl: (id) => `https://embed.su/embed/movie/${id}`,
          tvUrl: (id, season, episode) => `https://embed.su/embed/tv/${id}/${season}/${episode}`,
        },
        {
          name: "2Embed",
          id: "twoembed",
          movieUrl: (id) => `https://www.2embed.cc/embed/${id}`,
          tvUrl: (id, season, episode) => `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`,
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
      ],

      // Source Switch Toast Notification
      showSwitchToast: false,
      switchToastMessage: "",
      switchToastTimer: null,

      // Bottom Tip Auto-dismiss
      showTheaterTip: true,
      tipTimer: null,

      // Episode drawer
      showEpisodeDrawer: false,
      loadingSeasonEpisodes: false,

      // Controls Auto-Hide
      controlsHidden: false,
      controlsTimer: null,

      // Seek feedback
      showRewindIndicator: false,
      showForwardIndicator: false,
      seekIndicatorTimer: null
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
    nextEpisode() {
      if (this.mediaType !== "tv" || !this.episodes.length) return null;
      return this.episodes.find(e => e.episode_number === this.selectedEpisode + 1);
    },
    nextEpisodeName() {
      return this.nextEpisode ? this.nextEpisode.name : "Next Episode";
    },
    nextEpisodeStill() {
      if (this.nextEpisode && this.nextEpisode.still_path) {
        return `https://image.tmdb.org/t/p/w300/${this.nextEpisode.still_path}`;
      }
      return this.backdropPath;
    },
    seasonOptions() {
      if (!this.media || !this.media.seasons) {
        return [{ text: `Season ${this.selectedSeason}`, value: this.selectedSeason }];
      }
      const valid = this.media.seasons
        .filter(s => s.season_number > 0)
        .map(s => ({
          text: s.name || `Season ${s.season_number}`,
          value: s.season_number,
        }))
        .sort((a, b) => a.value - b.value);
      return valid.length > 0 ? valid : [{ text: `Season ${this.selectedSeason}`, value: this.selectedSeason }];
    },
    continueWatchingEntry() {
      return this.$store.getters.continueWatchingItemByKey(
        this.mediaType,
        this.mediaId,
      );
    }
  },
  watch: {
    activeProviderId(newVal) {
      if (newVal && newVal !== "personal") {
        try {
          localStorage.setItem("preferred_stream_server", newVal);
        } catch (e) {
          // ignore storage error
        }
      }
      this.recordContinueWatching({ force: true });
      this.startBufferingCheck();
    }
  },
  async mounted() {
    await this.loadPlayDetails();
    this.resetControlsTimer();
    window.addEventListener("keydown", this.handleKeyDown);
  },
  beforeDestroy() {
    this.clearBufferingCheck();
    this.clearCountdown();
    if (this.tipTimer) clearTimeout(this.tipTimer);
    if (this.switchToastTimer) clearTimeout(this.switchToastTimer);
    if (this.controlsTimer) clearTimeout(this.controlsTimer);
    if (this.seekIndicatorTimer) clearTimeout(this.seekIndicatorTimer);
    window.removeEventListener("keydown", this.handleKeyDown);
  },
  methods: {
    async loadPlayDetails() {
      this.loading = true;
      this.errorMessage = "";
      this.hasRestoredPosition = false;
      this.autoplayCancelled = false;
      this.showNextEpisodeCountdown = false;
      this.clearCountdown();

      // Show tip briefly, then auto-dismiss after 7 seconds
      this.showTheaterTip = true;
      if (this.tipTimer) clearTimeout(this.tipTimer);
      this.tipTimer = setTimeout(() => {
        this.showTheaterTip = false;
      }, 7000);

      // Default or preferred server from localStorage
      const savedServer = localStorage.getItem("preferred_stream_server");
      const validServer = this.providers.some(p => p.id === savedServer);
      this.activeProviderId = this.hasPersonalSource
        ? "personal"
        : (validServer ? savedServer : "vidlink");

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
      this.autoplayCancelled = false;
      this.showNextEpisodeCountdown = false;
      this.clearCountdown();
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

      // Autoplay next episode triggers when 15 seconds or less are remaining
      const timeLeft = player.duration - player.currentTime;
      if (this.mediaType === "tv" && this.hasNextEpisode && timeLeft <= 15 && timeLeft > 0) {
        if (!this.showNextEpisodeCountdown && !this.autoplayCancelled) {
          this.startAutoplayCountdown();
        }
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
      this.$store.dispatch("removeContinueWatching", `${this.mediaType}-${this.mediaId}`);
      this.$store.dispatch("markAsWatched", {
        mediaType: this.mediaType,
        mediaId: this.mediaId,
        title: this.media.title || this.media.name,
      });
      if (this.mediaType === "tv" && this.hasNextEpisode && !this.autoplayCancelled) {
        this.triggerNextEpisodeNow();
      }
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
    
    // Netflix Autoplay Countdown Methods
    startAutoplayCountdown() {
      this.showNextEpisodeCountdown = true;
      this.countdownSeconds = 15;
      this.clearCountdown();
      this.countdownInterval = setInterval(() => {
        this.countdownSeconds--;
        if (this.countdownSeconds <= 0) {
          this.clearCountdown();
          this.triggerNextEpisodeNow();
        }
      }, 1000);
    },
    clearCountdown() {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
    },
    cancelAutoplay() {
      this.clearCountdown();
      this.showNextEpisodeCountdown = false;
      this.autoplayCancelled = true;
    },
    triggerNextEpisodeNow() {
      this.clearCountdown();
      this.showNextEpisodeCountdown = false;
      this.playNextEpisode();
    },

    // Server Buffering Timeout Logic
    startBufferingCheck() {
      this.clearBufferingCheck();
      
      if (this.activeProviderId !== "personal") {
        this.bufferingTimeout = setTimeout(() => {
          this.autoSwitchProvider();
        }, 16000); 
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
      this.bufferingTimeout = setTimeout(() => {
        this.autoSwitchProvider();
      }, 10000);
    },
    handleIframeLoaded() {
      // Cross-origin iframes load their initial HTML shell in 500ms before video buffers.
      // Do not prematurely cancel the watchdog; keep a 14s timer to auto-switch if stream hangs.
      this.clearBufferingCheck();
      if (this.activeProviderId !== "personal") {
        this.bufferingTimeout = setTimeout(() => {
          this.autoSwitchProvider();
        }, 14000);
      }
    },
    autoSwitchProvider() {
      const currentIdx = this.availableProviders.findIndex(p => p.id === this.activeProviderId);
      if (currentIdx !== -1 && this.availableProviders.length > 1) {
        const nextIdx = (currentIdx + 1) % this.availableProviders.length;
        const nextProvider = this.availableProviders[nextIdx];
        
        // Show unobtrusive toast notification
        this.switchToastMessage = `Buffering: Auto-switched to ${nextProvider.name}`;
        this.showSwitchToast = true;
        if (this.switchToastTimer) clearTimeout(this.switchToastTimer);
        this.switchToastTimer = setTimeout(() => {
          this.showSwitchToast = false;
        }, 4000);

        this.activeProviderId = nextProvider.id;
        this.startBufferingCheck();
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
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      if (this.showNativePlayer) {
        const player = this.$refs.player;
        if (!player) return;

        if (e.key === "ArrowLeft") {
          e.preventDefault();
          this.triggerQuickSeek(-10);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          this.triggerQuickSeek(10);
        } else if (e.key === " ") {
          e.preventDefault();
          if (player.paused) {
            player.play();
          } else {
            player.pause();
          }
        }
      }
    },

    // In-Player Quick Episode Drawer & Seeking Methods
    toggleEpisodeDrawer() {
      this.showEpisodeDrawer = !this.showEpisodeDrawer;
      if (this.showEpisodeDrawer) {
        this.resetControlsTimer();
      }
    },
    async handleSeasonChange(newSeason) {
      this.selectedSeason = Number(newSeason);
      this.loadingSeasonEpisodes = true;
      await this.fetchEpisodes();
      this.loadingSeasonEpisodes = false;
      if (this.episodes.length > 0) {
        this.playEpisode(this.episodes[0].episode_number);
      }
    },
    selectDrawerEpisode(episodeNum) {
      this.playEpisode(episodeNum);
      this.showEpisodeDrawer = false;
    },
    episodeStillUrl(stillPath) {
      if (stillPath) {
        return `https://image.tmdb.org/t/p/w300/${stillPath}`;
      }
      return this.backdropPath || "";
    },
    triggerQuickSeek(secs) {
      this.seek(secs);
      if (secs < 0) {
        this.showRewindIndicator = true;
        this.showForwardIndicator = false;
      } else {
        this.showForwardIndicator = true;
        this.showRewindIndicator = false;
      }
      if (this.seekIndicatorTimer) clearTimeout(this.seekIndicatorTimer);
      this.seekIndicatorTimer = setTimeout(() => {
        this.showRewindIndicator = false;
        this.showForwardIndicator = false;
      }, 750);
      this.resetControlsTimer();
    },
    resetControlsTimer() {
      this.controlsHidden = false;
      if (this.controlsTimer) clearTimeout(this.controlsTimer);
      if (!this.showEpisodeDrawer) {
        this.controlsTimer = setTimeout(() => {
          this.controlsHidden = true;
        }, 4000);
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
  transition: opacity 0.4s ease;
}

.theater-control-bar.controls-hidden {
  opacity: 0;
  pointer-events: none;
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

/* Netflix-Style Autoplay Countdown Overlay Card */
.netflix-autoplay-overlay {
  position: absolute;
  bottom: 80px;
  right: 24px;
  z-index: 100;
  width: 290px;
  background: rgba(14, 17, 26, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  pointer-events: auto;
}

.theater-tip {
  background: rgba(0, 0, 0, 0.88);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.theater-switch-toast {
  position: absolute;
  top: 75px;
  right: 24px;
  z-index: 100;
  background: rgba(14, 18, 30, 0.95);
  border: 1px solid rgba(0, 229, 255, 0.35);
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  pointer-events: none;
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

@media (max-width: 600px) {
  .netflix-autoplay-overlay {
    right: 12px;
    left: 12px;
    bottom: 70px;
    width: auto;
  }
}

.episode-drawer-btn {
  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 8px !important;
  backdrop-filter: blur(8px);
}

/* Slide-out Episode Drawer */
.theater-episode-drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 380px;
  max-width: 88vw;
  z-index: 200;
  background: rgba(10, 14, 24, 0.96);
  border-left: 1px solid rgba(0, 229, 255, 0.2);
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
}

.theater-drawer-backdrop {
  position: absolute;
  inset: 0;
  z-index: 190;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
}

.drawer-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.drawer-episode-list {
  flex: 1;
  overflow-y: auto;
}

.drawer-episode-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
}

.drawer-episode-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(0, 229, 255, 0.3);
  transform: translateX(-2px);
}

.active-episode-item {
  background: rgba(0, 229, 255, 0.1) !important;
  border-color: rgba(0, 229, 255, 0.5) !important;
}

.drawer-ep-thumb-wrapper {
  position: relative;
  flex-shrink: 0;
}

.drawer-thumb-playing {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
}

.drawer-playing-chip {
  background: #00E5FF;
  color: #000;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

/* Quick seek feedback animations */
.quick-seek-feedback {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  padding: 16px 20px;
  border-radius: 16px;
  pointer-events: none;
  z-index: 50;
  backdrop-filter: blur(6px);
}

.rewind-feedback {
  left: 20%;
}

.forward-feedback {
  right: 20%;
}

/* Drawer slide transitions */
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.drawer-slide-enter,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
