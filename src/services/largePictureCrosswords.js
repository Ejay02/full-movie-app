// Original connected arrow-crosswords. Every new word crosses the existing board.
function build(id, title, entries, size = 15, difficulty = null) {
  const cells = Array.from({ length: size * size }, (_, key) => ({ key: String(key), row: Math.floor(key / size), col: key % size, kind: 'corner', words: [] }));
  const words = [];
  const at = (r, c) => r >= 0 && r < size && c >= 0 && c < size ? cells[r * size + c] : null;
  const candidates = (answer) => {
    const choices = [];
    for (const direction of ['across', 'down']) for (let r = 1; r < size; r++) for (let c = 1; c < size; c++) {
      const dr = direction === 'down' ? 1 : 0, dc = 1 - dr;
      const clue = at(r - dr, c - dc), end = at(r + dr * answer.length, c + dc * answer.length);
      if (!clue || clue.kind !== 'corner' || end?.kind === 'letter') continue;
      let crosses = 0, valid = true;
      const slots = [];
      for (let i = 0; i < answer.length; i++) {
        const cell = at(r + dr * i, c + dc * i);
        if (!cell || cell.kind === 'clue' || (cell.answer && (cell.answer !== answer[i] || cell.words.some(w => words.find(word => word.id === w).direction === direction)))) { valid = false; break; }
        if (cell.answer) crosses++;
        else if ([at(cell.row + dc, cell.col + dr), at(cell.row - dc, cell.col - dr)].some(neighbor => neighbor?.kind === 'letter')) { valid = false; break; }
        slots.push(cell);
      }
      if (valid && (!words.length || crosses)) choices.push({ direction, clue, slots, score: crosses * 100 - Math.abs(r - 7) - Math.abs(c - 7) });
    }
    return choices.sort((a, b) => b.score - a.score);
  };
  let pending = entries.slice();
  for (let round = 0; round < 4; round++) {
    const remaining = [];
    for (const [answer, label, image] of pending) {
      const choice = candidates(answer)[0];
      if (!choice) { remaining.push([answer, label, image]); continue; }
      const word = { id: `${id}-${words.length}`, answer, label, ...(image ? { image } : {}), direction: choice.direction, cells: choice.slots.map(cell => cell.key) };
      choice.slots.forEach((cell, i) => { cell.kind = 'letter'; cell.answer = answer[i]; cell.words.push(word.id); });
      Object.assign(choice.clue, { kind: 'clue', wordId: word.id, label, ...(image ? { image } : {}), direction: word.direction });
      words.push(word);
    }
    pending = remaining;
  }
  if (!difficulty) return { id, title, cols: size, rows: size, cells, words };
  // New editions trim unused outer rows; old IDs retain their exact cell keys.
  const used = cells.filter(cell => cell.kind !== 'corner');
  const top = Math.min(...used.map(cell => cell.row)), left = Math.min(...used.map(cell => cell.col));
  const bottom = Math.max(...used.map(cell => cell.row)), right = Math.max(...used.map(cell => cell.col));
  const cropped = cells.filter(cell => cell.row >= top && cell.row <= bottom && cell.col >= left && cell.col <= right)
    .map(cell => ({ ...cell, row: cell.row - top, col: cell.col - left }));
  const keys = new Map(cropped.map((cell, index) => [cell.key, String(index)]));
  cropped.forEach(cell => { cell.key = keys.get(cell.key); });
  words.forEach(word => { word.cells = word.cells.map(key => keys.get(key)); });
  return { id, title, difficulty, cols: right - left + 1, rows: bottom - top + 1, cells: cropped, words };
}

