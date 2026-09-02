import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const sourceIndex = await readFile(path.join(root, 'index.html'), 'utf8');
const productionIndex = sourceIndex.replace('<head>', '<head>\n    <base href="/portafolio/" />');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all([
  writeFile(path.join(output, 'index.html'), productionIndex, 'utf8'),
  cp(path.join(root, '404.html'), path.join(output, '404.html')),
  cp(path.join(root, 'service-worker.js'), path.join(output, 'service-worker.js')),
  cp(path.join(root, 'src'), path.join(output, 'src'), { recursive: true }),
  cp(path.join(root, 'public'), path.join(output, 'public'), { recursive: true })
]);

const staticRoutes = [
  'sobre-mi',
  'proyectos',
  'muestras',
  'experiencia',
  'formacion',
  'stack',
  'cv',
  'contacto',
  'blog',
  'proyectos/sigbo',
  'proyectos/mbapo',
  'proyectos/bomberos',
  'proyectos/inspecciones-moviles'
];
const blogPosts = JSON.parse(await readFile(path.join(root, 'content', 'blog-posts.json'), 'utf8'));
for (const post of blogPosts) {
  if (post?.published && post.slug) staticRoutes.push(`blog/${post.slug}`);
}

await Promise.all(staticRoutes.map(async route => {
  const routeDirectory = path.join(output, ...route.split('/'));
  await mkdir(routeDirectory, { recursive: true });
  await writeFile(path.join(routeDirectory, 'index.html'), productionIndex, 'utf8');
}));

await mkdir(path.join(output, 'privacidad'), { recursive: true });
await Promise.all([
  cp(path.join(root, 'public', 'privacy.html'), path.join(output, 'privacidad', 'index.html')),
  cp(path.join(root, 'public', 'robots.txt'), path.join(output, 'robots.txt')),
  cp(path.join(root, 'public', 'sitemap.xml'), path.join(output, 'sitemap.xml')),
  writeFile(path.join(output, '.nojekyll'), '', 'utf8')
]);

console.log(`Build estático creado en dist/ con ${staticRoutes.length + 2} rutas publicables.`);
