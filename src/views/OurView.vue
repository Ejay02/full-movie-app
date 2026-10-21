<template>
  <div class="our-view-page px-2 px-sm-4 pb-12">
    <!-- Hero Banner with Romantic Glass Aesthetic -->
    <div class="our-view-hero pa-6 pa-sm-8 mb-6">
      <div class="d-flex align-center justify-space-between flex-wrap gap-4">
        <div>
          <div class="d-flex align-center flex-wrap gap-2 mb-2">
            <span v-if="roomId" class="room-pill px-3 py-1 text-caption grey--text text--lighten-2 mr-2">
              <v-icon x-small color="#00E5FF" class="mr-1">mdi-cast-connected</v-icon>
              Room: <strong>{{ roomId }}</strong>
            </span>
            <div class="d-flex align-center">
              <span class="grey--text text-caption mr-2 font-weight-bold">I am:</span>
              <v-btn-toggle v-model="currentUser" mandatory dense class="user-toggle">
                <v-btn value="Timi" small class="text-none font-weight-bold timi-toggle-btn">
                  <v-icon x-small left color="#E040FB">{{ timiIcon }}</v-icon>
                  Timi
                </v-btn>
                <v-btn value="Ejay" small class="text-none font-weight-bold ejay-toggle-btn">
                  <v-icon x-small left color="#00E5FF">{{ ejayIcon }}</v-icon>
                  Ejay
                </v-btn>
              </v-btn-toggle>
              <v-btn
                icon
                x-small
                class="ml-1"
                title="Change Profile Icons"
                @click="openIconSelector"
              >
                <v-icon x-small color="#FFD700">mdi-palette-swatch-outline</v-icon>
              </v-btn>
            </div>
          </div>
          <p class="grey--text text--lighten-2 text-body-2 mb-0">
            For the movies we share together, even when miles apart.
          </p>
        </div>

        <!-- Date Night Planner Button / Summary -->
        <div class="date-night-action-box d-flex align-center flex-wrap gap-2">
          <v-btn
            v-if="!nextDateNight"
            color="#FF4081"
            rounded
            dark
            depressed
            class="text-none font-weight-bold px-5 plan-date-btn"
            @click="openPlanDialog"
          >
            <v-icon left small color="#FFD700">mdi-calendar-star</v-icon>
            Plan Next Date Night 🥂
          </v-btn>
          <div v-else class="scheduled-date-chip pa-3 d-flex align-center">
            <v-icon color="#FF4081" class="mr-3">mdi-calendar-clock</v-icon>
            <div class="mr-4">
              <div class="white--text caption font-weight-bold text-uppercase tracking-wider">
                {{ nextDateNight.title || 'Next Date Night' }}
              </div>
              <div class="rose--text font-weight-bold text-body-2" style="color: #FF80AB;">
                {{ countdownText }}
              </div>
              <div class="grey--text text-caption">
                {{ formattedDateNightSchedule }}
              </div>
            </div>
            <v-btn icon small dark class="mr-1" title="Edit Date Night" @click="openPlanDialog">
              <v-icon small>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon small dark title="Cancel Scheduled Date" @click="cancelScheduledDate">
              <v-icon small color="grey lighten-1">mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <v-tabs
      v-model="activeTab"
      background-color="transparent"
      dark
      slider-color="#FF4081"
      class="our-view-tabs mb-6"
    >
      <v-tab class="text-none font-weight-bold tab-item">
        <v-icon left small color="#FF4081">mdi-television-play</v-icon>
        Watch Together & Live Chat
      </v-tab>
      <v-tab class="text-none font-weight-bold tab-item">
        <v-icon left small color="#00E5FF">mdi-filmstrip</v-icon>
        Our Queue
        <v-chip
          v-if="ourQueue.length"
          x-small
          color="#FF4081"
          class="ml-2 font-weight-bold"
        >
          {{ ourQueue.length }}
        </v-chip>
      </v-tab>
      <v-tab class="text-none font-weight-bold tab-item">
        <v-icon left small color="#FF4081">mdi-dice-5</v-icon>
        Pass the Remote 🎲
      </v-tab>
      <v-tab class="text-none font-weight-bold tab-item">
        <v-icon left small color="#E040FB">mdi-gamepad-variant</v-icon>
        Game Night 🎮
      </v-tab>
    </v-tabs>

    <!-- Tab 1: Watch Together & Live Chat -->
    <div v-if="activeTab === 0" class="watch-together-tab">
      <!-- Floating Emoji Overlay Container -->
      <div class="floating-emojis-container" aria-hidden="true">
        <div
          v-for="emoji in floatingEmojis"
          :key="emoji.id"
          class="floating-emoji"
          :style="{ left: emoji.left + '%', animationDuration: emoji.duration + 's' }"
        >
          {{ emoji.symbol }}
        </div>
      </div>

      <!-- Room Header Bar -->
      <div class="room-control-bar pa-3 pa-sm-4 mb-4 d-flex align-center justify-space-between flex-wrap gap-3">
        <div class="d-flex align-center flex-wrap gap-2">
          <v-icon small color="#00E5FF">mdi-cast-connected</v-icon>
          <span class="white--text caption font-weight-bold">Shared Room:</span>
          <v-text-field
            v-model="roomId"
            dense
            outlined
            hide-details
            class="room-input-field"
            @change="handleRoomChange"
          ></v-text-field>
          <v-btn
            small
            depressed
            color="rgba(255, 255, 255, 0.12)"
            class="text-none white--text ml-1"
            @click="copyRoomInvite"
          >
            <v-icon left small>mdi-content-copy</v-icon>
            {{ copiedLink ? 'Copied!' : 'Copy Invite Link' }}
          </v-btn>
        </div>

        <!-- Identity Switcher -->
        <div class="d-flex align-center">
          <span class="grey--text text-caption mr-2 font-weight-bold">I am:</span>
          <v-btn-toggle v-model="currentUser" mandatory dense class="user-toggle">
            <v-btn value="Timi" small class="text-none font-weight-bold timi-toggle-btn">
              <v-icon x-small left color="#E040FB">{{ timiIcon }}</v-icon>
              Timi
            </v-btn>
            <v-btn value="Ejay" small class="text-none font-weight-bold ejay-toggle-btn">
              <v-icon x-small left color="#00E5FF">{{ ejayIcon }}</v-icon>
              Ejay
            </v-btn>
          </v-btn-toggle>
        </div>
      </div>

      <!-- Main Watch Together Grid: Player (75%) + Live Chat (25%) -->
      <v-row>
        <!-- Left: Stream Player Area -->
        <v-col cols="12" lg="8" xl="9">
          <!-- Active Media Playing Frame -->
          <div v-if="activeMedia" class="player-wrapper mb-4">
            <!-- In-Player Header -->
            <div class="player-header pa-3 d-flex align-center justify-space-between flex-wrap gap-2">
              <div class="d-flex align-center min-w-0">
                <v-icon color="#FF4081" class="mr-2">mdi-play-circle</v-icon>
                <div class="text-truncate">
                  <span class="white--text font-weight-bold body-2">{{ activeMedia.title }}</span>
                  <span v-if="activeMedia.mediaType === 'tv'" class="grey--text caption ml-2">
                    S{{ activeMedia.season || 1 }}:E{{ activeMedia.episode || 1 }}
                  </span>
                </div>
              </div>

              <!-- Stream Server Switcher -->
              <div class="d-flex align-center flex-wrap gap-1">
                <!-- Ad Shield Chip -->
                <v-chip
                  x-small
                  :color="adShield ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 82, 82, 0.2)'"
                  :class="adShield ? 'green--text text--accent-3' : 'red--text text--accent-2'"
                  class="font-weight-bold mr-1 cursor-pointer"
                  title="Click to toggle Ad Shield (blocks popup and redirect ads)"
                  @click="toggleAdShield"
                >
                  <v-icon left x-small :color="adShield ? '#00E676' : '#FF5252'">
                    {{ adShield ? 'mdi-shield-check' : 'mdi-shield-off' }}
                  </v-icon>
                  {{ adShield ? 'Ad Shield: Active' : 'Ad Shield: Off' }}
                </v-chip>

                <span class="grey--text text-caption mr-1 hidden-xs-only">Server:</span>
                <v-btn-toggle v-model="activeProviderId" mandatory dense class="server-toggle" @change="changeServer">
                  <v-btn
                    v-for="prov in providers"
                    :key="prov.id"
                    :value="prov.id"
                    x-small
                    text
                    class="text-none font-weight-bold"
                  >
                    {{ prov.name }}
                  </v-btn>
                </v-btn-toggle>
                <v-btn
                  x-small
                  depressed
                  color="rgba(0, 229, 255, 0.15)"
                  class="cyan--text text--accent-2 text-none font-weight-bold ml-1"
                  title="Auto-switch to next server"
                  @click="autoSwitchProvider"
                >
                  <v-icon x-small left color="#00E5FF">mdi-skip-next</v-icon>
                  Next Server
                </v-btn>
                <v-btn
                  v-if="playerUrl"
                  x-small
                  outlined
                  color="#00E5FF"
                  :href="playerUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-none font-weight-bold ml-1"
                  title="Open stream in a new unconstrained tab"
                >
                  <v-icon x-small left>mdi-open-in-new</v-icon>
                  Open Stream ↗
                </v-btn>
                <v-btn icon small dark class="ml-1" title="Close Player" @click="closePlayer">
                  <v-icon small>mdi-close</v-icon>
                </v-btn>
              </div>
            </div>

            <!-- Server auto-switch / buffering notification banner -->
            <transition name="fade">
              <div v-if="serverBufferingNotice" class="server-buffering-banner pa-2 px-3 d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-progress-circular indeterminate size="16" width="2" color="#00E5FF" class="mr-2"></v-progress-circular>
                  <span class="caption white--text">{{ serverBufferingNotice }}</span>
                </div>
                <div>
                  <v-btn x-small text color="#00E5FF" class="text-none font-weight-bold mr-1" @click="autoSwitchProvider">
                    Switch Now
                  </v-btn>
                  <v-btn x-small text color="grey" class="text-none" @click="dismissBufferingNotice">
                    Keep Server
                  </v-btn>
                </div>
              </div>
            </transition>

            <!-- Iframe Container -->
            <div class="iframe-container">
              <iframe
                v-if="playerUrl"
                :src="playerUrl"
                allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="origin"
                class="stream-iframe"
              ></iframe>
            </div>

            <!-- Video Player Controls & Broadcast Toolbar -->
            <div class="player-footer pa-3 d-flex align-center justify-space-between flex-wrap gap-2">
              <div class="d-flex align-center">
                <v-chip x-small color="rgba(0, 229, 255, 0.2)" class="cyan--text text--accent-2 mr-2">
                  <v-icon left x-small color="#00E5FF">mdi-broadcast</v-icon>
                  Synchronized
                </v-chip>
                <span class="grey--text text-caption">Watching together in Room <strong>{{ roomId }}</strong></span>
              </div>
              <div class="d-flex align-center">
                <v-btn
                  small
                  outlined
                  color="#FF4081"
                  class="text-none font-weight-bold mr-2"
                  @click="broadcastSyncPing"
                >
                  <v-icon left small>mdi-sync</v-icon>
                  Sync Up
                </v-btn>
                <v-btn
                  small
                  text
                  color="grey lighten-1"
                  class="text-none"
                  :to="`/movie/${activeMedia.mediaId}`"
                >
                  View Details
                </v-btn>
              </div>
            </div>
          </div>

          <!-- Empty Player Placeholder (when no movie loaded) -->
          <div v-else class="empty-player-hero pa-8 mb-4 text-center">
            <v-icon size="64" color="rgba(255, 64, 129, 0.45)" class="mb-3">
              mdi-popcorn
            </v-icon>
            <h3 class="white--text text-h6 font-weight-bold mb-2">Ready for Movie Night?</h3>
            <p class="grey--text text-body-2 mb-6 max-w-500 mx-auto">
              Select a title from Our Queue below or roll the Pass the Remote dice to stream together live.
            </p>
            <div class="d-flex justify-center align-center flex-wrap gap-3">
              <v-btn
                color="#FF4081"
                rounded
                depressed
                dark
                class="text-none font-weight-bold px-6"
                @click="activeTab = 1"
              >
                <v-icon left small>mdi-filmstrip</v-icon>
                Browse Our Queue
              </v-btn>
              <v-btn
                outlined
                color="white"
                rounded
                class="text-none font-weight-bold px-6"
                @click="activeTab = 2"
              >
                <v-icon left small>mdi-dice-5</v-icon>
                Roll Movie Dice 🎲
              </v-btn>
            </div>
          </div>

          <!-- Floating Emoji Reactions Bar -->
          <div class="reactions-card pa-3 d-flex align-center justify-space-between flex-wrap gap-2">
            <div class="d-flex align-center">
              <span class="grey--text text-caption font-weight-bold mr-3 text-uppercase tracking-wider">
                Reactions:
              </span>
              <div class="d-flex align-center flex-wrap gap-1">
                <v-btn
                  v-for="reaction in reactionsList"
                  :key="reaction.symbol"
                  icon
                  class="reaction-btn"
                  :title="reaction.title"
                  @click="sendReaction(reaction.symbol)"
                >
                  <span class="emoji-icon">{{ reaction.symbol }}</span>
                </v-btn>
              </div>
            </div>
            <span class="grey--text text-caption">Tap any emoji to react on both screens! ✨</span>
          </div>
        </v-col>

        <!-- Right: Live Chat Sidebar -->
        <v-col cols="12" lg="4" xl="3">
          <v-card class="live-chat-card d-flex flex-column" flat>
            <!-- Chat Card Header -->
            <div class="chat-header pa-3 d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-icon small color="#FF4081" class="mr-2">mdi-chat-processing</v-icon>
                <span class="white--text font-weight-bold body-2">Date Night Chat</span>
              </div>
              <v-chip x-small color="rgba(0, 229, 255, 0.2)" class="cyan--text text--accent-2">
                Live Sync
              </v-chip>
            </div>

            <!-- Messages Log -->
            <div ref="chatLog" class="chat-log pa-3 flex-grow-1">
              <div v-if="!messages.length" class="empty-chat-state text-center py-8">
                <v-icon size="40" color="rgba(255, 255, 255, 0.2)" class="mb-2">
                  mdi-forum-outline
                </v-icon>
                <p class="grey--text caption mb-0">No messages yet.<br>Say hi or react while watching!</p>
              </div>

              <div
                v-for="msg in messages"
                :key="msg.id"
                class="chat-bubble-row mb-3"
                :class="{ 'chat-bubble-row--self': msg.sender === currentUser }"
              >
                <div class="chat-sender-badge caption mb-1">
                  <span
                    :style="{ color: msg.sender === 'Timi' ? '#FF4081' : '#00E5FF' }"
                    class="font-weight-bold"
                  >
                    {{ msg.sender }}
                  </span>
                  <span class="grey--text text-caption ml-1 font-weight-light">
                    {{ formatTimestamp(msg.timestamp) }}
                  </span>
                </div>
                <div
                  class="chat-bubble pa-2 px-3"
                  :class="msg.sender === 'Timi' ? 'bubble-timi' : 'bubble-ejay'"
                >
                  <span class="bubble-text">{{ msg.text }}</span>
                </div>
              </div>
            </div>

            <!-- Chat Input Area -->
            <div class="chat-footer pa-3">
              <div class="d-flex align-center">
                <v-text-field
                  v-model="newMessageText"
                  placeholder="Type a message..."
                  dense
                  outlined
                  dark
                  hide-details
                  class="chat-text-input mr-2"
                  @keydown.enter="sendChatMessage"
                ></v-text-field>
                <v-btn
                  color="#FF4081"
                  depressed
                  fab
                  x-small
                  dark
                  :disabled="!newMessageText.trim()"
                  @click="sendChatMessage"
                >
                  <v-icon small>mdi-send</v-icon>
                </v-btn>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Tab 2: Our Date Night Queue -->
    <div v-else-if="activeTab === 1" class="our-queue-tab">
      <div v-if="!ourQueue.length" class="empty-queue-card pa-12 text-center">
        <v-icon size="64" color="rgba(0, 229, 255, 0.3)" class="mb-3">
          mdi-filmstrip-box-multiple
        </v-icon>
        <h3 class="white--text text-h6 font-weight-bold mb-2">Our Queue is Empty</h3>
        <p class="grey--text text-body-2 mb-6 max-w-500 mx-auto">
          Add movies and series to Our View from any movie details page by clicking the "Our View" button!
        </p>
        <v-btn color="#FF4081" rounded depressed dark class="text-none font-weight-bold px-6" to="/movies">
          Browse Movies
        </v-btn>
      </div>

      <div v-else class="queue-grid">
        <div v-for="item in ourQueue" :key="item.id" class="queue-item-card pa-3">
          <div class="d-flex">
            <!-- Poster Frame -->
            <div class="poster-container mr-3">
              <v-img :src="posterUrl(item)" class="queue-poster rounded-lg" width="90" height="135" cover>
                <div class="poster-overlay-badge">
                  <span class="caption font-weight-bold white--text">
                    {{ item.mediaType === 'tv' ? 'Series' : 'Movie' }}
                  </span>
                </div>
              </v-img>
            </div>

            <!-- Item Details & Notes -->
            <div class="flex-grow-1 min-w-0 d-flex flex-column justify-space-between">
              <div>
                <div class="d-flex align-center justify-space-between flex-wrap mb-1">
                  <h4 class="white--text text-body-1 font-weight-bold text-truncate mr-2">
                    {{ item.title }}
                  </h4>
                  <div class="d-flex align-center">
                    <span class="imdb-mini-badge mr-1">IMDb</span>
                    <span class="white--text caption font-weight-bold">
                      {{ item.voteAverage ? item.voteAverage.toFixed(1) : 'N/A' }}
                    </span>
                  </div>
                </div>

                <!-- Added By Tag -->
                <div class="caption grey--text mb-2">
                  Queued by <strong :style="{ color: item.addedBy === 'Timi' ? '#FF80AB' : '#80D8FF' }">{{ item.addedBy || 'Timi' }}</strong>
                </div>

                <!-- Couple Notes (Chat-Style Bubbles) -->
                <div class="couple-notes-thread mb-3">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-caption grey--text text--lighten-1 font-weight-bold">
                      <v-icon x-small color="#FF80AB" class="mr-1">mdi-chat-processing-outline</v-icon>
                      Date Night Notes
                    </span>
                    <span class="caption grey--text">{{ (item.notes && item.notes.length) || 0 }} notes</span>
                  </div>

                  <!-- Notes Bubbles Container -->
                  <div v-if="item.notes && item.notes.length" class="notes-bubbles-list d-flex flex-column gap-2 mb-2">
                    <div
                      v-for="note in item.notes"
                      :key="note.id"
                      class="d-flex"
                      :class="note.user === currentUser ? 'justify-end' : 'justify-start'"
                    >
                      <div
                        class="note-bubble pa-2 px-3 rounded-lg"
                        :class="note.user === currentUser ? 'note-bubble-me' : 'note-bubble-partner'"
                        :style="{
                          background: note.user === 'Timi' ? 'rgba(255, 64, 129, 0.18)' : 'rgba(0, 229, 255, 0.16)',
                          borderLeft: note.user === 'Timi' ? '3px solid #FF4081' : '3px solid #00E5FF',
                          maxWidth: '85%'
                        }"
                      >
                        <div class="d-flex align-center justify-space-between mb-1 gap-2">
                          <span
                            class="font-weight-bold"
                            style="font-size: 11px;"
                            :style="{ color: note.user === 'Timi' ? '#FF80AB' : '#00E5FF' }"
                          >
                            <v-icon x-small :color="note.user === 'Timi' ? '#E040FB' : '#00E5FF'" class="mr-1">
                              {{ note.user === 'Timi' ? timiIcon : ejayIcon }}
                            </v-icon>
                            {{ note.user }}
                          </span>
                          <!-- Read-only protection: only author can delete their own note -->
                          <v-btn
                            v-if="note.user === currentUser"
                            icon
                            x-small
                            dark
                            title="Delete note"
                            class="ml-1"
                            @click="deleteNote(item.id, note.id)"
                          >
                            <v-icon style="font-size: 13px;" color="grey lighten-1">mdi-close</v-icon>
                          </v-btn>
                        </div>
                        <div class="white--text caption" style="line-height: 1.35; word-break: break-word;">
                          {{ note.text }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-caption grey--text font-italic mb-2 px-1">
                    No notes yet. Add your thoughts for movie night! 👇
                  </div>

                  <!-- Quick Inline Add Note Field -->
                  <div class="caption grey--text font-weight-medium mb-1 d-flex align-center">
                    <v-icon x-small color="#00E5FF" class="mr-1">mdi-message-text-outline</v-icon>
                    Movie Night Note / Comment:
                  </div>
                  <div class="d-flex align-center gap-1 add-note-input-row">
                    <v-text-field
                      :value="newNoteInputs[item.id] || ''"
                      @input="val => $set(newNoteInputs, item.id, val)"
                      dense
                      outlined
                      dark
                      hide-details
                      :placeholder="`Add a note as ${currentUser}...`"
                      class="caption-input flex-grow-1"
                      @keydown.enter="submitNewNote(item.id)"
                    ></v-text-field>
                    <v-btn
                      small
                      depressed
                      :color="currentUser === 'Timi' ? '#E040FB' : '#00E5FF'"
                      :class="currentUser === 'Timi' ? 'white--text' : 'black--text'"
                      class="font-weight-bold text-none px-3"
                      @click="submitNewNote(item.id)"
                    >
                      <v-icon small left>mdi-send</v-icon>
                      Post Note
                    </v-btn>
                  </div>
                </div>
              </div>

              <!-- Actions: Stream Now / Remove -->
              <div class="d-flex align-center justify-space-between mt-2">
                <v-btn
                  color="#FF4081"
                  small
                  rounded
                  depressed
                  dark
                  class="text-none font-weight-bold px-4"
                  @click="streamQueueItem(item)"
                >
                  <v-icon left small>mdi-play</v-icon>
                  Stream Together
                </v-btn>
                <v-btn
                  icon
                  small
                  color="grey lighten-1"
                  title="Remove from Our View"
                  @click="removeFromQueue(item.id)"
                >
                  <v-icon small>mdi-trash-can-outline</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Pass the Remote 🎲 (Couples Dice) -->
    <div v-else-if="activeTab === 2" class="couples-dice-tab py-4">
      <!-- Mood Selector Hero (Visible when no pick is active) -->
      <div v-if="!pickedMovie" class="dice-hero text-center max-w-600 mx-auto mb-8">
        <h2 class="white--text text-h5 font-weight-bold mb-2">Pass the Remote 🎲</h2>
        <p class="grey--text text-body-2">
          Can't agree on what to watch tonight? Pick a vibe and let the dice decide your date night film!
        </p>

        <!-- Mood Selector Chips -->
        <div class="mood-chips-container my-6">
          <v-chip
            v-for="mood in moodOptions"
            :key="mood.id"
            filter
            :input-value="selectedMood === mood.id"
            color="rgba(255, 64, 129, 0.2)"
            text-color="white"
            class="mood-chip font-weight-bold cursor-pointer"
            @click="selectedMood = mood.id"
          >
            {{ mood.label }}
          </v-chip>
        </div>

        <!-- Roll Button -->
        <v-btn
          color="#FF4081"
          large
          rounded
          depressed
          dark
          :loading="rollingDice"
          class="text-none font-weight-black px-8 roll-dice-btn"
          @click="rollCouplesDice"
        >
          <v-icon left>mdi-dice-5</v-icon>
          Roll for Tonight's Movie 🎲
        </v-btn>

        <!-- Custom Vibe / Ask AI Trigger -->
        <div class="mt-4">
          <v-btn
            text
            small
            color="#00E5FF"
            class="text-none font-weight-bold"
            @click="showCustomVibeDialog = true"
          >
            <v-icon left small color="#00E5FF">mdi-creation</v-icon>
            Custom Vibe / Ask AI ✨
          </v-btn>
        </div>
      </div>

      <!-- Collapsed Mood Bar (Visible when movie is picked to avoid duplicate roll buttons) -->
      <div v-else class="active-vibe-bar text-center max-w-600 mx-auto mb-4 d-flex align-center justify-center flex-wrap gap-2">
        <span class="grey--text text-caption">Vibe:</span>
        <v-chip small color="rgba(255, 64, 129, 0.2)" text-color="white" class="font-weight-bold">
          {{ selectedMoodLabel }}
        </v-chip>
        <v-btn
          x-small
          text
          color="#00E5FF"
          class="text-none font-weight-bold ml-1"
          @click="resetDicePick"
        >
          <v-icon x-small left color="#00E5FF">mdi-swap-horizontal</v-icon>
          Change Vibe
        </v-btn>
      </div>

      <!-- Winning Result Card -->
      <v-fade-transition>
        <div v-if="pickedMovie" class="dice-result-card pa-4 pa-sm-6 max-w-700 mx-auto">
          <div class="destiny-pick-tag mb-3 d-flex align-center justify-space-between flex-wrap gap-2">
            <div class="d-flex align-center">
              <v-icon small color="#FF80AB" class="mr-1">mdi-sparkles</v-icon>
              <span class="text-caption rose--text font-weight-bold text-uppercase tracking-wider" style="color: #FF80AB;">
                Tonight's Destiny Pick
              </span>
            </div>
            <div class="d-flex align-center gap-2">
              <span v-if="diceRolledBy" class="grey--text caption font-weight-medium mr-2">
                Rolled by <strong :style="{ color: diceRolledBy === 'Timi' ? '#FF4081' : '#00E5FF' }">{{ diceRolledBy }}</strong>
              </span>
              <v-btn icon x-small dark title="Close and pick another vibe" @click="resetDicePick">
                <v-icon small color="grey lighten-1">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
          <div class="d-flex flex-column flex-sm-row">
            <v-img
              :src="pickedMoviePoster"
              width="135"
              max-width="135"
              height="200"
              class="destiny-pick-poster rounded-lg flex-shrink-0 mx-auto mr-sm-6 mb-4 mb-sm-0"
              cover
            ></v-img>
            <div class="flex-grow-1 min-w-0">
              <h3 class="white--text text-h6 font-weight-bold mb-1 line-height-tight">
                {{ pickedMovie.title || pickedMovie.name }}
              </h3>
              <div class="d-flex align-center mb-3">
                <span class="imdb-mini-badge mr-2">IMDb</span>
                <span class="white--text caption font-weight-bold mr-3">
                  {{ pickedMovie.vote_average ? pickedMovie.vote_average.toFixed(1) : '8.0' }}
                </span>
                <span class="grey--text text-caption">
                  {{ (pickedMovie.release_date || pickedMovie.first_air_date || '').slice(0, 4) }}
                </span>
              </div>
              <p class="grey--text text--lighten-2 text-caption dice-overview mb-3">
                {{ pickedMovie.overview }}
              </p>

              <!-- Date Night AI Pitch -->
              <div v-if="aiPitch || loadingAiPitch" class="ai-pitch-box pa-3 rounded-lg mb-4">
                <div class="d-flex align-center justify-space-between mb-1">
                  <div class="d-flex align-center">
                    <v-icon x-small color="#00E5FF" class="mr-1">mdi-creation</v-icon>
                    <span class="caption font-weight-bold cyan--text text--accent-2">
                      Date Night AI Concierge:
                    </span>
                  </div>
                  <v-chip x-small outlined color="#00E5FF" class="px-1" style="font-size: 9px; height: 16px;">
                    Gemini Free
                  </v-chip>
                </div>
                <div v-if="loadingAiPitch" class="d-flex align-center py-1">
                  <v-progress-circular indeterminate size="12" width="2" color="#00E5FF" class="mr-2"></v-progress-circular>
                  <span class="caption grey--text font-italic">Consulting AI Concierge for Timi &amp; Ejay...</span>
                </div>
                <p v-else class="white--text caption mb-0 font-italic" style="line-height: 1.4;">
                  "{{ aiPitch }}"
                </p>
              </div>

              <div class="d-flex align-center flex-wrap gap-2 destiny-actions">
                <v-btn
                  color="#00E676"
                  rounded
                  depressed
                  dark
                  class="text-none font-weight-bold px-4 black--text"
                  @click="acceptDicePick"
                >
                  <v-icon left small color="black">mdi-check-bold</v-icon>
                  Let's Watch!
                </v-btn>
                <v-btn
                  color="rgba(255, 82, 82, 0.2)"
                  rounded
                  depressed
                  dark
                  class="text-none font-weight-bold px-4 red--text text--lighten-2"
                  @click="rejectDicePick"
                >
                  <v-icon left small color="#FF5252">mdi-close-thick</v-icon>
                  Roll Again
                </v-btn>
                <v-btn
                  outlined
                  rounded
                  color="#00E5FF"
                  class="text-none font-weight-medium px-3 cyan--text"
                  @click="resetDicePick"
                >
                  <v-icon left small color="#00E5FF">mdi-swap-horizontal</v-icon>
                  Change Vibe
                </v-btn>
                <v-btn
                  outlined
                  rounded
                  color="grey lighten-1"
                  class="text-none font-weight-medium px-3"
                  @click="addPickedToOurQueue"
                >
                  <v-icon left x-small color="#FF4081">mdi-plus</v-icon>
                  Save to Queue
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </v-fade-transition>
    </div>

    <!-- Tab 4: Game Night 🎮 (Couples Arcade) -->
    <div v-else-if="activeTab === 3" class="game-night-tab py-4">
      <!-- Live Couples Scoreboard Header -->
      <div class="couples-scoreboard-card pa-4 mb-6 rounded-xl max-w-700 mx-auto text-center">
        <div class="d-flex align-center justify-space-between flex-wrap gap-2">
          <div class="d-flex align-center gap-2">
            <v-icon color="#FFD700" small>mdi-trophy-award</v-icon>
            <span class="white--text caption font-weight-black text-uppercase tracking-wider">Arcade Scoreboard</span>
          </div>
          <div class="d-flex align-center gap-3">
            <span class="caption font-weight-black" style="color: #FF80AB;">
              Timi: {{ gameScores.timi || 0 }} 🏆
            </span>
            <span class="grey--text caption font-weight-bold">vs</span>
            <span class="caption font-weight-black" style="color: #80D8FF;">
              Ejay: {{ gameScores.ejay || 0 }} ⚡
            </span>
          </div>
        </div>
      </div>

      <!-- Game Mode Selector Buttons -->
      <div class="d-flex justify-center align-center flex-wrap gap-3 mb-6">
        <v-btn
          rounded
          depressed
          :color="activeGameMode === 'whot' ? '#E040FB' : 'rgba(255, 255, 255, 0.08)'"
          :class="activeGameMode === 'whot' ? 'white--text' : 'grey--text text--lighten-1'"
          class="text-none font-weight-black px-6"
          @click="activeGameMode = 'whot'"
        >
          <v-icon left small>mdi-cards-playing-outline</v-icon>
          WHOT! 🃏
        </v-btn>
        <v-btn
          rounded
          depressed
          :color="activeGameMode === 'wordDuel' ? '#00E5FF' : 'rgba(255, 255, 255, 0.08)'"
          :class="activeGameMode === 'wordDuel' ? 'black--text' : 'grey--text text--lighten-1'"
          class="text-none font-weight-black px-6"
          @click="activeGameMode = 'wordDuel'"
        >
          <v-icon left small>mdi-format-letter-case</v-icon>
          Word Duel 📝
        </v-btn>
        <v-btn
          rounded
          depressed
          :color="activeGameMode === 'scrabble' ? '#FFD54F' : 'rgba(255, 255, 255, 0.08)'"
          :class="activeGameMode === 'scrabble' ? 'black--text' : 'grey--text text--lighten-1'"
          class="text-none font-weight-black px-6"
          @click="activeGameMode = 'scrabble'"
        >
          <v-icon left small>mdi-grid</v-icon>
          Words with Friends 🔠
        </v-btn>
      </div>

      <!-- Active Game Component -->
      <v-fade-transition mode="out-in">
        <whot-game
          v-if="activeGameMode === 'whot'"
          :current-user="currentUser"
          :room-id="roomId"
        ></whot-game>
        <word-duel-game
          v-else-if="activeGameMode === 'wordDuel'"
          :current-user="currentUser"
          :room-id="roomId"
        ></word-duel-game>
        <scrabble-game
          v-else-if="activeGameMode === 'scrabble'"
          :current-user="currentUser"
          :room-id="roomId"
        ></scrabble-game>
      </v-fade-transition>
    </div>

    <!-- Date Night Planning Dialog -->
    <v-dialog v-model="showPlanDialog" max-width="500" persistent>
      <v-card class="plan-dialog-card pa-6" dark>
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="d-flex align-center">
            <v-icon color="#FFD700" class="mr-2">mdi-calendar-star</v-icon>
            <h3 class="white--text text-h6 font-weight-bold mb-0">Plan Next Date Night</h3>
          </div>
          <v-btn icon small dark @click="showPlanDialog = false">
            <v-icon small>mdi-close</v-icon>
          </v-btn>
        </div>

        <p class="grey--text text-caption mb-4">
          Lock in a special time for your next movie date night together! 🥂
        </p>

        <v-text-field
          v-model="planForm.title"
          label="Event Title"
          outlined
          dense
          placeholder="e.g. Movie & Wine Night 🥂"
          class="mb-3"
        ></v-text-field>

        <v-text-field
          v-model="planForm.datetime"
          label="Date & Time"
          type="datetime-local"
          outlined
          dense
          class="mb-3"
        ></v-text-field>

        <v-select
          v-if="ourQueue.length"
          v-model="planForm.selectedMovieId"
          :items="queueSelectItems"
          label="Feature Film (from Our Queue)"
          outlined
          dense
          clearable
          class="mb-4"
        ></v-select>

        <div class="d-flex justify-end gap-2">
          <v-btn text class="text-none font-weight-bold" @click="showPlanDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="#FF4081"
            depressed
            class="text-none font-weight-bold px-6"
            :disabled="!planForm.datetime"
            @click="saveDateNightPlan"
          >
            Lock In Date 🥂
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- AI Custom Vibe Dialog -->
    <v-dialog v-model="showCustomVibeDialog" max-width="500">
      <v-card class="plan-dialog-card pa-6" dark>
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="d-flex align-center">
            <v-icon color="#00E5FF" class="mr-2">mdi-creation</v-icon>
            <h3 class="white--text text-h6 font-weight-bold mb-0">Ask AI Concierge</h3>
          </div>
          <v-btn icon small dark @click="showCustomVibeDialog = false">
            <v-icon small>mdi-close</v-icon>
          </v-btn>
        </div>
        <p class="grey--text text-caption mb-4">
          Describe the exact mood, feeling, or style of movie you and your partner want to watch tonight.
        </p>

        <v-textarea
          v-model="customVibeText"
          outlined
          dense
          rows="3"
          dark
          placeholder="e.g. A feel-good romance with witty humor and a great soundtrack, or a cozy autumn murder mystery..."
          color="#00E5FF"
          class="caption-input mb-3"
          @keydown.enter.prevent="searchCustomVibe"
        ></v-textarea>

        <div class="d-flex justify-end gap-2">
          <v-btn text color="grey" class="text-none font-weight-medium" @click="showCustomVibeDialog = false">
            Cancel
          </v-btn>
          <v-btn
            depressed
            color="#00E5FF"
            class="text-none font-weight-bold black--text px-4"
            :loading="rollingDice"
            @click="searchCustomVibe"
          >
            <v-icon left small color="black">mdi-sparkles</v-icon>
            Find Movie ✨
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Global Snackbar Notification -->
    <v-snackbar v-model="snackbar" timeout="3000" top color="rgba(10, 14, 24, 0.95)">
      <div class="d-flex align-center">
        <v-icon small color="#00E5FF" class="mr-2">mdi-check-circle</v-icon>
        <span class="white--text font-weight-medium text-caption">{{ snackbarText }}</span>
      </div>
    </v-snackbar>
  </div>
</template>

<script>
import firebaseSync from "@/services/firebaseSync";
import aiConciergeService from "@/services/aiConciergeService";
import WhotGame from "@/components/games/WhotGame.vue";
import WordDuelGame from "@/components/games/WordDuelGame.vue";
import ScrabbleGame from "@/components/games/ScrabbleGame.vue";

export default {
  name: "OurView",
  components: {
    WhotGame,
    WordDuelGame,
    ScrabbleGame,
  },
  data() {
    return {
      activeTab: 0,
      roomId: this.$route.query.room || "date-night",
      currentUser: (this.$route.query.user === "Ejay" || this.$route.query.user === "Timi")
        ? this.$route.query.user
        : (localStorage.getItem("our_view_user") || "Timi"),
      timiIcon: localStorage.getItem("timi_user_icon") || "mdi-crown",
      ejayIcon: localStorage.getItem("ejay_user_icon") || "mdi-lightning-bolt",
      copiedLink: false,
      snackbar: false,
      snackbarText: "",
      firebaseUnsubscribers: [],
      adShield: true,

      // Game Night State
      activeGameMode: "whot",
      gameScores: { timi: 0, ejay: 0 },

      // Active player state
      activeMedia: null,
      activeProviderId: localStorage.getItem("preferred_stream_server") || "vidlink",
      providers: [
        {
          name: "VidLink",
          id: "vidlink",
          movieUrl: (id) => `https://vidlink.pro/movie/${id}?primaryColor=FF4081&secondaryColor=00E5FF`,
          tvUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=FF4081&secondaryColor=00E5FF`,
        },
        {
          name: "VidSrc",
          id: "vidsrc_pm",
          movieUrl: (id) => `https://vidsrc.pm/embed/movie?tmdb=${id}`,
          tvUrl: (id, s, e) => `https://vidsrc.pm/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
        },
        {
          name: "MultiEmbed",
          id: "multiembed",
          movieUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
          tvUrl: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
        },
        {
          name: "AutoEmbed",
          id: "autoembed",
          movieUrl: (id) => `https://autoembed.co/movie/tmdb/${id}`,
          tvUrl: (id, s, e) => `https://autoembed.co/tv/tmdb/${id}-${s}-${e}`,
        },
        {
          name: "2Embed",
          id: "twoembed",
          movieUrl: (id) => `https://www.2embed.skin/embed/${id}`,
          tvUrl: (id, s, e) => `https://www.2embed.skin/embedtv/${id}&s=${s}&e=${e}`,
        },
      ],

      // Live Chat
      messages: [],
      newMessageText: "",

      // Floating Emojis
      floatingEmojis: [],
      reactionsList: [
        { symbol: "🍿", title: "Popcorn" },
        { symbol: "🎬", title: "Cinema" },
        { symbol: "🥺", title: "Emotional" },
        { symbol: "😂", title: "Laughing" },
        { symbol: "🥂", title: "Cheers" },
        { symbol: "🔥", title: "Fire" },
      ],

      // Our Queue Notes
      editingNoteId: null,
      tempNote: "",
      newNoteInputs: {},

      // Pass the Remote 🎲
      selectedMood: "romance",
      moodOptions: [
        { id: "romance", label: "Romantic & Cozy 🕯️", genreIds: [10749, 18] },
        { id: "comedy", label: "Laugh Together 😂", genreIds: [35, 10749] },
        { id: "thriller", label: "Hold Hands Thriller 😱", genreIds: [53, 9648, 27] },
        { id: "animation", label: "Animation Magic ✨", genreIds: [16, 10751, 14] },
        { id: "action", label: "Action & Sci-Fi 🚀", genreIds: [28, 878] },
        { id: "mystery", label: "Mind-Bending Mystery 🔍", genreIds: [9648, 878] },
      ],
      rollingDice: false,
      pickedMovie: null,
      diceRolledBy: null,
      aiPitch: "",
      loadingAiPitch: false,
      customVibeText: "",
      showCustomVibeDialog: false,

      // Date Night Planning
      showPlanDialog: false,
      planForm: {
        title: "Movie Date Night 🥂",
        datetime: "",
        selectedMovieId: null,
      },
      countdownText: "",
      countdownInterval: null,

      // Sync
      broadcastChannel: null,

      // Auto-switch watchdog
      serverBufferingNotice: "",
      bufferingTimer: null,
      bufferingAutoSwitchTimer: null,
    };
  },
  computed: {
    ourQueue() {
      return this.$store.getters.ourViewItems || [];
    },
    selectedMoodLabel() {
      const mood = this.moodOptions.find((m) => m.id === this.selectedMood);
      return mood ? mood.label : "Movie Vibe";
    },
    nextDateNight() {
      return this.$store.getters.nextDateNight;
    },
    formattedDateNightSchedule() {
      if (!this.nextDateNight || !this.nextDateNight.datetime) return "";
      try {
        const d = new Date(this.nextDateNight.datetime);
        return d.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        return this.nextDateNight.datetime;
      }
    },
    playerUrl() {
      if (!this.activeMedia) return "";
      const prov = this.providers.find((p) => p.id === this.activeProviderId) || this.providers[0];
      if (this.activeMedia.mediaType === "tv") {
        return prov.tvUrl(this.activeMedia.mediaId, this.activeMedia.season || 1, this.activeMedia.episode || 1);
      }
      return prov.movieUrl(this.activeMedia.mediaId);
    },
    queueSelectItems() {
      return this.ourQueue.map((item) => ({
        text: item.title,
        value: item.id,
      }));
    },
    pickedMoviePoster() {
      if (!this.pickedMovie || !this.pickedMovie.poster_path) {
        return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300";
      }
      return `https://image.tmdb.org/t/p/w300/${this.pickedMovie.poster_path}`;
    },
    currentProviderName() {
      const prov = this.providers.find((p) => p.id === this.activeProviderId);
      return prov ? prov.name : this.activeProviderId;
    },
  },
  watch: {
    currentUser(newVal) {
      localStorage.setItem("our_view_user", newVal);
      window.dispatchEvent(new CustomEvent("user-identity-changed", { detail: newVal }));
    },
    "$route.query.user"(newUser) {
      if (newUser && (newUser === "Timi" || newUser === "Ejay") && newUser !== this.currentUser) {
        this.currentUser = newUser;
      }
    },
    activeProviderId(newVal) {
      localStorage.setItem("preferred_stream_server", newVal);
      if (this.activeMedia) {
        this.startBufferingWatchdog();
      }
    },
    activeMedia(newVal) {
      if (newVal) {
        this.startBufferingWatchdog();
      } else {
        this.clearBufferingWatchdog();
      }
    },
    nextDateNight: {
      handler() {
        this.updateCountdown();
      },
      immediate: true,
    },
    "$route.query.room"(newRoom) {
      if (newRoom && newRoom !== this.roomId) {
        this.roomId = newRoom;
        this.loadChatHistory();
      }
    },
    "$route.query.tab"(newTab) {
      if (newTab === "games" || newTab === "3") {
        this.activeTab = 3;
      } else if (newTab === "queue" || newTab === "1") {
        this.activeTab = 1;
      } else if (newTab === "dice" || newTab === "2") {
        this.activeTab = 2;
      } else if (newTab === "watch" || newTab === "0") {
        this.activeTab = 0;
      }
    },
  },
  created() {
    this.initSync();
    this.loadChatHistory();
    this.checkRouteQueryParams();
    const tabQ = this.$route.query.tab;
    if (tabQ === "games" || tabQ === "3") {
      this.activeTab = 3;
    } else if (tabQ === "queue" || tabQ === "1") {
      this.activeTab = 1;
    } else if (tabQ === "dice" || tabQ === "2") {
      this.activeTab = 2;
    }
  },
  mounted() {
    this.startCountdownTimer();
    this.scrollChatToBottom();
    this.setupPopupProtection();
    window.addEventListener("user-identity-changed", (e) => {
      if (e && e.detail) {
        this.currentUser = e.detail;
      }
    });
    window.addEventListener("user-icons-updated", (e) => {
      if (e && e.detail) {
        this.timiIcon = e.detail.timiIcon || this.timiIcon;
        this.ejayIcon = e.detail.ejayIcon || this.ejayIcon;
      }
    });
    // Broadcast presence so peers can sync active media
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: "ROOM_HELLO",
        roomId: this.roomId,
        sender: this.currentUser,
      });
    }
  },
  beforeDestroy() {
    this.teardownPopupProtection();
    if (this.firebaseUnsubscribers && this.firebaseUnsubscribers.length) {
      this.firebaseUnsubscribers.forEach((unsub) => {
        if (typeof unsub === "function") unsub();
      });
      this.firebaseUnsubscribers = [];
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    window.removeEventListener("storage", this.handleStorageEvent);
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.clearBufferingWatchdog();
  },
  methods: {
    initSync() {
      // 1. Firebase Realtime Cloud Synchronization
      if (firebaseSync.isConfigured()) {
        const unsubChat = firebaseSync.subscribeToChat((remoteMessages) => {
          if (remoteMessages && Array.isArray(remoteMessages)) {
            this.messages = remoteMessages;
            this.saveChatHistory();
            this.scrollChatToBottom();
          }
        }, this.roomId);

        const unsubReaction = firebaseSync.subscribeToReaction((reaction) => {
          if (reaction && reaction.symbol && reaction.sender !== this.currentUser) {
            if (Date.now() - (reaction.timestamp || 0) < 6000) {
              this.triggerFloatingEmoji(reaction.symbol);
            }
          }
        }, this.roomId);

        const unsubMedia = firebaseSync.subscribeToActiveMedia((media) => {
          if (media) {
            const isFreshPlayback = media.timestamp && (Date.now() - media.timestamp < 45000);
            const hasMediaChanged = !this.activeMedia || this.activeMedia.mediaId !== media.mediaId;
            const hasProviderChanged = media.providerId && this.activeProviderId !== media.providerId;
            if (hasMediaChanged || hasProviderChanged) {
              this.activeMedia = media;
              if (media.providerId && this.activeProviderId !== media.providerId) {
                this.activeProviderId = media.providerId;
                const prov = this.providers.find((p) => p.id === media.providerId);
                this.showToast(`Partner switched server to ${prov ? prov.name : media.providerId}! 🍿`);
              } else if (hasMediaChanged && isFreshPlayback) {
                this.showToast(`Partner streaming: ${media.title || 'Movie'}! 🍿`);
              }
              if (isFreshPlayback) {
                this.activeTab = 0;
              }
              try {
                localStorage.setItem(`our-view-active-media-${this.roomId}`, JSON.stringify(media));
              } catch (e) {
                // ignore
              }
            }
          } else if (!media && this.activeMedia) {
            this.activeMedia = null;
            this.clearBufferingWatchdog();
            try {
              localStorage.removeItem(`our-view-active-media-${this.roomId}`);
            } catch (e) {
              // ignore
            }
          }
        }, this.roomId);

        const unsubDice = firebaseSync.subscribeToDice((diceData) => {
          if (!diceData) return;
          if (diceData.status === "pending" && diceData.movie) {
            this.pickedMovie = diceData.movie;
            this.diceRolledBy = diceData.rolledBy;
            this.rollingDice = false;
            this.activeTab = 2;
            if (diceData.rolledBy !== this.currentUser) {
              this.showToast(`${diceData.rolledBy} rolled the dice: ${diceData.movie.title || diceData.movie.name}! 🎲`);
            }
            this.generateAiPitch(this.pickedMovie);
          } else if (diceData.status === "rejected" && diceData.votedBy !== this.currentUser) {
            this.rollingDice = true;
            this.showToast(`${diceData.votedBy} voted ❌ to re-roll! Rolling again... 🎲`);
            // Note: Do not call this.rollCouplesDice() here to prevent race condition. The partner who rejected is rolling.
          } else if (diceData.status === "accepted" && diceData.votedBy !== this.currentUser) {
            this.showToast(`${diceData.votedBy} approved ✔️ Let's Watch! 🍿`);
          } else if (diceData.status === "reset") {
            this.pickedMovie = null;
            this.diceRolledBy = null;
            this.rollingDice = false;
            this.aiPitch = "";
          }
        }, this.roomId);

        const unsubScores = firebaseSync.subscribeToScoreboard((scores) => {
          if (scores) {
            this.gameScores = scores;
          }
        }, this.roomId);

        this.firebaseUnsubscribers.push(unsubChat, unsubReaction, unsubMedia, unsubDice, unsubScores);
      }

      // 2. BroadcastChannel for fast same-browser multi-tab sync
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          this.broadcastChannel = new BroadcastChannel("our-view-sync");
          this.broadcastChannel.onmessage = (event) => {
            this.handleSyncMessage(event.data);
          };
        } catch (e) {
          console.warn("BroadcastChannel initialization skipped", e);
        }
      }

      // 3. Storage event listener for cross-window / tab storage events
      if (typeof window !== "undefined") {
        window.addEventListener("storage", this.handleStorageEvent);
      }
    },
    handleSyncMessage(data) {
      if (!data || data.roomId !== this.roomId) return;

      if (data.type === "CHAT_MESSAGE") {
        if (!this.messages.some((m) => m.id === data.payload.id)) {
          this.messages.push(data.payload);
          this.scrollChatToBottom();
        }
      } else if (data.type === "REACTION") {
        this.triggerFloatingEmoji(data.payload.symbol);
      } else if (data.type === "PLAY_MEDIA") {
        this.activeMedia = data.payload;
        if (data.payload && data.payload.providerId && this.activeProviderId !== data.payload.providerId) {
          this.activeProviderId = data.payload.providerId;
        }
        this.activeTab = 0;
        try {
          localStorage.setItem(`our-view-active-media-${this.roomId}`, JSON.stringify(data.payload));
        } catch (e) {
          // ignore
        }
        this.showToast(`${data.sender || 'Partner'} started streaming ${data.payload.title}! 🍿`);
      } else if (data.type === "CLOSE_MEDIA") {
        this.activeMedia = null;
        this.clearBufferingWatchdog();
        try {
          localStorage.removeItem(`our-view-active-media-${this.roomId}`);
        } catch (e) {
          // ignore
        }
      } else if (data.type === "ROOM_HELLO") {
        if (this.activeMedia) {
          const packet = {
            type: "PLAY_MEDIA",
            roomId: this.roomId,
            sender: this.currentUser,
            payload: this.activeMedia,
          };
          if (this.broadcastChannel) {
            this.broadcastChannel.postMessage(packet);
          }
        }
      } else if (data.type === "DICE_ROLLED") {
        this.pickedMovie = data.payload.movie;
        this.diceRolledBy = data.payload.rolledBy;
        this.rollingDice = false;
        this.activeTab = 2;
        this.showToast(`${data.sender || 'Partner'} rolled the dice: ${data.payload.movie.title || data.payload.movie.name}! 🎲`);
        this.generateAiPitch(this.pickedMovie);
      } else if (data.type === "DICE_ACCEPTED") {
        this.activeMedia = data.payload;
        if (data.payload && data.payload.providerId && this.activeProviderId !== data.payload.providerId) {
          this.activeProviderId = data.payload.providerId;
        }
        this.activeTab = 0;
        try {
          localStorage.setItem(`our-view-active-media-${this.roomId}`, JSON.stringify(data.payload));
        } catch (e) {
          // ignore
        }
        this.showToast(`${data.sender || 'Partner'} voted ✔️ Let's Watch! Streaming ${data.payload.title}! 🍿`);
      } else if (data.type === "DICE_REJECTED") {
        this.rollingDice = true;
        this.showToast(`${data.sender || 'Partner'} voted ❌ to re-roll! Rolling again... 🎲`);
      } else if (data.type === "DICE_RESET") {
        this.pickedMovie = null;
        this.diceRolledBy = null;
        this.rollingDice = false;
        this.aiPitch = "";
      } else if (data.type === "SYNC_PING") {
        this.showToast(`${data.sender || 'Partner'} requested a playback sync.`);
      }
    },
    handleStorageEvent(event) {
      if (event.key === `our-view-chat-${this.roomId}` && event.newValue) {
        try {
          this.messages = JSON.parse(event.newValue);
          this.scrollChatToBottom();
        } catch (e) {
          // ignore parsing error
        }
      }
      if (event.key === "our-view-last-reaction" && event.newValue) {
        try {
          const item = JSON.parse(event.newValue);
          if (item.roomId === this.roomId) {
            this.triggerFloatingEmoji(item.symbol);
          }
        } catch (e) {
          // ignore parsing error
        }
      }
      if (event.key === "our-view-last-sync-event" && event.newValue) {
        try {
          const packet = JSON.parse(event.newValue);
          this.handleSyncMessage(packet);
        } catch (e) {
          // ignore parsing error
        }
      }
    },
    loadChatHistory() {
      try {
        const stored = localStorage.getItem(`our-view-chat-${this.roomId}`);
        this.messages = stored ? JSON.parse(stored) : [];
      } catch (e) {
        this.messages = [];
      }
    },
    saveChatHistory() {
      try {
        localStorage.setItem(`our-view-chat-${this.roomId}`, JSON.stringify(this.messages));
      } catch (e) {
        // ignore storage error
      }
    },
    sendChatMessage() {
      const text = this.newMessageText.trim();
      if (!text) return;

      const messageObj = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sender: this.currentUser,
        text,
        timestamp: Date.now(),
      };

      this.messages.push(messageObj);
      this.saveChatHistory();
      this.newMessageText = "";
      this.scrollChatToBottom();

      // Broadcast
      const packet = {
        type: "CHAT_MESSAGE",
        roomId: this.roomId,
        sender: this.currentUser,
        payload: messageObj,
      };

      firebaseSync.sendChatMessage(messageObj, this.roomId);

      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(packet);
      }
      try {
        localStorage.setItem("our-view-last-sync-event", JSON.stringify(packet));
      } catch (e) {
        // ignore storage quota error
      }
    },
    sendReaction(symbol) {
      this.triggerFloatingEmoji(symbol);

      const packet = {
        type: "REACTION",
        roomId: this.roomId,
        sender: this.currentUser,
        payload: { symbol },
      };

      firebaseSync.sendReaction(symbol, this.currentUser, this.roomId);

      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(packet);
      }
      try {
        localStorage.setItem(
          "our-view-last-reaction",
          JSON.stringify({ symbol, roomId: this.roomId, time: Date.now() })
        );
      } catch (e) {
        // ignore storage quota error
      }
    },
    triggerFloatingEmoji(symbol) {
      const newEmoji = {
        id: `emoji-${Date.now()}-${Math.random()}`,
        symbol,
        left: 20 + Math.random() * 60,
        duration: 2 + Math.random() * 1.2,
      };
      this.floatingEmojis.push(newEmoji);
      setTimeout(() => {
        this.floatingEmojis = this.floatingEmojis.filter((e) => e.id !== newEmoji.id);
      }, (newEmoji.duration + 0.5) * 1000);
    },
    scrollChatToBottom() {
      this.$nextTick(() => {
        if (this.$refs.chatLog) {
          this.$refs.chatLog.scrollTop = this.$refs.chatLog.scrollHeight;
        }
      });
    },
    formatTimestamp(ts) {
      if (!ts) return "";
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },
    handleRoomChange() {
      if (!this.roomId) this.roomId = "date-night";
      this.$router
        .replace({
          query: { ...this.$route.query, room: this.roomId },
        })
        .catch(() => {});
      this.loadChatHistory();
    },
    copyRoomInvite() {
      let fullUrl = `${window.location.origin}/our-view?room=${encodeURIComponent(this.roomId)}`;
      if (this.activeMedia) {
        fullUrl += `&mediaType=${encodeURIComponent(this.activeMedia.mediaType)}&id=${encodeURIComponent(this.activeMedia.mediaId)}&title=${encodeURIComponent(this.activeMedia.title || "")}`;
        if (this.activeMedia.season) fullUrl += `&season=${encodeURIComponent(this.activeMedia.season)}`;
        if (this.activeMedia.episode) fullUrl += `&episode=${encodeURIComponent(this.activeMedia.episode)}`;
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(fullUrl).then(() => {
          this.copiedLink = true;
          this.showToast("Room invite link copied to clipboard! 🥂");
          setTimeout(() => {
            this.copiedLink = false;
          }, 3000);
        });
      }
    },
    checkRouteQueryParams() {
      const { mediaType, id, title } = this.$route.query;
      if (mediaType && id) {
        this.activeMedia = {
          mediaType,
          mediaId: id,
          title: title || "Movie",
          season: this.$route.query.season || 1,
          episode: this.$route.query.episode || 1,
          timestamp: Date.now(),
        };
        try {
          localStorage.setItem(`our-view-active-media-${this.roomId}`, JSON.stringify(this.activeMedia));
        } catch (e) {
          // ignore
        }
        this.activeTab = 0;
      }
    },
    toggleAdShield() {
      this.adShield = !this.adShield;
      this.showToast(
        this.adShield
          ? "🛡️ Ad Shield enabled: Popups and redirects blocked!"
          : "⚠️ Ad Shield disabled."
      );
    },
    setupPopupProtection() {
      if (typeof window === "undefined" || this._popupProtectionActive) return;
      this._popupProtectionActive = true;
      this._originalWindowOpen = window.open;
      const self = this;
      window.open = function(url, target, features) {
        if (self.adShield) {
          if (!url || typeof url !== "string" || url.startsWith("/") || url.includes(window.location.host)) {
            return self._originalWindowOpen ? self._originalWindowOpen.call(window, url, target, features) : null;
          }
          console.warn("[AdShield] Blocked popup window:", url);
          self.showToast("🛡️ Ad Shield blocked an external popup!");
          return null;
        }
        return self._originalWindowOpen ? self._originalWindowOpen.call(window, url, target, features) : null;
      };
    },
    teardownPopupProtection() {
      if (typeof window !== "undefined" && this._originalWindowOpen) {
        window.open = this._originalWindowOpen;
        this._popupProtectionActive = false;
      }
    },
    changeServer(providerId) {
      this.clearBufferingWatchdog();
      this.activeProviderId = providerId;
      localStorage.setItem("preferred_stream_server", providerId);

      if (this.activeMedia) {
        this.activeMedia = {
          ...this.activeMedia,
          providerId,
        };
        firebaseSync.setActiveMedia(this.activeMedia, this.roomId);

        const packet = {
          type: "PLAY_MEDIA",
          roomId: this.roomId,
          sender: this.currentUser,
          payload: this.activeMedia,
        };
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage(packet);
        }
        try {
          localStorage.setItem(`our-view-active-media-${this.roomId}`, JSON.stringify(this.activeMedia));
        } catch (e) {
          // ignore
        }
      }

      const prov = this.providers.find((p) => p.id === providerId);
      this.showToast(`Switched server to ${prov ? prov.name : providerId}`);
      this.startBufferingWatchdog();
    },
    openIconSelector() {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-icon-selector", { detail: this.currentUser }));
      }
    },
    streamQueueItem(item) {
      this.activeMedia = {
        mediaType: item.mediaType,
        mediaId: item.mediaId,
        title: item.title,
        providerId: this.activeProviderId,
        season: 1,
        episode: 1,
        timestamp: Date.now(),
      };
      this.activeTab = 0;

      // Broadcast playback to room
      const packet = {
        type: "PLAY_MEDIA",
        roomId: this.roomId,
        sender: this.currentUser,
        payload: this.activeMedia,
      };
      firebaseSync.setActiveMedia(this.activeMedia, this.roomId);

      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(packet);
      }
      try {
        localStorage.setItem(`our-view-active-media-${this.roomId}`, JSON.stringify(this.activeMedia));
        localStorage.setItem("our-view-last-sync-event", JSON.stringify(packet));
      } catch (e) {
        // ignore
      }

      this.showToast(`Started streaming ${item.title} together! 🍿`);
    },
    closePlayer() {
      this.activeMedia = null;
      this.clearBufferingWatchdog();
      firebaseSync.closeActiveMedia(this.roomId);
      try {
        localStorage.removeItem(`our-view-active-media-${this.roomId}`);
      } catch (e) {
        // ignore
      }
      const packet = {
        type: "CLOSE_MEDIA",
        roomId: this.roomId,
        sender: this.currentUser,
      };
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(packet);
      }
      try {
        localStorage.setItem("our-view-last-sync-event", JSON.stringify(packet));
      } catch (e) {
        // ignore
      }
    },
    startBufferingWatchdog() {
      // Manual server switching preferred so playback is never interrupted unexpectedly
      this.clearBufferingWatchdog();
    },
    clearBufferingWatchdog() {
      if (this.bufferingTimer) {
        clearTimeout(this.bufferingTimer);
        this.bufferingTimer = null;
      }
      if (this.bufferingAutoSwitchTimer) {
        clearTimeout(this.bufferingAutoSwitchTimer);
        this.bufferingAutoSwitchTimer = null;
      }
      this.serverBufferingNotice = "";
    },
    dismissBufferingNotice() {
      this.clearBufferingWatchdog();
      this.showToast("Buffering auto-switch dismissed.");
    },
    getNextProvider() {
      const currentIdx = this.providers.findIndex((p) => p.id === this.activeProviderId);
      const nextIdx = (currentIdx + 1) % this.providers.length;
      return this.providers[nextIdx];
    },
    autoSwitchProvider() {
      const nextProvider = this.getNextProvider();
      this.changeServer(nextProvider.id);
    },
    broadcastSyncPing() {
      const packet = {
        type: "SYNC_PING",
        roomId: this.roomId,
        sender: this.currentUser,
      };
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(packet);
      }
      this.showToast("Playback sync requested with partner! ✨");
    },
    posterUrl(item) {
      if (item && item.posterPath) {
        return `https://image.tmdb.org/t/p/w185/${item.posterPath}`;
      }
      return "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=185";
    },
    removeFromQueue(itemId) {
      this.$store.dispatch("removeFromOurView", itemId);
      this.showToast("Removed from Our Queue.");
    },
    submitNewNote(itemId) {
      const text = (this.newNoteInputs[itemId] || "").trim();
      if (!text) {
        this.showToast("Please type a note first! 💬");
        return;
      }
      this.$store.dispatch("addOurViewNote", {
        itemId,
        text,
        user: this.currentUser,
      });
      this.$set(this.newNoteInputs, itemId, "");
      this.showToast(`Note posted as ${this.currentUser}! 💬`);
    },
    deleteNote(itemId, noteId) {
      this.$store.dispatch("removeOurViewNote", { itemId, noteId });
      this.showToast("Note removed.");
    },
    toggleEditNote(itemId) {
      if (this.editingNoteId === itemId) {
        this.saveNote(itemId);
      } else {
        const item = this.ourQueue.find((i) => i.id === itemId);
        this.tempNote = item ? item.note : "";
        this.editingNoteId = itemId;
      }
    },
    saveNote(itemId) {
      this.$store.dispatch("updateOurViewNote", {
        itemId,
        note: this.tempNote,
        addedBy: this.currentUser,
      });
      this.editingNoteId = null;
      this.showToast("Note updated!");
    },
    resetDicePick() {
      this.pickedMovie = null;
      this.diceRolledBy = null;
      this.rollingDice = false;
      this.aiPitch = "";
      firebaseSync.resetDice(this.roomId);
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: "DICE_RESET",
          roomId: this.roomId,
          sender: this.currentUser,
        });
      }
      this.showToast("Vibe cleared — pick a new mood and roll! 🎲");
    },
    async generateAiPitch(movie) {
      if (!movie) return;
      this.loadingAiPitch = true;
      this.aiPitch = "";
      try {
        const pitch = await aiConciergeService.generateDateNightPitch(movie);
        this.aiPitch = pitch;
      } catch (err) {
        console.warn("AI pitch generation error:", err);
      } finally {
        this.loadingAiPitch = false;
      }
    },
    async searchCustomVibe() {
      const query = (this.customVibeText || "").trim();
      if (!query) return;
      this.rollingDice = true;
      this.showCustomVibeDialog = false;
      this.aiPitch = "";
      try {
        const response = await this.$http.get(
          `/search/movie?query=${encodeURIComponent(query)}&page=1`
        );
        const candidates = (response.data?.results || []).filter(
          (m) => m.poster_path && m.overview && m.vote_average >= 6.0
        );
        if (candidates.length) {
          this.pickedMovie = candidates[0];
          this.diceRolledBy = this.currentUser;
          const packet = {
            type: "DICE_ROLLED",
            roomId: this.roomId,
            sender: this.currentUser,
            payload: {
              movie: this.pickedMovie,
              rolledBy: this.currentUser,
            },
          };
          firebaseSync.broadcastDiceRoll(this.pickedMovie, this.currentUser, this.roomId);
          if (this.broadcastChannel) {
            this.broadcastChannel.postMessage(packet);
          }
          this.generateAiPitch(this.pickedMovie);
          this.showToast(`AI found: ${this.pickedMovie.title}! ✨`);
        } else {
          this.showToast("No matches found for that vibe. Try another! 🍿");
        }
      } catch (e) {
        console.error("Custom vibe search failed:", e);
      } finally {
        this.rollingDice = false;
      }
    },
    async rollCouplesDice() {
      this.rollingDice = true;
      this.aiPitch = "";
      try {
        const moodObj = this.moodOptions.find((m) => m.id === this.selectedMood) || this.moodOptions[0];
        const genreId = moodObj.genreIds[Math.floor(Math.random() * moodObj.genreIds.length)];
        const randomPage = Math.floor(Math.random() * 3) + 1;
        const currentYear = new Date().getFullYear();

        // Modern movies only (2015 to current year), high rating & popularity
        const response = await this.$http.get(
          `/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&vote_average.gte=6.8&vote_count.gte=400&primary_release_date.gte=2015-01-01&primary_release_date.lte=${currentYear}-12-31&page=${randomPage}`
        );
        const candidates = (response.data?.results || []).filter((m) => m.poster_path && m.overview);
        if (candidates.length) {
          this.pickedMovie = candidates[Math.floor(Math.random() * candidates.length)];
          this.diceRolledBy = this.currentUser;

          const packet = {
            type: "DICE_ROLLED",
            roomId: this.roomId,
            sender: this.currentUser,
            payload: {
              movie: this.pickedMovie,
              rolledBy: this.currentUser,
            },
          };
          firebaseSync.broadcastDiceRoll(this.pickedMovie, this.currentUser, this.roomId);

          if (this.broadcastChannel) {
            this.broadcastChannel.postMessage(packet);
          }
          try {
            localStorage.setItem("our-view-last-sync-event", JSON.stringify(packet));
          } catch (e) {
            // ignore
          }

          // Generate AI Pitch
          this.generateAiPitch(this.pickedMovie);
        }
      } catch (e) {
        console.error("Dice roll failed:", e);
      } finally {
        setTimeout(() => {
          this.rollingDice = false;
        }, 600);
      }
    },
    acceptDicePick() {
      if (!this.pickedMovie) return;
      this.activeMedia = {
        mediaType: "movie",
        mediaId: this.pickedMovie.id,
        title: this.pickedMovie.title || this.pickedMovie.name,
        providerId: this.activeProviderId,
        timestamp: Date.now(),
      };
      this.activeTab = 0;

      const packet = {
        type: "DICE_ACCEPTED",
        roomId: this.roomId,
        sender: this.currentUser,
        payload: this.activeMedia,
      };

      firebaseSync.voteDiceDecision("accepted", this.currentUser, this.activeMedia, this.roomId);

      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(packet);
      }
      try {
        localStorage.setItem(`our-view-active-media-${this.roomId}`, JSON.stringify(this.activeMedia));
        localStorage.setItem("our-view-last-sync-event", JSON.stringify(packet));
      } catch (e) {
        // ignore
      }

      this.showToast(`✔️ Approved! Streaming ${this.pickedMovie.title || this.pickedMovie.name} together! 🍿`);
    },
    rejectDicePick() {
      this.rollingDice = true;
      this.aiPitch = "";
      this.diceRolledBy = this.currentUser;

      const packet = {
        type: "DICE_REJECTED",
        roomId: this.roomId,
        sender: this.currentUser,
      };

      firebaseSync.voteDiceDecision("rejected", this.currentUser, null, this.roomId);

      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(packet);
      }
      try {
        localStorage.setItem("our-view-last-sync-event", JSON.stringify(packet));
      } catch (e) {
        // ignore
      }

      this.showToast("❌ Rolling the dice again... 🎲");
      this.rollCouplesDice();
    },
    streamPickedMovie() {
      this.acceptDicePick();
    },
    addPickedToOurQueue() {
      if (!this.pickedMovie) return;
      this.$store.dispatch("saveToOurView", {
        mediaType: "movie",
        mediaId: this.pickedMovie.id,
        title: this.pickedMovie.title,
        posterPath: this.pickedMovie.poster_path,
        backdropPath: this.pickedMovie.backdrop_path,
        voteAverage: this.pickedMovie.vote_average,
        note: `Dice Pick (${this.selectedMood})`,
        addedBy: this.currentUser,
      });
      this.showToast(`Added ${this.pickedMovie.title} to Our Queue`);
    },
    openPlanDialog() {
      if (this.nextDateNight) {
        this.planForm.title = this.nextDateNight.title || "Movie Date Night 🥂";
        this.planForm.datetime = this.nextDateNight.datetime || "";
        this.planForm.selectedMovieId = this.nextDateNight.selectedMovieId || null;
      }
      this.showPlanDialog = true;
    },
    saveDateNightPlan() {
      if (!this.planForm.datetime) return;
      const movieItem = this.ourQueue.find((i) => i.id === this.planForm.selectedMovieId);
      this.$store.dispatch("setNextDateNight", {
        title: this.planForm.title,
        datetime: this.planForm.datetime,
        selectedMovieId: this.planForm.selectedMovieId,
        movieTitle: movieItem ? movieItem.title : null,
      });
      this.showPlanDialog = false;
      this.updateCountdown();
      this.showToast("Date Night scheduled! 🥂");
    },
    cancelScheduledDate() {
      this.$store.dispatch("clearNextDateNight");
      this.countdownText = "";
      this.showToast("Date Night cancelled.");
    },
    updateCountdown() {
      if (!this.nextDateNight || !this.nextDateNight.datetime) {
        this.countdownText = "";
        return;
      }
      const target = new Date(this.nextDateNight.datetime).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        this.countdownText = "It's Date Night Time! 🥂🍿";
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        this.countdownText = `in ${days}d ${hours}h`;
      } else if (hours > 0) {
        this.countdownText = `in ${hours}h ${minutes}m`;
      } else {
        this.countdownText = `in ${minutes}m`;
      }
    },
    startCountdownTimer() {
      this.countdownInterval = setInterval(() => {
        this.updateCountdown();
      }, 30000);
    },
    showToast(text) {
      this.snackbarText = text;
      this.snackbar = true;
    },
  },
};
</script>

