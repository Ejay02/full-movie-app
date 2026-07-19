<template>
  <v-hover v-slot="{ hover }" open-delay="200" class="cursor-pointer">
    <v-card
      class="media-card"
      :elevation="hover ? 18 : 0"
      :class="{ 'media-card--hover': hover }"
    >
      <router-link :to="dynamicPath">
        <v-img :src="posterPath" alt="" class="poster-image"></v-img>
      </router-link>

      <v-card-title class="subtitle-2 card-title pa-4">
        <div class="title-text">{{ movie.title || movie.name }}</div>
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

    dynamicPath() {
      if (this.movie.media_type === "tv") {
        return `/show/${this.movie.id}`;
      }

      return `/movie/${this.movie.id}`;
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
.media-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-radius: 24px !important;
  background: linear-gradient(
    180deg,
    rgba(20, 25, 38, 0.88),
    rgba(10, 13, 22, 0.92)
  ) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.24);
  transition: transform 0.28s ease, box-shadow 0.28s ease,
    border-color 0.28s ease;
}

.media-card::before {
  content: "";
  position: absolute;
  inset: -120% auto auto -40%;
  width: 55%;
  height: 280%;
  transform: rotate(20deg) translateX(-160%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.05),
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: transform 0.6s ease;
  pointer-events: none;
  z-index: 2;
}

.media-card--hover {
  transform: translateY(-10px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.16);
  box-shadow: 0 24px 50px rgba(0, 0, 0, 0.36);
}

.media-card--hover::before {
  transform: rotate(20deg) translateX(340%);
}

.poster-image {
  aspect-ratio: 2 / 3;
  width: 100%;
  object-fit: cover;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
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
  color: rgba(255, 255, 255, 0.96);
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
  color: rgba(255, 255, 255, 0.86);
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
  color: rgba(255, 255, 255, 0.64);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
