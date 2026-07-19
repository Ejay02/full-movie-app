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
        <figure>
          <img :src="'https://image.tmdb.org/t/p/w500/' + item.poster_path" />
          <figcaption>
            <v-btn :to="item.media_type === 'tv' ? `/show/${item.id}` : `/movie/${item.id}`" text color="white">
              {{ item.title || item.name }}</v-btn
            >
          </figcaption>
        </figure>
      </slide>
    </carousel-3d>
  </div>
</template>

<script>
import { Carousel3d, Slide } from "vue-carousel-3d";
export default {
  data() {
    return {
      upcomingItems: [],
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
