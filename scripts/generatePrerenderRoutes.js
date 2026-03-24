const fs = require('fs');
const path = require('path');

const suburbs = require('../frontend/src/data/melbourneSuburbs.json');

const staticRoutes = [
  '/',
  '/airport-taxi-melbourne',
  '/airport-transfer/melbourne',
  '/contact',
  '/services',
];

const suburbRoutes = suburbs
  .filter((suburb) => suburb && suburb.slug)
  .map((suburb) => `/airport-transfer/melbourne/${suburb.slug}`);

const routes = [...new Set([...staticRoutes, ...suburbRoutes])];
const outputPath = path.join(__dirname, '..', 'docs', 'prerender-routes.json');

fs.writeFileSync(outputPath, JSON.stringify(routes, null, 2));
console.log(`Wrote ${routes.length} prerender routes to ${outputPath}`);
