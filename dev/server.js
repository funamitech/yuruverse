#!/usr/bin/env node
/**
 * YuruVerse dev server.
 *
 * Serves src/ like the production nginx does. Pages that exist in
 * templates/ are re-expanded on every request, so template edits show up
 * on refresh without running `npm run build` (the CSS still needs
 * `npm run build-css` running alongside).
 *
 * Usage: node dev/server.js   (then open http://localhost:8080)
 *        PORT=8101 node dev/server.js
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, normalize, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expandFile } from '../build.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const TEMPLATES = join(ROOT, 'templates');
const PORT = process.env.PORT || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

/** Read a page, preferring live template expansion over the built file. */
function page(rel) {
  if (existsSync(join(TEMPLATES, rel))) {
    try {
      return expandFile(rel);
    } catch (err) {
      console.error(`template error in ${rel}:`, err.message);
    }
  }
  return readFileSync(join(SRC, rel), 'utf8');
}

function send(res, status, body, type = 'text/html; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let urlPath;
  try {
    urlPath = decodeURIComponent(url.pathname);
  } catch {
    // Malformed % escape ("/%", "/%FF") must not crash the process.
    return send(res, 400, 'bad request', 'text/plain');
  }
  console.log(`${req.method} ${urlPath}`);

  const safe = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(SRC, safe);
  if (!filePath.startsWith(SRC)) return send(res, 400, 'bad request', 'text/plain');

  if (urlPath === '/' || urlPath === '/index.html') return send(res, 200, page('index.html'));

  // Static files and plain pages
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const ext = extname(filePath).toLowerCase();
    if (ext === '.html') return send(res, 200, page(safe.replace(/\\/g, '/')));
    return send(res, 200, readFileSync(filePath), MIME[ext] || 'application/octet-stream');
  }

  send(res, 404, page('error/404.html'));
}).listen(PORT, () => {
  console.log(`YuruVerse dev server: http://localhost:${PORT}`);
  console.log('Append ?theme=dark or ?theme=light to any page to force a color scheme.');
});
