<template>
  <MediaDetail media-type="movie" :media-id="$route.params.id" />
</template>

<script>
import MediaDetail from "../components/MediaDetail.vue";

export default {
  name: "MovieDetail",
  components: {
    MediaDetail,
  },
};
</script>
