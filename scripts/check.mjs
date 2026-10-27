import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { generate, root } from './update.mjs';
import { resolve } from 'node:path';

await generate({ check: true });
const manifest = JSON.parse(await readFile(resolve(root, 'assets/scene-manifest.json'), 'utf8'));
for (const [key, path] of Object.entries({ source: 'src/scene.js', bundle: 'assets/scene.bundle.js' })) {
  assert.equal(createHash('sha256').update(await readFile(resolve(root, path))).digest('hex'), manifest[key], 'Scena non sincronizzata: npm.cmd run build:scene');
}
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const data = JSON.parse(await readFile(resolve(root, 'content/site.json'), 'utf8'));
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Un solo h1');
assert.match(html, /<html lang="it"(?:\s|>)/);
assert.match(html, /<main id="contenuto"/);
assert.match(html, /<link rel="canonical"/);
assert.match(html, /property="og:image"/);
assert.match(html, /name="twitter:card"/);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
assert.equal(new Set(ids).size, ids.length, 'Gli ID devono essere univoci');
for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), `Ancora inesistente: ${match[1]}`);
for (const match of html.matchAll(/(?:href|src)="\.\/([^"]+)"/g)) await access(resolve(root, match[1]));
for (const file of ['.nojekyll', '404.html', 'robots.txt', 'sitemap.xml', 'assets/social-card.png', 'assets/favicon-32.png', 'assets/apple-touch-icon.png']) await access(resolve(root, file));
const schemaText = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1];
assert.equal(JSON.parse(schemaText).mainEntity.name, data.person.name);
assert.ok(html.includes(`sha256-${createHash('sha256').update(schemaText).digest('base64')}`), 'CSP coerente con JSON-LD');
assert.ok(!html.includes('href="#"'), 'Nessun collegamento fittizio');
for (const file of ['assets/social-card.png', 'assets/favicon-32.png', 'assets/apple-touch-icon.png']) {
  const png = await readFile(resolve(root, file));
  assert.equal(png.readUInt32BE(0), 0x89504e47);
  const expected = file.includes('social') ? [1200, 630] : file.includes('32') ? [32, 32] : [180, 180];
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], expected);
}
console.log('Verificati: contenuti sincronizzati, HTML, ancore, asset, SEO, JSON-LD/CSP e dimensioni immagini.');
