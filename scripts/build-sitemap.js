// Single authoritative sitemap.xml + robots.txt generator. Pulls URLs from
// every content source (blog, services, industries, bolu) plus the static
// pages, so there is exactly one place that knows the site's full URL list.
// Run last in the build pipeline: npm run build:sitemap (after build:blog
// and build:pages).

const fs = require('fs');
const path = require('path');
const { articles } = require('../content');
const { services } = require('../content/services');
const { industries } = require('../content/industries');
const T = require('./blog-templates');

const ROOT = path.join(__dirname, '..');

function buildSitemap() {
  const staticPages = [
    { loc: '/', priority: '1.0' },
    { loc: '/bolu.html', priority: '0.9' },
    { loc: '/hizmetler.html', priority: '0.9' },
    { loc: '/sektorler.html', priority: '0.9' },
    { loc: '/blog.html', priority: '0.9' },
    { loc: '/neden-caras.html', priority: '0.6' },
    { loc: '/iletisim.html', priority: '0.7' },
    { loc: '/rezervasyon.html', priority: '0.7' },
    { loc: '/sss.html', priority: '0.6' },
    { loc: '/kvkk-gizlilik.html', priority: '0.3' },
    { loc: '/cerez-politikasi.html', priority: '0.3' },
    { loc: '/kullanim-kosullari.html', priority: '0.3' },
    { loc: '/mesafeli-satis-sozlesmesi.html', priority: '0.3' }
  ];

  const servicePages = services.map((s) => ({ loc: `/hizmetler/${s.slug}.html`, priority: '0.85' }));
  const industryPages = industries.map((i) => ({ loc: `/sektorler/${i.slug}.html`, priority: '0.85' }));
  const blogPages = articles.map((a) => ({
    loc: `/blog/${a.slug}.html`,
    lastmod: a.updatedDate,
    priority: a.pillar ? '0.9' : '0.8'
  }));

  const urls = [...staticPages, ...servicePages, ...industryPages, ...blogPages]
    .map((p) => {
      const lastmod = p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${T.SITE_URL}${p.loc}</loc>${lastmod}\n    <priority>${p.priority}</priority>\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  return staticPages.length + servicePages.length + industryPages.length + blogPages.length;
}

function buildRobots() {
  const content = `User-agent: *\nAllow: /\n\nSitemap: ${T.SITE_URL}/sitemap.xml\n`;
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), content, 'utf8');
}

function run() {
  const count = buildSitemap();
  buildRobots();
  console.log(`Built sitemap.xml (${count} URLs) and robots.txt.`);
}

run();
