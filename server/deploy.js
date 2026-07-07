import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { extname, join } from 'path';

const PORT = process.env.PORT || 3000;
const ROOT = new URL('..', import.meta.url).pathname;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.json': 'application/json',
};

const server = createServer((req, res) => {
  let path = req.url === '/' ? '/index.html' : req.url;
  const filePath = join(ROOT, path);

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('404 Not Found');
    return;
  }

  const ext = extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  const content = readFileSync(filePath);

  res.writeHead(200, {
    'Content-Type': mime,
    'Cache-Control': 'no-cache',
  });
  res.end(content);
});

server.listen(PORT, () => {
  console.log(`Pixel Dungeon server running at http://localhost:${PORT}`);
});
