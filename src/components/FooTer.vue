<template>
  <v-footer dark padless>
    <v-card flat tile class="footer-shell flex white--text text-center py-2">
      <v-card-text class="white--text d-flex align-center justify-center py-1">
        <span class="mr-4">{{ new Date().getFullYear() }} &copy; <strong>🖤Ejay02</strong></span>
        <a
          v-for="(url, icon) in icons"
          :key="icon"
          :href="url"
          target="_blank"
          rel="noopener noreferrer"
          class="mx-1"
        >
          <v-btn class="white--text" icon small>
            <v-icon size="18px">
              {{ icon }}
            </v-icon>
          </v-btn>
        </a>
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
