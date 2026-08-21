"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

// Runs `loader` once `ready` becomes true. Centralizes the "fetch once a
// readiness condition flips" pattern that used to be hand-rolled with a
// useEffect + eslint-disable in every view, and surfaces load failures via
// toast instead of silently swallowing them.
export function useLoadOnReady(ready, loader, errorMessage = "Failed to load data") {
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    if (!ready) return;
    Promise.resolve(loaderRef.current()).catch(() => toast.error(errorMessage));
  }, [ready, errorMessage]);
}
