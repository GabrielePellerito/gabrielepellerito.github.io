// An explicit system accessibility preference always takes precedence.
(() => {
  const root = document.documentElement;
  let paused = false;
  try { paused = localStorage.getItem('gp-motion') === 'off'; } catch { /* Storage is optional. */ }
  if (paused || matchMedia('(prefers-reduced-motion: reduce)').matches) root.dataset.motion = 'off';
  root.classList.add('js');
  // Reserve the entire sticky timeline before paint, not after the WebGL download.
  // Failed initialization releases it in main.js; accessibility/data saving stay static.
  if (root.dataset.motion !== 'off' && root.dataset.motionEnabled !== 'false' && !navigator.connection?.saveData) root.classList.add('story-layout');
})();
