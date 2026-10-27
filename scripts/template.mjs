// HTML is generated locally. GitHub Pages serves the result without a build.
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const e = escapeHtml;
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const diagonal = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';
const label = (section) => `<p class="section-label"><span>${e(section.number)}</span> ${e(section.label)}</p>`;
const badge = (data, text) => `<span class="placeholder-badge">${e(text || data.ui.placeholderLabel)}</span>`;
const link = (url, text, className = '') => `<a class="${className}" href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(text)}${diagonal}<span class="sr-only"> (nuova scheda)</span></a>`;

export function renderSite(d) {
  const copyrightYear = new Date().getUTCFullYear();
  const base = d.seo.url;
  const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ProfilePage', url: base, name: d.seo.title, inLanguage: d.seo.language, mainEntity: { '@type': 'Person', name: d.person.name, url: base, ...(d.contact.socials.length ? { sameAs: d.contact.socials.map((s) => s.url) } : {}) } }).replace(/</g, '\\u003c');
  return `<!doctype html>
<!-- Generato da content/site.json. Per aggiornare: node scripts/update.mjs -->
<html lang="${e(d.seo.language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' __SCHEMA_HASH__; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; upgrade-insecure-requests">
  <title>${e(d.seo.title)}</title>
  <meta name="description" content="${e(d.seo.description)}">
  <meta name="author" content="${e(d.person.name)}">
  <meta name="robots" content="${d.seo.indexing ? 'index, follow' : 'noindex, nofollow'}">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#f8f7f3">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <link rel="canonical" href="${e(base)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${e(d.seo.locale)}">
  <meta property="og:site_name" content="${e(d.person.name)}">
  <meta property="og:title" content="${e(d.seo.title)}">
  <meta property="og:description" content="${e(d.seo.description)}">
  <meta property="og:url" content="${e(base)}">
  <meta property="og:image" content="${e(base)}assets/social-card.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${e(d.person.name)} — ${e(d.ui.footerText)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${e(d.seo.title)}">
  <meta name="twitter:description" content="${e(d.seo.description)}">
  <meta name="twitter:image" content="${e(base)}assets/social-card.png">
  <link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="./assets/favicon-32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="./assets/apple-touch-icon.png">
  <script src="./assets/theme.js"></script>
  <link rel="stylesheet" href="./assets/style.css">
  <script type="application/ld+json">${schema}</script>
  <script src="./assets/main.js" defer></script>
</head>
<body id="inizio">
  <a class="skip-link" href="#contenuto">${e(d.ui.skipLink)}</a>
  <header class="site-header">
    <div class="container header-inner">
      <a class="wordmark" href="#inizio"><span class="brand-mark">${e(d.person.initials)}<span>.</span></span><span class="brand-name">${e(d.person.name)}</span></a>
      <div class="header-actions">
        <nav class="site-nav" id="navigazione" aria-label="Principale">${d.navigation.map((n) => `<a href="#${e(n.id)}">${e(n.label)}</a>`).join('')}<a class="nav-contact" href="#contatti">${e(d.ui.contactLabel)} ${diagonal}</a></nav>
        <button class="theme-toggle" type="button" aria-label="${e(d.ui.themeLabel)}" hidden><svg class="icon-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"/></svg><svg class="icon-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg></button>
        <button class="menu-toggle" type="button" aria-label="${e(d.ui.menuLabel)}" aria-expanded="false" aria-controls="navigazione" hidden><span></span><span></span></button>
      </div>
    </div>
  </header>
  <main id="contenuto" tabindex="-1">
    <section class="hero container" aria-labelledby="hero-title">
      <div class="hero-main">
        <div class="hero-copy">
          <p class="eyebrow"><span class="small-dot" aria-hidden="true"></span>${e(d.hero.eyebrow)}</p>
          <h1 id="hero-title"><span class="greeting">${e(d.hero.greeting)}</span> <span>${e(d.person.firstName)}</span> <em>${e(d.person.lastName)}<span class="name-dot">.</span></em></h1>
          <p class="hero-intro">${e(d.hero.intro)}</p>
          <div class="hero-buttons"><a class="button button-primary" href="#${e(d.hero.primaryTarget)}">${e(d.hero.primaryLabel)}${arrow}</a><a class="text-link" href="#${e(d.hero.secondaryTarget)}">${e(d.hero.secondaryLabel)}${diagonal}</a></div>
        </div>
        <div class="identity-art" aria-hidden="true">
          <div class="art-topline"><span>${e(d.person.initials)} /</span><span>${e(d.ui.footerText)}</span></div>
          <div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div><div class="art-orbit orbit-three"></div>
          <div class="art-monogram">${e(d.person.firstName[0])}<i>${e(d.person.lastName[0])}</i><span>✳</span></div>
          <div class="art-bottomline"><span>${e(d.hero.artLabel)}</span><span>${e(d.hero.artCaption)}</span></div>
          <span class="art-corner corner-one"></span><span class="art-corner corner-two"></span>
        </div>
      </div>
      <div class="hero-bottom"><span>${e(d.hero.bottomLabel)}</span><a href="#chi-sono">${e(d.hero.scrollLabel)}<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6"/></svg></a></div>
    </section>
    <section class="section container about" id="chi-sono" aria-labelledby="about-title">
      <div class="section-heading reveal">${label(d.about)}<h2 id="about-title">${e(d.about.title)}</h2></div>
      <div class="about-body reveal"><div class="about-text">${d.about.placeholder ? badge(d) : ''}<h3>${e(d.about.intro)}</h3>${d.about.paragraphs.map((p) => `<p>${e(p)}</p>`).join('')}</div><aside class="personal-note"><span class="note-star" aria-hidden="true">✳</span><p class="eyebrow">${e(d.about.noteLabel)}</p><p>${e(d.about.note)}</p><span class="note-signature" aria-hidden="true">${e(d.person.firstName)}</span></aside></div>
    </section>
    <section class="journey-band" id="percorso" aria-labelledby="journey-title"><div class="section container split-section">
      <div class="section-heading reveal">${label(d.journey)}<h2 id="journey-title">${e(d.journey.title)}</h2><p class="section-intro">${e(d.journey.intro)}</p></div>
      <ol class="timeline">${d.journey.items.map((item) => `<li class="timeline-item reveal"><div class="timeline-meta"><span>${e(item.period)}</span><span>${e(item.category)}</span></div><h3>${e(item.title)}</h3><p class="organization">${e(item.organization)}</p><p>${e(item.description)}</p>${item.placeholder ? badge(d) : ''}</li>`).join('')}</ol>
    </div></section>
    <section class="section container" id="competenze" aria-labelledby="skills-title"><div class="section-heading skills-heading reveal">${label(d.skills)}<h2 id="skills-title">${e(d.skills.title)}</h2><p class="section-intro">${e(d.skills.intro)}</p></div><div class="skills-grid">${d.skills.groups.map((group, index) => `<article class="skill-group reveal"><div class="skill-header"><span class="skill-symbol" aria-hidden="true">${index % 2 === 0 ? '↗' : '✳'}</span>${group.placeholder ? badge(d) : ''}</div><h3>${e(group.title)}</h3><p>${e(group.description)}</p><ul class="tags">${group.items.map((item) => `<li>${e(item)}</li>`).join('')}</ul></article>`).join('')}</div></section>
    <section class="section container projects" id="progetti" aria-labelledby="projects-title"><div class="projects-heading reveal"><div class="section-heading">${label(d.projects)}<h2 id="projects-title">${e(d.projects.title)}</h2></div><p class="section-intro">${e(d.projects.intro)}</p></div><div class="project-grid">${d.projects.items.map((item, index) => `<article class="project-card reveal"><div class="project-art project-art-${index % 2}" aria-hidden="true"><span class="project-index">${String(index + 1).padStart(2, '0')} /</span><div class="project-shape"></div><span class="project-art-caption">${e(item.placeholder ? d.ui.projectPlaceholderLabel : item.category)}</span></div><div class="project-info"><div class="project-category">${e(item.category)}${item.placeholder ? badge(d) : ''}</div><h3>${e(item.title)}</h3><p>${e(item.description)}</p><ul class="tags">${item.tags.map((t) => `<li>${e(t)}</li>`).join('')}</ul>${item.url && !item.placeholder ? link(item.url, d.ui.projectLinkLabel, 'text-link project-link') : ''}</div></article>`).join('')}</div></section>
    <section class="contact-section" id="contatti" aria-labelledby="contact-title"><div class="container contact-inner reveal"><div>${label(d.contact)}<h2 id="contact-title">${e(d.contact.title)}</h2><p class="contact-intro">${e(d.contact.intro)}</p></div><div class="contact-actions">${d.contact.email ? `<a class="button button-light" href="mailto:${e(d.contact.email)}">${e(d.contact.emailLabel)}${diagonal}</a><div class="email-line"><span>${e(d.contact.email)}</span><button class="copy-button" type="button" data-email="${e(d.contact.email)}" data-copied="${e(d.contact.copiedLabel)}" data-error="${e(d.contact.copyErrorLabel)}" hidden>${e(d.contact.copyLabel)}</button></div><p class="copy-status sr-only" role="status"></p>` : `<div class="contact-placeholder"><span class="contact-placeholder-dot" aria-hidden="true"></span><p>${e(d.contact.emptyLabel)}</p><span>${e(d.contact.emptyText)}</span></div>`}${d.contact.socials.length ? `<ul class="social-links">${d.contact.socials.map((s) => `<li>${link(s.url, s.label)}</li>`).join('')}</ul>` : ''}</div></div></section>
  </main>
  <footer class="site-footer container"><div class="footer-main"><a class="wordmark" href="#inizio" title="${e(d.ui.homeLabel)}"><span class="brand-mark">${e(d.person.initials)}<span>.</span></span><span class="brand-name">${e(d.person.name)}</span></a><p>${e(d.ui.footerNote)}</p><a class="back-to-top" href="#inizio">${e(d.ui.backToTop)}${arrow}</a></div><div class="footer-bottom"><span>© ${copyrightYear} ${e(d.person.name)}</span><span>${e(d.ui.footerText)}</span></div></footer>
</body>
</html>
`;
}

export function render404(d) {
  return `<!doctype html><html lang="${e(d.seo.language)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><meta name="color-scheme" content="light dark"><title>404 — ${e(d.person.name)}</title><link rel="icon" href="${e(new URL(d.seo.url).pathname)}assets/favicon.svg"><link rel="stylesheet" href="${e(new URL(d.seo.url).pathname)}assets/style.css"></head><body><main class="error-page container"><span class="brand-mark">${e(d.person.initials)}.</span><p class="eyebrow">404</p><h1>${e(d.ui.notFound.title)}</h1><p>${e(d.ui.notFound.text)}</p><a class="button button-primary" href="${e(new URL(d.seo.url).pathname)}">${e(d.ui.notFound.link)}${arrow}</a></main></body></html>\n`;
}
