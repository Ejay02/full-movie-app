<template>
  <v-dialog v-model="showDialog" max-width="480">
    <v-card class="icon-selector-card pa-6 text-center" dark>
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center">
          <v-icon color="#FFD700" class="mr-2">mdi-palette-swatch-outline</v-icon>
          <h3 class="white--text text-h6 font-weight-black mb-0">
            Choose Your Avatar
          </h3>
        </div>
        <v-btn icon small dark @click="showDialog = false">
          <v-icon small>mdi-close</v-icon>
        </v-btn>
      </div>

      <p class="grey--text text-caption mb-4">
        Choose an avatar for <strong>{{ activeUser }}</strong> — your choice stays saved:
      </p>

      <!-- Active User Tab Switcher -->
      <div class="d-flex justify-center gap-2 mb-5">
        <v-btn
          rounded
          small
          depressed
          :color="activeUser === 'Timi' ? '#E040FB' : 'rgba(255, 255, 255, 0.08)'"
          :class="activeUser === 'Timi' ? 'white--text font-weight-bold' : 'grey--text'"
          @click="activeUser = 'Timi'"
        >
          <v-icon left x-small>{{ currentTimiIcon }}</v-icon>
          Timi
        </v-btn>
        <v-btn
          rounded
          small
          depressed
          :color="activeUser === 'Ejay' ? '#00E5FF' : 'rgba(255, 255, 255, 0.08)'"
          :class="activeUser === 'Ejay' ? 'black--text font-weight-bold' : 'grey--text'"
          @click="activeUser = 'Ejay'"
        >
          <v-icon left x-small>{{ currentEjayIcon }}</v-icon>
          Ejay
        </v-btn>
      </div>

      <avatar-choices v-model="selectedAvatar" />
      <details class="mb-4"><summary class="caption grey--text">Game badge</summary>
      <!-- Icon Choices Grid -->
      <div class="icons-grid d-flex flex-wrap justify-center gap-3 mb-6">
        <div
          v-for="icon in availableIcons"
          :key="icon.name"
          class="icon-option cursor-pointer pa-3 rounded-xl d-flex flex-column align-center justify-center"
          :class="{ 'icon-selected': isSelected(icon.name) }"
          @click="selectIcon(icon.name)"
        >
          <v-icon size="32" :color="isSelected(icon.name) ? getActiveColor() : 'grey lighten-2'">
            {{ icon.name }}
          </v-icon>
          <span class="icon-label mt-1 text-caption">{{ icon.label }}</span>
        </div>
      </div>

      </details>
      <div class="d-flex justify-end gap-2">
        <v-btn text color="grey" class="text-none" @click="showDialog = false">
          Close
        </v-btn>
        <v-btn
          depressed
          color="#00E5FF"
          class="black--text font-weight-bold text-none px-6"
          @click="saveAndClose"
        >
          Save Avatar
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import AvatarChoices from "./AvatarChoices.vue";
import { avatarById } from "@/services/profileAvatars";
export const AVAILABLE_ICONS = [
  { name: "mdi-crown", label: "Crown 👑" },
  { name: "mdi-lightning-bolt", label: "Lightning ⚡" },
  { name: "mdi-popcorn", label: "Popcorn 🍿" },
  { name: "mdi-movie-open", label: "Clapper 🎬" },
  { name: "mdi-star", label: "Star ⭐" },
  { name: "mdi-fire", label: "Fire 🔥" },
  { name: "mdi-diamond", label: "Diamond 💎" },
  { name: "mdi-gamepad-variant", label: "Gamepad 🎮" },
  { name: "mdi-rocket-launch", label: "Rocket 🚀" },
  { name: "mdi-cat", label: "Cat 🐱" },
  { name: "mdi-headphones", label: "Music 🎧" },
  { name: "mdi-flower", label: "Flower 🌸" },
];

export default {
  name: "UserIconSelectorDialog",
  components: { AvatarChoices },
  data() {
    return {
      showDialog: false,
      selectedAvatar: "cinema-kid",
      activeUser: "Timi",
      currentTimiIcon: localStorage.getItem("timi_user_icon") || "mdi-crown",
      currentEjayIcon: localStorage.getItem("ejay_user_icon") || "mdi-lightning-bolt",
      availableIcons: AVAILABLE_ICONS,
    };
  },
  watch: {
    activeUser() { this.selectedAvatar = this.$store.getters.avatarForUser(this.activeUser).id; },
  },
  mounted() { window.addEventListener("open-icon-selector", this.openSelector); },
  beforeDestroy() { window.removeEventListener("open-icon-selector", this.openSelector); },
  methods: {
    openSelector(event) {
      this.activeUser = ['Timi', 'Ejay'].includes(event?.detail) ? event.detail : (localStorage.getItem('our_view_user') || 'Timi');
      this.selectedAvatar = this.$store.getters.avatarForUser(this.activeUser).id;
      this.currentTimiIcon = localStorage.getItem('timi_user_icon') || 'mdi-crown';
      this.currentEjayIcon = localStorage.getItem('ejay_user_icon') || 'mdi-lightning-bolt';
      this.showDialog = true;
    },
    getActiveColor() {
      return this.activeUser === "Timi" ? "#E040FB" : "#00E5FF";
    },
    isSelected(iconName) {
      return this.activeUser === "Timi"
        ? this.currentTimiIcon === iconName
        : this.currentEjayIcon === iconName;
    },
    selectIcon(iconName) {
      if (this.activeUser === "Timi") {
        this.currentTimiIcon = iconName;
      } else {
        this.currentEjayIcon = iconName;
      }
    },
    saveAndClose() {
      if (!avatarById(this.selectedAvatar)) return;
      this.$store.dispatch('saveProfileAvatar', { user: this.activeUser, avatarId: this.selectedAvatar });
      localStorage.setItem("timi_user_icon", this.currentTimiIcon);
      localStorage.setItem("ejay_user_icon", this.currentEjayIcon);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("user-icons-updated", {
            detail: {
              timiIcon: this.currentTimiIcon,
              ejayIcon: this.currentEjayIcon,
            },
          })
        );
      }
      this.showDialog = false;
    },
  },
};
</script>

<style scoped>
.icon-selector-card {
  background: radial-gradient(circle at center, #1e1b4b 0%, #0d0f1a 100%);
  border: 1px solid rgba(255, 215, 0, 0.35);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8);
}

.icon-option {
  width: 90px;
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  user-select: none;
}

.icon-option:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.1);
}

.icon-selected {
  border-color: #00E5FF !important;
  background: rgba(0, 229, 255, 0.15) !important;
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.4);
}

.icon-label {
  font-size: 11px;
  color: #d1d5db;
}
</style>
