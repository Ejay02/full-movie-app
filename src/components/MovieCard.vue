<template>
  <v-hover v-slot="{ hover }" open-delay="200" class="cursor-pointer">
    <v-card :elevation="hover ? 16 : 2" :class="{ 'on-hover': hover }">
      <router-link :to="`/movie/${movie.id}`">
        <v-img :src="posterPath" alt="" class="poster-image"></v-img>
      </router-link>
      <v-card-title class="subtitle-2 card-title pa-4">
        <div class="title-text">{{ movie.title }}</div>
        <v-btn icon class="bookmark-btn" @click.stop="toggleWatchlist">
          <v-icon :color="isInWatchlist ? 'amber' : ''">
            {{ isInWatchlist ? "mdi-bookmark" : "mdi-bookmark-outline" }}
          </v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text class="content-area">
        <div class="ratings-row">
          <div class="d-flex align-center">
            <span class="imdb-badge mr-2">IMDb</span>
            <span class="grey--text font-weight-bold">{{
              movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"
            }}</span>
          </div>
        </div>
        <!-- genre -->
        <div class="genre-area subtitle-2">
          <span
            v-for="(genre, index) in movie.genre_ids"
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
    movie: {
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
      return "https://image.tmdb.org/t/p/w500/" + this.movie.poster_path;
    },
  },
  methods: {
    genreTypeName(genraId, index) {
      for (const item of this.genres) {
        if (item.id == genraId) {
          if (this.movie.genre_ids.length - 1 == index) {
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
        movieId: this.movie.id,
        action: this.isInWatchlist ? "add" : "remove",
      });
    },
  },
};
</script>

<style>
.v-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.poster-image {
  aspect-ratio: 2 / 3;
  width: 100%;
  object-fit: cover;
}

.card-title {
  min-height: 48px;
  display: flex !important;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px !important;
}

.title-text {
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.2;
  max-height: 2.4em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.bookmark-btn {
  flex-shrink: 0;
  margin-left: 4px;
}

.content-area {
  padding: 12px;
}

.ratings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.rating-text {
  white-space: nowrap;
  margin-left: 8px;
}

.imdb-badge {
  background-color: #f5c518;
  color: #000000;
  font-weight: 900;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.8rem;
  line-height: 1;
}

.genre-area {
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
