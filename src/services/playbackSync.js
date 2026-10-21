export function mediaKey(media, provider = "") {
  if (!media) return "";
  return [media.mediaType, media.mediaId, media.season || 1, media.episode || 1,
    media.sourceUrl || provider, media.timestamp || 0].join(":");
}

export function playbackPosition(state, now, duration = Infinity) {
  const elapsed = state?.playing ? Math.max(0, (now - state.updatedAt) / 1000) : 0;
  return Math.min(Number.isFinite(duration) ? duration : Infinity,
    Math.max(0, (Number(state?.position) || 0) + elapsed));
}

export function acceptPlayerEvent(event, frame, url, media) {
  if (!frame || event.source !== frame.contentWindow || event.origin !== new URL(url).origin) return null;
  let payload = event.data;
  try { if (typeof payload === "string") payload = JSON.parse(payload); } catch (_) { return null; }
  const data = payload?.type === "PLAYER_EVENT" ? payload.data : null;
  if (!data || !["play", "pause", "seeked", "ended", "timeupdate"].includes(data.event)) return null;
  if (!Number.isFinite(data.currentTime) || data.currentTime < 0) return null;
  const id = data.tmdbId || data.mtmdbId;
  if (id && String(id) !== String(media.mediaId)) return null;
  if (data.mediaType && data.mediaType !== media.mediaType) return null;
  if (media.mediaType === "tv" &&
      ((data.season && Number(data.season) !== Number(media.season || 1)) ||
       (data.episode && Number(data.episode) !== Number(media.episode || 1)))) return null;
  return data;
}
