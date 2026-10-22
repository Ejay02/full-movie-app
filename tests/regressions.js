/* Run with node tests/regressions.js. No network or shared-room writes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const compiler = require('vue-template-compiler');
const root = path.resolve(__dirname, '..');
let checks = 0;
const test = async (name, fn) => { await fn(); checks++; console.log('PASS ' + name); };
const storage = new Map();
const localStorage = { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) };
function load(file, mocks = {}) {
  const filename = path.join(root, file);
  let code = fs.readFileSync(filename, 'utf8');
  if (file.endsWith('.vue')) code = compiler.parseComponent(code).script.content;
  const transformed = babel.transformSync(code, { babelrc: false, configFile: false,
    plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  const module = { exports: {} };
  vm.runInNewContext(transformed, { module, exports: module.exports, console, Date, Math, URL,
    localStorage, process: { env: {} }, window: { addEventListener() {}, removeEventListener() {} },
    require: (name) => {
      if (name in mocks) return mocks[name];
      if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.js', mocks);
      throw new Error('Unmocked module: ' + name);
    },
  }, { filename });
  return module.exports;
}
const whot = load('src/services/whotGameLogic.js');
const sync = load('src/services/playbackSync.js');
const fakeCloud = { subscribeToGame() { return () => {}; } };
const games = load('src/services/gameSession.js', { './firebaseSync': fakeCloud });
const crossword = load('src/services/crosswordLogic.js');
const pictures = load('src/services/pictureCrosswordLogic.js');
const avatars = load('src/services/profileAvatars.js');
const streams = require('../server/streamSource');
const clone = (value) => JSON.parse(JSON.stringify(value));
function whotState(number) {
  const state = whot.initWhotGame('Timi');
  state.topCard = { id: 'top', number: 7, suit: 'circle' };
  state.discard = [state.topCard];
  state.timiHand = [{ id: 'play', number, suit: 'circle' }, { id: 'last', number: 9, suit: 'circle' }];
  return state;
}
async function main() {
  await test('Only a new play request switches a room out of Games', () => {
    const old = { mediaKey: 'movie', playing: false, watchRequestId: 'old' };
    const play = { ...old, playing: true, watchRequestId: 'new' };
    assert.equal(sync.isNewWatchRequest(old, play, 'movie'), true);
    assert.equal(sync.isNewWatchRequest(play, { ...play, position: 30 }, 'movie'), false, 'heartbeats must not pull someone out of Games');
    assert.equal(sync.isNewWatchRequest(null, play, 'movie'), false, 'old snapshots must not replace the chosen tab');
    assert.equal(sync.isNewWatchRequest(old, play, 'other-room-movie'), false);
    assert.equal(sync.isNewWatchRequest(play, { ...play, playing: false }, 'movie'), false);
  });
  await test('Presence registers disconnect cleanup first and keeps browser sessions independent', async () => {
    const listeners = [], writes = [], cleanup = [], removed = [];
    let sequence = 0;
    const service = load('src/services/firebaseSync.js', {
      'firebase/app': { initializeApp: () => ({}), getApps: () => [] },
      'firebase/database': {
        getDatabase: () => ({}), ref: (_, key) => key, push: key => `${key}/${++sequence}`,
        onValue: (_, callback) => { listeners.push(callback); return () => {}; },
        onDisconnect: key => ({ remove: async () => { cleanup.push(key); } }),
        set: async (key, value) => { assert.ok(cleanup.includes(key)); writes.push([key, value]); },
        remove: async key => { removed.push(key); },
      },
    }).firebaseSync;
    const stopFirst = service.trackPresence('Timi');
    const stopSecond = service.trackPresence('Timi');
    await listeners[0]({ val: () => true }); await listeners[1]({ val: () => true });
    assert.equal(writes.length, 2); assert.notEqual(writes[0][0], writes[1][0]);
    stopFirst(); assert.ok(removed.includes(writes[0][0])); assert.ok(!removed.includes(writes[1][0]));
    await listeners[1]({ val: () => false }); await listeners[1]({ val: () => true });
    assert.equal(writes.length, 3, 'reconnection gets its own disconnect cleanup');
    stopSecond();
    const stopPending = service.trackPresence('Ejay');
    const pending = listeners[2]({ val: () => true }); stopPending(); await pending;
    assert.equal(writes.length, 3, 'closing while registering cannot resurrect presence');
  });
  await test('Avatar choices persist per person and stale cloud updates cannot replace them', () => {
    let profiles = avatars.mergeAvatar({}, 'Timi', { id: 'hearts', updatedAt: 20 });
    profiles = avatars.mergeAvatar(profiles, 'Ejay', { id: 'ninja', updatedAt: 30 });
    profiles = avatars.mergeAvatar(profiles, 'Timi', { id: 'blue-moon', updatedAt: 10 });
    assert.equal(profiles.Timi.id, 'hearts'); assert.equal(profiles.Ejay.id, 'ninja');
    assert.equal(avatars.mergeAvatar(profiles, 'Timi', { id: 'https://unknown.example/image', updatedAt: 50 }), profiles);
    storage.set(avatars.AVATAR_STORAGE_KEY, JSON.stringify(profiles));
    assert.equal(avatars.readAvatars().Timi.id, 'hearts');
    for (const avatar of avatars.AVATARS) assert.ok(fs.existsSync(path.join(root, 'public', avatar.src)), avatar.id);
  });
  await test('Picture crosswords have picture and word clues, valid crossings, and playable racks', () => {
    for (let i = 0; i < pictures.PICTURE_CROSSWORDS.length; i++) {
      const puzzle = pictures.PICTURE_CROSSWORDS[i];
      if (i < 2) { assert.ok(puzzle.words.length >= 12, `${puzzle.title}: ${puzzle.words.length} words`); assert.ok(puzzle.words.some(word => word.answer.length >= 8)); }
      assert.ok(puzzle.cells.some(cell => cell.image));
      assert.ok(puzzle.cells.some(cell => cell.kind === 'clue' && !cell.image));
      for (const word of puzzle.words) assert.equal(word.cells.map(key => puzzle.cells[Number(key)].answer).join(''), word.answer);
      let state = pictures.newPictureCrossword(i), rounds = 0;
      while (state.status === 'playing' && rounds++ < 40) {
        const used = new Set();
        const placements = state.rack.map((letter, rackIndex) => {
          const cell = puzzle.cells.find(cell => cell.kind === 'letter' && cell.answer === letter && !state.filled[cell.key] && !used.has(cell.key));
          assert.ok(cell, 'every dealt tile can be placed'); used.add(cell.key);
          return { cellKey: cell.key, rackIndex };
        });
        const before = JSON.stringify(state), player = state.currentTurn;
        const result = pictures.playPictureTurn(state, player, placements);
        assert.equal(JSON.stringify(state), before, 'moves must not mutate shared state');
        assert.ok(result.state); state = games.normalizeGame('crosswordGo', result.state);
        assert.notEqual(state.currentTurn, player);
      }
      assert.equal(state.status, 'game_over');
      const letterCount = puzzle.cells.filter(cell => cell.kind === 'letter').length;
      assert.equal(Object.keys(state.filled).length, letterCount);
      assert.equal(Object.keys(state.solved).length, puzzle.words.length);
      assert.equal(state.scores.Timi + state.scores.Ejay, letterCount + puzzle.words.length * 5);
      games.cacheGame('crosswordGo', 'picture-test', state);
      assert.equal(games.readGame('crosswordGo', 'picture-test').scores.Timi, state.scores.Timi);
    }
  });
  await test('Picture crossword rejects illegal turns and duplicate or incorrect tiles', () => {
    const state = pictures.newPictureCrossword();
    const cell = pictures.picturePuzzle(state).cells.find(cell => cell.answer === state.rack[0]);
    const move = { cellKey: cell.key, rackIndex: 0 };
    assert.ok(pictures.playPictureTurn(state, 'Ejay', [move]).error);
    assert.ok(pictures.playPictureTurn(state, 'Timi', [move, move]).error);
    const wrong = pictures.picturePuzzle(state).cells.find(cell => cell.kind === 'letter' && cell.answer !== state.rack[0]);
    const penalty = pictures.playPictureTurn(state, 'Timi', [{ ...move, cellKey: wrong.key }]);
    assert.equal(penalty.state.scores.Timi, -1);
    assert.equal(penalty.state.currentTurn, 'Timi');
    assert.deepEqual(clone(penalty.state.rack), clone(state.rack));
    assert.equal(penalty.state.filled[wrong.key], undefined);
    assert.equal(state.scores.Timi, 0, 'previous saved state is immutable');
    const passed = pictures.passPictureTurn(state, 'Timi');
    assert.equal(passed.currentTurn, 'Ejay'); assert.equal(passed.scores.Timi, 0);
    assert.equal(pictures.passPictureTurn(state, 'Ejay'), null);
  });
  await test('Home Resume opens the player directly with the saved episode', () => {
    const component = load('src/components/ContinueWatchingSection.vue').default;
    const movie = component.methods.resumeRoute({ mediaType: 'movie', mediaId: 42 });
    assert.equal(movie.path, '/watch/movie/42');
    const tv = component.methods.resumeRoute({ mediaType: 'tv', mediaId: 42, season: 2, episode: 4 });
    assert.equal(tv.path, '/watch/tv/42'); assert.equal(tv.query.season, '2'); assert.equal(tv.query.episode, '4');
  });
  await test('Solo resume survives early zero events and waits for usable HLS duration', () => {
    const view = load('src/views/WatchView.vue', { '@/data/personalMediaLibrary': { getPersonalMediaSource: () => null } }).default;
    const player = { readyState: 1, currentTime: 0, duration: Infinity };
    const writes = [];
    const component = { $refs: { player }, hasRestoredPosition: false, mediaType: 'movie',
      continueWatchingEntry: { currentTime: 125 }, recordContinueWatching: value => writes.push(value), clearBufferingCheck() {} };
    view.methods.handlePlay.call(component); view.methods.handleTimeUpdate.call(component);
    assert.equal(writes.length, 0, 'initial zero must not overwrite saved time');
    view.methods.handleLoadedMetadata.call(component);
    assert.equal(component.hasRestoredPosition, false);
    player.duration = 500;
    view.methods.handleLoadedMetadata.call(component);
    assert.equal(player.currentTime, 125); assert.equal(component.hasRestoredPosition, true);
    player.currentTime = 151;
    view.methods.saveCurrentProgress.call(component);
    assert.equal(writes[0].currentTime, 151);
    component.hasRestoredPosition = false; player.currentTime = 0;
    component.mediaType = 'tv'; component.selectedSeason = 2; component.selectedEpisode = 2;
    component.continueWatchingEntry = { currentTime: 125, season: 2, episode: 1 };
    view.methods.handleLoadedMetadata.call(component);
    assert.equal(player.currentTime, 0, 'a new episode must start at zero');
  });
  await test('Crossword grids have matching intersections and no unintended words', () => {
    for (const puzzle of crossword.CROSSWORDS) {
      const grid = Array.from({ length: puzzle.rows }, () => Array(puzzle.cols).fill(''));
      for (const word of puzzle.words) for (const cell of crossword.wordCells(word)) {
        assert.ok(cell.row < puzzle.rows && cell.col < puzzle.cols);
        assert.ok(!grid[cell.row][cell.col] || grid[cell.row][cell.col] === cell.letter);
        grid[cell.row][cell.col] = cell.letter;
      }
      for (const direction of ['across', 'down']) {
        for (let row = 0; row < puzzle.rows; row++) for (let col = 0; col < puzzle.cols; col++) {
          if (!grid[row][col] || (direction === 'across' ? grid[row][col - 1] : grid[row - 1]?.[col])) continue;
          let answer = '', r = row, c = col;
          while (grid[r]?.[c]) { answer += grid[r][c]; if (direction === 'across') c++; else r++; }
          if (answer.length > 1) assert.ok(puzzle.words.some(word => word.row === row && word.col === col && word.direction === direction && word.answer === answer), answer);
        }
      }
    }
  });
  await test('Crossword rejects wrong answers, saves both players and completes', () => {
    let state = crossword.newCrossword();
    const first = crossword.CROSSWORDS[0].words[0];
    assert.equal(crossword.solveWord(state, first.id, 'NOPE', 'Timi'), null);
    const original = JSON.stringify(state);
    const solved = crossword.solveWord(state, first.id, first.answer.toLowerCase(), 'Timi');
    assert.equal(JSON.stringify(state), original);
    state = games.normalizeGame('crossword', solved);
    games.cacheGame('crossword', 'crossword-test', state);
    assert.equal(games.readGame('crossword', 'crossword-test').solved[first.id], 'Timi');
    for (const word of crossword.CROSSWORDS[0].words.slice(1)) state = crossword.solveWord(state, word.id, word.answer, 'Ejay');
    assert.equal(state.status, 'complete');
    assert.equal(Object.keys(state.solved).length, 6);
    assert.equal(Object.keys(games.normalizeGame('crossword', { puzzleId: 'movie-night' }).solved).length, 0);
  });
  await test('Stream resolver rejects invalid IDs and foreign playlist origins', () => {
    assert.throws(() => streams.mediaPath('movie', '../admin'));
    assert.throws(() => streams.mediaPath('tv', 1, 0, 1));
    const fixture = `window.masterPlaylist = { params: { 'token': 'example', 'expires': '1900000000' }, url: 'https://vixsrc.to/playlist/123' }`;
    const source = streams.parseSource(fixture);
    assert.equal(new URL(source.sourceUrl).searchParams.get('lang'), 'en');
    assert.equal(source.mimeType, 'application/vnd.apple.mpegurl');
    assert.throws(() => streams.parseSource(fixture.replace('https://vixsrc.to', 'https://localhost')));
    assert.throws(() => streams.parseSource('<script>window.evil()</script>'));
  });
  for (const [number, draw] of [[2, 2], [5, 3], [14, 1]]) {
    await test('Whot ' + number + ' draws penalty and keeps the player turn', () => {
      const state = whotState(number), before = clone(state);
      const result = whot.playCard(state, 'Timi', state.timiHand[0]);
      assert.equal(result.currentTurn, 'Timi');
      assert.equal(result.ejayHand.length, state.ejayHand.length + draw);
      assert.equal(JSON.stringify(state), JSON.stringify(before));
    });
  }
  await test('Out-of-turn Whot actions are ignored', () => {
    const state = whotState(2);
    assert.equal(whot.playCard(state, 'Ejay', state.timiHand[0]), state);
    assert.equal(whot.drawMarketCard(state, 'Ejay'), state);
  });
  await test('Market drawing ends a normal turn', () => {
    const state = whotState(7), result = whot.drawMarketCard(state, 'Timi');
    assert.equal(result.timiHand.length, 3);
    assert.equal(result.currentTurn, 'Ejay');
  });
  await test('A winning penalty card still draws the opponent penalty', () => {
    const state = whotState(2); state.timiHand.pop();
    const result = whot.playCard(state, 'Timi', state.timiHand[0]);
    assert.equal(result.winner, 'Timi');
    assert.equal(result.ejayHand.length, state.ejayHand.length + 2);
  });
  await test('Firebase empty arrays and sparse Scrabble boards are restored', () => {
    const state = games.normalizeGame('scrabble', { board: { 4: { 4: { letter: 'A' } } } });
    assert.equal(state.board.length, 9); assert.equal(state.board[0].length, 9);
    assert.equal(state.board[4][4].letter, 'A'); assert.equal(state.board[0][0], null);
    assert.equal(state.moveHistory.length, 0);
    assert.equal(games.normalizeGame('wordDuel', {}).timiGuesses.length, 0);
  });
  await test('Game cache persists independently by room and game', () => {
    games.cacheGame('whot', 'room-a', whotState(2));
    assert.equal(games.readGame('whot', 'room-a').timiHand[0].number, 2);
    assert.equal(games.readGame('whot', 'room-b'), null);
    assert.equal(games.readGame('wordDuel', 'room-a'), null);
  });
  await test('Opening a cached match subscribes without creating a replacement', () => {
    let published = false;
    const service = { subscribeToGame(type, callback) { callback(whotState(5)); return () => {}; },
      saveGame() { published = true; } };
    const session = load('src/services/gameSession.js', { './firebaseSync': service }).default('whot', 'gameState', null);
    const component = { ...session.data(), roomId: 'room-a', gameState: null };
    session.methods.openGameSession.call(component);
    assert.equal(component.gameState.timiHand[0].number, 5);
    assert.equal(component.gameLoading, false); assert.equal(published, false);
  });
  await test('Playback includes latency only while playing and clamps to duration', () => {
    assert.equal(sync.playbackPosition({ position: 10, playing: true, updatedAt: 1000 }, 4000), 13);
    assert.equal(sync.playbackPosition({ position: 10, playing: false, updatedAt: 1000 }, 4000), 10);
    assert.equal(sync.playbackPosition({ position: 10, playing: true, updatedAt: 1000 }, 4000, 12), 12);
  });
  await test('Media keys distinguish episodes, providers and playback sessions', () => {
    const media = { mediaType: 'tv', mediaId: 1, season: 1, episode: 1 };
    assert.notEqual(sync.mediaKey(media, 'vidlink'), sync.mediaKey({ ...media, episode: 2 }, 'vidlink'));
    assert.notEqual(sync.mediaKey(media, 'vidlink'), sync.mediaKey(media, 'other'));
  });
  await test('Embedded player events require exact frame, origin and episode', () => {
    const frame = { contentWindow: {} }, media = { mediaId: 1, mediaType: 'tv', season: 1, episode: 1 };
    const event = { source: frame.contentWindow, origin: 'https://vidlink.pro',
      data: { type: 'PLAYER_EVENT', data: { event: 'play', currentTime: 12, tmdbId: 1, season: 1, episode: 1 } } };
    assert.ok(sync.acceptPlayerEvent(event, frame, 'https://vidlink.pro/tv/1/1/1', media));
    assert.equal(sync.acceptPlayerEvent({ ...event, origin: 'https://ads.example' }, frame, 'https://vidlink.pro', media), null);
    assert.equal(sync.acceptPlayerEvent({ ...event, source: {} }, frame, 'https://vidlink.pro', media), null);
    event.data.data.episode = 2;
    assert.equal(sync.acceptPlayerEvent(event, frame, 'https://vidlink.pro', media), null);
  });
  await test('Native remote seeking and pausing do not publish an echo', async () => {
    let writes = 0;
    const player = load('src/components/WatchTogetherPlayer.vue', {
      '@/services/firebaseSync': { setPlayback() { writes++; } },
      '@/data/personalMediaLibrary': { getPersonalMediaSource: () => null },
      '@/services/playbackSync': sync,
    }).default;
    const video = { readyState: 1, currentTime: 0, duration: 100, pause() { this.paused = true; }, paused: false };
    const component = { $refs: { video }, sourceReady: true, playbackLoaded: true, shared: { position: 35, playing: false, updatedAt: Date.now() }, offset: 0, applyingUntil: 0, localControlUntil: 0 };
    await player.methods.restorePlayback.call(component);
    assert.equal(video.currentTime, 35); assert.equal(video.paused, true);
    player.methods.publish.call(component);
    assert.equal(writes, 0);
    component.send = () => { writes++; };
    video.paused = false;
    player.methods.markLocalControl.call(component);
    player.methods.publish.call(component);
    assert.equal(writes, 1, 'an immediate user play after a remote pause must be shared');
    component.shared.playing = true; component.localControlUntil = 0; component.applyingUntil = 0; video.paused = true;
    player.methods.publish.call(component);
    assert.equal(writes, 1, 'a joining browser pause must not pause the room');
  });
  await test('Pending game save cannot replace a new room match', async () => {
    let resolveSave;
    const service = { saveGame: () => new Promise(resolve => { resolveSave = resolve; }) };
    const session = load('src/services/gameSession.js', { './firebaseSync': service }).default('whot', 'gameState', null);
    const component = { ...session.data(), gameLoading: false, gameState: whotState(2), roomId: 'before', gameGeneration: 1 };
    const saving = session.methods.saveGameSession.call(component, whotState(5));
    component.roomId = 'after'; component.gameGeneration++;
    component.gameState = whotState(14);
    resolveSave(whotState(5));
    assert.equal(await saving, false);
    assert.equal(component.gameState.timiHand[0].number, 14);
    assert.equal(games.readGame('whot', 'after'), null);
    assert.equal(games.readGame('whot', 'before').timiHand[0].number, 5);
  });
  await test('Both external players forbid popup and top navigation permissions', () => {
    for (const file of ['src/components/WatchTogetherPlayer.vue', 'src/views/WatchView.vue']) {
      const source = fs.readFileSync(path.join(root, file), 'utf8');
      const sandbox = source.match(/sandbox="([^"]+)"/)[1];
      assert.ok(sandbox.includes('allow-scripts'));
      assert.ok(!sandbox.includes('allow-popups')); assert.ok(!sandbox.includes('allow-top-navigation'));
    }
  });
  console.log(checks + ' regression checks passed.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
