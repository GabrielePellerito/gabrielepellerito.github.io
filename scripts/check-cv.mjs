// Local review only: reads the private source in place; never copies it.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { root } from './update.mjs';
import { assertPrivateSourceNotTracked } from './privacy.mjs';
const sourcePath = process.env.CV_SOURCE || fileURLToPath(new URL('../../../assets/contenuti-cv-sito-gabriele.md', import.meta.url));
const source = await readFile(sourcePath, 'utf8');
const data = JSON.parse(await readFile(resolve(root, 'content/site.json'), 'utf8'));
assertPrivateSourceNotTracked(root);
assert.ok(source.includes('14 aprile 2025'), 'Verifica la data della fonte.');
for (const item of data.journey.items) {
  assert.ok(source.includes(item.organization), `Organizzazione non trovata nella fonte: ${item.organization}`);
  if (item.status) assert.equal(item.status, 'Stato da aggiornare');
}
assert.equal(data.journey.items.filter((item) => item.status).length, 2);
assert.equal(data.contact.email, ''); assert.deepEqual(data.contact.socials, []);
assert.equal(data.projects.items.length, 1);
assert.deepEqual(data.projects.items[0].stack, []);
for (const key of ['url', 'githubUrl', 'demoUrl']) assert.equal(data.projects.items[0][key], '');
const languageGroup = data.skills.groups.find((group) => group.title === 'Lingue');
for (const item of languageGroup.items) assert.ok(source.includes(item.level.toLowerCase()) || source.includes(item.level));
const comparison = process.argv.indexOf('--compare');
if (comparison !== -1) {
  if (!process.argv[comparison + 1]) throw new Error('Indica il percorso dell’altro checkout dopo --compare.');
  const other = JSON.parse(await readFile(resolve(process.argv[comparison + 1], 'content/site.json'), 'utf8'));
  const { design: ownDesign, ...facts } = data;
  const { design: otherDesign, ...otherFacts } = other;
  assert.notEqual(ownDesign.concept, otherDesign.concept);
  assert.deepEqual(facts, otherFacts, 'I dati professionali dei due design devono coincidere.');
  console.log('Coerenza completa dei contenuti fra i due design verificata.');
}
console.log('Fonte privata leggibile senza copia; organizzazioni, stati da verificare, lingue e contatti controllati.');
