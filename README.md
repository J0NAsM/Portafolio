# Portfolio de Jonas Martínez

Portfolio profesional de Jonas Emanuel Martínez Cáceres, desarrollador de software junior enfocado en sistemas empresariales, datos e interfaces operativas.

**Sitio publicado:** [j0nasm.github.io/Portafolio](https://j0nasm.github.io/Portafolio/)

## Características

- Casos de estudio con estado, alcance, decisiones y nivel de evidencia claramente identificados.
- Navegación SPA compatible con recargas directas en GitHub Pages.
- Tema claro, oscuro y del sistema, diseño responsive y navegación por teclado.
- CV profesional imprimible y canales de contacto con acciones de copia.
- Metadatos individuales por ruta, sitemap, robots, manifest y experiencia offline.
- Pruebas automatizadas de contenido, accesibilidad, recursos, integración y salida de producción.

## Tecnología

La interfaz utiliza HTML, CSS y JavaScript clásico. El build estático se genera con Node.js sin depender de un framework de interfaz. Express se conserva únicamente para herramientas locales opcionales de administración; no interviene en el sitio publicado.

## Desarrollo local

Requiere Node.js 20.19 o superior; se recomienda la versión indicada en `.nvmrc`.

```bash
npm ci
npm run dev
```

La versión sin servidor también puede abrirse directamente desde `index.html`; en ese modo la navegación utiliza el hash de la URL.

## Verificación

```bash
npm test
npm run build
npm run test:production
```

El build queda en `dist/` e incluye entradas HTML con metadatos propios para cada ruta pública, el fallback de GitHub Pages y todos los recursos necesarios.

## Recursos gráficos

Los iconos de aplicación, el favicon y la imagen para compartir se generan desde el trazado vectorial del logotipo, sin dependencias externas:

```bash
npm run assets
```

El comando escribe `public/icons/` (192, 512 y apple-touch de 180 píxeles), regenera `public/favicon.svg` y ajusta `public/og.png` al formato 1200 × 630 exigido por LinkedIn, WhatsApp y Facebook. Es idempotente: si la imagen ya está en ese tamaño, no la vuelve a remuestrear. `npm test` verifica las dimensiones y el peso de todos estos archivos.

## Contenido

El perfil, la experiencia, las tecnologías y los proyectos se mantienen en `src/data.js`. Los casos privados se describen sin código propietario, credenciales, datos operativos ni capturas no autorizadas. Las interfaces conceptuales están señaladas como tales.

Las rutas principales son `/`, `/proyectos`, `/proyectos/:slug`, `/experiencia`, `/formacion`, `/stack`, `/sobre-mi`, `/cv`, `/contacto`, `/muestras` y `/privacidad`. El blog solo se incorpora al build y al sitemap cuando existe al menos una publicación pública.

## Despliegue

Cada push a `main` ejecuta pruebas, crea la salida estática, valida rutas y recursos, y despliega `dist/` mediante el workflow oficial de GitHub Pages en `.github/workflows/deploy.yml`.

En **Settings → Pages → Build and deployment**, la fuente del repositorio debe estar configurada como **GitHub Actions**. El nombre actual del repositorio es `Portafolio`; GitHub distingue mayúsculas en esta ruta, por eso la URL de producción configurada es `https://j0nasm.github.io/Portafolio/`.

GitHub Pages solo hospeda archivos estáticos. El panel local de errores, la edición administrativa del blog y las exportaciones de `server.js` requieren Node.js y no se publican ni se simulan en Pages.

Consulta [la guía de despliegue](docs/deployment.md) y [la lista de revisión](docs/prepublish-checklist.md) para mantenimiento futuro.
