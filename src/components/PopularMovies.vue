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
    <v-btn color="error" class="mt-4" @click="loadPopularMovies"
      >Try Again</v-btn
    >
  </v-container>

  <div class="mx-3" v-else>
    <h2 class="mb-4 mt-4 grey--text text-center">Popular Movies</h2>

    <v-alert v-if="!movies.length" outlined type="info" class="mt-6">
      No movies are available right now.
    </v-alert>

    <v-container v-else fluid x-small>
      <v-row>
        <v-col
          cols="6"
          sm="4"
          md="3"
          lg="1"
          xl="1"
          v-for="movie in movies"
          :key="movie.id"
        >
          <MovieCard :movie="movie" :genres="genres" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import MovieCard from "../components/MovieCard";

export default {
  components: {
    MovieCard,
  },
  data: function () {
    return {
      movies: [],
      genres: [],
      errorMessage: "",
      loading: true,
    };
  },
  async mounted() {
    await this.loadPopularMovies();
  },
  methods: {
    async loadPopularMovies() {
      this.loading = true;
      this.errorMessage = "";

      try {
        await Promise.all([this.fetchGenres(), this.fetchMovies()]);
      } catch (error) {
        this.errorMessage = "Unable to load popular movies right now.";
        console.log(error);
      } finally {
        this.loading = false;
      }
    },
    async fetchMovies() {
      const response = await this.$http.get(
        "/trending/movie/day?language=en-US",
      );
      this.movies = response.data.results;
    },
    async fetchGenres() {
      const response = await this.$http.get("/genre/movie/list");
      this.genres = response.data.genres;
    },
  },
};
</script>

<style>
.loading-container {
  min-height: 400px;
}
</style>
