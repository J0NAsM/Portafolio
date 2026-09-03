const { profile, services, projects, skills, experience, education } = window.portfolioData;
const blogPosts = Array.isArray(window.portfolioBlogPosts) ? window.portfolioBlogPosts : [];
const app = document.querySelector('#app');
const storageGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
const isLocalFile = location.protocol === 'file:';
// La subruta de publicación se toma del <base> que inyecta scripts/build-static.mjs.
// Sin él —servidor local o file://— el sitio vive en la raíz. Así no hay rutas
// fijas: mudar el sitio de dominio solo exige cambiar siteBase en el build.
const siteBase = isLocalFile ? '' : (document.querySelector('base')?.getAttribute('href') || '/').replace(/\/+$/, '');
// El origen canónico sale del <link rel="canonical"> que ya escribe el build.
const canonicalOrigin = (() => {
  const declared = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
  try { return new URL(declared, location.href).origin; } catch { return location.origin; }
})();

let theme = storageGet('theme') || 'system';
let menuOpen = false;
let paletteOpen = false;
let projectFilter = 'Todos';
let blogCategory = 'Todas';
let focusTarget = '';
let shouldScrollToTop = false;

if (!isLocalFile) {
  try {
    const redirectedPath = sessionStorage.getItem('portfolio-redirect');
    sessionStorage.removeItem('portfolio-redirect');
    if (redirectedPath?.startsWith(`${siteBase}/`) && !redirectedPath.startsWith('//')) history.replaceState({}, '', redirectedPath);
  } catch {}
}
const currentPath = () => {
  if (isLocalFile) return location.hash.slice(1) || '/';
  const pathname = location.pathname.startsWith(siteBase) ? location.pathname.slice(siteBase.length) : location.pathname;
  return pathname.replace(/\/$/, '') || '/';
};
const publicPath = path => path === '/' ? `${siteBase}/` : `${siteBase}${path}`;
const internal = path => `data-route="${path}" href="${isLocalFile ? `#${path}` : publicPath(path)}"`;
const icon = name => ({ arrow: '→', close: '×', sun: '☼', moon: '◐' }[name] || '•');
const themeLabels = { system: 'Sistema', light: 'Claro', dark: 'Oscuro' };
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
  // Solo en https: descarta file://, y evita dejar una caché persistente en el servidor local de desarrollo.
  if (location.protocol === 'https:' && 'serviceWorker' in navigator) navigator.serviceWorker.register(`${siteBase}/service-worker.js`).catch(() => {});
}

function setMeta(title, description) {
  document.title = title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', title);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
  if (!isLocalFile) {
    const canonicalPath = currentPath() === '/' ? `${siteBase}/` : `${siteBase}${currentPath()}`;
    const canonicalUrl = `${canonicalOrigin}${canonicalPath}`;
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonicalUrl);
  }
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
  const links = `${item('Inicio', '/')}${item('Proyectos', '/proyectos')}${item('Experiencia', '/experiencia')}${item('Sobre mí', '/sobre-mi')}${item('CV', '/cv')}${hasContact() ? item('Contacto', '/contacto') : ''}`;
  return `<header class="site-header">
    <a class="brand" ${internal('/')} aria-label="Inicio de ${profile.shortName}"><span class="brand-mark">J</span><span>Jonas<span class="muted">.dev</span></span></a>
    <nav class="desktop-nav" aria-label="Principal">${links}</nav>
    <div class="header-actions">
      <button class="palette-button" type="button" data-palette-trigger aria-label="Abrir navegación rápida"><span aria-hidden="true">⌕</span><span>Buscar</span></button>
      <button class="theme-button" type="button" data-theme-toggle aria-label="Cambiar tema; actual: ${themeLabels[theme]}">${theme === 'dark' ? icon('moon') : theme === 'light' ? icon('sun') : '◌'}<span>${themeLabels[theme]}</span></button>
      <button class="menu-button" type="button" data-menu aria-expanded="${menuOpen}" aria-controls="mobile-menu">${menuOpen ? icon('close') : '☰'}<span class="sr-only">Menú</span></button>
    </div>
    <nav id="mobile-menu" class="mobile-nav ${menuOpen ? 'open' : ''}" aria-label="Navegación móvil" aria-hidden="${!menuOpen}">${links}</nav>
  </header>`;
}

