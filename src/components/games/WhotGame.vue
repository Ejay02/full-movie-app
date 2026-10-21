<template>
  <div class="whot-game-container pa-3 pa-sm-6">
    <!-- Header: Game Title & Live Turn Indicator -->
    <div class="whot-header d-flex align-center justify-space-between flex-wrap gap-2 mb-4">
      <div class="d-flex align-center">
        <v-icon color="#E040FB" class="mr-2">mdi-cards-playing-outline</v-icon>
        <h3 class="white--text text-h6 font-weight-black mb-0">WHOT! 🃏 Card Duel</h3>
      </div>
      <div class="d-flex align-center gap-2">
        <!-- Turn Indicator Badge -->
        <v-chip
          v-if="gameState && gameState.status === 'playing'"
          small
          :color="isMyTurn ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 64, 129, 0.2)'"
          :class="isMyTurn ? 'green--text text--accent-3' : 'rose--text'"
          class="font-weight-black px-3"
        >
          <v-icon left x-small :color="isMyTurn ? '#00E676' : '#FF4081'">
            {{ isMyTurn ? 'mdi-account-star' : 'mdi-clock-outline' }}
          </v-icon>
          {{ isMyTurn ? 'Your Turn to Play!' : `${opponentName}'s Turn...` }}
        </v-chip>

        <v-btn
          x-small
          outlined
          color="#E040FB"
          class="text-none font-weight-bold"
          @click="resetGame"
        >
          <v-icon x-small left>mdi-restart</v-icon>
          New Game
        </v-btn>
      </div>
    </div>

    <!-- Active Game Board -->
    <div v-if="gameState && gameState.status === 'playing'" class="whot-board pa-4 rounded-xl">
      <!-- 1. OPPONENT HAND (Top) -->
      <div class="opponent-hand-section text-center mb-4">
        <div class="d-flex align-center justify-center gap-2 mb-2">
          <span
            class="text-caption font-weight-bold"
            :style="{ color: opponentName === 'Timi' ? '#FF80AB' : '#80D8FF' }"
          >
            <v-icon x-small :color="opponentName === 'Timi' ? '#E040FB' : '#00E5FF'" class="mr-1">
              {{ getUserIcon(opponentName) }}
            </v-icon>
            {{ opponentName }}'s Hand
          </span>
          <v-chip x-small color="rgba(255, 255, 255, 0.1)" class="white--text font-weight-bold">
            {{ opponentHand.length }} cards
          </v-chip>
        </div>

        <!-- Face-down cards fan -->
        <div class="opponent-cards-fan d-flex justify-center align-center">
          <div
            v-for="(card, i) in opponentHand"
            :key="card.id || i"
            class="whot-card-back mx-n2"
            :style="{ transform: `rotate(${(i - opponentHand.length / 2) * 3}deg)` }"
          >
            <div class="card-back-pattern">WHOT</div>
          </div>
        </div>
      </div>

      <!-- 2. CENTER TABLE: Market (Draw Pile) & Discard (Active Card) -->
      <div class="center-table-section d-flex align-center justify-center gap-6 my-6">
        <!-- Market / Draw Pile -->
        <div class="market-pile-container text-center" @click="handleDrawMarket">
          <div class="market-pile cursor-pointer" :class="{ 'market-active': isMyTurn }">
            <div class="market-stack-effect">
              <div class="whot-card-back main-market-card">
                <span class="market-logo">MARKET</span>
                <span class="market-count caption font-weight-bold">{{ gameState.market.length }}</span>
              </div>
            </div>
          </div>
          <span class="market-draw-hint text-caption mt-1 d-block" :class="isMyTurn ? 'cyan--text font-weight-bold' : 'grey--text'">
            {{ isMyTurn ? 'Tap to Draw 🛒' : 'Market Pile' }}
          </span>
        </div>

        <!-- Discard Pile (Top Active Card) -->
        <div class="discard-pile-container text-center">
          <div
            v-if="gameState.topCard"
            class="whot-card whot-card-active pa-2 text-center"
            :style="{
              borderColor: getSuitColor(gameState.topCard.suit),
              boxShadow: `0 0 20px ${getSuitColor(gameState.topCard.suit)}40`,
            }"
          >
            <div class="d-flex justify-space-between align-center px-1">
              <span class="card-corner-num font-weight-black" :style="{ color: getSuitColor(gameState.topCard.suit) }">
                {{ gameState.topCard.number }}
              </span>
              <span class="card-corner-shape">{{ getSuitSymbol(gameState.topCard.suit) }}</span>
            </div>

            <div class="card-center-symbol my-1">
              <span class="shape-symbol-large">{{ getSuitSymbol(gameState.topCard.suit) }}</span>
              <div v-if="gameState.topCard.number === 20" class="wild-banner font-weight-black">
                WHOT!
              </div>
            </div>

            <div class="d-flex justify-space-between align-center px-1 rotate-180">
              <span class="card-corner-num font-weight-black" :style="{ color: getSuitColor(gameState.topCard.suit) }">
                {{ gameState.topCard.number }}
              </span>
              <span class="card-corner-shape">{{ getSuitSymbol(gameState.topCard.suit) }}</span>
            </div>
          </div>
          <span class="text-caption grey--text mt-1 d-block font-weight-medium">
            Active Card
          </span>
        </div>
      </div>

      <!-- Called Suit Banner (when 20 was played) -->
      <transition name="fade">
        <div
          v-if="gameState.calledSuit"
          class="called-suit-banner text-center py-2 px-4 rounded-pill max-w-400 mx-auto mb-4"
          :style="{
            background: `${getSuitColor(gameState.calledSuit)}20`,
            border: `1px solid ${getSuitColor(gameState.calledSuit)}`,
          }"
        >
          <span class="caption font-weight-black white--text">
            CALLED SHAPE:
            <strong :style="{ color: getSuitColor(gameState.calledSuit) }" class="ml-1">
              {{ getSuitLabel(gameState.calledSuit) }} {{ getSuitSymbol(gameState.calledSuit) }}
            </strong>
          </span>
        </div>
      </transition>

      <!-- Action Announcement Ticker -->
      <div class="action-ticker text-center mb-6">
        <span class="action-message-text text-body-2 font-weight-medium grey--text text--lighten-2">
          {{ gameState.lastActionMessage }}
        </span>
      </div>

      <!-- 3. PLAYER'S HAND (Bottom) -->
      <div class="player-hand-section text-center pt-2">
        <div class="d-flex align-center justify-center gap-2 mb-3">
          <span
            class="text-caption font-weight-bold"
            :style="{ color: currentUser === 'Timi' ? '#FF80AB' : '#80D8FF' }"
          >
            <v-icon x-small :color="currentUser === 'Timi' ? '#E040FB' : '#00E5FF'" class="mr-1">
              {{ getUserIcon(currentUser) }}
            </v-icon>
            Your Hand ({{ currentUser }})
          </span>
          <v-chip x-small color="rgba(255, 255, 255, 0.15)" class="white--text font-weight-bold">
            {{ myHand.length }} cards
          </v-chip>
        </div>

        <!-- Hand Cards List -->
        <div class="player-cards-row d-flex justify-center align-center flex-wrap gap-2">
          <div
            v-for="card in myHand"
            :key="card.id"
            class="whot-card cursor-pointer pa-2 text-center"
            :class="{
              'whot-card-playable': isMyTurn && isCardPlayable(card),
              'whot-card-disabled': isMyTurn && !isCardPlayable(card),
            }"
            :style="{
              borderColor: getSuitColor(card.suit),
            }"
            @click="handleCardClick(card)"
          >
            <div class="d-flex justify-space-between align-center px-1">
              <span class="card-corner-num font-weight-black" :style="{ color: getSuitColor(card.suit) }">
                {{ card.number }}
              </span>
              <span class="card-corner-shape">{{ getSuitSymbol(card.suit) }}</span>
            </div>

            <div class="card-center-symbol my-1">
              <span class="shape-symbol-large">{{ getSuitSymbol(card.suit) }}</span>
              <div v-if="card.number === 20" class="wild-banner font-weight-black">
                WHOT!
              </div>
            </div>

            <div class="d-flex justify-space-between align-center px-1 rotate-180">
              <span class="card-corner-num font-weight-black" :style="{ color: getSuitColor(card.suit) }">
                {{ card.number }}
              </span>
              <span class="card-corner-shape">{{ getSuitSymbol(card.suit) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State / Match Start -->
    <div v-else-if="!gameState || gameState.status === 'game_over'" class="empty-whot-card pa-8 text-center rounded-xl">
      <div v-if="gameState && gameState.winner" class="mb-4">
        <v-icon size="64" color="#FFD700" class="mb-2">mdi-trophy</v-icon>
        <h2 class="white--text text-h5 font-weight-black mb-1">
          🎉 {{ gameState.winner }} WON! 🏆
        </h2>
        <p class="grey--text text-body-2 mb-4">
          {{ gameState.lastActionMessage }}
        </p>
      </div>
      <div v-else>
        <v-icon size="64" color="#E040FB" class="mb-2">mdi-cards</v-icon>
        <h2 class="white--text text-h5 font-weight-black mb-2">Ready for WHOT!? 🃏</h2>
        <p class="grey--text text-body-2 mb-6 max-w-500 mx-auto">
          Play the authentic Nigerian classic card game live together! First one to finish their hand wins.
        </p>
      </div>

      <v-btn
        large
        rounded
        depressed
        color="#E040FB"
        dark
        class="text-none font-weight-black px-8"
        @click="startNewMatch"
      >
        <v-icon left>mdi-play</v-icon>
        {{ gameState && gameState.winner ? 'Play Again 🃏' : 'Deal & Start Match 🃏' }}
      </v-btn>
    </div>

    <!-- Shape Picker Dialog (When Card 20 WHOT is played) -->
    <v-dialog v-model="showShapePickerDialog" max-width="400" persistent>
      <v-card class="shape-dialog-card pa-6 text-center" dark>
        <v-icon size="48" color="#E040FB" class="mb-2">mdi-cards-playing-spade-multiple</v-icon>
        <h3 class="white--text text-h6 font-weight-black mb-1">WHOT 20!</h3>
        <p class="grey--text text-caption mb-4">
          Choose which shape your partner must play next:
        </p>

        <div class="d-flex justify-center align-center flex-wrap gap-3">
          <v-btn
            v-for="(meta, suitKey) in selectableSuits"
            :key="suitKey"
            rounded
            depressed
            class="text-none font-weight-bold px-4"
            :style="{ background: `${meta.color}25`, border: `1px solid ${meta.color}`, color: meta.color }"
            @click="submitCalledSuit(suitKey)"
          >
            <span class="mr-1">{{ meta.symbol }}</span>
            {{ meta.label }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import whotGameLogic, { SUIT_META, WHOT_SUITS } from "@/services/whotGameLogic";
import firebaseSync from "@/services/firebaseSync";

export default {
  name: "WhotGame",
  props: {
    currentUser: {
      type: String,
      default: "Timi",
    },
    roomId: {
      type: String,
      default: "date-night",
    },
  },
  data() {
    return {
      gameState: null,
      firebaseUnsub: null,
      broadcastChannel: null,
      showShapePickerDialog: false,
      pendingCard20: null,
    };
  },
  computed: {
    opponentName() {
      return this.currentUser === "Timi" ? "Ejay" : "Timi";
    },
    isMyTurn() {
      return this.gameState && this.gameState.currentTurn === this.currentUser;
    },
    myHand() {
      if (!this.gameState) return [];
      return this.currentUser === "Timi" ? this.gameState.timiHand || [] : this.gameState.ejayHand || [];
    },
    opponentHand() {
      if (!this.gameState) return [];
      return this.opponentName === "Timi" ? this.gameState.timiHand || [] : this.gameState.ejayHand || [];
    },
    selectableSuits() {
      return {
        circle: SUIT_META.circle,
        triangle: SUIT_META.triangle,
        cross: SUIT_META.cross,
        square: SUIT_META.square,
        star: SUIT_META.star,
      };
    },
    timiIcon() {
      return localStorage.getItem("timi_user_icon") || "mdi-crown";
    },
    ejayIcon() {
      return localStorage.getItem("ejay_user_icon") || "mdi-lightning-bolt";
    },
  },
  created() {
    this.startNewMatch();
    this.initSync();
  },
  beforeDestroy() {
    if (typeof this.firebaseUnsub === "function") {
      this.firebaseUnsub();
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
  },
  methods: {
    getUserIcon(name) {
      return name === "Timi" ? this.timiIcon : this.ejayIcon;
    },
    initSync() {
      // 1. Firebase Cloud Sync
      this.firebaseUnsub = firebaseSync.subscribeToWhot((remoteState) => {
        if (remoteState) {
          this.gameState = remoteState;
        }
      }, this.roomId);

      // 2. BroadcastChannel for local cross-tab sync
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        try {
          this.broadcastChannel = new BroadcastChannel("whot-game-sync");
          this.broadcastChannel.onmessage = (event) => {
            if (event.data && event.data.roomId === this.roomId) {
              this.gameState = event.data.state;
            }
          };
        } catch (e) {
          // ignore
        }
      }
    },
    syncState(nextState) {
      this.gameState = nextState;
      firebaseSync.updateWhotState(nextState, this.roomId);
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          roomId: this.roomId,
          state: nextState,
        });
      }
      if (nextState.status === "game_over" && nextState.winner) {
        firebaseSync.recordGameWin(nextState.winner, "whot", this.roomId);
      }
    },
    startNewMatch() {
      const newState = whotGameLogic.initWhotGame(this.currentUser);
      this.syncState(newState);
    },
    resetGame() {
      this.startNewMatch();
    },
    isCardPlayable(card) {
      if (!this.gameState || !this.gameState.topCard) return false;
      return whotGameLogic.canPlayCard(card, this.gameState.topCard, this.gameState.calledSuit);
    },
    handleCardClick(card) {
      if (!this.isMyTurn) return;
      if (!this.isCardPlayable(card)) return;

      // If card is WHOT 20, prompt for shape choice
      if (card.number === 20 || card.suit === WHOT_SUITS.WHOT) {
        this.pendingCard20 = card;
        this.showShapePickerDialog = true;
        return;
      }

      // Normal card play
      const nextState = whotGameLogic.playCard(this.gameState, this.currentUser, card);
      this.syncState(nextState);
    },
    submitCalledSuit(suitKey) {
      if (!this.pendingCard20) return;
      this.showShapePickerDialog = false;
      const nextState = whotGameLogic.playCard(this.gameState, this.currentUser, this.pendingCard20, suitKey);
      this.pendingCard20 = null;
      this.syncState(nextState);
    },
    handleDrawMarket() {
      if (!this.isMyTurn) return;
      const nextState = whotGameLogic.drawMarketCard(this.gameState, this.currentUser);
      this.syncState(nextState);
    },
    getSuitColor(suit) {
      return SUIT_META[suit]?.color || "#ffffff";
    },
    getSuitSymbol(suit) {
      return SUIT_META[suit]?.symbol || "🃏";
    },
    getSuitLabel(suit) {
      return SUIT_META[suit]?.label || suit;
    },
  },
};
</script>