const LEGACY_LARGE = [
  build('picture-cinema-3', 'After the credits', [
    ['MOVIENIGHT', 'Our evening with popcorn'], ['POPCORN', 'Cinema snack'], ['DIRECTOR', 'Calls “Action!”'],
    ['ROMANCE', 'Love-story genre'], ['CAMERA', 'Captures the scene'], ['SCREEN', 'Where the film appears'],
    ['CINEMA', 'A movie theatre'], ['ACTOR', 'Performs a character'], ['SCRIPT', 'Written dialogue'],
    ['SEQUEL', 'The next instalment'], ['TRAILER', 'Film preview'], ['TICKET', 'Admission slip'],
    ['COMEDY', 'A film for laughs'], ['DRAMA', 'Serious story'], ['MUSIC', 'What a score contains'],
    ['SCENE', 'Part of an act'], ['STAR', 'Lead performer', 'star'], ['HAT', 'Costume headwear', 'hat'],
    ['PEN', 'A writer’s tool', 'pen'], ['CAT', 'Whiskered co-star', 'cat'], ['NET', 'A web of cords', 'net'],
    ['EDIT', 'Cut and arrange footage'], ['TAKE', 'One filmed attempt'], ['SET', 'Filming location'],
    ['ROLE', 'An actor’s part'], ['ART', 'Creative expression'], ['RED', 'Carpet colour'],
  ]),
  build('picture-space-3', 'Beyond the moon', [
    ['TELESCOPE', 'Makes distant stars look close'], ['ASTEROID', 'Rock orbiting the Sun'], ['GALAXY', 'Vast collection of stars'],
    ['ROCKET', 'Launch vehicle', 'rocket'], ['PLANET', 'World orbiting a star', 'planet'], ['SATURN', 'Planet famous for rings'],
    ['ORBIT', 'Path around a world'], ['COMET', 'Icy visitor with a tail'], ['NEBULA', 'Cloud where stars may form'],
    ['EARTH', 'Our home planet'], ['VENUS', 'Second planet from the Sun'], ['SPACE', 'Beyond our atmosphere'],
    ['MOON', 'Earth’s natural satellite', 'moon'], ['STAR', 'A distant sun', 'star'], ['SOLAR', 'Relating to the Sun'],
    ['ALIEN', 'Visitor from another world'], ['NOVA', 'Suddenly bright star'], ['DUST', 'Tiny cosmic particles'],
    ['MARS', 'The red planet'], ['NIGHT', 'Time for stargazing'], ['ICE', 'Frozen water', 'ice'],
    ['SUN', 'Our nearest star'], ['SKY', 'Look up at it'], ['GAS', 'State of hydrogen in space'],
  ]),
];

const garden = [
  ['SUNFLOWER', 'Tall flower that follows the sun'], ['BUTTERFLY', 'Insect with patterned wings'],
  ['GARDEN', 'Flowers grow here'], ['BLOSSOM', 'A flower on a tree'], ['PETAL', 'Part of a flower'],
  ['BRANCH', 'Limb of a tree'], ['FOREST', 'Many trees together'], ['ROOT', 'Anchors a plant'],
  ['LEAF', 'Green part of a plant'], ['SEED', 'A plant starts here'], ['RAIN', 'Water from clouds'],
  ['SOIL', 'Earth for planting'], ['NEST', 'A bird’s home'], ['ROSE', 'Flower with thorns'],
  ['STEM', 'Supports a flower'], ['POND', 'Small body of water'], ['BEE', 'Makes honey'],
  ['CAT', 'Whiskered garden visitor', 'cat'], ['DOG', 'Pet that barks', 'dog'], ['NET', 'Catches butterflies', 'net'],
  ['SUN', 'Daytime star'], ['ANT', 'Tiny colony insect'], ['DEW', 'Morning water drops'], ['OAK', 'Acorn-bearing tree'],
];
const home = [
  ['BOOKSHELF', 'A home for novels'], ['BREAKFAST', 'First meal of the day'], ['KITCHEN', 'Cooking room'],
  ['BEDROOM', 'Room for sleeping'], ['BLANKET', 'Keeps you warm'], ['CURTAIN', 'Fabric over a window'],
  ['PILLOW', 'Rest your head here'], ['WINDOW', 'Lets daylight inside'], ['CANDLE', 'A wax light', 'candle'],
  ['TABLE', 'Eat dinner at it'], ['CHAIR', 'A seat with a back'], ['DOOR', 'Room entrance'],
  ['LAMP', 'Bedside light'], ['CLOCK', 'Tells the time'], ['PLATE', 'Holds your meal'], ['SPOON', 'Utensil for soup'],
  ['BED', 'Sleep here', 'bed'], ['PEN', 'Writing tool', 'pen'], ['HAT', 'Headwear', 'hat'],
  ['CAT', 'Pet with whiskers', 'cat'], ['ICE', 'Frozen water', 'ice'], ['CUP', 'Tea holder'], ['MAT', 'Wipe your feet here'],
  ['RUG', 'Soft floor covering'], ['KEY', 'Opens a lock'], ['TEA', 'A brewed drink'], ['PAN', 'Cook in it'],
];
const cinema = LEGACY_LARGE[0].words.map(word => [word.answer, word.label, word.image]);
const space = LEGACY_LARGE[1].words.map(word => [word.answer, word.label, word.image]);
export const LARGE_PICTURE_CROSSWORDS = [
  build('cinema-4', 'Cinema club', cinema, 14, 'Standard'),
  build('space-4', 'Among the stars', space, 12, 'Challenging'),
  build('garden-4', 'Secret garden', garden, 13, 'Standard'),
  build('home-4', 'Sunday at home', home, 12, 'Standard'),
  build('garden-long-4', 'Wild things', [...garden].reverse(), 15, 'Challenging'),
  build('home-quick-4', 'Little comforts', home.filter(entry => entry[0].length <= 6), 11, 'Easy'),
  ...LEGACY_LARGE,
];
