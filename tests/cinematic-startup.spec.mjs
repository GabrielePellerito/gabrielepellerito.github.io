import { test, expect } from '@playwright/test';

// Real controller, no ?render3d=1 or scene-ready wait before the first scroll.
async function hold(page, asset, abort = false) {
  let release, requested;
  const gate = new Promise(resolve => { release = resolve; });
  const started = new Promise(resolve => { requested = resolve; });
  await page.route(`**/assets/${asset}`, async route => { requested(); await gate; if (abort) await route.abort('failed'); else await route.continue(); });
  return { release, started };
}
async function dimensions(page) {
  return page.evaluate(() => {
    const hero = document.querySelector('.hero'), sticky = document.querySelector('.hero-sticky');
    return { y: scrollY, viewport: innerHeight, hero: hero.offsetHeight, sticky: sticky.offsetHeight,
      top: sticky.getBoundingClientRect().top, header: document.querySelector('.site-header').getBoundingClientRect().bottom,
      about: document.querySelector('#chi-sono').getBoundingClientRect().top };
  });
}
async function scrollToProgress(page, progress) {
  await page.evaluate(progress => {
    const hero = document.querySelector('.hero'), sticky = document.querySelector('.hero-sticky');
    const start = hero.getBoundingClientRect().top + scrollY - document.querySelector('.site-header').offsetHeight;
    scrollTo({ top: start + (hero.offsetHeight - sticky.offsetHeight) * progress, behavior: 'instant' });
  }, progress);
}
async function settled(page, progress) {
  await expect.poll(() => page.locator('.sculpture-stage').evaluate((el, p) => Math.abs(Number(el.dataset.progress) - p), progress)).toBeLessThan(.001);
}
async function realWebGL(page) {
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-renderer', 'webgl');
  expect(await page.locator('.scene-mount canvas').evaluate(canvas => {
    const gl = canvas.getContext('webgl2'); return Boolean(gl && !gl.isContextLost());
  })).toBe(true);
}

test('A: first scroll before main.js and WebGL retains the prepared sticky runway', async ({ page }) => {
  const controller = await hold(page, 'main.js'), bundle = await hold(page, 'scene.bundle.js');
  try {
    await page.goto('/', { waitUntil: 'commit' });
    await page.locator('.hero').waitFor({ state: 'attached' });
    // Scroll at the first parsed Hero, with both deferred scripts still blocked.
    await page.evaluate(() => scrollTo({ top: innerHeight, behavior: 'instant' }));
    const before = await dimensions(page);
    expect(before.hero).toBeGreaterThan(before.viewport * 3);
    expect(Math.abs(before.top - before.header)).toBeLessThan(1);
    await expect(page.locator('canvas')).toHaveCount(0);
    controller.release(); await bundle.started;
    bundle.release(); await realWebGL(page);
    const after = await dimensions(page);
    expect(after.hero).toBe(before.hero);
    expect(Math.abs(after.y - before.y)).toBeLessThan(1);
    expect(Math.abs(after.about - before.about)).toBeLessThan(1);
  } finally { controller.release(); bundle.release(); }
});

test('B: slow bundle starts without interaction and a normal fast scroll cannot skip the story', async ({ page }) => {
  const bundle = await hold(page, 'scene.bundle.js');
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await bundle.started; // The download begins without scrolling or a QA query parameter.
    await page.evaluate(() => scrollTo({ top: innerHeight * 1.5, behavior: 'instant' }));
    await page.waitForTimeout(800); // Keep the request stalled beyond the initial observer callback.
    const before = await dimensions(page);
    expect(Math.abs(before.top - before.header)).toBeLessThan(1);
    expect(before.about).toBeGreaterThan(before.viewport);
    await expect(page.locator('canvas')).toHaveCount(0);
    bundle.release(); await realWebGL(page);
    const after = await dimensions(page);
    expect(after.hero).toBe(before.hero);
    expect(Math.abs(after.y - before.y)).toBeLessThan(1);
    expect(Math.abs(after.about - before.about)).toBeLessThan(1);
    await settled(page, after.y / (after.hero - after.sticky));
    expect(errors).toEqual([]);
  } finally { bundle.release(); }
});

test('C: rapid scroll and resize during download start at the latest progress', async ({ page }) => {
  const bundle = await hold(page, 'scene.bundle.js');
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    for (const p of [.6, .15, .8, .25]) await scrollToProgress(page, p);
    const viewport = page.viewportSize();
    await page.setViewportSize({ width: viewport.width, height: viewport.height - 80 });
    await scrollToProgress(page, .5);
    bundle.release(); await realWebGL(page); await settled(page, .5);
    await scrollToProgress(page, .85); await settled(page, .85);
    await scrollToProgress(page, 0); await settled(page, 0);
  } finally { bundle.release(); }
});

