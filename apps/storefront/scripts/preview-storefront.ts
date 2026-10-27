import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spaPathPattern } from './hosting-routes';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/client');
const port = Number(process.env.PORT ?? 4300);
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
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
    let status = 200;
    if (info?.isDirectory()) path = join(path, 'index.html');
    else if (!info && spaPathPattern.test(pathname))
      path = join(root, 'index.html');
    else if (!info) {
      path = join(root, '404.html');
      status = 404;
    }
    const data = await readFile(path);
    response.writeHead(status, {
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
