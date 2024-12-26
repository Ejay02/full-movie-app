<template>
  <nav>
    <v-app-bar app color="pink" dark>
      <v-icon class="mr-2">fas fa-video</v-icon>
      <v-toolbar-title>Ej Movie</v-toolbar-title>

      <!-- <v-btn text class="ml-2">Contact</v-btn> -->
      <v-spacer></v-spacer>

      <!-- search -->
      <!-- <v-autocomplete
        clearable
        hide-no-data
        hide-selected
        color="white"
        label="search"
        prepend-inner-icon="search"
        flat
        :items="movies || shows"
        item-text="title"
        item-value="id"
        id="search"
      >
        <template v-slot:item="{ item }">
          <v-btn text :to="`/movie/${item.id}`">{{ item.title }}</v-btn>
        </template>
      </v-autocomplete> -->
      <v-btn text class="ml-2" to="/">Movies</v-btn>
      <v-btn text class="ml-2" to="/shows">TV Shows</v-btn>
      <v-btn text class="ml-2" to="/actors">Actors</v-btn>
      <v-badge
        bordered
        bottom
        color="green"
        dot
        offset-x="10"
        offset-y="10"
        class="ml-2"
      >
        <v-avatar size="40">
          <v-img src="../assets/20201010_063656.jpg"></v-img>
        </v-avatar>
      </v-badge>
    </v-app-bar>
  </nav>
</template>
<!-- https://api.themoviedb.org/3/search/tv -->

<!-- https://api.themoviedb.org/3/search/movie -->

<script>
export default {
  data: () => ({
    drawer: null,
    model: "",
    search: null,
    movies: [],
    shows: [],
  }),
  mounted() {
    this.loadMovies();
    this.loadShows();
  },
  methods: {
    loadMovies: async function () {
      try {
        const response = await this.$http.get("/movie/popular");
        this.movies = response.data.results;
      } catch (error) {
        console.log(error);
      }
    },
    loadShows: async function () {
      try {
        const response = await this.$http.get("/tv/popular");
        this.shows = response.data.results;
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>

<style></style>
