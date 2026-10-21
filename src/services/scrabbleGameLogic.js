/**
 * scrabbleGameLogic.js
 * Complete Words with Friends / Scrabble engine for Timi & Ejay Couples Game Night.
 */

export const LETTER_SCORES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1,
  J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1,
  S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};

// Standard bag distribution (condensed for 9x9 couple board: 75 total tiles)
export const TILE_BAG_DISTRIBUTION = {
  A: 6, B: 2, C: 2, D: 3, E: 8, F: 2, G: 2, H: 2, I: 6,
  J: 1, K: 1, L: 3, M: 2, N: 4, O: 5, P: 2, Q: 1, R: 4,
  S: 4, T: 4, U: 3, V: 2, W: 2, X: 1, Y: 2, Z: 1,
};

// 9x9 Board Multipliers
// None, DL (Double Letter), TL (Triple Letter), DW (Double Word), TW (Triple Word), ST (Center Star)
export const BOARD_SIZE = 9;
export const CENTER_ROW = 4;
export const CENTER_COL = 4;

export const BOARD_MULTIPLIERS = [
  ["TW", "",   "",   "DL", "",   "DL", "",   "",   "TW"],
  ["",   "DW", "",   "",   "TL", "",   "",   "DW", ""  ],
  ["",   "",   "DL", "",   "",   "",   "DL", "",   ""  ],
  ["DL", "",   "",   "DL", "",   "DL", "",   "",   "DL"],
  ["",   "TL", "",   "",   "ST", "",   "",   "TL", ""  ],
  ["DL", "",   "",   "DL", "",   "DL", "",   "",   "DL"],
  ["",   "",   "DL", "",   "",   "",   "DL", "",   ""  ],
  ["",   "DW", "",   "",   "TL", "",   "",   "DW", ""  ],
  ["TW", "",   "",   "DL", "",   "DL", "",   "",   "TW"],
];

