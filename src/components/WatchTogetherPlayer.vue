<template>
  <div class="together-player">
    <div class="playback-status pa-3" role="status" aria-live="polite">
      <strong :class="connected ? 'cyan--text' : 'amber--text'">{{ connected ? 'Watch together' : 'Reconnecting to room…' }}</strong>
      <span class="grey--text text--lighten-1 ml-2">{{ statusText }}</span>
    </div>
    <v-alert v-if="error" dense outlined type="warning" class="ma-3">
      <p class="mb-2">{{ error }}</p>
      <div class="d-flex flex-wrap align-center gap-2">
        <v-btn small outlined color="cyan" class="text-none" @click="$emit('choose-source')">Use a direct video</v-btn>
        <v-btn small text class="text-none" @click="loadSource">Retry stream</v-btn>
        <v-btn v-if="providerDenied && providerUrl" small text class="text-none" :href="providerUrl" target="_blank" rel="noopener noreferrer">Watch separately</v-btn>
      </div>
    </v-alert>
    <div v-if="loadingSource || nativeSource" class="video-stage">
      <div v-if="loadingSource" class="source-loading" role="status">Finding your stream…</div>
      <video v-if="nativeSource" ref="video" controls playsinline preload="metadata"
        @pointerdown="markLocalControl" @keydown="markLocalControl"
        @loadedmetadata="onVideoReady" @durationchange="onVideoReady" @canplay="onVideoReady" @play="publish('play')"
        @pause="publish('pause')" @seeked="publish('seeked')" @timeupdate="heartbeat" @ended="publish('ended')"
        @waiting="buffering = true" @stalled="buffering = true" @playing="onPlaying"
        @error="recoverStream">
        <track v-for="track in nativeSource.subtitleTracks || []" :key="track.src" kind="subtitles"
          :src="track.src" :srclang="track.srclang" :label="track.label" :default="!!track.default" />
      </video>
      <v-btn v-if="needsGesture && shared && shared.playing && nativeSource" class="join-playback" color="cyan" dark @click="restorePlayback">Tap to join playback</v-btn>
    </div>
    <div v-if="nativeSource || !error" class="pa-3 d-flex flex-wrap align-center gap-2">
      <v-btn v-if="nativeSource" small color="cyan" class="black--text text-none" :disabled="!connected" @click="togglePlayback">{{ shared && shared.playing ? 'Pause together' : 'Play together' }}</v-btn>
      <v-btn v-if="nativeSource" small outlined color="cyan" class="text-none" :disabled="!shared || !connected" @click="syncNow">
        Sync to shared position
      </v-btn>
      <span v-if="shared" class="caption grey--text">{{ shared.sender }} · {{ shared.playing ? 'Playing' : 'Paused' }} at {{ formatTime(sharedPosition) }}</span>
      <label v-if="qualityLevels.length" class="quality-choice">Quality
        <select v-model.number="quality" aria-label="Video quality" @change="setQuality"><option :value="-1">Auto</option><option v-for="level in qualityLevels" :key="level.index" :value="level.index">{{ level.label }}</option></select>
      </label>
      <v-btn v-if="!error" small text color="cyan" class="text-none" @click="$emit('choose-source')">Use a direct video</v-btn>
    </div>
  </div>
</template>

<script>
import firebaseSync from "@/services/firebaseSync";
import { getPersonalMediaSource } from "@/data/personalMediaLibrary";
import { mediaKey, playbackPosition } from "@/services/playbackSync";
import { providerWatchUrl } from "@/services/providerPlayback";

