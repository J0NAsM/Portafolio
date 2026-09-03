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
  'service-worker.js',
  'public/og.png',
  'public/site.webmanifest',
  'public/icons/icon-192.png',
  'public/icons/icon-512.png',
  'public/icons/apple-touch-icon.png',
  'privacidad/index.html',
  'sobre-mi/index.html',
  'proyectos/index.html',
  'muestras/index.html',
  'experiencia/index.html',
  'formacion/index.html',
  'stack/index.html',
  'cv/index.html',
  'contacto/index.html',
  'proyectos/portfolio/index.html',
  'proyectos/sigbo/index.html',
  'proyectos/mbapo/index.html',
  'proyectos/bomberos/index.html',
  'proyectos/inspecciones-moviles/index.html'
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

await Promise.all(expectedRoutes.map(file => access(path.join(dist, ...file.split('/'))).catch(() => {
  throw new Error(`Falta en la compilación: ${file}.`);
})));

const index = await readFile(path.join(dist, 'index.html'), 'utf8');
const notFound = await readFile(path.join(dist, '404.html'), 'utf8');
const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const portfolioCase = await readFile(path.join(dist, 'proyectos', 'portfolio', 'index.html'), 'utf8');

// La subruta y el número de páginas se leen del propio resultado, no se fijan aquí.
const basePath = index.match(/<base href="([^"]+)"/)?.[1];
assert(basePath, 'El documento no define la subruta de publicación.');
async function countPages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const counts = await Promise.all(entries.map(async entry => {
    if (entry.isDirectory()) return countPages(path.join(directory, entry.name));
    return entry.name === 'index.html' ? 1 : 0;
  }));
  return counts.reduce((sum, value) => sum + value, 0);
}
const expectedPages = await countPages(dist);

assert(index.includes('<base href="/Portafolio/"'), 'El documento no define la subruta de GitHub Pages.');
assert(index.includes('https://j0nasm.github.io/Portafolio/'), 'Faltan metadatos del dominio final.');
assert(index.includes('<title>Jonas Martínez — Desarrollo de software para operaciones reales</title>'), 'La portada no tiene metadatos específicos.');
assert(portfolioCase.includes('<title>Portfolio profesional — Caso de estudio | Jonas Martínez</title>'), 'El caso público no tiene un título específico.');
assert(portfolioCase.includes('<link rel="canonical" href="https://j0nasm.github.io/Portafolio/proyectos/portfolio"'), 'El caso público no tiene su URL canónica.');
assert(notFound.includes('portfolio-redirect'), 'El 404 no conserva rutas SPA en GitHub Pages.');
assert(robots.includes('https://j0nasm.github.io/Portafolio/sitemap.xml'), 'robots.txt no referencia el sitemap publicado.');
assert(!sitemap.includes('jonasemanuel.dev'), 'El sitemap conserva el dominio anterior.');
assert(!sitemap.includes('/blog'), 'El sitemap no debe anunciar un blog sin publicaciones.');

// El sitemap generado debe cubrir exactamente las rutas construidas.
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert(sitemapUrls.length === expectedPages, `El sitemap anuncia ${sitemapUrls.length} URLs y el build generó ${expectedPages} páginas.`);
for (const url of sitemapUrls) {
  const route = new URL(url).pathname.replace(basePath, '').replace(/\/$/, '');
  const target = route ? path.join(dist, ...route.split('/'), 'index.html') : path.join(dist, 'index.html');
  await access(target).catch(() => { throw new Error(`El sitemap anuncia una ruta sin página: ${url}.`); });
}

// Tipografías locales: ninguna petición a terceros debe sobrevivir al build.
assert(!/fonts\.(googleapis|gstatic)\.com/.test(index), 'La página publicada no debe pedir tipografías a Google.');
const fontsCss = await readFile(path.join(dist, 'src', 'fonts.css'), 'utf8');
for (const reference of [...fontsCss.matchAll(/url\(\.\.\/([^)]+)\)/g)].map(match => match[1])) {
  await access(path.join(dist, ...reference.split('/'))).catch(() => {
    throw new Error(`fonts.css referencia una tipografía inexistente: ${reference}.`);
  });
}

// GitHub Pages no envía cabeceras propias: la política debe viajar en el documento.
for (const [name, page] of [['portada', index], ['404', notFound]]) {
  assert(/http-equiv="Content-Security-Policy"/.test(page), `La página ${name} no declara una Content-Security-Policy.`);
}
assert(!notFound.includes('log-404'), 'El 404 estático no debe cargar el registro de errores del servidor.');
assert(notFound.includes(`data-site-base="${basePath}"`), 'El 404 estático no recibió la subruta de publicación.');

// La imagen para compartir debe quedar con URL absoluta en todas las páginas.
for (const [name, page] of [['portada', index], ['caso público', portfolioCase]]) {
  assert(/<meta property="og:image" content="https:\/\/[^"]+\/public\/og\.png"/.test(page), `La ${name} no declara la imagen Open Graph con URL absoluta.`);
  assert(page.includes('<meta property="og:image:width" content="1200"'), `La ${name} no declara el ancho de la imagen para compartir.`);
}

// El service worker instala su caché con cache.addAll: si un recurso del APP_SHELL
// no existe, la instalación falla entera y el sitio se queda sin modo offline.
const serviceWorker = await readFile(path.join(dist, 'service-worker.js'), 'utf8');
const shell = serviceWorker.match(/const APP_SHELL = \[([\s\S]*?)\]\.map/)?.[1];
assert(shell, 'No se pudo leer el APP_SHELL del service worker.');
const shellEntries = [...shell.matchAll(/'([^']*)'/g)].map(match => match[1]).filter(Boolean);
assert(shellEntries.length > 0, 'El APP_SHELL del service worker está vacío.');
for (const entry of shellEntries) {
  await access(path.join(dist, ...entry.split('/'))).catch(() => {
    throw new Error(`El service worker cachea un recurso inexistente: ${entry}.`);
  });
}

const localReferences = [...index.matchAll(/(?:href|src)="(?!https?:|mailto:|#)([^"?#]+)[^"#]*"/g)].map(match => match[1]);
for (const reference of localReferences) {
  if (reference === '/Portafolio/') continue;
  const cleanReference = reference.replace(/^\//, '');
  await access(path.join(dist, ...cleanReference.split('/'))).catch(() => {
    throw new Error(`Recurso inexistente referenciado por index.html: ${reference}`);
  });
}

const publicFiles = await readdir(path.join(dist, 'public'));
assert(publicFiles.length > 0, 'El directorio de recursos públicos está vacío.');
console.log(`Producción verificada: ${expectedRoutes.length} entradas, metadatos, fallback SPA y recursos locales.`);
