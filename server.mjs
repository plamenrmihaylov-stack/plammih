import { createServer } from 'node:http';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);

const securityHeaders = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
};

const server = createServer((req, res) => {
  // Node's HTTP server does not add a Server banner by default. Avoid setting one here;
  // any Server header observed externally should be traced through the edge/proxy path.
  res.writeHead(200, securityHeaders);
  res.end(req.url === '/healthz' ? 'ok\n' : 'Hello World!\n');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Listening on 0.0.0.0:${port}`);
});
