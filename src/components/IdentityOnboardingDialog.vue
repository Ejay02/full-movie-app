<template>
  <v-dialog
    v-model="showDialog"
    persistent
    max-width="520"
    content-class="identity-dialog-wrapper"
  >
    <div class="onboarding-modal-card pa-6 pa-sm-8 text-center rounded-2xl">
      <!-- Floating Confetti & Sparkles -->
      <div class="floating-sparkles" aria-hidden="true">
        <span class="sparkle sp-1">✨</span>
        <span class="sparkle sp-2">🍿</span>
        <span class="sparkle sp-3">👑</span>
        <span class="sparkle sp-4">⚡</span>
        <span class="sparkle sp-5">🥂</span>
      </div>

      <!-- Icon & Welcome Header -->
      <div class="welcome-badge mb-3 d-inline-flex align-center justify-center">
        <v-icon size="42" color="#FFD700" class="welcome-trophy">mdi-party-popper</v-icon>
      </div>

      <h2 class="white--text text-h5 font-weight-black mb-2 welcome-title">
        Welcome Aboard! 🥂✨
      </h2>
      <p class="grey--text text-body-2 mb-6 max-w-400 mx-auto">
        Just a quick identification before date night begins...
        <br />
        <strong class="white--text">Are you Timi or Ejay?</strong>
      </p>

      <!-- Interactive Animated Character Cards -->
      <div class="identity-cards-row d-flex flex-column flex-sm-row justify-center gap-4 mb-4">
        <!-- Timi Card -->
        <div
          class="character-card timi-card cursor-pointer pa-5 rounded-xl flex-1 text-center"
          :class="{ 'card-hovered': selectedUser === 'Timi' }"
          @click="chooseUser('Timi')"
        >
          <div class="avatar-ring timi-ring mb-3 mx-auto d-flex align-center justify-center">
            <span class="avatar-emoji">👑</span>
          </div>
          <h3 class="white--text text-h6 font-weight-black mb-1">
            Timi <span style="color: #E040FB;">👑</span>
          </h3>
          <p class="card-tagline mb-3">
            Queen of Cozy Nights, Drama & Cinema Picks
          </p>
          <v-btn
            rounded
            depressed
            color="#E040FB"
            class="white--text font-weight-black text-none px-5"
          >
            I'm Timi 👑
          </v-btn>
        </div>

        <!-- Ejay Card -->
        <div
          class="character-card ejay-card cursor-pointer pa-5 rounded-xl flex-1 text-center"
          :class="{ 'card-hovered': selectedUser === 'Ejay' }"
          @click="chooseUser('Ejay')"
        >
          <div class="avatar-ring ejay-ring mb-3 mx-auto d-flex align-center justify-center">
            <span class="avatar-emoji">🍕</span>
          </div>
          <h3 class="white--text text-h6 font-weight-black mb-1">
            Ejay <span style="color: #00E5FF;">⚡</span>
          </h3>
          <p class="card-tagline mb-3">
            Master of Action, Thrillers & Night Snacks
          </p>
          <v-btn
            rounded
            depressed
            color="#00E5FF"
            class="black--text font-weight-black text-none px-5"
          >
            I'm Ejay ⚡
          </v-btn>
        </div>
      </div>

      <div class="caption grey--text text--darken-1">
        You can easily switch who is watching at any time from the top navigation! 🔄
      </div>
    </div>
  </v-dialog>
</template>

<script>
export default {
  name: "IdentityOnboardingDialog",
  data() {
    return {
      showDialog: false,
      selectedUser: null,
    };
  },
  mounted() {
    this.checkIdentity();
    window.addEventListener("open-identity-selector", () => {
      this.showDialog = true;
    });
  },
  methods: {
    checkIdentity() {
      // Check if user has already identified themselves
      const stored = localStorage.getItem("our_view_user");
      if (!stored) {
        // Show after brief entrance delay
        setTimeout(() => {
          this.showDialog = true;
        }, 500);
      }
    },
    chooseUser(user) {
      this.selectedUser = user;
      localStorage.setItem("our_view_user", user);

      // Notify entire app of user identity choice
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("user-identity-changed", { detail: user })
        );
      }

      // Smooth exit
      setTimeout(() => {
        this.showDialog = false;
      }, 400);
    },
  },
};
</script>

<style scoped>
.identity-dialog-wrapper {
  overflow: visible !important;
}

.onboarding-modal-card {
  background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0d0f1a 100%);
  border: 2px solid rgba(255, 215, 0, 0.4);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(224, 64, 251, 0.2);
  position: relative;
  overflow: hidden;
}

.welcome-title {
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #ffffff 0%, #ffd700 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.character-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.character-card:hover {
  transform: translateY(-8px) scale(1.03);
}

.timi-card:hover,
.timi-card.card-hovered {
  border-color: #FF4081;
  background: radial-gradient(circle at top, rgba(255, 64, 129, 0.18) 0%, rgba(13, 15, 26, 0.8) 100%);
  box-shadow: 0 12px 30px rgba(255, 64, 129, 0.35);
}

.ejay-card:hover,
.ejay-card.card-hovered {
  border-color: #00E5FF;
  background: radial-gradient(circle at top, rgba(0, 229, 255, 0.18) 0%, rgba(13, 15, 26, 0.8) 100%);
  box-shadow: 0 12px 30px rgba(0, 229, 255, 0.35);
}

.avatar-ring {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  position: relative;
  transition: transform 0.3s ease;
}

.character-card:hover .avatar-ring {
  transform: scale(1.1) rotate(6deg);
}

.timi-ring {
  background: linear-gradient(135deg, rgba(255, 64, 129, 0.3) 0%, rgba(224, 64, 251, 0.2) 100%);
  border: 2px solid #FF4081;
  box-shadow: 0 0 16px rgba(255, 64, 129, 0.5);
}

.ejay-ring {
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.3) 0%, rgba(0, 230, 118, 0.2) 100%);
  border: 2px solid #00E5FF;
  box-shadow: 0 0 16px rgba(0, 229, 255, 0.5);
}

.avatar-emoji {
  font-size: 30px;
}

.card-tagline {
  font-size: 12px;
  color: #9ca3af;
  min-height: 36px;
  line-height: 1.35;
}

/* Floating Sparkle Animation */
.floating-sparkles .sparkle {
  position: absolute;
  font-size: 20px;
  animation: floatSparkle 4s infinite ease-in-out;
  opacity: 0.7;
  pointer-events: none;
}

.sp-1 { top: 15px; left: 20px; animation-delay: 0s; }
.sp-2 { top: 25px; right: 25px; animation-delay: 1s; }
.sp-3 { bottom: 25px; left: 30px; animation-delay: 2s; }
.sp-4 { bottom: 20px; right: 30px; animation-delay: 1.5s; }
.sp-5 { top: 50%; right: 10px; animation-delay: 2.5s; }

@keyframes floatSparkle {
  0%, 100% { transform: translateY(0) scale(0.9); opacity: 0.4; }
  50% { transform: translateY(-10px) scale(1.2); opacity: 0.9; }
}
</style>
