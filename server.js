/**
 * Custom Next.js server.
 *
 * Node 18+ defaults `server.requestTimeout` to 300_000 ms. Any HTTP
 * request that takes longer than 5 minutes from first byte to last
 * byte gets its socket yanked, which kills long uploads mid-stream
 * with "Error: aborted / ECONNRESET". A 2 GB file on a 3–5 MB/s
 * link takes ~7–10 minutes, so this timeout is what was cutting off
 * every upload at the 5-minute wall.
 *
 * `next start` doesn't expose Node's HTTP server to customize these
 * timeouts. This wrapper does the same thing `next start` does —
 * hand the request to Next's own handler — but first disables the
 * five-minute wall so uploads can run as long as Caddy allows (2h).
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url || "/", true));
  });

  // Let Caddy (2h read/write_timeout) be the authoritative timeout
  // for large uploads. Disable Node's defaults so they don't cut in.
  server.requestTimeout = 0;
  server.headersTimeout = 0;
  server.keepAliveTimeout = 120_000;
  server.setTimeout(0);

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
