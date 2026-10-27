import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
const data = JSON.parse(await readFile(new URL('../content/site.json', import.meta.url), 'utf8'));

async function activate(page) { await page.evaluate(() => scrollTo(0, 1)); await page.waitForSelector('.scene-ready'); }

test('homepage, SEO e risorse senza errori', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  expect((await page.goto('/')).status()).toBe(200);
  await expect(page).toHaveTitle(data.seo.title);
  await expect(page.locator('h1')).toContainText(data.person.firstName);
  await expect(page.locator('h1')).toContainText(data.person.lastName);
  for (const id of ['chi-sono', 'percorso', 'competenze', 'progetti', 'contatti']) await expect(page.locator(`#${id}`)).toHaveCount(1);
  await activate(page);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://gabrielepellerito.com/');
  expect(errors).toEqual([]);
});

test('vera rotazione WebGL interpolata sullo scroll, nessun loop a riposo', async ({ page }) => {
  await page.goto('/'); await activate(page);
  const stage = page.locator('.sculpture-stage');
  const initial = Number(await stage.getAttribute('data-rotation'));
  await page.evaluate(() => scrollTo(0, 380));
  await expect.poll(async () => Math.abs(Number(await stage.getAttribute('data-rotation')) - initial)).toBeGreaterThan(.2);
  await page.waitForTimeout(1300);
  const steady = await stage.getAttribute('data-progress');
  await page.waitForTimeout(250);
  await expect(stage).toHaveAttribute('data-progress', steady);
});

test('pausa persistente e movimento ridotto senza download del 3D', async ({ page, browser, baseURL }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: data.design.pauseLabel });
  await toggle.click(); await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await page.getByRole('button', { name: data.design.resumeLabel }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const reduced = await context.newPage(); const requests = [];
  reduced.on('request', (r) => requests.push(r.url()));
  await reduced.goto(baseURL); await reduced.waitForTimeout(400);
  await expect(reduced.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(reduced.locator('.sculpture-fallback')).toBeVisible();
  expect(requests.some((url) => url.endsWith('scene.bundle.js'))).toBe(false);
  expect(await reduced.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  await context.close();
});

test('menu accessibile, focus da tastiera e navigazione', async ({ page, isMobile }) => {
  await page.goto('/'); await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: data.ui.skipLink })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('#contenuto')).toBeFocused();
  if (isMobile) {
    const menu = page.getByRole('button', { name: data.ui.menuLabel });
    await menu.click(); await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape'); await expect(menu).toBeFocused();
    await menu.click(); await page.getByRole('navigation').getByRole('link', { name: 'Chi sono', exact: true }).click();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#chi-sono')).toBeFocused();
  } else await page.getByRole('navigation').getByRole('link', { name: 'Chi sono', exact: true }).click();
  await expect(page).toHaveURL(/#chi-sono$/);
  await expect(page.locator('.site-nav a[href="#chi-sono"]')).toHaveAttribute('aria-current', 'location');
});

test('WCAG 2.2 AA automatico, pagina e menu mobile', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/');
  const audit = async () => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations, JSON.stringify(results.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })))).toEqual([]);
  };
  await audit();
  if (isMobile) { await page.locator('.menu-toggle').click(); await audit(); }
});

test('layout 320–1920 senza overflow', async ({ page }) => {
  await page.goto('/');
  for (const width of [320, 375, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Larghezza ${width}`).toBe(true);
  }
});

test('senza JavaScript: navigazione, contenuti e scultura statici', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage(); await page.goto(baseURL);
  await expect(page.locator('h1')).toBeVisible(); await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.locator('.sculpture-fallback')).toBeVisible();
  await expect(page.locator('#chi-sono h2')).toBeVisible();
  expect(await page.locator('.sculpture-fallback').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  await context.close();
});

test('fallback senza WebGL e dopo perdita del contesto', async ({ browser, baseURL, page }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
  const fallback = await context.newPage(); await fallback.goto(baseURL); await fallback.evaluate(() => scrollTo(0, 1));
  await expect(fallback.locator('.sculpture-stage')).toHaveAttribute('data-renderer', 'fallback');
  await expect(fallback.locator('.sculpture-fallback')).toHaveCSS('opacity', '1');
  await context.close();
  await page.goto('/'); await activate(page);
  await page.locator('canvas').evaluate((canvas) => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.locator('.sculpture-stage')).not.toHaveClass(/scene-ready/);
});

test('404 coerente, risorse SEO e nessun accesso a dotfile', async ({ page, request }) => {
  const response = await page.goto('/percorso/pagina-inesistente'); expect(response.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText(data.ui.notFound.title);
  await page.getByRole('link', { name: data.ui.notFound.link }).click(); await expect(page).toHaveTitle(data.seo.title);
  for (const url of ['/robots.txt', '/sitemap.xml', '/assets/social-card.png']) expect((await request.get(url)).status()).toBe(200);
  expect((await request.get('/.git/config')).status()).toBe(404);
});
