<template>
  <div class="dstv-page">
    <!-- Header -->
    <div class="dstv-header pa-3 px-4 d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-btn icon dark class="mr-3" @click="$router.push('/')">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-img
          src="https://cdn-1.webcatalog.io/catalog/dstv-now/dstv-now-icon-filled-256.png"
          max-width="32"
          max-height="32"
          contain
          class="rounded-lg mr-3"
        ></v-img>
        <span class="white--text text-h6 font-weight-bold">DStv Stream</span>
      </div>

      <div class="d-flex align-center gap-2" v-if="signedIn">
        <v-btn color="white" text icon small title="Reload" @click="reloadIframe">
          <v-icon small>mdi-refresh</v-icon>
        </v-btn>
        <v-btn color="white" text icon small title="Sign out" @click="signOut">
          <v-icon small>mdi-logout</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Pre-auth: Prompt user to sign in via popup -->
    <div v-if="!signedIn" class="dstv-signin-screen d-flex flex-column align-center justify-center">
      <v-img
        src="https://cdn-1.webcatalog.io/catalog/dstv-now/dstv-now-icon-filled-256.png"
        max-width="80"
        max-height="80"
        contain
        class="rounded-2xl mb-6"
      ></v-img>
      <h2 class="white--text text-h5 font-weight-bold mb-2">Sign in to DStv</h2>
      <p class="grey--text text-center mb-8 px-4 body-2" style="max-width:380px">
        Your DStv session will open in a separate window. Once you sign in, the stream will load here automatically.
      </p>
      <v-btn
        color="#00A3E0"
        dark
        x-large
        rounded
        class="px-10 font-weight-bold text-none dstv-signin-btn"
        :loading="waitingForAuth"
        @click="openLoginPopup"
      >
        <v-icon left>mdi-lock-open-variant</v-icon>
        Sign In to DStv
      </v-btn>
      <p v-if="waitingForAuth" class="grey--text text-caption mt-4">
        Waiting for sign-in to complete...
      </p>
    </div>

    <!-- Post-auth: Load DStv stream -->
    <div v-if="signedIn" class="dstv-frame-container">
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
      signedIn: false,
      waitingForAuth: false,
      authWindowTimer: null
    };
  },
  beforeDestroy() {
    if (this.authWindowTimer) clearInterval(this.authWindowTimer);
  },
  methods: {
    openLoginPopup() {
      const width = 580;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        "https://dstv.stream/#/login",
        "DStvLogin",
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
      );

      if (!popup) return;

      this.waitingForAuth = true;

      if (this.authWindowTimer) clearInterval(this.authWindowTimer);
      this.authWindowTimer = setInterval(() => {
        if (popup.closed) {
          clearInterval(this.authWindowTimer);
          this.authWindowTimer = null;
          this.waitingForAuth = false;
          this.signedIn = true;
        }
      }, 800);
    },
    reloadIframe() {
      if (this.$refs.dstvFrame) {
        this.$refs.dstvFrame.src = "https://dstv.stream/#/";
      }
    },
    signOut() {
      this.signedIn = false;
    }
  }
};
</script>

<style scoped>
.dstv-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  background: #060911;
}

.dstv-header {
  background: linear-gradient(90deg, #090d19, #0e1628);
  border-bottom: 1px solid rgba(0, 163, 224, 0.15);
  flex-shrink: 0;
}

.dstv-signin-screen {
  flex: 1;
  background: radial-gradient(ellipse at center, rgba(0, 60, 110, 0.25) 0%, #060911 70%);
}

.dstv-signin-btn {
  box-shadow: 0 0 32px rgba(0, 163, 224, 0.45) !important;
  transition: transform 0.2s ease !important;
}

.dstv-signin-btn:hover {
  transform: scale(1.04) !important;
}

.dstv-frame-container {
  flex: 1;
  width: 100%;
  background: #000;
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
</style>
