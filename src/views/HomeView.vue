<template>
  <div
    v-if="loading"
    class="d-flex justify-center align-center loading-container"
  >
    <v-progress-circular
      :size="70"
      :width="7"
      color="primary"
      indeterminate
    ></v-progress-circular>
  </div>

  <v-container v-else-if="errorMessage">
    <v-alert outlined type="error" class="mt-6">
      {{ errorMessage }}
    </v-alert>
    <v-btn color="error" class="mt-4" @click="loadHomePage">Try Again</v-btn>
  </v-container>

  <div class="mx-3" v-else>
    <h2 class="mb-2 mt-4 grey--text">Popular Movies</h2>
    <v-alert v-if="!popularMovies.length" outlined type="info" class="mt-6">
      No popular movies are available right now.
    </v-alert>
    <v-slide-group v-else class="pa-0 mb-6" show-arrows>
      <v-slide-item v-for="movie in popularMovies" :key="movie.id">
        <div class="carousel-card mr-4 my-2">
          <MovieCard :movie="movie" :genres="genres" />
        </div>
      </v-slide-item>
    </v-slide-group>

    <h2 class="mb-2 mt-4 grey--text">Popular Shows</h2>
    <v-alert v-if="!popularShows.length" outlined type="info" class="mt-6">
      No popular shows are available right now.
    </v-alert>
    <v-slide-group v-else class="pa-0 mb-6" show-arrows>
      <v-slide-item v-for="show in popularShows" :key="show.id">
        <div class="carousel-card mr-4 my-2">
          <TvCard :show="show" :genres="genres" />
        </div>
      </v-slide-item>
    </v-slide-group>

    <upcoming-movies />
  </div>
</template>
<script>
import MovieCard from "../components/MovieCard.vue";
import TvCard from "../components/TvCard.vue";
import UpcomingMovies from "@/components/UpcomingMovies.vue";

export default {
  components: {
    MovieCard,
    TvCard,
    UpcomingMovies,
  },
  data: function () {
    return {
      popularMovies: [],
      popularShows: [],
      genres: [],
      errorMessage: "",
      loading: true,
    };
  },
  async mounted() {
    await this.loadHomePage();
  },
  methods: {
    async loadHomePage() {
      this.loading = true;
      this.errorMessage = "";

      try {
        await Promise.all([
          this.fetchMovieGenres(),
          this.fetchTvGenres(),
          this.fetchPopularMovies(),
          this.fetchPopularShows(),
        ]);
      } catch (error) {
        this.errorMessage = "Unable to load titles right now.";
        console.log(error);
      } finally {
        this.loading = false;
      }
    },
    async fetchPopularMovies() {
      const response = await this.$http.get(
        "/trending/movie/day?language=en-US",
      );
      this.popularMovies = response.data.results;
    },
    async fetchPopularShows() {
      const response = await this.$http.get("/trending/tv/day?language=en-US");
      this.popularShows = response.data.results;
    },
    async fetchMovieGenres() {
      const response = await this.$http.get("/genre/movie/list");
      this.genres = response.data.genres;
    },
    async fetchTvGenres() {
      const response = await this.$http.get("/genre/tv/list");
      const existingIds = new Set(this.genres.map((genre) => genre.id));
      const tvGenres = response.data.genres.filter(
        (genre) => !existingIds.has(genre.id),
      );
      this.genres = [...this.genres, ...tvGenres];
    },
  },
};
</script>
<style>
.loading-container {
  min-height: 400px;
}

.carousel-card {
  width: 200px;
}

@media (max-width: 600px) {
  .carousel-card {
    width: 150px;
  }
}
</style>
