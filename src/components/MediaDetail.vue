<template>
  <div>
    <div
      v-if="loading"
      class="d-flex justify-center align-center loading-container"
    >
      <v-progress-circular
        :size="70"
        :width="7"
        color="primary"
        indeterminate
      ></v-progress-circular>
    </div>

    <v-container v-else-if="errorMessage">
      <v-alert outlined type="error" class="mt-6">
        {{ errorMessage }}
      </v-alert>
      <v-btn color="error" class="mt-4" @click="loadMediaDetails">Try Again</v-btn>
    </v-container>

    <div v-else>
      <v-container>
        <v-row>
          <v-col cols="12" sm="4">
            <v-hover v-slot="{ hover }" open-delay="200">
              <v-card :elevation="hover ? 16 : 2" :class="{ 'on-hover': hover }">
                <v-img :src="posterPath" alt="" class="" />
              </v-card>
            </v-hover>
          </v-col>

          <v-col cols="12" sm="8">
            <h1 class="grey--text text-darken-3 mt-5">
              {{ media.title || media.name }}
            </h1>

            <v-col>
              <v-rating
                :value="media.vote_average / 2"
                color="amber"
                dense
                half-increments
                readonly
                size="14"
              >
              </v-rating>
            </v-col>

            <v-col>
              <span class="gray--text">
                <span class="mr-2">
                  {{ Math.round(media.vote_average * 10) }}%
                </span>
                |
                <span class="ml-2">
                  {{ media.release_date || media.first_air_date }}
                </span>
              </span>
            </v-col>

            <v-col cols="12" sm="7">
              <div class="subtitle-2 grey--text">
                <span
                  v-for="(item, index) in media.genres"
                  :key="index"
                  class="ml-1"
                >
                  {{ item.name }}
                  <span v-if="media.genres.length - 1 !== index">,</span>
                </span>
              </div>
            </v-col>

            <p class="mt-5 grey--text text--darken-3 subheader">
              {{ media.overview }}
            </p>

            <div class="mt-5">
              <h2 class="mt-5 grey--text text--darken-3">Featured Cast</h2>
              <div
                :key="index"
                v-for="(crew, index) in media.credits.crew"
                class="mt-5"
              >
                <div v-if="index < 2" class="">
                  <h3>{{ crew.name }}</h3>
                  <span class="grey--text">{{ crew.job }}</span>
                </div>
              </div>
            </div>

            <v-dialog v-model="dialog" persistent max-width="800px">
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  tile
                  color="error"
                  v-bind="attrs"
                  v-on="on"
                  :disabled="!hasVideo"
                  @click.prevent="openYouTubeModel"
                >
                  <v-icon left>mdi-play</v-icon>Play
                </v-btn>
              </template>
              <v-card>
                <v-card-title>
                  <span class="headline">{{ media.title || media.name }}</span>
                </v-card-title>
                <v-card-text>
                  <v-container>
                    <v-row>
                      <v-col cols="12" sm="">
                        <div class="iframe-container">
                          <iframe
                            allowfullscreen
                            :src="mediaURL"
                          ></iframe>
                        </div>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="error" text @click="dialog = false">Close</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <v-btn tile color="error" class="ml-2">
              <v-icon left>mdi-heart</v-icon>Favorite
            </v-btn>
          </v-col>
        </v-row>

        <v-divider class="mt-8"></v-divider>
        <Cast :casts="media.credits.cast" />
        <Images :images="media.images.backdrops" />
      </v-container>
    </div>
  </div>
</template>

<script>
import Cast from "../components/Cast.vue";
import Images from "../components/Images.vue";

function createInitialMedia() {
  return {
    credits: {
      crew: [],
      cast: [],
    },
    genres: [],
    images: {
      backdrops: [],
    },
    videos: {
      results: [],
    },
  };
}

export default {
  name: "MediaDetail",
  components: {
    Cast,
    Images,
  },
  props: {
    mediaType: {
      type: String,
      required: true,
    },
    mediaId: {
      type: [String, Number],
      required: true,
    },
  },
  data() {
    return {
      media: createInitialMedia(),
      dialog: false,
      errorMessage: "",
      loading: true,
      mediaURL: "",
    };
  },
  computed: {
    hasVideo() {
      return !!this.media.videos.results.length;
    },
    posterPath() {
      if (!this.media.poster_path) {
        return "";
      }

      return "https://image.tmdb.org/t/p/w500/" + this.media.poster_path;
    },
    requestKey() {
      return `${this.mediaType}:${this.mediaId}`;
    },
  },
  watch: {
    requestKey: {
      handler() {
        this.loadMediaDetails();
      },
      immediate: true,
    },
  },
  methods: {
    async loadMediaDetails() {
      this.loading = true;
      this.errorMessage = "";
      this.dialog = false;
      this.mediaURL = "";

      try {
        const response = await this.$http.get(
          `/${this.mediaType}/${this.mediaId}?append_to_response=credits,videos,images`
        );
        this.media = response.data;
      } catch (error) {
        this.media = createInitialMedia();
        this.errorMessage = "Unable to load details for this title right now.";
        console.log(error);
      } finally {
        this.loading = false;
      }
    },
    openYouTubeModel() {
      if (!this.hasVideo) {
        return;
      }

      this.mediaURL =
        "https://www.youtube.com/embed/" + this.media.videos.results[0].key;
    },
  },
};
</script>

<style>
.loading-container {
  min-height: 400px;
}

.iframe-container {
  overflow: hidden;
  padding-top: 56.25%;
  position: relative;
}

.iframe-container iframe {
  border: 0;
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
}
</style>
