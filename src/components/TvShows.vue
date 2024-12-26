<template>
  <div class="mx-3">
    <h2 class="mb-4 mt-4 grey--text text-center">Popular Shows</h2>

    <v-container fluid>
      <v-row>
        <v-col
          cols="12"
          sm="12"
          md="6"
          lg="3"
           xl="3"
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

export default {
  components: {
    TvCard,
  },
  data: function () {
    return {
      shows: [],
      genres: [],
    };
  },
  async mounted() {
    this.fetchGenres();
    try {
      const response = await this.$http.get("/tv/popular");
      this.shows = response.data.results;
    } catch (error) {
      console.log(error);
    }
  },
  methods: {
    async fetchGenres() {
      try {
        const response = await this.$http.get("/genre/tv/list");
        this.genres = response.data.genres;
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>
