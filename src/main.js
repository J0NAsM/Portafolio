const { profile, services, projects, skills, experience } = window.portfolioData;
const blogPosts = Array.isArray(window.portfolioBlogPosts) ? window.portfolioBlogPosts : [];
const app = document.querySelector('#app');
const storageGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch {} };

let theme = storageGet('theme') || 'system';
let menuOpen = false;
let paletteOpen = false;
let projectFilter = 'Todos';
let blogCategory = 'Todas';
let focusTarget = '';
let shouldScrollToTop = false;

const isLocalFile = location.protocol === 'file:';
const currentPath = () => isLocalFile ? (location.hash.slice(1) || '/') : (location.pathname.replace(/\/$/, '') || '/');
const internal = path => `data-route="${path}" href="${isLocalFile ? `#${path}` : path}"`;
const icon = name => ({ arrow: '→', close: '×', sun: '☼', moon: '◐' }[name] || '•');
const status = value => `<span class="status">${value}</span>`;
const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const hasContact = () => Boolean(profile.email || profile.github || profile.linkedin || profile.whatsapp);

function updateConnectionStatus() {
  const notice = document.querySelector('#connection-status');
  if (!notice) return;
  const offline = !navigator.onLine;
  notice.hidden = !offline;
  notice.textContent = offline ? 'Estás sin conexión. Puedes seguir viendo el portfolio; las funciones que requieren servidor estarán disponibles al reconectarte.' : '';
}

function enableOfflineExperience() {
  updateConnectionStatus();
  addEventListener('online', updateConnectionStatus);
  addEventListener('offline', updateConnectionStatus);
  if (!isLocalFile && 'serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js').catch(() => {});
}

function setMeta(title, description) {
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', document.documentElement.dataset.theme === 'dark' ? '#101514' : '#f5f5ef');
}

function applyTheme() {
  const resolved = theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  storageSet('theme', theme);
}

function socialLinks() {
  return [
    profile.github && `<a href="${profile.github}" target="_blank" rel="noreferrer">GitHub</a>`,
    profile.linkedin && `<a href="${profile.linkedin}" target="_blank" rel="noreferrer">LinkedIn</a>`,
    profile.whatsapp && `<a href="${profile.whatsapp}" target="_blank" rel="noreferrer">WhatsApp</a>`
  ].filter(Boolean).join('');
}

function nav() {
  const path = currentPath();
  const item = (label, url) => {
    const active = path === url || (url === '/proyectos' && path.startsWith('/proyectos/'));
    return `<a ${internal(url)} class="${active ? 'active' : ''}"${active ? ' aria-current="page"' : ''}>${label}</a>`;
  };
  const links = `${item('Inicio', '/')}${item('Proyectos', '/proyectos')}${item('Demos', '/muestras')}${item('Experiencia', '/experiencia')}${item('Stack', '/stack')}${item('CV', '/cv')}${hasContact() ? item('Contacto', '/contacto') : ''}`;
  return `<header class="site-header">
    <a class="brand" ${internal('/')} aria-label="Inicio de ${profile.shortName}"><span class="brand-mark">J</span><span>Jonas<span class="muted">.dev</span></span></a>
    <nav class="desktop-nav" aria-label="Principal">${links}</nav>
    <div class="header-actions">
      <button class="theme-button" type="button" data-theme-toggle aria-label="Cambiar tema; actual: ${theme}">${theme === 'dark' ? icon('moon') : theme === 'light' ? icon('sun') : '◌'}<span>${theme}</span></button>
      <button class="menu-button" type="button" data-menu aria-expanded="${menuOpen}" aria-controls="mobile-menu">${menuOpen ? icon('close') : '☰'}<span class="sr-only">Menú</span></button>
    </div>
    <nav id="mobile-menu" class="mobile-nav ${menuOpen ? 'open' : ''}" aria-label="Navegación móvil" aria-hidden="${!menuOpen}">${links}</nav>
  </header>`;
}

function footer() {
  return `<footer><span>© ${new Date().getFullYear()} ${profile.name}</span><span>Software para procesos reales.</span><a href="${isLocalFile ? 'public/privacy.html' : '/privacidad'}">Privacidad</a>${socialLinks()}</footer>`;
}

const sectionTitle = (eyebrow, title, text = '') => `<div class="section-title"><p class="eyebrow">${eyebrow}</p><h2>${title}</h2>${text ? `<p>${text}</p>` : ''}</div>`;
const cta = (label, path, kind = '') => `<a class="button ${kind}" ${internal(path)}>${label}<span>${icon('arrow')}</span></a>`;

