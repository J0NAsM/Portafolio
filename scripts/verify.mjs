import { readFile } from 'node:fs/promises';
const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const data = await readFile(new URL('../src/data.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const visualCss = await readFile(new URL('../src/visual-evidence.css', import.meta.url), 'utf8');
const blogCss = await readFile(new URL('../src/blog.css', import.meta.url), 'utf8');
const routes = ['/', '/sobre-mi', '/proyectos', '/blog', '/muestras', '/experiencia', '/formacion', '/stack', '/cv', '/contacto'];
const forbidden = [/Lorem ipsum/i, /password\s*[:=]/i, /api[_-]?key\s*[:=]/i, /secret\s*[:=]/i];

function assert(condition, message) { if (!condition) throw new Error(message); }
assert(!/\bimport\b|\bexport\b/.test(main + data), 'El portfolio debe ejecutarse sin módulos ni bundler.');
assert(data.includes('window.portfolioData'), 'Los datos públicos deben estar disponibles para JavaScript clásico.');
assert((data.match(/slug:/g) || []).length === 4, 'Deben existir los cuatro proyectos iniciales.');
for (const route of routes) assert(main.includes(`'${route}'`), `Falta la ruta ${route}.`);
for (const expression of forbidden) assert(!expression.test(main) && !expression.test(html), `Posible contenido no publicable: ${expression}.`);
assert(html.includes('application/ld+json'), 'Faltan datos estructurados.');
assert(main.includes('data-print-cv') && main.includes('window.print()'), 'Falta la impresión del CV ATS.');
assert(/public\/images\/architecture\/\$\{(?:p|project)\.slug\}-flow\.svg/.test(main), 'Falta la evidencia visual conceptual de los proyectos.');
assert(visualCss.includes('.project-visual figcaption'), 'Faltan captions para la evidencia visual.');
assert(html.includes('public/blog-posts.js') && html.includes('src/blog.css'), 'Faltan los recursos estáticos del blog.');
assert(main.includes('function blogPage()') && main.includes('data-blog-category'), 'Falta la vista pública del blog con categorías.');
assert(blogCss.includes('.blog-card') && blogCss.includes('.blog-filters'), 'Falta el estilo del blog.');
assert(!html.includes('jonasemanuel.dev'), 'No debe quedar un dominio de ejemplo como URL canónica.');
console.log(`Verificación completada: 4 proyectos y ${routes.length} rutas principales en modo estático.`);
