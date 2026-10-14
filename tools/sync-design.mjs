#!/usr/bin/env node
//
// sync-design.mjs -- copies Design's built files into design/ and refreshes
// every page's icon sprite, from a checkout of rux-sm.github.io beside this
// one. The site serves only what is committed here, so a change to Design
// reaches it only when this is run and its result committed.
//
//   npm run sync                       from ../rux-sm.github.io/design
//   DS=<path to design> npm run sync   from another checkout
//
// THE STYLESHEET IS THE MINIFIED ONE under the name the pages link, so a
// customer downloads the smaller file and no page changes.
//
// EACH PAGE CARRIES THE ICONS IT NAMES. Design's own scanner reads the names
// out of the page and the scripts it loads, and Design's sprite gives their
// drawings; the block between a page's SPRITE markers is rewritten with them.
//
// DESIGN AS COMMITTED, never its working files: other work may be half done
// in that checkout, and this site is public. design/SOURCE names the commit.
import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DS = resolve(ROOT, process.env.DS ?? '../rux-sm.github.io/design');
if (!existsSync(join(DS, 'css/rux.min.css'))) {
  console.error(`  sync: no Design at ${DS}. Clone rux-sm.github.io beside this repository, or set DS.`);
  process.exit(1);
}
const git = (args, encoding = 'utf8') => execFileSync('git', ['-C', DS, ...args], { encoding, maxBuffer: 1 << 26 });
const committed = (path, encoding) => git(['show', `HEAD:./${path}`], encoding);

// [from, in Design] -> [to, in design/ here]
const FILES = [
  ['css/rux.min.css', 'css/rux.css'],
  ['css/rux-theme.css', 'css/rux-theme.css'],
  ['css/rux-overrides.css', 'css/rux-overrides.css'],
  ['assets/fonts/plex.css', 'assets/fonts/plex.css'],
  ['assets/fonts/IBMPlexSans-Regular-Latin1.woff2', 'assets/fonts/IBMPlexSans-Regular-Latin1.woff2'],
  ['assets/fonts/IBMPlexSans-SemiBold-Latin1.woff2', 'assets/fonts/IBMPlexSans-SemiBold-Latin1.woff2'],
  ['assets/fonts/IBMPlexMono-Regular-Latin1.woff2', 'assets/fonts/IBMPlexMono-Regular-Latin1.woff2'],
  ['assets/fonts/LICENSE.txt', 'assets/fonts/LICENSE.txt'],
  ['js/overlay.js', 'js/overlay.js'],
  ['js/ui-shell.js', 'js/ui-shell.js'],
  ['js/accordion.js', 'js/accordion.js'],
  ['LICENSE', 'LICENSE'],
  ['NOTICE', 'NOTICE'],
];

console.log('\n── design');
for (const [from, to] of FILES) {
  const at = join(ROOT, 'design', to);
  mkdirSync(dirname(at), { recursive: true });
  writeFileSync(at, committed(from, 'buffer'));
  console.log(`  design/${to}`);
}

const source = git(['rev-parse', '--short', 'HEAD']).trim();
writeFileSync(join(ROOT, 'design/SOURCE'),
  `Copied by tools/sync-design.mjs from rux-sm.github.io's design/ at commit ${source}.\nDo not edit these files here; change Design and sync again.\n`);
console.log(`  design/SOURCE  (${source})`);

console.log('\n── sprite');
const BEGIN = /<!-- SPRITE:BEGIN[\s\S]*?-->\n/;
const END = '<!-- SPRITE:END -->';
const svg = committed('assets/icons.svg').replace(/^<\?xml[^>]*\?>\s*/, '').trim();
const { symbolsFor, subset } = await import(pathToFileURL(join(DS, 'tools/lib/icon-scan.mjs')).href);
const pages = ['.', 'es'].flatMap(d => readdirSync(join(ROOT, d))
  .filter(f => f.endsWith('.html')).map(f => join(ROOT, d, f)));
for (const path of pages) {
  const name = path.slice(ROOT.length + 1);
  const html = readFileSync(path, 'utf8');
  const begin = html.match(BEGIN);
  const endAt = html.indexOf(END);
  if (!begin || endAt < begin.index) { console.log(`  ${name} — no SPRITE markers, left alone`); continue; }
  const next = html.slice(0, begin.index + begin[0].length) + subset(svg, symbolsFor(path)) + '\n' + html.slice(endAt);
  if (next === html) { console.log(`  ${name} — current`); continue; }
  writeFileSync(path, next);
  console.log(`  ${name} — rewritten`);
}
console.log('\n  synced. Run npm run check, look at the pages, and commit design/ with them.');
