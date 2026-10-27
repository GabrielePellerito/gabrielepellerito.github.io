import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root } from './update.mjs';
const chrome = await launch({ chromePath: process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', chromeFlags: ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-extensions'] });
try {
  await mkdir(resolve(root, 'artifacts'), { recursive: true });
  for (const mode of ['desktop', 'mobile']) {
    const options = { port: chrome.port, output: ['json', 'html'], logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], ...(mode === 'desktop' ? { preset: 'desktop' } : {}) };
    const result = await lighthouse(`http://127.0.0.1:${process.env.PORT || 4175}`, options);
    await writeFile(resolve(root, `artifacts/lighthouse-${mode}.json`), result.report[0]);
    await writeFile(resolve(root, `artifacts/lighthouse-${mode}.html`), result.report[1]);
    console.log(JSON.stringify({ mode, scores: Object.fromEntries(Object.entries(result.lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)])), LCP: result.lhr.audits['largest-contentful-paint'].displayValue, CLS: result.lhr.audits['cumulative-layout-shift'].displayValue, TBT: result.lhr.audits['total-blocking-time'].displayValue }));
  }
} finally { await chrome.kill(); }
