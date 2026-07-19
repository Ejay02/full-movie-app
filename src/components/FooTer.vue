<template>
  <v-footer dark padless>
    <v-card flat tile class="footer-shell flex white--text text-center">
      <v-card-text class="white--text text-center">
        <p>
          <strong>Ej's Movie</strong> is a movie database web application created
          with the Vue.js framework. It is a work in progress.
        </p>
        <p>
          This project is open source and you can view the source code
          <a href="https://github.com/Ejay02" target="_blank">here</a>.
        </p>
      </v-card-text>

      <v-card-text>
        <a
          v-for="(url, icon) in icons"
          :key="icon"
          :href="url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <v-btn class="white--text" icon>
            <v-icon size="24px">
              {{ icon }}
            </v-icon>
          </v-btn>
        </a>
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
    icons: {
      "mdi-github": "https://github.com/Ejay02",
      "mdi-linkedin": "https://www.linkedin.com/in/ejakpovi/",
    },
  }),
};
</script>

<style>
.footer-shell {
  background: rgba(10, 14, 24, 0.7) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}
</style>
