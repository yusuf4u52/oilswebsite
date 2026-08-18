import { SITE_URL } from "@/constants/seo";
import { getProducts } from "@/lib/server-api";

const STATIC_ROUTES = [
  { url: "/", priority: 1.0, changeFrequency: "daily" },
  { url: "/shop", priority: 0.9, changeFrequency: "daily" },
  { url: "/about", priority: 0.5, changeFrequency: "monthly" },
  { url: "/contact", priority: 0.5, changeFrequency: "monthly" },
];

export default async function sitemap() {
  const products = await getProducts();

  return [
    ...STATIC_ROUTES.map((r) => ({ ...r, url: `${SITE_URL}${r.url}` })),
    ...products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      priority: 0.8,
      changeFrequency: "weekly",
    })),
  ];
}
