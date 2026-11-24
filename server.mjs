import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const publicDir = join(dirname(fileURLToPath(import.meta.url)), 'public');

const routes = new Map([
  ['/', { file: 'index.html', type: 'text/html; charset=utf-8' }],
  ['/robots.txt', { file: 'robots.txt', type: 'text/plain; charset=utf-8' }],
  ['/sitemap.xml', { file: 'sitemap.xml', type: 'application/xml; charset=utf-8' }],
]);

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
};

const server = createServer(async (req, res) => {
  const method = req.method ?? 'GET';
  const url = new URL(req.url ?? '/', 'http://localhost');

  if (url.pathname === '/healthz') {
    res.writeHead(200, {
      ...securityHeaders,
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(method === 'HEAD' ? undefined : 'ok\n');
    return;
  }

  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405, { ...securityHeaders, 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' });
    res.end(method === 'HEAD' ? undefined : 'Method Not Allowed\n');
    return;
  }

  const route = routes.get(url.pathname);
  if (!route) {
    res.writeHead(404, { ...securityHeaders, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(method === 'HEAD' ? undefined : 'Not Found\n');
    return;
  }

  try {
    const body = await readFile(join(publicDir, route.file));
    res.writeHead(200, {
      ...securityHeaders,
      'Content-Type': route.type,
      'Cache-Control': route.file === 'index.html' ? 'public, max-age=300' : 'public, max-age=3600',
    });
    res.end(method === 'HEAD' ? undefined : body);
  } catch (error) {
    console.error('Failed to serve public asset:', error);
    res.writeHead(500, { ...securityHeaders, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(method === 'HEAD' ? undefined : 'Internal Server Error\n');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Listening on 0.0.0.0:${port}`);
});
