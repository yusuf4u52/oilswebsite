"use client";

import { Check } from "lucide-react";

function StepBadge({ n, active, done }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
      style={{
        background: done || active ? "var(--brand)" : "var(--bg-2)",
        color: done || active ? "#FDFBF7" : "var(--ink-2)",
        border: done || active ? "none" : "1px solid var(--line)",
      }}
    >
      {done ? <Check size={14}/> : n}
    </div>
  );
}

export default function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-3 mt-8 max-w-md">
      <div className="flex items-center gap-2">
        <StepBadge n={1} active={step === "address"} done={step === "payment"}/>
        <span className="text-sm" style={{ color: step === "address" ? "var(--ink)" : "var(--ink-2)", fontWeight: step === "address" ? 600 : 400 }}>Address</span>
      </div>
      <div className="flex-1 h-px" style={{ background: "var(--line)" }}/>
      <div className="flex items-center gap-2">
        <StepBadge n={2} active={step === "payment"} done={false}/>
        <span className="text-sm" style={{ color: step === "payment" ? "var(--ink)" : "var(--ink-2)", fontWeight: step === "payment" ? 600 : 400 }}>Payment</span>
      </div>
    </div>
  );
}
