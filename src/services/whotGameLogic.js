/**
 * Official Standard WHOT! Game Engine (Couples 2-Player Edition)
 * Complete with authentic Nigerian/UK Whot card numbers, suits, and special rules.
 */

export const WHOT_SUITS = {
  CIRCLE: "circle",
  TRIANGLE: "triangle",
  CROSS: "cross",
  SQUARE: "square",
  STAR: "star",
  WHOT: "whot",
};

export const SUIT_META = {
  circle: { label: "Circle", symbol: "⭕", color: "#FF4081" },
  triangle: { label: "Triangle", symbol: "🔺", color: "#FFEB3B" },
  cross: { label: "Cross", symbol: "✝️", color: "#00E5FF" },
  square: { label: "Square", symbol: "⏹️", color: "#76FF03" },
  star: { label: "Star", symbol: "⭐", color: "#FF9100" },
  whot: { label: "WHOT!", symbol: "🃏", color: "#E040FB" },
};

/**
 * Generates the authentic 54-card Whot deck
 */
export function createWhotDeck() {
  const deck = [];
  let cardId = 1;

  // Circles: 1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14 (12 cards)
  const circleNumbers = [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14];
  circleNumbers.forEach((num) => {
    deck.push({ id: `c_${cardId++}`, suit: WHOT_SUITS.CIRCLE, number: num });
  });

  // Triangles: 1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14 (12 cards)
  const triangleNumbers = [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14];
  triangleNumbers.forEach((num) => {
    deck.push({ id: `c_${cardId++}`, suit: WHOT_SUITS.TRIANGLE, number: num });
  });

  // Crosses: 1, 2, 3, 5, 7, 10, 11, 13, 14 (9 cards)
  const crossNumbers = [1, 2, 3, 5, 7, 10, 11, 13, 14];
  crossNumbers.forEach((num) => {
    deck.push({ id: `c_${cardId++}`, suit: WHOT_SUITS.CROSS, number: num });
  });

  // Squares: 1, 2, 3, 5, 7, 10, 11, 13, 14 (9 cards)
  const squareNumbers = [1, 2, 3, 5, 7, 10, 11, 13, 14];
  squareNumbers.forEach((num) => {
    deck.push({ id: `c_${cardId++}`, suit: WHOT_SUITS.SQUARE, number: num });
  });

  // Stars: 1, 2, 3, 4, 5, 7, 8 (7 cards)
  const starNumbers = [1, 2, 3, 4, 5, 7, 8];
  starNumbers.forEach((num) => {
    deck.push({ id: `c_${cardId++}`, suit: WHOT_SUITS.STAR, number: num });
  });

  // Whot 20 (5 Wild Cards)
  for (let i = 0; i < 5; i++) {
    deck.push({ id: `c_${cardId++}`, suit: WHOT_SUITS.WHOT, number: 20 });
  }

  return deck;
}

/**
 * Fisher-Yates array shuffle
 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Initializes a new 2-player game state for Timi and Ejay
 */
export function initWhotGame(startingPlayer = "Timi") {
  const shuffledDeck = shuffle(createWhotDeck());

  // Deal 5 cards each
  const timiHand = shuffledDeck.splice(0, 5);
  const ejayHand = shuffledDeck.splice(0, 5);

  // Pick top card that is NOT a special card (to prevent opening on a penalty)
  let topCardIndex = shuffledDeck.findIndex((c) => ![1, 2, 5, 8, 14, 20].includes(c.number));
  if (topCardIndex === -1) topCardIndex = 0;
  const topCard = shuffledDeck.splice(topCardIndex, 1)[0];

  return {
    status: "playing", // 'playing' | 'game_over'
    market: shuffledDeck,
    discard: [topCard],
    topCard,
    calledSuit: null, // set when card 20 is played
    timiHand,
    ejayHand,
    currentTurn: startingPlayer, // 'Timi' | 'Ejay'
    pendingPenalty: 0, // pick-two or pick-three stack
    lastActionMessage: `Game started! First card is ${topCard.number} of ${SUIT_META[topCard.suit]?.label || topCard.suit}.`,
    winner: null,
    history: [],
    updatedAt: Date.now(),
  };
}

/**
 * Validates whether a card can be legally played on the active top card
 */
export function canPlayCard(card, topCard, calledSuit = null) {
  if (!card || !topCard) return false;

  // Card 20 (WHOT!) can always be played on anything
  if (card.number === 20 || card.suit === WHOT_SUITS.WHOT) {
    return true;
  }

  // If a 20 was previously played and a suit was called:
  if (calledSuit) {
    return card.suit === calledSuit;
  }

  // Normal rule: Match either number OR suit
  return card.number === topCard.number || card.suit === topCard.suit;
}

/**
 * Executes a card play and updates game state with Whot special rules
 */
