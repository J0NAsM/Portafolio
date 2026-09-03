import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { normalizeBlogPost } from '../lib/blog-store.mjs';
const styles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
const fontsCss = await readFile(new URL('../src/fonts.css', import.meta.url), 'utf8');
const notFound = await readFile(new URL('../404.html', import.meta.url), 'utf8');
const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const data = await readFile(new URL('../src/data.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const visualCss = await readFile(new URL('../src/visual-evidence.css', import.meta.url), 'utf8');
const blogCss = await readFile(new URL('../src/blog.css', import.meta.url), 'utf8');
const manifest = await readFile(new URL('../public/site.webmanifest', import.meta.url), 'utf8');
const buildScript = await readFile(new URL('./build-static.mjs', import.meta.url), 'utf8');
const server = await readFile(new URL('../server.js', import.meta.url), 'utf8');
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const routes = ['/', '/sobre-mi', '/proyectos', '/blog', '/muestras', '/experiencia', '/formacion', '/stack', '/cv', '/contacto', '/privacidad'];
const forbidden = [/Lorem ipsum/i, /password\s*[:=]/i, /api[_-]?key\s*[:=]/i, /secret\s*[:=]/i];

function assert(condition, message) { if (!condition) throw new Error(message); }
const profileRole = data.match(/role: '([^']+)'/)?.[1];
assert(profileRole, 'src/data.js debe declarar el rol profesional.');
assert(!/\bimport\b|\bexport\b/.test(main + data), 'El portfolio debe ejecutarse sin módulos ni bundler.');
assert(data.includes('window.portfolioData'), 'Los datos públicos deben estar disponibles para JavaScript clásico.');
assert((data.match(/slug:/g) || []).length === 5, 'Deben existir los cinco proyectos publicados.');
for (const route of routes) assert(main.includes(`'${route}'`), `Falta la ruta ${route}.`);
for (const expression of forbidden) assert(!expression.test(main) && !expression.test(html), `Posible contenido no publicable: ${expression}.`);
assert(html.includes('application/ld+json'), 'Faltan datos estructurados.');
assert(html.includes('https://j0nasm.github.io/Portafolio/'), 'Falta configurar el dominio de GitHub Pages.');
assert(html.includes('color-scheme'), 'Faltan metadatos de tema.');
assert(html.includes('rel="preload"') && html.includes('as="font"'), 'Falta la precarga de la tipografía principal.');
// Las fuentes son locales: no debe quedar ninguna petición a terceros.
assert(!/https:\/\/fonts\.(googleapis|gstatic)\.com/.test(html + styles), 'El sitio no debe depender de Google Fonts.');
assert(html.includes('src/fonts.css'), 'Falta la hoja de tipografías auto-alojadas.');
for (const family of ['Manrope', 'DM Mono']) {
  assert(fontsCss.includes(`font-family: '${family}'`), `Falta la declaración local de la tipografía ${family}.`);
}
assert(html.includes('rel="apple-touch-icon"'), 'Falta el icono para la pantalla de inicio de iOS.');
assert(html.includes('rel="manifest"'), 'Falta el enlace al manifest de la aplicación.');
// Facebook, LinkedIn y WhatsApp usan estas medidas para dibujar la vista previa
// sin descargar antes la imagen.
for (const tag of ['og:image:width" content="1200', 'og:image:height" content="630', 'og:image:type" content="image/png', 'og:image:alt']) {
  assert(html.includes(tag), `Faltan metadatos de la imagen para compartir: ${tag}.`);
}
assert(/<meta property="og:image" content="https:\/\//.test(html), 'La imagen Open Graph debe declararse con una URL absoluta.');
assert(main.includes('data-print-cv') && main.includes('window.print()'), 'Falta la impresión del CV ATS.');
assert(main.includes('aria-current="page"') && main.includes('aria-pressed'), 'Faltan estados accesibles de navegación o filtros.');
assert(main.includes('focusTarget') && main.includes('paletteOpen'), 'Falta la gestión de foco para navegación o diálogo.');
assert(/public\/images\/architecture\/\$\{(?:p|project)\.slug\}-flow\.svg/.test(main), 'Falta la evidencia visual conceptual de los proyectos.');
assert(visualCss.includes('.project-visual figcaption'), 'Faltan captions para la evidencia visual.');
assert(html.includes('public/blog-posts.js') && html.includes('src/blog.css'), 'Faltan los recursos estáticos del blog.');
assert(main.includes('function blogPage()') && main.includes('data-blog-category'), 'Falta la vista pública del blog con categorías.');
// Sin publicaciones, el blog no debe anunciarse como sección vacía.
assert(main.includes("path === '/blog' && publicPosts().length > 0"), 'El blog debe ocultarse mientras no haya publicaciones.');
// El rol y el CV viven en src/data.js; las vistas no deben duplicar esos textos.
assert(!main.includes(profileRole), 'El currículum debe tomar el rol de src/data.js, no repetirlo.');
assert(main.includes('profile.cv ?'), 'La página de CV debe ofrecer la descarga solo si existe un archivo configurado.');
assert(blogCss.includes('.blog-card') && blogCss.includes('.blog-filters'), 'Falta el estilo del blog.');
assert(!html.includes('jonasemanuel.dev'), 'No debe quedar un dominio de ejemplo como URL canónica.');
// El sitemap y robots.txt los genera el build a partir de estas dos constantes,
// que son el unico lugar donde vive el dominio de publicacion.
assert(buildScript.includes("const siteOrigin = 'https://"), 'El build debe declarar el origen de publicación.');
assert(buildScript.includes("const siteBase = '/"), 'El build debe declarar la subruta de publicación.');
assert(buildScript.includes('Sitemap: ${siteOrigin}/sitemap.xml'), 'robots.txt debe derivar el sitemap del origen configurado.');
assert(buildScript.includes('...pages.map(([route]) =>'), 'El sitemap debe derivarse de la lista de rutas del build.');
// Fuera del build no debe quedar ninguna copia del dominio ni de la subruta.
for (const [name, source] of [['src/main.js', main], ['404.html', notFound], ['public/site.webmanifest', manifest]]) {
  assert(!source.includes('/Portafolio'), `${name} no debe fijar la subruta de publicación.`);
  assert(!source.includes('j0nasm.github.io'), `${name} no debe fijar el dominio de publicación.`);
}
// El manifest debe ser instalable: iconos PNG de 192 y 512, con variante maskable.
const manifestData = JSON.parse(manifest);
const manifestBase = 'https://j0nasm.github.io/Portafolio/public/site.webmanifest';
assert(manifestData.icons.some(icon => icon.src === 'favicon.svg'), 'El manifest debe referenciar el icono vectorial.');
for (const size of ['192x192', '512x512']) {
  const icon = manifestData.icons.find(entry => entry.sizes === size && entry.type === 'image/png');
  assert(icon, `El manifest debe declarar un icono PNG de ${size} para poder instalarse.`);
  assert(icon.purpose?.split(' ').includes('maskable'), `El icono de ${size} debe declarar el propósito maskable.`);
}
// start_url y scope son relativos al manifest, así que siguen siendo válidos si
// el sitio se muda a un dominio propio.
for (const field of ['id', 'start_url', 'scope']) {
  assert(!manifestData[field].startsWith('/'), `El manifest no debe fijar una ruta absoluta en ${field}.`);
  assert(new URL(manifestData[field], manifestBase).href === 'https://j0nasm.github.io/Portafolio/', `El campo ${field} del manifest no resuelve a la raíz publicada.`);
}
for (const route of ['muestras', 'proyectos/portfolio', 'privacidad']) assert(buildScript.includes(`'${route}'`), `Falta ${route} en las rutas publicables del build.`);
assert(buildScript.includes("pages.some(([route]) => route.startsWith('blog/'))"), 'El blog solo debe entrar en el build y el sitemap cuando haya publicaciones.');
assert(server.includes('Content-Security-Policy') && server.includes('sameOrigin') && server.includes('maxLogRecords'), 'Faltan protecciones de seguridad del servidor.');

// El sitio estático se publica en GitHub Pages, que no envía cabeceras propias:
// la política tiene que viajar en el documento.
function contentSecurityPolicy(document) {
  return document.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] || '';
}
const indexPolicy = contentSecurityPolicy(html);
assert(indexPolicy, 'index.html debe declarar una Content-Security-Policy.');
for (const directive of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "script-src 'self'"]) {
  assert(indexPolicy.includes(directive), `La política de index.html no incluye ${directive}.`);
}
assert(!indexPolicy.includes('frame-ancestors'), 'frame-ancestors se ignora en un meta y provoca un aviso en consola.');
assert(!/script-src[^;]*'unsafe-(inline|eval)'/.test(indexPolicy), 'La política no debe permitir scripts inline ni eval.');

