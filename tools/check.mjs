#!/usr/bin/env node
//
// check.mjs -- the site's one check, run before every commit and by CI
// before every deploy. It needs nothing but this repository: Design's files
// are the copies in design/.
//
//   npm run check
//
// classes   every rux-- class a page or app.js uses is in Design's compiled
//           stylesheets, and every website- class is in app.css or
//           overrides.css. A class that resolves to nothing fails silently
//           in the browser: correct markup, no style.
// tokens    every var(--rux-*) the site's own CSS reads is defined.
// files     every relative href, src, srcset and url() names a file here.
// links     every #fragment, on the page or another, names an id there, and
//           every <use> names a symbol in the page's sprite.
// ids       no id repeats on a page.
// pages     each page has its language, a title in the site's pattern, a
//           description and share title to match, and its page in the other
//           language, named in an hreflang link both ways.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'Escamilla Tour Buses';
const read = p => readFileSync(join(ROOT, p), 'utf8');
const failed = [];
const report = (name, problems, ok) => {
  for (const p of problems) console.log(`  FAIL  ${p}`);
  console.log(`  ${problems.length ? 'FAIL' : ' ok '}  ${name.padEnd(8)}${problems.length ? `${problems.length} problem(s)` : ok}`);
  if (problems.length) failed.push(name);
};

const pages = ['.', 'es'].flatMap(d => readdirSync(join(ROOT, d))
  .filter(f => f.endsWith('.html')).map(f => (d === '.' ? f : `${d}/${f}`)));
const html = Object.fromEntries(pages.map(p => [p, read(p)]));
const SPRITE = /<!-- SPRITE:BEGIN[\s\S]*?<!-- SPRITE:END -->/;
const markup = p => html[p].replace(SPRITE, '');
const SITE_CSS = ['app.css', 'overrides.css', 'theme.css'];
const DESIGN_CSS = ['design/css/rux.css', 'design/css/rux-theme.css', 'design/css/rux-overrides.css'];

console.log('\n── site');

// CLASSES
{
  const compiled = new Set();
  for (const f of DESIGN_CSS) {
    for (const m of read(f).matchAll(/\.(rux--(?:[A-Za-z0-9_-]|\\.)+)/g)) compiled.add(m[1].replace(/\\(.)/g, '$1'));
  }
  const own = new Set();
  for (const f of ['app.css', 'overrides.css']) for (const m of read(f).matchAll(/\.(website-[A-Za-z0-9_-]+)/g)) own.add(m[1]);
  const problems = [];
  let uses = 0;
  const use = (where, name) => {
    uses++;
    if (name.startsWith('rux--') && !compiled.has(name)) problems.push(`${where}: rux class "${name}" is not in Design's compiled stylesheets`);
    if (name.startsWith('website-') && !own.has(name)) problems.push(`${where}: "${name}" is not in app.css or overrides.css`);
  };
  for (const p of pages) {
    for (const m of markup(p).matchAll(/\sclass="([^"]*)"/g)) for (const c of m[1].split(/\s+/).filter(Boolean)) use(p, c);
  }
  // A script's class names are written whole; one that ends in a hyphen is
  // the first part of a name the script finishes, and is not read alone.
  for (const m of read('app.js').matchAll(/(rux--|website-)[A-Za-z0-9_:-]*[A-Za-z0-9_]/g)) use('app.js', m[0]);
  report('classes', [...new Set(problems)], `${uses} uses resolve against ${compiled.size} compiled and ${own.size} of the site's own`);
}

