// Generates the service and industry architecture from content/services/*.js
// and content/industries/*.js, plus the single content/bolu.js local page:
//   - hizmetler.html (hub) + hizmetler/<slug>.html for every service
//   - sektorler.html (hub) + sektorler/<slug>.html for every industry
//   - bolu.html
//
// Run with: npm run build:pages (after build:blog, before build:sitemap).
// To add a new service or industry: create a new file in content/services/
// or content/industries/ (copy the shape of an existing one) and re-run.

const fs = require('fs');
const path = require('path');
const { categories: serviceCategories, services, getGroup } = require('../content/services');
const { industries } = require('../content/industries');
const bolu = require('../content/bolu');
const { articles: blogArticles, getArticle, readingTime } = require('../content');
const T = require('./blog-templates');

const ROOT = path.join(__dirname, '..');
const HIZMETLER_DIR = path.join(ROOT, 'hizmetler');
const SEKTORLER_DIR = path.join(ROOT, 'sektorler');

function industryLabel(industry) {
  return industry.title.replace(/ İçin Dijital Pazarlama$/, '');
}

// ---------------------------------------------------------------------------
// Icon system — small line icons (24x24, stroke-based) used on tile cards
// instead of a numbered index or a "blog category" pill. Keyed by service
// group slug, industry mega-menu group heading, or 'blog' as a fallback.
// ---------------------------------------------------------------------------

const ICONS = {
  reklam: '<path d="M3 10v4h3l7 4V6l-7 4H3z"/><path d="M17 9a3 3 0 0 1 0 6"/><path d="M6 14l1 4"/>',
  'seo-google': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-5.2-5.2"/>',
  'web-tasarim': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9.5h18"/><circle cx="6" cy="7.25" r="0.75" fill="currentColor" stroke="none"/><circle cx="8.5" cy="7.25" r="0.75" fill="currentColor" stroke="none"/>',
  yazilim: '<rect x="7" y="7" width="10" height="10" rx="2.5"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  'sosyal-buyume': '<path d="M4 5h16v11H8l-4 4V5z"/>',
  'Güzellik & Bakım': '<path d="M12 3c0 4.5-1 5.5-5.5 5.5C11 8.5 12 9.5 12 14c0-4.5 1-5.5 5.5-5.5C13 8.5 12 7.5 12 3z"/><path d="M5 17.5c0 2-0.5 2.5-2.5 2.5 2 0 2.5 0.5 2.5 2.5 0-2 0.5-2.5 2.5-2.5-2 0-2.5-0.5-2.5-2.5z"/>',
  'Sağlık & Danışmanlık': '<path d="M12 20.2s-7.3-4.5-9.1-9.1a5 5 0 0 1 9.1-3 5 5 0 0 1 9.1 3c-1.8 4.6-9.1 9.1-9.1 9.1z"/>',
  Otomotiv: '<path d="M4.5 16.5V11l2-5h11l2 5v5.5"/><path d="M2.5 16.5h19"/><circle cx="7.5" cy="16.5" r="1.7"/><circle cx="16.5" cy="16.5" r="1.7"/>',
  'Yaşam & Ticaret': '<path d="M4.5 21V9l7.5-4.7L19.5 9v12"/><path d="M9.5 21v-7h5v7"/>',
  blog: '<path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2v-17z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>'
};

function renderIcon(key) {
  const inner = ICONS[key] || ICONS.blog;
  return `<span class="tile-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</svg></span>`;
}

function industryMenuGroupFor(slug) {
  const group = T.INDUSTRY_MENU_GROUPS.find((g) => g.slugs.includes(slug));
  return group ? group.heading : 'Yaşam & Ticaret';
}

function renderFaqBlock(faq) {
  if (!faq || !faq.length) return '';
  return `<div class="faq-list article-faq">
  ${faq
    .map(
      (f, i) => `<div class="faq-item">
    <button class="faq-question" aria-expanded="false">
      <span class="faq-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="faq-q-text">${T.escapeHtml(f.q)}</span>
      <span class="faq-icon" aria-hidden="true"></span>
    </button>
    <div class="faq-answer-wrap"><div class="faq-answer-inner"><p>${T.escapeHtml(f.a)}</p></div></div>
  </div>`
    )
    .join('\n  ')}
</div>`;
}

function faqJsonLd(faq) {
  if (!faq || !faq.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };
}

function extractToc(html) {
  const re = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g;
  const toc = [];
  let m;
  while ((m = re.exec(html))) toc.push({ id: m[1], label: m[2].replace(/<[^>]+>/g, '').trim() });
  return toc;
}

