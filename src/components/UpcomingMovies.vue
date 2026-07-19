<template>
  <div id="example">
    <h2 class="mx-3 grey--text text-center mt-4 mb-6">Upcoming Movies & Shows</h2>
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
            <v-btn @click.prevent="openTrailer(item)" text color="white" class="font-weight-bold">
              <v-icon left size="30">mdi-play-circle</v-icon>
              Watch Trailer
            </v-btn>
          </figcaption>
        </figure>
      </slide>
    </carousel-3d>

    <!-- Trailer Dialog -->
    <v-dialog v-model="dialog" max-width="800px" persistent>
      <v-card dark>
        <v-card-title class="headline d-flex justify-space-between align-center">
          <span>Trailer</span>
          <v-btn icon @click="closeTrailer">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <div v-if="trailerLoading" class="d-flex justify-center py-10">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
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
          this.$http.get("/tv/on_the_air")
        ]);

        const movies = moviesResponse.data.results.slice(1, 4).map(m => ({ ...m, media_type: 'movie' }));
        const shows = showsResponse.data.results.slice(0, 3).map(s => ({ ...s, media_type: 'tv' }));
        
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
        const response = await this.$http.get(`/${item.media_type}/${item.id}/videos`);
        const videos = response.data.results;
        const trailer = videos.find(v => v.type === "Trailer" && v.site === "YouTube") || videos.find(v => v.site === "YouTube");
        
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
    }
  },
};
</script>

<style>
.carousel-3d-container figure {
  margin: 0;
}
.carousel-3d-container figcaption {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  bottom: 0;
  position: absolute;
  bottom: 0;
  padding: 15px;
  font-size: 12px;
  min-width: 100%;
  box-sizing: border-box;
}
.next span,
.prev span {
  color: red;
}
</style>
