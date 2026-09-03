// Genera los recursos gráficos derivados: iconos PWA y la imagen Open Graph.
// No usa dependencias externas; el códec PNG y el rasterizador viven en scripts/lib.
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas, fillPolygons, pathToPolygons } from './lib/raster.mjs';
import { decodePng, encodePng, quantize, resize } from './lib/png.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDirectory = path.join(root, 'public');
const iconDirectory = path.join(publicDirectory, 'icons');

// Colores de marca, alineados con las variables --ink y --accent2 de src/styles.css.
const INK = [0x10, 0x15, 0x14];
const LIME = [0xd5, 0xf0, 0x54];

// Contorno de la «J» serif del logotipo, en una caja de diseño de 100 × 100.
// Sustituye a la dependencia tipográfica de Georgia, que no está disponible en
// todos los sistemas, y mantiene idénticos el favicon y los iconos de aplicación.
const BRAND_MARK = [
  ['M', 31, 12], ['L', 83, 12], ['L', 83, 23], ['L', 70, 23], ['L', 70, 57],
  ['C', 70, 78, 59, 90, 42, 90],
  ['C', 28, 90, 18, 82, 13, 70],
  ['C', 11, 65, 17, 61, 21, 64],
  ['C', 25, 72, 33, 78, 42, 78],
  ['C', 51, 78, 55, 70, 55, 57],
  ['L', 55, 23], ['L', 31, 23], ['Z']
];

// Proporción del lienzo ocupada por el logotipo. Los iconos «maskable» exigen que
// el contenido quepa en la zona segura central (80 % del lado), así que se usa un
// margen mayor que el del favicon.
const MASKABLE_RATIO = 0.56;

function markBounds() {
  const polygons = pathToPolygons(BRAND_MARK);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const polygon of polygons) {
    for (const [x, y] of polygon) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/** Dibuja el logotipo centrado, escalado de forma uniforme para no deformarlo. */
function renderIcon(size, ratio = MASKABLE_RATIO) {
  const bounds = markBounds();
  const scale = (size * ratio) / Math.max(bounds.width, bounds.height);
  const offsetX = (size - bounds.width * scale) / 2 - bounds.minX * scale;
  const offsetY = (size - bounds.height * scale) / 2 - bounds.minY * scale;
  const canvas = createCanvas(size, size, [...INK, 255]);
  const polygons = pathToPolygons(BRAND_MARK, ([x, y]) => [offsetX + x * scale, offsetY + y * scale]);
  fillPolygons(canvas, polygons, LIME);
  return canvas;
}

function toHex([r, g, b]) {
  return `#${[r, g, b].map(value => value.toString(16).padStart(2, '0')).join('')}`;
}

/** Reconstruye el favicon vectorial con el mismo contorno que los iconos PNG. */
function faviconSvg() {
  const bounds = markBounds();
  const scale = 64 * 0.62 / Math.max(bounds.width, bounds.height);
  const offsetX = (64 - bounds.width * scale) / 2 - bounds.minX * scale;
  const offsetY = (64 - bounds.height * scale) / 2 - bounds.minY * scale;
  const round = value => Number(value.toFixed(2));
  const commands = BRAND_MARK.map(([type, ...values]) => {
    if (type === 'Z') return 'Z';
    const mapped = [];
    for (let i = 0; i < values.length; i += 2) {
      mapped.push(round(offsetX + values[i] * scale), round(offsetY + values[i + 1] * scale));
    }
    return `${type}${mapped.join(' ')}`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${toHex(INK)}"/><path d="${commands}" fill="${toHex(LIME)}"/></svg>\n`;
}

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
// Paletas candidatas, de más rica a más pobre. Se elige la primera que entra en
// el presupuesto de peso; por debajo de 80 colores el acento lima de la marca
// empieza a lavarse, así que ese es el suelo.
const OG_PALETTES = [128, 112, 96, 88, 80];
const OG_BUDGET_BYTES = 280 * 1024;

/**
 * Ajusta la imagen Open Graph al formato 1200 × 630 recomendado por Facebook,
 * LinkedIn y WhatsApp. Es idempotente: si ya está en ese tamaño no la vuelve a
 * remuestrear, para no degradarla en ejecuciones sucesivas.
 */
async function buildOpenGraphImage() {
  const target = path.join(publicDirectory, 'og.png');
  const original = await readFile(target);
  const source = decodePng(original);

  if (source.width === OG_WIDTH && source.height === OG_HEIGHT) {
    return { skipped: true, before: original.length, after: original.length };
  }

  const sourceRatio = source.width / source.height;
  const targetRatio = OG_WIDTH / OG_HEIGHT;
  let prepared = source;

  // Recorte centrado sólo si la proporción difiere, para no estirar el diseño.
  if (Math.abs(sourceRatio - targetRatio) > 0.001) {
    const cropWidth = sourceRatio > targetRatio ? Math.round(source.height * targetRatio) : source.width;
    const cropHeight = sourceRatio > targetRatio ? source.height : Math.round(source.width / targetRatio);
    const left = Math.floor((source.width - cropWidth) / 2);
    const top = Math.floor((source.height - cropHeight) / 2);
    const data = new Uint8Array(cropWidth * cropHeight * 4);
    for (let y = 0; y < cropHeight; y += 1) {
      const from = ((top + y) * source.width + left) * 4;
      data.set(source.data.subarray(from, from + cropWidth * 4), y * cropWidth * 4);
    }
    prepared = { width: cropWidth, height: cropHeight, data };
  }

  const scaled = resize(prepared, OG_WIDTH, OG_HEIGHT);
  let encoded = null;
  let colors = 0;
  for (const candidate of OG_PALETTES) {
    colors = candidate;
    encoded = encodePng(quantize(scaled, candidate));
    if (encoded.length <= OG_BUDGET_BYTES) break;
  }

  await writeFile(target, encoded);
  return { skipped: false, before: original.length, after: encoded.length, colors };
}

const kilobytes = bytes => `${(bytes / 1024).toFixed(1)} KB`;

await mkdir(iconDirectory, { recursive: true });

const icons = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180]
];

for (const [name, size] of icons) {
  const buffer = encodePng(renderIcon(size));
  await writeFile(path.join(iconDirectory, name), buffer);
  console.log(`Icono ${name} generado: ${size}×${size}, ${kilobytes(buffer.length)}.`);
}

await writeFile(path.join(publicDirectory, 'favicon.svg'), faviconSvg(), 'utf8');
console.log('Favicon vectorial regenerado con el contorno del logotipo.');

const og = await buildOpenGraphImage();
if (og.skipped) console.log(`Imagen Open Graph ya está en ${OG_WIDTH}×${OG_HEIGHT}: ${kilobytes(og.after)}, sin cambios.`);
else console.log(`Imagen Open Graph ajustada a ${OG_WIDTH}×${OG_HEIGHT} con ${og.colors} colores: ${kilobytes(og.before)} → ${kilobytes(og.after)}.`);

const total = (await Promise.all(icons.map(async ([name]) => (await stat(path.join(iconDirectory, name))).size))).reduce((sum, size) => sum + size, 0);
console.log(`Recursos generados correctamente (${icons.length} iconos, ${kilobytes(total)}).`);
