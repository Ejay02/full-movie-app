require("dotenv").config();
const http = require("http");
const { proxyTmdbRequest } = require("./tmdbProxy");
const { streamResponse } = require("./streamSource");

const PORT = process.env.TMDB_PROXY_PORT || 3001;
const API_PREFIX = "/api/tmdb";

const server = http.createServer(async (req, res) => {
  if (req.url && new URL(req.url, 'http://localhost').pathname === '/api/stream') {
    const params = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams);
    const result = await streamResponse(params, req.method);
    res.writeHead(result.statusCode, result.headers);
    res.end(result.body);
    return;
  }
  if (!req.url || !req.url.startsWith(API_PREFIX)) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found." }));
    return;
  }

  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Only GET requests are supported." }));
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname.replace(API_PREFIX, "") || "/";
  const result = await proxyTmdbRequest(pathname, url.searchParams.toString());

  res.writeHead(result.statusCode, result.headers);
  res.end(result.body);
});

server.listen(PORT, () => {
  console.log(`TMDB proxy listening on http://localhost:${PORT}${API_PREFIX}`);
});
