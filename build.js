#!/usr/bin/env node
/**
 * YuruVerse (funami.tech) template builder.
 *
 * Expands `<!-- @include partials/foo.html key="value" -->` directives in
 * templates/ and writes the finished pages to src/ (the deployable webroot).
 * Inside an included partial, `{{key}}` placeholders are replaced with the
 * parameters given at the include site.
 *
 * Usage: node build.js
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(ROOT, 'templates');
const OUT = join(ROOT, 'src');

const INCLUDE_RE = /<!--\s*@include\s+([\w./-]+)((?:\s+[\w-]+="[^"]*")*)\s*-->/g;
const PARAM_RE = /([\w-]+)="([^"]*)"/g;

function expand(source, params = {}, depth = 0) {
  if (depth > 10) throw new Error('include depth exceeded (circular include?)');

  // Includes are expanded BEFORE {{param}} substitution, so parameter
  // values land as opaque text on the final pass and can never be
  // re-parsed as @include directives themselves.
  source = source.replace(INCLUDE_RE, (m, file, rawParams) => {
    const childParams = {};
    for (const [, k, v] of rawParams.matchAll(PARAM_RE)) childParams[k] = v;
    const path = join(TEMPLATES, file);
    if (!path.startsWith(TEMPLATES + sep)) throw new Error(`include escapes templates/: ${file}`);
    return expand(readFileSync(path, 'utf8'), childParams, depth + 1).trimEnd();
  });

  return source.replace(/\{\{([\w-]+)\}\}/g, (m, key) => {
    if (key in params) return params[key];
    console.warn(`  warning: no value for {{${key}}}`);
    return '';
  });
}

/** Expand a single template file (path relative to templates/). */
export function expandFile(relPath) {
  const source = readFileSync(join(TEMPLATES, relPath), 'utf8');
  const banner = `<!-- GENERATED from templates/${relPath} — edit there, then run \`npm run build\` -->\n`;
  return banner + expand(source);
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

export function buildAll() {
  let count = 0;
  for (const path of walk(TEMPLATES)) {
    const rel = relative(TEMPLATES, path);
    if (rel.startsWith('partials') || !rel.endsWith('.html')) continue;
    const outPath = join(OUT, rel);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, expandFile(rel));
    console.log(`  templates/${rel} -> src/${rel}`);
    count++;
  }
  console.log(`built ${count} page(s)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) buildAll();
