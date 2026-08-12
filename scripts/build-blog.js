// Generates the entire blog from content/articles/*.js:
//   - blog/<slug>.html for every article
//   - blog.html (hub page with category filter + search)
//   - the "Dijital Pazarlama Rehberi" preview block on the homepage
//   - sitemap.xml (all static pages + all blog URLs)
//
// Run with: npm run build:blog
// To add a new article: create content/articles/<slug>.js (copy the shape
// of an existing file) and re-run this script. Nothing else needs editing.

const fs = require('fs');
const path = require('path');
const {
  categories,
  articles,
  getCategory,
  getArticle,
  getRelated,
  readingTime,
  extractToc
} = require('../content');
const T = require('./blog-templates');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');
const AUTHOR_NAME = 'Caras Partner İçerik Ekibi';
const AUTHOR_DESC = 'Meta Ads, Google Ads ve SEO odaklı çalışan Caras Partner ekibi tarafından hazırlanmıştır.';

// ---------------------------------------------------------------------------
// Article page
// ---------------------------------------------------------------------------

const { renderBreadcrumb, breadcrumbJsonLd } = T;

function renderArticleCard(article, { base }) {
  const cat = getCategory(article.category);
  const minutes = readingTime(article.bodyHtml);
  return `<article class="blog-card">
  <a href="${base}blog/${article.slug}.html" class="blog-card-link">
    <span class="blog-card-cat cat-${article.category}">${T.escapeHtml(cat ? cat.name : '')}</span>
    <h3>${T.escapeHtml(article.title)}</h3>
    <p class="blog-card-excerpt">${T.escapeHtml(article.excerpt)}</p>
    <div class="blog-card-meta">
      <span>${minutes} dk okuma</span>
      <span class="blog-card-meta-sep">·</span>
      <span>${T.formatDateTR(article.updatedDate)}</span>
    </div>
    <span class="blog-card-cta">Devamını Oku <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  </a>
</article>`;
}

function renderArticlePage(article) {
  const base = '../';
  const cat = getCategory(article.category);
  const minutes = readingTime(article.bodyHtml);
  const toc = extractToc(article.bodyHtml);
  const related = getRelated(article, 3);
  const canonicalPath = `/blog/${article.slug}.html`;
  const url = `${T.SITE_URL}${canonicalPath}`;

  const breadcrumbTrail = [
    { label: 'Ana Sayfa', href: `${base}index.html` },
    { label: 'Bloglar', href: `${base}blog.html` },
    { label: cat ? cat.name : '', href: `${base}blog.html?kategori=${article.category}` },
    { label: article.title }
  ];

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.metaDescription,
      image: `${T.SITE_URL}/assets/logo-full.png`,
      author: { '@type': 'Organization', name: AUTHOR_NAME, url: T.SITE_URL },
      publisher: {
        '@type': 'Organization',
        name: 'Caras Partner',
        logo: { '@type': 'ImageObject', url: `${T.SITE_URL}/assets/logo-icon.png` }
      },
      datePublished: article.publishDate,
      dateModified: article.updatedDate,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url }
    },
    breadcrumbJsonLd([
      { label: 'Ana Sayfa', url: T.SITE_URL },
      { label: 'Bloglar', url: `${T.SITE_URL}/blog.html` },
      { label: article.title, url }
    ])
  ];

  if (article.faq && article.faq.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: article.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a }
      }))
    });
  }

  const tocHtml = toc.length
    ? `<nav class="article-toc" aria-label="İçindekiler">
  <p class="article-toc-title">İçindekiler</p>
  <ol>
    ${toc.map((t) => `<li><a href="#${t.id}">${T.escapeHtml(t.label)}</a></li>`).join('\n    ')}
  </ol>
</nav>`
    : '';

  const faqHtml = article.faq && article.faq.length
    ? `<div class="faq-list article-faq">
  ${article.faq
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
</div>`
    : '';

  const relatedHtml = related.length
    ? `<section class="related-section">
  <p class="kicker">İlgili Yazılar</p>
  <div class="blog-grid related-grid">
    ${related.map((a) => renderArticleCard(a, { base })).join('\n    ')}
  </div>
</section>`
    : '';

  const html =
    T.renderHead({
      base,
      title: `${article.title} — Caras Partner Blog`,
      description: article.metaDescription,
      canonicalPath,
      ogType: 'article',
      jsonLd
    }) +
    T.renderHeader(base) +
    `
<section class="article-hero">
  <div class="wrap">
    ${renderBreadcrumb(breadcrumbTrail)}
    <span class="blog-card-cat cat-${article.category}">${T.escapeHtml(cat ? cat.name : '')}</span>
    <h1>${T.escapeHtml(article.title)}</h1>
    <div class="article-meta">
      <span>${AUTHOR_NAME}</span>
      <span class="blog-card-meta-sep">·</span>
      <span>Yayınlanma: ${T.formatDateTR(article.publishDate)}</span>
      <span class="blog-card-meta-sep">·</span>
      <span>Güncelleme: ${T.formatDateTR(article.updatedDate)}</span>
      <span class="blog-card-meta-sep">·</span>
      <span>${minutes} dk okuma</span>
    </div>
  </div>
</section>

<section class="article-body-wrap">
  <div class="wrap article-layout">
    ${tocHtml}
    <div class="article-content">
      ${article.bodyHtml}
      ${faqHtml}
      <div class="cta-inline">
        <div>
          <h3>İşletmenizin dijital görünürlüğünü geliştirmek ister misiniz?</h3>
          <p>Caras Partner'dan işletmeniz için hangi kanalın daha uygun olduğunu öğrenmek üzere ücretsiz bir görüşme talep edin.</p>
        </div>
        <a href="${base}rezervasyon.html" class="btn btn-solid">Ücretsiz Görüşme Talep Edin</a>
      </div>
      <p class="article-author-note">${AUTHOR_DESC}</p>
    </div>
  </div>
</section>

<section class="section section-tint related-wrap">
  <div class="wrap">
    ${relatedHtml}
  </div>
</section>
` +
    T.renderFooter(base) +
    T.renderWidgets(base) +
    T.renderClose();

  fs.writeFileSync(path.join(BLOG_DIR, `${article.slug}.html`), html, 'utf8');
}

