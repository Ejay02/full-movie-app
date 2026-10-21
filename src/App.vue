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

export default {
  name: "App",
  components: {
    NavBar,
    FooTer,
    IdentityOnboardingDialog,
    UserIconSelectorDialog,
    CinemaAtmosphere,
  },

  data: () => ({
    //
  }),
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
