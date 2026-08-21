"use client";

import { inr } from "@/lib/utils";

// Sticky (not fixed) so it releases at the end of its container instead of
// permanently floating over the global footer below it.
export default function MobileActionBar({ total, ctaLabel, ctaDisabled, onCta }) {
  return (
    <div
      className="md:hidden sticky bottom-0 z-40 -mx-6 mt-6 flex items-center justify-between gap-4 px-5 py-3"
      style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}
    >
      <div>
        <div className="text-xs" style={{ color: "var(--ink-2)" }}>Total</div>
        <div className="text-lg font-semibold" data-testid="ck-total-mobile">{inr(total)}</div>
      </div>
      <button data-testid="ck-place-order-mobile" onClick={onCta} disabled={ctaDisabled} className="btn-primary flex-1 justify-center">
        {ctaLabel}
      </button>
    </div>
  );
}
