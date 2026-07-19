<template>
  <MediaDetail media-type="tv" :media-id="$route.params.id" />
</template>

<script>
import MediaDetail from "../components/MediaDetail.vue";

export default {
  name: "TvShowDetail",
  components: {
    MediaDetail,
  },
};
</script>
