import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const data = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));

test('esperienze documentate, formazione distinta e stati del CV 2025', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.timeline-item')).toHaveCount(8);
  await expect(page.locator('.journey-group-title')).toHaveText(['Esperienze professionali', 'Formazione e mobilità internazionale']);
  for (const organization of ['Info Servi Canarias S.L.', 'Gruppo Digi', 'Alfapi', 'San Marino Mail', 'Galdus', 'Wagner College']) {
    expect(await page.locator('#percorso').textContent()).toContain(organization);
  }
  await expect(page.locator('.status-badge')).toHaveCount(2);
  await expect(page.locator('.status-badge')).toHaveText(['Stato da aggiornare', 'Stato da aggiornare']);
  for (const item of data.journey.items) expect(await page.locator('#percorso').textContent()).toContain(item.period);
  await expect(page.locator('a[href="#percorso-esperienze"]')).toHaveCount(1);
});

test('sette categorie e livelli linguistici dichiarati, senza certificazioni inventate', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await expect(page.locator('.skill-group')).toHaveCount(7);
  await expect(page.locator('.language-item')).toHaveText(['ItalianoMadrelingua', 'IngleseC1', 'SpagnoloB1', 'FranceseA2']);
  await expect(page.locator('#competenze')).toContainText('JavaScript — conoscenze di base dichiarate');
  await expect(page.locator('#competenze')).toContainText('Blender — utilizzo di base');
  await expect(page.locator('#competenze')).toContainText('non attestano certificazioni linguistiche');
});

test('un contributo professionale reale, nessun link o contatto non autorizzato', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  await expect(page.locator('.project-card')).toHaveCount(2);
  const contribution = page.locator('.project-card').filter({ hasText: 'Sistema web di prenotazione per coworking' });
  await expect(contribution.locator('.project-category')).toContainText('Contributo professionale');
  await expect(contribution).toContainText('Gruppo Digi');
  await expect(page.locator('.project-links')).toHaveCount(0);
  await expect(contribution).not.toContainText('WordPress');
  const robot = page.locator('.project-card').filter({ hasText: 'Braccio robotico articolato' });
  await expect(robot).toContainText('Progetto personale');
  for (const component of ['Motore stepper', 'Due servomotori', 'Struttura meccanica artigianale', 'Componenti elettronici e cablaggio']) await expect(robot).toContainText(component);
  await expect(robot).not.toContainText(/Arduino|ESP32|Raspberry|Python|C\+\+/);
  await expect(page.locator('.projects-empty')).toContainText('Altri progetti');
  await expect(page.locator('a[href^="mailto:"], a[href^="tel:"], .social-links')).toHaveCount(0);
  expect(data.contact.email).toBe(''); expect(data.contact.socials).toEqual([]);
});

test('JSON-LD con unica qualifica confermata e nessun dato privato', async ({ page }) => {
  await page.goto('/');
  const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  expect(schema['@type']).toBe('ProfilePage'); expect(schema.mainEntity['@type']).toBe('Person');
  expect(schema.mainEntity.hasCredential.map((c) => c.name)).toEqual(['Qualifica di Operatore informatico']);
  for (const property of ['birthDate', 'address', 'telephone', 'email', 'jobTitle', 'sameAs']) expect(schema.mainEntity).not.toHaveProperty(property);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', data.seo.title);
  await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute('content', data.seo.imageAlt);
});

test('documento privato negato anche con maiuscole e codifica URL', async ({ request }) => {
  for (const path of ['/assets/contenuti-cv-sito-gabriele.md', '/ASSETS/CONTENUTI-CV-SITO-GABRIELE.MD', '/assets/%63ontenuti-cv-sito-gabriele.md', '/assets/contenuti-cv-sito-gabriele.md.bak']) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain('# Contenuti verificati dal CV');
  }
});
