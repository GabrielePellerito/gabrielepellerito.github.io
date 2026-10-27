// An explicit system accessibility preference always takes precedence.
(() => {
  const root = document.documentElement;
  let paused = false;
  try { paused = localStorage.getItem('gp-motion') === 'off'; } catch { /* Storage is optional. */ }
  if (paused || matchMedia('(prefers-reduced-motion: reduce)').matches) root.dataset.motion = 'off';
  root.classList.add('js');
})();
