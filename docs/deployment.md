# Despliegue

## Portfolio estático

1. Ejecuta `npm ci && npm run build && npm test`.
2. Publica el contenido de `dist/`.
3. Configura una regla de fallback de rutas hacia `index.html`.
4. Activa HTTPS y confirma el dominio final en `public/robots.txt` y `public/sitemap.xml`.

El workflow `Deploy GitHub Pages` está preparado para iniciarse manualmente desde la pestaña **Actions**; no se ejecuta automáticamente ni cambia la configuración de Pages.

## Servidor Node.js

Para habilitar el panel privado y las exportaciones, despliega el repositorio con Node.js 22 y ejecuta `npm start`. Define en el proveedor de hosting `ADMIN_USER`, `ADMIN_PASSWORD`, `ERROR_LOG_SALT`, `ERROR_LOG_RETENTION_DAYS`, `ERROR_LOG_MAX_RECORDS` y, solo detrás de un proxy de confianza, `TRUST_PROXY=1`.

El directorio de datos debe ser persistente. Los registros 404 y respaldos del blog no se deben guardar en Git.
