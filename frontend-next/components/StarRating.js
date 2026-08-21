import { Star } from "lucide-react";

// Pure presentational, used from both a Server Component (product page rating
// badge) and a client component (ProductReviews) - no "use client" needed.
export function Stars({ value, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= Math.round(value) ? "var(--amber)" : "none"}
          stroke="var(--amber)"
        />
      ))}
    </div>
  );
}
