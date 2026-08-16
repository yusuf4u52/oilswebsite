import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { inr } from "@/lib/api";
import { ArrowRight, Leaf, Droplet, ShieldCheck, Sparkles } from "lucide-react";

const HERO_IMG = "https://images.unsplash.com/photo-1768689033119-c3ac1e437d20?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHwxfHxwb3VyaW5nJTIwcHVyZSUyMGdvbGRlbiUyMG9pbHxlbnwwfHx8fDE3ODYzODM2Njh8MA&ixlib=rb-4.1.0&q=85";
const KITCHEN_IMG = "https://images.unsplash.com/photo-1725483990188-41d4fb0d1e5a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHw0fHxpbmRpYW4lMjBraXRjaGVuJTIwY29va2luZyUyMGhlYWx0aHl8ZW58MHx8fHwxNzgzODQwOTEwfDA&ixlib=rb-4.1.0&q=85";

const CATS = [
  { key: "groundnut", label: "Groundnut", img: "https://images.unsplash.com/photo-1742524252643-d1f3fddd8cca?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzN8MHwxfHNlYXJjaHwyfHx3b29kZW4lMjBib3dsJTIwcGVhbnV0c3xlbnwwfHx8fDE3ODMzMTIzMzh8MA&ixlib=rb-4.1.0&q=85" },
  { key: "coconut", label: "Coconut", img: "https://images.unsplash.com/photo-1597636319015-1fce74db8798?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGNyYWNrZWQlMjBjb2NvbnV0JTIwd2hpdGUlMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc4NjM4MzY2OHww&ixlib=rb-4.1.0&q=85" },
  { key: "almond", label: "Almond", img: "https://images.pexels.com/photos/26595162/pexels-photo-26595162.jpeg" },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.data.products ?? [])).catch(() => {});
  }, []);

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
          <Link data-testid="products-view-all" to="/shop" className="text-sm underline underline-offset-4 whitespace-nowrap">Shop all</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 8).map((p) => {
            const from = Math.min(...p.variants.map((v) => v.price));
            return (
              <Link data-testid={`bestseller-${p.slug}`} to={`/product/${p.slug}`} key={p.id} className="product-tile block">
                <div className="aspect-square rounded-xl overflow-hidden bg-white">
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover"/>
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
            <div className="chip">Cold-pressed · Small batch · India</div>
            <h2 className="serif mt-6 text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight">
              Liquid gold,<br/>
              <span style={{ color: "var(--brand)" }}>the way it should be.</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg" style={{ color: "var(--ink-2)" }}>
              Wood-pressed groundnut, virgin coconut and best quality almond oils —
              extracted slowly, bottled honestly, delivered to your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link data-testid="hero-shop-btn" to="/shop" className="btn-primary">
                Shop the Range <ArrowRight size={16}/>
              </Link>
              <Link data-testid="hero-learn-btn" to="/shop?category=groundnut" className="btn-ghost">Explore Groundnut</Link>
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
              <img src={HERO_IMG} alt="Pouring pure oil" className="w-full h-full object-cover"/>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white border rounded-2xl p-4 shadow-sm hidden sm:block" style={{ borderColor: "var(--line)" }}>
              <div className="label">Free delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="label">The Range</div>
            <h2 className="serif text-4xl sm:text-5xl mt-2">Three oils, endless plates.</h2>
          </div>
          <Link data-testid="cats-view-all" to="/shop" className="text-sm underline underline-offset-4">View all</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {CATS.map((c) => (
            <Link data-testid={`cat-card-${c.key}`} to={`/shop?category=${c.key}`} key={c.key} className="product-tile block">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                <img src={c.img} alt={c.label} className="w-full h-full object-cover"/>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <div className="serif text-2xl">{c.label} Oil</div>
                <ArrowRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* STORY */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 mt-24">
        <div className="grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-5 rounded-[2rem] overflow-hidden aspect-square">
            <img src={KITCHEN_IMG} alt="Indian kitchen" className="w-full h-full object-cover"/>
          </div>
          <div className="md:col-span-7">
            <div className="chip"><Sparkles size={12} className="mr-2"/> Our Promise</div>
            <h2 className="serif text-4xl sm:text-5xl mt-6 leading-tight">
              No refining. No shortcuts.<br/>Just oil, the way it used to be.
            </h2>
            <p className="mt-6 text-lg max-w-xl" style={{ color: "var(--ink-2)" }}>
              We source directly from farmers across Andhra, Kerala and Kashmir.
              Every batch is cold-pressed at low RPM, bottled within 48 hours, and
              shipped straight to your kitchen.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                ["48 hrs", "Farm to bottle"],
                ["0 chemicals", "No refining"],
                ["6+ months", "Natural shelf life"],
                ["1,00,000+", "Happy kitchens"],
              ].map(([n, t]) => (
                <div key={t} className="border rounded-2xl p-5" style={{ borderColor: "var(--line)" }}>
                  <div className="serif text-3xl" style={{ color: "var(--brand)" }}>{n}</div>
                  <div className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>{t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
