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
  'mesafeli-satis-sozlesmesi.html'
];

const HEADER_RE = /<header class="site-header" id="top">[\s\S]*?<\/header>/;
const FOOTER_RE = /<footer class="site-footer">[\s\S]*?<\/footer>/;

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
    const newHeader = T.renderHeader('', { isHome: file === 'index.html' }).replace(/\n$/, '');
    const newFooter = T.renderFooter('').replace(/\n$/, '');

    html = html.replace(HEADER_RE, newHeader);
    html = html.replace(FOOTER_RE, newFooter);

    if (html !== before) {
      fs.writeFileSync(fp, html, 'utf8');
      changed++;
    }
  });
  console.log(`Synced header/footer chrome across ${PAGES.length} pages (${changed} changed).`);
}

run();
