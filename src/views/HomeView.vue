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
    <h2 class="mb-4 mt-4 grey--text text-center">Trending Today</h2>
    <h2 class="mb-4 mt-4 grey--text text-center">Trending Today</h2>
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
          class="movie-col"
        >
          <HomeCard :movie="movie" :genres="genres" />
        </v-col>
      </v-row>
    </v-container>
    <upcoming-movies />
  </div>
</template>
<script>
import HomeCard from "../components/HomeCard.vue";
import UpcomingMovies from "@/components/UpcomingMovies.vue";
export default {
  components: {
    HomeCard,
    UpcomingMovies,
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
          this.fetchMovies(),
        ]);
      } catch (error) {
        this.errorMessage = "Unable to load trending titles right now.";
        console.log(error);
      } finally {
        this.loading = false;
      }
    },
    async fetchMovies() {
      const response = await this.$http.get("/trending/all/day?language=en-US");
      this.movies = response.data.results.filter((item) =>
        ["movie", "tv"].includes(item.media_type),
      );
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

.movie-col {
  flex: 0 0 11.11%;
  max-width: 11.11%;
}

@media (max-width: 1263px) {
  .movie-col {
    flex: 0 0 25%;
    max-width: 25%;
  }
}

@media (max-width: 959px) {
  .movie-col {
    flex: 0 0 33.33%;
    max-width: 33.33%;
  }
}

@media (max-width: 599px) {
  .movie-col {
    flex: 0 0 50%;
    max-width: 50%;
  }
}
</style>
