<template>
  <nav>
    <v-app-bar app flat dark class="glass-nav px-4">
      <v-btn text class="ml-2 brand-btn text-none" to="/">
        <v-icon class="mr-2">mdi-movie-open</v-icon>
        Timi's Stream
      </v-btn>

      <!-- <v-btn text class="ml-2">Contact</v-btn> -->
      <v-spacer></v-spacer>

      <!-- search -->
      <v-text-field
        v-model="searchQuery"
        flat
        solo-inverted
        dense
        hide-details
        prepend-inner-icon="mdi-magnify"
        label="Search..."
        class="search-bar mr-4"
        clearable
        @keydown.enter="triggerSearch"
      ></v-text-field>

      <div class="nav-links d-flex align-center">
        <v-btn text class="ml-2 nav-link" :class="{ 'nav-link--active': isActive('/') }" to="/">Home</v-btn>
        <v-btn
          text
          class="ml-2 nav-link"
          :class="{ 'nav-link--active': isActive('/movies') }"
          to="/movies"
        >
          Movies
        </v-btn>
        <v-btn
          text
          class="ml-2 nav-link"
          :class="{ 'nav-link--active': isActive('/shows') }"
          to="/shows"
        >
          TV Shows
        </v-btn>
        <v-btn
          icon
          class="ml-2 nav-link dstv-nav-btn"
          :class="{ 'nav-link--active': isActive('/dstv') }"
          to="/dstv"
          title="DStv Stream"
        >
          <v-img
            src="https://cdn-1.webcatalog.io/catalog/dstv-now/dstv-now-icon-filled-256.png"
            max-width="32"
            max-height="32"
            contain
            class="rounded-lg"
          ></v-img>
        </v-btn>
        <v-btn
          text
          class="ml-2 nav-link"
          :class="{ 'nav-link--active': $route.path === '/our-view' && $route.query.tab === 'games' }"
          to="/our-view?tab=games"
        >
          <v-icon left x-small color="#E040FB">mdi-gamepad-variant</v-icon>
          Games 🎮
        </v-btn>
        <!-- Views Dropdown (My View & Our View) -->
        <v-menu
          offset-y
          transition="slide-y-transition"
          content-class="views-menu-dropdown"
          rounded="lg"
          min-width="240"
        >
          <template #activator="{ on, attrs }">
            <v-btn
              text
              class="ml-2 nav-link views-nav-btn"
              :class="{ 'nav-link--active': isViewsActive }"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon v-if="isActive('/our-view')" left x-small color="#00E5FF">mdi-account-group</v-icon>
              <span>{{ activeViewLabel }}</span>
              <v-icon right x-small class="ml-1">mdi-chevron-down</v-icon>
            </v-btn>
          </template>

          <v-list dark dense class="views-dropdown-list py-2">
            <v-list-item to="/my-view" :class="{ 'v-list-item--active': isActive('/my-view') }">
              <v-list-item-icon class="mr-3">
                <v-icon small color="white">mdi-view-grid-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title class="font-weight-bold">My View</v-list-item-title>
                <v-list-item-subtitle class="caption grey--text">Personal Watchlist</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-list-item to="/our-view" :class="{ 'v-list-item--active': isActive('/our-view') && $route.query.tab !== 'games' }">
              <v-list-item-icon class="mr-3">
                <v-icon small color="#00E5FF">mdi-account-group</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title class="font-weight-bold cyan--text" style="color: #00E5FF;">Our View</v-list-item-title>
                <v-list-item-subtitle class="caption grey--text">Date Night & Watch Together</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-list-item to="/our-view?tab=games" :class="{ 'v-list-item--active': $route.path === '/our-view' && $route.query.tab === 'games' }">
              <v-list-item-icon class="mr-3">
                <v-icon small color="#E040FB">mdi-gamepad-variant</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title class="font-weight-bold" style="color: #E040FB;">Game Night 🎮</v-list-item-title>
                <v-list-item-subtitle class="caption grey--text">WHOT! & Word Duel</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-divider class="my-2"></v-divider>

            <v-list-item @click="copyInviteLink">
              <v-list-item-icon class="mr-3">
                <v-icon small color="#00E5FF">mdi-link-variant</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title class="font-weight-medium">Copy Invite Link</v-list-item-title>
                <v-list-item-subtitle class="caption grey--text">Date Night room link</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>

            <v-divider class="my-2"></v-divider>

            <!-- Identity Switcher -->
            <div class="px-4 py-2">
              <div class="grey--text caption font-weight-bold mb-2">Watching as:</div>
              <v-btn-toggle
                v-model="currentUser"
                mandatory
                dense
                class="navbar-user-toggle d-flex"
                @change="switchUser"
              >
                <v-btn value="Timi" small class="text-none font-weight-bold flex-grow-1">
                  <v-icon x-small left color="#E040FB">{{ timiIcon }}</v-icon>
                  Timi
                </v-btn>
                <v-btn value="Ejay" small class="text-none font-weight-bold flex-grow-1">
                  <v-icon x-small left color="#00E5FF">{{ ejayIcon }}</v-icon>
                  Ejay
                </v-btn>
              </v-btn-toggle>
            </div>
          </v-list>
        </v-menu>
      </div>

      <!-- User Avatar with Profile Switcher Menu -->
      <v-menu offset-y transition="slide-y-transition" rounded="lg" min-width="180">
        <template #activator="{ on, attrs }">
          <v-badge
            bordered
            bottom
            :color="currentUser === 'Timi' ? '#FF4081' : '#00E5FF'"
            dot
            offset-x="10"
            offset-y="10"
            class="ml-2 cursor-pointer"
            v-bind="attrs"
            v-on="on"
          >
            <v-avatar size="40" class="nav-avatar">
              <v-img src="../assets/20201010_063656.jpg"></v-img>
            </v-avatar>
          </v-badge>
        </template>
        <v-list dark dense class="profile-dropdown-list py-2">
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="font-weight-bold">
                {{ currentUser }}
                <v-icon x-small :color="currentUser === 'Timi' ? '#E040FB' : '#00E5FF'" class="ml-1">
                  {{ currentUser === 'Timi' ? timiIcon : ejayIcon }}
                </v-icon>
              </v-list-item-title>
              <v-list-item-subtitle class="caption grey--text">Active Profile</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-divider class="my-1"></v-divider>
          <v-list-item @click="switchUser(currentUser === 'Timi' ? 'Ejay' : 'Timi')">
            <v-list-item-icon class="mr-3">
              <v-icon small color="#00E5FF">mdi-account-switch</v-icon>
            </v-list-item-icon>
            <v-list-item-title class="caption">
              Switch to {{ currentUser === 'Timi' ? 'Ejay' : 'Timi' }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item @click="openIconSelector">
            <v-list-item-icon class="mr-3">
              <v-icon small color="#00E5FF">mdi-palette-swatch-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-title class="caption">Change Profile Icon 🎨</v-list-item-title>
          </v-list-item>
          <v-list-item @click="openIdentityModal">
            <v-list-item-icon class="mr-3">
              <v-icon small color="#FFD700">mdi-party-popper</v-icon>
            </v-list-item-icon>
            <v-list-item-title class="caption">Who is Watching? 🥂</v-list-item-title>
          </v-list-item>
          <v-list-item to="/our-view">
            <v-list-item-icon class="mr-3">
              <v-icon small color="#FF4081">mdi-television-play</v-icon>
            </v-list-item-icon>
            <v-list-item-title class="caption">Watch Together</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Global Navbar Snackbar -->
      <v-snackbar v-model="snackbar" timeout="2500" top color="rgba(10, 14, 24, 0.95)">
        <div class="d-flex align-center">
          <v-icon small color="#00E5FF" class="mr-2">mdi-check-circle</v-icon>
          <span class="white--text font-weight-medium text-caption">{{ snackbarText }}</span>
        </div>
      </v-snackbar>
    </v-app-bar>
  </nav>
</template>

<script>
export default {
  name: "NavBar",
  data() {
    return {
      searchQuery: this.$route.query.q || "",
      currentUser: localStorage.getItem("our_view_user") || "Timi",
      timiIcon: localStorage.getItem("timi_user_icon") || "mdi-crown",
      ejayIcon: localStorage.getItem("ejay_user_icon") || "mdi-lightning-bolt",
      snackbar: false,
      snackbarText: "",
    };
  },
  computed: {
    isViewsActive() {
      return this.isActive("/my-view") || this.isActive("/our-view");
    },
    activeViewLabel() {
      if (this.isActive("/our-view")) return "Our View";
      return "My View";
    },
  },
  watch: {
    "$route.query.q"(newVal) {
      this.searchQuery = newVal || "";
    },
  },
  mounted() {
    window.addEventListener("user-identity-changed", this.syncIdentity);
    window.addEventListener("storage", this.handleStorage);
    window.addEventListener("user-icons-updated", this.syncUserIcons);
  },
  beforeDestroy() {
    window.removeEventListener("user-identity-changed", this.syncIdentity);
    window.removeEventListener("storage", this.handleStorage);
    window.removeEventListener("user-icons-updated", this.syncUserIcons);
  },
  methods: {
    isActive(path) {
      if (path === "/") {
        return this.$route.path === "/";
      }

      return this.$route.path.startsWith(path);
    },
    triggerSearch() {
      const q = this.searchQuery ? this.searchQuery.trim() : "";
      if (!q) {
        return;
      }
      this.$router.push({
        path: "/search",
        query: { q },
      }).catch(() => {});
    },
    switchUser(user) {
      this.currentUser = user;
      localStorage.setItem("our_view_user", user);
      window.dispatchEvent(new CustomEvent("user-identity-changed", { detail: user }));
      this.showToast(`Switched profile to ${user}`);
    },
    openIdentityModal() {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-identity-selector"));
      }
    },
    openIconSelector() {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-icon-selector", { detail: this.currentUser }));
      }
    },
    syncUserIcons(e) {
      if (e && e.detail) {
        this.timiIcon = e.detail.timiIcon || this.timiIcon;
        this.ejayIcon = e.detail.ejayIcon || this.ejayIcon;
      }
    },
    syncIdentity(e) {
      if (e && e.detail) {
        this.currentUser = e.detail;
      } else {
        this.currentUser = localStorage.getItem("our_view_user") || "Timi";
      }
    },
    handleStorage(e) {
      if (e.key === "our_view_user" && e.newValue) {
        this.currentUser = e.newValue;
      }
    },
    copyInviteLink() {
      let url = `${window.location.origin}/our-view?room=date-night`;
      try {
        const saved = localStorage.getItem("our-view-active-media-date-night");
        if (saved) {
          const media = JSON.parse(saved);
          if (media && media.mediaType && media.mediaId) {
            url += `&mediaType=${encodeURIComponent(media.mediaType)}&id=${encodeURIComponent(media.mediaId)}&title=${encodeURIComponent(media.title || "")}`;
            if (media.season) url += `&season=${encodeURIComponent(media.season)}`;
            if (media.episode) url += `&episode=${encodeURIComponent(media.episode)}`;
          }
        }
      } catch (e) {
        // ignore parse error
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          this.showToast("Date Night invite link copied! 🥂");
        });
      }
    },
    showToast(msg) {
      this.snackbarText = msg;
      this.snackbar = true;
    },
  },
};
</script>

