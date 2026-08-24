import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDirectory = path.resolve(fileURLToPath(new URL('../public', import.meta.url)));
const maxImageBytes = 1_500_000;

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => entry.isDirectory() ? filesIn(path.join(directory, entry.name)) : [path.join(directory, entry.name)]));
  return nested.flat();
}

function assert(condition, message) { if (!condition) throw new Error(message); }

const files = await filesIn(publicDirectory);
const images = files.filter(file => /\.(?:png|jpe?g|webp|avif|svg)$/i.test(file));
for (const image of images) {
  const size = (await stat(image)).size;
  assert(size <= maxImageBytes, `El recurso ${path.relative(publicDirectory, image)} supera 1,5 MB.`);
}

const totalBytes = (await Promise.all(files.map(async file => (await stat(file)).size))).reduce((sum, size) => sum + size, 0);
assert(images.some(file => file.endsWith('og.png')), 'Falta la imagen Open Graph disponible para configurar el dominio definitivo.');
console.log(`Recursos verificados: ${files.length} archivos públicos, ${(totalBytes / 1024).toFixed(1)} KB en total.`);