function projectVisual(project, compact = false) {
  return `<figure class="project-visual ${project.tone} ${compact ? 'compact' : ''}">
    <img src="public/images/architecture/${project.slug}-flow.svg" alt="Diagrama conceptual de ${project.name}: ${project.modules.slice(0, 3).join(', ')}." loading="lazy" decoding="async">
    <figcaption><span>Diagrama conceptual</span><strong>${project.name}</strong><small>Representación pública; no expone datos ni arquitectura interna.</small></figcaption>
  </figure>`;
}

function productMock(project) {
  const mockups = {
    sigbo: `<div class="mock-shell mock-finance"><div class="mock-top"><span class="mock-logo">SIGBO</span><span>Operación de caja</span><i></i></div><div class="mock-side"><b>Inicio</b><b class="selected">Movimientos</b><b>Autorizaciones</b><b>Auditoría</b></div><div class="mock-screen"><div class="mock-kpis"><span><small>Saldo disponible</small><strong>Gs. 18.240.000</strong></span><span><small>Operaciones hoy</small><strong>24</strong></span></div><div class="mock-table"><p>Movimientos recientes <em>Validado</em></p><div><span>Depósito</span><span>08:42</span><b>+ Gs. 2.500.000</b></div><div><span>Remesa</span><span>09:15</span><b>En revisión</b></div><div><span>Extracción</span><span>10:30</span><b>− Gs. 450.000</b></div></div></div></div>`,
    mbapo: `<div class="mock-shell mock-market"><div class="mock-top"><span class="mock-logo">mbapo</span><span class="mock-search">¿Qué servicio necesitás?</span><i></i></div><div class="mock-screen"><p class="mock-label">Profesionales disponibles cerca de ti</p><div class="mock-profiles"><article><span>MS</span><div><b>María S.</b><small>Electricista · Disponible hoy</small></div><strong>4.9</strong></article><article><span>JR</span><div><b>Jorge R.</b><small>Reparaciones · Mañana</small></div><strong>4.8</strong></article><article><span>AL</span><div><b>Ana L.</b><small>Diseño · Esta semana</small></div><strong>5.0</strong></article></div><button type="button">Ver profesionales</button></div></div>`,
    bomberos: `<div class="mock-shell mock-civic"><div class="mock-top"><span class="mock-logo">GESTIÓN</span><span>Bomberos · Carapeguá</span><i></i></div><div class="mock-screen"><p class="mock-label">Estado operativo</p><div class="mock-status-grid"><article><strong>08</strong><span>Móviles</span><small>6 disponibles</small></article><article><strong>12</strong><span>Inspecciones</span><small>Esta semana</small></article><article><strong>04</strong><span>Alertas</span><small>Revisar</small></article></div><div class="mock-timeline"><span></span><p><b>Inspección completada</b><small>Móvil 03 · Hace 24 min</small></p><span></span><p><b>Mantenimiento programado</b><small>Equipo de rescate · Mañana</small></p></div></div></div>`,
    'inspecciones-moviles': `<div class="mock-shell mock-mobile"><div class="mobile-head"><span>‹</span><b>Inspección 032</b><i>•••</i></div><div class="mobile-body"><p class="mock-label">Móvil 03 · Lista de verificación</p><div class="check-row"><span>✓</span><b>Luces de emergencia</b><em>OK</em></div><div class="check-row"><span>✓</span><b>Equipamiento de seguridad</b><em>OK</em></div><div class="check-row warn"><span>!</span><b>Nivel de combustible</b><em>Revisar</em></div><button type="button">Guardar inspección</button></div></div>`
  };
  return `<figure class="product-mock ${project.tone}">${mockups[project.slug]}<figcaption><span>Vista simulada</span>Interfaz conceptual para mostrar la dirección visual; no corresponde a una pantalla de producción.</figcaption></figure>`;
}

function visualFigure(name, source, alt, caption, className = '') {
  return `<figure class="visual-figure ${className}"><img src="public/images/general/${source}" alt="${alt}" loading="lazy" decoding="async"><figcaption><span class="visual-label">${name}</span> · ${caption}</figcaption></figure>`;
}

function evidenceWall() {
  const cards = [
    ['Arquitectura operativa', ['Operación', 'Reglas y permisos', 'Auditoría'], 'Modelo conceptual para procesos con trazabilidad.'],
    ['Flujo de información', ['Captura', 'Validación', 'Historial'], 'Modelo conceptual para digitalizar tareas operativas.'],
    ['Sistema modular', ['Módulos', 'Estados', 'Decisiones'], 'Modelo conceptual para soluciones empresariales conectadas.']
  ];
  return `<section class="section evidence-wall"><div class="evidence-intro">${sectionTitle('Método', 'Diseño con contexto operativo.', 'Los diagramas y casos explican cómo se conectan personas, reglas, datos y decisiones, sin exponer información sensible.')}</div><div class="evidence-grid">${cards.map(([title, steps, text]) => `<article><p class="eyebrow">Modelo conceptual</p><h3>${title}</h3><div class="mini-flow">${steps.map((step, index) => `<div><span>${String(index + 1).padStart(2, '0')}</span><strong>${step}</strong></div>`).join('')}</div><p>${text}</p></article>`).join('')}</div></section>`;
}