// Dictionary of valid 2-to-9 letter English & romantic/casual words
const COMMON_DICTIONARY = new Set([
  "AM", "AN", "AS", "AT", "BE", "BY", "DO", "GO", "HE", "HI", "IF", "IN", "IS", "IT", "ME", "MY", "NO", "OF", "OK", "ON", "OR", "OX", "SO", "TO", "UP", "US", "WE",
  "ACT", "AIR", "ALL", "AND", "ANY", "ART", "ASK", "BAD", "BAG", "BAR", "BED", "BET", "BIG", "BOX", "BOY", "BUS", "BUY", "CAN", "CAR", "CAT", "CUP", "CUT", "DAY", "DOG", "DRY", "EAR", "EAT", "EGG", "END", "EYE", "FAR", "FEW", "FIT", "FLY", "FOR", "FUN", "GET", "GOD", "GUN", "GUY", "HAT", "HIT", "HOT", "HOW", "ICE", "ILL", "JOB", "JOY", "KEY", "KID", "LAW", "LAY", "LEG", "LET", "LIP", "LOW", "MAN", "MAP", "MAY", "NEW", "NOT", "NOW", "OFF", "OLD", "ONE", "OUT", "PAN", "PAY", "PEN", "PET", "PIG", "PIN", "POP", "PUT", "RAW", "RED", "RUN", "SAD", "SAY", "SEE", "SET", "SHE", "SIT", "SIX", "SKI", "SKY", "SON", "SUN", "TEA", "TEN", "THE", "TIE", "TIP", "TOE", "TOP", "TOY", "TRY", "TWO", "USE", "WAR", "WAY", "WHO", "WHY", "WIN", "YES", "YOU", "ZOO",
  "ABLE", "BABY", "BACK", "BAKE", "BALL", "BAND", "BANK", "BASE", "BEAR", "BEAT", "BEST", "BIRD", "BITE", "BLUE", "BOAT", "BODY", "BOND", "BOOK", "BORN", "BOTH", "BUSY", "CALL", "CALM", "CARE", "CASH", "CHEF", "CITY", "CLAP", "COLD", "COME", "COOK", "COOL", "COSY", "COZY", "CUTE", "DARK", "DATE", "DEAL", "DEAR", "DEEP", "DOOR", "DRAW", "DROP", "DUTY", "EASY", "EDGE", "EVEN", "EVER", "FACE", "FACT", "FAIR", "FALL", "FAST", "FEEL", "FILM", "FIND", "FINE", "FIRE", "FIRM", "FISH", "FIVE", "FOOD", "FOUR", "FREE", "FULL", "GAME", "GIFT", "GIRL", "GIVE", "GLAD", "GLOW", "GOAL", "GOLD", "GOOD", "GRAB", "GROW", "HAIR", "HALF", "HAND", "HARD", "HAVE", "HEAD", "HEAR", "HELP", "HERE", "HERO", "HIDE", "HIGH", "HOLD", "HOME", "HOPE", "HOUR", "HUGE", "HUGS", "IDEA", "INCH", "INTO", "IRON", "ITEM", "JOIN", "JUMP", "JUST", "KEEP", "KICK", "KIND", "KISS", "KNOW", "LADY", "LAND", "LATE", "LEAD", "LEAF", "LEFT", "LIFE", "LIKE", "LINE", "LINK", "LION", "LIVE", "LONG", "LOOK", "LORD", "LOVE", "LUCK", "MADE", "MAKE", "MANY", "MARK", "MEET", "MENU", "MILE", "MIND", "MINE", "MISS", "MOON", "MORE", "MOST", "MOVE", "MUCH", "NAME", "NEAR", "NECK", "NEWS", "NEXT", "NICE", "NIGHT", "NINE", "NOSE", "NOTE", "ONCE", "ONLY", "OPEN", "OVER", "PACK", "PAGE", "PAIN", "PAIR", "PARK", "PART", "PASS", "PAST", "PATH", "PEAK", "PLAN", "PLAY", "POEM", "POET", "POLL", "POOL", "POOR", "PRAY", "PURE", "RAIN", "READ", "REAL", "RICE", "RICH", "RIDE", "RING", "RISE", "RISK", "ROAD", "ROCK", "ROLE", "ROOM", "ROSE", "RULE", "SAFE", "SAID", "SAME", "SAVE", "SEAT", "SEEK", "SEEM", "SEEN", "SELF", "SEND", "SHIP", "SHOE", "SHOP", "SHOT", "SHOW", "SHY", "SIDE", "SIGN", "SING", "SITE", "SIZE", "SKIN", "SLOW", "SNAP", "SNOW", "SOFT", "SOME", "SONG", "SOON", "SOUL", "SOUP", "SPIN", "SPOT", "STAR", "STAY", "STEP", "STOP", "SUIT", "SURE", "SWIM", "TAKE", "TALK", "TALL", "TEAM", "TELL", "TENT", "TERM", "TEST", "TEXT", "THAN", "THAT", "THEM", "THEN", "THEY", "THIN", "THIS", "TIME", "TINY", "TOLL", "TONE", "TOOK", "TOUR", "TOWN", "TREE", "TRIP", "TRUE", "TUNE", "TURN", "TWIN", "TYPE", "UNIT", "UPON", "USER", "VAST", "VERY", "VIEW", "VOTE", "WAIT", "WAKE", "WALK", "WALL", "WANT", "WARM", "WASH", "WAVE", "WEAR", "WEEK", "WELL", "WENT", "WEST", "WHAT", "WHEN", "WHOM", "WIDE", "WIFE", "WILD", "WILL", "WIND", "WINE", "WING", "WISH", "WITH", "WOOD", "WORD", "WORK", "YARD", "YEAR", "ZERO",
  "ABOUT", "ABOVE", "ACTOR", "ADORE", "AFTER", "AGAIN", "AGREE", "AHEAD", "ALBUM", "ALERT", "ALIEN", "ALIVE", "ALONE", "ALONG", "AMONG", "ANGEL", "ANGER", "APPLE", "BEACH", "BEGIN", "BEING", "BELOW", "BLACK", "BLAND", "BLANK", "BLISS", "BLOCK", "BLOOD", "BLOOM", "BLUSH", "BOARD", "BRAIN", "BRAVE", "BREAD", "BREAK", "BRIDE", "BRIEF", "BRING", "BROWN", "BUILD", "CANDY", "CAUSE", "CHAIN", "CHAIR", "CHARM", "CHASE", "CHEAP", "CHECK", "CHEEK", "CHEER", "CHEST", "CHILL", "CHORD", "CINEMA", "CLASS", "CLEAN", "CLEAR", "CLIMB", "CLOCK", "CLOSE", "CLOUD", "COAST", "COLOR", "CRAFT", "CRAZY", "CREAM", "CRUSH", "DAILY", "DANCE", "DARLING", "DEATH", "DELIGHT", "DREAM", "DRINK", "DRIVE", "EARLY", "EARTH", "EMPTY", "ENJOY", "ENTER", "EQUAL", "EVENT", "EVERY", "EXACT", "EXTRA", "FAITH", "FANCY", "FEAST", "FIELD", "FIGHT", "FINAL", "FIRST", "FLAME", "FLASH", "FLOAT", "FLOOR", "FLOWER", "FOCUS", "FORCE", "FRAME", "FRESH", "FRONT", "FRUIT", "FUNNY", "GIANT", "GLANCE", "GLASS", "GLORY", "GRACE", "GRAND", "GREAT", "GREEN", "GREET", "GROOM", "GROUP", "GUARD", "GUESS", "GUIDE", "HAPPY", "HEART", "HEAVEN", "HONEY", "HOTEL", "HOUSE", "HUMAN", "IMAGE", "ISSUE", "JEWEL", "LAUGH", "LIGHT", "LOVER", "LOVELY", "LUCKY", "MAGIC", "MATCH", "MEDIA", "MERRY", "MODEL", "MONEY", "MOVIE", "MUSIC", "NIGHT", "NOBLE", "OCEAN", "OFFER", "ORDER", "PAINT", "PANEL", "PAPER", "PARTY", "PEACE", "PEACH", "PEARL", "PHONE", "PHOTO", "PIECE", "PILOT", "PITCH", "PIZZA", "PLANT", "PLATE", "POINT", "POWER", "PRIDE", "PRIZE", "PULSE", "QUEEN", "QUICK", "QUIET", "RADIO", "REACH", "READY", "RHYME", "RIGHT", "RIVER", "ROMANCE", "ROUND", "ROYAL", "SCENE", "SHARE", "SHINE", "SHIRT", "SIGHT", "SMILE", "SNACK", "SOUND", "SPACE", "SPARK", "SPICE", "STAGE", "STAND", "START", "STEAK", "STILL", "STORY", "STREAM", "SUGAR", "SWEET", "TABLE", "TASTE", "THEME", "THING", "THINK", "TOUCH", "TOWER", "TRACK", "TRAIN", "TRUST", "TRUTH", "TWICE", "UNCLE", "UNDER", "UNITY", "VALUE", "VIDEO", "VISIT", "VOICE", "WATER", "WHITE", "WHOLE", "WOMAN", "WORLD", "WORRY", "WORTH", "WOULD", "WRITE", "YOUNG", "YOUTH"
]);

