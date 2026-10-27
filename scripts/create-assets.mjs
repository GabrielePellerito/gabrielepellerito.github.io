// Capture the actual procedural WebGL sculpture as its no-JS/WebGL fallback.
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { root } from './update.mjs';
import { escapeHtml as e } from './html.mjs';
import { resolve } from 'node:path';
const d = JSON.parse(await readFile(resolve(root, 'content/site.json'), 'utf8'));
const base = `http://127.0.0.1:${process.env.PORT || 4175}`;
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge' });
try {
  if (!process.argv.includes('--social-only')) {
  const scenePage = await browser.newPage({ viewport: { width: 1100, height: 1100 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  await scenePage.goto(base + '/?render3d=1');
  await scenePage.waitForSelector('.scene-ready canvas', { timeout: 30000 });
  await scenePage.evaluate(() => {
    const stage = document.querySelector('.sculpture-stage');
    Object.assign(stage.style, { position: 'fixed', top: '0', left: '0', right: 'auto', width: '1000px', height: '1000px', zIndex: '100', background: getComputedStyle(document.body).backgroundColor });
    document.querySelector('.sculpture-fallback').style.visibility = 'hidden';
  });
  await scenePage.waitForTimeout(500);
  await scenePage.locator('.sculpture-stage').screenshot({ path: resolve(root, 'assets/sculpture.png') });
  const png = await readFile(resolve(root, 'assets/sculpture.png'));
  const webp = await scenePage.evaluate(async (data) => {
    const image = new Image(); image.src = data; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 1000;
    canvas.getContext('2d').drawImage(image, 0, 0);
    return canvas.toDataURL('image/webp', .9).split(',')[1];
  }, base + '/assets/sculpture.png?capture=1');
  await writeFile(resolve(root, 'assets/sculpture.webp'), Buffer.from(webp, 'base64'));
  await scenePage.close();
  }
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const image = `data:image/png;base64,${(await readFile(resolve(root, 'assets/sculpture.png'))).toString('base64')}`;
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:${d.design.background};color:${d.design.foreground};font-family:Arial,sans-serif}.card{position:relative;width:1200px;height:630px;padding:44px 55px;overflow:hidden}.top{display:flex;justify-content:space-between;position:relative;z-index:2;font:12px 'Courier New';letter-spacing:2px;text-transform:uppercase}.sculpture{position:absolute;left:45px;top:160px;width:490px;height:490px;object-fit:contain}.title{position:absolute;z-index:2;left:55px;top:105px;font-size:96px;letter-spacing:-5px;line-height:1.05}.title span{display:inline;font-family:Georgia,serif;font-style:italic;color:${d.design.foreground}}.bottom{position:absolute;left:650px;right:70px;bottom:155px;border-top:1px solid #aaa;padding-top:25px;font:11px 'Courier New';letter-spacing:1px}</style></head><body><div class="card"><div class="top"><span>${e(d.person.initials)}.</span><span>${e(d.ui.footerText)}</span></div><img class="sculpture" src="${image}"><div class="title">${e(d.person.firstName)} <span>${e(d.person.lastName)}.</span></div><div class="bottom">${e(d.hero.artLabel)}</div></div></body></html>`);
  await page.locator('img').evaluate((img) => img.decode());
  await page.screenshot({ path: resolve(root, 'assets/social-card.png') });
  const svg = await readFile(resolve(root, 'assets/favicon.svg'), 'utf8');
  for (const [size, file] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png']]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>body{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
    await page.screenshot({ path: resolve(root, `assets/${file}`) });
  }
  console.log(process.argv.includes('--social-only') ? 'Aggiornati social card e icone; prerender 3D preservati.' : 'Generati fallback 3D, social card e icone coerenti con il concept.');
} finally { await browser.close(); }
