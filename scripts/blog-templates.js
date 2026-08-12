// Shared HTML fragments used across the whole site (blog, service pages,
// industry pages, and — via scripts/sync-chrome.js — the hand-authored root
// pages). Kept separate from the build scripts so the layout/markup can be
// tweaked in one place without touching data-processing logic.

const business = require('../content/business');
const serviceCategories = require('../content/services/categories');
const { services } = require('../content/services');
const { industries } = require('../content/industries');

const SITE_URL = business.url;
const WHATSAPP = business.whatsapp;

// Groups industries into readable mega-menu columns. Purely a presentation
// grouping — content/industries/*.js itself stays a flat list.
const INDUSTRY_MENU_GROUPS = [
  { heading: 'Güzellik & Bakım', slugs: ['guzellik-salonlari', 'kuaforler', 'berberler'] },
  { heading: 'Sağlık & Danışmanlık', slugs: ['diyetisyenler', 'psikologlar', 'dis-klinikleri'] },
  { heading: 'Otomotiv', slugs: ['ppf-arac-kaplama', 'oto-yikama', 'otomotiv'] },
  { heading: 'Yaşam & Ticaret', slugs: ['restoranlar', 'emlak', 'hukuk', 'spor-salonlari', 'e-ticaret', 'yerel-isletmeler'] }
];

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDateTR(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// base = '' for pages at site root (blog.html), '../' for pages inside /blog
function renderHead({ base, title, description, canonicalPath, ogType = 'website', jsonLd = [] }) {
  const canonical = `${SITE_URL}${canonicalPath}`;
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="${base}assets/favicon.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://api.fontshare.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}styles.css">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="Caras Partner">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE_URL}/assets/logo-full.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
${jsonLd.map((obj) => `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`).join('\n')}
</head>
<body>

<div class="grain"></div>
`;
}

function renderServicesDropdown(base) {
  const cols = serviceCategories
    .map((group) => {
      const items = services
        .filter((s) => s.group === group.slug)
        .map((s) => `<a href="${base}hizmetler/${s.slug}.html">${escapeHtml(s.navLabel)}</a>`)
        .join('\n        ');
      return `<div class="nav-dropdown-col">
        <p class="nav-dropdown-heading">${escapeHtml(group.name)}</p>
        ${items}
      </div>`;
    })
    .join('\n      ');

  return `<details class="nav-dropdown">
    <summary>Hizmetler<svg class="nav-caret" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></summary>
    <div class="nav-dropdown-panel nav-dropdown-panel-wide">
      ${cols}
      <div class="nav-dropdown-col nav-dropdown-viewall-col">
        <a href="${base}hizmetler.html" class="nav-dropdown-viewall">Tüm Hizmetleri Gör →</a>
      </div>
    </div>
  </details>`;
}

function renderIndustriesDropdown(base) {
  const cols = INDUSTRY_MENU_GROUPS
    .map((group) => {
      const items = group.slugs
        .map((slug) => industries.find((i) => i.slug === slug))
        .filter(Boolean)
        .map((i) => `<a href="${base}sektorler/${i.slug}.html">${escapeHtml(i.title.replace(/ İçin Dijital Pazarlama$/, ''))}</a>`)
        .join('\n        ');
      return `<div class="nav-dropdown-col">
        <p class="nav-dropdown-heading">${escapeHtml(group.heading)}</p>
        ${items}
      </div>`;
    })
    .join('\n      ');

  return `<details class="nav-dropdown">
    <summary>Sektörler<svg class="nav-caret" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></summary>
    <div class="nav-dropdown-panel nav-dropdown-panel-wide">
      ${cols}
      <div class="nav-dropdown-col nav-dropdown-viewall-col">
        <a href="${base}sektorler.html" class="nav-dropdown-viewall">Tüm Sektörleri Gör →</a>
      </div>
    </div>
  </details>`;
}

function renderHeader(base, opts = {}) {
  const brandHref = opts.isHome ? '#top' : `${base}index.html`;
  return `<header class="site-header" id="top">
  <div class="wrap header-inner">
    <a href="${brandHref}" class="brand" aria-label="Caras Partner ana sayfa">
      <img src="${base}assets/logo-icon.png" alt="" class="brand-mark">
      <span class="brand-word">Caras<em>Partner</em></span>
    </a>
    <nav class="main-nav" id="mainNav">
      <a href="${base}neden-caras.html">Neden Caras?</a>
      ${renderServicesDropdown(base)}
      ${renderIndustriesDropdown(base)}
      <a href="${base}blog.html">Blog</a>
      <a href="${base}iletisim.html">İletişim</a>
      <a href="${base}sss.html">S.S.S</a>
    </nav>
    <div class="header-cta">
      <a href="${WHATSAPP}" class="btn btn-ghost" target="_blank" rel="noopener">WhatsApp</a>
      <a href="${base}rezervasyon.html" class="btn btn-solid">Ücretsiz Dijital Analiz</a>
    </div>
    <button class="burger" id="burgerBtn" aria-label="Menüyü aç" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>
`;
}

// Featured subsets for the footer — not every service/sector, just the
// highest-intent ones, each linking through to the "see all" hub page.
const FOOTER_SERVICE_SLUGS = ['meta-ads', 'google-ads', 'seo', 'local-seo', 'web-tasarim', 'ai-otomasyon'];
const FOOTER_INDUSTRY_SLUGS = ['guzellik-salonlari', 'kuaforler', 'dis-klinikleri', 'restoranlar', 'emlak', 'e-ticaret'];

function renderFooter(base) {
  const serviceLinks = FOOTER_SERVICE_SLUGS.map((slug) => services.find((s) => s.slug === slug))
    .filter(Boolean)
    .map((s) => `<a href="${base}hizmetler/${s.slug}.html">${escapeHtml(s.navLabel)}</a>`)
    .join('\n        ');

  const industryLinks = FOOTER_INDUSTRY_SLUGS.map((slug) => industries.find((i) => i.slug === slug))
    .filter(Boolean)
    .map((i) => `<a href="${base}sektorler/${i.slug}.html">${escapeHtml(i.title.replace(/ İçin Dijital Pazarlama$/, ''))}</a>`)
    .join('\n        ');

  return `<footer class="site-footer">
  <div class="wrap footer-inner">
    <div class="footer-brand">
      <img src="${base}assets/logo-icon.png" alt="" class="brand-mark footer-mark">
      <p>${escapeHtml(business.name)}<br><em>Odaklanan Büyür</em></p>
    </div>
    <div class="footer-cols">
      <div>
        <h4>Hizmetler</h4>
        ${serviceLinks}
        <a href="${base}hizmetler.html">Tüm Hizmetler →</a>
      </div>
      <div>
        <h4>Sektörler</h4>
        ${industryLinks}
        <a href="${base}sektorler.html">Tüm Sektörler →</a>
      </div>
      <div>
        <h4>Site</h4>
        <a href="${base}neden-caras.html">Neden Caras?</a>
        <a href="${base}index.html#surec">Süreç</a>
        <a href="${base}index.html#paketler">Paketler</a>
        <a href="${base}bolu.html">Bolu</a>
        <a href="${base}rezervasyon.html">Rezervasyon</a>
        <a href="${base}iletisim.html">İletişim</a>
      </div>
      <div>
        <h4>İletişim</h4>
        <a href="${WHATSAPP}" target="_blank" rel="noopener">${escapeHtml(business.telephoneDisplay)}</a>
        <a href="${business.whatsappSecondary}" target="_blank" rel="noopener">${escapeHtml(business.telephoneSecondaryDisplay)}</a>
        <a href="mailto:${business.email}">${escapeHtml(business.email)}</a>
        <a href="${business.mapsUrl}" target="_blank" rel="noopener">${escapeHtml(business.addressDisplay)}</a>
      </div>
    </div>
  </div>
  <div class="wrap footer-bottom">
    <p>© <span id="year"></span> ${escapeHtml(business.name)}. Tüm hakları saklıdır.</p>
    <div class="footer-legal">
      <a href="${base}kullanim-kosullari.html">Kullanım Koşulları</a>
      <a href="${base}mesafeli-satis-sozlesmesi.html">Mesafeli Satış Sözleşmesi</a>
      <a href="${base}kvkk-gizlilik.html">KVKK ve Gizlilik Politikası</a>
      <a href="${base}cerez-politikasi.html">Çerez Politikası</a>
    </div>
  </div>
</footer>
`;
}

function renderWidgets(base) {
  return `<a href="${WHATSAPP}" class="fab-whatsapp" target="_blank" rel="noopener" aria-label="WhatsApp'tan yazın">
  <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.22.6 4.3 1.66 6.1L4 29l8.06-1.63a12.9 12.9 0 0 0 3.96.62c6.62 0 12.02-5.4 12.02-12.02C28.04 8.4 22.64 3 16.02 3zm0 21.9c-1.28 0-2.5-.25-3.66-.73l-.26-.11-4.78.97.98-4.66-.17-.27a9.9 9.9 0 0 1-1.5-5.08c0-5.44 4.42-9.86 9.86-9.86s9.86 4.42 9.86 9.86-4.4 9.88-9.86 9.88zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.16-.17.2-.34.22-.64.07-.3-.15-1.26-.46-2.4-1.47-.9-.8-1.5-1.78-1.68-2.08-.17-.3-.02-.46.13-.6.14-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.9-2.18-.24-.58-.48-.5-.66-.5h-.56c-.2 0-.52.07-.79.37-.27.3-1.03 1-1.03 2.45s1.06 2.85 1.2 3.05c.15.2 2.1 3.2 5.08 4.5.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/></svg>
</a>

<button class="fab-assistant" id="assistantFab" aria-label="Caras Asistan'ı aç" aria-expanded="false">
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4L12 3z" fill="currentColor"/><path d="M19 14l.9 2.3L22 17l-2.1.7L19 20l-.9-2.3L16 17l2.1-.7L19 14z" fill="currentColor"/></svg>
</button>

<div class="assistant-teaser" id="assistantTeaser">
  <button class="assistant-teaser-close" id="assistantTeaserClose" aria-label="Kapat">&times;</button>
  Merhaba! 👋 Meta reklamları hakkında bir sorunuz mu var? Caras Asistan'a sorabilirsiniz.
</div>

<div class="assistant-panel" id="assistantPanel" hidden>
  <div class="assistant-header">
    <div>
      <p class="assistant-title">Caras Asistan</p>
      <p class="assistant-subtitle">Meta reklamları hakkında sorun</p>
    </div>
    <button class="assistant-close" id="assistantClose" aria-label="Kapat">&times;</button>
  </div>
  <div class="assistant-messages" id="assistantMessages">
    <div class="assistant-msg assistant-msg-bot">
      Merhaba! Ben Caras Asistan 👋 Meta reklamları, hizmetlerimiz ve paketlerimiz hakkında sorularınızı yanıtlayabilirim. Nasıl yardımcı olabilirim?
    </div>
  </div>
  <form class="assistant-input-row" id="assistantForm">
    <input type="text" id="assistantInput" placeholder="Bir soru yazın..." autocomplete="off" required>
    <button type="submit" class="assistant-send" aria-label="Gönder">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </form>
</div>

<div class="cookie-banner" id="cookieBanner" hidden>
  <p>Bu site deneyiminizi iyileştirmek için çerezler kullanır. <a href="${base}cerez-politikasi.html">Çerez Politikası</a></p>
  <div class="cookie-actions">
    <button class="btn btn-solid btn-sm" id="cookieAccept">Kabul Et</button>
    <button class="btn btn-outline-light btn-sm" id="cookieReject">Reddet</button>
  </div>
</div>

<script src="${base}script.js"></script>
`;
}

function renderClose() {
  return `</body>\n</html>\n`;
}

// trail: [{label, href?}] — the last item should have no href (current page).
function renderBreadcrumb(trail) {
  const items = trail
    .map((item) => {
      if (item.href) return `<a href="${item.href}">${escapeHtml(item.label)}</a>`;
      return `<span aria-current="page">${escapeHtml(item.label)}</span>`;
    })
    .join('<span class="breadcrumb-sep">/</span>');
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${items}</nav>`;
}

// items: [{label, url}] in order from home to current page.
function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.url
    }))
  };
}

module.exports = {
  SITE_URL,
  WHATSAPP,
  business,
  INDUSTRY_MENU_GROUPS,
  escapeHtml,
  formatDateTR,
  renderHead,
  renderHeader,
  renderFooter,
  renderWidgets,
  renderClose,
  renderBreadcrumb,
  breadcrumbJsonLd
};
