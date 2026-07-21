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

  <div class="home-page px-2 px-sm-4" v-else>
    <ContinueWatchingSection />

    <div class="section-header">
      <div>
        <p class="eyebrow mb-1">Tonight's Picks</p>
        <h2 class="section-title mb-2">Popular Movies</h2>
      </div>
    </div>
    <v-alert v-if="!popularMovies || !popularMovies.length" outlined type="info" class="mt-6">
      No popular movies are available right now.
    </v-alert>
    <v-slide-group v-else class="content-slider pa-0 mb-8" show-arrows>
      <v-slide-item v-for="movie in popularMovies" :key="movie.id">
        <div class="carousel-card mr-4 my-2">
          <MovieCard :movie="movie" :genres="genres" />
        </div>
      </v-slide-item>
    </v-slide-group>

    <div class="section-header">
      <div>
        <p class="eyebrow mb-1">Binge Worthy</p>
        <h2 class="section-title mb-2">Popular Shows</h2>
      </div>
    </div>
    <v-alert v-if="!popularShows || !popularShows.length" outlined type="info" class="mt-6">
      No popular shows are available right now.
    </v-alert>
    <v-slide-group v-else class="content-slider pa-0 mb-8" show-arrows>
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
import ContinueWatchingSection from "@/components/ContinueWatchingSection.vue";

export default {
  components: {
    MovieCard,
    TvCard,
    UpcomingMovies,
    ContinueWatchingSection,
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
        // Genres must be sequential — fetchTvGenres depends on this.genres being populated first
        await this.fetchMovieGenres();
        await this.fetchTvGenres();
        // Movies and shows are independent — run in parallel
        await Promise.all([
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
      this.popularMovies = response.data?.results || [];
    },
    async fetchPopularShows() {
      const response = await this.$http.get("/trending/tv/day?language=en-US");
      this.popularShows = response.data?.results || [];
    },
    async fetchMovieGenres() {
      const response = await this.$http.get("/genre/movie/list");
      this.genres = response.data?.genres || [];
    },
    async fetchTvGenres() {
      const response = await this.$http.get("/genre/tv/list");
      const tvGenres = response.data?.genres || [];
      const existingIds = new Set((this.genres || []).map((genre) => genre.id));
      const newGenres = tvGenres.filter((genre) => !existingIds.has(genre.id));
      this.genres = [...(this.genres || []), ...newGenres];
    },
  },
};
</script>
<style>
.loading-container {
  min-height: 400px;
}

.home-page {
  padding-top: 12px;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 18px;
}

.eyebrow {
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section-title {
  color: #ffffff;
  font-size: 1.8rem;
  line-height: 1.15;
}

.content-slider {
  position: relative;
}

.carousel-card {
  width: 200px;
}

@media (max-width: 600px) {
  .section-title {
    font-size: 1.45rem;
  }

  .carousel-card {
    width: 150px;
  }
}
</style>
