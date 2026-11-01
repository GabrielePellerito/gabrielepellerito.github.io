(() => {
  const root = document.documentElement;
  const nav = document.querySelector('.site-nav');
  const menu = document.querySelector('.menu-toggle');
  const motionButton = document.querySelector('.motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 800px)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const stage = document.querySelector('.sculpture-stage');
  const hero = document.querySelector('.hero');
  const sticky = hero.querySelector('.hero-sticky');
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  // Layout is reserved by theme.js before the first paint, independently of WebGL.
  let cinema = root.classList.contains('story-layout');
  const enabledInContent = root.dataset.motionEnabled !== 'false';
  let userPaused = false;
  try { userPaused = localStorage.getItem('gp-motion') === 'off'; } catch { /* No persistence required. */ }
  let scene, frame = 0, active = true, current = 0, target = 0, start = 0, range = 1, loading = false;
  let preload, sceneRequested = scrollY > 0 || new URLSearchParams(location.search).has('render3d');
  let preloadReady = false;
  let sceneAvailable = false, failed = false;
  let tiltTarget = null, tiltX = 0, tiltY = 0, tiltFrame = 0;
  const moving = () => enabledInContent && !userPaused && !reduced.matches;
  const canPrepare = () => moving() && !navigator.connection?.saveData && !failed && (!scene || sceneAvailable);
  stage.addEventListener('scene-availability', event => {
    sceneAvailable = Boolean(event.detail);
    setCinema(canPrepare());
    if (sceneAvailable) { measure(); current = target; requestFrame(); }
  });

  function updateMotion() {
    root.dataset.motion = moving() ? 'on' : 'off';
    motionButton.setAttribute('aria-pressed', String(!moving()));
    motionButton.setAttribute('aria-label', moving() ? motionButton.dataset.pause : motionButton.dataset.resume);
    motionButton.disabled = reduced.matches || !enabledInContent;
    if (!moving()) { cancelAnimationFrame(frame); frame = 0; root.classList.remove('motion-ready'); scene?.setProgress(0); setCinema(false); resetTilt(); }
    else { root.classList.add('motion-ready'); setCinema(canPrepare()); loadScene(); requestFrame(); }
  }
  // Fixed labels are supplied by the content generator, rather than inferred from style.
  motionButton.dataset.pause = motionButton.getAttribute('aria-label');
  motionButton.dataset.resume ||= 'Riprendi animazioni';
  motionButton.hidden = false;
  motionButton.addEventListener('click', () => {
    userPaused = !userPaused;
    if (!userPaused) { sceneRequested = true; if (!scene) failed = false; }
    try { localStorage.setItem('gp-motion', userPaused ? 'off' : 'on'); } catch { /* Optional. */ }
    updateMotion();
  });
  reduced.addEventListener('change', updateMotion);

  function closeMenu(focus = false) { menu.setAttribute('aria-expanded', 'false'); root.classList.remove('menu-open'); if (focus) menu.focus(); }
  menu.hidden = false;
  menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); root.classList.toggle('menu-open', open); });
  nav.addEventListener('click', (event) => {
    const anchor = event.target.closest('a'); if (!anchor) return;
    closeMenu();
    if (mobile.matches) { const section = document.querySelector(anchor.hash); section?.setAttribute('tabindex', '-1'); section?.focus({ preventScroll: true }); }
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && root.classList.contains('menu-open')) closeMenu(true); });
  document.addEventListener('click', (event) => { if (!event.target.closest('.header-actions')) closeMenu(); });
  document.addEventListener('focusin', (event) => { if (!event.target.closest('.header-actions')) closeMenu(); });
  mobile.addEventListener('change', () => closeMenu());

  // Layout reads happen at resize, never inside the animation loop.
  function setCinema(enabled) {
    const changed = cinema !== enabled;
    const before = changed ? document.querySelector('#chi-sono').getBoundingClientRect().top : 0;
    cinema = enabled;
    root.classList.toggle('story-layout', enabled);
    root.classList.toggle('cinema-active', enabled && sceneAvailable);
    if (!changed) return; // Successful loading does not change any layout dimensions.
    measure();
    // Preserve an already reached section when pause/reduced-motion changes layout.
    if (before < innerHeight * .6) { const after = document.querySelector('#chi-sono').getBoundingClientRect().top; scrollBy({ top: after - before, behavior: 'instant' }); }
    if (enabled && location.hash && location.hash !== '#inizio') document.querySelector(location.hash)?.scrollIntoView({ behavior: 'instant' });
    if (!enabled) { hero.style.removeProperty('--story-progress'); hero.style.removeProperty('--story-title'); hero.style.removeProperty('--story-wash'); hero.style.removeProperty('--story-dissolve'); }
  }
  function measure() { start = hero.getBoundingClientRect().top + scrollY - document.querySelector('.site-header').offsetHeight; range = Math.max(1, hero.offsetHeight - sticky.offsetHeight); onScroll(); }
  function onScroll() {
    target = Math.min(1, Math.max(0, (scrollY - start) / range));
    if (scrollY > 0) sceneRequested = true;
    loadScene(); requestFrame();
  }
  function requestFrame() { if (!frame && cinema && sceneAvailable && moving() && active && !document.hidden) frame = requestAnimationFrame(tick); }
  function tick() {
    frame = 0;
    if (!cinema || !sceneAvailable || !moving() || !active || document.hidden) return;
    current += (target - current) * .11;
    if (Math.abs(target - current) < .0004) current = target;
    scene?.setProgress(current);
    if (cinema) {
      const smooth = (a, b) => { const p = Math.min(1, Math.max(0, (current - a) / (b - a))); return p * p * (3 - 2 * p); };
      hero.style.setProperty('--story-progress', current);
      hero.style.setProperty('--story-title', 1 - smooth(.18, .33));
      hero.style.setProperty('--story-wash', smooth(.88, .95) * (1 - smooth(.95, 1)) * .6);
      hero.style.setProperty('--story-dissolve', smooth(.94, 1));
      const phase = current < .15 ? 0 : current < .35 ? 1 : current < .55 ? 2 : current < .72 ? 3 : current < .88 ? 4 : 5;
      chapters.forEach((chapter, i) => { chapter.hidden = i !== phase; });
    }
    if (scene) stage.dataset.progress = current.toFixed(4);
    if (current !== target) requestFrame();
  }
  async function loadScene() {
    if (loading || scene || !canPrepare() || document.hidden) return;
    if (!preload && !active) return;
    if (!sceneRequested) {
      if (!preloadReady) return;
      if (!preload) {
        // Warm the browser's module cache at low network priority, after HTML/CSS
        // and the fallback image. No module evaluation or GPU work on first paint.
        preload = document.createElement('link');
        preload.rel = 'modulepreload'; preload.href = './assets/scene.bundle.js'; preload.fetchPriority = 'low';
        preload.addEventListener('error', () => { if (!scene) useFallback(); }, { once: true });
        document.head.append(preload);
      }
      return;
    }
    loading = true;
    try {
      const module = await import('./scene.bundle.js');
      // Finish an in-flight request even if a fast scroll has left the Hero.
      // Pausing/hiding the page defers creation; import() stays cached for resuming.
      if (!sceneRequested || !moving() || document.hidden) return;
      scene = module.createScene(stage.querySelector('.scene-mount'), { lowPower: innerWidth < 700 || (navigator.hardwareConcurrency || 8) <= 4 });
      if (scene) {
        sceneAvailable = true; measure(); current = target; scene.setProgress(current);
        stage.classList.add('scene-ready'); stage.dataset.renderer = 'webgl'; stage.dataset.progress = current.toFixed(4);
        setCinema(true); requestFrame();
      } else useFallback();
    } catch { useFallback(); }
    finally { loading = false; }
  }
  function useFallback() {
    failed = true; sceneAvailable = false;
    cancelAnimationFrame(frame); frame = 0;
    stage.classList.remove('scene-ready'); stage.dataset.renderer = 'fallback';
    setCinema(false);
  }
  const heroObserver = new IntersectionObserver(([entry]) => { active = entry.isIntersecting; if (active) { loadScene(); requestFrame(); } else { cancelAnimationFrame(frame); frame = 0; } }, { rootMargin: '120px' });
  heroObserver.observe(hero);
  const revealObserver = new IntersectionObserver((entries) => { for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); } }, { threshold: .08 });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
  const links = [...nav.querySelectorAll('a')];
  const sectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) links.forEach((link) => { if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  }, { rootMargin: '-12% 0px -55% 0px', threshold: 0 });
  document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', measure, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else { loadScene(); requestFrame(); } });

  function resetTilt() { if (tiltTarget) tiltTarget.style.removeProperty('transform'); tiltTarget = null; cancelAnimationFrame(tiltFrame); tiltFrame = 0; }
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    let rect;
    card.addEventListener('pointerenter', () => { if (moving() && finePointer.matches) rect = card.getBoundingClientRect(); });
    card.addEventListener('pointermove', (event) => {
      if (!moving() || !finePointer.matches || !rect) return;
      tiltTarget = card; tiltX = ((event.clientX - rect.left) / rect.width - .5) * 5; tiltY = ((event.clientY - rect.top) / rect.height - .5) * -5;
      if (!tiltFrame) tiltFrame = requestAnimationFrame(() => { tiltFrame = 0; card.style.transform = `perspective(1100px) rotateX(${tiltY}deg) rotateY(${tiltX}deg) translateZ(4px)`; });
    });
    card.addEventListener('pointerleave', resetTilt);
    card.addEventListener('focusin', resetTilt);
  });
  const copy = document.querySelector('.copy-button');
  if (copy && navigator.clipboard && isSecureContext) { copy.hidden = false; copy.addEventListener('click', async () => { const status = document.querySelector('.copy-status'); try { await navigator.clipboard.writeText(copy.dataset.email); status.textContent = copy.dataset.copied; } catch { status.textContent = copy.dataset.error; } }); }
  addEventListener('pagehide', () => { cancelAnimationFrame(frame); frame = 0; resetTilt(); scene?.dispose(); scene = null; sceneAvailable = false; stage.classList.remove('scene-ready'); }, { passive: true });
  addEventListener('pageshow', (event) => { if (event.persisted) { measure(); loadScene(); } });
  // Prioritize the initial document, CSS and fallback paint. A first scroll bypasses
  // this warmup gate immediately; only background preloading waits for first paint.
  const prepareScene = () => requestAnimationFrame(() => requestAnimationFrame(() => { preloadReady = true; loadScene(); }));
  if (document.readyState === 'complete') prepareScene();
  else addEventListener('load', prepareScene, { once: true });
  measure(); updateMotion();
})();