function footer() {
  return `<footer><div><a class="brand footer-brand" ${internal('/')} aria-label="Inicio de ${profile.shortName}"><span class="brand-mark">J</span><span>Jonas<span class="muted">.dev</span></span></a><p>Software para procesos reales, construido con criterio técnico y responsabilidad.</p></div><nav aria-label="Enlaces del pie"><a ${internal('/proyectos')}>Proyectos</a><a ${internal('/experiencia')}>Experiencia</a><a ${internal('/contacto')}>Contacto</a><a href="${isLocalFile ? 'public/privacy.html' : `${siteBase}/privacidad/`}">Privacidad</a></nav><div class="footer-meta"><span>© ${new Date().getFullYear()} ${profile.name}</span><div class="footer-social">${socialLinks()}</div></div></footer>`;
}

const sectionTitle = (eyebrow, title, text = '', heading = 'h2') => `<div class="section-title"><p class="eyebrow">${eyebrow}</p><${heading}>${title}</${heading}>${text ? `<p>${text}</p>` : ''}</div>`;
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
    mbapo: `<div class="mock-shell mock-market"><div class="mock-top"><span class="mock-logo">mbapo</span><span class="mock-search">¿Qué servicio necesitás?</span><i></i></div><div class="mock-screen"><p class="mock-label">Profesionales disponibles cerca de ti</p><div class="mock-profiles"><article><span>MS</span><div><b>María S.</b><small>Electricista · Disponible hoy</small></div><strong>4.9</strong></article><article><span>JR</span><div><b>Jorge R.</b><small>Reparaciones · Mañana</small></div><strong>4.8</strong></article><article><span>AL</span><div><b>Ana L.</b><small>Diseño · Esta semana</small></div><strong>5.0</strong></article></div><span class="mock-action">Ver profesionales</span></div></div>`,
    bomberos: `<div class="mock-shell mock-civic"><div class="mock-top"><span class="mock-logo">GESTIÓN</span><span>Bomberos · Carapeguá</span><i></i></div><div class="mock-screen"><p class="mock-label">Estado operativo</p><div class="mock-status-grid"><article><strong>08</strong><span>Móviles</span><small>6 disponibles</small></article><article><strong>12</strong><span>Inspecciones</span><small>Esta semana</small></article><article><strong>04</strong><span>Alertas</span><small>Revisar</small></article></div><div class="mock-timeline"><span></span><p><b>Inspección completada</b><small>Móvil 03 · Hace 24 min</small></p><span></span><p><b>Mantenimiento programado</b><small>Equipo de rescate · Mañana</small></p></div></div></div>`,
    'inspecciones-moviles': `<div class="mock-shell mock-mobile"><div class="mobile-head"><span>‹</span><b>Inspección 032</b><i>•••</i></div><div class="mobile-body"><p class="mock-label">Móvil 03 · Lista de verificación</p><div class="check-row"><span>✓</span><b>Luces de emergencia</b><em>OK</em></div><div class="check-row"><span>✓</span><b>Equipamiento de seguridad</b><em>OK</em></div><div class="check-row warn"><span>!</span><b>Nivel de combustible</b><em>Revisar</em></div><span class="mock-action">Guardar inspección</span></div></div>`
  };
  if (!mockups[project.slug]) return '';
  return `<figure class="product-mock ${project.tone}"><div aria-hidden="true">${mockups[project.slug]}</div><figcaption><span>Vista simulada</span>Interfaz conceptual para mostrar la dirección visual; no corresponde a una pantalla de producción.</figcaption></figure>`;
}

function projectLinks(project) {
  return [
    project.demo && `<a class="button" href="${project.demo}" target="_blank" rel="noreferrer">Ver sitio publicado <span>↗</span></a>`,
    project.repository && `<a class="button secondary" href="${project.repository}" target="_blank" rel="noreferrer">Ver repositorio <span>↗</span></a>`
  ].filter(Boolean).join('');
}

function visualFigure(name, source, alt, caption, className = '') {
  return `<figure class="visual-figure ${className}"><img src="public/images/general/${source}" alt="${alt}" loading="lazy" decoding="async"><figcaption><span class="visual-label">${name}</span> · ${caption}</figcaption></figure>`;
}

