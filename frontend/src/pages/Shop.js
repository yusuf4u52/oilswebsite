import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api, { inr } from "@/lib/api";
import SEO from "@/components/SEO";

const CATS = [
  { key: "all", label: "All Oils" },
  { key: "groundnut", label: "Groundnut" },
  { key: "coconut", label: "Coconut" },
  { key: "almond", label: "Almond" },
];

const CAT_SEO = {
  all: {
    title: "Shop Kachi Ghani Cold-Pressed Oils Online",
    description: "Shop our full range of Kachi Ghani (kacchi ghani) wood-pressed groundnut, coconut and almond oils. 100% natural, shuddh, and delivered fresh across India.",
    keywords: "kachi ghani, kacchi ghani, kachhi ghani, कच्ची घानी तेल, cold pressed oil online, wood pressed oil, groundnut oil, coconut oil, almond oil, buy oil online India",
  },
  groundnut: {
    title: "Buy Kachi Ghani Groundnut Oil Online",
    description: "Wood-pressed Kachi Ghani groundnut oil — also spelled kacchi ghani or kachhi ghani (कच्ची घानी) — extracted slowly at low RPM to preserve nutrients and flavour. Bottled within 48 hours, delivered fresh across India.",
    keywords: "kachi ghani groundnut oil, kacchi ghani groundnut oil, kachhi ghani, kacha ghani, कच्ची घानी तेल, मूंगफली का तेल, wood pressed groundnut oil, cold pressed groundnut oil, lakdi ghani oil, buy groundnut oil online India",
  },
  coconut: {
    title: "Buy Virgin Coconut Oil Online",
    description: "Cold-pressed virgin coconut oil (नारियल तेल), unrefined and honest. Extracted the traditional way and delivered fresh across India.",
    keywords: "virgin coconut oil, cold pressed coconut oil, नारियल तेल, kachi ghani coconut oil, buy coconut oil online India",
  },
  almond: {
    title: "Buy Cold-Pressed Almond Oil Online",
    description: "Cold-pressed almond oil (बादाम तेल), 100% natural with no refining and no shortcuts. Bottled fresh and delivered across India.",
    keywords: "cold pressed almond oil, बादाम तेल, almond oil online India, shuddh badam tel",
  },
};

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const cat = params.get("category") || "all";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/products${cat && cat !== "all" ? `?category=${cat}` : ""}`)
      .then((r) => setProducts(r.data.products ?? []))
      .finally(() => setLoading(false));
  }, [cat]);

  const seo = CAT_SEO[cat] || CAT_SEO.all;

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-14">
      <SEO title={seo.title} description={seo.description} keywords={seo.keywords} path="/shop" />
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="label">Shop</div>
          <h1 className="serif text-5xl sm:text-6xl mt-2">The full pantry.</h1>
        </div>
        <div className="flex gap-2 no-scrollbar overflow-x-auto">
          {CATS.map((c) => (
            <button
              data-testid={`filter-${c.key}`}
              key={c.key}
              onClick={() => setParams(c.key === "all" ? {} : { category: c.key })}
              className={`px-5 py-2 rounded-full text-sm border whitespace-nowrap ${cat === c.key ? "bg-[#1B4332] text-[#FDFBF7] border-[#1B4332]" : ""}`}
              style={{ borderColor: cat === c.key ? "var(--brand)" : "var(--line)" }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && [1,2,3,4,5,6].map((i) => (
          <div key={i} className="product-tile"><div className="aspect-square rounded-xl bg-white/60 animate-pulse"/></div>
        ))}
        {!loading && products.length === 0 && (
          <div className="col-span-full text-center py-24" style={{ color: "var(--ink-2)" }}>No products in this category.</div>
        )}
        {products.map((p) => {
          const from = Math.min(...p.variants.map((v) => v.price));
          const mrp = Math.min(...p.variants.map((v) => v.mrp));
          return (
            <Link data-testid={`product-card-${p.slug}`} to={`/product/${p.slug}`} key={p.id} className="product-tile block">
              <div className="aspect-square rounded-xl overflow-hidden bg-white">
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" decoding="async"/>
              </div>
              <div className="mt-5">
                <div className="label" style={{ color: "var(--amber)" }}>{p.category}</div>
                <div className="serif text-2xl mt-1">{p.name}</div>
                <div className="text-sm mt-2" style={{ color: "var(--ink-2)" }}>{p.short_description}</div>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="serif text-xl">{inr(from)}</span>
                  {mrp > from && <span className="line-through text-sm" style={{ color: "var(--ink-2)" }}>{inr(mrp)}</span>}
                  <span className="text-xs ml-auto label">{p.variants.length} sizes</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