export default {
  props: { media: Object, roomId: String, currentUser: String },
  data: () => ({ connected: false, offset: 0, shared: null, error: "", needsGesture: false, providerDenied: false,
    buffering: false, recoveryAttempts: 0, recoveryTimer: null, quality: -1, qualityLevels: [],
    resolvedSource: null, loadingSource: false, sourceReady: false, playbackLoaded: false, sourceRequest: null, sourceGeneration: 0, hls: null, closing: false,
    clientId: `${Date.now()}-${Math.random().toString(36).slice(2)}`, applyingUntil: 0, localControlUntil: 0,
    lastSent: 0, stops: [], tick: Date.now(), timer: null }),
  computed: {
    directSource() {
      if (!this.media.useEmbed && this.media.sourceUrl) return { sourceUrl: this.media.sourceUrl, subtitleTracks: [] };
      const source = getPersonalMediaSource(this.media.mediaType, this.media.mediaId);
      return source?.sourceType === "video" ? source : null;
    },
    nativeSource() { return this.directSource || this.resolvedSource; },
    providerUrl() { return providerWatchUrl(this.media.mediaType, this.media.mediaId, this.media.season || 1, this.media.episode || 1); },
    key() { return mediaKey(this.media, 'native'); },
    sharedPosition() { return playbackPosition(this.shared, this.tick + this.offset); },
    statusText() {
      if (this.loadingSource) return 'Loading the shared player';
      if (this.error) return 'Playback needs attention';
      if (this.buffering && this.shared?.playing) return 'Buffering on this device…';
      if (!this.nativeSource) return 'Stream unavailable';
      if (this.needsGesture && this.shared?.playing) return "Tap to allow playback on this device";
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
    this.timer = setInterval(() => { this.tick = Date.now(); }, 1000);
  },
  beforeDestroy() {
    this.closing = true;
    if (this.sourceRequest) this.sourceRequest.abort();
    clearTimeout(this.recoveryTimer);
    if (this.hls) this.hls.destroy();
    this.stops.forEach((stop) => stop());
    clearInterval(this.timer);
  },
  methods: {
    markLocalControl() { this.localControlUntil = Date.now() + 3000; },
    onPlaying() { this.buffering = false; this.error = ''; },
    setQuality() { if (this.hls) { this.hls.autoLevelCapping = -1; this.hls.currentLevel = this.quality; } },
    recoverStream() {
      if (this.closing || this.recoveryTimer) return;
      if (this.recoveryAttempts >= 2) { this.error = 'The stream stopped. Retry to continue at the shared position.'; return; }
      this.recoveryAttempts++;
      this.buffering = true;
      this.recoveryTimer = setTimeout(() => { this.recoveryTimer = null; this.loadSource(true); }, 1500 * this.recoveryAttempts);
    },
    async loadSource(recovering = false) {
      if (recovering !== true) this.recoveryAttempts = 0;
      clearTimeout(this.recoveryTimer); this.recoveryTimer = null;
      this.qualityLevels = []; this.quality = -1;
      this.sourceReady = false;
      const generation = ++this.sourceGeneration;
      if (this.sourceRequest) this.sourceRequest.abort();
      this.error = '';
      this.providerDenied = false;
      if (this.hls) { this.hls.destroy(); this.hls = null; }
      this.resolvedSource = null;
      if (!this.directSource) {
        const controller = new AbortController();
        this.sourceRequest = controller;
        this.loadingSource = true;
        try {
          const query = new URLSearchParams({ type: this.media.mediaType, id: this.media.mediaId,
            season: this.media.season || 1, episode: this.media.episode || 1 });
          const response = await fetch(`/api/stream?${query}`, { signal: controller.signal });
          const source = await response.json();
          if (!response.ok) {
            this.providerDenied = source.code === 'provider_denied';
            throw new Error(source.message || 'Stream unavailable.');
          }
          if (!controller.signal.aborted) this.resolvedSource = source;
        } catch (error) {
          if (!controller.signal.aborted) {
            this.error = error.message;
            if (!this.providerDenied) this.recoverStream();
          }
        } finally { if (!controller.signal.aborted) this.loadingSource = false; }
        if (controller.signal.aborted || this.sourceRequest !== controller || !this.resolvedSource) return;
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
      const player = new Hls({ maxBufferLength: 30 });
      this.hls = player;
      player.on(Hls.Events.MANIFEST_PARSED, () => {
        if (this.hls !== player) return;
        this.qualityLevels = player.levels.map((level, index) => ({ index, label: level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)} kbps` }));
      });
      player.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal && this.hls === player) { player.destroy(); this.hls = null; this.recoverStream(); }
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
        const command = this.shared;
        try { await video.play(); if (this.shared === command) this.needsGesture = false; }
        catch (_) { if (this.shared === command && command.playing) this.needsGesture = true; }
      } else { video.pause(); this.needsGesture = false; }
    },
    async send(position, playing) {
      if (!this.connected) { this.error = "Room offline. Reconnect before sharing playback controls."; return; }
      const state = { mediaKey: this.key, position, playing, sender: this.currentUser,
        clientId: this.clientId, updatedAt: Date.now() + this.offset,
        watchRequestId: playing && !this.shared?.playing ? `${this.clientId}:${Date.now()}` : (this.shared?.watchRequestId || '') };
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
      // Loading, autoplay rejection and browser suspension are not room commands.
      if (this.shared && playing !== this.shared.playing && !video.ended && Date.now() > this.localControlUntil) return;
      if (Date.now() < this.applyingUntil && this.shared && playing === this.shared.playing &&
          Math.abs(video.currentTime - playbackPosition(this.shared, Date.now() + this.offset, video.duration)) < 1.5) return;
      this.send(video.currentTime, playing);
    },
    heartbeat() {
      if (this.shared?.clientId === this.clientId && Date.now() - this.lastSent > 5000) this.publish();
    },
    syncNow() {
      if (!this.shared) { this.error = "No shared playback position yet. Start the video first."; return; }
      this.restorePlayback();
    },
  },
};
</script>

<style scoped>
.together-player { background: #05070d; }
.video-stage { position: relative; aspect-ratio: 16 / 9; background: #000; }
.source-loading { position: absolute; inset: 0; display: grid; place-items: center; color: #b3d5df; }
video { width: 100%; height: 100%; display: block; }
.join-playback { position: absolute; top: 45%; left: 50%; transform: translateX(-50%); }
.gap-2 { gap: 8px; }
.quality-choice { color: #bdcbd5; font-size: 12px; margin-left: auto; }
.quality-choice select { background: #172231; color: #fff; padding: 8px; margin-left: 6px; border-radius: 6px; }
</style>
