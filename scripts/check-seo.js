// Offline SEO validation over the built site (npm run check:seo / npm test).
// Fails (exit 1) on errors; prints warnings that don't block.
//
// Checks: sitemap XML well-formedness + every <loc> maps to a real, indexable
// page whose canonical equals the <loc>; robots.txt sitemap line; one <h1>
// per page; unique titles/descriptions; JSON-LD parses; no internal link to a
// ".html" URL (those 308-redirect on Cloudflare Pages); every internal link
// resolves to a file; no apex-host URLs; images have alt attributes.

const fs = require('fs');
const path = require('path');
const business = require('../content/business');

const ROOT = path.join(__dirname, '..');
const SITE = business.url;
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const PUBLIC_DIRS = ['', 'blog', 'hizmetler', 'sektorler'];
// Pages deliberately outside the sitemap (orphan/legacy or error pages).
const NOT_IN_SITEMAP = new Set(['404.html', 'case-studies.html']);

const pages = [];
PUBLIC_DIRS.forEach((d) => {
  const abs = path.join(ROOT, d);
  fs.readdirSync(abs).filter((f) => f.endsWith('.html')).forEach((f) => pages.push(path.posix.join(d, f)));
});

// Resolve a site path (no extension) to a file on disk the way Cloudflare Pages does.
function fileForPath(p) {
  let clean = decodeURI(p.split(/[?#]/)[0]);
  if (clean === '' || clean === '/') return 'index.html';
  clean = clean.replace(/^\//, '').replace(/\/$/, '');
  if (fs.existsSync(path.join(ROOT, clean)) && fs.statSync(path.join(ROOT, clean)).isFile()) return clean;
  if (fs.existsSync(path.join(ROOT, `${clean}.html`))) return `${clean}.html`;
  if (fs.existsSync(path.join(ROOT, clean, 'index.html'))) return path.posix.join(clean, 'index.html');
  return null;
}

function urlPathOf(file) {
  if (file === 'index.html') return '/';
  return '/' + file.replace(/\.html$/, '');
}

const titles = new Map();
const descs = new Map();
const canonicals = new Map();

pages.forEach((file) => {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const noindex = /<meta name="robots" content="[^"]*noindex/i.test(html);

  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  const h1s = (html.match(/<h1[\s>]/g) || []).length;

  if (!title) err(`${file}: missing <title>`);
  if (!desc) err(`${file}: missing meta description`);
  if (h1s !== 1) err(`${file}: expected exactly one <h1>, found ${h1s}`);
  if (!noindex) {
    if (!canonical) err(`${file}: missing canonical`);
    else {
      const expected = SITE + urlPathOf(file);
      if (canonical !== expected) err(`${file}: canonical ${canonical} != ${expected}`);
      canonicals.set(canonical, file);
    }
    if (!/<meta property="og:title"/.test(html)) err(`${file}: missing og:title`);
    if (!/<meta name="twitter:card"/.test(html)) err(`${file}: missing twitter:card`);
    if (title) titles.set(title, [...(titles.get(title) || []), file]);
    if (desc) {
      descs.set(desc, [...(descs.get(desc) || []), file]);
      if (desc.length > 170) warn(`${file}: meta description ${desc.length} chars (>170)`);
      if (desc.length < 70) warn(`${file}: meta description ${desc.length} chars (<70)`);
    }
  }

  // JSON-LD
  const ldRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  while ((m = ldRe.exec(html))) {
    try { JSON.parse(m[1]); } catch (e) { err(`${file}: invalid JSON-LD (${e.message})`); }
  }

  // apex host leftovers
  if (SITE !== 'https://caraspartner.com' && /https?:\/\/caraspartner\.com/.test(html)) {
    err(`${file}: contains non-canonical host https://caraspartner.com`);
  }

  // internal links
  const dir = path.posix.dirname(file) === '.' ? '' : path.posix.dirname(file);
  const hrefRe = /href="([^"]+)"/g;
  while ((m = hrefRe.exec(html))) {
    const href = m[1];
    if (/^(mailto:|tel:|#|javascript:|data:)/i.test(href)) continue;
    let sitePath;
    if (/^https?:\/\//.test(href)) {
      if (!href.startsWith(SITE)) continue; // external
      sitePath = href.slice(SITE.length) || '/';
    } else if (href.startsWith('//')) continue;
    else {
      // Resolve relative to the page's URL directory. Extensionless pages
      // live at /dir/name, so relative links resolve against /dir/.
      const baseUrl = new URL(`https://x/${dir ? dir + '/' : ''}`);
      sitePath = new URL(href, baseUrl).pathname;
    }
    if (/\.html(?=$|[?#])/.test(href)) err(`${file}: internal link to .html URL (redirects): ${href}`);
    if (/\.(css|js|png|jpe?g|webp|svg|ico|xml|txt|avif)$/i.test(sitePath)) {
      if (!fs.existsSync(path.join(ROOT, decodeURI(sitePath)))) err(`${file}: missing asset ${href}`);
      continue;
    }
    if (!fileForPath(sitePath)) err(`${file}: broken internal link ${href}`);
  }

  // images without alt
  const imgRe = /<img\b[^>]*>/g;
  while ((m = imgRe.exec(html))) {
    if (!/\balt=/.test(m[0])) err(`${file}: <img> without alt: ${m[0].slice(0, 80)}`);
  }
});

titles.forEach((files, t) => { if (files.length > 1) err(`duplicate title "${t}": ${files.join(', ')}`); });
descs.forEach((files, d) => { if (files.length > 1) err(`duplicate description on: ${files.join(', ')}`); });

// sitemap
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
if (!/^<\?xml version="1.0" encoding="UTF-8"\?>\s*<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">[\s\S]*<\/urlset>\s*$/.test(sitemap)) {
  err('sitemap.xml: unexpected structure');
}
const opens = (sitemap.match(/<url>/g) || []).length;
const closes = (sitemap.match(/<\/url>/g) || []).length;
if (opens !== closes) err('sitemap.xml: unbalanced <url> tags');
const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((x) => x[1]);
if (new Set(locs).size !== locs.length) err('sitemap.xml: duplicate <loc>');
locs.forEach((loc) => {
  if (!loc.startsWith(SITE + '/')) err(`sitemap: non-canonical host ${loc}`);
  if (/\.html$/.test(loc)) err(`sitemap: .html URL ${loc}`);
  if (/[&<>"']/.test(loc)) err(`sitemap: unescaped char in ${loc}`);
  if (!canonicals.has(loc)) err(`sitemap: ${loc} is not a self-canonical indexable page`);
});
[...sitemap.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)].forEach((x) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x[1])) err(`sitemap: bad lastmod ${x[1]}`);
});
canonicals.forEach((file, url) => {
  if (!locs.includes(url) && !NOT_IN_SITEMAP.has(file)) warn(`indexable page not in sitemap: ${url}`);
});

// robots
const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) err('robots.txt: missing/incorrect Sitemap line');
if (/^Disallow:\s*\/\s*$/m.test(robots)) err('robots.txt: blocks the whole site');

// 404 page must exist for Cloudflare Pages to return real 404s
if (!fs.existsSync(path.join(ROOT, '404.html'))) err('404.html missing (Cloudflare Pages would serve the homepage with 200 for unknown URLs)');

warnings.forEach((w) => console.warn(`WARN  ${w}`));
errors.forEach((e) => console.error(`ERROR ${e}`));
console.log(`\nChecked ${pages.length} pages, ${locs.length} sitemap URLs: ${errors.length} errors, ${warnings.length} warnings.`);
process.exit(errors.length ? 1 : 0);
