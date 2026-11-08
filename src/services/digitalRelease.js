const digitalDates = {
  // https://www.universalpicturesathome.com/press-release/the-odyssey-press-release
  1368337: '2026-11-17',
};

export function upcomingDigitalRelease(mediaType, mediaId, now = new Date()) {
  if (mediaType !== 'movie' || !Object.prototype.hasOwnProperty.call(digitalDates, mediaId)) return '';
  const date = digitalDates[mediaId];
  const localDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  if (date <= localDate) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(date));
}
