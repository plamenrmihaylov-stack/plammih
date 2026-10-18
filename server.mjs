import { createServer } from 'node:http';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);

const server = createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok\n');
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!\n');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Listening on 0.0.0.0:${port}`);
});
