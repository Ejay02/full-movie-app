const BASE = 'https://vixsrc.to';
const cache = new Map();

function mediaPath(type, id, season, episode) {
  if (!['movie', 'tv'].includes(type) || !/^[1-9]\d{0,9}$/.test(String(id))) throw new Error('Invalid title.');
  if (type === 'movie') return `/api/movie/${id}`;
  if (![season, episode].every(value => /^[1-9]\d{0,3}$/.test(String(value)))) throw new Error('Invalid episode.');
  return `/api/tv/${id}/${season}/${episode}`;
}

function parseSource(html) {
  // Parse only the public playlist metadata, never execute provider scripts.
  const metadata = html.match(/window\.masterPlaylist\s*=\s*\{([\s\S]*?url\s*:\s*['"][^'"]+['"])/)?.[1];
  const token = metadata?.match(/['"]token['"]\s*:\s*['"]([^'"]+)/)?.[1];
  const expires = metadata?.match(/['"]expires['"]\s*:\s*['"](\d+)/)?.[1];
  const rawUrl = metadata?.match(/url\s*:\s*['"]([^'"]+)/)?.[1];
  if (!token || !expires || !rawUrl) throw new Error('The stream source is unavailable for this title.');
  const url = new URL(rawUrl);
  if (url.origin !== BASE || !url.pathname.startsWith('/playlist/')) throw new Error('Unexpected stream source.');
  url.searchParams.set('token', token);
  url.searchParams.set('expires', expires);
  url.searchParams.set('h', '1');
  url.searchParams.set('lang', 'en');
  return { sourceUrl: url.href, sourceType: 'video', mimeType: 'application/vnd.apple.mpegurl', expiresAt: Number(expires) * 1000 };
}

async function resolveStream(type, id, season, episode, request = fetch) {
  const path = mediaPath(type, id, season, episode);
  const cached = cache.get(path);
  if (cached && cached.expiresAt > Date.now() + 60000 && cached.cachedAt > Date.now() - 300000) return cached;
  const get = async (url) => {
    const response = await request(url, { signal: AbortSignal.timeout(15000), redirect: 'error',
      headers: { Referer: `${BASE}/`, 'User-Agent': 'Mozilla/5.0', Accept: '*/*' } });
    if (!response.ok) throw new Error('The stream source did not respond. Try again shortly.');
    return response;
  };
  const metadata = await (await get(BASE + path)).json();
  const embed = new URL(metadata.src, BASE);
  if (embed.origin !== BASE || !embed.pathname.startsWith('/embed/')) throw new Error('Unexpected stream response.');
  const source = parseSource(await (await get(embed.href)).text());
  if (source.expiresAt < Date.now() + 60000) throw new Error('The stream has expired. Please retry.');
  if (cache.size > 100) cache.clear();
  const result = { ...source, cachedAt: Date.now(), subtitleTracks: [] };
  cache.set(path, result);
  return result;
}

async function streamResponse(params, method = 'GET') {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (method !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ message: 'Only GET is supported.' }) };
  try {
    const { type, id, season, episode } = params;
    mediaPath(type, id, season, episode);
    const source = await resolveStream(type, id, season, episode);
    return { statusCode: 200, headers, body: JSON.stringify(source) };
  } catch (error) {
    return { statusCode: error.message.startsWith('Invalid') ? 400 : 502, headers,
      body: JSON.stringify({ message: error.message.startsWith('Invalid') ? error.message : 'This stream is unavailable right now. Retry or choose a backup server.' }) };
  }
}

module.exports = { mediaPath, parseSource, resolveStream, streamResponse };