function home() {
  const featured = projects[0];
  const relevantExperience = [experience[0], experience[1], experience.at(-1)];
  const domains = [
    ['01', 'Sistemas empresariales', 'Reglas de negocio, permisos, estados y flujos de autorización.'],
    ['02', 'Operaciones y datos', 'Información estructurada para tareas que necesitan precisión y trazabilidad.'],
    ['03', 'IA aplicada', 'Apoyo para análisis, documentación y desarrollo, siempre con revisión técnica.']
  ];
  return `<main id="main">
    <section class="hero recruiter-hero">
      <div class="hero-copy"><p class="eyebrow">${profile.role}</p><h1>Software claro.<br><em>Operaciones confiables.</em></h1><p class="role-focus">${profile.focus}</p><p class="lede">${profile.summary}</p><div class="actions">${cta('Explorar proyectos', '/proyectos')}${cta('Contactar', '/contacto', 'secondary')}</div></div>
      <aside class="hero-proof" aria-label="Resumen profesional"><p class="eyebrow">Perfil en una mirada</p><dl><div><dt>Actualidad</dt><dd>Desarrollador Junior en Softshop</dd></div><div><dt>Enfoque</dt><dd>Sistemas empresariales y flujos operativos</dd></div><div><dt>Disponibilidad</dt><dd>${profile.availability}</dd></div></dl><a class="text-link" ${internal('/experiencia')}>Ver experiencia completa →</a></aside>
    </section>
    <section class="evidence-strip">${domains.map(([id, title, text]) => `<article><span>${id}</span><h2>${title}</h2><p>${text}</p></article>`).join('')}</section>
    <section class="section featured-section">${sectionTitle('Trabajo seleccionado', 'Casos con contexto, decisiones y límites claros.', 'Cada proyecto distingue su estado y presenta únicamente información que puede compartirse públicamente.')}<article class="featured"><div class="featured-copy"><p class="eyebrow">${featured.category} · ${status(featured.status)}</p><h3>${featured.name}</h3><p>${featured.lead}</p><ul>${featured.modules.slice(0, 4).map(module => `<li>${module}</li>`).join('')}</ul>${cta('Abrir caso', `/proyectos/${featured.slug}`)}</div>${projectVisual(featured)}</article><div class="secondary-projects">${projects.slice(1).map(project => `<article><p class="eyebrow">${project.category}</p><h3>${project.name} ${status(project.status)}</h3><p>${project.lead}</p><a ${internal(`/proyectos/${project.slug}`)}>Abrir caso →</a></article>`).join('')}</div></section>
    <section class="section recruiter-experience">${sectionTitle('Experiencia relevante', 'Criterio técnico con contexto operativo.', 'Desarrollo de software, implementación y servicio voluntario en entornos que requieren responsabilidad.')}<div class="experience-preview">${relevantExperience.map(([time, title, text]) => `<article><span>${time}</span><div><h3>${title}</h3><p>${text}</p></div></article>`).join('')}</div>${cta('Ver experiencia', '/experiencia', 'text-button')}</section>
    <section class="section capabilities">${sectionTitle('Capacidades', 'Herramientas al servicio del problema.', 'Un stack práctico para construir interfaces, lógica de negocio, integraciones y soluciones basadas en datos.')}<div class="skill-grid">${skills.map(([area, tech, text], index) => `<article><span>0${index + 1}</span><h2>${area}</h2><strong>${tech}</strong><p>${text}</p></article>`).join('')}</div></section>
    <section class="section process compact-process">${sectionTitle('Forma de trabajo', 'Del problema a una solución operable.')}<div class="process-flow">${['Contexto', 'Reglas', 'Datos', 'Arquitectura', 'Interfaz', 'Pruebas'].map((step, index) => `<div><span>${String(index + 1).padStart(2, '0')}</span>${step}</div>`).join('')}</div></section>
    <section class="contact-band"><p class="eyebrow">Disponible para colaborar</p><h2>¿Tienes un proceso que necesita una solución más clara?</h2><p>${profile.availability} · ${profile.location}</p><div class="actions">${cta('Iniciar conversación', '/contacto')}${cta('Ver CV', '/cv', 'secondary')}</div></section>
  </main>`;
}

