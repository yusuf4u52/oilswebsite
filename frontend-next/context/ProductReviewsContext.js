"use client";

import { createContext, useContext, useState } from "react";

const Ctx = createContext(null);

// Shared between ScrollToReviewsLink (top-of-page badge) and ProductReviews
// (full list + form, further down) so a new submission updates both without
// a page reload - each holding its own copy of initial* props would drift.
export function ProductReviewsProvider({ initialReviews, initialSummary, children }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [summary, setSummary] = useState(initialSummary);
  return (
    <Ctx.Provider value={{ reviews, summary, setReviews, setSummary }}>
      {children}
    </Ctx.Provider>
  );
}

export function useProductReviews() {
  return useContext(Ctx);
}
