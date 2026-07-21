<template>
  <div class="dstv-portal-page">
    <!-- Top Portal Header Bar -->
    <div class="dstv-portal-header pa-3 px-4 d-flex align-center justify-space-between flex-wrap gap-3">
      <div class="d-flex align-center">
        <v-btn icon dark class="mr-3" @click="$router.push('/')">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-img
          src="https://cdn-1.webcatalog.io/catalog/dstv-now/dstv-now-icon-filled-256.png"
          max-width="34"
          max-height="34"
          contain
          class="rounded-lg mr-3"
        ></v-img>
        <div>
          <h1 class="white--text text-h6 font-weight-bold mb-0">DStv Stream Portal</h1>
          <span class="grey--text text-caption">Official DStv Streaming Web App</span>
        </div>
      </div>

      <div class="d-flex align-center gap-2">
        <!-- Direct Authentication Popup Trigger -->
        <v-btn
          color="#00A3E0"
          dark
          small
          class="text-none font-weight-bold px-4"
          @click="openLoginPopup"
        >
          <v-icon left small>mdi-lock-open-variant</v-icon>
          Sign In to DStv
        </v-btn>

        <v-btn color="white" text icon small title="Reload Stream" @click="reloadIframe">
          <v-icon small>mdi-refresh</v-icon>
        </v-btn>

        <v-btn color="white" text icon small title="Open in New Window" @click="openExternalWindow">
          <v-icon small>mdi-open-in-new</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Embedded Portal Container (With Popup Allowed Sandbox) -->
    <div class="dstv-frame-container">
      <iframe
        ref="dstvFrame"
        src="https://dstv.stream/#/"
        class="dstv-iframe"
        allow="autoplay; fullscreen; encrypted-media; camera; microphone; clipboard-write"
        sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
      ></iframe>
    </div>
  </div>
</template>

<script>
export default {
  name: "DstvView",
  data() {
    return {
      authWindowTimer: null
    };
  },
  beforeDestroy() {
    if (this.authWindowTimer) {
      clearInterval(this.authWindowTimer);
    }
  },
  methods: {
    reloadIframe() {
      if (this.$refs.dstvFrame) {
        this.$refs.dstvFrame.src = "https://dstv.stream/#/";
      }
    },
    openExternalWindow() {
      window.open("https://dstv.stream/#/", "_blank", "noopener,noreferrer");
    },
    openLoginPopup() {
      // Open login popup to bypass X-Frame-Options SAMEORIGIN block on authentication.dstv.stream
      const width = 580;
      const height = 720;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        "https://dstv.stream/#/login",
        "DStvAuthenticationWindow",
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
      );

      // Poll popup closure to auto-refresh stream iframe once signed in
      if (popup) {
        if (this.authWindowTimer) clearInterval(this.authWindowTimer);
        this.authWindowTimer = setInterval(() => {
          if (popup.closed) {
            clearInterval(this.authWindowTimer);
            this.authWindowTimer = null;
            // Refresh iframe so DStv session cookie takes effect
            this.reloadIframe();
          }
        }, 1000);
      }
    }
  }
};
</script>

<style scoped>
.dstv-portal-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  background: #060911;
}

.dstv-portal-header {
  background: linear-gradient(90deg, #090d19, #0e1628);
  border-bottom: 1px solid rgba(0, 163, 224, 0.2);
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