function renderTocBlock(toc) {
  if (!toc.length) return '';
  return `<nav class="article-toc" aria-label="İçindekiler">
  <p class="article-toc-title">İçindekiler</p>
  <ol>
    ${toc.map((t) => `<li><a href="#${t.id}">${T.escapeHtml(t.label)}</a></li>`).join('\n    ')}
  </ol>
</nav>`;
}

// A deliberately non-"blog card" tile: category-icon badge instead of a
// numbered index, eyebrow-labeled, circular arrow affordance instead of a
// "Devamını Oku" read-more line — used for the hizmetler/sektörler hubs and
// every "related" grid so those pages read as a service catalog rather than
// a blog feed.
function tileCard({ href, icon, eyebrow, title, excerpt }) {
  return `<a href="${href}" class="tile-card">
  ${renderIcon(icon)}
  <span class="tile-eyebrow">${T.escapeHtml(eyebrow)}</span>
  <h3>${T.escapeHtml(title)}</h3>
  <p>${T.escapeHtml(excerpt)}</p>
  <span class="tile-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
</a>`;
}

function renderRelatedSection(base, { relatedServiceSlugs = [], relatedIndustrySlugs = [], relatedArticleSlugs = [] }) {
  const cards = [];
  relatedServiceSlugs.forEach((slug) => {
    const s = services.find((x) => x.slug === slug);
    if (s) cards.push(tileCard({ href: `${base}hizmetler/${s.slug}.html`, icon: s.group, eyebrow: 'Hizmet', title: s.title, excerpt: s.excerpt }));
  });
  relatedIndustrySlugs.forEach((slug) => {
    const i = industries.find((x) => x.slug === slug);
    if (i) cards.push(tileCard({ href: `${base}sektorler/${i.slug}.html`, icon: industryMenuGroupFor(i.slug), eyebrow: 'Sektör', title: industryLabel(i), excerpt: i.excerpt }));
  });
  relatedArticleSlugs.forEach((slug) => {
    const a = getArticle(slug);
    if (a) cards.push(tileCard({ href: `${base}blog/${a.slug}.html`, icon: 'blog', eyebrow: 'Blog', title: a.title, excerpt: a.excerpt }));
  });
  if (!cards.length) return '';
  return `<section class="section section-tint related-wrap">
  <div class="wrap">
    <section class="related-section">
      <p class="kicker">İlgili İçerikler</p>
      <div class="tile-grid related-grid">
        ${cards.join('\n        ')}
      </div>
    </section>
  </div>
</section>`;
}

// ---------------------------------------------------------------------------
// Service pages
// ---------------------------------------------------------------------------

function renderServicePage(service) {
  const base = '../';
  const group = getGroup(service.group);
  const canonicalPath = `/hizmetler/${service.slug}.html`;
  const url = `${T.SITE_URL}${canonicalPath}`;
  const toc = extractToc(service.bodyHtml);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.title,
      description: service.metaDescription,
      provider: { '@type': 'Organization', name: T.business.name, url: T.SITE_URL },
      areaServed: T.business.areaServed,
      url
    },
    T.breadcrumbJsonLd([
      { label: 'Ana Sayfa', url: T.SITE_URL },
      { label: 'Hizmetler', url: `${T.SITE_URL}/hizmetler.html` },
      { label: service.title, url }
    ])
  ];
  const faqSchema = faqJsonLd(service.faq);
  if (faqSchema) jsonLd.push(faqSchema);

  const html =
    T.renderHead({
      base,
      title: `${service.title} | Caras Partner`,
      description: service.metaDescription,
      canonicalPath,
      ogType: 'website',
      jsonLd
    }) +
    T.renderHeader(base) +
    `
<section class="article-hero">
  <div class="wrap">
    ${T.renderBreadcrumb([
      { label: 'Ana Sayfa', href: `${base}index.html` },
      { label: 'Hizmetler', href: `${base}hizmetler.html` },
      { label: service.title }
    ])}
    <span class="blog-card-cat">${T.escapeHtml(group ? group.name : '')}</span>
    <h1>${T.escapeHtml(service.title)}</h1>
    <p class="article-meta">${T.escapeHtml(service.excerpt)}</p>
  </div>
</section>

<section class="article-body-wrap">
  <div class="wrap article-layout">
    ${renderTocBlock(toc)}
    <div class="article-content">
      ${service.bodyHtml}
      ${renderFaqBlock(service.faq)}
    </div>
  </div>
</section>
${renderRelatedSection(base, service)}
` +
    T.renderFooter(base) +
    T.renderWidgets(base) +
    T.renderClose();

  fs.writeFileSync(path.join(HIZMETLER_DIR, `${service.slug}.html`), html, 'utf8');
}

