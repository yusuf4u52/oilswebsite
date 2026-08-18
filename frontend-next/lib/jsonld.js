export function buildProductJsonLd(p, siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.short_description,
    image: [p.image_url, ...(p.gallery || [])].filter(Boolean),
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
}
