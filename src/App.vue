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
  mounted() {
    this.stopAvatarSync = firebaseSync.subscribeToProfileAvatars(this.receiveAvatars);
    window.addEventListener('storage', this.receiveAvatarStorage);
    this.stopPresenceSync = firebaseSync.subscribeToPresence(value => this.$store.commit('SET_PRESENCE', value));
    this.stopConnection = firebaseSync.subscribeToConnection(value => this.$store.commit('SET_PRESENCE_CONNECTED', value));
    this.startPresence();
    window.addEventListener('user-identity-changed', this.startPresence);
    window.addEventListener('pagehide', this.endPresence);
    window.addEventListener('pageshow', this.startPresence);
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
  },
  methods: {
    endPresence() { if (this.stopPresence) this.stopPresence(); this.stopPresence = null; },
    startPresence(event) {
      this.endPresence();
      const user = typeof event?.detail === 'string' ? event.detail : localStorage.getItem('our_view_user');
      this.stopPresence = firebaseSync.trackPresence(user);
    },
    receiveAvatars(profiles) {
      Object.entries(profiles).forEach(([user, avatar]) => this.$store.commit('SET_PROFILE_AVATAR', { user, avatar }));
    },
    receiveAvatarStorage(event) { if (event.key === AVATAR_STORAGE_KEY) this.receiveAvatars(readAvatars()); },
  },
};
</script>

<style>
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
  font-family: "Inter", system-ui, sans-serif !important;
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