function renderServicesHub() {
  const base = '';
  const cols = serviceCategories
    .map((group) => {
      const items = services.filter((s) => s.group === group.slug);
      const cards = items
        .map((s) =>
          tileCard({ href: `hizmetler/${s.slug}.html`, icon: group.slug, eyebrow: group.name, title: s.title, excerpt: s.excerpt })
        )
        .join('\n      ');
      return `<div class="service-group" id="${group.slug}">
      <div class="section-head service-group-head">
        <p class="kicker">${T.escapeHtml(group.name)}</p>
        <p class="section-note">${T.escapeHtml(group.short)}</p>
      </div>
      <div class="tile-grid">
      ${cards}
      </div>
    </div>`;
    })
    .join('\n    ');

  const jsonLd = [
    T.breadcrumbJsonLd([
      { label: 'Ana Sayfa', url: T.SITE_URL },
      { label: 'Hizmetler', url: `${T.SITE_URL}/hizmetler.html` }
    ])
  ];

  const html =
    T.renderHead({
      base,
      title: 'Hizmetler | Caras Partner — Dijital Pazarlama & Büyüme Ajansı',
      description: 'Meta Ads, Google Ads, SEO, web tasarım, mobil uygulama, sosyal medya, influencer marketing, dijital PR ve AI otomasyon hizmetleri.',
      canonicalPath: '/hizmetler.html',
      jsonLd
    }) +
    T.renderHeader(base) +
    `
<section class="blog-hero">
  <div class="wrap">
    ${T.renderBreadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Hizmetler' }])}
    <p class="kicker">Hizmetler</p>
    <h1>İşletmenizin dijital büyümesi için ihtiyaç duyduğu her şey.</h1>
    <p class="blog-hero-sub">Reklamdan SEO'ya, web sitesinden yapay zekâ destekli otomasyona kadar 8 ana başlıkta topladığımız hizmetlerimiz. Her biri kendi sayfasında detaylı biçimde anlatılıyor.</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${cols}
  </div>
</section>
` +
    T.renderFooter(base) +
    T.renderWidgets(base) +
    T.renderClose();

  fs.writeFileSync(path.join(ROOT, 'hizmetler.html'), html, 'utf8');
}

// ---------------------------------------------------------------------------
// Industry pages
// ---------------------------------------------------------------------------

function renderIndustryPage(industry) {
  const base = '../';
  const canonicalPath = `/sektorler/${industry.slug}.html`;
  const url = `${T.SITE_URL}${canonicalPath}`;
  const toc = extractToc(industry.bodyHtml);
  const label = industryLabel(industry);

  const jsonLd = [
    T.breadcrumbJsonLd([
      { label: 'Ana Sayfa', url: T.SITE_URL },
      { label: 'Sektörler', url: `${T.SITE_URL}/sektorler.html` },
      { label: industry.title, url }
    ])
  ];
  const faqSchema = faqJsonLd(industry.faq);
  if (faqSchema) jsonLd.push(faqSchema);

  const html =
    T.renderHead({
      base,
      title: `${industry.title} | Caras Partner`,
      description: industry.metaDescription,
      canonicalPath,
      ogType: 'website',
      jsonLd
    }) +
    T.renderHeader(base) +
    `
<section class="article-hero">
  <div class="wrap">
    ${T.renderBreadcrumb([
      { label: 'Ana Sayfa', href: `${base}index.html` },
      { label: 'Sektörler', href: `${base}sektorler.html` },
      { label: label }
    ])}
    <span class="blog-card-cat">Sektörel Rehber</span>
    <h1>${T.escapeHtml(industry.title)}</h1>
    <p class="article-meta">${T.escapeHtml(industry.excerpt)}</p>
  </div>
</section>

<section class="article-body-wrap">
  <div class="wrap article-layout">
    ${renderTocBlock(toc)}
    <div class="article-content">
      ${industry.bodyHtml}
      ${renderFaqBlock(industry.faq)}
    </div>
  </div>
</section>
${renderRelatedSection(base, industry)}
` +
    T.renderFooter(base) +
    T.renderWidgets(base) +
    T.renderClose();

  fs.writeFileSync(path.join(SEKTORLER_DIR, `${industry.slug}.html`), html, 'utf8');
}

