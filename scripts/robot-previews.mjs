import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './update.mjs';
import { mountRobot, setPose } from './robot-harness.mjs';

const data = JSON.parse(await readFile(resolve(root, 'content/site.json'), 'utf8'));
const all = process.argv.includes('--all');
const output = resolve(process.env.PREVIEW_ARTIFACTS || resolve(root, 'artifacts/robot-previews'));
await mkdir(output, { recursive: true });
const targets = all ? [{ name: 'main', port: 4173 }, { name: 'dark', port: 4174 }, { name: 'light', port: 4175 }] : [{ name: data.design.scheme, port: process.env.PORT || (data.design.scheme === 'dark' ? 4174 : 4175) }];
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
const report = [];
try {
  for (const target of targets) {
    for (const mobile of target.name === 'main' ? [false] : [false, true]) {
      const page = await browser.newPage({ viewport: { width: mobile ? 375 : 1440, height: mobile ? 1000 : 1000 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('requestfailed', (r) => errors.push(r.url()));
      page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });
      const url = `http://127.0.0.1:${target.port}/`;
      if (target.name === 'main') {
        await page.goto(url + '?render3d=1'); await page.waitForSelector('.scene-ready canvas');
        await page.waitForFunction(() => getComputedStyle(document.querySelector('.sculpture-fallback')).opacity === '0');
      } else await mountRobot(page, url, { lowPower: mobile });
      const concept = await page.locator('html').getAttribute('data-concept');
      if (concept !== (target.name === 'light' ? 'light-minimal-3d' : 'dark-editorial-3d')) throw new Error(`Concept errato sulla porta ${target.port}`);
      for (const progress of target.name === 'main' || mobile ? [0] : [0, .5, 1]) {
        const diagnostics = target.name === 'main' ? null : await setPose(page, progress);
        const active = await page.locator('.scene-mount canvas').evaluate((c) => { const gl = c.getContext('webgl2'); return Boolean(gl && !gl.isContextLost()); });
        if (!active) throw new Error('Screenshot interrotto: WebGL non attivo.');
        const name = target.name === 'main' ? 'hero-main.png' : `hero-${target.name}-${mobile ? 'mobile' : Math.round(progress * 100)}.png`;
        const hero = await page.locator('.hero').boundingBox();
        await page.screenshot({ path: resolve(output, name), fullPage: true, clip: { x: 0, y: 0, width: mobile ? 375 : 1440, height: Math.ceil(hero.y + hero.height) } });
        report.push({ file: name, url, concept, webgl: active, diagnostics, errors: [...errors] });
        if (errors.length) throw new Error(errors.join('\n'));
        console.log(resolve(output, name));
      }
      if (target.name !== 'main') await page.evaluate(() => window.__robotQA.dispose());
      await page.close();
    }
  }
  await writeFile(resolve(output, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
} finally { await browser.close(); }
