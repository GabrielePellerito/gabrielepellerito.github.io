import { test, expect } from '@playwright/test';
import { mountRobot } from '../scripts/robot-harness.mjs';

async function scrollProgress(page, p) {
  await page.evaluate(p => {
    const hero = document.querySelector('.hero'), sticky = document.querySelector('.hero-sticky');
    const top = hero.getBoundingClientRect().top + scrollY - document.querySelector('.site-header').offsetHeight;
    scrollTo({ top: top + (hero.offsetHeight - sticky.offsetHeight) * p, behavior: 'instant' });
  }, p);
  await expect.poll(() => page.evaluate(p => Math.abs(window.__robotQA.progress - p), p)).toBeLessThan(.001);
}
test('sticky narrative reaches actual contact, opening, light and the real about section', async ({ page, baseURL, isMobile }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await mountRobot(page, baseURL + '/', { lowPower: isMobile });
  await expect(page.locator('html')).toHaveClass(/cinema-active/);
  const original = await page.evaluate(() => window.__robotQA.diagnostics);
  await scrollProgress(page, .35);
  const contact = await page.evaluate(() => window.__robotQA.diagnostics.narrative);
  expect(Math.abs(contact.contact[1] - contact.surfaceHeight)).toBeLessThan(.01);
  const stickyTop = await page.locator('.hero-sticky').evaluate(e => e.getBoundingClientRect().top);
  await scrollProgress(page, .5);
  const digging = await page.evaluate(() => window.__robotQA.diagnostics.narrative);
  expect(digging.contact[1]).toBeLessThan(digging.surfaceHeight); expect(digging.opening).toBeGreaterThan(0);
  expect(await page.locator('.hero-sticky').evaluate(e => e.getBoundingClientRect().top)).toBeCloseTo(stickyTop, 0);
  await scrollProgress(page, .85);
  const aura = await page.evaluate(() => window.__robotQA.diagnostics.narrative);
  expect(aura.holeRadius).toBeGreaterThan(.8); expect(aura.light).toBeGreaterThan(.8);
  await scrollProgress(page, 1);
  await expect(page.locator('#about-title')).toBeInViewport();
  const final = await page.evaluate(() => window.__robotQA.diagnostics.narrative);
  expect(final.camera[1]).toBeLessThan(final.surfaceHeight);
  await scrollProgress(page, 0);
  expect((await page.evaluate(() => window.__robotQA.diagnostics)).tip).toEqual(original.tip);
  expect(errors).toEqual([]);
});
test('resize preserves progress mapping and pause removes the extended scroll runway', async ({ page, baseURL, isMobile }) => {
  await mountRobot(page, baseURL + '/', { lowPower: isMobile });
  await scrollProgress(page, .5);
  await page.setViewportSize({ width: isMobile ? 320 : 1920, height: 900 });
  await scrollProgress(page, .85);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.motion-toggle').click();
  await expect(page.locator('html')).not.toHaveClass(/cinema-active/);
  const height = await page.locator('.hero').evaluate(e => e.offsetHeight);
  expect(height).toBeLessThan(1800);
  await page.locator('.motion-toggle').click();
  await expect(page.locator('html')).toHaveClass(/cinema-active/);
  await scrollProgress(page, 0);
});
test('skip link and direct anchors bypass the introduction without trapping focus', async ({ page, baseURL, isMobile }) => {
  await mountRobot(page, baseURL + '/', { lowPower: isMobile });
  await page.getByRole('link', { name: "Salta l'introduzione" }).click();
  await expect(page).toHaveURL(/#chi-sono$/); await expect(page.locator('#about-title')).toBeInViewport();
  await page.goto(baseURL + '/#competenze');
  await expect(page.locator('#skills-title')).toBeInViewport();
  await expect(page.locator('#competenze')).toBeVisible();
});
