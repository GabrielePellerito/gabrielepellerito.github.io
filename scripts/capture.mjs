import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './update.mjs';
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
await mkdir(resolve(root, 'artifacts'), { recursive: true });
try {
  for (const [name, width, height, colorScheme] of [['desktop', 1440, 1000, 'light'], ['mobile', 390, 844, 'light'], ['dark', 1440, 1000, 'dark']]) {
    const page = await browser.newPage({ viewport: { width, height }, colorScheme, reducedMotion: 'reduce', deviceScaleFactor: 1 });
    await page.goto('http://127.0.0.1:4173');
    await page.screenshot({ path: resolve(root, `artifacts/${name}.png`), fullPage: true });
    if (name === 'desktop') {
      const metrics = await page.evaluate(() => ({ totalBytes: performance.getEntriesByType('resource').reduce((total, resource) => total + resource.decodedBodySize, 0), requests: performance.getEntriesByType('resource').length, externalRequests: performance.getEntriesByType('resource').filter((r) => new URL(r.name).origin !== location.origin).length }));
      console.log(JSON.stringify(metrics));
    }
    await page.close();
  }
} finally { await browser.close(); }
