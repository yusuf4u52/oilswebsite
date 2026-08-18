import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getProduct, getAllProductSlugs } from "@/lib/server-api";
import { buildProductJsonLd } from "@/lib/jsonld";
import { SITE_URL } from "@/constants/seo";
import { pageMetadata } from "@/lib/metadata";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  return pageMetadata({
    title: p.name,
    description: p.short_description,
    path: `/product/${p.slug}`,
    image: p.image_url,
  });
}

export default async function ProductDetail({ params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const productJsonLd = buildProductJsonLd(p, SITE_URL);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 fade-in">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="grid md:grid-cols-12 gap-10">
        <div className="md:col-span-6">
          <div className="aspect-square rounded-[2rem] overflow-hidden" style={{ background: "var(--bg-2)" }}>
            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover"/>
          </div>
          {p.gallery.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {p.gallery.map((g, idx) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden" style={{ background: "var(--bg-2)" }}>
                  <img src={g} alt={`${p.name} — view ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async"/>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="md:col-span-6">
          <div className="label" style={{ color: "var(--amber)" }}>{p.category}</div>
          <h1 className="serif text-4xl sm:text-5xl mt-2 leading-tight">{p.name}</h1>
          <p className="mt-4 text-lg" style={{ color: "var(--ink-2)" }}>{p.short_description}</p>

          <ProductPurchasePanel product={p} />

          <div className="mt-8 divider"/>
          <div className="mt-8">
            <div className="label mb-3">Why you&apos;ll love it</div>
            <ul className="space-y-3">
              {p.highlights.map((h) => (
                <li key={h} className="flex items-center gap-3"><Check size={16} style={{ color: "var(--brand)" }}/> {h}</li>
              ))}
            </ul>
          </div>
          <div className="mt-8">
            <div className="label mb-3">About this oil</div>
            <p className="leading-relaxed" style={{ color: "var(--ink-2)" }}>{p.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
