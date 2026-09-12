import { readFile, access } from 'node:fs/promises';
import { Script } from 'node:vm';
import assert from 'node:assert/strict';
import { assets } from './assets.mjs';
for (const file of assets) {
  await access(file);
  if (file.endsWith('.js')) new Script(await readFile(file, 'utf8'), { filename: file });
}
const html = await readFile('index.html', 'utf8');
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const file = match[1].split('?')[0];
  if (!file.startsWith('http') && !file.startsWith('#')) await access(file);
}
const scripts = [...html.matchAll(/<script([^>]*)src="([^"]+)"/g)];
assert.deepEqual(scripts.map(match => match[2].split('?')[0]), ['runner.js','district.js','extras.js','bootstrap.js']);
assert(scripts.every(match => /\bdefer\b/.test(match[1])), 'Game scripts must remain deferred.');
const runner = await readFile('runner.js','utf8');
assert(!runner.includes('requestAnimationFrame('), 'Only bootstrap may start the animation loop.');
console.log('JavaScript, asset references, and startup order checks passed.');
