export function providerWatchUrl(type, id, season = 1, episode = 1) {
  if (!/^[1-9]\d{0,9}$/.test(String(id))) return '';
  if (type === 'movie') return `https://vixsrc.to/movie/${id}`;
  if (type === 'tv' && [season, episode].every(value => /^[1-9]\d{0,3}$/.test(String(value)))) {
    return `https://vixsrc.to/tv/${id}/${season}/${episode}`;
  }
  return '';
}
