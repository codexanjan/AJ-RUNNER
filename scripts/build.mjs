import { mkdir, copyFile } from 'node:fs/promises';
import { assets } from './assets.mjs';
await mkdir('dist', { recursive: true });
for (const file of assets) await copyFile(file, `dist/${file}`);
console.log(`Built ${assets.length} public game files in dist/.`);