test('preloaded module is reused when the first scroll happens after download', async ({ page }) => {
  const requests = []; page.on('request', request => { if (request.url().endsWith('scene.bundle.js')) requests.push(request.url()); });
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(requests).toHaveLength(1);
  await expect(page.locator('canvas')).toHaveCount(0);
  await scrollToProgress(page, .5);
  await realWebGL(page); await settled(page, .5);
  expect(requests).toHaveLength(1);
});

test('in-flight initialization survives temporarily leaving the Hero', async ({ page }) => {
  const bundle = await hold(page, 'scene.bundle.js');
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' }); await bundle.started;
    await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    await expect(page.locator('.hero')).not.toBeInViewport();
    await page.waitForTimeout(100);
    bundle.release(); await realWebGL(page); await settled(page, 1);
    await scrollToProgress(page, .5); await settled(page, .5);
    const metrics = await dimensions(page);
    expect(Math.abs(metrics.top - metrics.header)).toBeLessThan(1);
  } finally { bundle.release(); }
});

test('D/E: actual sticky bounds and articulated progress remain reversible', async ({ page }, testInfo) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await scrollToProgress(page, .35); // No WebGL readiness wait before scrolling.
  await realWebGL(page); await settled(page, .35);
  const rotations = new Map();
  for (const progress of [.35, .5, .7, .85, 1, .85, .7, .5, .35, 0]) {
    await scrollToProgress(page, progress); await settled(page, progress);
    if (progress > 0 && progress < 1) {
      const metrics = await dimensions(page);
      expect(Math.abs(metrics.top - metrics.header)).toBeLessThan(1);
    }
    if (progress === 1) await expect(page.locator('#about-title')).toBeInViewport();
    const rotation = Number(await page.locator('.sculpture-stage').getAttribute('data-rotation'));
    if (rotations.has(progress)) expect(rotation).toBeCloseTo(rotations.get(progress), 2);
    else rotations.set(progress, rotation);
    if (progress === .5) await page.screenshot({ path: testInfo.outputPath('sticky-middle.png') });
  }
  expect(Math.abs(rotations.get(.35) - rotations.get(.85))).toBeGreaterThan(.1);
  expect(errors).toEqual([]);
});

test('F: unsupported WebGL releases the runway without repeated initialization', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    window.webglAttempts = 0;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type.startsWith('webgl')) { window.webglAttempts++; return null; }
      return getContext.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await page.evaluate(() => scrollTo({ top: 2, behavior: 'instant' }));
  await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-renderer', 'fallback');
  await expect(page.locator('html')).not.toHaveClass(/story-layout|cinema-active/);
  const metrics = await dimensions(page);
  expect(metrics.hero).toBeLessThan(metrics.viewport * 2);
  for (const top of [100, 300, 0]) await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), top);
  expect(await page.evaluate(() => window.webglAttempts)).toBe(1);
  await page.locator('.hero .scroll-cue').click();
  await expect(page.locator('#about-title')).toBeInViewport();
});

test('failed bundle restores static navigation and releases the full scroll runway', async ({ page }) => {
  const bundle = await hold(page, 'scene.bundle.js', true);
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' }); await bundle.started;
    await scrollToProgress(page, .4);
    bundle.release();
    await expect(page.locator('.sculpture-stage')).toHaveAttribute('data-renderer', 'fallback');
    await expect(page.locator('html')).not.toHaveClass(/story-layout|cinema-active/);
    const metrics = await dimensions(page);
    expect(metrics.hero).toBeLessThan(metrics.viewport * 2);
    await expect(page.locator('.sculpture-fallback')).toHaveCSS('opacity', '1');
  } finally { bundle.release(); }
});

test('pause during loading stays static; resume creates the scene with the correct layout', async ({ page }) => {
  const bundle = await hold(page, 'scene.bundle.js');
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' }); await bundle.started;
    await page.locator('.motion-toggle').click();
    bundle.release(); await page.waitForResponse('**/assets/scene.bundle.js');
    await expect(page.locator('html')).not.toHaveClass(/story-layout|cinema-active/);
    await expect(page.locator('canvas')).toHaveCount(0);
    await page.locator('.motion-toggle').click(); await realWebGL(page);
    await scrollToProgress(page, .5); await settled(page, .5);
  } finally { bundle.release(); }
});

test('data saving keeps a static Hero and never requests the 3D bundle', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true }));
  const requests = []; page.on('request', request => requests.push(request.url()));
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/story-layout|cinema-active/);
  await page.evaluate(() => scrollTo({ top: 300, behavior: 'instant' }));
  expect(requests.some(url => url.endsWith('scene.bundle.js'))).toBe(false);
  expect((await dimensions(page)).hero).toBeLessThan((await dimensions(page)).viewport * 2);
});
