<template>
  <v-hover v-slot="{ hover }" open-delay="200" class="cursor-pointer">
    <v-card
      class="media-card"
      :elevation="hover ? 18 : 0"
      :class="{ 'media-card--hover': hover }"
    >
      <MediaPosterPreview
        :hover="hover"
        media-type="tv"
        :media-id="show.id"
        :poster-src="posterPath"
        :to="`/show/${show.id}`"
        image-class="poster-image"
        :quality="qualityTag"
      />
      <v-card-title class="subtitle-2 card-title pa-4">
        <div class="title-text">{{ show.name }}</div>
        <v-menu
          offset-y
          top
          transition="scale-transition"
          rounded="lg"
          content-class="card-views-dropdown"
        >
          <template #activator="{ on, attrs }">
            <v-btn
              icon
              class="watchlist-btn"
              v-bind="attrs"
              v-on="on"
              title="Add to My View or Our Queue"
              @click.stop
            >
              <v-icon :color="isInOurView ? '#00E5FF' : (isInMyView ? 'light-green accent-3' : '')">
                {{ (isInMyView && isInOurView) ? 'mdi-check-all' : (isInOurView ? 'mdi-account-group' : (isInMyView ? 'mdi-check' : 'mdi-plus')) }}
              </v-icon>
            </v-btn>
          </template>

          <v-list dark dense class="card-add-menu-list py-1">
            <v-list-item @click.stop="toggleMyView">
              <v-list-item-icon class="mr-2 my-1">
                <v-icon small :color="isInMyView ? 'light-green accent-3' : 'grey lighten-1'">
                  {{ isInMyView ? 'mdi-check-circle' : 'mdi-plus-circle-outline' }}
                </v-icon>
              </v-list-item-icon>
              <v-list-item-content class="py-1">
                <v-list-item-title class="caption font-weight-bold">
                  {{ isInMyView ? 'In My View' : 'My View' }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item @click.stop="toggleOurView">
              <v-list-item-icon class="mr-2 my-1">
                <v-icon small :color="isInOurView ? '#00E5FF' : 'grey lighten-1'">
                  {{ isInOurView ? 'mdi-account-group' : 'mdi-account-group-outline' }}
                </v-icon>
              </v-list-item-icon>
              <v-list-item-content class="py-1">
                <v-list-item-title class="caption font-weight-bold" :style="{ color: isInOurView ? '#FF80AB' : '' }">
                  {{ isInOurView ? 'In Our Queue' : 'Our Queue' }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-card-title>
      <v-card-text class="content-area">
        <div class="ratings-row">
          <div class="d-flex align-center">
            <span class="imdb-badge mr-2">IMDb</span>
            <span class="grey--text font-weight-bold">{{
              show.vote_average ? show.vote_average.toFixed(1) : "N/A"
            }}</span>
          </div>
        </div>
        <div class="genre-area subtitle-2">
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
import MediaPosterPreview from "./MediaPosterPreview.vue";

export default {
  components: {
    MediaPosterPreview,
  },
  props: {
    show: {
      required: true,
    },
    genres: {
      required: true,
    },
  },
  computed: {
    posterPath() {
      return "https://image.tmdb.org/t/p/w500/" + this.show.poster_path;
    },
    isInMyView() {
      return !!this.$store.getters.myViewItemByKey("tv", this.show.id);
    },
    isInOurView() {
      return !!this.$store.getters.ourViewItemByKey("tv", this.show.id);
    },
    qualityTag() {
      if (!this.show.first_air_date) return "FHD";
      try {
        const firstAirDate = new Date(this.show.first_air_date);
        const today = new Date();
        const diffTime = Math.abs(today - firstAirDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 90) {
          return "HD";
        } else {
          return parseInt(this.show.id) % 4 === 0 ? "4K" : "FHD";
        }
      } catch (e) {
        return "FHD";
      }
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
    toggleMyView() {
      const itemId = `tv-${this.show.id}`;

      if (this.isInMyView) {
        this.$store.dispatch("removeFromMyView", itemId);
        return;
      }

      this.$store.dispatch("saveToMyView", {
        mediaType: "tv",
        mediaId: this.show.id,
        title: this.show.name,
        posterPath: this.show.poster_path,
        backdropPath: this.show.backdrop_path,
        voteAverage: this.show.vote_average,
        genreIds: this.show.genre_ids,
        releaseDate: this.show.first_air_date,
      });
    },
    toggleOurView() {
      const itemId = `tv-${this.show.id}`;

      if (this.isInOurView) {
        this.$store.dispatch("removeFromOurView", itemId);
        return;
      }

      const activeUser = localStorage.getItem("our_view_user") || "Timi";
      this.$store.dispatch("saveToOurView", {
        mediaType: "tv",
        mediaId: this.show.id,
        title: this.show.name,
        posterPath: this.show.poster_path,
        backdropPath: this.show.backdrop_path,
        voteAverage: this.show.vote_average,
        genreIds: this.show.genre_ids,
        note: "",
        addedBy: activeUser,
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
  border-radius: 12px !important;
  background: linear-gradient(180deg, rgba(20, 25, 38, 0.88), rgba(10, 13, 22, 0.92)) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.24);
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease,
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
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
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

.watchlist-btn {
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

.card-add-menu-list {
  background: rgba(14, 18, 30, 0.96) !important;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  backdrop-filter: blur(14px);
  min-width: 155px;
}
</style>
