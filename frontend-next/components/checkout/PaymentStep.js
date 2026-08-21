"use client";

import { CreditCard, Truck } from "lucide-react";

const METHODS = [
  { key: "razorpay", title: "Online Payment", desc: "UPI, Cards, Netbanking via Razorpay", icon: CreditCard },
  { key: "cod", title: "Cash on Delivery", desc: "Pay when you receive", icon: Truck },
];

export default function PaymentStep({ method, onSelect }) {
  return (
    <section className="border rounded-3xl p-6" style={{ borderColor: "var(--line)" }}>
      <div className="serif text-2xl mb-4 flex items-center gap-2"><CreditCard size={18}/> Payment Method</div>
      <div className="grid sm:grid-cols-2 gap-3">
        {METHODS.map((m) => {
          const active = method === m.key;
          const Ic = m.icon;
          return (
            <button
              data-testid={`pay-${m.key}`}
              key={m.key}
              type="button"
              onClick={() => onSelect(m.key)}
              className={`text-left border rounded-2xl p-5 transition-colors ${active ? "border-[#1B4332] bg-[#1B4332]/5" : ""}`}
              style={{ borderColor: active ? "var(--brand)" : "var(--line)" }}
            >
              <Ic size={20} style={{ color: "var(--brand)" }}/>
              <div className="serif text-xl mt-3">{m.title}</div>
              <div className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>{m.desc}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
