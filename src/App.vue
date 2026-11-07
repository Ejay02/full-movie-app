<template>
  <v-app class="app-shell">
    <cinema-atmosphere :quiet="!!$route.meta.hideNav" />
    <nav-bar v-if="!$route.meta.hideNav" />

    <v-main class="shell-main">
      <transition name="cinema-page" mode="out-in">
        <router-view />
      </transition>
    </v-main>
    <foo-ter v-if="!$route.meta.hideFooter" />

    <!-- First-Time Visitor Identification Dialog -->
    <identity-onboarding-dialog />

    <!-- Profile Icon Selector Dialog -->
    <user-icon-selector-dialog />
  </v-app>
</template>

<script>
import FooTer from "./components/FooTer.vue";
import NavBar from "./components/NavBar.vue";
import IdentityOnboardingDialog from "./components/IdentityOnboardingDialog.vue";
import UserIconSelectorDialog from "./components/UserIconSelectorDialog.vue";
import CinemaAtmosphere from "./components/CinemaAtmosphere.vue";
import "./styles/cinematic-motion.css";
import firebaseSync from '@/services/firebaseSync';
import { AVATAR_STORAGE_KEY, readAvatars } from '@/services/profileAvatars';

export default {
  name: "App",
  components: {
    NavBar,
    FooTer,
    IdentityOnboardingDialog,
    UserIconSelectorDialog,
    CinemaAtmosphere,
  },

  data: () => ({ stopAvatarSync: null, stopPresence: null, stopPresenceSync: null, stopConnection: null }),
  watch: { '$route.fullPath'() { this.updateActivity(); } },
  mounted() {
    this.stopAvatarSync = firebaseSync.subscribeToProfileAvatars(this.receiveAvatars);
    window.addEventListener('storage', this.receiveAvatarStorage);
    this.stopPresenceSync = firebaseSync.subscribeToPresence(value => this.$store.commit('SET_PRESENCE', value));
    this.stopConnection = firebaseSync.subscribeToConnection(value => this.$store.commit('SET_PRESENCE_CONNECTED', value));
    this.startPresence();
    window.addEventListener('user-identity-changed', this.startPresence);
    window.addEventListener('pagehide', this.endPresence);
    window.addEventListener('pageshow', this.startPresence);
    window.addEventListener('room-activity-changed', this.updateActivity);
  },
  beforeDestroy() {
    if (this.stopAvatarSync) this.stopAvatarSync();
    window.removeEventListener('storage', this.receiveAvatarStorage);
    this.endPresence();
    if (this.stopPresenceSync) this.stopPresenceSync();
    if (this.stopConnection) this.stopConnection();
    window.removeEventListener('user-identity-changed', this.startPresence);
    window.removeEventListener('pagehide', this.endPresence);
    window.removeEventListener('pageshow', this.startPresence);
    window.removeEventListener('room-activity-changed', this.updateActivity);
  },
  methods: {
    endPresence() { if (this.stopPresence) this.stopPresence(); this.stopPresence = null; },
    startPresence(event) {
      this.endPresence();
      const user = typeof event?.detail === 'string' ? event.detail : localStorage.getItem('our_view_user');
      this.stopPresence = firebaseSync.trackPresence(user, this.currentActivity());
    },
    currentActivity(event) {
      const room = this.$route.path === '/our-view' ? this.$route.query.room || 'date-night' : '';
      const tab = event?.detail?.tab || this.$route.query.tab || 'watch';
      const game = event?.detail?.game || localStorage.getItem(`last-game:${room}`) || 'whot';
      const games = { whot: 'WHOT!', crossword: 'Crossword Go', wordDuel: 'Word Duel', scrabble: 'Words with Friends' };
      const label = room ? (tab === 'games' ? `Playing ${games[game] || 'games'}` : ({ watch: 'In the cinema', queue: 'Choosing a movie', dice: 'Picking a movie' }[tab] || 'In the room')) : 'Browsing';
      return { room, tab, game, label };
    },
    updateActivity(event) { this.stopPresence?.update?.(this.currentActivity(event)); },
    receiveAvatars(profiles) {
      Object.entries(profiles).forEach(([user, avatar]) => this.$store.commit('SET_PROFILE_AVATAR', { user, avatar }));
    },
    receiveAvatarStorage(event) { if (event.key === AVATAR_STORAGE_KEY) this.receiveAvatars(readAvatars()); },
  },
};
</script>

<style>
:root {
  --font-sans: "Geist", system-ui, sans-serif;
  --font-serif: "Lora", Georgia, serif;
}
/* Vuetify typography utilities carry their own font declaration. */
.v-application,
.v-application [class*="text-h"],
.v-application [class*="text-body"],
.v-application [class*="text-subtitle"],
.v-application .text-caption,
.v-application .text-overline,
.v-application .headline,
.v-application .title,
.v-application .subtitle-1,
.v-application .subtitle-2,
.v-application .body-1,
.v-application .body-2,
.v-application .caption,
.v-application .overline {
  font-family: var(--font-sans) !important;
}
.v-application :is(h1, h2, .page-title, .section-title, .media-title) {
  font-family: var(--font-serif) !important;
}
.app-shell {
  background: radial-gradient(
      circle at top left,
      rgba(229, 9, 20, 0.18),
      transparent 28%
    ),
    radial-gradient(
      circle at top right,
      rgba(17, 24, 39, 0.55),
      transparent 30%
    ),
    linear-gradient(180deg, #05070d 0%, #090d17 45%, #05070d 100%);
}

.shell-main {
  position: relative;
  z-index: 1;
}
</style>
