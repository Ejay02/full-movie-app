<template>
  <div class="cinema-atmosphere" :class="{ 'cinema-atmosphere--quiet': quiet || hidden || playing }" aria-hidden="true">
    <div class="cinema-light cinema-light--rose" />
    <div class="cinema-light cinema-light--blue" />
    <div class="cinema-dust" />
    <div class="cinema-vignette" />
  </div>
</template>

<script>
export default {
  name: 'CinemaAtmosphere',
  props: { quiet: Boolean },
  data: () => ({ hidden: false, playing: false }),
  mounted() {
    this.updateActivity();
    document.addEventListener('visibilitychange', this.updateActivity);
    ['play', 'pause', 'ended', 'emptied'].forEach(event => {
      document.addEventListener(event, this.updateActivity, true);
    });
  },
  beforeDestroy() {
    document.removeEventListener('visibilitychange', this.updateActivity);
    ['play', 'pause', 'ended', 'emptied'].forEach(event => {
      document.removeEventListener(event, this.updateActivity, true);
    });
  },
  methods: {
    updateActivity() {
      this.hidden = document.hidden;
      this.playing = [...document.querySelectorAll('video')].some(video => !video.paused && !video.ended);
    },
  },
};
</script>

<style scoped>
.cinema-atmosphere {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  contain: strict;
  opacity: .8;
  transition: opacity 1s ease;
}
.cinema-light {
  position: absolute;
  width: min(100vw, 1100px);
  height: min(90vh, 900px);
  border-radius: 50%;
  will-change: transform;
}
.cinema-light--rose {
  top: -25%;
  left: -20%;
  background: radial-gradient(ellipse, rgba(167, 35, 83, .22), rgba(106, 24, 78, .08) 38%, transparent 70%);
  animation: cinema-rose-drift 28s ease-in-out infinite alternate;
}
.cinema-light--blue {
  right: -23%;
  top: 0;
  background: radial-gradient(ellipse, rgba(25, 115, 151, .16), rgba(40, 54, 116, .08) 35%, transparent 68%);
  animation: cinema-blue-drift 34s ease-in-out infinite alternate;
}
.cinema-dust {
  position: absolute;
  inset: -4%;
  opacity: .3;
  background-image:
    radial-gradient(1px 1px at 12% 18%, #d3c9df 70%, transparent),
    radial-gradient(1px 1px at 78% 27%, #c8e7f4 70%, transparent),
    radial-gradient(1px 1px at 40% 43%, #d3c9df 70%, transparent),
    radial-gradient(1px 1px at 88% 68%, #c8e7f4 70%, transparent),
    radial-gradient(1px 1px at 22% 83%, #d3c9df 70%, transparent),
    radial-gradient(1px 1px at 65% 92%, #c8e7f4 70%, transparent);
  animation: cinema-dust-float 24s ease-in-out infinite alternate;
}
.cinema-vignette { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 20%, transparent 35%, #05070d80); }
.cinema-atmosphere--quiet { opacity: .18; }
.cinema-atmosphere--quiet .cinema-light,
.cinema-atmosphere--quiet .cinema-dust { animation-play-state: paused; }
@keyframes cinema-rose-drift { to { transform: translate3d(12%, 10%, 0) scale(1.08); } }
@keyframes cinema-blue-drift { to { transform: translate3d(-12%, 15%, 0) scale(1.12); } }
@keyframes cinema-dust-float { to { transform: translate3d(0, -2%, 0); opacity: .5; } }
@media (max-width: 600px) {
  .cinema-dust { display: none; }
  .cinema-light--blue { animation: none; }
}
@media (prefers-reduced-motion: reduce) {
  .cinema-light, .cinema-dust { animation: none; will-change: auto; }
  .cinema-atmosphere { transition: none; }
}
</style>