function projectsPage() {
  const filters = ['Todos', ...new Set(projects.map(project => project.category.split(' · ')[0]))];
  const visibleProjects = projectFilter === 'Todos' ? projects : projects.filter(project => project.category.startsWith(projectFilter));
  return `<main id="main" class="page"><div class="page-intro">${sectionTitle('Proyectos', 'Sistemas pensados para el mundo real.', 'Una selección de problemas, restricciones y soluciones. Los proyectos sensibles se presentan sin información confidencial.', 'h1')}</div><div class="project-filters" aria-label="Filtrar proyectos">${filters.map(filter => `<button type="button" class="${filter === projectFilter ? 'active' : ''}" data-project-filter="${filter}" aria-pressed="${filter === projectFilter}">${filter}</button>`).join('')}</div><p class="project-count" aria-live="polite">${visibleProjects.length} caso${visibleProjects.length === 1 ? '' : 's'} de estudio.</p><div class="project-list">${visibleProjects.map(project => `<article class="project-row"><div><p class="eyebrow">${project.id} · ${project.category}</p><h2>${project.name} ${status(project.status)}</h2><p>${project.lead}</p><div class="badges">${project.stack.map(item => `<span>${item}</span>`).join('')}</div>${cta('Abrir caso', `/proyectos/${project.slug}`, 'text-button')}</div>${projectVisual(project, true)}</article>`).join('')}</div></main>`;
}

