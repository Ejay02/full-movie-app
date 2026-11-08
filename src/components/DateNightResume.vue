<template>
  <section v-if="media || game" class="date-night-resume" aria-label="Resume date night">
    <div><span class="resume-eyebrow">YOUR SHARED ROOM</span><h2>Resume date night</h2></div>
    <div v-if="media" class="resume-choice">
      <div><strong>{{ media.title }}</strong><p>{{ movieProgress }} · saved in {{ room }}</p></div>
      <v-btn outlined color="cyan" class="text-none" :to="{ path: '/our-view', query: { room, tab: 'watch' } }">Open movie</v-btn>
    </div>
    <div v-if="game" class="resume-choice">
      <div><strong>{{ gameName }}</strong><p>{{ game.currentTurn ? `${game.currentTurn}’s turn` : 'Unfinished game' }} · board saved</p></div>
      <v-btn outlined color="pink" class="text-none" :to="{ path: '/our-view', query: { room, tab: 'games' } }">Resume game</v-btn>
    </div>
  </section>
</template>
<script>
import firebaseSync from '@/services/firebaseSync';
import { nativeRoomMedia, mediaKey } from '@/services/playbackSync';
import { readGame } from '@/services/gameSession';
export default {
  data() {
    const room = 'date-night';
    const mode = localStorage.getItem(`last-game:${room}`) || 'whot';
    const type = { crossword: 'crosswordGo', whot: 'whot', wordDuel: 'wordDuel', scrabble: 'scrabble', chess: 'chess' }[mode] || 'whot';
    let media = null;
    try { media = nativeRoomMedia(JSON.parse(localStorage.getItem(`our-view-active-media-${room}`))); } catch (_) { /* No local title yet. */ }
    return { room, type, media, playback: null, savedGame: readGame(type, room), stops: [] };
  },
  computed: {
    game() { return this.savedGame?.status === 'game_over' ? null : this.savedGame; },
    gameName() { return { whot: 'WHOT!', crosswordGo: 'Crossword Go', wordDuel: 'Word Duel', scrabble: 'Words with Friends', chess: 'Chess' }[this.type]; },
    movieProgress() {
      const state = this.playback;
      if (!state || state.mediaKey !== mediaKey(this.media, 'native')) return 'Ready to watch';
      const seconds = Math.max(0, Math.floor(state.position || 0));
      return `${state.playing ? 'Last shared position' : 'Paused'} at ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    },
  },
  mounted() {
    this.stops.push(firebaseSync.subscribeToActiveMedia(media => { this.media = nativeRoomMedia(media); }, this.room));
    this.stops.push(firebaseSync.subscribeToPlayback(state => { this.playback = state; }, this.room));
    this.stops.push(firebaseSync.subscribeToGame(this.type, state => { this.savedGame = state; }, this.room));
  },
  beforeDestroy() { this.stops.forEach(stop => stop()); },
};
</script>
<style scoped>
.date-night-resume { padding: 20px; margin: 12px 0 28px; border: 1px solid #254453; border-radius: 20px; background: #0e1925; }
.resume-eyebrow { font-size: 10px; letter-spacing: 2px; color: #74d4db; }
h2 { font-size: 22px; margin-bottom: 12px; }
.resume-choice { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; }
.resume-choice + .resume-choice { border-top: 1px solid #ffffff15; }
p { color: #a9b9c9; font-size: 12px; margin: 4px 0 0; }
</style>
