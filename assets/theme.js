// Before CSS: apply saved preference without a flash. Storage may be blocked.
(() => {
  let saved;
  try { saved = localStorage.getItem('gp-theme'); } catch { /* System preference remains available. */ }
  const dark = saved === 'dark' || (saved !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.classList.add('js');
})();
