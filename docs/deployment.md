# Despliegue

## GitHub Pages

El repositorio `J0NAsM/Portafolio` debe usar `main` como rama principal y tener **Settings → Pages → Source: GitHub Actions**. Cada `push` a `main` ejecuta `.github/workflows/deploy.yml`, instala las dependencias bloqueadas, corre las pruebas, construye `dist/` y publica el artifact oficial de Pages.

El build genera archivos de entrada para todas las rutas conocidas y `404.html` conserva la ruta solicitada antes de cargar la SPA. El sitio se publica en `https://j0nasm.github.io/portafolio/`, usando `/portafolio/` como ruta base.

Verificación local:

```bash
npm ci
npm test
npm run build
npm run test:production
```

## Servidor Node.js

Para habilitar el panel privado y las exportaciones, despliega el repositorio con Node.js 22 y ejecuta `npm start`. Define en el proveedor de hosting `ADMIN_USER`, `ADMIN_PASSWORD`, `ERROR_LOG_SALT`, `ERROR_LOG_RETENTION_DAYS`, `ERROR_LOG_MAX_RECORDS` y, solo detrás de un proxy de confianza, `TRUST_PROXY=1`.

El directorio de datos debe ser persistente. Los registros 404 y respaldos del blog no se deben guardar en Git.

Este servidor es opcional y no forma parte del despliegue de GitHub Pages. En Pages no funcionan el panel privado, el registro de errores, la edición web del blog ni las exportaciones.
