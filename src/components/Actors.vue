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
    <h2 class="mt-2 grey--text text-center">Popular Actors</h2>
    <v-container fluid>
      <v-row>
        <v-col
          cols="12"
          sm="12"
          md="6"
          lg="3"
          xl="3"
          :key="actor.id"
          v-for="actor in this.actors"
        >
          <ActorCard :actor="actor" />
        </v-col>
        <v-col cols="12" class="d-flex justify-center mt-5">
          <v-btn
            class="mx-2"
            fab
            dark
            small
            color="error"
            v-on:click.prevent="previous()"
          >
            <v-icon dark> fas fa-step-backward </v-icon>
          </v-btn>
          <v-btn
            class="mx-2"
            fab
            dark
            small
            color="error"
            v-on:click.prevent="next()"
          >
            <v-icon dark> fas fa-step-forward </v-icon>
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
      loading: true,
      currentPage: 1,
    };
  },
  components: {
    ActorCard,
  },
  mounted() {
    this.fetchActors(this.currentPage);
    // this.scroll();
  },
  methods: {
    async fetchActors(page) {
      try {
        const response = await this.$http.get("/person/popular?page=" + page);
        this.actors = response.data.results;
        // this.actors.push(...response.data.results);
      } catch (error) {
        console.log(error);
      } finally {
        this.loading = false;
      }
    },
    scroll() {
      window.onscroll = () => {
        let bottomOfWindow =
          document.documentElement.scrollTop + window.innerHeight ===
          document.documentElement.offsetHeight;
        if (bottomOfWindow) {
          this.currentPage += 1;
          this.fetchActors(this.currentPage);
        }
      };
    },
    next() {
      this.currentPage += 1;
      this.fetchActors(this.currentPage);
    },
    previous() {
      if (this.currentPage === 1) {
        return;
      }

      this.currentPage -= 1;
      this.fetchActors(this.currentPage);
    },
  },
};
</script>

<style>
.loading-container {
  min-height: 400px;
}
</style>
