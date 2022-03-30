<template>
  <nav>
    <v-system-bar app dark>
      <v-spacer></v-spacer>
      <v-icon>mdi-minus</v-icon>
      <v-icon>mdi-checkbox-blank-outline</v-icon>
    </v-system-bar>
    <v-app-bar app color="pink" dark>
      <v-icon class="mr-2">fas fa-video</v-icon>
      <v-toolbar-title>Ej Movie</v-toolbar-title>
      <v-btn text class="ml-2" to="/">Movies</v-btn>
      <v-btn text class="ml-2" to="/actors">Actors</v-btn>
      <v-btn text class="ml-2">Profile</v-btn>
      <v-btn text class="ml-2">Contact</v-btn>
      <v-spacer></v-spacer>
      <v-autocomplete
        clearable
        hide-no-data
        hide-selected
        color="white"
        label="search"
        prepend-inner-icon="search"
        flat
      >
      </v-autocomplete>
      <v-btn icon>
        <v-badge color="green" content="2" overlap>
          <v-icon>far fa-bell</v-icon>
        </v-badge>
      </v-btn>
      <v-badge
        bordered
        bottom
        color="green"
        dot
        offset-x="10"
        offset-y="10"
      >
      <v-avatar size="40">
        <!-- <v-img src="https://cdn.vuetifyjs.com/images/john.jpg"></v-img> -->
        <v-img src="../assets/20201010_063656.jpg"></v-img>
      </v-avatar>
      </v-badge>
      <v-icon>fas fa-user-circle</v-icon>
    </v-app-bar>
  </nav>
</template>

<script>
export default {
  data: () => ({
    drawer: null,
  }),
};
</script>

<style></style>
