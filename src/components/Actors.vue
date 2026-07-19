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
    <v-btn color="error" class="mt-4" @click="loadActors">Try Again</v-btn>
  </v-container>

  <div class="mx-3" v-else>
    <h2 class="mt-2 grey--text text-center">Popular Actors</h2>

    <v-alert v-if="!actors.length" outlined type="info" class="mt-6">
      No actors are available right now.
    </v-alert>

    <v-container v-else fluid>
      <v-row>
        <v-col
          cols="6"
          sm="4"
          md="3"
          lg="1"
          xl="1"
          :key="actor.id"
          v-for="actor in this.actors"
        >
          <ActorCard :actor="actor" />
        </v-col>
        <v-col cols="12" class="d-flex justify-center align-center mt-5">
          <v-btn
            class="mx-2"
            fab
            dark
            small
            color="error"
            :disabled="currentPage === 1"
            v-on:click.prevent="previous()"
          >
            <v-icon dark>mdi-skip-previous</v-icon>
          </v-btn>
          <span class="grey--text text--darken-1">Page {{ currentPage }}</span>
          <v-btn
            class="mx-2"
            fab
            dark
            small
            color="error"
            v-on:click.prevent="next()"
          >
            <v-icon dark>mdi-skip-next</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import ActorCard from "../components/ActorCard.vue";
export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "Actors",
  data() {
    return {
      actors: [],
      errorMessage: "",
      loading: true,
      currentPage: 1,
    };
  },
  components: {
    ActorCard,
  },
  mounted() {
    this.loadActors();
    // this.scroll();
  },
  methods: {
    async loadActors() {
      this.loading = true;
      this.errorMessage = "";

      try {
        await this.fetchActors(this.currentPage);
      } catch (error) {
        this.errorMessage = "Unable to load actors right now.";
        console.log(error);
      } finally {
        this.loading = false;
      }
    },
    async fetchActors(page) {
      const response = await this.$http.get("/person/popular?page=" + page);
      this.actors = response.data.results;
      // this.actors.push(...response.data.results);
    },
    scroll() {
      window.onscroll = () => {
        let bottomOfWindow =
          document.documentElement.scrollTop + window.innerHeight ===
          document.documentElement.offsetHeight;
        if (bottomOfWindow) {
          this.currentPage += 1;
          this.loadActors();
        }
      };
    },
    next() {
      this.currentPage += 1;
      this.loadActors();
    },
    previous() {
      if (this.currentPage === 1) {
        return;
      }

      this.currentPage -= 1;
      this.loadActors();
    },
  },
};
</script>

<style>
.loading-container {
  min-height: 400px;
}
</style>
