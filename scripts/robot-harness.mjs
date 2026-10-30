// Playwright-only harness. Imported by QA scripts, never by the public page.
// Instrument the controller ONLY in this browser context; the real navbar stays active.
export async function mountRobot(page, url, { lowPower = false } = {}) {
  await page.route('**/assets/main.js', async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    const body = source.replace('scene = module.createScene(', 'scene = window.__robotQA = module.createScene(')
      .replace('scene?.setProgress(current);', 'if (!window.__robotManual) scene?.setProgress(current);')
      .replace('lowPower: innerWidth < 700 || (navigator.hardwareConcurrency || 8) <= 4', `lowPower: ${lowPower}`);
    if (body === source) throw new Error('Controller cambiato: aggiornare il solo harness QA.');
    await route.fulfill({ response, body });
  });
  const response = await page.goto(url + '?render3d=1');
  if (response.status() !== 200) throw new Error(`Anteprima non disponibile: ${url}`);
  await page.waitForFunction(() => window.__robotQA && document.querySelector('.sculpture-stage').dataset.renderer === 'webgl');
  await page.locator('.scene-mount').evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.sculpture-fallback')).opacity === '0');
}

export async function setPose(page, progress) {
  return page.evaluate(async (progress) => {
    window.__robotManual = true;
    window.__robotQA.setProgress(progress);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const gl = document.querySelector('.scene-mount canvas').getContext('webgl2');
    if (!gl || gl.isContextLost() || window.__robotQA.diagnostics.lost) throw new Error('Il canvas WebGL non è attivo.');
    return window.__robotQA.diagnostics;
  }, progress);
}
