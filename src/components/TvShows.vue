<template>
  <div v-if="loading" class="d-flex justify-center align-center loading-container">
    <v-progress-circular :size="70" :width="7" color="error" indeterminate></v-progress-circular>
  </div>

  <v-container v-else-if="errorMessage">
    <v-alert outlined type="error" class="mt-6">
      {{ errorMessage }}
    </v-alert>
    <v-btn color="error" class="mt-4" @click="loadPage">Try Again</v-btn>
  </v-container>

  <div class="shows-hub-page mx-3" v-else>
    <ContinueWatchingSection />

    <!-- Filters Control Bar -->
    <div class="d-flex align-center justify-space-between flex-wrap mt-4 mb-6 filter-bar-panel">
      <div class="d-flex align-center flex-wrap gap-3">
        <h2 class="white--text text-h5 font-weight-bold mr-4">TV Shows</h2>
        
        <!-- Genre Filter Dropdown -->
        <v-select
          v-model="selectedGenre"
          :items="genreOptions"
          label="Genre"
          dense
          outlined
          hide-details
          class="genre-filter-select"
          @change="handleGenreChange"
        ></v-select>
      </div>

      <!-- Sort Filter (visible only when a specific genre is chosen) -->
      <v-select
        v-if="selectedGenre !== 'all'"
        v-model="sortBy"
        :items="sortOptions"
        label="Sort By"
        dense
        outlined
        hide-details
        class="sort-filter-select"
        @change="fetchGenreShows"
      ></v-select>
    </div>

    <!-- Loading Genre State -->
    <div v-if="loadingGenre" class="d-flex justify-center align-center py-12">
      <v-progress-circular indeterminate color="error" size="40"></v-progress-circular>
    </div>

    <!-- Sectioned View (When selectedGenre is 'all') -->
    <div v-else-if="selectedGenre === 'all'">
      <!-- Section 1: Trending -->
      <div class="hub-section mb-8">
        <div class="section-header mb-3">
          <p class="eyebrow red--text mb-1 font-weight-bold">Hot This Week</p>
          <h3 class="white--text text-h6 font-weight-bold">Trending Now</h3>
        </div>
        <v-slide-group class="content-slider pa-0" show-arrows>
          <v-slide-item v-for="show in trendingShows" :key="`trending-${show.id}`">
            <div class="carousel-card mr-4 my-2">
              <TvCard :show="show" :genres="genres" />
            </div>
          </v-slide-item>
        </v-slide-group>
      </div>

      <!-- Section 2: Popular -->
      <div class="hub-section mb-8">
        <div class="section-header mb-3">
          <p class="eyebrow mb-1">Binge Worthy</p>
          <h3 class="white--text text-h6 font-weight-bold">Popular Shows</h3>
        </div>
        <v-slide-group class="content-slider pa-0" show-arrows>
          <v-slide-item v-for="show in popularShows" :key="`popular-${show.id}`">
            <div class="carousel-card mr-4 my-2">
              <TvCard :show="show" :genres="genres" />
            </div>
          </v-slide-item>
        </v-slide-group>
      </div>

      <!-- Section 3: Top Rated -->
      <div class="hub-section mb-8">
        <div class="section-header mb-3">
          <p class="eyebrow mb-1">Top Rated In Broadcast</p>
          <h3 class="white--text text-h6 font-weight-bold">Top Rated</h3>
        </div>
        <v-slide-group class="content-slider pa-0" show-arrows>
          <v-slide-item v-for="show in topRatedShows" :key="`top-${show.id}`">
            <div class="carousel-card mr-4 my-2">
              <TvCard :show="show" :genres="genres" />
            </div>
          </v-slide-item>
        </v-slide-group>
      </div>
    </div>

    <!-- Grid View (When a specific genre is selected) -->
    <div v-else>
      <v-alert v-if="!genreShows.length" outlined type="info" class="mt-6">
        No TV shows found under this category.
      </v-alert>
      <v-container v-else fluid class="pa-0">
        <v-row dense>
          <v-col
            cols="6"
            sm="4"
            md="3"
            lg="2"
            v-for="show in genreShows"
            :key="`genre-${show.id}`"
            class="pa-2"
          >
            <TvCard :show="show" :genres="genres" />
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script>
import TvCard from "../components/TvCard.vue";
import ContinueWatchingSection from "../components/ContinueWatchingSection.vue";

