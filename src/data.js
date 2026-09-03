(() => {
const profile = {
  name: 'Jonas Emanuel Martínez Cáceres',
  shortName: 'Jonas Martínez',
  role: 'Desarrollador de software junior · Sistemas empresariales',
  focus: 'Java · Python · JavaScript · SQL · IA aplicada al desarrollo',
  tagline: 'Analizo problemas. Diseño sistemas. Construyo soluciones.',
  summary: 'Construyo software para convertir reglas de negocio, datos y tareas operativas en experiencias claras. Trabajo con Java, Python, JavaScript y SQL, utilizando IA como apoyo para analizar, documentar y mejorar cada solución.',
  location: 'Carapeguá, Paraguay',
  nationality: 'Paraguayo',
  availability: 'Proyectos en horario nocturno y fines de semana',
  languages: 'Español y guaraní nativos · Comprensión básica de portugués e inglés',
  phone: '+595986914726',
  email: 'jemc2612@gmail.com',
  github: 'https://github.com/J0NAsM',
  linkedin: '',
  whatsapp: 'https://wa.me/595986914726?text=Hola%2C%20Jonas.%20Te%20contacto%20desde%20tu%20portafolio%20profesional.%20Me%20gustar%C3%ADa%20conversar%20contigo%20sobre%20una%20oportunidad%20o%20proyecto.%20Saludos.',
  emailDraft: 'mailto:jemc2612@gmail.com?subject=Contacto%20desde%20tu%20portafolio&body=Hola%2C%20Jonas.%0A%0ATe%20contacto%20desde%20tu%20portafolio%20profesional.%20Me%20gustar%C3%ADa%20conversar%20contigo%20sobre%20una%20oportunidad%20o%20proyecto.%0A%0ASaludos.',
  cv: ''
};

const education = [
  ['Formación técnica', 'Iniciación Profesional Agropecuaria (IPA)', 'Especialización cursada en la Escuela Básica N.º 448 Dionisio Cabello', 'Caroaguá, Paraguay'],
  ['Bachillerato Técnico en Informática', 'Colegio Privado Subvencionado San Alfonso', '1.º al 3.º curso', 'Carapeguá, Paraguay'],
  ['Estudios superiores', 'Análisis de Sistemas Informáticos', 'Estudios en análisis, procesos, datos y desarrollo de software', ''],
  ['Estudios superiores', 'Psicología', 'Formación cursada en Psicología', '']
];

const services = [
  ['Desarrollo de software', 'Aplicaciones pensadas desde el problema: flujos, estados, excepciones y las personas que las operan.'],
  ['Frontend y experiencia de usuario', 'Interfaces claras y responsivas, diseñadas para que las personas puedan completar tareas con menos fricción.'],
  ['Sistemas empresariales', 'Módulos, permisos, autorizaciones y reglas de negocio que sostienen la operación sin perder trazabilidad.'],
  ['Datos y bases de datos', 'Modelado, consultas e integración de información para que las decisiones tengan una fuente confiable.'],
  ['Automatización + IA', 'IA aplicada como herramienta de apoyo para análisis, especificaciones, documentación y mejora del desarrollo; no como sustituto del criterio técnico.'],
  ['UX para operaciones', 'Interfaces que reducen fricción cuando el proceso no puede detenerse: claras, consistentes y responsables.']
];

const projects = [
  {
    slug: 'portfolio', id: '01', name: 'Portfolio profesional', category: 'Frontend · Producto web', status: 'Publicado', visibility: 'Público',
    type: 'Proyecto personal', period: '2026 — Actualidad', role: 'Diseño y desarrollo integral',
    lead: 'Un producto web estático, accesible y desplegado con un flujo reproducible de calidad y publicación.',
    problem: 'Presentar experiencia, proyectos privados y capacidades técnicas de forma creíble, rápida y segura, sin depender de un framework ni exponer información sensible.',
    solution: 'Arquitectura frontend con navegación SPA compatible con GitHub Pages, contenido centralizado, casos de estudio, experiencia offline y automatización de pruebas y despliegue.',
    modules: ['Navegación SPA', 'Casos de estudio', 'Temas accesibles', 'CV imprimible', 'Experiencia offline', 'CI/CD con GitHub Actions'],
    stack: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'GitHub Actions'],
    decisions: ['JavaScript clásico para reducir complejidad y dependencias de interfaz', 'Build estático con entradas por ruta para recargas directas', 'Pruebas automatizadas de contenido, accesibilidad, assets e integración'],
    outcome: 'Repositorio público, build reproducible y despliegue automatizado en GitHub Pages.',
    validation: ['Suite automatizada', 'Auditoría de recursos', 'Pruebas responsive', 'Verificación de rutas de producción'],
    repository: 'https://github.com/J0NAsM/Portafolio',
    demo: 'https://j0nasm.github.io/Portafolio/',
    tone: 'mint'
  },
  {
    slug: 'sigbo', id: '02', name: 'SIGBO', category: 'Fintech · Software empresarial', status: 'Privado', visibility: 'Descripción limitada',
    lead: 'Un sistema modular para operaciones financieras donde cada movimiento exige contexto, control y trazabilidad.',
    problem: 'Las operaciones de caja, tesorería y ahorro requieren reglas precisas, permisos definidos y estados que reduzcan el riesgo operativo.',
    solution: 'Diseño de módulos conectados para operar transacciones y flujos de autorización con foco en integridad, auditoría y experiencia del operador.',
    modules: ['Caja y tesorería', 'Cajeros y bóvedas', 'Ahorros y depósitos', 'Extracciones y remesas', 'Cotizaciones', 'Autorizaciones', 'Auditoría y conciliación'],
    stack: ['Java', 'SQL', 'PostgreSQL', 'GeneXus'],
    decisions: ['Estados explícitos para cada operación', 'Roles y permisos como parte del flujo', 'Trazabilidad operativa sin exponer datos sensibles'],
    tone: 'mint'
  },
  {
    slug: 'mbapo', id: '03', name: 'Mbapo', category: 'Marketplace · Plataforma de servicios', status: 'En desarrollo', visibility: 'Concepto público',
    lead: 'Una plataforma para acercar a quien necesita resolver algo con profesionales que pueden hacerlo bien.',
    problem: 'Encontrar servicios confiables suele depender de referencias informales, información incompleta y poca visibilidad de disponibilidad o reputación.',
    solution: 'Marketplace horizontal con perfiles profesionales, reputación, contratación y una experiencia preparada para los dos lados de la relación.',
    modules: ['Perfiles profesionales', 'Doble rol', 'Disponibilidad', 'Reputación y reseñas', 'Precios', 'Contratación'],
    stack: ['React', 'JavaScript', 'APIs', 'PostgreSQL'],
    decisions: ['Confianza visible antes del contacto', 'Flujos separados para cliente y profesional', 'Estado comunicado con transparencia: producto en desarrollo'],
    tone: 'amber'
  },
  {
    slug: 'bomberos', id: '04', name: 'Gestión Bomberos', category: 'CivicTech · Gestión institucional', status: 'En evolución', visibility: 'Concepto público',
    lead: 'Digitalización de información operativa para una institución donde coordinar rápido importa.',
    problem: 'Inventarios, servicios, inspecciones y estadísticas suelen fragmentarse entre papel, planillas y comunicación manual.',
    solution: 'Una visión de plataforma institucional que organiza la operativa, permite consultar historial y convierte datos cotidianos en información accionable.',
    modules: ['Móviles', 'Inspecciones', 'Inventario', 'Mantenimiento', 'Servicios', 'Estadísticas', 'Formularios'],
    stack: ['Python', 'SQL', 'HTML', 'CSS', 'JavaScript'],
    decisions: ['Captura estructurada cerca de la operación', 'Historial para seguimiento y mantenimiento', 'Interfaces responsive para uso en campo'],
    tone: 'coral'
  },
  {
    slug: 'inspecciones-moviles', id: '05', name: 'Inspecciones móviles', category: 'Operaciones · Herramientas internas', status: 'Investigación', visibility: 'Concepto público',
    lead: 'Inspecciones que convierten una lista de verificación en historial operativo útil.',
    problem: 'Sin evidencia ordenada, los estados de móviles y órdenes de trabajo quedan sujetos a registros dispersos.',
    solution: 'Flujo orientado a checklists, fotografías, firmas, estados y seguimiento de mantenimiento, con proyección de uso offline.',
    modules: ['Checklists', 'Fotografías', 'Firmas', 'Estados', 'Órdenes de trabajo', 'Notificaciones'],
    stack: ['Responsive web', 'APIs', 'SQLite', 'UX'],
    decisions: ['Evidencia vinculada a cada inspección', 'Diseño táctil y legible', 'Modelo preparado para conectividad intermitente'],
    tone: 'blue'
  }
];

const skills = [
  ['Frontend', 'HTML · CSS · JavaScript', 'Buen manejo de interfaces web, responsive design y experiencia de usuario.'],
  ['Backend', 'Python · Java · PHP · APIs', 'Desarrollo de sistemas, lógica de negocio, automatización e integración.'],
  ['Datos', 'PostgreSQL · MySQL · SQLite · SQL', 'Modelado y consulta para sistemas con información operativa.'],
  ['Ecosistema', 'Git · GitHub · DBeaver · GeneXus · Obsidian', 'Herramientas para construir, documentar y mantener.'],
  ['IA aplicada', 'Especificaciones · análisis · documentación · agentes', 'Exploración activa de IA como apoyo riguroso al desarrollo.']
];

const experience = [
  ['2025 — Actualidad', 'Desarrollador Junior · Softshop', 'Desarrollo de sistemas en Carapeguá, con IA como herramienta de apoyo y atención a frontend, experiencia de usuario y procesos de negocio.'],
  ['Implementación', 'Facturación electrónica SIFEN', 'Participación en la implementación de facturación electrónica, sin exponer información técnica o comercial privada.'],
  ['Perfil actual', 'Sistemas y productos digitales', 'Diseño y desarrollo de soluciones enfocadas en procesos, datos y operaciones reales.'],
  ['Formación', 'Análisis de Sistemas Informáticos', 'Formación principal para traducir necesidades de negocio en sistemas estructurados.'],
  ['Operaciones', 'Experiencia de caja y operación', 'Comprensión directa de procesos bajo presión, recursos y resolución de incidentes.'],
  ['Servicio voluntario', 'Bombero Voluntario Combatiente · Rango Cabo', 'Servicio en el Cuerpo de Bomberos Voluntarios de Carapeguá, con experiencia en coordinación, trabajo en equipo, disciplina y respuesta operativa.']
];

window.portfolioData = { profile, services, projects, skills, experience, education };
})();