<style scoped>
.our-view-page {
  max-width: 1440px;
  margin: 0 auto;
}

/* Hero Section */
.our-view-hero {
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.22) 0%, rgba(13, 20, 38, 0.85) 60%, rgba(5, 7, 15, 0.95) 100%);
  border: 1px solid rgba(255, 64, 129, 0.25);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45), 0 0 35px rgba(233, 30, 99, 0.15);
  backdrop-filter: blur(16px);
}

.couples-pill {
  border-radius: 999px;
  background: rgba(255, 64, 129, 0.18);
  border: 1px solid rgba(255, 64, 129, 0.4);
  color: #FF80AB;
  letter-spacing: 0.08em;
}

.room-pill {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.heart-pulse {
  display: inline-block;
  animation: pulse 1.8s infinite ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.plan-date-btn {
  box-shadow: 0 8px 24px rgba(255, 64, 129, 0.35);
}

.scheduled-date-chip {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 64, 129, 0.3);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

/* Tabs */
.our-view-tabs {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.tab-item {
  letter-spacing: 0.02em;
  font-size: 0.95rem;
}

/* Room Bar */
.room-control-bar {
  background: rgba(14, 20, 36, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.room-input-field {
  max-width: 140px;
}

.user-toggle {
  background: rgba(255, 255, 255, 0.08) !important;
  border-radius: 999px !important;
}

.timi-toggle-btn.v-btn--active {
  background: rgba(255, 64, 129, 0.35) !important;
  color: #ffffff !important;
}

.ejay-toggle-btn.v-btn--active {
  background: rgba(0, 229, 255, 0.35) !important;
  color: #ffffff !important;
}

/* Player Area */
.player-wrapper {
  background: #080b14;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
}

.player-header {
  background: rgba(10, 14, 25, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.iframe-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
  background: #000;
}

.stream-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.player-footer {
  background: rgba(10, 14, 25, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.server-toggle {
  background: rgba(255, 255, 255, 0.06) !important;
  border-radius: 8px !important;
}

.server-toggle .v-btn--active {
  background: #FF4081 !important;
  color: #fff !important;
}

.empty-player-hero {
  background: rgba(15, 20, 36, 0.6);
  border: 2px dashed rgba(255, 64, 129, 0.3);
  border-radius: 20px;
}

/* Floating Emoji Reactions */
.floating-emojis-container {
  position: fixed;
  bottom: 60px;
  left: 0;
  width: 100vw;
  height: 90vh;
  pointer-events: none;
  overflow: hidden;
  z-index: 9999;
}

.floating-emoji {
  position: absolute;
  bottom: 0;
  font-size: 2.5rem;
  animation: floatUp ease-out forwards;
  opacity: 0.9;
}

@keyframes floatUp {
  0% {
    transform: translateY(0) scale(0.6);
    opacity: 0;
  }
  15% {
    opacity: 1;
    transform: translateY(-80px) scale(1.2);
  }
  80% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-80vh) scale(1);
    opacity: 0;
  }
}

.reactions-card {
  background: rgba(15, 20, 36, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.reaction-btn {
  transition: transform 0.15s ease;
}

.reaction-btn:hover {
  transform: scale(1.25);
}

.emoji-icon {
  font-size: 1.25rem;
}

/* Live Chat Card */
.live-chat-card {
  height: 580px;
  background: rgba(10, 14, 25, 0.85) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  backdrop-filter: blur(14px);
}

.chat-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.chat-log {
  overflow-y: auto;
  scroll-behavior: smooth;
}

.chat-bubble-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.chat-bubble-row--self {
  align-items: flex-end;
}

.chat-bubble {
  max-width: 85%;
  border-radius: 16px;
  font-size: 0.9rem;
  word-break: break-word;
}

.bubble-timi {
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.85), rgba(255, 64, 129, 0.7));
  color: #ffffff;
  border-bottom-left-radius: 4px;
}

.bubble-ejay {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.85), rgba(0, 229, 255, 0.7));
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.chat-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* Our Queue */
.queue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}

.queue-item-card {
  background: rgba(12, 17, 30, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 18px;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.queue-item-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 64, 129, 0.4);
}

.poster-container {
  position: relative;
  flex-shrink: 0;
}

.poster-overlay-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
  border-radius: 6px;
}

.imdb-mini-badge {
  background: #f5c518;
  color: #000;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 4px;
}

.note-box {
  background: rgba(255, 255, 255, 0.04);
  border: 1px dashed rgba(255, 255, 255, 0.12);
}

/* Couples Dice */
.dice-result-card {
  background: rgba(14, 19, 34, 0.9);
  border: 1px solid rgba(255, 64, 129, 0.35);
  border-radius: 20px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5), 0 0 25px rgba(255, 64, 129, 0.2);
}

.dice-overview {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.roll-dice-btn {
  box-shadow: 0 8px 24px rgba(255, 64, 129, 0.4);
}

.plan-dialog-card {
  background: #0d1222 !important;
  border-radius: 20px !important;
  border: 1px solid rgba(255, 64, 129, 0.3) !important;
}

.server-buffering-banner {
  background: rgba(0, 30, 60, 0.95);
  border-bottom: 1px solid rgba(0, 229, 255, 0.3);
}

.mood-chips-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  row-gap: 14px;
  max-width: 580px;
  margin: 0 auto;
}

.mood-chip {
  margin: 5px 6px !important;
}

.destiny-pick-poster {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.line-height-tight {
  line-height: 1.35;
}

.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 20px; }

.max-w-500 {
  max-width: 500px;
}

.max-w-600 {
  max-width: 600px;
}

.max-w-700 {
  max-width: 700px;
}

.cursor-pointer {
  cursor: pointer;
}

/* Couple Notes Bubbles in Queue */
.couple-notes-thread {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 8px 10px;
}

.notes-bubbles-list {
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
}

.note-bubble {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  transition: all 0.2s ease;
}

.note-bubble-me {
  border-bottom-right-radius: 2px !important;
}

.note-bubble-partner {
  border-bottom-left-radius: 2px !important;
}

.add-note-input-row .v-input__control {
  min-height: 32px !important;
}

/* AI Pitch Box */
.ai-pitch-box {
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(13, 20, 38, 0.7) 100%);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-left: 3px solid #00E5FF;
}

/* Couples Game Night */
.couples-scoreboard-card {
  background: radial-gradient(circle at center, rgba(30, 20, 50, 0.75) 0%, rgba(10, 14, 25, 0.9) 100%);
  border: 1px solid rgba(255, 215, 0, 0.35);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}
</style>
