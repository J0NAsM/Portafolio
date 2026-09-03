import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import basicAuth from 'express-basic-auth';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { normalizeBlogPost, readBlogPosts, writeBlogPosts } from './lib/blog-store.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const localSpaIndex = (await fs.readFile(path.join(root, 'index.html'), 'utf8')).replace('<head>', '<head>\n    <base href="/" />');
const storageRoot = process.env.STORAGE_ROOT ? path.resolve(process.env.STORAGE_ROOT) : root;
const app = express();
const port = Number(process.env.PORT || 3000);
const adminUser = process.env.ADMIN_USER || '';
const adminPassword = process.env.ADMIN_PASSWORD || '';
const logSalt = process.env.ERROR_LOG_SALT || '';
const retentionDays = Number(process.env.ERROR_LOG_RETENTION_DAYS || 30);
const configuredMaxLogRecords = Number(process.env.ERROR_LOG_MAX_RECORDS || 5000);
const maxLogRecords = Number.isFinite(configuredMaxLogRecords) ? Math.min(Math.max(configuredMaxLogRecords, 100), 50000) : 5000;
const logFile = path.join(storageRoot, 'data', '404-errors.json');
const rateCache = new Map();
let logWriteChain = Promise.resolve();
let blogWriteChain = Promise.resolve();
let lastRateCachePrune = 0;

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data:",
  "object-src 'none'",
  "script-src 'self'",
  // Las tipografías son locales desde src/fonts.css: ya no hay orígenes de terceros.
  "style-src 'self' 'unsafe-inline'"
].join('; ');

