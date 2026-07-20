<template>
  <router-link :to="to" class="poster-link">
    <div class="poster-frame">
      <v-img :src="posterSrc" alt="" :class="imageClass"></v-img>

      <!-- Quality Badge tag on top right -->
      <span v-if="quality" class="quality-badge">{{ quality }}</span>

      <div v-if="hover" class="preview-layer">
        <iframe
          v-if="trailerKey"
          class="preview-frame"
          :src="iframeSrc"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowfullscreen
        ></iframe>

        <div v-else class="preview-fallback">
          <v-progress-circular
            v-if="isLoading"
            indeterminate
            size="26"
            width="3"
            color="white"
          ></v-progress-circular>
          <div v-else class="preview-badge">
            <v-icon left small color="white">mdi-play-circle</v-icon>
            Trailer Preview
          </div>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script>
export default {
  name: "MediaPosterPreview",
  props: {
    hover: {
      type: Boolean,
      default: false,
    },
    mediaType: {
      type: String,
      required: true,
    },
    mediaId: {
      type: [String, Number],
      required: true,
    },
    posterSrc: {
      type: String,
      default: "",
    },
    to: {
      type: [String, Object],
      required: true,
    },
    imageClass: {
      type: String,
      default: "",
    },
    quality: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      trailerKey: "",
      isLoading: false,
      hasResolvedPreview: false,
    };
  },
  computed: {
    iframeSrc() {
      if (!this.trailerKey) {
        return "";
      }

      return `https://www.youtube.com/embed/${this.trailerKey}?autoplay=1&mute=0&controls=0&loop=1&playlist=${this.trailerKey}&modestbranding=1&rel=0`;
    },
  },
  watch: {
    hover(isHovering) {
      if (isHovering) {
        this.loadPreview();
      }
    },
  },
  methods: {
    async loadPreview() {
      if (this.isLoading || this.hasResolvedPreview) {
        return;
      }

      this.isLoading = true;
      try {
        const response = await this.$http.get(
          `/${this.mediaType}/${this.mediaId}/videos`
        );
        const videos = response.data.results || [];
        const trailer =
          videos.find((item) => item.type === "Trailer" && item.site === "YouTube") ||
          videos.find((item) => item.site === "YouTube");

        this.trailerKey = trailer ? trailer.key : "";
        this.hasResolvedPreview = true;
      } catch (error) {
        this.hasResolvedPreview = true;
        console.log(error);
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped>
.poster-link {
  display: block;
  text-decoration: none;
}

.poster-frame {
  position: relative;
  overflow: hidden;
}

.preview-layer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(6, 8, 14, 0.08),
    rgba(6, 8, 14, 0.82)
  );
  pointer-events: none;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: 0;
  pointer-events: none;
}

.preview-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.preview-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 0.78rem;
  backdrop-filter: blur(8px);
}

.quality-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 5;
  background: linear-gradient(135deg, #ff5252, #ff1744);
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