function home() {
  const featured = projects[0];
  const domains = [
    ['Sistemas empresariales', 'Reglas de negocio, permisos, estados y flujos de autorización.'],
    ['Operaciones financieras', 'Caja, tesorería, ahorros, auditoría y conciliación.'],
    ['Digitalización operativa', 'Inspecciones, inventario, servicios y datos institucionales.']
  ];
  return `<main id="main">
    <div class="demo-notice" role="note"><span>Modo demostración</span><p>Las interfaces visuales de esta versión son simulaciones para evaluar diseño, jerarquía y contraste. Se reemplazarán por evidencia real cuando esté disponible.</p><a ${internal('/muestras')}>Ver todas las muestras →</a></div>
    <section class="hero recruiter-hero">
      <div class="hero-copy"><p class="eyebrow">${profile.role}</p><h1>Analizo problemas.<br><em>Diseño sistemas.</em><br>Construyo soluciones.</h1><p class="role-focus">${profile.focus}</p><p class="lede">${profile.summary}</p><div class="actions">${cta('Ver proyectos', '/proyectos')}${cta('Ver experiencia', '/experiencia', 'secondary')}</div></div>
      <aside class="hero-proof" aria-label="Resumen profesional"><p class="eyebrow">Perfil en una mirada</p><dl><div><dt>Enfoque</dt><dd>Sistemas para procesos reales</dd></div><div><dt>Dominios</dt><dd>Fintech · Operaciones · Gestión institucional</dd></div><div><dt>Base técnica</dt><dd>Java · Python · SQL · React</dd></div></dl><p>El alcance público se presenta sin revelar datos operativos, código propietario ni credenciales.</p></aside>
    </section>
    <section class="visual-overview"><div><p class="eyebrow">Cómo abordo un sistema</p><h2>La imagen explica el método; el texto aporta el contexto.</h2><p>Desde la necesidad real hasta una solución que se pueda operar, las decisiones conectan personas, reglas, datos y uso.</p></div>${visualFigure('Mapa conceptual', 'portfolio-lens.svg', 'Mapa conceptual: contexto, reglas, datos y uso forman una solución operable.', 'Representación de enfoque profesional, no arquitectura interna.')}</section>
    <section class="evidence-strip">${domains.map(([title, text], index) => `<article><span>0${index + 1}</span><h2>${title}</h2><p>${text}</p></article>`).join('')}</section>
    <section class="section featured-section">${sectionTitle('Proyectos destacados', 'Evidencia antes que promesas.', 'Cada caso explica el problema, el enfoque de solución y el estado conocido.')}<article class="featured"><div class="featured-copy"><p class="eyebrow">${featured.category} · ${status(featured.status)}</p><h3>${featured.name}</h3><p>${featured.lead}</p><ul>${featured.modules.slice(0, 4).map(module => `<li>${module}</li>`).join('')}</ul>${cta('Ver caso de estudio', '/proyectos/sigbo')}</div>${projectVisual(featured)}</article><div class="secondary-projects">${projects.slice(1).map(project => `<article><p class="eyebrow">${project.category}</p><h3>${project.name} ${status(project.status)}</h3><p>${project.lead}</p><a ${internal(`/proyectos/${project.slug}`)}>Ver caso →</a></article>`).join('')}</div></section>
    <section class="section ui-showcase">${sectionTitle('Muestras de interfaz', 'Así puede sentirse el producto.', 'Composiciones de demostración para probar la dirección visual antes de contar con capturas reales.')}<div class="mock-grid">${projects.slice(0, 3).map(project => `<article><div class="mock-heading"><span>${project.id}</span><h3>${project.name}</h3><p>${project.category}</p></div>${productMock(project)}</article>`).join('')}</div>${cta('Explorar todas las demos', '/muestras', 'text-button')}</section>
    ${evidenceWall()}
    <section class="section recruiter-experience">${sectionTitle('Trayectoria relevante', 'Tecnología con contexto operativo.', 'La formación en sistemas se complementa con exposición a operaciones, gestión de información y proyectos de digitalización.')}<div class="experience-preview">${experience.map(([time, title, text]) => `<article><span>${time}</span><div><h3>${title}</h3><p>${text}</p></div></article>`).join('')}</div>${cta('Ver trayectoria', '/experiencia', 'text-button')}</section>
    <section class="section services">${sectionTitle('Especialización', 'Qué aporto a una solución.', 'Tecnologías y decisiones elegidas según las reglas del proceso, no por una lista de herramientas.')}<div class="service-grid">${services.map(([title, text], index) => `<article><span>0${index + 1}</span><h3>${title}</h3><p>${text}</p></article>`).join('')}</div></section>
    <section class="section process compact-process">${sectionTitle('Forma de trabajo', 'Del problema a una solución operable.')}<div class="process-flow">${['Contexto', 'Reglas', 'Datos', 'Arquitectura', 'Interfaz', 'Pruebas'].map((step, index) => `<div><span>${String(index + 1).padStart(2, '0')}</span>${step}</div>`).join('')}</div></section>
  </main>`;
}

