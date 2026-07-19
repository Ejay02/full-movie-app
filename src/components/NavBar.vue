<template>
  <nav>
    <v-app-bar app color="pink" dark>
      <v-btn text class="ml-2" to="/">
        <v-icon class="mr-2">mdi-movie-open</v-icon>

        Ej's Movie</v-btn
      >

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
      <v-btn text class="ml-2" to="/movies">Movies</v-btn>
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

<script>
export default {
  name: "NavBar",
};
</script>

<style></style>
