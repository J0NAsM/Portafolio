import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile, readdir, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const storageRoot = await mkdtemp(path.join(tmpdir(), 'portfolio-test-'));
const port = 36000 + Math.floor(Math.random() * 2000);
const origin = `http://127.0.0.1:${port}`;
const credentials = Buffer.from('test-admin:test-password').toString('base64');
await mkdir(path.join(storageRoot, 'data'), { recursive: true });
await writeFile(path.join(storageRoot, 'data', '404-errors.json'), JSON.stringify(Array.from({ length: 101 }, (_, index) => ({ createdAt: new Date().toISOString(), route: `/seed-${index + 1}`, referrer: '', language: 'es-PY', timezone: 'America/Asuncion', screen: '1280x720', userAgent: 'integration-test', ipHash: `seed-${index}`, ipMasked: '127.0.0.xxx' }))), 'utf8');
let output = '';
const server = spawn(process.execPath, ['server.js'], {
  cwd: root,
  env: { ...process.env, PORT: String(port), STORAGE_ROOT: storageRoot, ADMIN_USER: 'test-admin', ADMIN_PASSWORD: 'test-password', ERROR_LOG_SALT: 'test-salt', ERROR_LOG_RETENTION_DAYS: '30', ERROR_LOG_MAX_RECORDS: '500', TRUST_PROXY: '0' },
  stdio: ['ignore', 'pipe', 'pipe']
});
server.stdout.on('data', chunk => { output += chunk; });
server.stderr.on('data', chunk => { output += chunk; });

const request = (route, options = {}) => fetch(`${origin}${route}`, {
  redirect: 'manual',
  ...options,
  headers: { Authorization: `Basic ${credentials}`, ...(options.headers || {}) }
});

async function waitForServer() {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`El servidor de integración terminó antes de iniciar (código ${server.exitCode}). ${output}`);
    try {
      const response = await fetch(`${origin}/`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`El servidor de integración no inició. ${output}`);
}

try {
  await waitForServer();
  const home = await fetch(`${origin}/`);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-security-policy') || '', /default-src 'self'/);
  assert.equal((await fetch(`${origin}/admin/blog`)).status, 401);
  assert.equal((await request('/admin/blog')).status, 200);

  const blocked = await request('/api/log-404', { method: 'POST', headers: { Origin: 'https://invalid.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ route: '/test' }) });
  assert.equal(blocked.status, 403);
  const logged = await request('/api/log-404', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ route: '/test', language: 'es-PY' }) });
  assert.equal(logged.status, 204);
  const panel = await request('/admin/errores');
  assert.equal(panel.status, 200);
  assert.match(await panel.text(), /Página 1 de 2/);

  const form = new URLSearchParams({ title: 'Publicación de prueba', category: 'Pruebas', excerpt: 'Resumen de prueba', body: 'Contenido de prueba', publishedAt: '2026-08-24', published: 'on' });
  const created = await request('/admin/blog', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
  assert.equal(created.status, 303);
  const posts = JSON.parse(await readFile(path.join(storageRoot, 'content', 'blog-posts.json'), 'utf8'));
  assert.equal(posts.length, 1);
  assert.equal(posts[0].slug, 'publicacion-de-prueba');
  const exported = await request('/admin/errores/export?format=csv');
  assert.equal(exported.status, 200);
  assert.match(exported.headers.get('content-type') || '', /text\/csv/);

  const deleted = await request(`/admin/blog/${posts[0].id}/delete`, { method: 'POST', headers: { Origin: origin } });
  assert.equal(deleted.status, 303);
  const backupDirectory = path.join(storageRoot, 'data', 'blog-backups');
  const backupName = (await readdir(backupDirectory)).find(name => name.endsWith('.json'));
  assert.ok(backupName, 'La actualización del blog debe generar un respaldo.');
  const backups = await readFile(path.join(backupDirectory, backupName), 'utf8');
  assert.match(backups, /Publicación de prueba/);
  console.log('Integración verificada: servidor, autenticación, CSRF, registros, exportación, blog y respaldo.');
} finally {
  if (!server.killed) server.kill();
  await once(server, 'exit').catch(() => {});
  await rm(storageRoot, { recursive: true, force: true });
}
