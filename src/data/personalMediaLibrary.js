const personalMediaLibrary = [
  // Add your privately owned or self-hosted media sources here.
  // Supported source types:
  // - video: direct MP4/WebM file URLs for the native HTML5 player
  // - embed: embeddable player URLs you control
  //
  // Example:
  // {
  //   mediaType: "movie",
  //   mediaId: 603,
  //   sourceType: "video",
  //   sourceUrl: "https://cdn.example.com/movies/the-matrix.mp4",
  //   mimeType: "video/mp4",
  //   subtitleTracks: [
  //     {
  //       src: "https://cdn.example.com/movies/the-matrix-en.vtt",
  //       srclang: "en",
  //       label: "English",
  //       default: true,
  //     },
  //   ],
  // },
];

function createLibraryKey(mediaType, mediaId) {
  return `${mediaType}-${String(mediaId)}`;
}

function normalizeLibraryItem(item) {
  return {
    ...item,
    sourceType: item.sourceType || "video",
    subtitleTracks: Array.isArray(item.subtitleTracks) ? item.subtitleTracks : [],
  };
}

const personalMediaLibraryIndex = personalMediaLibrary.reduce((accumulator, item) => {
  accumulator[createLibraryKey(item.mediaType, item.mediaId)] =
    normalizeLibraryItem(item);
  return accumulator;
}, {});

export function getPersonalMediaSource(mediaType, mediaId) {
  return personalMediaLibraryIndex[createLibraryKey(mediaType, mediaId)] || null;
}

export function getPersonalMediaLibraryEntries() {
  return personalMediaLibrary.map(normalizeLibraryItem);
}
