<!-- BEGIN ECOSYSTEM CURRENT -->
El build principal usa scripts/build-static.mjs y genera un sitio estático multipágina. No agregar fallback SPA por estas notas. El servidor Express es una modalidad separada; consultar ejecucion.md.
<!-- END ECOSYSTEM CURRENT -->

<!-- BEGIN ECOSYSTEM ENTRY -->
Entrada vigente: [Portafolio — contexto](<contexto.md>). Identidad, alcance, reglas y comandos se consultan desde esa entrada. La documentación histórica se conserva; sus fotografías de estado no acreditan la situación actual.
<!-- END ECOSYSTEM ENTRY -->

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
