import { Phone, Mail, Clock } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";

export const dynamic = "force-static";

export const metadata = pageMetadata({
  title: "Contact Us",
  description: "Get in touch with Premium Oils for questions about an order, a product, or anything else — by phone, email, or during business hours.",
  path: "/contact",
});

export default function Contact() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
      <div className="label">Contact</div>
      <h1 className="serif text-4xl sm:text-5xl mt-2 max-w-2xl">
        We&apos;d love to hear from you.
      </h1>
      <p className="mt-6 text-lg max-w-2xl" style={{ color: "var(--ink-2)" }}>
        Questions about an order, a product, or anything else? Reach us
        through any of the channels below and we&apos;ll get back to you.
      </p>
      <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-2xl">
        <a href="tel:+918407986619" className="border rounded-2xl p-5 flex items-center gap-3 hover:opacity-70" style={{ borderColor: "var(--line)" }}>
          <Phone size={18} style={{ color: "var(--brand)" }} />
          <span className="text-sm">+91 8407986619</span>
        </a>
        <a href="mailto:support@premiumoils.in" className="border rounded-2xl p-5 flex items-center gap-3 hover:opacity-70" style={{ borderColor: "var(--line)" }}>
          <Mail size={18} style={{ color: "var(--brand)" }} />
          <span className="text-sm">support@premiumoils.in</span>
        </a>
        <div className="border rounded-2xl p-5 flex items-center gap-3" style={{ borderColor: "var(--line)" }}>
          <Clock size={18} style={{ color: "var(--brand)" }} />
          <span className="text-sm">Mon–Sat, 9am–7pm</span>
        </div>
      </div>
    </div>
  );
}
