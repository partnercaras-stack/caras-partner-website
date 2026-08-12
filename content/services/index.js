// Aggregates content/services/*.js (excluding this file and categories.js)
// into a single list, grouped by the 8 pillars in categories.js. Add a new
// service by dropping a new file here and re-running `npm run build:pages`.
const fs = require('fs');
const path = require('path');
const categories = require('./categories');

const SERVICES_DIR = __dirname;

const services = fs
  .readdirSync(SERVICES_DIR)
  .filter((f) => f.endsWith('.js') && f !== 'index.js' && f !== 'categories.js')
  .map((f) => require(path.join(SERVICES_DIR, f)));

function getGroup(slug) {
  return categories.find((c) => c.slug === slug);
}

function getService(slug) {
  return services.find((s) => s.slug === slug);
}

function servicesByGroup(groupSlug) {
  return services.filter((s) => s.group === groupSlug);
}

module.exports = { categories, services, getGroup, getService, servicesByGroup };
