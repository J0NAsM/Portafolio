# Estrategia visual del portafolio

## Objetivo

Optimizar el portafolio para que una persona de RR. HH. entienda el perfil, los proyectos y la profundidad técnica en una lectura progresiva. Las imágenes no se usan como decoración: deben explicar, demostrar o reforzar una capacidad real.

## Diagnóstico actual

El sitio ya tiene una jerarquía visual clara y diagramas conceptuales para explicar sistemas, flujos y tecnología. Sin embargo, las tarjetas y los casos de estudio emplean visuales abstractos; no existe todavía evidencia visual del trabajo realizado.

La primera necesidad no es una foto de stock ni una ilustración genérica: son capturas anonimizadas de los proyectos y diagramas propios que no revelen datos, código ni credenciales. Hasta disponer de ellas, los visuales conceptuales actuales son preferibles a inventar una interfaz o un resultado.

## Recorrido recomendado

Identidad y propuesta profesional
→ Proyecto destacado (SIGBO)
→ Captura real del sistema con una explicación breve
→ Problema y solución
→ Diagrama de flujo o arquitectura simplificada
→ Tecnologías y módulos
→ Evidencia secundaria y resultado verificable

El primer nivel debe ser comprensible para RR. HH.; la arquitectura y el detalle técnico aparecen únicamente al abrir cada caso.

## Inventario propuesto

| Prioridad | Proyecto o sección | Recurso necesario | Posición | Tamaño | Función | Archivo futuro |
| --- | --- | --- | --- | --- | --- | --- |
| P0 | SIGBO | Captura real y anonimizada de una pantalla representativa (no datos reales) | Encabezado del caso | Grande | Demostrar que existe un sistema empresarial y facilitar el reconocimiento | `imagenes/proyectos/sigbo-pantalla-principal.webp` |
| P0 | Mbapo | Captura real del flujo principal o interfaz representativa | Encabezado del caso | Grande | Mostrar la plataforma de servicios de forma comprensible | `imagenes/proyectos/mbapo-flujo-principal.webp` |
| P0 | Gestión Bomberos | Captura anonimizada de un módulo operativo | Encabezado del caso | Grande | Contextualizar la digitalización institucional | `imagenes/proyectos/gestion-bomberos-modulo.webp` |
| P1 | SIGBO | Diagrama propio de flujo: operación → validación → registro/auditoría | Después de la solución | Mediano | Explicar reglas y trazabilidad sin mostrar información privada | `imagenes/arquitectura/sigbo-flujo-operativo.svg` |
| P1 | Mbapo | Diagrama propio de usuarios, servicios, solicitud y estado | Después de la solución | Mediano | Reducir texto y explicar el modelo de interacción | `imagenes/arquitectura/mbapo-flujo-servicios.svg` |
| P1 | Gestión Bomberos | Diagrama propio de inspección, registro, seguimiento y reporte | Después de la solución | Mediano | Explicar el proceso institucional | `imagenes/arquitectura/bomberos-flujo-inspeccion.svg` |
| P1 | Perfil | Fotografía profesional actual, si existe y se quiere utilizar | Junto al bloque de perfil, nunca como fondo | Mediana | Reforzar identidad y confianza | `imagenes/perfil/jonas-martinez-profesional.webp` |
| P2 | Tecnología | Logotipos oficiales de GeneXus, Java, PostgreSQL, Git y otras tecnologías confirmadas | Página Tecnologías | Icono | Facilitar el escaneo; nunca sustituir el texto | `imagenes/tecnologias/<tecnologia>-logo.svg` |
| P2 | Proyecto | Capturas de módulos concretos, máximo dos por caso | Galería bajo evidencia | Mediana | Profundizar sin sobrecargar la primera lectura | `imagenes/evidencia/<proyecto>-<modulo>.webp` |

## Reglas de selección y publicación

1. Priorizar capturas propias, diagramas propios y logotipos oficiales con licencia verificable.
2. Eliminar o anonimizar nombres, documentos, números de teléfono, correos, identificadores, saldos, ubicaciones y cualquier dato sensible antes de publicar.
3. Cada captura lleva un caption que diga qué módulo se observa y qué capacidad demuestra; no basta con un título decorativo.
4. No publicar código propietario, pantallas con información de producción ni métricas sin fuente verificable.
5. Solicitar confirmación antes de describir una imagen como resultado, arquitectura exacta, integración o logro cuantitativo.
6. No utilizar fotos de stock de programadores, oficinas, servidores o fondos tecnológicos: no demuestran experiencia ni reducen carga cognitiva.

## Sistema visual recomendado

- Una imagen principal por proyecto; hasta dos capturas secundarias solo cuando expliquen módulos distintos.
- Proporción de captura recomendada: 16:10 o 4:3. Nunca deformar la interfaz.
- Exportar capturas en WebP, idealmente entre 1600 y 2000 px de ancho; conservar el original fuera del sitio.
- Bordes de 1 px, radio discreto, fondo neutro y sombra muy suave para que el contenido sea el foco.
- Usar etiquetas: `Pantalla anonimizada`, `Diagrama conceptual` o `Evidencia técnica`, según corresponda.
- Activar vista ampliada (lightbox) solo para imágenes que requieran inspección; una captura de cabecera no la necesita necesariamente.
- Mantener el texto como fuente primaria de accesibilidad: `alt` descriptivo y caption. Nunca colocar información esencial exclusivamente dentro de una imagen.

## Pendientes para integrar imágenes reales

Para cada activo se debe registrar antes de añadirlo: proyecto, módulo, fecha de captura, datos ocultados, permiso de publicación, autor/fuente, licencia, URL de fuente si es externo y texto alternativo.

## Activos conceptuales ya integrados

- `public/images/general/portfolio-lens.svg`: portada y tecnología. Explica la relación entre contexto, reglas, datos y uso.
- `public/images/general/work-method.svg`: sección Sobre mí. Explica el método desde el contexto hasta la mejora.
- `public/images/general/blog-organizer.svg`: cabecera del blog. Explica publicación, categoría y día.
- `public/images/architecture/*-flow.svg`: un diagrama conceptual por proyecto. Son evidencia de razonamiento y no sustituyen capturas reales anonimizadas.
