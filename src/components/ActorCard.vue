<template>
  <v-hover v-slot="{ hover }" open-delay="200">
    <v-card :elevation="hover ? 16 : 2" :class="{ 'on-hover': hover }">
      <router-link :to="`/actor/${actor.id}`">
        <v-img :src="profileImage" alt="" />
      </router-link>

      <v-card-title class="subtitle-2"> {{ actor.name }}</v-card-title>

      <v-card-text>
        <p class="grey--text">
          {{ knownFor }}
        </p>
      </v-card-text>
    </v-card>
  </v-hover>
</template>

<script>
export default {
  props: {
    actor: {
      required: true,
    },
  },
  computed: {
    profileImage() {
      if (!this.actor.profile_path) {
        return "https://via.placeholder.com/235x235";
      }

      return (
        "https://image.tmdb.org/t/p/w235_and_h235_face/" +
        this.actor.profile_path
      );
    },
    knownFor() {
      if (!this.actor.known_for || !this.actor.known_for.length) {
        return "";
      }

      return this.actor.known_for
        .map((item) => item.title || item.name)
        .filter(Boolean)
        .join(", ");
    },
  },
};
</script>

<style></style>
