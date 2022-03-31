<template>
  <div>
    <popular-movies />
    <upcoming-movies />
  </div>
</template>

<script>
import PopularMovies from "@/components/PopularMovies.vue";
import UpcomingMovies from "@/components/UpcomingMovies.vue";
export default {
  name: "HomeView",
  components: { PopularMovies, UpcomingMovies },
};
</script>