function caseStudy(project) {
  if (!project) return notFound();
  const details = [
    ['Estado', project.status],
    ['Visibilidad', project.visibility],
    ['Tipo', project.type],
    ['Periodo', project.period],
    ['Responsabilidad', project.role]
  ].filter(([, value]) => value);
  const verification = project.validation?.length ? `<section id="validacion"><p class="eyebrow">Validación</p><h2>Calidad comprobable.</h2><ul class="decision-list">${project.validation.map(item => `<li>${item}</li>`).join('')}</ul></section>` : '';
  const outcome = project.outcome ? `<section id="resultado"><p class="eyebrow">Resultado verificable</p><h2>Una entrega pública y reproducible.</h2><p>${project.outcome}</p><div class="actions">${projectLinks(project)}</div></section>` : '';
  const conceptualDemo = productMock(project);
  return `<main id="main" class="case-study"><a class="back-link" ${internal('/proyectos')}>← Todos los proyectos</a><header class="case-hero"><div><p class="eyebrow">${project.id} · ${project.category}</p><h1>${project.name}</h1><p class="case-lead">${project.lead}</p><div class="badges">${project.stack.map(item => `<span>${item}</span>`).join('')}</div>${details.length ? `<dl class="case-meta">${details.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>` : ''}${project.repository || project.demo ? `<div class="actions">${projectLinks(project)}</div>` : ''}</div>${projectVisual(project)}</header><section class="case-grid"><aside aria-label="Secciones del caso"><p>En este caso</p><a href="#contexto">Contexto</a><a href="#solucion">Solución</a><a href="#modulos">Alcance</a><a href="#decisiones">Decisiones</a>${project.validation ? '<a href="#validacion">Validación</a>' : ''}${project.outcome ? '<a href="#resultado">Resultado</a>' : ''}</aside><div class="case-content"><section id="contexto"><p class="eyebrow">Contexto y problema</p><h2>Diseñar para una situación concreta.</h2><p>${project.problem}</p></section><section id="solucion"><p class="eyebrow">Enfoque de solución</p><h2>Una estructura que acompaña el flujo.</h2><p>${project.solution}</p></section><section id="modulos"><p class="eyebrow">Alcance descrito</p><h2>Componentes del sistema.</h2><div class="module-grid">${project.modules.map((module, index) => `<div><span>${String(index + 1).padStart(2, '0')}</span>${module}</div>`).join('')}</div></section><section id="decisiones"><p class="eyebrow">Decisiones de diseño</p><h2>Lo que sostiene la solución.</h2><ul class="decision-list">${project.decisions.map(decision => `<li>${decision}</li>`).join('')}</ul><p class="privacy-note">El alcance se describe sin código propietario, credenciales ni datos operativos. Los elementos conceptuales están identificados como tales.</p></section>${verification}${outcome}</div></section>${conceptualDemo ? `<section class="case-demo"><div>${sectionTitle('Exploración visual', 'Una interfaz conceptual para el flujo.', 'La composición permite evaluar jerarquía y operación; no es una captura de producción.')}</div>${conceptualDemo}</section>` : ''}</main>`;
}

function demosPage() {
  const demoProjects = projects.filter(project => project.slug !== 'portfolio');
  return `<main id="main" class="page demos-page"><div class="page-intro narrow">${sectionTitle('Exploraciones visuales', 'Prototipos para evaluar una dirección de interfaz.', 'Estas composiciones prueban jerarquía, contraste y claridad operativa. Están separadas de la evidencia de implementación.', 'h1')}</div><div class="demo-principles"><article><span>01</span><h2>Contraste</h2><p>Información importante sobre fondos oscuros y acentos visibles.</p></article><article><span>02</span><h2>Jerarquía</h2><p>Estados, acciones y datos separados con intención.</p></article><article><span>03</span><h2>Operación</h2><p>Interfaces pensadas para lectura rápida y decisiones concretas.</p></article></div><div class="demo-gallery">${demoProjects.map(project => `<article><header><p class="eyebrow">${project.id} · Prototipo conceptual</p><h2>${project.name}</h2><p>${project.lead}</p></header>${productMock(project)}<a ${internal(`/proyectos/${project.slug}`)}>Abrir caso de estudio →</a></article>`).join('')}</div></main>`;
}

function about() {
  return `<main id="main" class="page"><div class="page-intro narrow">${sectionTitle('Sobre mí', 'Software que responde a una necesidad real.', '', 'h1')}<div class="about-layout"><div><p class="body-large">Soy ${profile.name}, desarrollador de software junior de ${profile.location}.</p><p>Me interesan los sistemas empresariales porque conectan tecnología con decisiones, datos y personas que necesitan completar tareas reales.</p><p>Utilizo asistentes de IA para apoyar análisis, documentación e implementación. Cada resultado pasa por revisión técnica, pruebas y control de versiones.</p></div><dl class="profile-facts"><div><dt>Ubicación</dt><dd>${profile.location}</dd></div><div><dt>Idiomas</dt><dd>${profile.languages}</dd></div><div><dt>Disponibilidad</dt><dd>${profile.availability}</dd></div><div><dt>Servicio</dt><dd>Bombero Voluntario Combatiente · Cabo</dd></div></dl></div>${visualFigure('Método de trabajo', 'work-method.svg', 'Método de trabajo: contexto, reglas, datos, interfaz y mejora.', 'Diagrama conceptual de la forma de trabajo.', 'about-visual')}</div><section class="principles"><p class="eyebrow">Principios de trabajo</p>${['Entender antes de construir', 'Hacer visible la regla de negocio', 'Diseñar para la persona que opera', 'Verificar antes de entregar'].map((item, index) => `<div><span>0${index + 1}</span><h2>${item}</h2></div>`).join('')}</section></main>`;
}

function experiencePage() {
  const professionalExperience = experience.slice(0, 2);
  const volunteerService = experience.at(-1);
  return `<main id="main" class="page"><div class="page-intro">${sectionTitle('Experiencia', 'Desarrollo con contexto operativo.', 'Experiencia profesional y de servicio presentada con un alcance público responsable.', 'h1')}</div><section aria-labelledby="professional-title"><p class="eyebrow">Experiencia profesional</p><h2 id="professional-title" class="section-heading">Software empresarial</h2><div class="timeline">${professionalExperience.map(([time, title, text]) => `<article><span>${time}</span><div><h2>${title}</h2><p>${text}</p></div></article>`).join('')}</div></section><section class="service-highlight"><p class="eyebrow">Servicio y liderazgo</p><h2>${volunteerService[1]}</h2><p>${volunteerService[2]}</p></section><section class="education"><p class="eyebrow">Formación</p><h2>Análisis de Sistemas Informáticos</h2><p>Estudios orientados a modelar necesidades, información y procesos como soluciones tecnológicas.</p><a class="text-link" ${internal('/formacion')}>Ver formación →</a></section></main>`;
}

function educationPage() {
  return `<main id="main" class="page"><div class="page-intro narrow">${sectionTitle('Formación', 'Una base técnica construida desde distintos campos.', 'Formación técnica y estudios superiores relevantes para el trabajo con software, procesos y personas.', 'h1')}<div class="timeline education-timeline">${education.map(([level, title, detail, location]) => `<article><span>${level}</span><div><h2>${title}</h2><p>${detail}</p>${location ? `<small>${location}</small>` : ''}</div></article>`).join('')}</div><section class="principles"><p class="eyebrow">Aprendizaje continuo</p>${['Arquitectura y diseño de sistemas', 'Bases de datos y reglas de negocio', 'IA aplicada al desarrollo', 'Documentación y gestión de conocimiento'].map((item, index) => `<div><span>0${index + 1}</span><h2>${item}</h2></div>`).join('')}</section></div></main>`;
}

function stackPage() {
  return `<main id="main" class="page"><div class="page-intro">${sectionTitle('Stack tecnológico', 'Herramientas al servicio del problema.', 'No son porcentajes. Son tecnologías utilizadas, practicadas o exploradas según las necesidades de cada solución.', 'h1')}</div>${visualFigure('Tecnología con contexto', 'portfolio-lens.svg', 'Mapa conceptual: contexto, reglas, datos y uso orientan la elección tecnológica.', 'La tecnología acompaña al proceso, no lo reemplaza.', 'stack-visual')}<div class="skill-grid">${skills.map(([area, tech, text], index) => `<article><span>0${index + 1}</span><h2>${area}</h2><strong>${tech}</strong><p>${text}</p></article>`).join('')}</div></main>`;
}

function cvPage() {
  return `<main id="main" class="page cv-page"><div class="cv-toolbar no-print">${sectionTitle('Currículum', 'Perfil profesional listo para imprimir.', 'Versión de una columna, legible y compatible con sistemas de selección ATS.')}<div class="cv-actions"><button class="button" type="button" data-print-cv>Imprimir o guardar PDF <span>→</span></button>${profile.cv ? `<a class="button secondary" href="${profile.cv}" download>Descargar CV <span>→</span></a>` : ''}<a class="button secondary" ${internal('/contacto')}>Solicitar más información <span>→</span></a></div></div><article class="cv-document" aria-label="Currículum profesional imprimible"><header><h1>${profile.name}</h1><p><strong>${profile.role}</strong></p><p>${profile.location} | ${profile.phone} | ${profile.email}</p><p>GitHub: ${profile.github.replace('https://', '')} | ${profile.availability}</p></header><section><h2>PERFIL PROFESIONAL</h2><p>Desarrollador de software junior enfocado en sistemas empresariales, datos e interfaces operativas. Experiencia práctica con reglas de negocio, flujos transaccionales, frontend y apoyo de IA bajo revisión técnica.</p></section><section><h2>COMPETENCIAS CLAVE</h2><p><strong>Desarrollo:</strong> Java, Python, JavaScript, PHP, HTML, CSS y APIs.</p><p><strong>Datos:</strong> SQL, PostgreSQL, MySQL y SQLite.</p><p><strong>Prácticas:</strong> Git, GitHub, documentación técnica, pruebas, accesibilidad e IA aplicada al desarrollo.</p></section><section><h2>EXPERIENCIA</h2><div class="cv-entry"><p><strong>Softshop</strong> | Carapeguá, Paraguay</p><p><strong>Desarrollador Junior</strong> | 2025 – Actualidad</p><p>• Desarrollo de sistemas con foco en frontend, experiencia de usuario y procesos de negocio.</p><p>• Participación en la implementación de facturación electrónica SIFEN.</p></div><div class="cv-entry"><p><strong>Cuerpo de Bomberos Voluntarios de Carapeguá</strong></p><p><strong>Bombero Voluntario Combatiente · Cabo</strong></p><p>• Servicio voluntario, coordinación operativa, disciplina y trabajo en equipo.</p></div></section><section><h2>PROYECTO PÚBLICO</h2><p><strong>Portfolio profesional</strong> | HTML, CSS, JavaScript, Node.js y GitHub Actions</p><p>• SPA estática con accesibilidad, experiencia offline, pruebas automatizadas y despliegue continuo en GitHub Pages.</p></section><section><h2>EDUCACIÓN</h2><p><strong>Estudios en Análisis de Sistemas Informáticos</strong></p><p><strong>Bachillerato Técnico en Informática</strong> | Colegio Privado Subvencionado San Alfonso | Carapeguá, Paraguay</p></section><section><h2>IDIOMAS</h2><p>Español y guaraní: nativos | Portugués e inglés: comprensión básica</p></section></article></main>`;
}

function contact() {
  return `<main id="main" class="page contact-page"><div class="page-intro narrow">${sectionTitle('Contacto', 'Hablemos de un problema que valga la pena ordenar.', `Disponibilidad: ${profile.availability}.`, 'h1')}<div class="contact-options"><article class="contact-card"><span class="contact-symbol">↗</span><p class="eyebrow">WhatsApp</p><h2>${profile.phone}</h2><p>Abre una conversación con un mensaje profesional preparado.</p><div class="contact-actions"><a class="button" href="${profile.whatsapp}" target="_blank" rel="noreferrer">Enviar mensaje <span>→</span></a><button class="button secondary" type="button" data-copy-contact="${profile.phone}" data-copy-label="número de WhatsApp">Copiar número</button></div></article><article class="contact-card"><span class="contact-symbol">@</span><p class="eyebrow">Email</p><h2>${profile.email}</h2><p>Abre tu aplicación de correo con asunto y mensaje formal preparados.</p><div class="contact-actions"><a class="button" href="${profile.emailDraft}">Redactar email <span>→</span></a><button class="button secondary" type="button" data-copy-contact="${profile.email}" data-copy-label="email">Copiar email</button></div></article></div><p class="copy-status" data-copy-status role="status" aria-live="polite"></p></div></main>`;
}

function privacyPage() {
  return `<main id="main" class="page privacy-page"><div class="page-intro narrow">${sectionTitle('Información del sitio', 'Privacidad sencilla y transparente.', 'La versión publicada en GitHub Pages es un sitio estático. No utiliza analítica, cookies publicitarias, fingerprinting ni formularios que almacenen datos.', 'h1')}</div><div class="privacy-content"><section><h2>Contacto</h2><p>Los botones de contacto abren WhatsApp o la aplicación de correo del visitante con un mensaje preparado. A partir de ese momento, el tratamiento de la información depende de esos servicios y de los datos que cada persona decida enviar.</p></section><section><h2>Funcionamiento técnico</h2><p>El sitio puede guardar localmente en el navegador la preferencia de tema y recursos necesarios para funcionar sin conexión. La versión de GitHub Pages no registra rutas 404 ni ejecuta el panel administrativo opcional incluido para desarrollo local.</p></section></div></main>`;
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
  return `<main id="main" class="page blog-page"><div class="page-intro narrow">${sectionTitle('Blog', 'Notas de trabajo, aprendizaje y proceso.', 'Un espacio para compartir avances, decisiones y reflexiones.', 'h1')}</div>${visualFigure('Cómo leer el blog', 'blog-organizer.svg', 'Diagrama de organización del blog: publicación, categoría y fecha.', 'Las notas se pueden recorrer por tema y por fecha.', 'blog-visual')}<div class="blog-filters" aria-label="Filtrar publicaciones por categoría">${categories.map(category => `<button class="${category === blogCategory ? 'active' : ''}" type="button" data-blog-category="${escapeHtml(category)}" aria-pressed="${category === blogCategory}">${escapeHtml(category)}</button>`).join('')}</div><p class="blog-count" aria-live="polite">${visiblePosts.length} publicación${visiblePosts.length === 1 ? '' : 'es'} visible${visiblePosts.length === 1 ? '' : 's'}.</p><section class="blog-list">${entries}</section></main>`;
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
  if (path === '/cv') return [cvPage(), 'Currículum | Jonas Martínez', 'Currículum profesional imprimible de Jonas Martínez.'];
  if (path === '/contacto') return [contact(), 'Contacto | Jonas Martínez', 'Canales profesionales de contacto de Jonas Martínez.'];
  if (path === '/privacidad') return [privacyPage(), 'Privacidad | Jonas Martínez', 'Información sobre privacidad y funcionamiento técnico del portfolio.'];
  // El blog solo existe como sección pública cuando hay algo publicado: anunciar
  // una sección vacía resta más de lo que aporta. La vista reaparece sola en
  // cuanto se publique la primera nota, igual que ocurre en el build y el sitemap.
  if (path === '/blog' && publicPosts().length > 0) return [blogPage(), 'Blog | Jonas Martínez', 'Notas de trabajo, aprendizaje y proceso.'];
  if (path.startsWith('/blog/')) {
    const post = publicPosts().find(item => `/blog/${item.slug}` === path);
    return [blogArticle(post), post ? `${post.title} | Jonas Martínez` : 'Publicación no encontrada | Jonas Martínez', post?.excerpt || 'Notas de trabajo, aprendizaje y proceso.'];
  }
  return [notFound(), 'Página no encontrada | Jonas Martínez', 'La página solicitada no existe.'];
}

function render() {
  const [content, title, description] = getPage();
  app.innerHTML = nav() + content + footer() + palette();
  document.body.classList.toggle('dialog-open', paletteOpen);
  if (paletteOpen) app.querySelectorAll('.site-header, main, footer').forEach(element => element.setAttribute('inert', ''));
  applyTheme();
  setMeta(title, description);
  bind();
  const main = app.querySelector('main');
  if (main) main.tabIndex = -1;
  if (paletteOpen) app.querySelector('[data-palette-input]')?.focus();
  else if (focusTarget === 'main') main?.focus();
  else if (focusTarget === 'menu') app.querySelector('[data-menu]')?.focus();
  else if (focusTarget === 'theme') app.querySelector('[data-theme-toggle]')?.focus();
  else if (focusTarget === 'palette-trigger') app.querySelector('[data-palette-trigger]')?.focus();
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
  else { history.pushState({}, '', publicPath(path)); render(); }
}

function bind() {
  document.querySelectorAll('[data-route]').forEach(element => element.addEventListener('click', event => {
    event.preventDefault();
    go(element.dataset.route);
  }));
  document.querySelector('[data-menu]')?.addEventListener('click', () => { menuOpen = !menuOpen; focusTarget = 'menu'; render(); });
  document.querySelector('[data-palette-trigger]')?.addEventListener('click', () => { paletteOpen = true; render(); });
  document.querySelectorAll('[data-theme-toggle]').forEach(element => element.addEventListener('click', () => {
    theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    focusTarget = 'theme';
    render();
  }));
  document.querySelector('[data-palette-close]')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) { paletteOpen = false; focusTarget = 'palette-trigger'; render(); }
  });
  document.querySelector('[data-palette-input]')?.addEventListener('input', event => {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll('.palette button').forEach(button => { button.hidden = !button.textContent.toLowerCase().includes(query); });
  });
  document.querySelector('[data-print-cv]')?.addEventListener('click', () => window.print());
  document.querySelectorAll('[data-copy-contact]').forEach(button => button.addEventListener('click', async () => {
    const value = button.dataset.copyContact || '';
    const status = document.querySelector('[data-copy-status]');
    try {
      await navigator.clipboard.writeText(value);
      if (status) status.textContent = `Se copió el ${button.dataset.copyLabel} al portapapeles.`;
    } catch {
      const field = document.createElement('textarea');
      field.value = value;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.append(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      if (status) status.textContent = copied ? `Se copió el ${button.dataset.copyLabel} al portapapeles.` : `No se pudo copiar. Selecciona manualmente: ${value}`;
    }
  }));
}

addEventListener('click', event => {
  const projectButton = event.target.closest('[data-project-filter]');
  if (projectButton) { projectFilter = projectButton.dataset.projectFilter || 'Todos'; focusTarget = 'project-filter'; render(); }
  const blogButton = event.target.closest('[data-blog-category]');
  if (blogButton) { blogCategory = blogButton.dataset.blogCategory || 'Todas'; focusTarget = 'blog-filter'; render(); }
});
addEventListener('popstate', () => { focusTarget = 'main'; shouldScrollToTop = true; render(); });
addEventListener('hashchange', () => {
  if (!isLocalFile) return;
  focusTarget = 'main';
  shouldScrollToTop = true;
  render();
});
addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); paletteOpen = true; render(); }
  if (event.key === 'Escape' && paletteOpen) { paletteOpen = false; focusTarget = 'palette-trigger'; render(); }
  else if (event.key === 'Escape' && menuOpen) { menuOpen = false; focusTarget = 'menu'; render(); }
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
