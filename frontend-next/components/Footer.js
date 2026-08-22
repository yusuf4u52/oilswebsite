import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t" style={{ borderColor: "var(--line)" }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="" width={256} height={256} className="h-10 w-10" />
            <div className="serif text-2xl font-semibold" style={{ color: "var(--brand)" }}>Premium Oils</div>
          </div>
          <p className="mt-3 text-sm" style={{ color: "var(--ink-2)" }}>
            Cold-pressed, unrefined, honest oils — made the way your grandmother would have chosen.
          </p>
        </div>
        <div>
          <div className="label mb-3">Shop</div>
          <ul className="space-y-2 text-sm" style={{ color: "var(--ink-2)" }}>
            <li><Link href="/shop?category=groundnut" className="underline underline-offset-4 hover:opacity-70">Groundnut Oil</Link></li>
            <li><Link href="/shop?category=coconut" className="underline underline-offset-4 hover:opacity-70">Coconut Oil</Link></li>
            <li><Link href="/shop?category=almond" className="underline underline-offset-4 hover:opacity-70">Almond Oil</Link></li>
          </ul>
        </div>
        <div>
          <div className="label mb-3">Company</div>
          <ul className="space-y-2 text-sm" style={{ color: "var(--ink-2)" }}>
            <li><Link href="/about" className="underline underline-offset-4 hover:opacity-70">About</Link></li>
            <li><Link href="/contact" className="underline underline-offset-4 hover:opacity-70">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="label mb-3">Support</div>
          <ul className="space-y-2 text-sm" style={{ color: "var(--ink-2)" }}>
            <li><a href="tel:+918407986619" className="underline underline-offset-4 hover:opacity-70">+91 8407986619</a></li>
            <li><a href="mailto:support@premiumoils.in" className="underline underline-offset-4 hover:opacity-70">support@premiumoils.in</a></li>
            <li>Mon–Sat, 9am–7pm</li>
          </ul>
        </div>
      </div>
      <div className="text-xs text-center py-6 border-t" style={{ color: "var(--ink-2)", borderColor: "var(--line)" }}>
        © {new Date().getFullYear()} Premium Oils · Made with care in India
      </div>
    </footer>
  );
}