app.set('trust proxy', process.env.TRUST_PROXY === '1');
app.disable('x-powered-by');
app.use((request, response, next) => {
  response.set({
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': contentSecurityPolicy,
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  });
  if (request.secure) response.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  if (request.path.startsWith('/admin/')) response.set('Cache-Control', 'no-store, private');
  next();
});
app.use(express.json({ limit: '10kb', type: 'application/json' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use('/src', express.static(path.join(root, 'src'), { fallthrough: false, maxAge: '1h' }));
app.use('/public', express.static(path.join(root, 'public'), { fallthrough: false, maxAge: '1d' }));

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
const safeText = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const neutralizeSpreadsheetFormula = value => {
  const text = String(value || '');
  return /^[\t\r\n ]*[=+\-@]/.test(text) ? `\t${text}` : text;
};
const csvCell = value => `"${neutralizeSpreadsheetFormula(value).replaceAll('"', '""')}"`;
const configured = () => Boolean(adminUser && adminPassword && logSalt);
const nowDate = () => new Date().toISOString().slice(0, 10);

function getIp(request) { return request.ip || request.socket.remoteAddress || 'unknown'; }
function hashIp(ip) { return crypto.createHash('sha256').update(`${logSalt}:${ip}`).digest('hex'); }
function maskIp(ip) { const parts = ip.split('.'); return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.xxx` : `${ip.split(':').slice(0, 3).join(':')}:…`; }
function allowedToLog(ip) {
  const now = Date.now();
  if (now - lastRateCachePrune > 300000) {
    for (const [cachedIp, value] of rateCache) if (now - value.start > 3600000) rateCache.delete(cachedIp);
    lastRateCachePrune = now;
  }
  const value = rateCache.get(ip) || { start: now, count: 0 };
  if (now - value.start > 3600000) { value.start = now; value.count = 0; }
  value.count += 1;
  rateCache.set(ip, value);
  return value.count <= 12;
}
function validDate(value) { const text = safeText(value, 10); return /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(new Date(`${text}T00:00:00`).getTime()) ? text : ''; }
async function readLogs() { try { const parsed = JSON.parse(await fs.readFile(logFile, 'utf8')); return Array.isArray(parsed) ? parsed : []; } catch (error) { if (error.code === 'ENOENT') return []; throw error; } }
async function writeLogs(records) { await fs.mkdir(path.dirname(logFile), { recursive: true }); const temporary = `${logFile}.${process.pid}.tmp`; await fs.writeFile(temporary, JSON.stringify(records, null, 2)); await fs.rename(temporary, logFile); }
function serializeLogWrite(task) { const execution = logWriteChain.then(task, task); logWriteChain = execution.catch(() => {}); return execution; }
async function pruneLogs() { return serializeLogWrite(async () => { const records = await readLogs(); const boundary = Date.now() - retentionDays * 86400000; const retained = Number.isFinite(retentionDays) && retentionDays > 0 ? records.filter(record => new Date(record.createdAt).getTime() >= boundary) : records; const kept = retained.slice(-maxLogRecords); if (kept.length !== records.length) await writeLogs(kept); }); }
function pageNumber(value) { const page = Number.parseInt(safeText(value, 8), 10); return Number.isSafeInteger(page) && page > 0 ? page : 1; }
function filters(query) { return { route: safeText(query.route, 180), referrer: safeText(query.referrer, 250), from: validDate(query.from), to: validDate(query.to), page: pageNumber(query.page) }; }
function filtered(records, filter) { return records.filter(record => { const time = new Date(record.createdAt).getTime(); return (!filter.route || record.route.includes(filter.route)) && (!filter.referrer || record.referrer.includes(filter.referrer)) && (!filter.from || time >= new Date(`${filter.from}T00:00:00`).getTime()) && (!filter.to || time <= new Date(`${filter.to}T23:59:59.999`).getTime()); }).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); }
function rows(records) { return records.map(record => ({ Fecha: record.createdAt, Ruta: record.route, Referrer: record.referrer || '', 'IP (enmascarada)': record.ipMasked, Idioma: record.language || '', 'Zona horaria': record.timezone || '', Pantalla: record.screen || '', 'User-Agent': record.userAgent || '' })); }
function asTxt(data) { const headers = ['Fecha', 'Ruta', 'Referrer', 'IP (enmascarada)', 'Idioma', 'Zona horaria']; const cells = data.map(row => headers.map(header => String(row[header] || '').replace(/[\r\n]/g, ' '))); const widths = headers.map((header, index) => Math.min(34, Math.max(header.length, ...cells.map(row => row[index].length)))); const line = `+${widths.map(width => '-'.repeat(width + 2)).join('+')}+`; const draw = row => `|${row.map((cell,index) => ` ${cell.slice(0,widths[index]).padEnd(widths[index])} `).join('|')}|`; return [line, draw(headers), line, ...cells.map(draw), line].join('\n'); }
function admin(request, response, next) { if (!configured()) return response.status(503).send('Panel no configurado. Define ADMIN_USER, ADMIN_PASSWORD y ERROR_LOG_SALT en .env.'); return basicAuth({ users: { [adminUser]: adminPassword }, challenge: true, realm: 'Panel de errores' })(request, response, next); }
function sameOrigin(request, response, next) {
  const origin = request.get('origin');
  const referer = request.get('referer');
  const expected = `${request.protocol}://${request.get('host')}`;
  const candidate = origin || referer;
  if (!candidate) return response.status(403).send('No se pudo verificar el origen.');
  try {
    if (new URL(candidate).origin !== expected) return response.status(403).send('Origen no permitido.');
  } catch { return response.status(403).send('Origen no permitido.'); }
  next();
}
function serializeBlogWrite(task) { const execution = blogWriteChain.then(task, task); blogWriteChain = execution.catch(() => {}); return execution; }
function blogPanel(posts, draft, notice = '') { const field = (name, value = '') => escapeHtml(value); const postList = posts.map(post => `<article><div><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(post.category)} · ${escapeHtml(post.publishedAt)} · ${post.published ? 'Publicado' : 'Borrador'}</small></div><div><a class="button alt" href="/admin/blog?edit=${encodeURIComponent(post.id)}">Editar</a><form method="post" action="/admin/blog/${encodeURIComponent(post.id)}/delete" onsubmit="return confirm('¿Eliminar esta publicación?')"><button class="button danger">Eliminar</button></form></div></article>`).join('') || '<p>Aún no hay artículos. Crea el primero con el formulario.</p>'; return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Administrar blog</title><style>body{font:15px Arial,sans-serif;max-width:1100px;margin:32px auto;padding:0 18px;color:#17211c;background:#f6f7f4}a{color:inherit}h1{margin-bottom:4px}.meta{color:#536057}.nav{display:flex;gap:12px;margin:18px 0}.panel{background:#fff;padding:20px;border:1px solid #d5d9d2;margin:18px 0}.form{display:grid;grid-template-columns:1fr 1fr;gap:14px}.form label{display:grid;gap:5px;font-size:12px;font-weight:bold}.form label.full{grid-column:1/-1}.form input,.form textarea,.form select{font:16px Arial,sans-serif;padding:9px;border:1px solid #aab3aa;border-radius:3px}.form textarea{min-height:190px;resize:vertical}.button{display:inline-block;border:1px solid #1e3128;background:#1e3128;color:white;padding:9px 12px;text-decoration:none;border-radius:3px;cursor:pointer;font:14px Arial,sans-serif}.button.alt{background:#fff;color:#1e3128}.button.danger{background:#8c2626;border-color:#8c2626}.actions{display:flex;align-items:center;gap:12px}.post-list article{display:flex;justify-content:space-between;gap:15px;padding:14px 0;border-top:1px solid #d5d9d2}.post-list small{display:block;color:#536057;margin-top:4px}.post-list article>div:last-child{display:flex;gap:8px;align-items:start}.post-list form{margin:0}@media(max-width:650px){.form{grid-template-columns:1fr}.form label.full{grid-column:auto}.post-list article{display:block}.post-list article>div:last-child{margin-top:10px}}</style></head><body><h1>Blog personal</h1><p class="meta">Publica borradores o artículos visibles en <a href="/blog">/blog</a>. Los lectores podrán filtrar por categoría y ver la fecha de cada publicación.</p><nav class="nav"><a class="button alt" href="/admin/errores">Panel de errores</a><a class="button alt" href="/admin/blog">Nueva publicación</a></nav>${notice ? `<p class="meta">${escapeHtml(notice)}</p>` : ''}<section class="panel"><h2>${draft.id ? 'Editar publicación' : 'Nueva publicación'}</h2><form class="form" method="post" action="/admin/blog"><input type="hidden" name="id" value="${field('id', draft.id)}"><label class="full">Título<input required maxlength="120" name="title" value="${field('title', draft.title)}"></label><label>Categoría<input required maxlength="48" name="category" placeholder="Ej.: Desarrollo, Aprendizaje" value="${field('category', draft.category)}"></label><label>Fecha de publicación<input required type="date" name="publishedAt" value="${field('publishedAt', draft.publishedAt)}"></label><label class="full">Resumen<input required maxlength="300" name="excerpt" value="${field('excerpt', draft.excerpt)}"></label><label class="full">Contenido<textarea required maxlength="12000" name="body" placeholder="Escribe el artículo. Separa párrafos con una línea en blanco.">${field('body', draft.body)}</textarea></label><label><span>Estado</span><select name="published"><option value="">Borrador</option><option value="on" ${draft.published ? 'selected' : ''}>Publicado</option></select></label><div class="actions"><button class="button" type="submit">Guardar publicación</button>${draft.id ? '<a class="button alt" href="/admin/blog">Cancelar edición</a>' : ''}</div></form></section><section class="panel post-list"><h2>Publicaciones</h2>${postList}</section></body></html>`; }

app.get('/', (_request, response) => response.sendFile(path.join(root, 'index.html')));
app.get('/service-worker.js', (_request, response) => response.type('application/javascript').sendFile(path.join(root, 'service-worker.js')));
app.get('/privacidad', (_request, response) => response.sendFile(path.join(root, 'public', 'privacy.html')));
app.get('/admin/blog', admin, async (request, response, next) => {
  try {
    const posts = await readBlogPosts(storageRoot);
    const draft = posts.find(post => post.id === safeText(request.query.edit, 80)) || { id:'', title:'', category:'', excerpt:'', body:'', publishedAt:nowDate(), published:false };
    response.type('html').send(blogPanel(posts, draft, safeText(request.query.ok, 120)));
  } catch (error) { next(error); }
});
app.post('/admin/blog', admin, sameOrigin, async (request, response, next) => {
  try {
    await serializeBlogWrite(async () => {
      const posts = await readBlogPosts(storageRoot);
      const id = safeText(request.body.id, 80);
      const index = posts.findIndex(post => post.id === id);
      const post = normalizeBlogPost(request.body, index >= 0 ? posts[index] : {}, posts);
      if (index >= 0) posts[index] = post; else posts.push(post);
      await writeBlogPosts(storageRoot, posts);
    });
    response.redirect(303, '/admin/blog?ok=Publicación guardada.');
  } catch (error) { response.status(400).type('html').send(`<p>No se pudo guardar: ${escapeHtml(error.message)}</p><p><a href="/admin/blog">Volver al blog</a></p>`); }
});
app.post('/admin/blog/:id/delete', admin, sameOrigin, async (request, response, next) => {
  try {
    await serializeBlogWrite(async () => { const posts = await readBlogPosts(storageRoot); await writeBlogPosts(storageRoot, posts.filter(post => post.id !== safeText(request.params.id, 80))); });
    response.redirect(303, '/admin/blog?ok=Publicación eliminada.');
  } catch (error) { next(error); }
});
app.post('/api/log-404', sameOrigin, async (request, response) => {
  try {
    if (!logSalt) return response.status(204).end();
    const ip = getIp(request); const route = safeText(request.body?.route, 512);
    if (!allowedToLog(ip)) return response.status(429).json({ ok: false });
    if (!route.startsWith('/') || route.startsWith('//')) return response.status(400).json({ ok: false });
    await serializeLogWrite(async () => {
      const records = await readLogs();
      const record = { createdAt: new Date().toISOString(), route, referrer: safeText(request.body?.referrer, 512), language: safeText(request.body?.language, 32), timezone: safeText(request.body?.timezone, 80), screen: safeText(request.body?.screen, 32), userAgent: safeText(request.get('user-agent'), 300), ipHash: hashIp(ip), ipMasked: maskIp(ip) };
      const duplicate = records.at(-1);
      if (!duplicate || duplicate.route !== record.route || duplicate.ipHash !== record.ipHash || Date.parse(record.createdAt) - Date.parse(duplicate.createdAt) > 300000) { records.push(record); await writeLogs(records.slice(-maxLogRecords)); }
    });
    response.status(204).end();
  } catch (error) { console.error('No se pudo registrar 404:', error); response.status(500).json({ ok: false }); }
});
app.get('/admin/errores', admin, async (request, response, next) => {
  try {
    const filter = filters(request.query); const { page, ...criteria } = filter; const records = filtered(await readLogs(), criteria); const pageSize = 100; const pages = Math.max(1, Math.ceil(records.length / pageSize)); const currentPage = Math.min(page, pages); const visibleRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize); const query = new URLSearchParams(Object.entries(criteria).filter(([,value]) => value)).toString(); const pageUrl = target => `/admin/errores?${new URLSearchParams({ ...criteria, page: String(target) }).toString()}`; const body = visibleRecords.map(record => `<tr><td>${escapeHtml(new Date(record.createdAt).toLocaleString('es-PY'))}</td><td>${escapeHtml(record.route)}</td><td>${escapeHtml(record.referrer || '-')}</td><td>${escapeHtml(record.ipMasked)}</td><td>${escapeHtml(record.language || '-')}</td><td>${escapeHtml(record.userAgent || '-')}</td></tr>`).join('') || '<tr><td colspan="6">Sin registros con estos filtros.</td></tr>'; const pagination = pages > 1 ? `<nav class="pagination" aria-label="Paginación de registros">${currentPage > 1 ? `<a class="button alt" href="${pageUrl(currentPage - 1)}">← Anterior</a>` : ''}<span>Página ${currentPage} de ${pages}</span>${currentPage < pages ? `<a class="button alt" href="${pageUrl(currentPage + 1)}">Siguiente →</a>` : ''}</nav>` : '';
    response.type('html').send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Panel de errores 404</title><style>body{font:15px Arial,sans-serif;max-width:1280px;margin:32px auto;padding:0 18px;color:#17211c;background:#f6f7f4}h1{margin-bottom:4px}.meta{color:#536057}.filters,.actions,.pagination{display:flex;flex-wrap:wrap;gap:12px;align-items:end;background:#fff;padding:16px;border:1px solid #d5d9d2;margin:18px 0}.pagination{justify-content:space-between;align-items:center}.filters label{display:grid;gap:4px;font-size:12px;font-weight:bold}.filters input{padding:8px;border:1px solid #aab3aa;border-radius:3px}.button{border:1px solid #1e3128;background:#1e3128;color:white;padding:9px 12px;text-decoration:none;border-radius:3px;cursor:pointer}.button.alt{background:#fff;color:#1e3128}.table-wrap{overflow:auto;background:#fff;border:1px solid #d5d9d2}table{border-collapse:collapse;width:100%;min-width:850px}th,td{padding:10px;text-align:left;border-bottom:1px solid #e3e6e1;vertical-align:top}th{background:#1e3128;color:#fff}td:last-child{max-width:350px;word-break:break-word}</style></head><body><h1>Registros de errores 404</h1><p class="meta">${records.length} registro(s); mostrando ${visibleRecords.length}. IP enmascarada y hash técnico; la retención se controla desde variables de entorno.</p><form class="filters" method="get"><label>Ruta<input name="route" value="${escapeHtml(filter.route)}"></label><label>Referrer<input name="referrer" value="${escapeHtml(filter.referrer)}"></label><label>Desde<input type="date" name="from" value="${escapeHtml(filter.from)}"></label><label>Hasta<input type="date" name="to" value="${escapeHtml(filter.to)}"></label><button class="button" type="submit">Filtrar</button><a class="button alt" href="/admin/errores">Limpiar</a></form><div class="actions"><strong>Exportar los registros filtrados:</strong><a class="button" href="/admin/errores/export?format=xlsx&${query}">Excel (.xlsx)</a><a class="button" href="/admin/errores/export?format=pdf&${query}">PDF</a><a class="button" href="/admin/errores/export?format=csv&${query}">CSV</a><a class="button" href="/admin/errores/export?format=txt&${query}">TXT (tabla)</a></div>${pagination}<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Ruta</th><th>Referrer</th><th>IP</th><th>Idioma</th><th>User-Agent</th></tr></thead><tbody>${body}</tbody></table></div></body></html>`);
  } catch (error) { next(error); }
});
app.get('/admin/errores/export', admin, async (request, response, next) => {
  try {
    const format = safeText(request.query.format, 8).toLowerCase(); const { page: _page, ...criteria } = filters(request.query); const data = rows(filtered(await readLogs(), criteria)); const name = `errores-404-${nowDate()}`; const headers = Object.keys(data[0] || { Fecha:'', Ruta:'', Referrer:'', 'IP (enmascarada)':'', Idioma:'', 'Zona horaria':'', Pantalla:'', 'User-Agent':'' });
    if (format === 'csv') return response.attachment(`${name}.csv`).type('text/csv').send(`\uFEFF${[headers,...data.map(row=>headers.map(header=>row[header]))].map(row=>row.map(csvCell).join(',')).join('\n')}`);
    if (format === 'txt') return response.attachment(`${name}.txt`).type('text/plain').send(asTxt(data));
    if (format === 'xlsx') { const book = new ExcelJS.Workbook(); const sheet = book.addWorksheet('Errores 404'); sheet.columns=headers.map(header=>({header,key:header,width:Math.min(45,Math.max(14,header.length+4))})); data.forEach(row=>sheet.addRow(Object.fromEntries(headers.map(header => [header, neutralizeSpreadsheetFormula(row[header])])))); sheet.getRow(1).font={bold:true}; sheet.autoFilter=`A1:${String.fromCharCode(64+headers.length)}1`; response.attachment(`${name}.xlsx`).type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); await book.xlsx.write(response); return response.end(); }
    if (format === 'pdf') { response.attachment(`${name}.pdf`).type('application/pdf'); const doc = new PDFDocument({ layout:'landscape', size:'A4', margin:36 }); doc.pipe(response); doc.fontSize(16).text('Registros de errores 404'); doc.moveDown(.4); doc.fontSize(8); const cols=[115,175,190,75,80]; let y=doc.y; const draw=cells=>{let x=36;cells.forEach((cell,index)=>{doc.text(String(cell||'').slice(0,65),x,y,{width:cols[index],height:22,ellipsis:true});x+=cols[index];});y+=24;if(y>540){doc.addPage();y=45;}}; draw(['Fecha','Ruta','Referrer','IP','Idioma']); doc.moveTo(36,y-4).lineTo(775,y-4).stroke(); data.forEach(row=>draw([row.Fecha,row.Ruta,row.Referrer,row['IP (enmascarada)'],row.Idioma])); return doc.end(); }
    return response.status(400).json({ error:'Formato no admitido.' });
  } catch (error) { next(error); }
});
app.get(/^\/(sobre-mi|proyectos(?:\/[^/]+)?|blog(?:\/[^/]+)?|muestras|experiencia|formacion|stack|cv|contacto)\/?$/, (_request, response) => response.type('html').send(localSpaIndex));
app.use('/api', (_request,response)=>response.status(404).json({ error:'Endpoint no encontrado.' }));
app.use((_request,response)=>response.status(404).sendFile(path.join(root,'404.html')));
app.use((error,_request,response,_next)=>{ console.error(error); response.status(500).send('Error interno del servidor.'); });

await pruneLogs();
if (retentionDays > 0) setInterval(() => pruneLogs().catch(console.error), 86400000).unref();
app.listen(port, () => console.log(`Portfolio: http://localhost:${port} | Panel: /admin/errores`));
