import Link from "next/link";
import { ArrowRight, Leaf, Droplet } from "lucide-react";
import { inr } from "@/lib/utils";
import { getProducts } from "@/lib/server-api";
import HeroMedia from "@/components/HeroMedia";
import { DEFAULT_TITLE } from "@/constants/seo";

export const revalidate = 60;

// `title.absolute` explicitly bypasses the root layout's `%s | Premium
// Oils` template — DEFAULT_TITLE already IS the full homepage title, so it
// must not be run through that template a second time.
export const metadata = {
  title: { absolute: DEFAULT_TITLE },
};

export default async function Home() {
  const products = await getProducts();

  return (
    <div>
      {/* SHOP NOW — products, first thing on the page */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pt-10 pb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="label">Shop Now</div>
            <h1 className="serif text-4xl sm:text-5xl mt-2">Fresh from the ghani.</h1>
            <p className="mt-3 text-sm max-w-md" style={{ color: "var(--ink-2)" }}>
              Cold-pressed groundnut, coconut and almond oils — bottled within 48 hours, delivered to your door.
            </p>
          </div>
          <Link data-testid="products-view-all" href="/shop" className="text-sm underline underline-offset-4 whitespace-nowrap">Shop all</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 8).map((p) => {
            const from = Math.min(...p.variants.map((v) => v.price));
            return (
              <Link data-testid={`bestseller-${p.slug}`} href={`/product/${p.slug}`} key={p.id} className="product-tile block">
                <div className="aspect-square rounded-xl overflow-hidden bg-white">
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" decoding="async"/>
                </div>
                <div className="mt-4">
                  <div className="label" style={{ color: "var(--amber)" }}>{p.category}</div>
                  <div className="serif text-xl mt-1">{p.name}</div>
                  <div className="mt-2 text-sm" style={{ color: "var(--ink-2)" }}>from {inr(from)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pt-6 pb-24">
        <div className="grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-7 fade-in">
            <div className="chip">Kachi Ghani · Cold-pressed · Small batch · India</div>
            <h2 className="serif mt-6 text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight">
              Liquid gold,<br/>
              <span style={{ color: "var(--brand)" }}>the way it should be.</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg" style={{ color: "var(--ink-2)" }}>
              Wood-pressed groundnut, virgin coconut and best quality almond oils —
              extracted slowly, bottled honestly, delivered to your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link data-testid="hero-shop-btn" href="/shop" className="btn-primary">
                Shop the Range <ArrowRight size={16}/>
              </Link>
              <Link data-testid="hero-learn-btn" href="/shop?category=groundnut" className="btn-ghost">Explore Groundnut</Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg">
              {[
                { icon: Leaf, t: "100% Natural" },
                { icon: Droplet, t: "Cold-Pressed" },
              ].map(({ icon: Ic, t }) => (
                <div key={t} className="text-sm flex items-center gap-2">
                  <Ic size={16} style={{ color: "var(--brand)" }} /> {t}
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-5 relative">
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] grain" style={{ background: "var(--bg-2)" }}>
              <HeroMedia />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white border rounded-2xl p-4 shadow-sm hidden sm:block" style={{ borderColor: "var(--line)" }}>
              <div className="label">Free delivery</div>
              <div className="serif text-lg">on orders above ₹499</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
