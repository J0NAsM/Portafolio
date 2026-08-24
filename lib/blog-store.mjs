import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const contentFile = root => path.join(root, 'content', 'blog-posts.json');
const browserFile = root => path.join(root, 'public', 'blog-posts.js');
const text = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
const validDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00`));
const slugify = value => text(value, 180).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || 'publicacion';

export async function readBlogPosts(root) {
  try {
    const parsed = JSON.parse(await fs.readFile(contentFile(root), 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export function normalizeBlogPost(input, current = {}, allPosts = []) {
  const title = text(input.title, 120);
  const category = text(input.category, 48);
  const excerpt = text(input.excerpt, 300);
  const body = text(input.body, 12000);
  const publishedAt = validDay(text(input.publishedAt, 10)) ? text(input.publishedAt, 10) : new Date().toISOString().slice(0, 10);
  if (!title || !category || !excerpt || !body) throw new Error('Completa título, categoría, resumen y contenido.');
  const baseSlug = slugify(input.slug || title);
  const id = current.id || crypto.randomUUID();
  const slug = allPosts.some(post => post.id !== id && post.slug === baseSlug) ? `${baseSlug}-${id.slice(0, 6)}` : baseSlug;
  return { id, slug, title, category, excerpt, body, publishedAt, published: input.published === 'on' || input.published === true, updatedAt: new Date().toISOString() };
}

export async function writeBlogPosts(root, posts) {
  const ordered = [...posts].sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)) || String(b.updatedAt).localeCompare(String(a.updatedAt)));
  await fs.mkdir(path.dirname(contentFile(root)), { recursive: true });
  await fs.writeFile(contentFile(root), `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');
  await fs.writeFile(browserFile(root), `window.portfolioBlogPosts = ${JSON.stringify(ordered, null, 2)};\n`, 'utf8');
  return ordered;
}
