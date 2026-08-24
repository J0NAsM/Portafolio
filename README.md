# Portfolio de Jonas Martínez

Portfolio estático, responsive y sin dependencias de interfaz. Presenta proyectos con información segura y centraliza el contenido para facilitar futuras actualizaciones. Puede abrirse directamente con doble clic en `index.html`.

## Stack

- HTML, CSS y JavaScript clásico (se abre directamente con `index.html`)
- Node.js/Express solo para el registro 404, el panel privado y las exportaciones

## Uso directo

Abre `index.html` desde el explorador de archivos. No requiere Node.js, npm ni servidor local. La navegación funciona con enlaces `#` cuando se abre como archivo local.

## Uso opcional con servidor local

```bash
npm ci
npm run dev
npm run build
npm test
npm start
```

Requiere Node.js 20.19 o superior (se recomienda la versión 22 indicada en `.nvmrc`). `npm ci` instala exactamente las dependencias bloqueadas en `package-lock.json`; utiliza `npm install` solo cuando vayas a modificar dependencias.

El build estático queda en `dist/` y conserva los archivos HTML, CSS y JavaScript clásicos para abrirse sin bundler. Para un hosting estático con rutas SPA, configura una regla de fallback a `index.html`.

## Contenido y configuración

Edita `src/data.js`. Allí se concentran el perfil, enlaces sociales, proyectos, tecnologías y experiencia.

- Añade email, GitHub, LinkedIn, WhatsApp y CV únicamente cuando estén disponibles.
- Para agregar un proyecto, duplica un objeto de `projects` y define un `slug` único.
- Define el dominio definitivo antes de publicar: configura la URL canónica, `public/robots.txt` y `public/sitemap.xml` con la misma dirección. No uses el dominio de ejemplo.
- Puedes incorporar fotografía o capturas sanitizadas en `public/` y enlazarlas desde el contenido. No incluyas datos privados, clientes, credenciales ni capturas operativas sin anonimizar.

## Rutas

`/`, `/sobre-mi`, `/proyectos`, `/proyectos/:slug`, `/blog`, `/blog/:slug`, `/experiencia`, `/formacion`, `/stack`, `/cv`, `/contacto`.

## Blog personal

La ruta pública `/blog` agrupa las publicaciones publicadas por fecha y permite filtrarlas por categoría. Para crear, editar, publicar, guardar como borrador o eliminar una entrada, abre `http://localhost:3000/admin/blog` con las mismas credenciales del panel de errores.

El contenido se guarda en `content/blog-posts.json` y se sincroniza automáticamente con `public/blog-posts.js`, por lo que también se verá al abrir `index.html` directamente y se incluirá en el próximo `npm run build`.

Usa `templates/blog-post.json` como punto de partida para una publicación y `templates/project.js` para añadir un caso de estudio. Cada actualización del blog conserva una copia local de la versión anterior en `data/blog-backups/`; se mantienen las 20 más recientes y no se versionan.

## CV ATS

La ruta `#/cv` abre una plantilla imprimible de una sola columna. Sus campos editables se guardan en el navegador actual; completa todos los campos entre corchetes antes de imprimir o enviar el CV. El diseño de impresión usa tamaño Letter, márgenes de 2,54 cm y tipografía Arial/Calibri.

## Panel privado de errores 404

El proyecto puede ejecutarse como servidor con `npm start`. Copia `.env.example` a `.env`, completa las tres credenciales obligatorias y abre `http://localhost:3000/admin/errores`. En producción usa HTTPS y una contraseña única; no publiques el archivo `.env`.

El panel está protegido mediante autenticación básica, permite filtrar por ruta, referrer y fechas, y exporta los registros filtrados a Excel (`.xlsx`), PDF, CSV o TXT en forma de tabla. Sin `ERROR_LOG_SALT`, el endpoint 404 no guarda registros. Los logs se guardan localmente en `data/404-errors.json`, no se versionan y se depuran automáticamente según `ERROR_LOG_RETENTION_DAYS`; `ERROR_LOG_MAX_RECORDS` limita el crecimiento del archivo.

El registro está minimizado: ruta, referrer, idioma, zona horaria, resolución, user-agent, IP enmascarada y hash técnico. No añade fingerprinting, geolocalización externa ni anuncios. Los CSV y XLSX neutralizan valores que podrían interpretarse como fórmulas. Consulta `public/privacy.html` antes de desplegar y adapta el aviso legal a tu jurisdicción.

## Calidad incluida

Tema claro/oscuro/sistema persistente, navegación de teclado, foco visible, comando `Ctrl/Cmd + K`, navegación móvil, reduced motion por ausencia de animaciones esenciales, metadatos SEO, `robots.txt`, sitemap, manifest y vista 404.

Cada push y pull request a `main` ejecuta en GitHub Actions la instalación reproducible, el build y las verificaciones. Dependabot propone mensualmente actualizaciones de dependencias y de las acciones de GitHub.

`npm test` valida contenido, rutas, accesibilidad estática, presupuesto de recursos e integración del servidor (autenticación, protección de origen, exportación, blog, respaldos y paginación). Puedes ejecutar por separado `npm run test:accessibility`, `npm run test:integration` o `npm run audit:assets` durante el desarrollo.

## Deploy

Para mostrar solo el portfolio, puedes ejecutar `npm run build` y publicar `dist/` en un host estático. El panel de errores y las exportaciones requieren un entorno Node.js que ejecute `server.js`; no estarán disponibles en un deploy estrictamente estático. Habilita fallback SPA para las rutas internas.

Antes de producción, confirma que el dominio configurado en `public/robots.txt` y `public/sitemap.xml` sea el definitivo, habilita HTTPS y define las variables de `.env` únicamente en el proveedor de hosting. No subas `.env`, la carpeta `data/` ni sus registros.

Consulta `docs/deployment.md` para publicar una versión estática o el servidor Node.js, `docs/prepublish-checklist.md` antes de hacerlo y `CONTRIBUTING.md` para las convenciones de mantenimiento.
