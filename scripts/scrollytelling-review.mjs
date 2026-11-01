// QA only: real native scrolling, production WebGL bundle, no simulated frames.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './update.mjs';
import { mountRobot } from './robot-harness.mjs';
const output = resolve(root, 'artifacts/scrollytelling-review'); await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
const report = [];
const poses = [[0, '00-hero'], [.15, '15-preparazione'], [.35, '35-contatto'], [.5, '50-scavo'], [.7, '70-voragine'], [.85, '85-aura'], [1, '100-transizione']];
const videoEnabled = process.argv.includes('--video');
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: { width: mobile ? 375 : 1440, height: mobile ? 812 : 1000 }, deviceScaleFactor: 1, reducedMotion: 'no-preference', ...(videoEnabled && !mobile ? { recordVideo: { dir: output, size: { width: 1440, height: 1000 } } } : {}) });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('requestfailed', r => errors.push(r.url())); page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });
    await mountRobot(page, `http://127.0.0.1:${process.env.PORT || 4174}/`, { lowPower: mobile });
    const scroll = async p => {
      await page.evaluate(p => {
        const hero = document.querySelector('.hero'), sticky = document.querySelector('.hero-sticky');
        const start = hero.getBoundingClientRect().top + scrollY - document.querySelector('.site-header').offsetHeight;
        scrollTo({ top: start + (hero.offsetHeight - sticky.offsetHeight) * p, behavior: 'instant' });
      }, p);
    };
    for (const [p, name] of mobile ? poses.filter(([p]) => [0, .35, .85, 1].includes(p)) : poses) {
      await scroll(p);
      await page.waitForFunction(p => Math.abs(window.__robotQA.progress - p) < .0008, p);
      await page.waitForTimeout(150);
      const state = await page.evaluate(() => window.__robotQA.diagnostics);
      const live = await page.locator('canvas').evaluate(c => { const gl = c.getContext('webgl2'); return gl && !gl.isContextLost(); }); assert.ok(live);
      const file = `scroll-${mobile ? 'mobile-' : ''}${name}.png`; await page.screenshot({ path: resolve(output, file) });
      report.push({ file, state, errors: [...errors] }); console.log(file, 'WebGL', state.calls, 'calls', state.triangles, 'triangles');
    }
    if (videoEnabled && !mobile) {
      for (const direction of [-1, 1]) for (let i = 0; i <= 120; i++) { await scroll(direction < 0 ? 1 - i / 120 : i / 120); await page.waitForTimeout(50); }
    }
    await scroll(0); await page.waitForFunction(() => window.__robotQA.progress === 0);
    const reverse = await page.evaluate(() => window.__robotQA.diagnostics);
    assert.deepEqual(reverse.tip, report.find(r => r.file === (mobile ? 'scroll-mobile-00-hero.png' : 'scroll-00-hero.png')).state.tip);
    assert.deepEqual(errors, []);
    const video = page.video(); await context.close(); if (video) await video.saveAs(resolve(output, 'scrollytelling-desktop.webm'));
  }
} finally { await browser.close(); }
await writeFile(resolve(output, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
