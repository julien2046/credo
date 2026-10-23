import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/client');
const port = Number(process.env.PORT ?? 4300);
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
};

await stat(join(root, 'index.html'));
createServer(async (request, response) => {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405).end();
      return;
    }
    const pathname = decodeURIComponent(
      new URL(request.url ?? '/', 'http://localhost').pathname
    );
    let path = resolve(root, `.${pathname}`);
    if (path !== root && !path.startsWith(root + sep)) {
      response.writeHead(400).end();
      return;
    }
    const info = await stat(path).catch(() => null);
    if (info?.isDirectory()) path = join(path, 'index.html');
    else if (!info && !extname(pathname)) path = join(root, 'index.html');
    const data = await readFile(path);
    response.writeHead(200, {
      'Content-Type': types[extname(path)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port, 'localhost', () =>
  console.log(`Static storefront: http://localhost:${port}`)
);
