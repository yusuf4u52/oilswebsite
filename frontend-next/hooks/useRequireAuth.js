"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// UX-only route guards — same as the CRA app's RequireAuth/RequireAdmin.
// Actual authorization is still enforced by the backend on every API call;
// this only decides what to render/redirect to client-side.
export function useRequireAuth() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!ready) return;
    if (!user || user.role === "admin") {
      const search = searchParams.toString();
      router.replace(`/login?next=${encodeURIComponent(pathname + (search ? `?${search}` : ""))}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, pathname]);

  return ready && !!user && user.role !== "admin";
}

export function useRequireAdmin() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user || user.role !== "admin") {
      router.replace("/admin/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  return ready && !!user && user.role === "admin";
}
