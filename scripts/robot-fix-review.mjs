// Local Playwright review. Camera access exists only in the intercepted test bundle.
// Production scene.js, its public API and the page UI remain untouched.
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './update.mjs';
import { mountRobot, setPose } from './robot-harness.mjs';

const output = resolve(process.env.REVIEW_ARTIFACTS || resolve(root, 'artifacts/robot-fix-review'));
const url = `http://127.0.0.1:${process.env.PORT || 4174}/`;
await mkdir(output, { recursive: true });
const source = await readFile(resolve(root, 'src/scene.js'), 'utf8');
const marker = 'return { setProgress,';
if (source.split(marker).length !== 2) throw new Error('Aggiornare il punto di accesso camera nel solo harness.');
const instrumented = source.replace(marker, `${marker}
    inspectCamera(position, target, up = [0, 1, 0]) {
      camera.position.set(...position); camera.up.set(...up);
      camera.lookAt(...target); camera.updateProjectionMatrix(); draw();
    },`);
const bundle = await build({ stdin: { contents: instrumented, resolveDir: resolve(root, 'src'), loader: 'js' }, bundle: true, write: false, format: 'esm', target: 'es2022' });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
const report = [];
try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({ viewport: { width: mobile ? 375 : 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('requestfailed', (r) => errors.push(r.url()));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });
    // Hero screenshots always use the shipped, unmodified scene bundle.
    await mountRobot(page, url, { lowPower: mobile });
    if (await page.locator('html').getAttribute('data-concept') !== 'dark-editorial-3d') throw new Error('La porta non serve il concept Dark.');
    const capture = async (name, diagnostics, stageOnly = false) => {
      const active = await page.locator('.scene-mount canvas').evaluate((c) => {
        const gl = c.getContext('webgl2'); return Boolean(gl && !gl.isContextLost());
      });
      if (!active || errors.length) throw new Error(`WebGL: ${active}; ${errors.join('\n')}`);
      const path = resolve(output, name);
      if (stageOnly) await page.locator('.sculpture-stage').screenshot({ path });
      else {
        const hero = await page.locator('.hero').boundingBox();
        await page.screenshot({ path, fullPage: true, clip: { x: 0, y: 0, width: mobile ? 375 : 1440, height: Math.ceil(hero.y + hero.height) } });
      }
      report.push({ file: name, webgl: active, diagnostics, errors: [...errors] });
      console.log(path);
    };
    for (const progress of mobile ? [0] : [0, .5, 1]) {
      await capture(`hero-dark-${mobile ? 'mobile' : progress * 100}.png`, await setPose(page, progress));
    }
    if (!mobile) {
      await page.route('**/assets/scene.bundle.js', (route) => route.fulfill({ contentType: 'application/javascript', body: bundle.outputFiles[0].text }));
      await page.reload();
      await page.waitForFunction(() => window.__robotQA?.inspectCamera && document.querySelector('.sculpture-stage').dataset.renderer === 'webgl');
      await page.evaluate(() => {
        Object.assign(document.querySelector('.sculpture-stage').style, { position: 'fixed', top: '0', left: '0', right: 'auto', width: '1100px', height: '900px', zIndex: '100', background: '#080808', transform: 'none' });
        document.querySelector('.sculpture-fallback').style.visibility = 'hidden';
      });
      await page.waitForTimeout(300);
      const views = [
        ['closeup-shovel', [.6, 3.55, 4.5], [-.20, 3.08, .60]],
        ['shovel-side', [-3.8, 3.12, .85], [-.20, 3.08, .60]],
        ['shovel-top', [-.2, 6.9, .7], [-.20, 3.08, .60]],
        ['shovel-opening', [-1.5, 3.15, -3.6], [-.20, 3.08, .60]]
      ];
      for (const [name, position, target] of views) {
        const diagnostics = await setPose(page, 0);
        await page.evaluate(({ position, target }) => window.__robotQA.inspectCamera(position, target), { position, target });
        await capture(`hero-dark-${name}.png`, diagnostics, true);
      }
    }
    await page.evaluate(() => window.__robotQA.dispose());
    await page.close();
  }
  await writeFile(resolve(output, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
} finally { await browser.close(); }
