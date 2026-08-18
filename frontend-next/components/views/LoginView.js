"use client";

import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";

export default function LoginView({ next = "/" }) {
  const router = useRouter();

  return (
    <div className="max-w-md mx-auto px-6 py-16 fade-in text-center">
      <div className="chip mb-6">Secure login</div>
      <h1 className="serif text-4xl leading-tight">Sign in to<br/>Premium Oils</h1>
      <p className="mt-3 text-sm" style={{ color: "var(--ink-2)" }}>
        Continue with your Google account — quick and secure.
      </p>
      <div className="mt-10">
        <AuthGate onDone={() => router.push(next)} />
      </div>
    </div>
  );
}