export function playCard(state, player, card, chosenSuitFor20 = null) {
  if (state.status === "game_over") return state;
  if (state.currentTurn !== player) return state;

  const handKey = player === "Timi" ? "timiHand" : "ejayHand";
  const opponent = player === "Timi" ? "Ejay" : "Timi";
  const opponentHandKey = opponent === "Timi" ? "timiHand" : "ejayHand";

  // Validate ownership
  const cardIndex = state[handKey].findIndex((c) => c.id === card.id);
  if (cardIndex === -1) return state;

  // Validate move legality
  if (!canPlayCard(card, state.topCard, state.calledSuit)) {
    return state;
  }

  // Clone state
  const nextState = JSON.parse(JSON.stringify(state));
  const playedCard = nextState[handKey].splice(cardIndex, 1)[0];
  nextState.discard.push(playedCard);
  nextState.topCard = playedCard;
  nextState.calledSuit = null; // reset called suit

  // Check victory condition
  if (nextState[handKey].length === 0) {
    nextState.status = "game_over";
    nextState.winner = player;
    nextState.lastActionMessage = `🎉 CHECK! ${player} played their last card and WON the game! 🏆`;
    nextState.updatedAt = Date.now();
    return nextState;
  }

  // Handle Last Card warning message
  let actionMessage = `${player} played ${playedCard.number} of ${SUIT_META[playedCard.suit]?.label || playedCard.suit}.`;
  if (nextState[handKey].length === 1) {
    actionMessage += ` ⚠️ LAST CARD for ${player}!`;
  }

  // Handle Special Rules
  const num = playedCard.number;

  // Rule 1: Hold On (play again)
  if (num === 1) {
    nextState.currentTurn = player; // stays same player
    nextState.lastActionMessage = `${actionMessage} (Hold On! ${player} plays again ⏳)`;
  }
  // Rule 8: Suspension (opponent skipped)
  else if (num === 8) {
    nextState.currentTurn = player; // in 2-player, opponent skipped = player plays again
    nextState.lastActionMessage = `${actionMessage} (${opponent} suspended! ${player} plays again 🛑)`;
  }
  // Rule 2: Pick Two (opponent draws 2)
  else if (num === 2) {
    const drawCount = 2;
    drawCardsFromMarket(nextState, opponentHandKey, drawCount);
    nextState.currentTurn = opponent;
    nextState.lastActionMessage = `${actionMessage} (${opponent} picks 2 from Market! 📦)`;
  }
  // Rule 5: Pick Three (opponent draws 3)
  else if (num === 5) {
    const drawCount = 3;
    drawCardsFromMarket(nextState, opponentHandKey, drawCount);
    nextState.currentTurn = opponent;
    nextState.lastActionMessage = `${actionMessage} (${opponent} picks 3 from Market! 📦📦)`;
  }
  // Rule 14: General Market (opponent draws 1)
  else if (num === 14) {
    drawCardsFromMarket(nextState, opponentHandKey, 1);
    nextState.currentTurn = opponent;
    nextState.lastActionMessage = `${actionMessage} (General Market! ${opponent} draws 1 🛒)`;
  }
  // Rule 20: WHOT! Wild card (player calls shape)
  else if (num === 20) {
    const requestedSuit = chosenSuitFor20 || WHOT_SUITS.CIRCLE;
    nextState.calledSuit = requestedSuit;
    nextState.currentTurn = opponent;
    const suitName = SUIT_META[requestedSuit]?.label || requestedSuit;
    nextState.lastActionMessage = `${player} played WHOT 20! Called for ${suitName} ${SUIT_META[requestedSuit]?.symbol} ✨`;
  }
  // Standard card
  else {
    nextState.currentTurn = opponent;
    nextState.lastActionMessage = actionMessage;
  }

  nextState.updatedAt = Date.now();
  return nextState;
}

/**
 * Draws 1 card from Market pile for active player
 */
export function drawMarketCard(state, player) {
  if (state.status === "game_over") return state;
  if (state.currentTurn !== player) return state;

  const nextState = JSON.parse(JSON.stringify(state));
  const handKey = player === "Timi" ? "timiHand" : "ejayHand";
  const opponent = player === "Timi" ? "Ejay" : "Timi";

  const drawn = drawCardsFromMarket(nextState, handKey, 1);
  if (drawn > 0) {
    // If calledSuit was active and player drew from market, calledSuit is fulfilled/cleared
    nextState.calledSuit = null;
    nextState.currentTurn = opponent;
    nextState.lastActionMessage = `${player} went to the Market and drew 1 card 🛒`;
  }

  nextState.updatedAt = Date.now();
  return nextState;
}

/**
 * Internal helper to draw N cards from market into a player's hand.
 * Automatically reshuffles discard pile if market runs dry!
 */
function drawCardsFromMarket(state, targetHandKey, count) {
  let drawn = 0;
  for (let i = 0; i < count; i++) {
    if (state.market.length === 0) {
      // Reshuffle discard into market (keep topCard)
      if (state.discard.length > 1) {
        const top = state.discard.pop();
        state.market = shuffle(state.discard);
        state.discard = [top];
      }
    }
    if (state.market.length > 0) {
      state[targetHandKey].push(state.market.pop());
      drawn++;
    }
  }
  return drawn;
}

export default {
  WHOT_SUITS,
  SUIT_META,
  createWhotDeck,
  shuffle,
  initWhotGame,
  canPlayCard,
  playCard,
  drawMarketCard,
};