function projectsPage() {
  const filters = ['Todos', ...new Set(projects.map(project => project.category.split(' · ')[0]))];
  const visibleProjects = projectFilter === 'Todos' ? projects : projects.filter(project => project.category.startsWith(projectFilter));
  return `<main id="main" class="page"><div class="page-intro">${sectionTitle('Proyectos', 'Sistemas pensados para el mundo real.', 'Una selección de problemas, restricciones y soluciones. Los proyectos sensibles se presentan sin información confidencial.')}</div><div class="project-filters" aria-label="Filtrar proyectos">${filters.map(filter => `<button type="button" class="${filter === projectFilter ? 'active' : ''}" data-project-filter="${filter}" aria-pressed="${filter === projectFilter}">${filter}</button>`).join('')}</div><p class="project-count" aria-live="polite">${visibleProjects.length} caso${visibleProjects.length === 1 ? '' : 's'} de estudio.</p><div class="project-list">${visibleProjects.map(project => `<article class="project-row"><div><p class="eyebrow">${project.id} · ${project.category}</p><h2>${project.name} ${status(project.status)}</h2><p>${project.lead}</p><div class="badges">${project.stack.map(item => `<span>${item}</span>`).join('')}</div>${cta('Abrir caso', `/proyectos/${project.slug}`, 'text-button')}</div>${projectVisual(project, true)}</article>`).join('')}</div></main>`;
}

function caseStudy(project) {
  if (!project) return notFound();
  return `<main id="main" class="case-study"><a class="back-link" ${internal('/proyectos')}>← Todos los proyectos</a><header class="case-hero"><div><p class="eyebrow">${project.id} · ${project.category}</p><h1>${project.name}</h1><p class="case-lead">${project.lead}</p><div class="badges">${project.stack.map(item => `<span>${item}</span>`).join('')} ${status(project.status)}</div></div>${projectVisual(project)}</header><section class="case-demo"><div>${sectionTitle('Demostración visual', 'Una interfaz imaginada para el flujo.', 'Vista temporal de diseño; no refleja un producto liberado ni datos reales.')}</div>${productMock(project)}</section><section class="case-grid"><aside aria-label="Secciones del caso"><p>En este caso</p><a href="#contexto">Contexto</a><a href="#solucion">Solución</a><a href="#modulos">Módulos</a><a href="#decisiones">Decisiones</a></aside><div class="case-content"><section id="contexto"><p class="eyebrow">Contexto y problema</p><h2>Diseñar para una situación concreta.</h2><p>${project.problem}</p></section><section id="solucion"><p class="eyebrow">Solución</p><h2>Una estructura que acompaña el flujo.</h2><p>${project.solution}</p></section><section id="modulos"><p class="eyebrow">Funcionalidades</p><h2>Componentes del sistema.</h2><div class="module-grid">${project.modules.map((module, index) => `<div><span>${String(index + 1).padStart(2, '0')}</span>${module}</div>`).join('')}</div></section><section id="decisiones"><p class="eyebrow">Decisiones de diseño</p><h2>Lo que sostiene la solución.</h2><ul class="decision-list">${project.decisions.map(decision => `<li>${decision}</li>`).join('')}</ul><p class="privacy-note">Este caso de estudio describe el enfoque y las capacidades de la solución. No incluye código propietario, credenciales ni datos operativos.</p></section></div></section></main>`;
}

