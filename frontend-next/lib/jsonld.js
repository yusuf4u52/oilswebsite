import { toAbsoluteUrl } from "@/constants/seo";

export function buildProductJsonLd(p, siteUrl, ratingSummary) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.short_description,
    image: [p.image_url, ...(p.gallery || [])].filter(Boolean).map(toAbsoluteUrl),
    sku: p.id,
    brand: { "@type": "Brand", name: "Premium Oils" },
    offers: p.variants.map((v) => ({
      "@type": "Offer",
      name: `${p.name} — ${v.size}`,
      price: v.price,
      priceCurrency: "INR",
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteUrl}/product/${p.slug}`,
    })),
  };
  // Google requires aggregateRating to be backed by visible on-page review
  // content, not just markup - only add it when real reviews exist.
  if (ratingSummary && ratingSummary.count > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingSummary.average,
      reviewCount: ratingSummary.count,
    };
  }
  return jsonLd;
}
