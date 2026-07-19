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
  name: "App",
  components: { NavBar, FooTer },

  data: () => ({
    //
  }),
};
</script>
