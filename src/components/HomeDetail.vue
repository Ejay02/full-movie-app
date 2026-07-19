<template>
  <MediaDetail :media-type="resolvedMediaType" :media-id="$route.params.id" />
</template>

<script>
import MediaDetail from "../components/MediaDetail.vue";

export default {
  name: "HomeDetail",
  components: {
    MediaDetail,
  },
  computed: {
    resolvedMediaType() {
      return this.$route.params.mediaType === "tv" ? "tv" : "movie";
    },
  },
};
</script>
