<template>
  <div class="together-player">
    <div class="playback-status pa-3" role="status" aria-live="polite">
      <strong :class="connected ? 'cyan--text' : 'amber--text'">{{ connected ? 'Room connected' : 'Reconnecting to room…' }}</strong>
      <span class="grey--text text--lighten-1 ml-2">{{ statusText }}</span>
    </div>
    <v-alert v-if="error" dense outlined type="warning" class="ma-3">{{ error }} <v-btn v-if="provider === 'native'" small text @click="loadSource">Retry stream</v-btn></v-alert>
    <div class="video-stage">
      <div v-if="loadingSource" class="source-loading" role="status">Finding your stream…</div>
      <video v-if="nativeSource" ref="video" controls playsinline preload="metadata"
        @loadedmetadata="onVideoReady" @durationchange="onVideoReady" @canplay="onVideoReady" @play="publish('play')"
        @pause="publish('pause')" @seeked="publish('seeked')" @timeupdate="heartbeat" @ended="publish('ended')"
        @error="error = 'The video could not load. Retry the stream.'">
        <track v-for="track in nativeSource.subtitleTracks || []" :key="track.src" kind="subtitles"
          :src="track.src" :srclang="track.srclang" :label="track.label" :default="!!track.default" />
      </video>
      <iframe v-else-if="provider !== 'native'" ref="embed" :src="embedUrl" title="Movie player" allowfullscreen
        sandbox="allow-scripts allow-same-origin allow-presentation"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture" referrerpolicy="origin" />
      <v-btn v-if="needsGesture && nativeSource" class="join-playback" color="cyan" dark @click="restorePlayback">Tap to join playback</v-btn>
    </div>
    <div class="pa-3 d-flex flex-wrap align-center gap-2">
      <v-btn v-if="nativeSource" small color="cyan" class="black--text text-none" :disabled="!connected" @click="togglePlayback">{{ shared && shared.playing ? 'Pause together' : 'Play together' }}</v-btn>
      <v-btn small outlined color="cyan" class="text-none" :disabled="!shared || !connected" @click="syncNow">
        {{ nativeSource ? 'Sync to shared position' : 'Align to shared time' }}
      </v-btn>
      <span v-if="shared" class="caption grey--text">{{ shared.sender }} · {{ shared.playing ? 'Playing' : 'Paused' }} at {{ formatTime(sharedPosition) }}</span>
    </div>
  </div>
</template>

<script>
import firebaseSync from "@/services/firebaseSync";
import { getPersonalMediaSource } from "@/data/personalMediaLibrary";
import { mediaKey, playbackPosition, acceptPlayerEvent } from "@/services/playbackSync";

