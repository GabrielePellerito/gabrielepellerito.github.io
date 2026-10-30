import { test, expect } from '@playwright/test';
import { mountRobot, setPose } from '../scripts/robot-harness.mjs';
import { referenceFiles } from '../scripts/privacy.mjs';

test('three actual joint poses, reversible motion, no idle rendering', async ({ page, baseURL, isMobile }) => {
  await mountRobot(page, baseURL + '/', { lowPower: isMobile });
  const initial = await setPose(page, 0);
  const halfway = await setPose(page, .5);
  const final = await setPose(page, 1);
  expect(halfway.base).not.toBe(initial.base);
  expect(halfway.arm).not.toBe(initial.arm);
  expect(final.shovel).not.toBe(halfway.shovel);
  expect(initial.tip).not.toEqual(halfway.tip); expect(final.tip).not.toEqual(halfway.tip);
  expect(final.rootRotation).toEqual([0, 0, 0]);
  expect(final.basePosition).toEqual(initial.basePosition);
  expect(final.pixelRatio).toBeLessThanOrEqual(isMobile ? 1.25 : 1.65);
  expect(final.triangles).toBeLessThan(50000);
  expect(final.calls).toBeLessThan(250);
  const reversed = await setPose(page, 0);
  expect(reversed.tip).toEqual(initial.tip);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__robotQA.diagnostics.renderCount)).toBe(reversed.renderCount);
  expect(await page.evaluate(() => window.__robotQA.diagnostics.geometries)).toBe(initial.geometries);
});

test('real WebGL context loss/restoration, then GPU disposal', async ({ page, baseURL, isMobile }) => {
  await mountRobot(page, baseURL + '/', { lowPower: isMobile });
  const before = await setPose(page, .5);
  const supported = await page.evaluate(() => {
    const gl = document.querySelector('canvas').getContext('webgl2');
    window.__loseContext = gl.getExtension('WEBGL_lose_context');
    if (!window.__loseContext) return false;
    window.__loseContext.loseContext(); return true;
  });
  expect(supported, 'Test requires actual WEBGL_lose_context support').toBe(true);
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-renderer', 'fallback');
  await expect(page.locator('.sculpture-fallback')).toHaveCSS('opacity', '1');
  await page.evaluate(() => window.__loseContext.restoreContext());
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-renderer', 'webgl');
  const restored = await setPose(page, .5);
  expect(restored.tip).toEqual(before.tip); expect(restored.lost).toBe(false);
  expect(restored.geometries).toBe(before.geometries);
  expect(restored.textures).toBe(before.textures);
  await page.evaluate(() => { window.__robotQA.dispose(); window.__robotQA.dispose(); window.__robotQA.setProgress(1); });
  await expect(page.locator('.scene-mount canvas')).toHaveCount(0);
  expect(await page.evaluate(() => window.__robotQA.diagnostics.disposed)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__robotQA.diagnostics.contextLost)).toBe(true);
  expect(await page.evaluate(() => window.__robotQA.diagnostics.geometries)).toBe(0);
});

test('private prototype references denied, including uppercase and encoded names', async ({ request }) => {
  for (const file of referenceFiles) {
    for (const name of [file, file.toUpperCase()]) expect((await request.get('/assets/' + encodeURIComponent(name))).status()).toBe(404);
  }
});
