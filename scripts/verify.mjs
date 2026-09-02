import { access, readFile } from 'node:fs/promises';
import { normalizeBlogPost } from '../lib/blog-store.mjs';
const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const data = await readFile(new URL('../src/data.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const visualCss = await readFile(new URL('../src/visual-evidence.css', import.meta.url), 'utf8');
const blogCss = await readFile(new URL('../src/blog.css', import.meta.url), 'utf8');
const manifest = await readFile(new URL('../public/site.webmanifest', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
const server = await readFile(new URL('../server.js', import.meta.url), 'utf8');
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const routes = ['/', '/sobre-mi', '/proyectos', '/blog', '/muestras', '/experiencia', '/formacion', '/stack', '/cv', '/contacto'];
const forbidden = [/Lorem ipsum/i, /password\s*[:=]/i, /api[_-]?key\s*[:=]/i, /secret\s*[:=]/i];

function assert(condition, message) { if (!condition) throw new Error(message); }
assert(!/\bimport\b|\bexport\b/.test(main + data), 'El portfolio debe ejecutarse sin módulos ni bundler.');
assert(data.includes('window.portfolioData'), 'Los datos públicos deben estar disponibles para JavaScript clásico.');
assert((data.match(/slug:/g) || []).length === 4, 'Deben existir los cuatro proyectos iniciales.');
for (const route of routes) assert(main.includes(`'${route}'`), `Falta la ruta ${route}.`);
for (const expression of forbidden) assert(!expression.test(main) && !expression.test(html), `Posible contenido no publicable: ${expression}.`);
assert(html.includes('application/ld+json'), 'Faltan datos estructurados.');
assert(html.includes('https://j0nasm.github.io/portafolio/'), 'Falta configurar el dominio de GitHub Pages.');
assert(html.includes('color-scheme') && html.includes('preconnect'), 'Faltan metadatos de tema u optimizaciones de carga.');
assert(main.includes('data-print-cv') && main.includes('window.print()'), 'Falta la impresión del CV ATS.');
assert(main.includes('aria-current="page"') && main.includes('aria-pressed'), 'Faltan estados accesibles de navegación o filtros.');
assert(main.includes('focusTarget') && main.includes('paletteOpen'), 'Falta la gestión de foco para navegación o diálogo.');
assert(/public\/images\/architecture\/\$\{(?:p|project)\.slug\}-flow\.svg/.test(main), 'Falta la evidencia visual conceptual de los proyectos.');
assert(visualCss.includes('.project-visual figcaption'), 'Faltan captions para la evidencia visual.');
assert(html.includes('public/blog-posts.js') && html.includes('src/blog.css'), 'Faltan los recursos estáticos del blog.');
assert(main.includes('function blogPage()') && main.includes('data-blog-category'), 'Falta la vista pública del blog con categorías.');
assert(blogCss.includes('.blog-card') && blogCss.includes('.blog-filters'), 'Falta el estilo del blog.');
assert(!html.includes('jonasemanuel.dev'), 'No debe quedar un dominio de ejemplo como URL canónica.');
assert(sitemap.includes('https://j0nasm.github.io/portafolio/'), 'El sitemap debe utilizar el dominio definitivo de GitHub Pages.');
assert(manifest.includes('"src":"favicon.svg"'), 'El manifest debe referenciar el icono disponible.');
for (const route of ['/muestras', '/blog', '/privacidad']) assert(sitemap.includes(route), `Falta ${route} en el sitemap.`);
assert(server.includes('Content-Security-Policy') && server.includes('sameOrigin') && server.includes('maxLogRecords'), 'Faltan protecciones de seguridad del servidor.');
assert(!readme.includes('Ã') && !main.includes('Ã') && !data.includes('Ã'), 'Se detectó texto con codificación dañada.');
await Promise.all([
  access(new URL('../public/og.png', import.meta.url)),
  access(new URL('../src/log-404.js', import.meta.url)),
  access(new URL('../public/images/architecture/sigbo-flow.svg', import.meta.url))
]);
const post = normalizeBlogPost({ title: 'Título seguro', category: 'Notas', excerpt: 'Resumen', body: 'Contenido', publishedAt: '2026-08-24', published: true });
assert(post.slug === 'titulo-seguro' && post.published, 'La normalización del blog debe crear un slug seguro y conservar el estado publicado.');
let rejectedIncompletePost = false;
try { normalizeBlogPost({ title: 'Incompleto' }); } catch { rejectedIncompletePost = true; }
assert(rejectedIncompletePost, 'El blog debe rechazar publicaciones incompletas.');
console.log(`Verificación completada: 4 proyectos y ${routes.length} rutas principales en modo estático.`);