function demosPage() {
  return `<main id="main" class="page demos-page"><div class="page-intro narrow">${sectionTitle('Muestras visuales', 'Un prototipo de la experiencia antes de la evidencia real.', 'Estas pantallas son simulaciones de interfaz creadas para evaluar color, contraste, estructura y claridad. No son capturas de sistemas existentes.')}</div><div class="demo-principles"><article><span>01</span><h2>Contraste</h2><p>Información importante sobre fondos oscuros y acentos visibles.</p></article><article><span>02</span><h2>Jerarquía</h2><p>Estados, acciones y datos separados con intención.</p></article><article><span>03</span><h2>Operación</h2><p>Interfaces pensadas para lectura rápida y decisiones concretas.</p></article></div><div class="demo-gallery">${projects.map(project => `<article><header><p class="eyebrow">${project.id} · Vista simulada</p><h2>${project.name}</h2><p>${project.lead}</p></header>${productMock(project)}<a ${internal(`/proyectos/${project.slug}`)}>Abrir caso de estudio →</a></article>`).join('')}</div></main>`;
}

function about() {
  return `<main id="main" class="page"><div class="page-intro narrow">${sectionTitle('Sobre mí', 'Software que responde a una necesidad real.')}<div class="profile-intro"><figure class="profile-placeholder"><img src="public/images/general/profile-placeholder.webp" alt="Retrato ilustrativo provisional para el perfil profesional de Jonas Martínez." loading="lazy" decoding="async"><figcaption>Imagen ilustrativa provisional; se reemplazará por una fotografía profesional.</figcaption></figure><div><p class="body-large">Soy ${profile.name}, desarrollador junior de ${profile.location}, Paraguay.</p><p>Me formo en Análisis de Sistemas Informáticos y me interesa convertir procesos complejos en herramientas claras, confiables y útiles. Mi foco está en software, datos, experiencia de usuario y sistemas empresariales.</p><p>Uso la IA como apoyo para analizar y desarrollar con mayor claridad, manteniendo siempre el criterio técnico y la responsabilidad sobre el resultado.</p></div></div>${visualFigure('Método de trabajo', 'work-method.svg', 'Método de trabajo: contexto, reglas, datos, interfaz y mejora.', 'Diagrama conceptual de la forma de trabajo.', 'about-visual')}</div><section class="principles"><p class="eyebrow">Forma de trabajar</p>${['Entender antes de construir', 'Hacer visible la regla de negocio', 'Diseñar para la persona que opera', 'Iterar con criterio y evidencia'].map((item, index) => `<div><span>0${index + 1}</span><h2>${item}</h2></div>`).join('')}</section></main>`;
}

function experiencePage() {
  return `<main id="main" class="page"><div class="page-intro">${sectionTitle('Experiencia y formación', 'Una mirada técnica construida también desde la operación.', 'El recorrido combina formación en sistemas, proyectos tecnológicos y experiencia en contextos que exigen responsabilidad y coordinación.')}</div><div class="timeline">${experience.map(([time, title, text]) => `<article><span>${time}</span><div><h2>${title}</h2><p>${text}</p></div></article>`).join('')}</div><section class="education"><p class="eyebrow">Formación principal</p><h2>Análisis de Sistemas Informáticos</h2><p>Una base para modelar necesidades, información y procesos como soluciones tecnológicas sostenibles.</p></section></main>`;
}

function educationPage() {
  return `<main id="main" class="page"><div class="page-intro narrow">${sectionTitle('Formación', 'Aprender para modelar sistemas mejores.', 'La formación principal se complementa con práctica en proyectos, documentación y exploración tecnológica.')}<section class="education"><p class="eyebrow">Formación principal</p><h2>Análisis de Sistemas Informáticos</h2><p>Base para analizar requerimientos, modelar información, entender procesos y traducirlos en soluciones de software.</p></section><section class="principles"><p class="eyebrow">Aprendizaje continuo</p>${['Arquitectura y diseño de sistemas', 'Bases de datos y reglas de negocio', 'IA aplicada al desarrollo', 'Documentación y gestión de conocimiento'].map((item, index) => `<div><span>0${index + 1}</span><h2>${item}</h2></div>`).join('')}</section></div></main>`;
}

function stackPage() {
  return `<main id="main" class="page"><div class="page-intro">${sectionTitle('Stack tecnológico', 'Herramientas al servicio del problema.', 'No son porcentajes. Son tecnologías utilizadas, practicadas o exploradas según las necesidades de cada solución.')}</div>${visualFigure('Tecnología con contexto', 'portfolio-lens.svg', 'Mapa conceptual: contexto, reglas, datos y uso orientan la elección tecnológica.', 'La tecnología acompaña al proceso, no lo reemplaza.', 'stack-visual')}<div class="skill-grid">${skills.map(([area, tech, text], index) => `<article><span>0${index + 1}</span><h2>${area}</h2><strong>${tech}</strong><p>${text}</p></article>`).join('')}</div></main>`;
}

