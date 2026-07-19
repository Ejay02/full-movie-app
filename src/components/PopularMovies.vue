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

  <div class="mx-3" v-else>
    <h2 class="mb-4 mt-4 grey--text text-center">Popular Movies</h2>

    <v-container fluid x-small>
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
      loading: true,
    };
  },
  async mounted() {
    try {
      await Promise.all([this.fetchGenres(), this.fetchMovies()]);
    } catch (error) {
      console.log(error);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async fetchMovies() {
      try {
        const response = await this.$http.get("/trending/movie/day?language=en-US");
        this.movies = response.data.results;
      } catch (error) {
        console.log(error);
      }
    },
    async fetchGenres() {
      try {
        const response = await this.$http.get("/genre/movie/list");
        this.genres = response.data.genres;
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>

<style>
.loading-container {
  min-height: 400px;
}
</style>
