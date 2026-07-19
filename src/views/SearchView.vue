<template>
  <div class="search-page-container mx-3 mt-4">
    <div class="search-header-area">
      <p class="eyebrow mb-1">Explore Cinema</p>
      <h2 class="page-title mb-4">Search Results</h2>

      <!-- Page level search input -->
      <v-text-field
        v-model="inputQuery"
        solo-inverted
        flat
        clearable
        prepend-inner-icon="mdi-magnify"
        label="Search for movies, TV shows..."
        class="page-search-field mb-6"
        @keydown.enter="handleNewSearch"
      ></v-text-field>

      <h3 v-if="queryText" class="results-subtitle mb-4">
        Showing results for <span class="highlight-text">"{{ queryText }}"</span>
      </h3>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center align-center py-12">
      <v-progress-circular
        :size="60"
        :width="6"
        color="primary"
        indeterminate
      ></v-progress-circular>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="errorMessage" outlined type="error" class="my-6">
      {{ errorMessage }}
    </v-alert>

    <!-- Empty State -->
    <div v-else-if="!results.length" class="empty-search-state py-12">
      <v-icon size="64" color="rgba(255, 255, 255, 0.3)">mdi-movie-search-outline</v-icon>
      <h3 class="mt-4 mb-2 white--text">No results found</h3>
      <p class="grey--text subtitle-1">
        We couldn't find any movies or TV shows matching "{{ queryText }}".
      </p>
    </div>

    <!-- Results Grid -->
    <div v-else class="results-grid">
      <v-container fluid class="pa-0">
        <v-row dense>
          <v-col
            v-for="item in results"
            :key="`${item.media_type}-${item.id}`"
            cols="6"
            sm="4"
            md="3"
            lg="2"
            xl="2"
            class="d-flex"
          >
            <div class="w-100 flex-grow-1">
              <MovieCard
                v-if="item.media_type === 'movie'"
                :movie="item"
                :genres="genres"
              />
              <TvCard
                v-else-if="item.media_type === 'tv'"
                :show="item"
                :genres="genres"
              />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script>
import MovieCard from "../components/MovieCard.vue";
import TvCard from "../components/TvCard.vue";

export default {
  name: "SearchView",
  components: {
    MovieCard,
    TvCard,
  },
  data() {
    return {
      inputQuery: "",
      queryText: "",
      results: [],
      genres: [],
      loading: false,
      errorMessage: "",
    };
  },
  computed: {
    routeQuery() {
      return this.$route.query.q || "";
    },
  },
  watch: {
    routeQuery: {
      handler(newQuery) {
        this.inputQuery = newQuery;
        this.queryText = newQuery;
        if (newQuery) {
          this.executeSearch(newQuery);
        } else {
          this.results = [];
        }
      },
      immediate: true,
    },
  },
  async mounted() {
    await this.fetchGenres();
  },
  methods: {
    async fetchGenres() {
      try {
        const [movieGenresRes, tvGenresRes] = await Promise.all([
          this.$http.get("/genre/movie/list"),
          this.$http.get("/genre/tv/list"),
        ]);
        const movieGenres = movieGenresRes.data.genres || [];
        const tvGenres = tvGenresRes.data.genres || [];
        const existingIds = new Set(movieGenres.map((genre) => genre.id));
        const filteredTvGenres = tvGenres.filter(
          (genre) => !existingIds.has(genre.id)
        );
        this.genres = [...movieGenres, ...filteredTvGenres];
      } catch (error) {
        console.warn("Unable to fetch genres:", error);
      }
    },
    async executeSearch(query) {
      if (!query || !query.trim()) {
        this.results = [];
        return;
      }

      this.loading = true;
      this.errorMessage = "";

      try {
        const response = await this.$http.get(
          `/search/multi?query=${encodeURIComponent(query.trim())}&language=en-US`
        );
        // Filter out results that are not movies or TV shows, and ensure they have a poster
        this.results = (response.data.results || []).filter(
          (item) =>
            (item.media_type === "movie" || item.media_type === "tv") &&
            item.poster_path
        );
      } catch (error) {
        this.errorMessage = "Something went wrong while searching. Please try again.";
        console.error("Search failed:", error);
      } finally {
        this.loading = false;
      }
    },
    handleNewSearch() {
      const q = this.inputQuery ? this.inputQuery.trim() : "";
      if (q === this.$route.query.q) {
        this.executeSearch(q);
        return;
      }
      this.$router.push({
        path: "/search",
        query: q ? { q } : {},
      }).catch(() => {});
    },
  },
};
</script>

<style scoped>
.search-page-container {
  min-height: 70vh;
  padding-top: 12px;
}

.eyebrow {
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.page-title {
  color: #ffffff;
  font-size: 2rem;
  line-height: 1.1;
}

.page-search-field {
  max-width: 500px;
}

.page-search-field >>> .v-input__control {
  border-radius: 12px !important;
}

.results-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
  font-weight: 400;
}

.highlight-text {
  color: #ff5252;
  font-weight: 600;
}

.empty-search-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 48px 24px;
}

.w-100 {
  width: 100%;
}
</style>
