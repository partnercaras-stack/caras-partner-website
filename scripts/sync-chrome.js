// Keeps the <header>...</header> and <footer>...</footer> markup identical
// across every hand-authored root page (nav mega-menu, footer columns) by
// regenerating them from the same renderHeader()/renderFooter() functions
// used for the generated blog/service/industry pages. Run after build:pages.
//
// case-studies.html is intentionally excluded — it's an orphaned page (not
// linked from nav/footer anywhere) left untouched by design.

const fs = require('fs');
const path = require('path');
const T = require('./blog-templates');

const ROOT = path.join(__dirname, '..');

const PAGES = [
  'index.html',
  'iletisim.html',
  'sss.html',
  'rezervasyon.html',
  'neden-caras.html',
  'kvkk-gizlilik.html',
  'cerez-politikasi.html',
  'kullanim-kosullari.html',
  'mesafeli-satis-sozlesmesi.html',
  // Served by Cloudflare Pages for any unknown URL (real HTTP 404 instead of
  // the homepage with 200). It can be served at any depth, so it uses
  // root-absolute links (base '/').
  '404.html'
];

const HEADER_RE = /<header class="site-header" id="top">[\s\S]*?<\/header>/;
const FOOTER_RE = /<footer class="site-footer">[\s\S]*?<\/footer>/;

// Homepage "Hizmetlerimiz" block: links straight to the core service pages
// (crawlable <a href> tiles, same markup/styles as the /hizmetler hub). The
// tiles are lifted from the freshly generated hizmetler.html so icons and
// excerpts never drift from content/services/*.js. Injected between markers.
const HOME_SERVICE_SLUGS = ['google-ads', 'meta-ads', 'web-tasarim', 'seo', 'sosyal-medya', 'ai-otomasyon'];
const HOME_SERVICES_RE = /<!-- HOME-SERVICES:START -->[\s\S]*?<!-- HOME-SERVICES:END -->/;

function renderHomeServices() {
  const hub = fs.readFileSync(path.join(ROOT, 'hizmetler.html'), 'utf8');
  const tiles = HOME_SERVICE_SLUGS.map((slug) => {
    const re = new RegExp(`<a href="hizmetler/${slug}(?:\\.html)?" class="tile-card">[\\s\\S]*?</a>`);
    const m = hub.match(re);
    if (!m) throw new Error(`hizmetler.html: tile for ${slug} not found`);
    return m[0].replace('class="tile-card"', 'class="tile-card reveal"');
  });
  return `<!-- HOME-SERVICES:START -->
<section class="section" id="hizmetlerimiz">
  <div class="wrap">
    <div class="section-head">
      <p class="kicker reveal">Hizmetlerimiz</p>
      <h2 class="reveal">Reklamdan web sitesine, büyümenin her adımında yanınızdayız.</h2>
    </div>
    <div class="tile-grid">
      ${tiles.join('\n      ')}
    </div>
    <p class="reveal" style="margin-top:28px"><a href="hizmetler.html" class="btn btn-outline">Tüm Hizmetleri Gör</a></p>
  </div>
</section>
<!-- HOME-SERVICES:END -->`;
}

function run() {
  let changed = 0;
  PAGES.forEach((file) => {
    const fp = path.join(ROOT, file);
    let html = fs.readFileSync(fp, 'utf8');
    const before = html;

    if (!HEADER_RE.test(html)) throw new Error(`${file}: could not find <header class="site-header"> block`);
    if (!FOOTER_RE.test(html)) throw new Error(`${file}: could not find <footer class="site-footer"> block`);

    // renderHeader/renderFooter return a trailing newline + wrap the tag in
    // its own markup; strip that trailing newline so indentation matches
    // what was already on disk for these hand-authored files. index.html is
    // the homepage itself, so its brand link stays a same-page "#top" anchor
    // instead of a full navigation to index.html.
    const base = file === '404.html' ? '/' : '';
    const newHeader = T.renderHeader(base, { isHome: file === 'index.html' }).replace(/\n$/, '');
    const newFooter = T.renderFooter(base).replace(/\n$/, '');

    html = html.replace(HEADER_RE, newHeader);
    html = html.replace(FOOTER_RE, newFooter);
    if (file === 'index.html') {
      if (!HOME_SERVICES_RE.test(html)) throw new Error('index.html: HOME-SERVICES markers missing');
      html = html.replace(HOME_SERVICES_RE, renderHomeServices());
    }

    if (html !== before) {
      fs.writeFileSync(fp, html, 'utf8');
      changed++;
    }
  });
  console.log(`Synced header/footer chrome across ${PAGES.length} pages (${changed} changed).`);
}

run();