<style scoped>
.whot-game-container {
  max-width: 900px;
  margin: 0 auto;
}

.whot-board {
  background: radial-gradient(circle at center, rgba(30, 20, 50, 0.8) 0%, rgba(10, 14, 25, 0.95) 100%);
  border: 1px solid rgba(224, 64, 251, 0.25);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
}

.empty-whot-card {
  background: rgba(14, 19, 34, 0.85);
  border: 1px dashed rgba(224, 64, 251, 0.3);
}

/* Card Styling */
.whot-card {
  width: 78px;
  height: 114px;
  border-radius: 10px;
  background: #ffffff;
  color: #1a1a1a;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 2px solid #ccc;
  user-select: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
}

.whot-card-active {
  width: 96px;
  height: 140px;
  background: #ffffff;
}

.whot-card-playable:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 10px 20px rgba(224, 64, 251, 0.5) !important;
  z-index: 10;
}

.whot-card-disabled {
  opacity: 0.45;
  filter: grayscale(0.5);
  cursor: not-allowed;
}

.card-corner-num {
  font-size: 1rem;
  line-height: 1;
}

.card-corner-shape {
  font-size: 0.85rem;
}

.shape-symbol-large {
  font-size: 1.8rem;
  line-height: 1;
}

.wild-banner {
  font-size: 0.65rem;
  background: #E040FB;
  color: #fff;
  border-radius: 4px;
  padding: 1px 4px;
}

