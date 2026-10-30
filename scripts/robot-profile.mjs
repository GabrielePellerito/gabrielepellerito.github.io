// A local frame-cadence sample of the real articulated WebGL path (not field INP).
import { chromium } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './update.mjs';
import { mountRobot, setPose } from './robot-harness.mjs';
const data = JSON.parse(await readFile(resolve(root, 'content/site.json'), 'utf8'));
const url = `http://127.0.0.1:${process.env.PORT || (data.design.scheme === 'dark' ? 4174 : 4175)}/`;
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
const report = [];
try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({ viewport: { width: mobile ? 375 : 1440, height: mobile ? 812 : 1000 }, deviceScaleFactor: mobile ? 2.625 : 1, reducedMotion: 'no-preference' });
    await mountRobot(page, url, { lowPower: mobile }); await setPose(page, 0);
    const result = await page.evaluate(async () => {
      const frames = []; let previous;
      for (let i = 0; i <= 120; i++) {
        const now = await new Promise(requestAnimationFrame);
        if (previous && i > 10) frames.push(now - previous);
        previous = now;
        window.__robotQA.setProgress(i <= 60 ? i / 60 : (120 - i) / 60);
      }
      const state = window.__robotQA.diagnostics;
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (state.renderCount !== window.__robotQA.diagnostics.renderCount) throw new Error('Rendering a riposo non previsto');
      frames.sort((a, b) => a - b);
      window.__robotQA.dispose();
      const released = window.__robotQA.diagnostics;
      return { medianFrameMs: Number(frames[Math.floor(frames.length / 2)].toFixed(2)), p95FrameMs: Number(frames[Math.floor(frames.length * .95)].toFixed(2)), triangles: state.triangles, drawCalls: state.calls, dpr: state.pixelRatio, framesAtRest: 0, remainingGeometryCounter: released.geometries, remainingTextureCounter: released.textures, contextReleased: released.contextLost, canvasRemoved: !document.querySelector('.scene-mount canvas') };
    });
    report.push({ mode: mobile ? 'mobile' : 'desktop', ...result });
    await page.close();
  }
  await mkdir(resolve(root, 'artifacts'), { recursive: true });
  await writeFile(resolve(root, 'artifacts/robot-performance.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
