(() => {
const profile = {
  name: 'Jonas Emanuel Martínez Cáceres',
  shortName: 'Jonas Martínez',
  role: 'Análisis de sistemas · Desarrollo de software',
  focus: 'Sistemas empresariales · Procesos operativos · Datos',
  tagline: 'Analizo problemas. Diseño sistemas. Construyo soluciones.',
  summary: 'Desarrollo soluciones tecnológicas para convertir procesos reales, reglas complejas e información dispersa en sistemas claros y operables.',
  email: '', github: '', linkedin: '', whatsapp: '', cv: ''
};

const services = [
  ['Desarrollo de software', 'Aplicaciones pensadas desde el problema: flujos, estados, excepciones y las personas que las operan.'],
  ['Sistemas empresariales', 'Módulos, permisos, autorizaciones y reglas de negocio que sostienen la operación sin perder trazabilidad.'],
  ['Datos y bases de datos', 'Modelado, consultas e integración de información para que las decisiones tengan una fuente confiable.'],
  ['Automatización + IA', 'IA aplicada a análisis, especificaciones, documentación y mejora de procesos de desarrollo.'],
  ['UX para operaciones', 'Interfaces que reducen fricción cuando el proceso no puede detenerse: claras, consistentes y responsables.']
];

const projects = [
  {
    slug: 'sigbo', id: '01', name: 'SIGBO', category: 'Fintech · Software empresarial', status: 'Privado',
    lead: 'Un sistema modular para operaciones financieras donde cada movimiento exige contexto, control y trazabilidad.',
    problem: 'Las operaciones de caja, tesorería y ahorro requieren reglas precisas, permisos definidos y estados que reduzcan el riesgo operativo.',
    solution: 'Diseño de módulos conectados para operar transacciones y flujos de autorización con foco en integridad, auditoría y experiencia del operador.',
    modules: ['Caja y tesorería', 'Cajeros y bóvedas', 'Ahorros y depósitos', 'Extracciones y remesas', 'Cotizaciones', 'Autorizaciones', 'Auditoría y conciliación'],
    stack: ['Java', 'SQL', 'PostgreSQL', 'GeneXus'],
    decisions: ['Estados explícitos para cada operación', 'Roles y permisos como parte del flujo', 'Trazabilidad operativa sin exponer datos sensibles'],
    tone: 'mint'
  },
  {
    slug: 'mbapo', id: '02', name: 'Mbapo', category: 'Marketplace · Plataforma de servicios', status: 'En desarrollo',
    lead: 'Una plataforma para acercar a quien necesita resolver algo con profesionales que pueden hacerlo bien.',
    problem: 'Encontrar servicios confiables suele depender de referencias informales, información incompleta y poca visibilidad de disponibilidad o reputación.',
    solution: 'Marketplace horizontal con perfiles profesionales, reputación, contratación y una experiencia preparada para los dos lados de la relación.',
    modules: ['Perfiles profesionales', 'Doble rol', 'Disponibilidad', 'Reputación y reseñas', 'Precios', 'Contratación'],
    stack: ['React', 'JavaScript', 'APIs', 'PostgreSQL'],
    decisions: ['Confianza visible antes del contacto', 'Flujos separados para cliente y profesional', 'Estado comunicado con transparencia: producto en desarrollo'],
    tone: 'amber'
  },
  {
    slug: 'bomberos', id: '03', name: 'Gestión Bomberos', category: 'CivicTech · Gestión institucional', status: 'En evolución',
    lead: 'Digitalización de información operativa para una institución donde coordinar rápido importa.',
    problem: 'Inventarios, servicios, inspecciones y estadísticas suelen fragmentarse entre papel, planillas y comunicación manual.',
    solution: 'Una visión de plataforma institucional que organiza la operativa, permite consultar historial y convierte datos cotidianos en información accionable.',
    modules: ['Móviles', 'Inspecciones', 'Inventario', 'Mantenimiento', 'Servicios', 'Estadísticas', 'Formularios'],
    stack: ['Python', 'SQL', 'HTML', 'CSS', 'JavaScript'],
    decisions: ['Captura estructurada cerca de la operación', 'Historial para seguimiento y mantenimiento', 'Interfaces responsive para uso en campo'],
    tone: 'coral'
  },
  {
    slug: 'inspecciones-moviles', id: '04', name: 'Inspecciones móviles', category: 'Operaciones · Herramientas internas', status: 'Investigación',
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
  ['Frontend', 'HTML · CSS · JavaScript · React', 'Experiencia práctica construyendo interfaces web y flujos de uso.'],
  ['Backend', 'Java · Python · APIs', 'Uso en lógica de negocio, automatización e integración.'],
  ['Datos', 'PostgreSQL · MySQL · SQLite · SQL', 'Modelado y consulta para sistemas con información operativa.'],
  ['Ecosistema', 'Git · GitHub · DBeaver · GeneXus · Obsidian', 'Herramientas para construir, documentar y mantener.'],
  ['IA aplicada', 'Especificaciones · análisis · documentación · agentes', 'Exploración activa de IA como apoyo riguroso al desarrollo.']
];

const experience = [
  ['Softshop', 'Experiencia con GeneXus', 'Experiencia profesional con GeneXus en Softshop, vinculada al desarrollo de soluciones de software.'],
  ['Perfil actual', 'Sistemas y productos digitales', 'Diseño y desarrollo de soluciones enfocadas en procesos, datos y operaciones reales.'],
  ['Formación', 'Análisis de Sistemas Informáticos', 'Formación principal para traducir necesidades de negocio en sistemas estructurados.'],
  ['Operaciones', 'Experiencia de caja y operación', 'Comprensión directa de procesos bajo presión, recursos y resolución de incidentes.'],
  ['Servicio', 'Cuerpo de Bomberos Voluntarios de Carapeguá', 'Experiencia institucional que aporta coordinación, servicio y una mirada práctica sobre la información operativa.']
];

window.portfolioData = { profile, services, projects, skills, experience };
})();
