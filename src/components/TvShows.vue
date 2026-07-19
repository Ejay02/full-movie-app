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
    <v-btn color="error" class="mt-4" @click="loadShows">Try Again</v-btn>
  </v-container>

  <div class="mx-3" v-else>
    <ContinueWatchingSection />

    <h2 class="mb-4 mt-4 grey--text text-center">Popular Shows</h2>

    <v-alert v-if="!shows.length" outlined type="info" class="mt-6">
      No TV shows are available right now.
    </v-alert>

    <v-container v-else fluid>
      <v-row dense>
        <v-col
          cols="6"
          sm="4"
          md="3"
          lg="2"
          xl="2"
          v-for="show in shows"
          :key="show.id"
        >
          <TvCard :show="show" :genres="genres" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import TvCard from "../components/TvCard";
import ContinueWatchingSection from "../components/ContinueWatchingSection.vue";

export default {
  components: {
    TvCard,
    ContinueWatchingSection,
  },
  data: function () {
    return {
      shows: [],
      genres: [],
      errorMessage: "",
      loading: true,
    };
  },
  async mounted() {
    await this.loadShows();
  },
  methods: {
    async loadShows() {
      this.loading = true;
      this.errorMessage = "";

      try {
        await Promise.all([this.fetchGenres(), this.fetchShows()]);
      } catch (error) {
        this.errorMessage = "Unable to load TV shows right now.";
        console.log(error);
      } finally {
        this.loading = false;
      }
    },
    async fetchShows() {
      const response = await this.$http.get("/trending/tv/day?language=en-US");
      this.shows = response.data.results;
    },
    async fetchGenres() {
      const response = await this.$http.get("/genre/tv/list");
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