function renderSektorlerHub() {
  const base = '';
  const cols = T.INDUSTRY_MENU_GROUPS
    .map((group) => {
      const items = group.slugs.map((slug) => industries.find((i) => i.slug === slug)).filter(Boolean);
      const cards = items
        .map((i) =>
          tileCard({ href: `sektorler/${i.slug}.html`, icon: group.heading, eyebrow: group.heading, title: industryLabel(i), excerpt: i.excerpt })
        )
        .join('\n      ');
      return `<div class="service-group">
      <div class="section-head service-group-head">
        <p class="kicker">${T.escapeHtml(group.heading)}</p>
      </div>
      <div class="tile-grid">
      ${cards}
      </div>
    </div>`;
    })
    .join('\n    ');

  const jsonLd = [
    T.breadcrumbJsonLd([
      { label: 'Ana Sayfa', url: T.SITE_URL },
      { label: 'Sektörler', url: `${T.SITE_URL}/sektorler.html` }
    ])
  ];

  const html =
    T.renderHead({
      base,
      title: 'Sektörler | Caras Partner — Sektöre Özel Dijital Pazarlama Çözümleri',
      description: 'Güzellik salonlarından diş kliniklerine, PPF firmalarından emlak ofislerine kadar 15 sektöre özel dijital pazarlama yaklaşımı.',
      canonicalPath: '/sektorler.html',
      jsonLd
    }) +
    T.renderHeader(base) +
    `
<section class="blog-hero">
  <div class="wrap">
    ${T.renderBreadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Sektörler' }])}
    <p class="kicker">Sektörler</p>
    <h1>Her sektörün dijital pazarlama ihtiyacı farklıdır.</h1>
    <p class="blog-hero-sub">Güzellik salonlarından hukuk bürolarına, PPF firmalarından e-ticaret markalarına kadar çalıştığımız 15 sektöre özel yaklaşımımızı aşağıda bulabilirsiniz. Sektörünüz burada yer almasa da ücretsiz görüşmede birlikte değerlendirebiliriz.</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${cols}
  </div>
</section>
` +
    T.renderFooter(base) +
    T.renderWidgets(base) +
    T.renderClose();

  fs.writeFileSync(path.join(ROOT, 'sektorler.html'), html, 'utf8');
}

// ---------------------------------------------------------------------------
// /bolu.html
// ---------------------------------------------------------------------------

function renderBoluPage() {
  const base = '';
  const canonicalPath = '/bolu.html';
  const url = `${T.SITE_URL}${canonicalPath}`;
  const toc = extractToc(bolu.bodyHtml);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': ['Organization', 'ProfessionalService'],
      name: T.business.name,
      url: T.business.url,
      logo: T.business.logo,
      image: T.business.logoFull,
      telephone: T.business.telephone,
      email: T.business.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: T.business.address.streetAddress,
        addressLocality: T.business.address.addressLocality,
        addressRegion: T.business.address.addressRegion,
        postalCode: T.business.address.postalCode,
        addressCountry: T.business.address.addressCountry
      },
      areaServed: 'TR',
      openingHoursSpecification: T.business.openingHours.schema,
      sameAs: T.business.sameAs
    },
    T.breadcrumbJsonLd([
      { label: 'Ana Sayfa', url: T.SITE_URL },
      { label: 'Bolu', url }
    ])
  ];
  const faqSchema = faqJsonLd(bolu.faq);
  if (faqSchema) jsonLd.push(faqSchema);

  const html =
    T.renderHead({
      base,
      title: `${bolu.title} | Caras Partner`,
      description: bolu.metaDescription,
      canonicalPath,
      jsonLd
    }) +
    T.renderHeader(base) +
    `
<section class="article-hero">
  <div class="wrap">
    ${T.renderBreadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Bolu' }])}
    <span class="blog-card-cat">Bolu</span>
    <h1>${T.escapeHtml(bolu.title)}</h1>
    <p class="article-meta">${T.escapeHtml(bolu.excerpt)}</p>
  </div>
</section>

<section class="article-body-wrap">
  <div class="wrap article-layout">
    ${renderTocBlock(toc)}
    <div class="article-content">
      ${bolu.bodyHtml}
      ${renderFaqBlock(bolu.faq)}
    </div>
  </div>
</section>
${renderRelatedSection(base, bolu)}
` +
    T.renderFooter(base) +
    T.renderWidgets(base) +
    T.renderClose();

  fs.writeFileSync(path.join(ROOT, 'bolu.html'), html, 'utf8');
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

function run() {
  if (!fs.existsSync(HIZMETLER_DIR)) fs.mkdirSync(HIZMETLER_DIR, { recursive: true });
  if (!fs.existsSync(SEKTORLER_DIR)) fs.mkdirSync(SEKTORLER_DIR, { recursive: true });

  services.forEach(renderServicePage);
  renderServicesHub();
  industries.forEach(renderIndustryPage);
  renderSektorlerHub();
  renderBoluPage();

  console.log(`Built ${services.length} service pages, ${industries.length} industry pages, hizmetler.html, sektorler.html, and bolu.html.`);
}

run();
