import { Leaf, Droplet, ShieldCheck } from "lucide-react";
import SEO from "@/components/SEO";

export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
      <SEO
        title="About Us — What is Kachi Ghani Oil?"
        description="Premium Oils works directly with small farmers and traditional Kachi Ghani (kacchi ghani, kachhi ghani) wood-pressed ghanis across India to bring back cold-pressed, unrefined, shuddh oil."
        keywords="kachi ghani, kacchi ghani, kachhi ghani, कच्ची घानी, what is kachi ghani oil, wood pressed ghani, shuddh tel, traditional oil pressing India"
        path="/about"
      />
      <div className="label">About Us</div>
      <h1 className="serif text-4xl sm:text-5xl mt-2 max-w-2xl">
        Liquid gold, the way it should be.
      </h1>
      <p className="mt-6 text-lg max-w-2xl" style={{ color: "var(--ink-2)" }}>
        Premium Oils started with a simple frustration: it had become almost
        impossible to buy oil the way our grandmothers did — cold-pressed,
        unrefined, and honest about what's inside the bottle. So we set out
        to bring that back, working directly with small farmers and traditional
        wood-pressed ghanis across India.
      </p>
      <p className="mt-4 text-lg max-w-2xl" style={{ color: "var(--ink-2)" }}>
        Every bottle we sell is extracted slowly at low RPM to preserve
        nutrients and flavour, bottled within 48 hours of pressing, and
        shipped straight to your kitchen with no refining and no shortcuts.
      </p>
      <p className="mt-4 text-lg max-w-2xl" style={{ color: "var(--ink-2)" }}>
        This traditional method goes by many names — Kachi Ghani, kacchi ghani,
        kachhi ghani, or simply <span lang="hi">कच्ची घानी</span> — but it's
        always the same slow, unheated wooden or stone press our
        grandparents trusted. No shortcuts, just <span lang="hi">शुद्ध</span>{" "}
        (shuddh) oil the way it was always meant to be made.
      </p>
      <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-2xl">
        {[
          { icon: Leaf, t: "100% Natural" },
          { icon: Droplet, t: "Cold-Pressed" },
          { icon: ShieldCheck, t: "No Refining" },
        ].map(({ icon: Ic, t }) => (
          <div key={t} className="border rounded-2xl p-5 flex items-center gap-3" style={{ borderColor: "var(--line)" }}>
            <Ic size={18} style={{ color: "var(--brand)" }} />
            <span className="text-sm">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
