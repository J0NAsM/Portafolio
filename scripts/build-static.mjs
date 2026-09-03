import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const siteOrigin = 'https://j0nasm.github.io/Portafolio';
const siteBase = '/Portafolio/';
const sourceIndex = await readFile(path.join(root, 'index.html'), 'utf8');
const blogPosts = JSON.parse(await readFile(path.join(root, 'content', 'blog-posts.json'), 'utf8'));

const pages = [
  ['', 'Jonas Martínez — Desarrollo de software para operaciones reales', 'Desarrollador de software junior enfocado en sistemas empresariales, datos e interfaces operativas.'],
  ['sobre-mi', 'Sobre mí | Jonas Martínez', 'Perfil, principios de trabajo, idiomas y experiencia operativa de Jonas Martínez.'],
  ['proyectos', 'Proyectos de software | Jonas Martínez', 'Casos de estudio sobre software empresarial, operaciones, frontend y gestión institucional.'],
  ['muestras', 'Exploraciones de interfaz | Jonas Martínez', 'Prototipos conceptuales de interfaces para sistemas empresariales y operativos.'],
  ['experiencia', 'Experiencia profesional | Jonas Martínez', 'Experiencia en desarrollo de software, sistemas empresariales, SIFEN y servicio voluntario.'],
  ['formacion', 'Formación | Jonas Martínez', 'Formación técnica y estudios superiores relacionados con software, procesos y personas.'],
  ['stack', 'Tecnologías | Jonas Martínez', 'Tecnologías aplicadas por Jonas Martínez en frontend, backend, datos y sistemas empresariales.'],
  ['cv', 'Currículum | Jonas Martínez', 'Currículum profesional imprimible de Jonas Martínez, desarrollador de software junior.'],
  ['contacto', 'Contacto | Jonas Martínez', 'Contacta a Jonas Martínez por WhatsApp o email para conversar sobre proyectos de software.'],
  ['privacidad', 'Privacidad | Jonas Martínez', 'Información sobre privacidad y funcionamiento técnico del portfolio.'],
  ['proyectos/portfolio', 'Portfolio profesional — Caso de estudio | Jonas Martínez', 'Caso público sobre la construcción, validación y despliegue automatizado de este portfolio.'],
  ['proyectos/sigbo', 'SIGBO — Caso de estudio | Jonas Martínez', 'Caso de software empresarial para operaciones financieras con control y trazabilidad.'],
  ['proyectos/mbapo', 'Mbapo — Caso de estudio | Jonas Martínez', 'Caso conceptual de una plataforma de servicios con perfiles, reputación y contratación.'],
  ['proyectos/bomberos', 'Gestión Bomberos — Caso de estudio | Jonas Martínez', 'Caso de digitalización de información operativa para gestión institucional.'],
  ['proyectos/inspecciones-moviles', 'Inspecciones móviles — Caso de estudio | Jonas Martínez', 'Investigación de una herramienta móvil para inspecciones y seguimiento operativo.']
];

for (const post of blogPosts) {
  if (!post?.published || !post.slug) continue;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) throw new Error(`Slug de blog no publicable: ${post.slug}`);
  pages.push([`blog/${post.slug}`, `${post.title} | Jonas Martínez`, post.excerpt]);
}
if (pages.some(([route]) => route.startsWith('blog/'))) {
  pages.push(['blog', 'Blog técnico | Jonas Martínez', 'Notas sobre desarrollo de software, sistemas y decisiones de producto.']);
}

function escapeAttribute(value) {
  return String(value).replace(/[&"<>]/g, character => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' })[character]);
}

function pageHtml(route, title, description) {
  const url = route ? `${siteOrigin}/${route}` : `${siteOrigin}/`;
  const image = `${siteOrigin}/public/og.png`;
  return sourceIndex
    .replace('<head>', `<head>\n    <base href="${siteBase}" />`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<meta property="og:image:secure_url" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${image}$2`)
    .replace(/<title>.*?<\/title>/, `<title>${escapeAttribute(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeAttribute(description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeAttribute(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeAttribute(description)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escapeAttribute(title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escapeAttribute(description)}$2`);
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
// El 404 estático recibe la subruta real y pierde el registro de errores, que
// depende de /api/log-404 y solo existe en el servidor Node.js.
const notFoundHtml = (await readFile(path.join(root, '404.html'), 'utf8'))
  .replace('data-site-base="/"', `data-site-base="${siteBase}"`)
  .replace(/\s*<script src="\/src\/log-404\.js" defer><\/script>/, '');

await Promise.all([
  writeFile(path.join(output, '404.html'), notFoundHtml, 'utf8'),
  cp(path.join(root, 'service-worker.js'), path.join(output, 'service-worker.js')),
  cp(path.join(root, 'src'), path.join(output, 'src'), { recursive: true }),
  cp(path.join(root, 'public'), path.join(output, 'public'), { recursive: true })
]);

await Promise.all(pages.map(async ([route, title, description]) => {
  if (!route) {
    await writeFile(path.join(output, 'index.html'), pageHtml(route, title, description), 'utf8');
    return;
  }
  const routeDirectory = path.join(output, ...route.split('/'));
  await mkdir(routeDirectory, { recursive: true });
  await writeFile(path.join(routeDirectory, 'index.html'), pageHtml(route, title, description), 'utf8');
}));

// robots.txt y sitemap.xml se derivan del origen y de la lista de rutas: así no
// pueden quedar desincronizados con las páginas ni conservar un dominio antiguo.
const robots = `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`;
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map(([route]) => `  <url><loc>${route ? `${siteOrigin}/${route}` : `${siteOrigin}/`}</loc></url>`),
  '</urlset>',
  ''
].join('\n');

await Promise.all([
  writeFile(path.join(output, 'robots.txt'), robots, 'utf8'),
  writeFile(path.join(output, 'sitemap.xml'), sitemap, 'utf8'),
  writeFile(path.join(output, '.nojekyll'), '', 'utf8')
]);

console.log(`Build estático creado en dist/ con ${pages.length} rutas y metadatos individuales.`);
