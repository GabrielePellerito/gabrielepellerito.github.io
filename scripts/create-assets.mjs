// Original brand artwork drawn with HTML/SVG, then exported as standard PNG.
// A browser is needed only to regenerate these design assets.
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { escapeHtml as e } from './template.mjs';
import { root } from './update.mjs';
import { resolve } from 'node:path';

const d = JSON.parse(await readFile(resolve(root, 'content/site.json'), 'utf8'));
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#f8f7f3;color:#202923;font-family:'Segoe UI',Arial,sans-serif}.card{width:1200px;height:630px;padding:60px;position:relative;overflow:hidden}.top{display:flex;justify-content:space-between;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:#204c3d}.title{position:absolute;top:170px;left:70px;font-size:100px;letter-spacing:-6px;line-height:1.05}.title em{display:block;font-family:Georgia,serif;font-size:118px;color:#204c3d;font-weight:400;letter-spacing:-7px}.bottom{position:absolute;bottom:58px;left:70px;right:70px;border-top:1px solid #d9dbd2;padding-top:22px;color:#656b63;font-size:15px}.art{position:absolute;right:50px;top:145px;width:360px;height:360px;background:#e4e9df;display:grid;place-items:center;border-radius:50%;color:#204c3d;font:140px Georgia,serif;letter-spacing:-18px}.orbit{position:absolute;width:330px;height:220px;border:1px solid #204c3d55;border-radius:50%;transform:rotate(-40deg)}.orbit.two{transform:rotate(40deg);width:230px;height:365px}</style></head><body><div class="card"><div class="top"><span>${e(d.person.initials)} /</span><span>${e(d.ui.footerText)}</span></div><div class="title">${e(d.person.firstName)}<em>${e(d.person.lastName)}.</em></div><div class="art"><span>${e(d.person.initials)}</span><div class="orbit"></div><div class="orbit two"></div></div><div class="bottom">${e(d.hero.artLabel)}</div></div></body></html>`);
  await page.screenshot({ path: resolve(root, 'assets/social-card.png') });
  const svg = await readFile(resolve(root, 'assets/favicon.svg'), 'utf8');
  for (const [size, name] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png']]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
    await page.screenshot({ path: resolve(root, `assets/${name}`), omitBackground: false });
  }
  console.log('Creati social-card.png (1200×630), favicon-32.png e apple-touch-icon.png.');
} finally { await browser.close(); }
