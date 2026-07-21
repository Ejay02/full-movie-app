<template>
  <div class="dstv-portal-page">
    <!-- Top Portal Header Bar -->
    <div class="dstv-portal-header pa-4 d-flex align-center justify-space-between flex-wrap gap-3">
      <div class="d-flex align-center">
        <v-btn icon dark class="mr-3" @click="$router.push('/')">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <div class="dstv-logo-badge-header mr-3">
          <span class="dstv-text-header">DStv</span>
        </div>
        <div>
          <h1 class="white--text text-h6 font-weight-bold mb-0">DStv Stream Portal</h1>
          <span class="grey--text text-caption">Official DStv Streaming Web App (dstv.stream)</span>
        </div>
      </div>

      <div class="d-flex align-center gap-2">
        <v-btn color="info" outlined small class="text-none font-weight-bold" @click="reloadIframe">
          <v-icon left small>mdi-refresh</v-icon>
          Reload
        </v-btn>
        <v-btn color="#00A3E0" dark small class="text-none font-weight-bold" @click="openExternalWindow">
          <v-icon left small>mdi-open-in-new</v-icon>
          Open Direct Window
        </v-btn>
      </div>
    </div>

    <!-- Alert tip bar -->
    <v-alert dense text type="info" class="dstv-tip-alert mx-4 my-2 text-caption">
      Sign in with your DStv subscription credentials to stream live TV channels and Catch Up inside Ej's Movie app. If your browser blocks embedded sign-in, click <strong>Open Direct Window</strong> above.
    </v-alert>

    <!-- Embedded Portal Container -->
    <div class="dstv-frame-container">
      <iframe
        ref="dstvFrame"
        src="https://dstv.stream/#/"
        class="dstv-iframe"
        allow="autoplay; fullscreen; encrypted-media; camera; microphone"
      ></iframe>
    </div>
  </div>
</template>

<script>
export default {
  name: "DstvView",
  methods: {
    reloadIframe() {
      if (this.$refs.dstvFrame) {
        this.$refs.dstvFrame.src = "https://dstv.stream/#/";
      }
    },
    openExternalWindow() {
      window.open("https://dstv.stream/#/", "_blank", "noopener,noreferrer");
    }
  }
};
</script>

<style scoped>
.dstv-portal-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 90px);
  background: #060911;
}

.dstv-portal-header {
  background: linear-gradient(90deg, #090d19, #0e1628);
  border-bottom: 1px solid rgba(0, 163, 224, 0.2);
}

.dstv-logo-badge-header {
  background: linear-gradient(135deg, #00A3E0, #0051A8);
  padding: 4px 14px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 163, 224, 0.4);
}

.dstv-text-header {
  color: #ffffff;
  font-weight: 900;
  font-size: 1.2rem;
  letter-spacing: -0.5px;
}

.dstv-tip-alert {
  border-radius: 10px !important;
  background-color: rgba(0, 163, 224, 0.1) !important;
  border: 1px solid rgba(0, 163, 224, 0.2) !important;
}

.dstv-frame-container {
  flex: 1;
  width: 100%;
  position: relative;
  background: #000000;
}

.dstv-iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}
</style>
