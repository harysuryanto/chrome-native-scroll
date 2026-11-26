/* global Bun */
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('../', import.meta.url));
const fixturesDir = resolve(rootDir, 'fixtures');
const nodeModulesDir = resolve(rootDir, 'node_modules');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

const port = Number(process.env.FIXTURES_PORT ?? '4173');

const server = Bun.serve({
  hostname: '127.0.0.1',
  port,
  async fetch(request) {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';

    // Serve pinned dev-only library builds from /vendor/<pkg>/... for local E2E fixtures only.
    const isVendor = pathname.startsWith('/vendor/');
    const baseDir = isVendor ? nodeModulesDir : fixturesDir;
    const relativePath = isVendor ? pathname.slice('/vendor/'.length) : pathname.slice(1);
    const filePath = resolve(baseDir, relativePath);

    if (!filePath.startsWith(baseDir)) {
      return new Response('Forbidden', { status: 403 });
    }

    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      return new Response('Not Found', { status: 404 });
    }

    const mime = MIME_TYPES[extname(filePath)] ?? 'application/octet-stream';
    return new Response(file, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'no-store',
      },
    });
  },
});

console.log(`NativeScroll fixtures server listening at http://127.0.0.1:${server.port}/`);
