// Shared semantic primitives. Text remains plain content, never trusted HTML.
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const e = escapeHtml;
export const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
export const diagonal = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';
export const label = (s) => `<p class="section-label"><span>${e(s.number)} /</span> ${e(s.label)}</p>`;
export const badge = (d) => `<span class="placeholder-badge">${e(d.ui.placeholderLabel)}</span>`;
export const external = (url, text, className = '') => `<a class="${className}" href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(text)}${diagonal}<span class="sr-only"> (nuova scheda)</span></a>`;

export function head(d, { error = false } = {}) {
  const person = { '@type': 'Person', name: d.person.name, url: d.seo.url,
    ...(d.person.description ? { description: d.person.description } : {}),
    ...(d.person.knowsAbout?.length ? { knowsAbout: d.person.knowsAbout } : {}),
    ...(d.person.credentials?.length ? { hasCredential: d.person.credentials.map((c) => ({ '@type': 'EducationalOccupationalCredential', name: c.name, credentialCategory: c.category })) } : {}),
    ...(d.contact.socials.length ? { sameAs: d.contact.socials.map((s) => s.url) } : {}) };
  const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ProfilePage', url: d.seo.url, name: d.seo.title, inLanguage: d.seo.language, mainEntity: person }).replace(/</g, '\\u003c');
  const asset = error ? `${new URL(d.seo.url).pathname}assets/` : './assets/';
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' __SCHEMA_HASH__; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; upgrade-insecure-requests">
<title>${error ? '404 — ' + e(d.person.name) : e(d.seo.title)}</title>
<meta name="description" content="${e(d.seo.description)}">
<meta name="robots" content="${error || !d.seo.indexing ? 'noindex, nofollow' : 'index, follow'}">
<meta name="author" content="${e(d.person.name)}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="color-scheme" content="${d.design.scheme}">
<meta name="theme-color" content="${d.design.background}">
${!error ? `<link rel="canonical" href="${e(d.seo.url)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${e(d.seo.locale)}">
<meta property="og:site_name" content="${e(d.person.name)}">
<meta property="og:title" content="${e(d.seo.title)}">
<meta property="og:description" content="${e(d.seo.description)}">
<meta property="og:url" content="${e(d.seo.url)}">
<meta property="og:image" content="${e(d.seo.url)}assets/social-card.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${e(d.seo.imageAlt || d.person.name + ' — ' + d.ui.footerText)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${e(d.seo.title)}">
<meta name="twitter:description" content="${e(d.seo.description)}">
<meta name="twitter:image" content="${e(d.seo.url)}assets/social-card.png">
<meta name="twitter:image:alt" content="${e(d.seo.imageAlt || d.person.name + ' — ' + d.ui.footerText)}">` : ''}
<link rel="icon" type="image/svg+xml" href="${asset}favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="${asset}favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="${asset}apple-touch-icon.png">
<script src="${asset}theme.js"></script>
<link rel="stylesheet" href="${asset}style.css">
${!error ? `<script type="application/ld+json">${schema}</script><script src="${asset}main.js" defer></script>` : ''}`;
}

export function navigation(d) {
  return `<a class="skip-link" href="#contenuto">${e(d.ui.skipLink)}</a><header class="site-header"><div class="container header-inner"><a class="wordmark" href="#inizio"><span class="brand-mark">${e(d.person.initials)}<span>+</span></span><span class="brand-name">${e(d.person.name)}</span></a><div class="header-actions"><nav class="site-nav" id="navigazione" aria-label="Principale">${d.navigation.map((n) => `<a href="#${e(n.id)}">${e(n.label)}</a>`).join('')}<a class="nav-contact" href="#contatti">${e(d.ui.contactLabel)}${diagonal}</a></nav><button class="motion-toggle" type="button" aria-label="${e(d.design.pauseLabel)}" aria-pressed="false" data-resume="${e(d.design.resumeLabel)}" hidden><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path class="pause-icon" d="M9 6v12M15 6v12"/><path class="play-icon" d="m9 5 10 7-10 7Z"/></svg></button><button class="menu-toggle" type="button" aria-label="${e(d.ui.menuLabel)}" aria-expanded="false" aria-controls="navigazione" hidden><span></span><span></span></button></div></div></header>`;
}

export function sculpture(d) {
  return `<div class="sculpture-stage" data-scene="${e(d.design.concept)}" aria-hidden="true"><img class="sculpture-fallback" src="./assets/sculpture.webp" alt="" width="1000" height="1000" fetchpriority="high" decoding="async"><div class="scene-mount"></div></div>`;
}

export function project(d, item, index) {
  const stack = item.stack?.length ? item.stack : item.tags;
  const links = !item.placeholder ? [item.githubUrl ? external(item.githubUrl, 'GitHub') : '', item.demoUrl ? external(item.demoUrl, 'Demo') : '', item.url && !item.githubUrl && !item.demoUrl ? external(item.url, d.ui.projectLinkLabel) : ''].join('') : '';
  const media = item.image?.src ? `<img src="${e(item.image.src)}" alt="${e(item.image.alt || item.title)}" width="${e(item.image.width || 1200)}" height="${e(item.image.height || 800)}" loading="lazy" decoding="async">` : `<div class="project-object object-${index % 2}" aria-hidden="true"><i></i><i></i><i></i></div>`;
  return `<article class="project-card reveal" data-tilt><div class="project-media">${media}<span class="project-index">0${index + 1}</span><span class="project-media-label">${e(item.visualLabel || (item.placeholder ? d.ui.projectPlaceholderLabel : item.category))}</span></div><div class="project-info"><div class="project-category"><span>${e(item.category)}${item.year ? ' / ' + e(item.year) : ''}</span>${item.placeholder ? badge(d) : ''}</div>${item.organization ? `<p class="project-organization">${e(item.organization)}</p>` : ''}<h3>${e(item.title)}</h3><p>${e(item.description)}</p><ul class="tags">${stack.map((t) => `<li>${e(t)}</li>`).join('')}</ul>${links ? `<div class="project-links">${links}</div>` : ''}${item.availabilityNote ? `<p class="project-availability">${e(item.availabilityNote)}</p>` : ''}</div></article>`;
}

export function journey(d, mode) {
  const groups = d.journey.groups || [{ id: '', label: '' }];
  const itemMarkup = (item, index, grouped) => {
    const level = grouped ? 'h4' : 'h3';
    const organization = `<p class="organization">${e(item.organization)}${item.location ? `<span class="timeline-location"> / ${e(item.location)}</span>` : ''}</p>`;
    const details = `<p>${e(item.description)}</p>${item.activities?.length ? `<ul class="activity-list" aria-label="Attività e ambiti">${item.activities.map((a) => `<li>${e(a)}</li>`).join('')}</ul>` : ''}${item.status ? `<div class="timeline-status"><span class="status-badge">${e(item.status)}</span><p>${e(item.statusDetail)}</p></div>` : ''}${item.placeholder ? badge(d) : ''}`;
    const title = `<${level}>${e(item.title)}</${level}>`;
    return mode === 'light' ? `<li class="timeline-item reveal"><div class="timeline-meta"><span class="timeline-count" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><span>${e(item.period)}</span></div><div class="timeline-main"><p class="timeline-category">${e(item.category)}</p>${title}${organization}</div><div class="timeline-description">${details}</div></li>` : `<li class="timeline-item reveal"><div class="timeline-meta"><span>${e(item.period)}</span><span>${e(item.category)}</span></div>${title}${organization}<div class="timeline-description">${details}</div></li>`;
  };
  return `<div class="journey-lists">${groups.map((group) => `<div class="journey-group">${group.label ? `<h3 class="journey-group-title" id="percorso-${e(group.id)}">${e(group.label)}</h3>` : ''}<ol class="timeline">${d.journey.items.filter((i) => !group.id || i.group === group.id).map((item, index) => itemMarkup(item, index, Boolean(group.label))).join('')}</ol></div>`).join('')}${d.journey.sourceNote ? `<p class="journey-source-note">${e(d.journey.sourceNote)}</p>` : ''}</div>`;
}

export function skillGroups(d) {
  return `<div class="skills-grid">${d.skills.groups.map((g, index) => `<article class="skill-group reveal"><div class="skill-header"><span class="skill-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>${g.placeholder ? badge(d) : ''}</div><h3>${e(g.title)}</h3><p>${e(g.description)}</p><ul class="skill-list">${g.items.map((item) => typeof item === 'string' ? `<li>${e(item)}</li>` : `<li class="language-item"><span>${e(item.name)}</span><span class="language-level">${e(item.level)}</span></li>`).join('')}</ul></article>`).join('')}</div>${d.skills.interestsText ? `<aside class="interests-note reveal"><h3>${e(d.skills.interestsTitle)}</h3><p>${e(d.skills.interestsText)}</p></aside>` : ''}`;
}

export function moreProjects(d) {
  return d.projects.moreText ? `<aside class="projects-empty reveal"><span aria-hidden="true">+</span><div><h3>${e(d.projects.moreTitle)}</h3><p>${e(d.projects.moreText)}</p></div></aside>` : '';
}

export function contacts(d) {
  return `<div class="contact-actions">${d.contact.email ? `<a class="button button-primary" href="mailto:${e(d.contact.email)}">${e(d.contact.emailLabel)}${diagonal}</a><div class="email-line"><span>${e(d.contact.email)}</span><button class="copy-button" type="button" data-email="${e(d.contact.email)}" data-copied="${e(d.contact.copiedLabel)}" data-error="${e(d.contact.copyErrorLabel)}" hidden>${e(d.contact.copyLabel)}</button></div><p class="copy-status sr-only" role="status"></p>` : `<div class="contact-placeholder"><p>${e(d.contact.emptyLabel)}</p><span>${e(d.contact.emptyText)}</span></div>`}${d.contact.socials.length ? `<ul class="social-links">${d.contact.socials.map((s) => `<li>${external(s.url, s.label)}</li>`).join('')}</ul>` : ''}</div>`;
}
