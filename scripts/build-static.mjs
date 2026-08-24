import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all([
  cp(path.join(root, 'index.html'), path.join(output, 'index.html')),
  cp(path.join(root, '404.html'), path.join(output, '404.html')),
  cp(path.join(root, 'src'), path.join(output, 'src'), { recursive: true }),
  cp(path.join(root, 'public'), path.join(output, 'public'), { recursive: true })
]);

console.log('Build estático creado en dist/.');
