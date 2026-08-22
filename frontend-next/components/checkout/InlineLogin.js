"use client";

import AuthGate from "@/components/AuthGate";

// Inline sign-in, rendered in place on the checkout page — no route change,
// so a guest never gets bounced away from checkout and back.
export default function InlineLogin() {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="chip mb-6">Sign in to checkout</div>
      <h1 className="serif text-4xl leading-tight">Almost there —<br/>sign in to continue.</h1>
      <p className="mt-3 text-sm" style={{ color: "var(--ink-2)" }}>
        Continue with Google. Your bag is saved, nothing is lost.
      </p>
      <div className="mt-8">
        <AuthGate />
      </div>
    </div>
  );
}
