<template>
  <div id="example" class="upcoming-section">
    <div class="section-header">
      <div>
        <p class="eyebrow mb-1">Coming Soon</p>
        <h2 class="section-title mb-6">Upcoming Movies & Shows</h2>
      </div>
    </div>
    <carousel-3d
      :controls-visible="true"
      :clickable="false"
      :key="upcomingItems.length"
      :listData="upcomingItems"
      :height="500"
    >
      <slide :index="i" :key="i" v-for="(item, i) in upcomingItems">
        <figure class="upcoming-figure">
          <img :src="'https://image.tmdb.org/t/p/w500/' + item.poster_path" />
          <figcaption class="d-flex justify-center align-center">
            <v-btn
              @click.prevent="openTrailer(item)"
              text
              color="white"
              class="font-weight-bold trailer-btn"
            >
              <v-icon left size="30">mdi-play-circle</v-icon>
              Watch Trailer
            </v-btn>
          </figcaption>
        </figure>
      </slide>
    </carousel-3d>

    <!-- Trailer Dialog -->
    <v-dialog v-model="dialog" max-width="800px" persistent>
      <v-card dark class="trailer-card">
        <v-card-title
          class="headline d-flex justify-space-between align-center"
        >
          <span>Trailer</span>
          <v-btn icon @click="closeTrailer">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <div v-if="trailerLoading" class="d-flex justify-center py-10">
            <v-progress-circular
              indeterminate
              color="primary"
            ></v-progress-circular>
          </div>
          <div v-else-if="youtubeKey" class="video-container">
            <iframe
              width="100%"
              height="450"
              :src="`https://www.youtube.com/embed/${youtubeKey}?autoplay=1`"
              frameborder="0"
              allow="autoplay; encrypted-media"
              allowfullscreen
            ></iframe>
          </div>
          <div v-else class="pa-6 text-center subtitle-1">
            No trailer available for this title.
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { Carousel3d, Slide } from "vue-carousel-3d";
export default {
  data() {
    return {
      upcomingItems: [],
      dialog: false,
      trailerLoading: false,
      youtubeKey: null,
    };
  },
  components: {
    Carousel3d,
    Slide,
  },
  mounted() {
    this.fetchUpcomingItems();
  },
  methods: {
    async fetchUpcomingItems() {
      try {
        const [moviesResponse, showsResponse] = await Promise.all([
          this.$http.get("/movie/upcoming"),
          this.$http.get("/tv/on_the_air"),
        ]);

        const movies = moviesResponse.data.results
          .slice(1, 4)
          .map((m) => ({ ...m, media_type: "movie" }));
        const shows = showsResponse.data.results
          .slice(0, 3)
          .map((s) => ({ ...s, media_type: "tv" }));

        // Interleave them so it's movie, show, movie, show
        const combined = [];
        for (let i = 0; i < Math.max(movies.length, shows.length); i++) {
          if (movies[i]) combined.push(movies[i]);
          if (shows[i]) combined.push(shows[i]);
        }

        this.upcomingItems = combined;
      } catch (error) {
        console.log(error);
      }
    },
    async openTrailer(item) {
      this.dialog = true;
      this.trailerLoading = true;
      this.youtubeKey = null;

      try {
        const response = await this.$http.get(
          `/${item.media_type}/${item.id}/videos`,
        );
        const videos = response.data.results;
        const trailer =
          videos.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
          videos.find((v) => v.site === "YouTube");

        if (trailer) {
          this.youtubeKey = trailer.key;
        }
      } catch (error) {
        console.error("Failed to fetch trailer", error);
      } finally {
        this.trailerLoading = false;
      }
    },
    closeTrailer() {
      this.dialog = false;
      this.youtubeKey = null; // reset iframe to stop video
    },
  },
};
</script>

<style>
.upcoming-section {
  margin-top: 8px;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.eyebrow {
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section-title {
  color: #ffffff;
  font-size: 1.8rem;
  line-height: 1.15;
}

.carousel-3d-container figure {
  margin: 0;
  border-radius: 26px;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.32);
}

.carousel-3d-container figcaption {
  background: linear-gradient(180deg, transparent, rgba(8, 10, 18, 0.9));
  color: white;
  bottom: 0;
  position: absolute;
  bottom: 0;
  padding: 15px;
  font-size: 12px;
  min-width: 100%;
  box-sizing: border-box;
}

.trailer-btn {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}

.trailer-card {
  border-radius: 24px !important;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    rgba(15, 19, 30, 0.98),
    rgba(8, 10, 16, 0.98)
  ) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.video-container {
  background: #05070d;
}

.next span,
.prev span {
  color: #ffffff;
}
</style>
