"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Star } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useProductReviews } from "@/context/ProductReviewsContext";
import { Stars } from "@/components/StarRating";

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          data-testid={`review-star-${n}`}
          onClick={() => onChange(n)}
          aria-label={`Rate ${n} out of 5`}
        >
          <Star size={26} fill={n <= value ? "var(--amber)" : "none"} stroke="var(--amber)" />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productSlug }) {
  const { user, ready } = useAuth();
  // Mirrors Header.js: an admin session is not a customer session on the
  // storefront, so it shouldn't be treated as "logged in" for reviews either.
  const isCustomer = !!user && user.role !== "admin";
  const { reviews, summary, setReviews, setSummary } = useProductReviews();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const myReview = isCustomer ? reviews.find((r) => r.user_id === user.id) : null;

  const startWrite = () => {
    setRating(0);
    setComment("");
    setShowForm(true);
  };

  const startEdit = () => {
    setRating(myReview.rating);
    setComment(myReview.comment);
    setShowForm(true);
  };

  const refresh = async () => {
    const { data } = await api.get(`/products/${productSlug}/reviews`);
    setReviews(data.reviews);
    setSummary(data.summary);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error("Pick a star rating"); return; }
    setSubmitting(true);
    try {
      await api.post(`/products/${productSlug}/reviews`, { rating, comment: comment.trim() });
      toast.success(myReview ? "Review updated" : "Review posted");
      setRating(0);
      setComment("");
      setShowForm(false);
      await refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to post review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="reviews" className="mt-14 scroll-mt-24">
      <div className="divider mb-8" />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="label">Reviews</div>
        {summary.count > 0 && (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink-2)" }}>
            <Stars value={summary.average} />
            <span>{summary.average.toFixed(1)} · {summary.count} review{summary.count === 1 ? "" : "s"}</span>
          </div>
        )}
      </div>

      {ready && !isCustomer && (
        <p className="mt-6 text-sm" style={{ color: "var(--ink-2)" }}>
          <Link href="/login" className="underline">Log in</Link> to write a review.
        </p>
      )}

      {isCustomer && !myReview && !showForm && (
        <button data-testid="review-write-btn" onClick={startWrite} className="btn-ghost !py-2 !px-4 mt-6 text-sm">
          Write a review
        </button>
      )}

      {isCustomer && myReview && !showForm && (
        <button data-testid="review-edit-btn" onClick={startEdit} className="btn-ghost !py-2 !px-4 mt-6 text-sm">
          Edit your review
        </button>
      )}

      {isCustomer && showForm && (
        <form onSubmit={submit} className="mt-6 max-w-xl">
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            data-testid="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like or dislike? (optional)"
            rows={4}
            className="input mt-3 w-full"
            maxLength={2000}
          />
          <div className="flex gap-3 mt-3">
            <button data-testid="review-submit" type="submit" disabled={submitting} className="btn-primary !py-2 !px-4 text-sm">
              {submitting ? "Posting…" : myReview ? "Update review" : "Post review"}
            </button>
            <button type="button" className="btn-ghost !py-2 !px-4 text-sm" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 space-y-6">
        {reviews.length === 0 && (
          <p className="text-sm" style={{ color: "var(--ink-2)" }}>No reviews yet — be the first to share your experience.</p>
        )}
        {reviews.map((r) => (
          <div key={r.id} data-testid={`review-${r.id}`} className="border-b pb-6" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center justify-between">
              <div className="font-medium">{r.user_name}</div>
              <div className="text-xs" style={{ color: "var(--ink-2)" }}>
                {new Date(r.created_at).toLocaleDateString("en-IN")}
              </div>
            </div>
            <div className="mt-1"><Stars value={r.rating} size={14} /></div>
            {r.comment && (
              <p className="mt-2 leading-relaxed" style={{ color: "var(--ink-2)" }}>{r.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
