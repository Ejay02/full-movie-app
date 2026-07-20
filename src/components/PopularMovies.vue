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

  <div class="movies-hub-page mx-3" v-else>
    <ContinueWatchingSection />

    <!-- Filters Control Bar -->
    <div class="d-flex align-center justify-space-between flex-wrap mt-4 mb-6 filter-bar-panel">
      <div class="d-flex align-center flex-wrap gap-3">
        <h2 class="white--text text-h5 font-weight-bold mr-4">Movies</h2>
        
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
        class="sort-filter-select ml-4 mt-2 mt-sm-0"
        @change="fetchGenreMovies"
      ></v-select>
    </div>

    <!-- Loading Genre State (With ample spacing below filter controls) -->
    <div v-if="loadingGenre" class="d-flex justify-center align-center py-16 mt-12">
      <v-progress-circular indeterminate color="error" size="50"></v-progress-circular>
    </div>

    <!-- Sectioned View (When selectedGenre is 'all') -->
    <div v-else-if="selectedGenre === 'all'">
      <!-- Section 1: Trending -->
      <div class="hub-section mb-8">
        <div class="section-header mb-3 d-flex flex-column align-start">
          <span class="eyebrow red--text font-weight-bold text-uppercase tracking-wider text-caption mb-1">Hot Today</span>
          <h3 class="white--text text-h6 font-weight-bold">Trending Now</h3>
        </div>
        <v-slide-group class="content-slider pa-0" show-arrows>
          <v-slide-item v-for="movie in trendingMovies" :key="`trending-${movie.id}`">
            <div class="carousel-card mr-4 my-2">
              <MovieCard :movie="movie" :genres="genres" />
            </div>
          </v-slide-item>
        </v-slide-group>
      </div>

      <!-- Section 2: Popular -->
      <div class="hub-section mb-8">
        <div class="section-header mb-3 d-flex flex-column align-start">
          <span class="eyebrow grey--text text--lighten-1 font-weight-bold text-uppercase tracking-wider text-caption mb-1">Fan Favorites</span>
          <h3 class="white--text text-h6 font-weight-bold">Popular Movies</h3>
        </div>
        <v-slide-group class="content-slider pa-0" show-arrows>
          <v-slide-item v-for="movie in popularMovies" :key="`popular-${movie.id}`">
            <div class="carousel-card mr-4 my-2">
              <MovieCard :movie="movie" :genres="genres" />
            </div>
          </v-slide-item>
        </v-slide-group>
      </div>

      <!-- Section 3: Top Rated -->
      <div class="hub-section mb-8">
        <div class="section-header mb-3 d-flex flex-column align-start">
          <span class="eyebrow grey--text text--lighten-1 font-weight-bold text-uppercase tracking-wider text-caption mb-1">Critically Acclaimed</span>
          <h3 class="white--text text-h6 font-weight-bold">Top Rated</h3>
        </div>
        <v-slide-group class="content-slider pa-0" show-arrows>
          <v-slide-item v-for="movie in topRatedMovies" :key="`top-${movie.id}`">
            <div class="carousel-card mr-4 my-2">
              <MovieCard :movie="movie" :genres="genres" />
            </div>
          </v-slide-item>
        </v-slide-group>
      </div>
    </div>

    <!-- Grid View (When a specific genre is selected, with top margin spacing) -->
    <div v-else class="mt-6">
      <v-alert v-if="!genreMovies.length" outlined type="info" class="mt-6">
        No movies found under this category.
      </v-alert>
      <v-container v-else fluid class="pa-0">
        <v-row dense>
          <v-col
            cols="6"
            sm="4"
            md="3"
            lg="2"
            v-for="movie in genreMovies"
            :key="`genre-${movie.id}`"
            class="pa-2"
          >
            <MovieCard :movie="movie" :genres="genres" />
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script>
import MovieCard from "../components/MovieCard.vue";
import ContinueWatchingSection from "../components/ContinueWatchingSection.vue";

export default {
  name: "PopularMovies",
  components: {
    MovieCard,
    ContinueWatchingSection,
  },
  data() {
    return {
      trendingMovies: [],
      popularMovies: [],
      topRatedMovies: [],
      genreMovies: [],
      genres: [],
      selectedGenre: "all",
      sortBy: "popularity.desc",
      loading: true,
      loadingGenre: false,
      errorMessage: "",

      sortOptions: [
        { text: "Popularity (High to Low)", value: "popularity.desc" },
        { text: "Popularity (Low to High)", value: "popularity.asc" },
        { text: "Rating (High to Low)", value: "vote_average.desc" },
        { text: "Rating (Low to High)", value: "vote_average.asc" },
        { text: "Release Year (Newest)", value: "release_date.desc" },
        { text: "Release Year (Oldest)", value: "release_date.asc" }
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
        this.errorMessage = "Unable to load movie database lists right now.";
        console.error("Failed to load page lists:", error);
      } finally {
        this.loading = false;
      }
    },
    async fetchGenres() {
      const response = await this.$http.get("/genre/movie/list");
      this.genres = response.data.genres || [];
    },
    async fetchTrending() {
      const response = await this.$http.get("/trending/movie/week?language=en-US");
      this.trendingMovies = response.data.results || [];
    },
    async fetchPopular() {
      const response = await this.$http.get("/movie/popular?language=en-US");
      this.popularMovies = response.data.results || [];
    },
    async fetchTopRated() {
      const response = await this.$http.get("/movie/top_rated?language=en-US");
      this.topRatedMovies = response.data.results || [];
    },
    async fetchGenreMovies() {
      if (this.selectedGenre === "all") return;
      this.loadingGenre = true;
      try {
        const response = await this.$http.get(
          `/discover/movie?with_genres=${this.selectedGenre}&sort_by=${this.sortBy}&language=en-US`
        );
        this.genreMovies = (response.data.results || []).filter(item => item.poster_path);
      } catch (error) {
        console.error("Failed to fetch discover movies:", error);
        this.genreMovies = [];
      } finally {
        this.loadingGenre = false;
      }
    },
    async handleGenreChange() {
      if (this.selectedGenre === "all") {
        this.genreMovies = [];
      } else {
        await this.fetchGenreMovies();
      }
    }
  }
};
</script>

<style>
.loading-container {
  min-height: 400px;
}

.movies-hub-page {
  padding-top: 12px;
}

.filter-bar-panel {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 16px;
}

.genre-filter-select {
  width: 220px;
}

.sort-filter-select {
  width: 240px;
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
    width: 150px;
  }
  .sort-filter-select {
    width: 160px;
  }
}
</style>
