<template>
  <v-dialog
    v-model="dialog"
    max-width="580px"
    content-class="surprise-modal-dialog"
    overlay-color="#04060d"
    overlay-opacity="0.85"
  >
    <v-card class="surprise-card pa-6 pa-sm-8" dark>
      <!-- Close button -->
      <v-btn icon small class="close-btn" @click="close">
        <v-icon small color="grey lighten-1">mdi-close</v-icon>
      </v-btn>

      <!-- Header -->
      <div class="text-center mb-6">
        <div class="d-flex flex-column align-center justify-center mb-3">
          <div class="dice-icon-box mb-3">
            <v-icon large color="#00E5FF">mdi-dice-5</v-icon>
          </div>
          <span class="eyebrow cyan--text text--accent-3 font-weight-bold text-uppercase text-caption tracking-wider">
            {{ pickerLabel }}
          </span>
        </div>
        <h2 class="text-h5 font-weight-bold white--text mt-1">
          Can't decide what to watch?
        </h2>
        <p class="grey--text text-caption mb-0 mt-1">
          Pick a vibe or roll the dice for a handpicked movie recommendation!
        </p>
      </div>

      <!-- Mood selection chips -->
      <div class="d-flex flex-wrap justify-center gap-2 mb-6">
        <v-chip
          v-for="mood in moods"
          :key="mood.id"
          :color="selectedMoodId === mood.id ? '#00A3E0' : 'rgba(255, 255, 255, 0.08)'"
          :class="{ 'white--text font-weight-bold': true, 'active-mood-chip': selectedMoodId === mood.id }"
          filter
          small
          class="mood-chip px-3"
          @click="selectMood(mood)"
        >
          <v-icon left x-small>{{ mood.icon }}</v-icon>
          {{ mood.label }}
        </v-chip>
      </div>

      <!-- Rolling loader state -->
      <div v-if="isRolling" class="d-flex flex-column align-center justify-center py-10">
        <v-progress-circular
          indeterminate
          color="#00E5FF"
          size="56"
          width="4"
          class="mb-4"
        ></v-progress-circular>
        <span class="white--text font-weight-medium body-2">Rolling the dice...</span>
      </div>

      <!-- Result Card -->
      <div v-else-if="pickedMovie" class="picked-movie-box pa-4 mb-6">
        <div class="d-flex flex-column flex-sm-row gap-4 align-center align-sm-start">
          <v-img
            :src="posterUrl"
            max-width="130"
            min-width="120"
            aspect-ratio="2/3"
            class="rounded-lg shadow-elevation"
          ></v-img>

          <div class="flex-grow-1 text-center text-sm-left min-w-0">
            <div class="d-flex align-center justify-center justify-sm-start gap-2 mb-1 flex-wrap">
              <span class="imdb-badge">IMDb {{ pickedMovie.vote_average ? pickedMovie.vote_average.toFixed(1) : "7.5" }}</span>
              <span class="grey--text text-caption font-weight-medium">{{ releaseYear }}</span>
              <span class="quality-chip">4K UHD</span>
            </div>

            <h3 class="white--text text-h6 font-weight-bold mb-2 movie-title-text">
              {{ pickedMovie.title }}
            </h3>

            <p class="grey--text text--lighten-1 text-caption mb-3 overview-text">
              {{ pickedMovie.overview || "An exciting cinematic journey picked just for tonight." }}
            </p>

            <div class="d-flex flex-wrap gap-2 justify-center justify-sm-start">
              <v-btn
                color="error"
                depressed
                small
                class="text-none font-weight-bold px-4"
                @click="watchNow"
              >
                <v-icon left small>mdi-play</v-icon>
                Watch Now
              </v-btn>
              <v-btn
                outlined
                small
                color="white"
                class="text-none font-weight-medium"
                @click="rollDice"
              >
                <v-icon left small>mdi-dice-5-outline</v-icon>
                Roll Again
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <!-- Initial state before rolling -->
      <div v-else class="text-center py-6">
        <v-btn
          color="#00A3E0"
          dark
          large
          rounded
          class="px-8 font-weight-bold text-none roll-main-btn"
          @click="rollDice"
        >
          <v-icon left>mdi-dice-5</v-icon>
          Roll the Dice
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "SurpriseModal",
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    genres: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      selectedMoodId: "any",
      isRolling: false,
      pickedMovie: null,
      moods: [
        { id: "any", label: "Surprise Me", icon: "mdi-auto-fix", genreId: null },
        { id: "comedy", label: "Laugh Out Loud", icon: "mdi-emoticon-excited-outline", genreId: 35 },
        { id: "romance", label: "Romantic & Cozy", icon: "mdi-heart-outline", genreId: 10749 },
        { id: "action", label: "Adrenaline Rush", icon: "mdi-lightning-bolt-outline", genreId: 28 },
        { id: "scifi", label: "Mind Bending", icon: "mdi-brain", genreId: 878 },
        { id: "animation", label: "Animation Fun", icon: "mdi-palette-outline", genreId: 16 },
        { id: "thriller", label: "Late Night Spooky", icon: "mdi-ghost-outline", genreId: 27 },
      ],
    };
  },
  computed: {
    dialog: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
    },
    posterUrl() {
      if (this.pickedMovie && this.pickedMovie.poster_path) {
        return `https://image.tmdb.org/t/p/w500/${this.pickedMovie.poster_path}`;
      }
      return "";
    },
    releaseYear() {
      if (this.pickedMovie && this.pickedMovie.release_date) {
        return this.pickedMovie.release_date.split("-")[0];
      }
      return "";
    },
    pickerLabel() {
      const hour = new Date().getHours();
      if (hour >= 18 || hour < 5) return "Movie Night Picker 🎲";
      if (hour >= 12 && hour < 14) return "Noon Movie Picker 🎲";
      return "Movie Time Picker 🎲";
    },
  },
  methods: {
    close() {
      this.dialog = false;
    },
    selectMood(mood) {
      this.selectedMoodId = mood.id;
      this.rollDice();
    },
    async rollDice() {
      this.isRolling = true;
      const currentMood = this.moods.find((m) => m.id === this.selectedMoodId);
      const genreParam = currentMood && currentMood.genreId ? `&with_genres=${currentMood.genreId}` : "";
      const randomPage = Math.floor(Math.random() * 4) + 1; // page 1-4 for top choices

      try {
        const response = await this.$http.get(
          `/discover/movie?vote_average.gte=7.0&sort_by=popularity.desc&page=${randomPage}${genreParam}`
        );
        const movies = (response.data?.results || []).filter((m) => m.poster_path);

        // Simulate rolling suspense
        setTimeout(() => {
          if (movies.length) {
            const randomIdx = Math.floor(Math.random() * movies.length);
            this.pickedMovie = movies[randomIdx];
          }
          this.isRolling = false;
        }, 500);
      } catch (e) {
        console.error("Failed to roll movie dice", e);
        this.isRolling = false;
      }
    },
    watchNow() {
      if (!this.pickedMovie) return;
      this.close();
      this.$router.push(`/watch/movie/${this.pickedMovie.id}`);
    },
  },
};
</script>

