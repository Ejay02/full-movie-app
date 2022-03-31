/* eslint-disable */
<template>
  <v-app>
    <nav-bar />

    <v-main>
      <router-view />
    </v-main>
    <foo-ter />
  </v-app>
</template>

<script>
import FooTer from "./components/FooTer.vue";
import NavBar from "./components/NavBar.vue";

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "App ",
  // eslint-disable-next-line vue/no-unused-components
  components: { NavBar, FooTer },

  data: () => ({
    //
  }),
};
</script>
