"use client";

import { Star, Trash2 } from "lucide-react";

function Stars({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={12} fill={n <= value ? "var(--amber)" : "none"} stroke="var(--amber)" />
      ))}
    </div>
  );
}

export default function ReviewsTab({ reviews, onDelete }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left label" style={{ color: "var(--ink-2)" }}>
            <th className="py-3">Product</th><th>Customer</th><th>Rating</th><th>Review</th><th>Date</th><th></th>
          </tr>
        </thead>
        <tbody>
          {reviews.length === 0 && (
            <tr><td colSpan={6} className="py-10 text-center" style={{ color: "var(--ink-2)" }}>No reviews yet.</td></tr>
          )}
          {reviews.map((r) => (
            <tr key={r.id} className="border-t align-top" style={{ borderColor: "var(--line)" }} data-testid={`admin-review-${r.id}`}>
              <td className="py-3">{r.product_name}</td>
              <td>{r.user_name}</td>
              <td><Stars value={r.rating} /></td>
              <td className="max-w-md" style={{ color: "var(--ink-2)" }}>{r.comment}</td>
              <td className="text-xs whitespace-nowrap" style={{ color: "var(--ink-2)" }}>
                {new Date(r.created_at).toLocaleDateString("en-IN")}
              </td>
              <td>
                <button
                  data-testid={`admin-review-delete-${r.id}`}
                  onClick={() => onDelete(r.id)}
                  className="btn-ghost !py-1 !px-2"
                  aria-label="Delete review"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
