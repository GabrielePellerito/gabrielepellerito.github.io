import { escapeHtml as e, head, navigation, sculpture, label, badge, project, contacts, journey, skillGroups, moreProjects, arrow, diagonal } from './html.mjs';
export { escapeHtml } from './html.mjs';
export function renderSite(d) {
  return `<!doctype html>
<!-- Generated from content/site.json. Dark Editorial 3D; no hosting build. -->
<html lang="${e(d.seo.language)}" data-concept="dark-editorial-3d" data-motion-enabled="${d.design.motion}" data-motion="${d.design.motion ? 'on' : 'off'}">
<head>${head(d)}</head>
<body id="inizio">${navigation(d)}
<main id="contenuto" tabindex="-1">
  <section class="hero" aria-labelledby="hero-title">
    <div class="container hero-meta"><p class="eyebrow">${e(d.hero.eyebrow)}</p><span class="edition">${e(d.ui.footerText)} / 01</span></div>
    <div class="hero-stage container">
      <div class="hero-title-wrap"><p class="hero-greeting">${e(d.hero.greeting)}</p><h1 id="hero-title"><span>${e(d.person.firstName)}</span> <span class="outline-name">${e(d.person.lastName)}<span class="name-dot">.</span></span></h1></div>
      ${sculpture(d)}<span class="scene-coordinate" aria-hidden="true">${e(d.hero.artLabel)} / 3 DOF</span>
    </div>
    <div class="container hero-bottom"><div class="hero-description"><span class="tiny-cross" aria-hidden="true">+</span><p>${e(d.hero.intro)}</p></div><div class="hero-buttons"><a class="button button-primary" href="#${e(d.hero.primaryTarget)}">${e(d.hero.primaryLabel)}${arrow}</a><a class="text-link" href="#${e(d.hero.secondaryTarget)}">${e(d.hero.secondaryLabel)}${diagonal}</a></div><a class="scroll-cue" href="#chi-sono"><span>${e(d.hero.scrollLabel)}</span>${arrow}</a></div>
  </section>
  <section class="section container about" id="chi-sono" aria-labelledby="about-title"><div class="section-heading reveal">${label(d.about)}<h2 id="about-title">${e(d.about.title)}</h2></div><div class="about-body"><div class="about-text reveal">${d.about.placeholder ? badge(d) : ''}<h3>${e(d.about.intro)}</h3>${d.about.paragraphs.map((p) => `<p>${e(p)}</p>`).join('')}</div><aside class="personal-note reveal"><span class="note-star" aria-hidden="true">✳</span><p class="eyebrow">${e(d.about.noteLabel)}</p><p>${e(d.about.note)}</p><span class="note-signature" aria-hidden="true">${e(d.person.firstName)}.</span></aside></div></section>
  <section class="journey-band" id="percorso" aria-labelledby="journey-title"><div class="section container split-section"><div class="section-heading reveal">${label(d.journey)}<h2 id="journey-title">${e(d.journey.title)}</h2><p class="section-intro">${e(d.journey.intro)}</p></div>${journey(d, 'dark')}</div></section>
  <section class="section container skills" id="competenze" aria-labelledby="skills-title"><div class="section-heading reveal">${label(d.skills)}<h2 id="skills-title">${e(d.skills.title)}</h2><p class="section-intro">${e(d.skills.intro)}</p></div>${skillGroups(d)}</section>
  <section class="section container projects" id="progetti" aria-labelledby="projects-title"><div class="projects-heading reveal"><div class="section-heading">${label(d.projects)}<h2 id="projects-title">${e(d.projects.title)}</h2></div><p class="section-intro">${e(d.projects.intro)}</p></div><div class="project-grid">${d.projects.items.map((p, i) => project(d, p, i)).join('')}</div>${moreProjects(d)}</section>
  <section class="contact-section" id="contatti" aria-labelledby="contact-title"><div class="section container"><div class="contact-top reveal">${label(d.contact)}<span aria-hidden="true">↗</span></div><h2 class="reveal" id="contact-title">${e(d.contact.title)}</h2><div class="contact-bottom reveal"><p class="section-intro">${e(d.contact.intro)}</p>${contacts(d)}</div></div></section>
</main><footer class="site-footer container"><div class="footer-main"><a class="wordmark" href="#inizio"><span class="brand-mark">${e(d.person.initials)}.</span><span class="brand-name">${e(d.person.name)}</span></a><p>${e(d.ui.footerNote)}</p><a class="back-to-top" href="#inizio">${e(d.ui.backToTop)}${arrow}</a></div><div class="footer-bottom"><span>© ${new Date().getUTCFullYear()} ${e(d.person.name)}</span><span>${e(d.ui.footerText)}</span></div></footer>
</body></html>\n`;
}
export function render404(d) {
  return `<!doctype html><html lang="${e(d.seo.language)}" data-concept="${e(d.design.concept)}"><head>${head(d, { error: true })}</head><body><main class="error-page container"><a class="wordmark" href="${e(new URL(d.seo.url).pathname)}">${e(d.person.initials)}.</a><p class="eyebrow">404 /</p><h1>${e(d.ui.notFound.title)}</h1><p>${e(d.ui.notFound.text)}</p><a class="button button-primary" href="${e(new URL(d.seo.url).pathname)}">${e(d.ui.notFound.link)}${arrow}</a></main></body></html>\n`;
}