// El 404 autoriza su script y su estilo por hash: si el contenido cambia sin
// actualizar la política, esta comprobación lo detecta antes del despliegue.
const notFoundPolicy = contentSecurityPolicy(notFound);
assert(notFoundPolicy, '404.html debe declarar una Content-Security-Policy.');
for (const [label, pattern] of [['script', /<script>([\s\S]*?)<\/script>/], ['style', /<style>([\s\S]*?)<\/style>/]]) {
  const content = notFound.match(pattern)?.[1];
  assert(content, `404.html debe conservar su ${label} embebido.`);
  const digest = `sha256-${createHash('sha256').update(content, 'utf8').digest('base64')}`;
  assert(notFoundPolicy.includes(digest), `El hash del ${label} de 404.html no coincide con su política. Debe ser '${digest}'.`);
}
// La subruta la inyecta el build; el archivo del repositorio se queda en la raíz.
assert(notFound.includes('data-site-base="/"'), '404.html debe declarar la base por defecto en la raíz.');
assert(!/\/Portafolio/.test(notFound), '404.html no debe fijar la subruta de GitHub Pages.');
assert(!readme.includes('Ã') && !main.includes('Ã') && !data.includes('Ã'), 'Se detectó texto con codificación dañada.');
await Promise.all([
  access(new URL('../public/og.png', import.meta.url)),
  access(new URL('../public/icons/icon-192.png', import.meta.url)),
  access(new URL('../public/icons/icon-512.png', import.meta.url)),
  access(new URL('../public/icons/apple-touch-icon.png', import.meta.url)),
  access(new URL('../src/log-404.js', import.meta.url)),
  access(new URL('../public/images/architecture/sigbo-flow.svg', import.meta.url)),
  access(new URL('../public/images/architecture/portfolio-flow.svg', import.meta.url))
]);
const post = normalizeBlogPost({ title: 'Título seguro', category: 'Notas', excerpt: 'Resumen', body: 'Contenido', publishedAt: '2026-08-24', published: true });
assert(post.slug === 'titulo-seguro' && post.published, 'La normalización del blog debe crear un slug seguro y conservar el estado publicado.');
let rejectedIncompletePost = false;
try { normalizeBlogPost({ title: 'Incompleto' }); } catch { rejectedIncompletePost = true; }
assert(rejectedIncompletePost, 'El blog debe rechazar publicaciones incompletas.');
console.log(`Verificación completada: 5 proyectos y ${routes.length} rutas principales en modo estático.`);
