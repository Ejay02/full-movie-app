<template>
  <nav>
    <v-app-bar app flat dark class="glass-nav px-4">
      <v-btn text class="ml-2 brand-btn" to="/">
        <v-icon class="mr-2">mdi-movie-open</v-icon>

        Ej's Movie</v-btn
      >

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
          text
          class="ml-2 nav-link dstv-nav-btn"
          :class="{ 'nav-link--active': isActive('/dstv') }"
          to="/dstv"
        >
          <svg width="26" height="16" viewBox="0 0 70 30" fill="none" xmlns="http://www.w3.org/2000/svg" class="mr-1">
            <rect width="70" height="30" rx="6" fill="url(#dstv-nav-grad)"/>
            <text x="7" y="21" fill="#FFFFFF" font-family="Montserrat, Arial, sans-serif" font-weight="900" font-size="19" letter-spacing="-0.5">DStv</text>
            <defs>
              <linearGradient id="dstv-nav-grad" x1="0" y1="0" x2="70" y2="30" gradientUnits="userSpaceOnUse">
                <stop stop-color="#00A3E0"/>
                <stop offset="1" stop-color="#0051A8"/>
              </linearGradient>
            </defs>
          </svg>
          DStv
        </v-btn>
        <v-btn
          text
          class="ml-2 nav-link"
          :class="{ 'nav-link--active': isActive('/my-view') }"
          to="/my-view"
        >
          My View
        </v-btn>
      </div>
      <v-badge
        bordered
        bottom
        color="green"
        dot
        offset-x="10"
        offset-y="10"
        class="ml-2"
      >
        <v-avatar size="40">
          <v-img src="../assets/20201010_063656.jpg"></v-img>
        </v-avatar>
      </v-badge>
    </v-app-bar>
  </nav>
</template>

<script>
export default {
  name: "NavBar",
  data() {
    return {
      searchQuery: this.$route.query.q || "",
    };
  },
  watch: {
    "$route.query.q"(newVal) {
      this.searchQuery = newVal || "";
    },
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
  letter-spacing: 0.04em;
  font-weight: 700;
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

@media (max-width: 760px) {
  .glass-nav {
    margin: 8px;
    width: calc(100% - 16px) !important;
  }

  .nav-links {
    overflow-x: auto;
    max-width: 55vw;
  }
}
</style>
