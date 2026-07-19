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
        <!-- Player Card -->
        <v-card flat class="player-shell mb-6" :class="{ 'cinema-mode-active': cinemaMode }">
          <div class="player-header">
            <div>
              <div class="player-label">
                Now Watching: {{ activeProviderId === 'personal' ? 'Private Server' : 'Server ' + activeProviderName }}
              </div>
              <div class="player-title">
                {{ media.title || media.name }}
                <span v-if="mediaType === 'tv'" class="episode-title-addon red--text text--lighten-1 ml-2">
                  S{{ selectedSeason }}:E{{ selectedEpisode }}
                </span>
              </div>
            </div>
            <div class="player-meta text-right">
              <span v-if="mediaType === 'tv' && currentEpisodeName" class="d-block text-truncate max-w-250">
                {{ currentEpisodeName }}
              </span>
              <span v-else>Ready to watch</span>
            </div>
          </div>

          <!-- Playback Screen -->
          <div v-if="showNativePlayer" class="native-player-shell">
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

          <!-- Iframe Player (Embed / Public Providers) -->
          <div v-else class="iframe-container-wrapper">
            <div v-if="activeEmbed" class="iframe-container">
              <iframe
                allowfullscreen
                allow="autoplay; encrypted-media; picture-in-picture"
                :src="activeIframeUrl"
                class="stream-iframe"
              ></iframe>
            </div>
            <div v-else class="embed-placeholder" :style="placeholderStyle">
              <v-btn color="error" fab x-large depressed @click="activateEmbedPlayer" class="play-btn-glow">
                <v-icon large color="white">mdi-play</v-icon>
              </v-btn>
              <h3 class="mt-4 mb-1 white--text text-center px-4">
                {{ media.title || media.name }}
              </h3>
              <p v-if="mediaType === 'tv'" class="grey--text text--lighten-1 subtitle-2 mb-0">
                Season {{ selectedSeason }}, Episode {{ selectedEpisode }}
              </p>
              <p v-else class="grey--text text--lighten-1 subtitle-2 mb-0">
                Click to start streaming
              </p>
            </div>
          </div>

          <!-- Server & Player Settings Switching Bar -->
          <div class="provider-switch pa-3 d-flex align-center flex-wrap">
            <span class="grey--text text--lighten-1 subtitle-2 mr-3">Server:</span>
            <v-btn-toggle v-model="activeProviderId" mandatory dense color="error" class="server-toggle-group mr-2">
              <v-btn
                v-for="prov in availableProviders"
                :key="prov.id"
                :value="prov.id"
                small
                text
                class="text-none font-weight-bold"
              >
                {{ prov.name }}
              </v-btn>
            </v-btn-toggle>

            <!-- Next Episode quick link (TV Shows) -->
            <v-btn
              v-if="hasNextEpisode"
              color="error"
              outlined
              x-small
              class="text-none font-weight-bold mr-2"
              @click="playNextEpisode"
            >
              <v-icon left x-small>mdi-skip-next</v-icon>
              Next Ep
            </v-btn>

            <v-spacer></v-spacer>

            <!-- Cinema Mode Toggle -->
            <v-btn icon small @click="cinemaMode = !cinemaMode" color="white" title="Cinema Mode">
              <v-icon>{{ cinemaMode ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
            </v-btn>
          </div>
        </v-card>

        <!-- Ad blocker notification tip -->
        <v-alert v-if="activeProviderId !== 'personal'" dense text type="info" class="adblocker-alert mb-6">
          <div class="d-flex align-center justify-space-between flex-wrap text-caption text-sm-body-2">
            <span><strong>Tip:</strong> We source streams from high-quality public providers. We highly recommend using an <strong>ad-blocker</strong> (like uBlock Origin) to prevent advertisements.</span>
          </div>
        </v-alert>

        <!-- TV Episodes Listing Section -->
        <v-card v-if="mediaType === 'tv'" class="episodes-card pa-4 mb-6" flat>
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

        <!-- Media Info & Details -->
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

            <v-col class="px-0">
              <v-rating
                :value="media.vote_average / 2"
                color="amber"
                dense
                half-increments
                readonly
                size="16"
              >
              </v-rating>
            </v-col>

            <v-col class="px-0">
              <span class="detail-meta">
                <span class="mr-2">
                  {{ Math.round(media.vote_average * 10) }}% Match
                </span>
                |
                <span class="ml-2 mr-2">
                  {{ media.release_date || media.first_air_date }}
                </span>
                <span v-if="media.runtime || media.episode_run_time">
                  |
                  <span class="ml-2">
                    {{ media.runtime ? media.runtime + ' min' : media.episode_run_time[0] + ' min/ep' }}
                  </span>
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
              <!-- Watchlist Toggle -->
              <v-btn
                :color="isInMyView ? 'success' : 'error'"
                outlined
                rounded
                class="mr-3 mb-3 text-none"
                @click="toggleMyView"
              >
                <v-icon left small>
                  {{ isInMyView ? 'mdi-check' : 'mdi-plus' }}
                </v-icon>
                {{ isInMyView ? 'Saved in My View' : 'Add to My View' }}
              </v-btn>

              <v-chip
                v-if="hasPersonalSource"
                color="rgba(255, 255, 255, 0.08)"
                text-color="white"
                class="source-chip mr-3 mb-3"
              >
                <v-icon left small>mdi-play-network</v-icon>
                Private Link Available
              </v-chip>
            </div>

            <div class="mt-5">
              <h2 class="mt-5 section-heading">Featured Cast</h2>
              <div
                :key="index"
                v-for="(crew, index) in media.credits.crew"
                class="mt-3"
              >
                <div v-if="index < 2">
                  <h4 class="white--text mb-0">{{ crew.name }}</h4>
                  <span class="detail-supporting-text text-caption">{{ crew.job }}</span>
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

      // Streaming & TV customizations
      activeProviderId: "vidlink",
      selectedSeason: 1,
      selectedEpisode: 1,
      episodes: [],
      loadingEpisodes: false,
      cinemaMode: false,
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
    showNativePlayer() {
      return this.activeProviderId === "personal" &&
             this.mediaSource &&
             this.mediaSource.sourceType === "video";
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
    isInMyView() {
      return !!this.$store.getters.myViewItemByKey(this.mediaType, this.mediaId);
    },
    placeholderStyle() {
      const url = this.backdropPath || this.posterPath;
      if (!url) return {};
      return {
        background: `linear-gradient(rgba(10, 13, 21, 0.75), rgba(6, 8, 14, 0.9)), url(${url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
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
    "$route.query.autoplay"() {
      this.handleAutoplayRequest();
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
    },
    activeProviderId(newVal) {
      // If user switches provider and embed was active, re-trigger watching save
      if (this.activeEmbed) {
        this.recordContinueWatching({ force: true });
      }
      
      // Auto-enable activeEmbed if they switch from Native player to public servers
      if (newVal !== "personal" && !this.activeEmbed) {
        this.activeEmbed = true;
      }
    }
  },
  methods: {
    async loadMediaDetails() {
      this.loading = true;
      this.errorMessage = "";
      this.activeEmbed = false;
      this.hasRestoredPosition = false;
      this.lastTrackedSecond = -15;
      this.pendingAutoplay = false;

      // Set default provider based on availability
      this.activeProviderId = this.hasPersonalSource ? "personal" : "vidlink";

      try {
        const response = await this.$http.get(
          `/${this.mediaType}/${this.mediaId}?append_to_response=credits,videos,images`,
        );
        this.media = response.data;

        // Seasons & Episode initialization for TV
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
      
      // Update URL query parameters
      this.updateUrlParams();
      
      if (this.activeEmbed) {
        this.recordContinueWatching({ force: true });
      }
    },
    playEpisode(episodeNum) {
      this.selectedEpisode = episodeNum;
      
      // Start embed playing immediately when an episode is clicked
      this.activeEmbed = true;
      this.recordContinueWatching({ force: true });
      
      // Update URL query parameters
      this.updateUrlParams();

      // Scroll to player smoothly
      this.$nextTick(() => {
        const playerShell = this.$el.querySelector(".player-shell");
        if (playerShell) {
          playerShell.scrollIntoView({ behavior: "smooth" });
        }
      });
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
    episodeStillUrl(stillPath) {
      if (!stillPath) {
        return this.backdropPath || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500";
      }
      return `https://image.tmdb.org/t/p/w300/${stillPath}`;
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
      if (this.$route.query.autoplay !== "1") {
        return;
      }

      if (this.isEmbedSource || this.activeProviderId !== "personal") {
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
        // Custom Tv bindings
        season: this.mediaType === "tv" ? this.selectedSeason : undefined,
        episode: this.mediaType === "tv" ? this.selectedEpisode : undefined,
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
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
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
  max-width: 300px;
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

.iframe-container-wrapper {
  background: #000000;
  position: relative;
}

.iframe-container {
  overflow: hidden;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
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
  min-height: 380px;
  padding: 32px;
  position: relative;
}

.play-btn-glow {
  box-shadow: 0 0 0 0 rgba(229, 9, 20, 0.7);
  animation: pulse-glow 2s infinite;
  transition: transform 0.2s ease !important;
}

.play-btn-glow:hover {
  transform: scale(1.1) !important;
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

.provider-switch {
  background: rgba(8, 10, 18, 0.85);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.server-toggle-group {
  background-color: rgba(255, 255, 255, 0.04) !important;
  border-radius: 8px;
  padding: 2px;
}

.server-toggle-group .v-btn {
  border-radius: 6px !important;
  color: rgba(255, 255, 255, 0.7) !important;
  border: none !important;
}

.server-toggle-group .v-btn--active {
  background-color: #ff5252 !important;
  color: white !important;
}

.adblocker-alert {
  border-radius: 12px !important;
  background-color: rgba(33, 150, 243, 0.08) !important;
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

/* TV episodes section styling */
.episodes-card {
  border-radius: 18px !important;
  background: linear-gradient(
    180deg,
    rgba(18, 21, 33, 0.75),
    rgba(10, 13, 22, 0.88)
  ) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
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

.w-100 {
  width: 100%;
}

.max-w-250 {
  max-width: 250px;
}

/* Cinema mode media queries */
@media (min-width: 960px) {
  .player-shell.cinema-mode-active {
    margin-left: calc(-50vw + 50%);
    margin-right: calc(-50vw + 50%);
    width: 100vw;
    max-width: 100vw;
    border-radius: 0px !important;
    border-left: none;
    border-right: none;
  }
  
  .player-shell.cinema-mode-active .media-player {
    max-height: 80vh;
  }
}

@media (max-width: 960px) {
  .player-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px 14px;
    gap: 4px;
  }
  
  .player-meta {
    text-align: left !important;
  }
}
</style>
