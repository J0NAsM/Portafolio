# Auditoría RRHH y decisiones de reconstrucción

Fecha: 17 de agosto de 2026.

## Objetivo

Optimizar el portfolio para que una persona de RRHH, un recruiter técnico o un hiring manager identifique con poco esfuerzo: rol, foco profesional, evidencia disponible, trayectoria y forma de contacto.

## Decisiones aplicadas

- La página de inicio prioriza `rol → foco → evidencia → trayectoria → proyectos → especialización`.
- Se conserva el mensaje de identidad “Analizo problemas. Diseño sistemas. Construyo soluciones.”, pero ahora está acompañado de rol y foco explícitos.
- El diagrama abstracto del hero se reemplaza por un bloque de información profesional escaneable.
- La experiencia sube antes de los proyectos; se usa el nombre “Trayectoria relevante” porque no hay cargo, empresa ni fechas confirmadas.
- Los proyectos mantienen estados transparentes y protección de información sensible.
- Se ocultan la navegación y CTAs de contacto si no existen canales reales en `src/data.js`. No deben publicarse placeholders ni instrucciones internas.
- “Stack” se muestra públicamente como “Tecnologías”.
- El detalle técnico se mantiene para los casos de estudio; la página de inicio solo da la capa de comprensión rápida.
- Se incorporó una sección `Evidence` con diagramas conceptuales de arquitectura operativa, flujo de información y sistema modular. Son modelos de comunicación, no diagramas de sistemas privados.
- Se incorporó `Technical DNA`, que organiza tecnologías por función para una lectura rápida de recruiters y una capa de detalle para perfiles técnicos.

## Información pendiente antes de una publicación orientada a empleo

1. Rol objetivo y disponibilidad, si se desean publicar.
2. Email, LinkedIn, GitHub, CV y WhatsApp reales.
3. Cargo, organización, periodo y responsabilidades de cada experiencia laboral confirmada.
4. Por cada proyecto: contribución específica de Jonas, estado, tecnologías confirmadas y resultados verificables.
5. Para Softshop: cargo formal, ciudad, periodo, módulos/responsabilidades y resultados verificables con GeneXus.
6. Métricas reales solo si pueden demostrarse. Nunca inventarlas.
7. Capturas, diagramas o flujos sanitizados para SIGBO, Bomberos y otros proyectos autorizados.
8. Dominio definitivo para canonical, OpenGraph y sitemap.

## Restricciones de contenido

- No afirmar seniority, liderazgo, resultados o experiencia que no estén confirmados.
- No revelar código propietario, credenciales, información financiera real, arquitectura privada ni datos de terceros.
- No afirmar Senior, Arquitecto, SIFEN, REST/SOAP, procesamiento batch, integraciones, métricas, videos o capturas como experiencia real sin confirmación explícita.
- Las capturas sanitizadas, diagramas de arquitectura reales y comparativas antes/después solo deben incorporarse después de confirmar su procedencia, autorización y contenido.
- No exponer placeholders de contacto al público.
- Mantener una capa breve para RRHH y una técnica para casos de estudio.

## Pendiente técnico

El contenido se renderiza actualmente en JavaScript para permitir abrir `index.html` directamente. Para máxima indexación SEO, una futura versión debe generar HTML estático equivalente sin perder esa posibilidad de uso local.

## Backend de errores 404

`server.js` sirve el portfolio, registra 404 de forma limitada y ofrece `/admin/errores` protegido por autenticación básica. La configuración está exclusivamente en variables de entorno (`.env.example`); no se publican contraseñas ni sales.

- Persistencia local: `data/404-errors.json`, excluida de git.
- Retención: `ERROR_LOG_RETENTION_DAYS`, con depuración al arrancar y cada 24 horas.
- Datos: ruta, referrer, idioma, zona horaria, pantalla, user-agent, IP enmascarada y hash técnico. No fingerprinting, geolocalización externa ni IP completa expuesta en el panel.
- Exportaciones protegidas y filtradas: XLSX, PDF, CSV y TXT tabular.
- Sin `ERROR_LOG_SALT`, el endpoint responde pero no persiste registros.

## CV ATS

La ruta `#/cv` contiene un CV imprimible de una sola columna y usa una hoja Letter con márgenes de 2,54 cm al imprimir. El diseño evita tablas, columnas, imágenes, gráficos e iconos; usa Arial/Calibri y headings convencionales para favorecer lectura ATS.

- La estructura es: encabezado, perfil profesional, competencias clave, experiencia laboral, educación, idiomas y certificaciones.
- Los campos entre corchetes son editables y se conservan solamente en el navegador mediante `localStorage`.
- No se debe imprimir ni enviar el CV mientras haya campos entre corchetes ni resultados sin verificar.
- Para una postulación se debe adaptar la terminología a la oferta sin declarar tecnologías, métricas, cargos o certificaciones no reales.
