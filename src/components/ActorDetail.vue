<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="12" sm="4">
          <v-hover v-slot="{ hover }" open-delay="200">
            <v-card :elevation="hover ? 16 : 2" :class="{ 'on-hover': hover }">
              <v-img
                :src="'https://image.tmdb.org/t/p/w300/' + actor.profile_path"
                alt=""
              />
              <v-card-text>
                <v-row class="mx-0 d-flex justify-center">
                  <v-btn
                    class="mx-2"
                    fab
                    dark
                    small
                    color="error"
                    :href="'https://facebook.com/' + socialDetails.facebook_id"
                  >
                    <v-icon dark>mdi-facebook</v-icon>
                  </v-btn>
                  <v-btn
                    class="mx-2"
                    fab
                    dark
                    small
                    color="error"
                    :href="
                      'https://instagram.com/' + socialDetails.instagram_id
                    "
                  >
                    <v-icon dark>mdi-instagram</v-icon>
                  </v-btn>
                  <v-btn
                    class="mx-2"
                    fab
                    dark
                    small
                    color="error"
                    :href="'https://twitter.com/' + socialDetails.twitter_id"
                  >
                    <v-icon dark>mdi-twitter</v-icon>
                  </v-btn>
                  <v-btn class="mx-2" fab dark small color="error">
                    <v-icon dark>mdi-web</v-icon>
                  </v-btn>
                </v-row>
              </v-card-text>
            </v-card>
          </v-hover>
        </v-col>
        <v-col cols="12" sm="8">
          <h1 class="grey--text text--darken-3 mt-5">{{ this.actor.name }}</h1>
          <v-row>
            <v-col cols="12">
              <v-btn text>
                <v-icon color="error">mdi-cake-variant</v-icon>
              </v-btn>
              <span class="grey--text">{{ birthdayLabel }}</span>
            </v-col>
          </v-row>

          <p class="mt-5 grey--text text--lighten-1 subheader">
            {{ this.actor.biography }}
          </p>

          <!-- Top 5 Highest-Rated Films Deep-Dive -->
          <div class="mt-6 mb-3">
            <span class="eyebrow cyan--text text--accent-3 font-weight-bold text-caption text-uppercase">Filmography Deep-Dive</span>
            <h3 class="white--text text-h6 font-weight-bold">Top 5 Highest-Rated Works</h3>
          </div>
          <v-row dense>
            <v-col
              cols="6"
              sm="4"
              md="2"
              lg="2"
              :key="movie.id"
              v-for="movie in knownFor"
              class="pa-2"
            >
              <v-card class="actor-film-card pa-2" flat>
                <router-link :to="movieLink(movie)">
                  <v-img :src="movieImage(movie)" class="rounded-lg mb-2" aspect-ratio="0.667">
                    <span v-if="movie.vote_average" class="actor-rating-badge">
                      ★ {{ movie.vote_average.toFixed(1) }}
                    </span>
                  </v-img>
                </router-link>
                <div class="white--text caption font-weight-bold text-truncate mb-1">
                  {{ movie.title || movie.name }}
                </div>
                <v-btn
                  color="error"
                  depressed
                  x-small
                  block
                  class="text-none font-weight-bold"
                  :to="`/watch/${movie.media_type || 'movie'}/${movie.id}`"
                >
                  <v-icon left x-small>mdi-play</v-icon>
                  Watch
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <v-divider class="mt-8"></v-divider>

      <h2 class="mt-2 grey--text text-center">Credits</h2>
      <ul class="pl-5 mt-8">
        <li :key="cast.id" v-for="cast in castMovies">
          <strong>{{ castDetails(cast) }} </strong>

          <v-btn text :to="`/movie/${cast.id}`">
            {{ cast.title }}
          </v-btn>

          as {{ cast.character }}
        </li>
      </ul>
    </v-container>
  </div>
</template>

<script>
export default {
  data() {
    return {
      socialDetails: {},
      actor: {},
      knownFor: [],
      castMovies: [],
    };
  },
  mounted() {
    this.fetchActor(this.$route.params.id);
    this.fetchCredits(this.$route.params.id);
    this.fetchSocial(this.$route.params.id);
  },
  methods: {
    async fetchActor(actorId) {
      const response = await this.$http.get("/person/" + actorId);
      this.actor = response.data;
    },
    async fetchCredits(actorId) {
      try {
        const response = await this.$http.get(
          "/person/" + actorId + "/combined_credits"
        );
        const allCredits = [
          ...(response.data.cast || []),
          ...(response.data.crew || []),
        ];
        const uniqueCredits = [];
        const seen = new Set();
        for (const c of allCredits) {
          if (c.id && !seen.has(c.id) && c.poster_path) {
            seen.add(c.id);
            uniqueCredits.push(c);
          }
        }
        this.castMovies = response.data.cast || [];
        // Top 5 highest rated works
        let topFilms = uniqueCredits
          .filter((x) => (x.vote_count || 0) >= 30)
          .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
          .slice(0, 5);

        if (topFilms.length < 5) {
          topFilms = uniqueCredits
            .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
            .slice(0, 5);
        }
        this.knownFor = topFilms;
      } catch (e) {
        console.error("Failed to load credits", e);
        this.knownFor = [];
        this.castMovies = [];
      }
    },
    movieImage(movie) {
      const posterPath = movie.poster_path;
      if (!posterPath) {
        return "https://via.placeholder.com/185x278";
      }
      return "https://image.tmdb.org/t/p/w185/" + posterPath;
    },
    movieLink(movie) {
      return movie.media_type === "tv" ? `/show/${movie.id}` : `/movie/${movie.id}`;
    },
    async fetchSocial(actorId) {
      const response = await this.$http.get(
        "/person/" + actorId + "/external_ids",
      );
      this.socialDetails = response.data;
    },
    castDetails(cast) {
      return cast.release_date ? parseInt(cast.release_date, 10) + " ." : "";
    },
  },
  computed: {
    birthdayLabel() {
      if (!this.actor.birthday) {
        return "Birthday unavailable";
      }

      return this.actor.birthday;
    },
  },
};
</script>

<style scoped>
.actor-film-card {
  background: rgba(255, 255, 255, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.actor-film-card:hover {
  transform: translateY(-4px);
  border-color: rgba(0, 229, 255, 0.4);
}

.actor-rating-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.85);
  color: #ffb300;
  font-weight: 700;
  font-size: 0.7rem;
  padding: 1px 5px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
}
</style>