// TOKENS
{
  const defined = new Set();
  for (const f of [...DESIGN_CSS, ...SITE_CSS]) for (const m of read(f).matchAll(/(--rux-[A-Za-z0-9-]+)\s*:/g)) defined.add(m[1]);
  const problems = [];
  let reads = 0;
  for (const f of SITE_CSS) {
    for (const m of read(f).matchAll(/var\((--rux-[A-Za-z0-9-]+)/g)) {
      reads++;
      if (!defined.has(m[1])) problems.push(`${f}: ${m[1]} is defined nowhere`);
    }
  }
  report('tokens', [...new Set(problems)], `${reads} var(--rux-*) reads resolve`);
}

// FILES
const target = (from, ref) => {
  const path = ref.split(/[?#]/)[0];
  if (!path) return null;
  const at = resolve(dirname(join(ROOT, from)), path);
  return existsSync(at) && statSync(at).isDirectory() ? join(at, 'index.html') : at;
};
const external = ref => /^(https?:|mailto:|tel:|data:|#|\/\/)/.test(ref);
{
  const problems = [];
  let refs = 0;
  const check = (from, ref) => {
    if (external(ref)) return;
    refs++;
    const at = target(from, ref);
    if (at && !existsSync(at)) problems.push(`${from}: "${ref}" names no file`);
  };
  for (const p of pages) {
    const m0 = markup(p);
    for (const m of m0.matchAll(/\s(?:href|src)="([^"]+)"/g)) check(p, m[1]);
    for (const m of m0.matchAll(/\ssrcset="([^"]+)"/g)) for (const part of m[1].split(',')) check(p, part.trim().split(/\s+/)[0]);
  }
  for (const f of ['app.css', 'overrides.css']) for (const m of read(f).matchAll(/url\(["']?([^"')]+)["']?\)/g)) check(f, m[1]);
  report('files', problems, `${refs} relative references on ${pages.length} pages name files here`);
}

// LINKS and IDS
{
  const ids = Object.fromEntries(pages.map(p => [p, [...html[p].matchAll(/\sid="([^"]+)"/g)].map(m => m[1])]));
  const linkProblems = [];
  const idProblems = [];
  let links = 0;
  for (const p of pages) {
    const seen = new Set();
    for (const id of ids[p]) {
      if (seen.has(id)) idProblems.push(`${p}: id "${id}" repeats`);
      seen.add(id);
    }
    for (const m of markup(p).matchAll(/\shref="([^"#]*)#([^"]+)"/g)) {
      const [, file, frag] = m;
      if (/^(https?:|mailto:|tel:)/.test(file)) continue;
      links++;
      const other = file ? relative(ROOT, target(p, file)) : p;
      if (!ids[other]?.includes(frag)) linkProblems.push(`${p}: "${file}#${frag}" names no id ${file ? `in ${other}` : 'on the page'}`);
    }
    for (const m of markup(p).matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)) {
      for (const id of m[1].split(/\s+/)) {
        links++;
        if (!seen.has(id)) linkProblems.push(`${p}: aria reference "${id}" names no id`);
      }
    }
  }
  report('links', linkProblems, `${links} fragments and references resolve`);
  report('ids', idProblems, 'unique on every page');
}

// PAGES
{
  const problems = [];
  const one = (p, re) => html[p].match(re)?.[1];
  for (const p of pages) {
    const es = p.startsWith('es/');
    const name = es ? p.slice(3) : p;
    const lang = one(p, /<html lang="([^"]+)"/);
    if (lang !== (es ? 'es' : 'en')) problems.push(`${p}: <html lang="${lang}">, not ${es ? 'es' : 'en'}`);
    const title = one(p, /<title>([^<]*)<\/title>/);
    const front = name === 'index.html';
    if (front ? title !== SITE : !title?.endsWith(` — ${SITE}`)) problems.push(`${p}: title "${title}" is not ${front ? `"${SITE}"` : `"Page — ${SITE}"`}`);
    if (!one(p, /<meta name="description" content="([^"]+)">/)) problems.push(`${p}: no description`);
    if (name === '404.html') continue;
    if (one(p, /<meta property="og:title" content="([^"]+)">/) !== title) problems.push(`${p}: its share title is not its title`);
    const counterpart = es ? name : `es/${name}`;
    if (!html[counterpart]) problems.push(`${p}: no ${counterpart} in the other language`);
    for (const l of ['en', 'es']) {
      const href = one(p, new RegExp(`<link rel="alternate" hreflang="${l}" href="([^"]+)">`));
      const want = l === (es ? 'es' : 'en') ? p : counterpart;
      if (!href || relative(ROOT, target(p, href)) !== want) problems.push(`${p}: hreflang ${l} is "${href}", not ${want}`);
    }
  }
  report('pages', problems, `${pages.length} pages, each titled, described and paired with its other language`);
}

console.log(failed.length ? `\n  check FAILED: ${failed.join(', ')}` : '\n  check passed.');
process.exit(failed.length ? 1 : 0);
