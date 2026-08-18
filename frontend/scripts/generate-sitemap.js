// Generates public/sitemap.xml before each build: static routes always,
// plus one <url> per product fetched from the backend API (best-effort —
// falls back to static-only routes if the API is unreachable, e.g. in CI
// without a live backend).
//
// Also injects Product/Offer JSON-LD for the live catalog into a marker
// block in public/index.html, so non-JS crawlers (most AI assistant bots
// don't execute JavaScript) see real product/price data from the static
// HTML alone, not just from the React app.
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

function productJsonLd(p) {
  return {
    "@type": "Product",
    name: p.name,
    description: p.short_description,
    image: [p.image_url, ...(p.gallery || [])].filter(Boolean),
    sku: p.id,
    brand: { "@type": "Brand", name: "Premium Oils" },
    offers: (p.variants || []).map((v) => ({
      "@type": "Offer",
      name: `${p.name} — ${v.size}`,
      price: v.price,
      priceCurrency: "INR",
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/product/${p.slug}`,
    })),
  };
}

function injectProductsJsonLd(products) {
  const htmlPath = path.join(__dirname, "..", "public", "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  const startMarker = "<!-- PRODUCTS_JSONLD:START -->";
  const endMarker = "<!-- PRODUCTS_JSONLD:END -->";
  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) {
    console.warn("PRODUCTS_JSONLD markers not found in index.html; skipping JSON-LD injection");
    return;
  }

  const graph = {
    "@context": "https://schema.org",
    "@graph": products.map(productJsonLd),
  };
  const block =
    `${startMarker}\n` +
    `        <!-- Generated at build time by scripts/generate-sitemap.js from live product\n` +
    `             data, so non-JS crawlers (most AI assistant bots included) see real\n` +
    `             product/price data without executing the React app. -->\n` +
    `        <script type="application/ld+json">\n${JSON.stringify(graph, null, 2)}\n        </script>\n` +
    `        ${endMarker}`;

  const newHtml = html.slice(0, startIdx) + block + html.slice(endIdx + endMarker.length);
  fs.writeFileSync(htmlPath, newHtml);
  console.log(`index.html updated with JSON-LD for ${products.length} products`);
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

  if (products.length > 0) {
    injectProductsJsonLd(products);
  } else {
    console.log("No products fetched; leaving existing index.html JSON-LD block untouched");
  }
}

main();
