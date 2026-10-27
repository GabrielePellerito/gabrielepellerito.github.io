(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  function updateTheme(dark) {
    root.dataset.theme = dark ? 'dark' : 'light';
    themeButton.setAttribute('aria-label', dark ? 'Attiva la modalità chiara' : 'Attiva la modalità scura');
    themeMeta.setAttribute('content', dark ? '#141c18' : '#f8f7f3');
  }
  themeButton.hidden = false;
  updateTheme(root.dataset.theme === 'dark');
  themeButton.addEventListener('click', () => {
    updateTheme(root.dataset.theme !== 'dark');
    try { localStorage.setItem('gp-theme', root.dataset.theme); } catch { /* Preference applies to this page. */ }
  });
  systemTheme.addEventListener('change', (event) => {
    let saved;
    try { saved = localStorage.getItem('gp-theme'); } catch { /* Use system preference. */ }
    if (!saved) updateTheme(event.matches);
  });

  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  const mobile = matchMedia('(max-width: 800px)');
  menuButton.hidden = false;
  function closeMenu({ focus = false } = {}) {
    menuButton.setAttribute('aria-expanded', 'false');
    root.classList.remove('menu-open');
    if (focus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    root.classList.toggle('menu-open', open);
  });
  nav.addEventListener('click', (event) => {
    const anchor = event.target.closest('a');
    if (!anchor) return;
    closeMenu();
    if (mobile.matches) {
      const target = document.querySelector(anchor.hash);
      target?.setAttribute('tabindex', '-1');
      target?.focus({ preventScroll: true });
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('menu-open')) closeMenu({ focus: true });
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.header-actions')) closeMenu();
  });
  mobile.addEventListener('change', () => closeMenu());
  document.addEventListener('focusin', (event) => {
    if (!event.target.closest('.header-actions')) closeMenu();
  });

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      }
    }, { threshold: 0.08 });
    if (!reducedMotion.matches) root.classList.add('motion-ready');
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
    reducedMotion.addEventListener('change', (event) => {
      if (event.matches) root.classList.remove('motion-ready');
    });
    const navLinks = [...nav.querySelectorAll('a')];
    const sectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        navLinks.forEach((a) => {
          if (a.hash === `#${entry.target.id}`) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      }
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));
  }

  const copy = document.querySelector('.copy-button');
  if (copy && navigator.clipboard && window.isSecureContext) {
    copy.hidden = false;
    copy.addEventListener('click', async () => {
      const status = document.querySelector('.copy-status');
      try { await navigator.clipboard.writeText(copy.dataset.email); status.textContent = copy.dataset.copied; }
      catch { status.textContent = copy.dataset.error; }
    });
  }
})();
