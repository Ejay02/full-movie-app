export function isNewWatchRequest(previous, next, key) {
  return !!(previous && next?.playing && next.mediaKey === key && next.watchRequestId && next.watchRequestId !== previous.watchRequestId);
}
export function mediaKey(media, provider = "") {
  if (!media) return "";
  if (media.resumeKey) return media.resumeKey;
  return [media.mediaType, media.mediaId, media.season || 1, media.episode || 1,
    media.sourceUrl || provider, media.timestamp || 0].join(":");
}

// Preserve the saved position key when retiring a third-party iframe player.
export function nativeRoomMedia(media) {
  if (!media) return null;
  const legacy = media.providerId && media.providerId !== 'native';
  if (!legacy && !media.useEmbed) return media;
  const next = { ...media, resumeKey: mediaKey(media, media.providerId || ''), providerId: 'native', playerVersion: 4, useEmbed: false };
  if (media.useEmbed) delete next.sourceUrl;
  return next;
}

export function playbackPosition(state, now, duration = Infinity) {
  const elapsed = state?.playing ? Math.max(0, (now - state.updatedAt) / 1000) : 0;
  return Math.min(Number.isFinite(duration) ? duration : Infinity,
    Math.max(0, (Number(state?.position) || 0) + elapsed));
}
