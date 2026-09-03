# Lista previa a publicación

## Contenido

- [ ] Cada enlace de contacto, CV y red social es real y está actualizado.
- [ ] No hay nombres, documentos, importes, credenciales ni capturas de terceros sin autorización.
- [ ] Experiencia, tecnologías, fechas y resultados son verificables.
- [ ] Las demostraciones se mantienen identificadas como conceptuales cuando no son pantallas reales.

## Técnica

- [ ] Ejecuté `npm ci && npm run build && npm test`.
- [x] El dominio de publicación vive solo en `siteOrigin` y `siteBase` de `scripts/build-static.mjs`; los metadatos, `robots.txt` y `sitemap.xml` se derivan de ahí.
- [x] El build genera entradas de rutas y fallback SPA para GitHub Pages.
- [x] `og.png` mide 1200 × 630 y existen los iconos de 192, 512 y 180 píxeles (`npm run assets` los regenera; `npm test` los verifica).
- [ ] GitHub Pages está configurado con **GitHub Actions** como fuente y HTTPS está activo.
- [ ] Si se usa el servidor Node.js, el directorio `data/` es persistente y no se sincroniza con Git.

## Revisión final

- [ ] Probé inicio, proyectos, blog, CV, navegación móvil y modo oscuro.
- [ ] Revisé título, descripción y vista previa social tras definir el dominio.
- [ ] Confirmé que GitHub Actions aprobó el commit que se desplegará.
