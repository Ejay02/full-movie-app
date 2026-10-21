// Manual integration probe: public metadata and headers only, no movie download.
const { resolveStream } = require('../server/streamSource');
async function main() {
  const source = await resolveStream('movie', 313369);
  const response = await fetch(source.sourceUrl, { headers: { Referer: 'https://vixsrc.to/' } });
  const body = await response.text();
  console.log(JSON.stringify({ status: response.status, cors: response.headers.get('access-control-allow-origin'),
    type: response.headers.get('content-type'), manifest: body.slice(0, 3000) }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
