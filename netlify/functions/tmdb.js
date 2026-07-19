const { proxyTmdbRequest } = require("../../server/tmdbProxy");

exports.handler = async function handler(event) {
  const functionPrefix = "/.netlify/functions/tmdb";
  const pathname = event.path.replace(functionPrefix, "") || "/";

  return proxyTmdbRequest(pathname, event.rawQuery || "");
};
