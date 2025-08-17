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
          cols="6"
          sm="4"
          md="3"
          lg="1"
          xl="1"
          v-for="movie in movies"
          :key="movie.id"
          class="movie-col"
        >
          <HomeCard :movie="movie" :show="show" :genres="genres" />
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
      shows: [],
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
        const response = await this.$http.get(
          "/trending/all/day?language=en-US"
        );
        this.movies = response.data.results;
        console.log(response.data.results);
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
