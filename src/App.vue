<template>
  <v-app class="app-shell">
    <nav-bar v-if="!$route.meta.hideNav" />

    <v-main class="shell-main">
      <router-view />
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

export default {
  name: "App",
  components: {
    NavBar,
    FooTer,
    IdentityOnboardingDialog,
    UserIconSelectorDialog,
  },

  data: () => ({
    //
  }),
};
</script>

<style>
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
