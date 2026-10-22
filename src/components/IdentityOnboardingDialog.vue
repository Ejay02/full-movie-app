<template>
  <v-dialog v-model="showDialog" persistent max-width="560" scrollable>
    <v-card class="identity-setup pa-5 pa-sm-7" dark>
      <div class="setup-topline"><span>YOUR SPACE, YOUR PROFILE</span><v-btn v-if="canClose" icon small aria-label="Close profile setup" @click="showDialog = false"><v-icon>mdi-close</v-icon></v-btn></div>
      <template v-if="step === 1">
        <h2>Who’s watching?</h2>
        <p>Choose your name. Your games and shared room stay right where you left them.</p>
        <div class="profile-options">
          <button v-for="person in ['Timi', 'Ejay']" :key="person" type="button" :class="['profile-option', person.toLowerCase()]" @click="chooseUser(person)">
            <img :src="$store.getters.avatarForUser(person).src" alt="" />
            <strong>{{ person }}</strong><span>That’s me →</span>
          </button>
        </div>
      </template>
      <template v-else>
        <div class="setup-preview"><img :src="preview.src" alt="Your selected avatar" /><div><h2>Make it yours, {{ selectedUser }}.</h2><p>Pick the face you’ll use around here.</p></div></div>
        <avatar-choices v-model="selectedAvatar" />
        <div class="setup-actions"><v-btn text class="text-none" @click="step = 1">Back</v-btn><v-btn color="cyan" class="black--text text-none font-weight-bold" :disabled="!selectedAvatar" @click="finishSetup">Continue as {{ selectedUser }}</v-btn></div>
      </template>
      <p v-if="error" role="alert" class="amber--text mt-3">{{ error }}</p>
      <small class="setup-footnote">Change your avatar any time from your profile menu.</small>
    </v-card>
  </v-dialog>
</template>
<script>
import AvatarChoices from './AvatarChoices.vue';
import { avatarById, validProfile } from '@/services/profileAvatars';
export default {
  name: 'IdentityOnboardingDialog',
  components: { AvatarChoices },
  data: () => ({ showDialog: false, step: 1, selectedUser: null, selectedAvatar: null, canClose: false, error: '' }),
  computed: { preview() { return avatarById(this.selectedAvatar) || avatarById('cinema-kid'); } },
  mounted() {
    let complete = false;
    try { complete = localStorage.getItem('profile-setup-v2') === 'complete' && validProfile(localStorage.getItem('our_view_user')); } catch (_) { /* Ask for a session profile. */ }
    this.canClose = complete;
    this.showDialog = !complete;
    window.addEventListener('open-identity-selector', this.open);
  },
  beforeDestroy() { window.removeEventListener('open-identity-selector', this.open); },
  methods: {
    open() { this.step = 1; this.selectedUser = null; this.selectedAvatar = null; this.error = ''; this.showDialog = true; },
    chooseUser(user) {
      if (!validProfile(user)) return;
      this.selectedUser = user;
      this.selectedAvatar = this.$store.state.profileAvatars[user]?.id || null;
      this.step = 2;
    },
    finishSetup() {
      if (!validProfile(this.selectedUser) || !avatarById(this.selectedAvatar)) return;
      this.$store.dispatch('saveProfileAvatar', { user: this.selectedUser, avatarId: this.selectedAvatar });
      try {
        localStorage.setItem('our_view_user', this.selectedUser);
        localStorage.setItem('profile-setup-v2', 'complete');
      } catch (_) { this.error = 'This browser could not remember your profile. You can still continue this visit.'; }
      window.dispatchEvent(new CustomEvent('user-identity-changed', { detail: this.selectedUser }));
      this.canClose = true;
      this.showDialog = false;
    },
  },
};
</script>
<style scoped>
.identity-setup { background: radial-gradient(ellipse at top right, #203d55, #11192c 65%) !important; border: 1px solid #536782; border-radius: 24px !important; max-height: 90vh; overflow-y: auto; }
.setup-topline { display: flex; justify-content: space-between; align-items: center; min-height: 32px; margin-bottom: 18px; }.setup-topline span { color: #84dcd9; font-size: 10px; letter-spacing: 2px; font-weight: 700; }
.identity-setup h2 { font-size: 27px; line-height: 1.2; font-weight: 800; letter-spacing: -.8px; }.identity-setup p { color: #b2c0d4; line-height: 1.6; font-size: 13px; margin-top: 10px; }
.profile-options { display: flex; gap: 16px; margin: 25px 0; }.profile-option { flex: 1; border: 2px solid #3b4b64; border-radius: 18px; padding: 22px 12px; background: #18233a; color: #fff; }.profile-option img { width: 84px; height: 84px; object-fit: cover; border-radius: 50%; margin-bottom: 12px; }.profile-option strong { display: block; font-size: 22px; }.profile-option span { display: block; color: #a8b9cf; margin-top: 6px; font-size: 12px; }.profile-option.timi:hover { border-color: #f78bbc; }.profile-option.ejay:hover { border-color: #68dedc; }
.setup-preview { display: flex; align-items: center; gap: 16px; }.setup-preview img { width: 80px; height: 80px; object-fit: cover; border-radius: 50%; border: 3px solid #78e4db; }.setup-preview h2 { font-size: 23px; }.setup-preview p { margin: 6px 0 0; }
.setup-actions { display: flex; justify-content: space-between; gap: 10px; margin-top: 8px; }.setup-footnote { display: block; color: #8ca1bb; font-size: 11px; margin-top: 22px; text-align: center; }button:focus-visible { outline: 3px solid #f2c078; outline-offset: 3px; }
</style>