<style>
.glass-nav {
  margin: 12px;
  width: calc(100% - 24px) !important;
  border-radius: 22px !important;
  background: rgba(10, 14, 24, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.32);
}

.search-bar {
  max-width: 200px;
  transition: max-width 0.3s ease;
}

.search-bar .v-input__control {
  min-height: 36px !important;
  border-radius: 20px !important;
}

.search-bar.v-text-field--solo-inverted.v-input--is-focused {
  max-width: 280px;
}

.brand-btn {
  letter-spacing: 0.02em;
  font-weight: 700;
  text-transform: none !important;
  font-size: 1.05rem !important;
}

.nav-link {
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.72) !important;
  transition: all 0.25s ease;
}

.nav-link:hover {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.08);
}

.nav-link--active {
  color: #ffffff !important;
  background: linear-gradient(135deg, rgba(229, 9, 20, 0.9), rgba(255, 82, 82, 0.65));
  box-shadow: 0 10px 22px rgba(229, 9, 20, 0.28);
}

.our-view-nav-link.nav-link--active {
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.9), rgba(255, 64, 129, 0.75)) !important;
  box-shadow: 0 10px 22px rgba(233, 30, 99, 0.35) !important;
}

.views-dropdown-list,
.profile-dropdown-list {
  background: rgba(10, 14, 25, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  backdrop-filter: blur(16px);
}

.navbar-user-toggle {
  background: rgba(255, 255, 255, 0.08) !important;
  border-radius: 999px !important;
  padding: 2px;
}

.navbar-user-toggle .v-btn--active {
  background: rgba(255, 64, 129, 0.35) !important;
  color: #fff !important;
}

.nav-avatar {
  border: 2px solid rgba(255, 255, 255, 0.15);
  transition: transform 0.2s ease;
}

.nav-avatar:hover {
  transform: scale(1.05);
}

.cursor-pointer {
  cursor: pointer;
}

@media (max-width: 760px) {
  .glass-nav {
    margin: 8px;
    width: calc(100% - 16px) !important;
  }

  .nav-links {
    overflow-x: auto;
    max-width: 55vw;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .nav-links::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
}
</style>