function cvPage() {
  const field = (key, value, label) => `<span class="cv-field" contenteditable="true" role="textbox" aria-label="${label}" data-cv-field="${key}">${value}</span>`;
  return `<main id="main" class="page cv-page"><div class="cv-toolbar no-print">${sectionTitle('CV ATS', 'Un CV simple, legible y preparado para completar.', 'Esta versión evita columnas, tablas, íconos y gráficos. Completa los campos entre corchetes con información verificable antes de imprimir o guardar como PDF.')}<div class="cv-actions"><button class="button" type="button" data-print-cv>Imprimir CV <span>→</span></button></div><p class="ats-note"><strong>Uso recomendado:</strong> adapta las competencias y viñetas a una oferta concreta, usando únicamente palabras clave y resultados que puedas demostrar.</p></div><article class="cv-document" aria-label="Currículum ATS imprimible"><header><h1>${profile.name}</h1><p>${field('city', profile.location, 'Ciudad y país')} | ${field('phone', '+595 986 914726', 'Teléfono')} | ${field('email', profile.email, 'Email profesional')}</p><p>LinkedIn: ${field('linkedin', '[Pendiente]', 'LinkedIn')} | GitHub: ${field('github', profile.github.replace('https://', ''), 'GitHub')}</p></header><section><h2>PERFIL PROFESIONAL</h2><p>Desarrollador Junior orientado al desarrollo de software y al análisis de procesos empresariales. Experiencia práctica en sistemas con reglas de negocio, datos, flujos operativos, frontend y experiencia de usuario.</p></section><section><h2>COMPETENCIAS CLAVE</h2><p><strong>Desarrollo:</strong> Python, Java, JavaScript, PHP, HTML, CSS y APIs.</p><p><strong>Datos:</strong> SQL, PostgreSQL, MySQL, SQLite, modelado y consulta de datos.</p><p><strong>Sistemas:</strong> análisis de sistemas, reglas de negocio, flujos de autorización, facturación electrónica y procesos transaccionales.</p><p><strong>Herramientas:</strong> Git, GitHub, DBeaver, GeneXus, documentación técnica e IA aplicada al desarrollo.</p></section><section><h2>EXPERIENCIA LABORAL</h2><div class="cv-entry"><p><strong>Softshop</strong> | Carapeguá, Paraguay</p><p><strong>Desarrollador Junior</strong> | 2025 – Actualidad</p><p>• Desarrollo de sistemas, con IA como herramienta de apoyo y foco en frontend y experiencia de usuario.</p><p>• Participación en la implementación de facturación electrónica SIFEN, sin exponer información privada.</p><p class="cv-field" contenteditable="true" role="textbox" aria-label="Responsabilidad verificable en Softshop" data-cv-field="softshop-bullet">• [Agrega una responsabilidad, módulo o resultado verificable.]</p></div></section><section><h2>EDUCACIÓN</h2><p><strong>Análisis de Sistemas Informáticos</strong> | ${field('institution', '[Institución]', 'Institución educativa')} | ${field('education-date', '[Año de inicio] – [Año de finalización o Actualidad]', 'Periodo educativo')}</p></section><section><h2>IDIOMAS Y CERTIFICACIONES</h2><p><strong>Nacionalidad:</strong> Paraguaya</p><p><strong>Idiomas:</strong> ${field('languages', '[Idioma] ([Nivel CEFR: A1–C2])', 'Idiomas y niveles')}</p><p><strong>Certificaciones:</strong> ${field('certifications', '[Agregar solo certificaciones verificables]', 'Certificaciones')}</p></section></article></main>`;
}

function contact() {
  const channels = [profile.email && `<a class="button" href="mailto:${profile.email}">Escribir un email <span>→</span></a>`, socialLinks()].filter(Boolean).join('');
  return `<main id="main" class="page contact-page"><div class="page-intro narrow">${sectionTitle('Contacto', 'Hablemos de un problema que valga la pena ordenar.')}<div class="contact-card"><span class="contact-symbol">↗</span><h2>Canales profesionales</h2>${channels || '<p>Los canales de contacto se incorporarán cuando estén disponibles.</p>'}</div></div></main>`;
}

function notFound() {
  return `<main id="main" class="not-found"><p class="eyebrow">Error 404</p><h1>Esta ruta no forma parte del sistema.</h1><p>Puede que haya cambiado o que nunca haya existido.</p>${cta('Volver al inicio', '/')}</main>`;
}

const publicPosts = () => blogPosts.filter(post => post && post.published && post.slug && post.title && post.category && post.publishedAt).sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
const blogDate = value => new Intl.DateTimeFormat('es-PY', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));

