// Original connected arrow-crosswords. Every new word crosses the existing board.
function build(id, title, entries) {
  const size = 15;
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
  return { id, title, cols: size, rows: size, cells, words };
}

export const LARGE_PICTURE_CROSSWORDS = [
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