export default {
  name: "TvShows",
  components: {
    TvCard,
    ContinueWatchingSection,
  },
  data() {
    return {
      trendingShows: [],
      popularShows: [],
      topRatedShows: [],
      genreShows: [],
      genres: [],
      selectedGenre: "all",
      sortBy: "popularity.desc",
      loading: true,
      loadingGenre: false,
      errorMessage: "",

      sortOptions: [
        { text: "Popularity", value: "popularity.desc" },
        { text: "Rating", value: "vote_average.desc" },
        { text: "Air Date", value: "first_air_date.desc" }
      ]
    };
  },
  computed: {
    genreOptions() {
      const base = [{ text: "All Genres", value: "all" }];
      const parsed = this.genres.map(g => ({
        text: g.name,
        value: g.id
      }));
      return [...base, ...parsed];
    }
  },
  async mounted() {
    await this.loadPage();
  },
  methods: {
    async loadPage() {
      this.loading = true;
      this.errorMessage = "";
      try {
        await Promise.all([
          this.fetchGenres(),
          this.fetchTrending(),
          this.fetchPopular(),
          this.fetchTopRated()
        ]);
      } catch (error) {
        this.errorMessage = "Unable to load TV show database lists right now.";
        console.error("Failed to load page lists:", error);
      } finally {
        this.loading = false;
      }
    },
    async fetchGenres() {
      const response = await this.$http.get("/genre/tv/list");
      this.genres = response.data.genres || [];
    },
    async fetchTrending() {
      const response = await this.$http.get("/trending/tv/week?language=en-US");
      this.trendingShows = response.data.results || [];
    },
    async fetchPopular() {
      const response = await this.$http.get("/tv/popular?language=en-US");
      this.popularShows = response.data.results || [];
    },
    async fetchTopRated() {
      const response = await this.$http.get("/tv/top_rated?language=en-US");
      this.topRatedShows = response.data.results || [];
    },
    async fetchGenreShows() {
      if (this.selectedGenre === "all") return;
      this.loadingGenre = true;
      try {
        const response = await this.$http.get(
          `/discover/tv?with_genres=${this.selectedGenre}&sort_by=${this.sortBy}&language=en-US`
        );
        this.genreShows = (response.data.results || []).filter(item => item.poster_path);
      } catch (error) {
        console.error("Failed to fetch discover TV shows:", error);
        this.genreShows = [];
      } finally {
        this.loadingGenre = false;
      }
    },
    async handleGenreChange() {
      if (this.selectedGenre === "all") {
        this.genreShows = [];
      } else {
        await this.fetchGenreShows();
      }
    }
  }
};
</script>

<style>
.loading-container {
  min-height: 400px;
}

.shows-hub-page {
  padding-top: 12px;
}

.filter-bar-panel {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 16px;
}

.genre-filter-select {
  width: 180px;
}

.sort-filter-select {
  width: 160px;
}

.genre-filter-select >>> .v-input__control,
.sort-filter-select >>> .v-input__control {
  border-radius: 10px !important;
}

.hub-section {
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  padding-bottom: 24px;
}

.carousel-card {
  width: 200px;
}

.gap-3 {
  gap: 12px;
}

@media (max-width: 600px) {
  .carousel-card {
    width: 150px;
  }
  .genre-filter-select {
    width: 140px;
  }
  .sort-filter-select {
    width: 130px;
  }
}
</style>
