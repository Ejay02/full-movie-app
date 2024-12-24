<template>
  <v-hover v-slot="{ hover }" open-delay="200" class="cursor-pointer">
    <v-card :elevation="hover ? 16 : 2" :class="{ 'on-hover': hover }">
      <router-link :to="`/show/${show.id}`">
        <v-img :src="posterPath" alt="" class=""></v-img>
      </router-link>
      <v-card-title class="subtitle-2">
        {{ show.name }}
        <v-btn icon class="ml-auto" @click.stop="toggleWatchlist">
          <v-icon :color="isInWatchlist ? 'amber' : ''">
            {{ isInWatchlist ? "mdi-bookmark" : "mdi-bookmark-outline" }}
          </v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-row align="center" class="mx-0">
          <v-rating
            :value="show.vote_average / 2"
            color="amber"
            dense
            half-increments
            readonly
            size="14"
          >
          </v-rating>

          <div class="grey--text ml-auto">
            {{ Math.round(show.vote_average * 10) }}% |
            {{ show.first_air_date }}
          </div>
        </v-row>
        <div class="my-6 subtitle-2">
          <span
            v-for="(genre, index) in show.genre_ids"
            :key="genre"
            class="ml-1"
          >
            {{ genreTypeName(genre, index) }}
          </span>
        </div>
      </v-card-text>
    </v-card>
  </v-hover>
</template>

<script>
export default {
  props: {
    show: {
      required: true,
    },
    genres: {
      required: true,
    },
  },
  data() {
    return {
      isInWatchlist: false,
    };
  },
  computed: {
    posterPath() {
      return "https://image.tmdb.org/t/p/w500/" + this.show.poster_path;
    },
  },
  methods: {
    genreTypeName(genraId, index) {
      for (const item of this.genres) {
        if (item.id == genraId) {
          if (this.show.genre_ids.length - 1 == index) {
            return item.name;
          } else {
            return item.name + ",";
          }
        }
      }
    },
    toggleWatchlist() {
      this.isInWatchlist = !this.isInWatchlist;
      this.$emit("watchlist-toggle", {
        showId: this.show.id,
        action: this.isInWatchlist ? "add" : "remove",
      });
    },
  },
};
</script>
