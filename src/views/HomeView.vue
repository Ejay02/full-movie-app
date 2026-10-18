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
    <!-- Personal Greeting Banner -->
    <div class="greeting-banner pa-4 pa-sm-5 mb-4 d-flex align-center justify-space-between flex-wrap gap-3">
      <div>
        <h2 class="white--text text-h6 font-weight-bold mb-1">
          {{ greetingText }}
        </h2>
        <span class="grey--text text-caption">Handcrafted for you with 🖤</span>
      </div>

      <v-btn
        color="#00A3E0"
        dark
        rounded
        class="text-none font-weight-bold px-4 surprise-btn"
        @click="showSurpriseModal = true"
      >
        <v-icon left small>mdi-dice-5</v-icon>
        Surprise Me 🎲
      </v-btn>
    </div>

    <!-- Continue Watching Section -->
    <ContinueWatchingSection />

    <!-- Curated with 🖤 for You -->
    <div class="section-header">
      <div>
        <p class="eyebrow cyan--text text--accent-3 mb-1">Handpicked Favorites</p>
        <h2 class="section-title mb-2">Curated for You 🖤</h2>
      </div>
    </div>
    <v-slide-group v-if="curatedMovies && curatedMovies.length" class="content-slider pa-0 mb-8" show-arrows>
      <v-slide-item v-for="movie in curatedMovies" :key="'curated-' + movie.id">
        <div class="carousel-card mr-4 my-2">
          <MovieCard :movie="movie" :genres="genres" />
        </div>
      </v-slide-item>
    </v-slide-group>

    <!-- Popular Movies -->
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

    <!-- Popular Shows -->
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

    <!-- Surprise Me Modal -->
    <SurpriseModal v-model="showSurpriseModal" :genres="genres" />
  </div>
</template>
<script>
import MovieCard from "../components/MovieCard.vue";
import TvCard from "../components/TvCard.vue";
import UpcomingMovies from "@/components/UpcomingMovies.vue";
import ContinueWatchingSection from "@/components/ContinueWatchingSection.vue";
import SurpriseModal from "@/components/SurpriseModal.vue";

export default {
  components: {
    MovieCard,
    TvCard,
    UpcomingMovies,
    ContinueWatchingSection,
    SurpriseModal,
  },
  data: function () {
    return {
      curatedMovies: [],
      popularMovies: [],
      popularShows: [],
      genres: [],
      errorMessage: "",
      loading: true,
      showSurpriseModal: false,
    };
  },
  computed: {
    greetingText() {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return "Good morning ☕ Ready for movie time?";
      if (hour >= 12 && hour < 14) return "Noon movie time ☀️ Popcorn ready? 🍿";
      if (hour >= 14 && hour < 18) return "Good afternoon ☀️ Time for a cozy movie break?";
      if (hour >= 18 && hour < 22) return "Good evening ✨ Movie Night time!";
      return "Late night cinema 🌙 Popcorn ready? 🍿";
    },
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
        // Movies, curated picks and shows in parallel
        await Promise.all([
          this.fetchCuratedMovies(),
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
    async fetchCuratedMovies() {
      try {
        const response = await this.$http.get(
          "/discover/movie?vote_average.gte=7.8&vote_count.gte=1200&sort_by=popularity.desc"
        );
        this.curatedMovies = response.data?.results || [];
      } catch (e) {
        this.curatedMovies = [];
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

.greeting-banner {
  background: linear-gradient(135deg, rgba(14, 21, 38, 0.9), rgba(0, 45, 90, 0.45));
  border: 1px solid rgba(0, 229, 255, 0.22);
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(14px);
}

.surprise-btn {
  box-shadow: 0 0 20px rgba(0, 163, 224, 0.45) !important;
  transition: transform 0.2s ease !important;
}

.surprise-btn:hover {
  transform: scale(1.05) !important;
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

.gap-3 {
  gap: 12px;
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
