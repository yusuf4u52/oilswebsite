"use client";

import { Stars } from "@/components/StarRating";
import { useProductReviews } from "@/context/ProductReviewsContext";

export default function ScrollToReviewsLink() {
  const { summary } = useProductReviews();
  if (summary.count === 0) return null;

  const handleClick = (e) => {
    e.preventDefault();
    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <a href="#reviews" onClick={handleClick} className="flex items-center gap-2 mt-3 text-sm hover:opacity-70 w-fit">
      <Stars value={summary.average} size={14} />
      <span style={{ color: "var(--ink-2)" }}>
        {summary.average.toFixed(1)} · {summary.count} review{summary.count === 1 ? "" : "s"}
      </span>
    </a>
  );
}
