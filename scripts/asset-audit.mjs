import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from './lib/png.mjs';

const publicDirectory = path.resolve(fileURLToPath(new URL('../public', import.meta.url)));

// Presupuestos de peso. El de Open Graph es el crítico: WhatsApp y LinkedIn
// descartan o recortan las vistas previas demasiado pesadas.
const maxImageBytes = 400_000;
const maxOpenGraphBytes = 300_000;
const maxIconBytes = 60_000;
const maxFontBytes = 60_000;
const maxFontsTotalBytes = 160_000;
const maxPublicBytes = 700_000;

// Formato recomendado por Facebook, LinkedIn, WhatsApp y X para la tarjeta grande.
const openGraphSize = { width: 1200, height: 630 };
const requiredIcons = [
  ['icons/icon-192.png', 192],
  ['icons/icon-512.png', 512],
  ['icons/apple-touch-icon.png', 180]
];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => entry.isDirectory() ? filesIn(path.join(directory, entry.name)) : [path.join(directory, entry.name)]));
  return nested.flat();
}

function assert(condition, message) { if (!condition) throw new Error(message); }

const kilobytes = bytes => `${(bytes / 1024).toFixed(1)} KB`;

const files = await filesIn(publicDirectory);
const images = files.filter(file => /\.(?:png|jpe?g|webp|avif|svg)$/i.test(file));
for (const image of images) {
  const size = (await stat(image)).size;
  const name = path.relative(publicDirectory, image).split(path.sep).join('/');
  assert(size <= maxImageBytes, `El recurso ${name} pesa ${kilobytes(size)} y supera el límite de ${kilobytes(maxImageBytes)}.`);
}

// Imagen Open Graph: peso, formato y proporción exactos.
const openGraphPath = path.join(publicDirectory, 'og.png');
const openGraph = await readFile(openGraphPath).catch(() => null);
assert(openGraph, 'Falta public/og.png, necesaria para las vistas previas al compartir.');
assert(
  openGraph.length <= maxOpenGraphBytes,
  `og.png pesa ${kilobytes(openGraph.length)} y supera el límite de ${kilobytes(maxOpenGraphBytes)}. Ejecuta npm run assets para regenerarla.`
);
const openGraphImage = decodePng(openGraph);
assert(
  openGraphImage.width === openGraphSize.width && openGraphImage.height === openGraphSize.height,
  `og.png mide ${openGraphImage.width}×${openGraphImage.height} y debe medir ${openGraphSize.width}×${openGraphSize.height}.`
);

// Iconos de aplicación: presencia, dimensiones cuadradas y peso.
for (const [relative, size] of requiredIcons) {
  const iconPath = path.join(publicDirectory, ...relative.split('/'));
  const icon = await readFile(iconPath).catch(() => null);
  assert(icon, `Falta public/${relative}, necesario para instalar la aplicación.`);
  assert(icon.length <= maxIconBytes, `public/${relative} pesa ${kilobytes(icon.length)} y supera el límite de ${kilobytes(maxIconBytes)}.`);
  const decoded = decodePng(icon);
  assert(
    decoded.width === size && decoded.height === size,
    `public/${relative} mide ${decoded.width}×${decoded.height} y debe medir ${size}×${size}.`
  );
}

// Tipografías auto-alojadas: el navegador solo descarga los subconjuntos que
// necesita, pero el service worker precarga todos, así que el conjunto se acota.
const fonts = files.filter(file => file.endsWith('.woff2'));
assert(fonts.length > 0, 'Faltan las tipografías auto-alojadas en public/fonts.');
for (const font of fonts) {
  const size = (await stat(font)).size;
  const name = path.relative(publicDirectory, font).split(path.sep).join('/');
  assert(size <= maxFontBytes, `public/${name} pesa ${kilobytes(size)} y supera el límite de ${kilobytes(maxFontBytes)}.`);
}
const fontBytes = (await Promise.all(fonts.map(async font => (await stat(font)).size))).reduce((sum, size) => sum + size, 0);
assert(fontBytes <= maxFontsTotalBytes, `Las tipografías suman ${kilobytes(fontBytes)} y superan el límite de ${kilobytes(maxFontsTotalBytes)}.`);

const totalBytes = (await Promise.all(files.map(async file => (await stat(file)).size))).reduce((sum, size) => sum + size, 0);
assert(totalBytes <= maxPublicBytes, `Los recursos públicos suman ${kilobytes(totalBytes)} y superan el límite de ${kilobytes(maxPublicBytes)}.`);

console.log(`Recursos verificados: ${files.length} archivos públicos, ${kilobytes(totalBytes)} en total (og.png ${kilobytes(openGraph.length)}, ${requiredIcons.length} iconos, ${fonts.length} tipografías ${kilobytes(fontBytes)}).`);
