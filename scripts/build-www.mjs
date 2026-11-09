// Copies the web app into www/, the folder Capacitor packs into the Android app.
//
// Only the files the app needs go in: no notes, no service worker (the Android
// app has its files on the phone already), no tests. Run with `npm run build`,
// or `npm run sync` to also copy them into the Android project.
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');

const FILES = ['index.html', 'privacy.html', 'manifest.json'];
const DIRS = ['icons', 'vendor', 'fonts', 'samples'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const f of FILES) cpSync(join(root, f), join(out, f));
for (const d of DIRS) {
  cpSync(join(root, d), join(out, d), {
    recursive: true,
    // The icon generators are build tools, not app files.
    filter: src => !src.endsWith('.py'),
  });
}
if (!existsSync(join(out, 'index.html'))) throw new Error('www/index.html missing');
console.log('www/ ready:', [...FILES, ...DIRS.map(d => d + '/')].join(' '));
