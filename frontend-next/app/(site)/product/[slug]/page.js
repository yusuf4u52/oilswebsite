import { notFound } from "next/navigation";
import Image from "next/image";
import { Check } from "lucide-react";
import { getProduct, getAllProductSlugs, getProductReviews } from "@/lib/server-api";
import { buildProductJsonLd } from "@/lib/jsonld";
import { SITE_URL, toAbsoluteUrl } from "@/constants/seo";
import { pageMetadata } from "@/lib/metadata";
import ProductMainImage from "@/components/ProductMainImage";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import ProductReviews from "@/components/ProductReviews";
import ScrollToReviewsLink from "@/components/ScrollToReviewsLink";
import { ProductReviewsProvider } from "@/context/ProductReviewsContext";
import { ProductVariantProvider } from "@/context/ProductVariantContext";

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
    image: toAbsoluteUrl(p.image_url),
  });
}

export default async function ProductDetail({ params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const { reviews, summary } = await getProductReviews(p.id);
  const productJsonLd = buildProductJsonLd(p, SITE_URL, summary);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 fade-in">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductReviewsProvider initialReviews={reviews} initialSummary={summary}>
        <ProductVariantProvider product={p}>
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-6">
              <div className="relative aspect-square rounded-[2rem] overflow-hidden" style={{ background: "var(--bg-2)" }}>
                <ProductMainImage product={p} />
              </div>
              {p.gallery.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {p.gallery.map((g, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden" style={{ background: "var(--bg-2)" }}>
                      <Image src={g} alt={`${p.name} — view ${idx + 1}`} fill className="object-cover" sizes="12vw"/>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-6">
              <div className="label" style={{ color: "var(--amber)" }}>{p.category}</div>
              <h1 className="serif text-4xl sm:text-5xl mt-2 leading-tight">{p.name}</h1>
              <p className="mt-4 text-lg" style={{ color: "var(--ink-2)" }}>{p.short_description}</p>

              <ScrollToReviewsLink />

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

          <ProductReviews productSlug={p.slug} />
        </ProductVariantProvider>
      </ProductReviewsProvider>
    </div>
  );
}
