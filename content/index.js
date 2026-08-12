// Aggregates every file in content/articles/ into a single sorted list and
// exposes small helpers used by scripts/build-blog.js. To add a new article,
// drop a new file into content/articles/ (same shape as the existing ones)
// and re-run `npm run build:blog` — nothing here needs to change.
const fs = require('fs');
const path = require('path');
const categories = require('./categories');

const ARTICLES_DIR = path.join(__dirname, 'articles');

const articles = fs
  .readdirSync(ARTICLES_DIR)
  .filter((f) => f.endsWith('.js'))
  .map((f) => require(path.join(ARTICLES_DIR, f)))
  .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

function getCategory(slug) {
  return categories.find((c) => c.slug === slug);
}

function getArticle(slug) {
  return articles.find((a) => a.slug === slug);
}

function wordCount(html) {
  const text = String(html).replace(/<[^>]+>/g, ' ');
  return (text.match(/\S+/g) || []).length;
}

function readingTime(html) {
  return Math.max(3, Math.round(wordCount(html) / 180));
}

// Pulls the table of contents straight out of the <h2 id="..."> tags in the
// article body, so authors never have to maintain a separate TOC list.
function extractToc(html) {
  const re = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g;
  const toc = [];
  let m;
  while ((m = re.exec(html))) {
    toc.push({ id: m[1], label: m[2].replace(/<[^>]+>/g, '').trim() });
  }
  return toc;
}

function getRelated(article, limit = 3) {
  const explicit = (article.relatedSlugs || []).map(getArticle).filter(Boolean);
  if (explicit.length >= limit) return explicit.slice(0, limit);
  const usedSlugs = new Set([article.slug, ...explicit.map((a) => a.slug)]);
  const sameCategory = articles.filter((a) => a.category === article.category && !usedSlugs.has(a.slug));
  return [...explicit, ...sameCategory].slice(0, limit);
}

module.exports = {
  categories,
  articles,
  getCategory,
  getArticle,
  getRelated,
  readingTime,
  wordCount,
  extractToc
};