<style scoped>
.surprise-card {
  position: relative;
  border-radius: 24px !important;
  background: linear-gradient(145deg, rgba(14, 20, 36, 0.98), rgba(7, 10, 18, 0.98)) !important;
  border: 1px solid rgba(0, 229, 255, 0.25);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(20px);
}

.close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(255, 255, 255, 0.06);
}

.dice-icon-box {
  display: inline-flex;
  padding: 12px;
  border-radius: 18px;
  background: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.25);
  box-shadow: 0 0 24px rgba(0, 229, 255, 0.2);
}

.mood-chip {
  transition: all 0.2s ease !important;
}

.mood-chip:hover {
  transform: translateY(-2px);
}

.active-mood-chip {
  box-shadow: 0 0 16px rgba(0, 163, 224, 0.5) !important;
}

.picked-movie-box {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.shadow-elevation {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
}

.imdb-badge {
  background-color: #f5c518;
  color: #000000;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 0.72rem;
  font-weight: 700;
}

.quality-chip {
  background: rgba(255, 23, 68, 0.18);
  color: #ff5252;
  border: 1px solid rgba(255, 23, 68, 0.35);
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 0.7rem;
  font-weight: 700;
}

.movie-title-text {
  line-height: 1.25;
}

.overview-text {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.roll-main-btn {
  box-shadow: 0 0 30px rgba(0, 163, 224, 0.45) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
}

.roll-main-btn:hover {
  transform: scale(1.04) !important;
  box-shadow: 0 0 45px rgba(0, 163, 224, 0.65) !important;
}

.gap-2 {
  gap: 8px;
}

.gap-4 {
  gap: 16px;
}

.min-w-0 {
  min-width: 0;
}
</style>
