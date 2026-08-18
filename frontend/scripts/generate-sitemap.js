// Generates public/sitemap.xml before each build: static routes always,
// plus one <url> per product fetched from the backend API (best-effort —
// falls back to static-only routes if the API is unreachable, e.g. in CI
// without a live backend).
const fs = require("fs");
const path = require("path");

const SITE_URL = (process.env.REACT_APP_SITE_URL || "https://www.premiumoils.in").replace(/\/$/, "");
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/shop", priority: "0.9", changefreq: "daily" },
  { path: "/about", priority: "0.5", changefreq: "monthly" },
  { path: "/contact", priority: "0.5", changefreq: "monthly" },
];

function urlEntry({ path: p, priority, changefreq }) {
  return `  <url>\n    <loc>${SITE_URL}${p}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

async function fetchProducts() {
  if (!BACKEND_URL) return [];
  try {
    const res = await fetch(`${BACKEND_URL}/api/products`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.products ?? [];
  } catch {
    return [];
  }
}

async function main() {
  const products = await fetchProducts();
  const entries = [
    ...STATIC_ROUTES.map(urlEntry),
    ...products.map((p) =>
      urlEntry({ path: `/product/${p.slug}`, priority: "0.8", changefreq: "weekly" })
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

  const outPath = path.join(__dirname, "..", "public", "sitemap.xml");
  fs.writeFileSync(outPath, xml);
  console.log(`sitemap.xml written with ${entries.length} URLs (${products.length} products)`);
}

main();
