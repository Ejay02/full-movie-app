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
    <h2 class="mb-4 mt-4 grey--text text-center">Trending Today</h2>

    <v-container fluid x-small>
      <v-row>
        <v-col
          cols="12"
          sm="12"
          md="6"
          lg="3"
          xl="3"
          v-for="movie in movies"
          :key="movie.id"
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
      loading: true,
    };
  },
  async mounted() {
    try {
      await Promise.all([
        this.fetchMovieGenres(),
        this.fetchTvGenres(),
        this.fetchMovies(),
      ]);
    } catch (error) {
      console.log(error);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async fetchMovies() {
      try {
        const response = await this.$http.get(
          "/trending/all/day?language=en-US"
        );
        this.movies = response.data.results.filter((item) =>
          ["movie", "tv"].includes(item.media_type)
        );
      } catch (error) {
        console.log(error);
      }
    },
    async fetchMovieGenres() {
      try {
        const response = await this.$http.get("/genre/movie/list");
        this.genres = response.data.genres;
      } catch (error) {
        console.log(error);
      }
    },
    async fetchTvGenres() {
      try {
        const response = await this.$http.get("/genre/tv/list");
        const existingIds = new Set(this.genres.map((genre) => genre.id));
        const tvGenres = response.data.genres.filter(
          (genre) => !existingIds.has(genre.id)
        );
        this.genres = [...this.genres, ...tvGenres];
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
