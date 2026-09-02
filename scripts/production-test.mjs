import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const expectedRoutes = [
  'index.html',
  '404.html',
  '.nojekyll',
  'robots.txt',
  'sitemap.xml',
  'privacidad/index.html',
  'sobre-mi/index.html',
  'proyectos/index.html',
  'muestras/index.html',
  'experiencia/index.html',
  'formacion/index.html',
  'stack/index.html',
  'cv/index.html',
  'contacto/index.html',
  'blog/index.html',
  'proyectos/sigbo/index.html',
  'proyectos/mbapo/index.html',
  'proyectos/bomberos/index.html',
  'proyectos/inspecciones-moviles/index.html'
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

await Promise.all(expectedRoutes.map(file => access(path.join(dist, ...file.split('/')))));

const index = await readFile(path.join(dist, 'index.html'), 'utf8');
const notFound = await readFile(path.join(dist, '404.html'), 'utf8');
const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
assert(index.includes('<base href="/portafolio/"'), 'El documento no define la subruta de GitHub Pages.');
assert(index.includes('https://j0nasm.github.io/portafolio/'), 'Faltan metadatos del dominio final.');
assert(notFound.includes('portfolio-redirect'), 'El 404 no conserva rutas SPA en GitHub Pages.');
assert(robots.includes('https://j0nasm.github.io/portafolio/sitemap.xml'), 'robots.txt no referencia el sitemap publicado.');
assert(!sitemap.includes('jonasemanuel.dev'), 'El sitemap conserva el dominio anterior.');

const localReferences = [...index.matchAll(/(?:href|src)="(?!https?:|mailto:|#)([^"?#]+)[^"#]*"/g)].map(match => match[1]);
for (const reference of localReferences) {
  if (reference === '/portafolio/') continue;
  const cleanReference = reference.replace(/^\//, '');
  await access(path.join(dist, ...cleanReference.split('/'))).catch(() => {
    throw new Error(`Recurso inexistente referenciado por index.html: ${reference}`);
  });
}

const publicFiles = await readdir(path.join(dist, 'public'));
assert(publicFiles.length > 0, 'El directorio de recursos públicos está vacío.');
console.log(`Producción verificada: ${expectedRoutes.length} entradas, metadatos, fallback SPA y recursos locales.`);
