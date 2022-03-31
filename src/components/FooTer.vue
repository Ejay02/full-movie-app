<template>
  <v-footer dark padless>
    <v-card flat tile class="pink white--text text-center">
      <v-card-text>
        <v-btn v-for="icon in icons" :key="icon" class="mx-4 white--text" icon>
          <v-icon size="24px">
            {{ icon }}
          </v-icon>
        </v-btn>
      </v-card-text>

      <v-card-text class="white--text pt-0 text-center">
        <p>
          <strong>Ej Movie</strong> is a movie database web application created
          with the Vue.js framework. It is a work in progress.
        </p>
        <p>
          This project is open source and you can view the source code
          <a href="https://github.com/Ejay02" target="_blank">here</a>.
        </p>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-text class="white--text">
        {{ new Date().getFullYear() }} &copy; <strong>🖤Ejay02</strong>
      </v-card-text>
    </v-card>
  </v-footer>
</template>

<script>
export default {
  data: () => ({
    icons: ["mdi-facebook", "mdi-twitter", "mdi-linkedin", "mdi-instagram"],
  }),
};
</script>

<style></style>