function blogPage() {
  const posts = publicPosts();
  const categories = ['Todas', ...new Set(posts.map(post => post.category))];
  const visiblePosts = blogCategory === 'Todas' ? posts : posts.filter(post => post.category === blogCategory);
  const entries = visiblePosts.map(post => `<article class="blog-card"><p class="eyebrow"><time datetime="${escapeHtml(post.publishedAt)}">${blogDate(post.publishedAt)}</time> · ${escapeHtml(post.category)}</p><h2>${escapeHtml(post.title)}</h2><p>${escapeHtml(post.excerpt)}</p><a class="back-link" ${internal(`/blog/${post.slug}`)}>Leer publicación →</a></article>`).join('') || '<div class="blog-empty"><h2>Aún no hay publicaciones en esta categoría.</h2><p>Vuelve pronto para conocer avances, aprendizajes y decisiones de los proyectos.</p></div>';
  return `<main id="main" class="page blog-page"><div class="page-intro narrow">${sectionTitle('Blog', 'Notas de trabajo, aprendizaje y proceso.', 'Un espacio para compartir avances, decisiones y reflexiones.')}</div>${visualFigure('Cómo leer el blog', 'blog-organizer.svg', 'Diagrama de organización del blog: publicación, categoría y fecha.', 'Las notas se pueden recorrer por tema y por fecha.', 'blog-visual')}<div class="blog-filters" aria-label="Filtrar publicaciones por categoría">${categories.map(category => `<button class="${category === blogCategory ? 'active' : ''}" type="button" data-blog-category="${escapeHtml(category)}" aria-pressed="${category === blogCategory}">${escapeHtml(category)}</button>`).join('')}</div><p class="blog-count" aria-live="polite">${visiblePosts.length} publicación${visiblePosts.length === 1 ? '' : 'es'} visible${visiblePosts.length === 1 ? '' : 's'}.</p><section class="blog-list">${entries}</section></main>`;
}

