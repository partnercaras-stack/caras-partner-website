// Aggregates content/industries/*.js into a single list. Add a new sector
// by dropping a new file here (same shape as the existing ones) and
// re-running `npm run build:pages`.
const fs = require('fs');
const path = require('path');

const INDUSTRIES_DIR = __dirname;

const industries = fs
  .readdirSync(INDUSTRIES_DIR)
  .filter((f) => f.endsWith('.js') && f !== 'index.js')
  .map((f) => require(path.join(INDUSTRIES_DIR, f)));

function getIndustry(slug) {
  return industries.find((i) => i.slug === slug);
}

module.exports = { industries, getIndustry };
