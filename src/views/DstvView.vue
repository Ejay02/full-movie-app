<template>
  <div class="dstv-launcher-page">
    <div class="dstv-hero d-flex flex-column align-center justify-center text-center px-4">

      <!-- Logo -->
      <div class="dstv-logo-ring mb-6">
        <v-img
          src="https://cdn-1.webcatalog.io/catalog/dstv-now/dstv-now-icon-filled-256.png"
          max-width="88"
          max-height="88"
          contain
          class="rounded-xl"
        ></v-img>
      </div>

      <!-- Title -->
      <h1 class="white--text display-1 font-weight-black mb-2 dstv-title">DStv Stream</h1>
      <p class="grey--text text--lighten-1 body-1 mb-10" style="max-width: 420px; line-height: 1.7">
        Live TV, SuperSport, M-Net and Catch Up — powered by your DStv subscription.
      </p>

      <!-- Primary CTA -->
      <v-btn
        color="#00A3E0"
        dark
        x-large
        rounded
        class="px-12 font-weight-bold text-none dstv-launch-btn mb-4"
        @click="launch"
      >
        <v-icon left>mdi-television-play</v-icon>
        Open DStv Stream
      </v-btn>

      <p class="grey--text text-caption">
        Opens in a dedicated window — sign in with your DStv credentials there.
      </p>

      <!-- Feature Pills -->
      <div class="d-flex flex-wrap justify-center gap-3 mt-10">
        <div class="feature-pill d-flex align-center">
          <v-icon small color="#00E5FF" class="mr-2">mdi-soccer</v-icon>
          <span class="white--text caption font-weight-medium">SuperSport Live</span>
        </div>
        <div class="feature-pill d-flex align-center">
          <v-icon small color="#00E5FF" class="mr-2">mdi-movie-roll</v-icon>
          <span class="white--text caption font-weight-medium">M-Net Movies</span>
        </div>
        <div class="feature-pill d-flex align-center">
          <v-icon small color="#00E5FF" class="mr-2">mdi-television-guide</v-icon>
          <span class="white--text caption font-weight-medium">Catch Up TV</span>
        </div>
        <div class="feature-pill d-flex align-center">
          <v-icon small color="#00E5FF" class="mr-2">mdi-formula-one</v-icon>
          <span class="white--text caption font-weight-medium">Formula 1</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "DstvView",
  methods: {
    launch() {
      window.open(
        "https://dstv.stream/#/",
        "DStv_Stream_Window",
        "noopener,noreferrer"
      );
    }
  }
};
</script>

<style scoped>
.dstv-launcher-page {
  min-height: calc(100vh - 80px);
  background: radial-gradient(ellipse at 50% 30%, rgba(0, 80, 140, 0.35) 0%, #060911 65%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dstv-hero {
  width: 100%;
  padding: 60px 16px;
}

.dstv-logo-ring {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 28px;
  border: 1px solid rgba(0, 163, 224, 0.3);
  box-shadow: 0 0 60px rgba(0, 163, 224, 0.2);
}

.dstv-title {
  letter-spacing: -1px;
}

.dstv-launch-btn {
  box-shadow: 0 0 36px rgba(0, 163, 224, 0.5) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
}

.dstv-launch-btn:hover {
  transform: scale(1.05) !important;
  box-shadow: 0 0 52px rgba(0, 163, 224, 0.7) !important;
}

.feature-pill {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  padding: 8px 18px;
}

.gap-3 {
  gap: 12px;
}
</style>
