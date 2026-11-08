export function providerWatchUrl(type, id, season = 1, episode = 1) {
  if (!/^[1-9]\d{0,9}$/.test(String(id))) return '';
  if (type === 'movie') return `https://vixsrc.to/movie/${id}`;
  if (type === 'tv' && [season, episode].every(value => /^[1-9]\d{0,3}$/.test(String(value)))) {
    return `https://vixsrc.to/tv/${id}/${season}/${episode}`;
  }
  return '';
}

export function providerRoomUrl(type, id, season, episode) {
  const watchUrl = providerWatchUrl(type, id, season, episode);
  if (!watchUrl) return '';
  const url = new URL(new URL(watchUrl).pathname, 'https://vidlink.pro');
  url.searchParams.set('player', 'jw');
  return url.href;
}