export const scrabbleGameLogic = {
  createFreshBag() {
    const bag = [];
    let idCounter = 1;
    for (const [letter, count] of Object.entries(TILE_BAG_DISTRIBUTION)) {
      for (let i = 0; i < count; i++) {
        bag.push({
          id: `tile-${letter}-${idCounter++}`,
          letter,
          score: LETTER_SCORES[letter] || 1,
        });
      }
    }
    // Fisher-Yates shuffle
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
  },

  drawTiles(bag, count = 7) {
    const drawn = [];
    for (let i = 0; i < count && bag.length > 0; i++) {
      drawn.push(bag.pop());
    }
    return { drawn, remainingBag: bag };
  },

  normalizeBoard(board) {
    const clean = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        let cell = null;
        if (board && board[r] && board[r][c]) {
          cell = {
            letter: board[r][c].letter,
            score: board[r][c].score,
            player: board[r][c].player || "Timi",
          };
        }
        row.push(cell);
      }
      clean.push(row);
    }
    return clean;
  },

  initGame(firstPlayer = "Timi") {
    const bag = this.createFreshBag();
    const { drawn: timiRack, remainingBag: bag1 } = this.drawTiles(bag, 7);
    const { drawn: ejayRack, remainingBag: bag2 } = this.drawTiles(bag1, 7);

    // Empty 9x9 board
    const board = Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null));

    return {
      status: "playing",
      currentTurn: firstPlayer,
      board,
      timiRack,
      ejayRack,
      bag: bag2,
      timiScore: 0,
      ejayScore: 0,
      moveHistory: [],
      lastWordPlayed: null,
      passStreak: 0,
      winner: null,
    };
  },

  isBoardEmpty(board) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] !== null) return false;
      }
    }
    return true;
  },

  isValidDictionaryWord(word) {
    if (!word || word.length < 2) return false;
    const upper = word.toUpperCase();
    return COMMON_DICTIONARY.has(upper) || upper.length >= 2;
  },

  calculatePlacementScore(placements) {
    if (!placements || !placements.length) return 0;

    let wordMultiplier = 1;
    let baseScore = 0;

    for (const p of placements) {
      const mult = BOARD_MULTIPLIERS[p.row][p.col] || "";
      let letterScore = p.tile.score;

      if (mult === "DL") letterScore *= 2;
      else if (mult === "TL") letterScore *= 3;
      else if (mult === "DW" || mult === "ST") wordMultiplier *= 2;
      else if (mult === "TW") wordMultiplier *= 3;

      baseScore += letterScore;
    }

    let total = baseScore * wordMultiplier;
    // Bingo bonus: played all 7 tiles in one turn!
    if (placements.length >= 7) {
      total += 35;
    }
    return total;
  },

  playTurn(gameState, player, placements) {
    if (!gameState) {
      throw new Error("Game state is loading. Please try again.");
    }

    if (gameState.currentTurn && gameState.currentTurn !== player) {
      throw new Error(`It is not ${player}'s turn!`);
    }

    if (!placements || placements.length === 0) {
      throw new Error("No tiles were placed on the board.");
    }

    // Sort placements horizontally or vertically
    const isHorizontal = placements.every((p) => p.row === placements[0].row);
    const isVertical = placements.every((p) => p.col === placements[0].col);

    if (!isHorizontal && !isVertical) {
      throw new Error("Tiles must be placed in a single continuous row or column.");
    }

    const sorted = [...placements].sort((a, b) =>
      isHorizontal ? a.col - b.col : a.row - b.row
    );

    // Form the played word
    const playedWord = sorted.map((p) => p.tile.letter).join("");

    // Calculate score
    const score = this.calculatePlacementScore(sorted);

    // Deep copy board and place tiles
    const currentBoard = this.normalizeBoard(gameState.board);
    const newBoard = currentBoard.map((row) => [...row]);
    for (const p of sorted) {
      newBoard[p.row][p.col] = {
        letter: p.tile.letter,
        score: p.tile.score,
        player,
      };
    }

    // Deduct tiles from player's rack
    const placedTileIds = new Set(sorted.map((p) => p.tile.id));
    const timiRack = Array.isArray(gameState.timiRack) ? [...gameState.timiRack] : [];
    const ejayRack = Array.isArray(gameState.ejayRack) ? [...gameState.ejayRack] : [];
    const currentRack = player === "Timi" ? timiRack : ejayRack;
    const remainingRack = currentRack.filter((t) => !placedTileIds.has(t.id));

    // Refill rack from bag
    const bagCopy = Array.isArray(gameState.bag) && gameState.bag.length > 0
      ? [...gameState.bag]
      : this.createFreshBag();
    const { drawn, remainingBag } = this.drawTiles(
      bagCopy,
      7 - remainingRack.length
    );
    const newRack = [...remainingRack, ...drawn];

    const nextPlayer = player === "Timi" ? "Ejay" : "Timi";
    const nextTimiScore =
      player === "Timi" ? (gameState.timiScore || 0) + score : (gameState.timiScore || 0);
    const nextEjayScore =
      player === "Ejay" ? (gameState.ejayScore || 0) + score : (gameState.ejayScore || 0);

    // Check game over
    let winner = null;
    let status = "playing";
    if (newRack.length === 0 && remainingBag.length === 0) {
      status = "game_over";
      winner = nextTimiScore >= nextEjayScore ? "Timi" : "Ejay";
    }

    return {
      ...gameState,
      status,
      currentTurn: nextPlayer,
      board: newBoard,
      timiRack: player === "Timi" ? newRack : timiRack,
      ejayRack: player === "Ejay" ? newRack : ejayRack,
      bag: remainingBag,
      timiScore: nextTimiScore,
      ejayScore: nextEjayScore,
      lastWordPlayed: {
        player,
        word: playedWord,
        score,
      },
      moveHistory: [
        { player, word: playedWord, score, timestamp: Date.now() },
        ...(gameState.moveHistory || []).slice(0, 19),
      ],
      passStreak: 0,
      winner,
    };
  },

  passTurn(gameState, player) {
    if (!gameState) return this.initGame(player);
    const nextPlayer = player === "Timi" ? "Ejay" : "Timi";
    const streak = (gameState.passStreak || 0) + 1;
    let status = gameState.status || "playing";
    let winner = gameState.winner || null;
    if (streak >= 4) {
      status = "game_over";
      const timiScore = gameState.timiScore || 0;
      const ejayScore = gameState.ejayScore || 0;
      winner = timiScore >= ejayScore ? "Timi" : "Ejay";
    }

    return {
      ...gameState,
      board: this.normalizeBoard(gameState.board),
      status,
      currentTurn: nextPlayer,
      passStreak: streak,
      winner,
    };
  },
};

export default scrabbleGameLogic;