.rotate-180 {
  transform: rotate(180deg);
}

/* Card Back */
.whot-card-back {
  width: 70px;
  height: 100px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4a148c 0%, #1a0033 100%);
  border: 2px solid rgba(224, 64, 251, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: transform 0.2s ease;
}

.card-back-pattern {
  font-size: 0.7rem;
  font-weight: 900;
  color: rgba(224, 64, 251, 0.7);
  letter-spacing: 2px;
  border: 1px dashed rgba(224, 64, 251, 0.5);
  padding: 4px 8px;
  border-radius: 4px;
}

/* Market Draw Pile */
.market-pile-container {
  user-select: none;
}

.main-market-card {
  width: 96px;
  height: 140px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px solid #E040FB;
  box-shadow: 0 8px 24px rgba(224, 64, 251, 0.3);
}

.market-logo {
  font-weight: 900;
  font-size: 0.85rem;
  color: #E040FB;
  letter-spacing: 2px;
}

.market-count {
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  margin-top: 6px;
}

.market-active:hover .main-market-card {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 12px 28px rgba(0, 229, 255, 0.5);
  border-color: #00E5FF;
}

.cursor-pointer {
  cursor: pointer;
}

.max-w-400 {
  max-width: 400px;
}

.max-w-500 {
  max-width: 500px;
}

.shape-dialog-card {
  background: #120e24 !important;
  border-radius: 20px !important;
  border: 1px solid rgba(224, 64, 251, 0.4) !important;
}
</style>
