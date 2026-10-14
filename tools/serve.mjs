#!/usr/bin/env node
//
// serve.mjs -- the site at http://localhost:8645/, loopback only, as GitHub
// Pages serves it once it has the company's address: this folder is the
// site's root, a folder answers with its index.html, and a missing page
// answers with 404.html. Nothing is cached, so a reload shows an edit.
//
//   npm run serve
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 8645);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

async function file(path) {
  try {
    const s = await stat(path);
    return s.isDirectory() ? file(join(path, 'index.html')) : path;
  } catch { return null; }
}

// An address the browser would never send, such as one starting `//`, is read
// as far as it can be and answered, never allowed to stop the server.
createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url.replace(/^\/+/, '/'), 'http://localhost').pathname);
    const asked = resolve(ROOT, `.${url}`);
    const found = (asked === ROOT || asked.startsWith(ROOT + sep)) && !url.includes('/.') ? await file(asked) : null;
    const path = found ?? join(ROOT, '404.html');
    res.writeHead(found ? 200 : 404, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(path));
  } catch {
    res.writeHead(400, { 'content-type': 'text/plain' }).end('400 bad address');
  }
}).listen(PORT, 'localhost', () => console.log(`  the site: http://localhost:${PORT}/`));
