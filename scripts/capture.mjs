import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { root } from './update.mjs';
import { resolve } from 'node:path';
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
await mkdir(resolve(root, 'artifacts'), { recursive: true });
try {
  for (const [name, width, height] of [['desktop', 1440, 1000], ['mobile', 375, 812]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${process.env.PORT || 4174}/?render3d=1`);
    await page.waitForSelector('.scene-ready', { timeout: 30000 });
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.sculpture-fallback')).opacity === '0');
    // Freeze scroll reveals, keeping the loaded sculpture visible for full-page capture.
    await page.evaluate(() => { document.documentElement.classList.remove('motion-ready'); document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible')); });
    await page.screenshot({ path: resolve(root, `artifacts/${name}.png`) });
    await page.screenshot({ path: resolve(root, `artifacts/${name}-full.png`), fullPage: true });
    console.log(`Screenshot ${name} salvati in artifacts/.`);
    await page.close();
  }
} finally { await browser.close(); }
