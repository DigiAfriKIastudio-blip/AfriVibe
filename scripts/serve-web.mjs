#!/usr/bin/env node
/**
 * Petit serveur statique pour prévisualiser l'export web d'AfriVibe.
 *
 *   npx expo export --platform web --output-dir dist
 *   node scripts/serve-web.mjs          # http://localhost:3000
 *
 * Ce script est un outil de développement : l'application cible reste Android.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const root = process.argv.includes('--dir')
  ? process.argv[process.argv.indexOf('--dir') + 1]
  : 'dist';
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.map': 'application/json; charset=utf-8',
};

function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0] ?? '/')).replace(/^(\.\.[/\\])+/, '');
  const candidates = [
    join(root, clean),
    join(root, `${clean}.html`),
    join(root, clean, 'index.html'),
    join(root, 'index.html'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

const server = createServer((request, response) => {
  const file = resolveFile(request.url ?? '/');
  if (!file) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('404');
    return;
  }
  response.writeHead(200, {
    'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
  });
  createReadStream(file).pipe(response);
});

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`AfriVibe (web) : http://${host}:${port}`);
});