function blogArticle(post) {
  if (!post) return notFound();
  const paragraphs = String(post.body || '').split(/\n{2,}/).filter(Boolean).map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`).join('');
  return `<main id="main" class="page blog-article"><a class="back-link" ${internal('/blog')}>← Volver al blog</a><article><header class="page-intro narrow"><p class="eyebrow"><time datetime="${escapeHtml(post.publishedAt)}">${blogDate(post.publishedAt)}</time> · ${escapeHtml(post.category)}</p><h1>${escapeHtml(post.title)}</h1><p class="body-large">${escapeHtml(post.excerpt)}</p></header><div class="blog-body">${paragraphs}</div></article></main>`;
}

function palette() {
  const contactItem = hasContact() ? '<button data-route="/contacto">Contacto <kbd>↵</kbd></button>' : '';
  return `<div class="palette-overlay ${paletteOpen ? 'visible' : ''}" data-palette-close aria-hidden="${!paletteOpen}"><div class="palette" role="dialog" aria-modal="true" aria-label="Acciones rápidas"><div><span>⌘ K</span><input data-palette-input placeholder="Ir a…" aria-label="Filtrar acciones rápidas"></div><button data-route="/proyectos">Proyectos <kbd>↵</kbd></button><button data-route="/muestras">Muestras visuales <kbd>↵</kbd></button><button data-route="/experiencia">Experiencia <kbd>↵</kbd></button><button data-route="/cv">CV ATS <kbd>↵</kbd></button>${contactItem}<button data-theme-toggle>Cambiar tema <kbd>↵</kbd></button></div></div>`;
}

function getPage() {
  const path = currentPath();
  if (path === '/') return [home(), 'Jonas Martínez — Sistemas que resuelven', 'Análisis de sistemas, software empresarial y soluciones para procesos reales.'];
  if (path === '/proyectos') return [projectsPage(), 'Proyectos | Jonas Martínez', 'Casos de estudio sobre sistemas empresariales, operaciones y gestión institucional.'];
  if (path === '/muestras') return [demosPage(), 'Muestras visuales | Jonas Martínez', 'Prototipos visuales de interfaces para sistemas empresariales y operativos.'];
  if (path.startsWith('/proyectos/')) {
    const project = projects.find(item => `/proyectos/${item.slug}` === path);
    return [caseStudy(project), project ? `${project.name} | Jonas Martínez` : 'Proyecto no encontrado | Jonas Martínez', project?.lead || 'Caso de estudio de Jonas Martínez.'];
  }
  if (path === '/sobre-mi') return [about(), 'Sobre mí | Jonas Martínez', 'Perfil de Jonas Martínez, analista de sistemas y desarrollador de software.'];
  if (path === '/experiencia') return [experiencePage(), 'Experiencia | Jonas Martínez', 'Experiencia, formación y enfoque profesional de Jonas Martínez.'];
  if (path === '/formacion') return [educationPage(), 'Formación | Jonas Martínez', 'Formación y aprendizaje continuo en análisis de sistemas.'];
  if (path === '/stack') return [stackPage(), 'Stack tecnológico | Jonas Martínez', 'Tecnologías utilizadas, practicadas y exploradas en soluciones de software.'];
  if (path === '/cv') return [cvPage(), 'CV ATS | Jonas Martínez', 'Currículum ATS editable e imprimible de Jonas Martínez.'];
  if (path === '/contacto') return [contact(), 'Contacto | Jonas Martínez', 'Canales profesionales de contacto de Jonas Martínez.'];
  if (path === '/blog') return [blogPage(), 'Blog | Jonas Martínez', 'Notas de trabajo, aprendizaje y proceso.'];
  if (path.startsWith('/blog/')) {
    const post = publicPosts().find(item => `/blog/${item.slug}` === path);
    return [blogArticle(post), post ? `${post.title} | Jonas Martínez` : 'Publicación no encontrada | Jonas Martínez', post?.excerpt || 'Notas de trabajo, aprendizaje y proceso.'];
  }
  return [notFound(), 'Página no encontrada | Jonas Martínez', 'La página solicitada no existe.'];
}

function render() {
  const [content, title, description] = getPage();
  app.innerHTML = nav() + content + footer() + palette();
  applyTheme();
  setMeta(title, description);
  bind();
  const main = app.querySelector('main');
  if (main) main.tabIndex = -1;
  if (paletteOpen) app.querySelector('[data-palette-input]')?.focus();
  else if (focusTarget === 'main') main?.focus();
  else if (focusTarget === 'menu') app.querySelector('[data-menu]')?.focus();
  else if (focusTarget === 'theme') app.querySelector('[data-theme-toggle]')?.focus();
  else if (focusTarget === 'project-filter') [...app.querySelectorAll('[data-project-filter]')].find(button => button.dataset.projectFilter === projectFilter)?.focus();
  else if (focusTarget === 'blog-filter') [...app.querySelectorAll('[data-blog-category]')].find(button => button.dataset.blogCategory === blogCategory)?.focus();
  focusTarget = '';
  if (shouldScrollToTop) {
    window.scrollTo(0, 0);
    shouldScrollToTop = false;
  }
}

function go(path) {
  menuOpen = false;
  paletteOpen = false;
  focusTarget = 'main';
  shouldScrollToTop = true;
  if (isLocalFile) location.hash = path;
  else { history.pushState({}, '', path); render(); }
}

function bind() {
  document.querySelectorAll('[data-route]').forEach(element => element.addEventListener('click', event => {
    event.preventDefault();
    go(element.dataset.route);
  }));
  document.querySelector('[data-menu]')?.addEventListener('click', () => { menuOpen = !menuOpen; focusTarget = 'menu'; render(); });
  document.querySelectorAll('[data-theme-toggle]').forEach(element => element.addEventListener('click', () => {
    theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    focusTarget = 'theme';
    render();
  }));
  document.querySelector('[data-palette-close]')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) { paletteOpen = false; render(); }
  });
  document.querySelector('[data-palette-input]')?.addEventListener('input', event => {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll('.palette button').forEach(button => { button.hidden = !button.textContent.toLowerCase().includes(query); });
  });
  document.querySelector('[data-print-cv]')?.addEventListener('click', () => window.print());
  document.querySelectorAll('[data-cv-field]').forEach(field => {
    const key = `cv-${field.dataset.cvField}`;
    const saved = storageGet(key);
    if (saved) field.textContent = saved;
    field.addEventListener('input', () => storageSet(key, field.textContent.trim()));
  });
}

addEventListener('click', event => {
  const projectButton = event.target.closest('[data-project-filter]');
  if (projectButton) { projectFilter = projectButton.dataset.projectFilter || 'Todos'; focusTarget = 'project-filter'; render(); }
  const blogButton = event.target.closest('[data-blog-category]');
  if (blogButton) { blogCategory = blogButton.dataset.blogCategory || 'Todas'; focusTarget = 'blog-filter'; render(); }
});
addEventListener('popstate', () => { focusTarget = 'main'; shouldScrollToTop = true; render(); });
addEventListener('hashchange', () => { focusTarget = 'main'; shouldScrollToTop = true; render(); });
addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); paletteOpen = true; render(); }
  if (event.key === 'Escape' && paletteOpen) { paletteOpen = false; focusTarget = 'main'; render(); }
  if (event.key === 'Tab' && paletteOpen) {
    const focusable = [...document.querySelectorAll('.palette input, .palette button:not([hidden])')];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
});

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (theme === 'system') render(); });

applyTheme();
enableOfflineExperience();
render();
