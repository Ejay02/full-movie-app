<template>
  <div class="avatar-choices" role="group" aria-label="Choose an avatar">
    <button v-for="avatar in avatars" :key="avatar.id" type="button" :class="['avatar-choice', { chosen: value === avatar.id }]"
      :aria-label="avatar.label" :aria-pressed="value === avatar.id" @click="$emit('input', avatar.id)">
      <img :src="avatar.src" alt="" /><span>{{ avatar.label }}</span>
      <b v-if="value === avatar.id" class="avatar-check" aria-hidden="true">✓</b>
    </button>
  </div>
</template>
<script>
import { AVATARS } from '@/services/profileAvatars';
export default { props: { value: String }, data: () => ({ avatars: AVATARS }) };
</script>
<style scoped>
.avatar-choices { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
.avatar-choice { position: relative; min-width: 0; padding: 14px 6px 10px; border: 2px solid #2b354c; border-radius: 16px; background: #172034; color: #b9c5d9; transition: border-color 160ms, background 160ms; }
.avatar-choice img { width: 70px; height: 70px; max-width: 100%; border-radius: 50%; object-fit: cover; display: block; margin: auto auto 8px; }
.avatar-choice span { font-size: 12px; }.avatar-choice.chosen { border-color: #68e1de; color: white; background: #17363e; }
.avatar-choice:hover { border-color: #7b9bad; }.avatar-choice:focus-visible { outline: 3px solid #ffbf75; outline-offset: 2px; }
.avatar-check { position: absolute; top: 6px; right: 9px; color: #75e6dc; }
@media (max-width: 420px) { .avatar-choices { gap: 8px; }.avatar-choice { padding: 12px 4px 8px; }.avatar-choice img { width: 58px; height: 58px; } }
</style>
