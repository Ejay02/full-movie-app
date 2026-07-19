const TMDB_BASE_URL = "https://api.themoviedb.org/3";

function getTmdbToken() {
  return process.env.TMDB_API_TOKEN;
}

function createErrorResponse(statusCode, message) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  };
}

async function proxyTmdbRequest(pathname, queryString = "") {
  const token = getTmdbToken();

  if (!token) {
    return createErrorResponse(
      500,
      "TMDB_API_TOKEN is not configured for the proxy."
    );
  }

  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const targetUrl = `${TMDB_BASE_URL}${normalizedPath}${
    queryString ? `?${queryString}` : ""
  }`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const body = await response.text();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
      },
      body,
    };
  } catch (error) {
    return createErrorResponse(502, `TMDB proxy request failed: ${error.message}`);
  }
}

module.exports = {
  proxyTmdbRequest,
};
