// Final build step (run after sync:chrome). Normalizes every public HTML page
// to the site's canonical URL scheme so that canonical tags, og:url, JSON-LD
// and internal links all point at URLs that answer 200 directly:
//
//   1. Cloudflare Pages serves "/page" for "page.html" and 308-redirects any
//      "*.html" request to the extensionless URL. Links/canonicals that keep
//      ".html" therefore point at a redirect, so ".html" is stripped from
//      internal hrefs and absolute site URLs ("index.html" becomes its folder).
//   2. Any absolute URL on the apex host is rewritten to the canonical host
//      from content/business.js (https://www.caraspartner.com).
//   3. Pages missing Open Graph / Twitter Card tags get them, derived from the
//      page's own <title>, meta description and canonical — nothing invented.
//
// Idempotent: running it twice yields the same output.

const fs = require('fs');
const path = require('path');
const business = require('../content/business');

const ROOT = path.join(__dirname, '..');
const SITE_URL = business.url; // e.g. https://www.caraspartner.com
const DIRS = ['', 'blog', 'hizmetler', 'sektorler'];

function listHtml() {
  const files = [];
  DIRS.forEach((dir) => {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) return;
    fs.readdirSync(abs)
      .filter((f) => f.endsWith('.html'))
      .forEach((f) => files.push(path.join(dir, f)));
  });
  return files;
}

// "../hizmetler/seo.html#x" -> "../hizmetler/seo#x"; "index.html" -> "./";
// "../index.html#surec" -> "../#surec".
function cleanPath(p) {
  const m = p.match(/^([^?#]*?)\.html([?#].*)?$/);
  if (!m) return p;
  let stem = m[1];
  const rest = m[2] || '';
  if (stem === 'index') stem = './';
  else if (stem.endsWith('/index')) stem = stem.slice(0, -'index'.length);
  return stem + rest;
}

function normalizeAbsolute(html) {
  // Apex -> canonical host (only when the canonical host differs).
  const apex = 'https://caraspartner.com';
  if (SITE_URL !== apex) {
    html = html.replace(/https?:\/\/caraspartner\.com(?=[/"'\s<)\],]|$)/g, SITE_URL);
  }
  // Strip .html from absolute site URLs (canonical, og:url, JSON-LD, etc.).
  const host = SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${host}(/[^"'\\s<>]*?)\\.html(?=[?#"'\\s<>]|$)`, 'g');
  html = html.replace(re, (_, p) => {
    if (p === '/index') return `${SITE_URL}/`;
    if (p.endsWith('/index')) return `${SITE_URL}${p.slice(0, -'index'.length)}`;
    return `${SITE_URL}${p}`;
  });
  return html;
}

function normalizeRelativeHrefs(html) {
  return html.replace(/href="([^"]+)"/g, (full, href) => {
    if (/^(https?:|mailto:|tel:|#|\/\/|data:|javascript:)/i.test(href)) return full;
    return `href="${cleanPath(href)}"`;
  });
}

function attr(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

// Self-referencing canonical for indexable pages that lack one (derived from
// the file's own clean URL). Pages marked noindex are left alone.
function ensureCanonical(html, rel) {
  if (/<link rel="canonical"/.test(html)) return html;
  if (/<meta name="robots" content="[^"]*noindex/i.test(html)) return html;
  const urlPath = rel === 'index.html' ? '/' : '/' + rel.replace(/\\/g, '/').replace(/\.html$/, '');
  return html.replace(/(<meta name="description" content="[^"]*">)/, `$1\n<link rel="canonical" href="${SITE_URL}${urlPath}">`);
}

function ensureSocialMeta(html) {
  if (/<meta property="og:title"/.test(html)) return html;
  const title = attr(html, /<title>([^<]*)<\/title>/);
  const desc = attr(html, /<meta name="description" content="([^"]*)"/);
  const canonical = attr(html, /<link rel="canonical" href="([^"]*)"/);
  if (!title || !desc || !canonical) return html;
  const tags = [
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Caras Partner">',
    '<meta property="og:locale" content="tr_TR">',
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${desc}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${business.logoFull}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${desc}">`,
    `<meta name="twitter:image" content="${business.logoFull}">`
  ].join('\n');
  return html.replace(/(<link rel="canonical" href="[^"]*">)/, `$1\n${tags}`);
}

function run() {
  let changed = 0;
  const files = listHtml();
  files.forEach((rel) => {
    const fp = path.join(ROOT, rel);
    const before = fs.readFileSync(fp, 'utf8');
    let html = normalizeAbsolute(before);
    html = normalizeRelativeHrefs(html);
    html = ensureCanonical(html, rel);
    html = ensureSocialMeta(html);
    if (html !== before) {
      fs.writeFileSync(fp, html, 'utf8');
      changed++;
    }
  });
  console.log(`Finalized SEO URLs/meta across ${files.length} HTML files (${changed} changed).`);
}

if (require.main === module) run();
module.exports = { cleanPath, normalizeAbsolute, normalizeRelativeHrefs };
