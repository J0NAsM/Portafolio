# Contexto del proyecto

## Arquitectura

El portfolio es una SPA ligera con Vite. `src/main.js` resuelve rutas y vistas; `src/data.js` contiene todo el contenido público; `src/styles.css` implementa los tokens de diseño y las vistas.

## Decisiones

- Se evita inventar enlaces, logros, resultados, certificaciones o fechas.
- SIGBO se presenta con información abstraída para proteger datos y código propietario.
- La estética usa contraste editorial y diagramas CSS, sin imágenes obligatorias ni efectos pesados.
- Tema claro/oscuro depende de tokens CSS y se persiste en `localStorage`.

## Pendientes reales antes de publicar

1. Completar canales de contacto y dominio definitivo.
2. Añadir CV y material visual sanitizado si existe autorización.
3. Configurar fallback de SPA en el proveedor de hosting.
