// Six required technical views plus the unmodified public Hero on desktop/mobile.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './update.mjs';
import { mountRobot, setPose } from './robot-harness.mjs';

const output = resolve(process.env.REVIEW_ARTIFACTS || resolve(root, 'artifacts/shovel-correction'));
const url = `http://127.0.0.1:${process.env.PORT || 4174}/`;
await mkdir(output, { recursive: true });
const source = await readFile(resolve(root, 'src/scene.js'), 'utf8');
const marker = 'return { setProgress,';
assert.equal(source.split(marker).length, 2);
const instrumented = `import { renderShovelReview } from '../tests/shovel-debug.mjs';\n` + source.replace(marker, `${marker}
    inspectShovel(view) { return renderShovelReview({ robot, scene, renderer }, view); },`);
const bundle = await build({ stdin: { contents: instrumented, resolveDir: resolve(root, 'src'), loader: 'js' }, bundle: true, write: false, format: 'esm', target: 'es2022' });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
const report = [];
try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({ viewport: { width: mobile ? 375 : 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('requestfailed', r => errors.push(r.url()));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });
    await mountRobot(page, url, { lowPower: mobile });
    assert.equal(await page.locator('html').getAttribute('data-concept'), 'dark-editorial-3d');
    const capture = async (file, metrics, technical = false) => {
      const active = await page.locator('.scene-mount canvas').evaluate(c => { const gl = c.getContext('webgl2'); return Boolean(gl && !gl.isContextLost()); });
      assert.ok(active); assert.deepEqual(errors, []);
      const path = resolve(output, file);
      if (technical) await page.locator('.sculpture-stage').screenshot({ path });
      else {
        const hero = await page.locator('.hero').boundingBox();
        await page.screenshot({ path, fullPage: true, clip: { x: 0, y: 0, width: mobile ? 375 : 1440, height: Math.ceil(hero.y + hero.height) } });
      }
      report.push({ file, webgl: active, metrics, errors: [...errors] }); console.log(path);
    };
    for (const p of mobile ? [0] : [0, .78]) await capture(`hero-${mobile ? 'mobile' : p === 0 ? 'neutral' : 'tilted'}.png`, await setPose(page, p));
    if (!mobile) {
      await page.route('**/assets/scene.bundle.js', route => route.fulfill({ contentType: 'application/javascript', body: bundle.outputFiles[0].text }));
      await page.reload();
      await page.waitForFunction(() => window.__robotQA?.inspectShovel && document.querySelector('.sculpture-stage').dataset.renderer === 'webgl');
      await page.evaluate(() => {
        const stage = document.querySelector('.sculpture-stage');
        Object.assign(stage.style, { position: 'fixed', top: '0', left: '0', right: 'auto', width: '1100px', height: '900px', zIndex: '100', background: '#080808', transform: 'none' });
        document.querySelector('.sculpture-fallback').style.visibility = 'hidden';
        const label = document.createElement('div'); label.id = 'qa-legend';
        Object.assign(label.style, { position: 'absolute', inset: 'auto 24px 24px', color: '#fff', font: '14px/1.8 monospace', whiteSpace: 'pre-line', textTransform: 'none', letterSpacing: '0', zIndex: '200', background: '#080808' });
        stage.append(label);
      });
      await page.waitForTimeout(300);
      for (const [file, view, progress, debug] of [
        ['shovel-right-orthographic.png', 'right', 0, true],
        ['shovel-rear-orthographic.png', 'rear', 0, true],
        ['shovel-top-orthographic.png', 'top', 0, true],
        ['shovel-attachment-closeup.png', 'closeup', 0, true],
        ['shovel-neutral.png', 'closeup', 0, false],
        ['shovel-tilted.png', 'closeup', .78, true],
        ['shovel-left-orthographic.png', 'left', 0, true]
      ]) {
        await setPose(page, progress);
        const metrics = await page.evaluate(({ view, debug }) => window.__robotQA.inspectShovel({ view, debug }), { view, debug });
        assert.ok(Math.abs(metrics.shortEdgeAxisDot) < 1e-7 && metrics.contactGap < 1e-7 && metrics.contactContained);
        assert.ok(metrics.topEdgeGap < 1e-7 && metrics.topEdgeParallel > 1 - 1e-10);
        if (file.includes('orthographic')) {
          assert.equal(metrics.projection, 'orthographic');
          const expected = { right: [-1, 0, 0], rear: [0, 0, 1], top: [0, -1, 0], left: [1, 0, 0] }[view];
          expected.forEach((value, axis) => assert.ok(Math.abs(metrics.cameraDirection[axis] - value) < 1e-12));
        }
        await page.locator('#qa-legend').evaluate((label, { file, metrics }) => {
          label.textContent = `${file} | ${metrics.projection} | progress ${metrics.progress}\n` +
            (metrics.debug ? 'A ciano: lunghezza pala | B ambra: albero servo | C viola: bordo corto\nP magenta: pivot | verde: superficie di fissaggio\n' : '') +
            `dot(C,B) = ${metrics.shortEdgeAxisDot.toExponential(2)} | distacco = ${metrics.contactGap.toExponential(2)} (unità del modello)`;
        }, { file, metrics });
        await capture(file, metrics, true);
      }
    }
    await page.evaluate(() => window.__robotQA.dispose()); await page.close();
  }
  await writeFile(resolve(output, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
} finally { await browser.close(); }