export default {
  props: { media: Object, provider: String, url: String, roomId: String, currentUser: String },
  data: () => ({ connected: false, offset: 0, shared: null, error: "", needsGesture: false,
    resolvedSource: null, loadingSource: false, sourceReady: false, playbackLoaded: false, sourceRequest: null, sourceGeneration: 0, hls: null, closing: false,
    clientId: `${Date.now()}-${Math.random().toString(36).slice(2)}`, applyingUntil: 0,
    lastSent: 0, stops: [], embedStart: null, embedPlaying: false, tick: Date.now(), timer: null }),
  computed: {
    nativeSource() {
      if (this.provider === 'native' && !this.media.sourceUrl) return this.resolvedSource;
      if (this.media.useEmbed) return null;
      if (this.media.sourceUrl) return { sourceUrl: this.media.sourceUrl, subtitleTracks: [] };
      const source = getPersonalMediaSource(this.media.mediaType, this.media.mediaId);
      return source?.sourceType === "video" ? source : null;
    },
    key() { return mediaKey(this.media, this.provider); },
    sharedPosition() { return playbackPosition(this.shared, this.tick + this.offset); },
    embedUrl() {
      if (this.embedStart === null || this.provider !== "vidlink") return this.url;
      const url = new URL(this.url);
      url.searchParams.set("startAt", Math.floor(this.embedStart));
      url.searchParams.set("autoplay", this.shared?.playing ? "true" : "false");
      return url.toString();
    },
    statusText() {
      if (this.loadingSource) return 'Loading the shared player';
      if (this.provider === 'native' && !this.nativeSource) return 'Stream unavailable';
      if (!this.nativeSource) return "Shared title · provider playback is independent";
      if (this.needsGesture) return "Tap to allow playback on this device";
      if (!this.shared) return "Press play when you are ready";
      return this.shared.playing ? "Shared playback is playing" : "Shared playback is paused";
    },
  },
  mounted() {
    this.loadSource();
    this.stops.push(firebaseSync.subscribeToClock((offset) => { this.offset = offset; }));
    this.stops.push(firebaseSync.subscribeToConnection((connected) => { this.connected = connected; }));
    this.stops.push(firebaseSync.subscribeToPlayback((state) => {
      this.playbackLoaded = true;
      if (!state || state.mediaKey !== this.key || !Number.isFinite(state.position) || !Number.isFinite(state.updatedAt)) return;
      this.shared = state;
      if (state.clientId !== this.clientId && this.nativeSource) this.restorePlayback();
    }, this.roomId, (error) => { this.error = `Playback sync unavailable: ${error.message}`; }));
    window.addEventListener("message", this.onPlayerMessage);
    this.timer = setInterval(() => { this.tick = Date.now(); }, 1000);
  },
  beforeDestroy() {
    this.closing = true;
    if (this.sourceRequest) this.sourceRequest.abort();
    if (this.hls) this.hls.destroy();
    this.stops.forEach((stop) => stop());
    clearInterval(this.timer);
    window.removeEventListener("message", this.onPlayerMessage);
  },
  methods: {
    async loadSource() {
      this.sourceReady = false;
      const generation = ++this.sourceGeneration;
      if (this.sourceRequest) this.sourceRequest.abort();
      this.error = '';
      if (this.provider === 'native' && !this.media.sourceUrl) {
        const controller = new AbortController();
        this.sourceRequest = controller;
        this.loadingSource = true;
        try {
          const query = new URLSearchParams({ type: this.media.mediaType, id: this.media.mediaId,
            season: this.media.season || 1, episode: this.media.episode || 1 });
          const response = await fetch(`/api/stream?${query}`, { signal: controller.signal });
          const source = await response.json();
          if (!response.ok) throw new Error(source.message || 'Stream unavailable.');
          if (!controller.signal.aborted) this.resolvedSource = source;
        } catch (error) {
          if (!controller.signal.aborted) this.error = error.message;
        } finally { if (!controller.signal.aborted) this.loadingSource = false; }
        if (controller.signal.aborted || this.sourceRequest !== controller) return;
      }
      await this.$nextTick();
      if (this.closing || generation !== this.sourceGeneration) return;
      await this.attachSource(generation);
    },
    async attachSource(generation) {
      const video = this.$refs.video;
      const source = this.nativeSource;
      if (!video || !source) return;
      if (this.hls) { this.hls.destroy(); this.hls = null; }
      const isHls = source.mimeType?.includes('mpegurl') || /\.m3u8(?:\?|$)/i.test(source.sourceUrl);
      if (!isHls) { video.src = source.sourceUrl; return; }
      const { default: Hls } = await import('hls.js');
      if (this.closing || video !== this.$refs.video || generation !== this.sourceGeneration) return;
      if (!Hls.isSupported()) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = source.sourceUrl;
        else this.error = 'This browser cannot play this stream. Try Safari, Chrome or Edge.';
        return;
      }
      const player = new Hls({ capLevelToPlayerSize: true, maxBufferLength: 30 });
      this.hls = player;
      player.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) { this.error = 'The stream stopped loading. Retry to reconnect at your shared position.'; player.destroy(); }
      });
      player.loadSource(source.sourceUrl);
      player.attachMedia(video);
    },
    async togglePlayback() {
      const video = this.$refs.video;
      if (!video || !video.readyState || !this.playbackLoaded || !this.sourceReady) { this.error = 'The video is still loading. Try play again in a moment.'; return; }
      const playing = !this.shared?.playing;
      await this.send(video.currentTime, playing);
      await this.restorePlayback();
    },
    formatTime(time) {
      const seconds = Math.max(0, Math.floor(time));
      return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    },
    onVideoReady() {
      const video = this.$refs.video;
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
      this.sourceReady = true;
      this.restorePlayback();
    },
    async restorePlayback() {
      const video = this.$refs.video;
      if (!video || !video.readyState || !this.shared) return;
      this.applyingUntil = Date.now() + 1500;
      const position = playbackPosition(this.shared, Date.now() + this.offset, video.duration);
      if (Math.abs(video.currentTime - position) > 1) video.currentTime = position;
      if (this.shared.playing) {
        try { await video.play(); this.needsGesture = false; }
        catch (_) { this.needsGesture = true; }
      } else { video.pause(); this.needsGesture = false; }
    },
    async send(position, playing) {
      if (!this.connected) { this.error = "Room offline. Reconnect before sharing playback controls."; return; }
      const state = { mediaKey: this.key, position, playing, sender: this.currentUser,
        clientId: this.clientId, updatedAt: Date.now() + this.offset };
      this.shared = state;
      this.lastSent = Date.now();
      try { await firebaseSync.setPlayback(state, this.roomId); this.error = ""; }
      catch (error) { this.error = `Could not share playback: ${error.message}`; }
    },
    publish() {
      const video = this.$refs.video;
      if (!video || !video.readyState || this.closing || this.loadingSource || !this.sourceReady || !this.playbackLoaded) return;
      // Ignore the echo of a remote command, but keep an immediate user override.
      const playing = !video.paused && !video.ended;
      if (Date.now() < this.applyingUntil && this.shared && playing === this.shared.playing &&
          Math.abs(video.currentTime - playbackPosition(this.shared, Date.now() + this.offset, video.duration)) < 1.5) return;
      this.send(video.currentTime, playing);
    },
    heartbeat() {
      if (this.shared?.clientId === this.clientId && Date.now() - this.lastSent > 5000) this.publish();
    },
    onPlayerMessage(event) {
      if (this.nativeSource || this.provider !== "vidlink") return;
      const data = acceptPlayerEvent(event, this.$refs.embed, this.url, this.media);
      if (!data) return;
      if (data.event === "play") this.embedPlaying = true;
      if (["pause", "ended"].includes(data.event)) this.embedPlaying = false;
      // Keep one reporter for periodic events; explicit actions can take control.
      if (data.event === "timeupdate" && this.shared && this.shared.clientId !== this.clientId) return;
      if (data.event === "timeupdate" && Date.now() - this.lastSent < 5000) return;
      this.send(data.currentTime, this.embedPlaying);
    },
    syncNow() {
      if (!this.shared) { this.error = "No shared playback position yet. Start the video first."; return; }
      if (this.nativeSource) this.restorePlayback();
      else if (this.provider === "vidlink") this.embedStart = playbackPosition(this.shared, Date.now() + this.offset);
      else this.error = `Set the player to ${this.formatTime(this.sharedPosition)}. This provider has no linked playback controls.`;
    },
  },
};
</script>

<style scoped>
.together-player { background: #05070d; }
.video-stage { position: relative; aspect-ratio: 16 / 9; background: #000; }
.source-loading { position: absolute; inset: 0; display: grid; place-items: center; color: #b3d5df; }
video, iframe { width: 100%; height: 100%; border: 0; display: block; }
.join-playback { position: absolute; top: 45%; left: 50%; transform: translateX(-50%); }
.gap-2 { gap: 8px; }
</style>
