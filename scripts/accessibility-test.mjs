import { readFile } from 'node:fs/promises';

const [html, main, styles, improvements, notFound] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/improvements.css', import.meta.url), 'utf8'),
  readFile(new URL('../404.html', import.meta.url), 'utf8')
]);

function assert(condition, message) { if (!condition) throw new Error(message); }

assert(/<html lang="es">/.test(html), 'El documento debe declarar el idioma principal.');
assert(html.includes('class="skip-link"') && main.includes('id="main"'), 'Falta el enlace para saltar al contenido principal.');
assert(main.includes('aria-current="page"'), 'La navegación debe indicar la página actual.');
assert(main.includes('aria-pressed'), 'Los filtros deben exponer su estado a tecnologías asistivas.');
assert(main.includes('aria-modal="true"') && main.includes('event.key === \'Tab\''), 'La paleta debe comportarse como diálogo accesible.');
assert(main.includes("setAttribute('inert'") && main.includes("classList.toggle('dialog-open'"), 'El diálogo debe aislar el contenido de fondo.');
assert(main.includes('focusTarget') && main.includes('main?.focus()'), 'La navegación debe restaurar el foco en el contenido.');
assert(main.includes('alt="Diagrama conceptual') && main.includes('alt="${alt}"'), 'Las imágenes de interfaz deben tener texto alternativo.');
assert(styles.includes(':focus-visible') && improvements.includes('prefers-reduced-motion:reduce'), 'Faltan estilos de foco visible o reducción de movimiento.');
assert(improvements.includes('.section-title h1') && (main.match(/, 'h1'\)}/g) || []).length >= 7, 'Las páginas internas deben exponer un título principal semántico.');
assert(notFound.includes('<main>') && notFound.includes('<h1>'), 'La página 404 debe mantener una estructura semántica.');

console.log('Accesibilidad estática verificada: semántica, foco, filtros, diálogo, imágenes y movimiento.');
