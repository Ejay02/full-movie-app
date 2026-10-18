const { proxyTmdbRequest } = require("../../server/tmdbProxy");

exports.handler = async function handler(event) {
  // Strip either prefix depending on whether Netlify passes the original
  // path (/api/tmdb/...) or the rewritten path (/.netlify/functions/tmdb/...)
  const pathname = event.path
    .replace(/^\/.netlify\/functions\/tmdb/, "")
    .replace(/^\/api\/tmdb/, "") || "/";

  return proxyTmdbRequest(pathname, event.rawQuery || "");
};
