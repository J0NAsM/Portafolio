# Lista previa a publicación

## Contenido

- [ ] Cada enlace de contacto, CV y red social es real y está actualizado.
- [ ] No hay nombres, documentos, importes, credenciales ni capturas de terceros sin autorización.
- [ ] Experiencia, tecnologías, fechas y resultados son verificables.
- [ ] Las demostraciones se mantienen identificadas como conceptuales cuando no son pantallas reales.

## Técnica

- [ ] Ejecuté `npm ci && npm run build && npm test`.
- [ ] El dominio definitivo aparece en `public/robots.txt` y `public/sitemap.xml`.
- [ ] El hosting redirige las rutas de la SPA a `index.html`.
- [ ] HTTPS está activo y las variables de `.env` están configuradas solo en el hosting.
- [ ] Si se usa el servidor Node.js, el directorio `data/` es persistente y no se sincroniza con Git.

## Revisión final

- [ ] Probé inicio, proyectos, blog, CV, navegación móvil y modo oscuro.
- [ ] Revisé título, descripción y vista previa social tras definir el dominio.
- [ ] Confirmé que GitHub Actions aprobó el commit que se desplegará.
