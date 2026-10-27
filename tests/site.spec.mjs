import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
const content = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));

test('homepage completa, nessun errore JavaScript o risorsa mancante', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
  await expect(page).toHaveTitle(content.seo.title);
  await expect(page.locator('h1')).toHaveText(`${content.hero.greeting} ${content.person.firstName} ${content.person.lastName}.`);
  for (const id of ['chi-sono', 'percorso', 'competenze', 'progetti', 'contatti']) await expect(page.locator(`#${id}`)).toHaveCount(1);
  await expect(page.locator('.placeholder-badge').first()).toBeVisible();
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('tema persistente e preferenza di sistema', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Attiva la modalità chiara' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('menu, ancore e accesso da tastiera', async ({ page, isMobile }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: content.ui.skipLink })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#contenuto')).toBeFocused();
  if (isMobile) {
    const menu = page.getByRole('button', { name: content.ui.menuLabel });
    await expect(page.getByRole('navigation')).toBeHidden();
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('navigation')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await menu.click();
    await page.getByRole('navigation').getByRole('link', { name: 'Chi sono', exact: true }).click();
    await expect(page).toHaveURL(/#chi-sono$/);
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#chi-sono')).toBeFocused();
  } else {
    await page.getByRole('navigation').getByRole('link', { name: 'Progetti', exact: true }).click();
    await expect(page).toHaveURL(/#progetti$/);
  }
});

test('accessibilità WCAG automatica in entrambi i temi', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => { document.documentElement.dataset.theme = value; }, theme);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations, JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })), null, 2)).toEqual([]);
  }
});

test('nessuno scorrimento orizzontale su smartphone, tablet e desktop', async ({ page }) => {
  await page.goto('/');
  for (const width of [320, 375, 600, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Larghezza ${width}`).toBe(true);
  }
});

test('contenuto leggibile senza JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto(baseURL);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.locator('#chi-sono h2')).toBeVisible();
  await context.close();
});

test('404 e risorse SEO rispondono correttamente', async ({ request }) => {
  for (const url of ['/robots.txt', '/sitemap.xml', '/assets/social-card.png', '/assets/favicon.svg']) expect((await request.get(url)).status()).toBe(200);
  const missing = await request.get('/pagina-inesistente');
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain(content.ui.notFound.title);
  for (const url of ['/.git/config', '/.workspace-backup/versione-preesistente.zip']) expect((await request.get(url)).status()).toBe(404);
});
