import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderSite, render404, escapeHtml } from './template.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
export async function generate({ check = false } = {}) {
  const data = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));
  if (new URL(data.seo.url).protocol !== 'https:' || !data.seo.url.endsWith('/')) throw new Error('seo.url deve iniziare con https:// e terminare con /.');
  if (data.contact.email && !/^[^\s@<>"?]+@[^\s@<>"?]+\.[^\s@<>"?]+$/.test(data.contact.email)) throw new Error('Email pubblica non valida.');
  for (const item of [...data.contact.socials, ...data.projects.items.flatMap((p) => [p.url, p.githubUrl, p.demoUrl].filter(Boolean).map((url) => ({ url })))]) {
    if (new URL(item.url).protocol !== 'https:') throw new Error('Usa soltanto collegamenti pubblici HTTPS.');
  }
  for (const item of data.projects.items) {
    if (item.image?.src && (!item.image.src.startsWith('./assets/') || item.image.src.includes('..') || /[?#]/.test(item.image.src))) throw new Error('Le immagini dei progetti devono essere file locali in ./assets/.');
    if (item.image?.src && (![item.image.width, item.image.height].every((value) => Number.isInteger(value) && value > 0))) throw new Error('Specifica larghezza e altezza positive per le immagini dei progetti.');
  }
  let html = renderSite(data);
  const schema = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1];
  html = html.replace('__SCHEMA_HASH__', `'sha256-${createHash('sha256').update(schema).digest('base64')}'`);
  const outputs = {
    'index.html': html,
    '404.html': render404(data).replace('__SCHEMA_HASH__', ''),
    'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeHtml(data.seo.url)}</loc></url></urlset>\n`,
    'robots.txt': `User-agent: *\n${data.seo.indexing ? 'Allow: /' : 'Disallow: /'}\nSitemap: ${data.seo.url}sitemap.xml\n`,
    'assets/favicon.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${data.design.background}"/><text x="32" y="43" fill="${data.design.foreground}" font-family="Arial,sans-serif" font-size="31" text-anchor="middle">${escapeHtml(data.person.initials)}</text></svg>\n`
  };
  for (const [name, content] of Object.entries(outputs)) {
    const url = new URL(`../${name}`, import.meta.url);
    if (check) {
      if (await readFile(url, 'utf8') !== content) throw new Error(`${name} non aggiornato. Esegui npm.cmd run update.`);
    } else await writeFile(url, content);
  }
  return Object.keys(outputs);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(`Aggiornati: ${(await generate()).join(', ')}`);