// ---------------------------------------------------------------------------
// Blog hub page (blog.html)
// ---------------------------------------------------------------------------

function renderBlogIndex() {
  const base = '';
  const pillar = articles.find((a) => a.pillar) || articles[0];
  const rest = articles.filter((a) => a.slug !== pillar.slug);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Caras Partner Dijital Pazarlama Rehberi',
      description: 'Meta Ads, Google Ads, SEO, web sitesi ve yapay zekâ destekli arama üzerine pratik rehberler.',
      url: `${T.SITE_URL}/blog.html`,
      publisher: { '@type': 'Organization', name: 'Caras Partner', logo: { '@type': 'ImageObject', url: `${T.SITE_URL}/assets/logo-icon.png` } }
    },
    breadcrumbJsonLd([
      { label: 'Ana Sayfa', url: T.SITE_URL },
      { label: 'Bloglar', url: `${T.SITE_URL}/blog.html` }
    ])
  ];

  const chips = [{ slug: 'tumu', name: 'Tümü' }, ...categories]
    .map(
      (c, i) =>
        `<button class="chip${i === 0 ? ' active' : ''}" data-filter="${c.slug === 'tumu' ? '' : c.slug}">${T.escapeHtml(c.name)}</button>`
    )
    .join('\n      ');

  const featuredCat = getCategory(pillar.category);
  const featuredHtml = `<article class="blog-card blog-card-featured">
  <a href="blog/${pillar.slug}.html" class="blog-card-link">
    <span class="blog-card-cat cat-${pillar.category}">${T.escapeHtml(featuredCat ? featuredCat.name : '')} · Başlangıç Rehberi</span>
    <h2>${T.escapeHtml(pillar.title)}</h2>
    <p class="blog-card-excerpt">${T.escapeHtml(pillar.excerpt)}</p>
    <div class="blog-card-meta">
      <span>${readingTime(pillar.bodyHtml)} dk okuma</span>
      <span class="blog-card-meta-sep">·</span>
      <span>${T.formatDateTR(pillar.updatedDate)}</span>
    </div>
    <span class="blog-card-cta">Devamını Oku <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  </a>
</article>`;

  const cardsHtml = rest
    .map(
      (a) =>
        `<div class="blog-grid-item" data-category="${a.category}" data-search="${T.escapeHtml((a.title + ' ' + a.excerpt).toLowerCase())}">
      ${renderArticleCard(a, { base })}
    </div>`
    )
    .join('\n    ');

  const html =
    T.renderHead({
      base,
      title: 'Dijital Pazarlama Rehberi — Caras Partner Blog',
      description: 'Meta Ads, Google Ads, SEO, web sitesi ve yapay zekâ destekli aramada görünürlük üzerine Türkçe, pratik rehberler.',
      canonicalPath: '/blog.html',
      jsonLd
    }) +
    T.renderHeader(base) +
    `
<section class="blog-hero">
  <div class="wrap">
    ${renderBreadcrumb([{ label: 'Ana Sayfa', href: 'index.html' }, { label: 'Bloglar' }])}
    <p class="kicker">Blog</p>
    <h1>Dijital Pazarlama Rehberi</h1>
    <p class="blog-hero-sub">Meta Ads, Google Ads, SEO, web sitesi ve yapay zekâ destekli aramada görünürlük üzerine hazırladığımız pratik rehberler. Caras Partner'ın işletmelerle çalışırken edindiği yaklaşımı, satış baskısı olmadan paylaşıyoruz.</p>
    <div class="blog-search-row">
      <input type="search" id="blogSearch" class="blog-search" placeholder="Yazılarda ara... (ör. Google İşletme Profili)" aria-label="Blog yazılarında ara">
    </div>
  </div>
</section>

<section class="section" id="blog-list">
  <div class="wrap">
    ${featuredHtml}

    <div class="chip-row" id="categoryFilter" role="group" aria-label="Kategoriye göre filtrele">
      ${chips}
    </div>

    <div class="blog-grid" id="blogGrid">
    ${cardsHtml}
    </div>

    <p class="blog-empty" id="blogEmpty" hidden>Aramanızla eşleşen bir yazı bulunamadı.</p>

    <div class="blog-loadmore-wrap">
      <button class="btn btn-outline" id="blogLoadMore">Daha Fazla Göster</button>
    </div>
  </div>
</section>
` +
    T.renderFooter(base) +
    T.renderWidgets(base) +
    `<script>
(() => {
  const grid = document.getElementById('blogGrid');
  if (!grid) return;
  const items = Array.from(grid.querySelectorAll('.blog-grid-item'));
  const chips = Array.from(document.querySelectorAll('#categoryFilter .chip'));
  const searchInput = document.getElementById('blogSearch');
  const emptyEl = document.getElementById('blogEmpty');
  const loadMoreBtn = document.getElementById('blogLoadMore');
  const PAGE_SIZE = 9;
  let activeCategory = '';
  let visibleCount = PAGE_SIZE;

  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    const matched = items.filter((item) => {
      const catOk = !activeCategory || item.dataset.category === activeCategory;
      const searchOk = !query || item.dataset.search.includes(query);
      return catOk && searchOk;
    });
    items.forEach((item) => { item.style.display = 'none'; });
    matched.slice(0, visibleCount).forEach((item) => { item.style.display = ''; });
    emptyEl.hidden = matched.length !== 0;
    loadMoreBtn.style.display = matched.length > visibleCount ? '' : 'none';
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.dataset.filter;
      visibleCount = PAGE_SIZE;
      applyFilters();
    });
  });

  searchInput.addEventListener('input', () => {
    visibleCount = PAGE_SIZE;
    applyFilters();
  });

  loadMoreBtn.addEventListener('click', () => {
    visibleCount += PAGE_SIZE;
    applyFilters();
  });

  const params = new URLSearchParams(window.location.search);
  const preselect = params.get('kategori');
  if (preselect) {
    const chip = chips.find((c) => c.dataset.filter === preselect);
    if (chip) chip.click();
  }

  applyFilters();
})();
</script>` +
    T.renderClose();

  fs.writeFileSync(path.join(ROOT, 'blog.html'), html, 'utf8');
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
// Note: sitemap.xml/robots.txt generation lives in scripts/build-sitemap.js
// (it needs to see blog + service + industry URLs together), run separately
// as the last step of `npm run build`.

function run() {
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

  articles.forEach(renderArticlePage);
  renderBlogIndex();

  console.log(`Built ${articles.length} article pages and blog.html. (Blog is no longer linked from the homepage — reachable via nav/footer "Blog" only, per client request.)`);
}

run();
