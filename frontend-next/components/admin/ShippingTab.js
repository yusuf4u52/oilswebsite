"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

// An empty threshold field means free delivery is off - every order pays the fee.
const toInput = (n) => (n == null ? "" : String(n));

export default function ShippingTab() {
  const [fee, setFee] = useState("");
  const [threshold, setThreshold] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Without this guard a stale response (e.g. Strict Mode's second effect
    // run) can land after the admin starts typing and overwrite their input.
    let cancelled = false;
    api.get("/settings/shipping")
      .then(({ data }) => {
        if (cancelled) return;
        setFee(toInput(data.delivery_fee));
        setThreshold(toInput(data.free_delivery_threshold));
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error("Failed to load shipping settings");
        setLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/admin/settings/shipping", {
        delivery_fee: Number(fee),
        free_delivery_threshold: threshold.trim() === "" ? null : Number(threshold),
      });
      toast.success("Shipping settings saved");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save shipping settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="mt-6 max-w-md space-y-5">
      <div>
        <label className="label block mb-2" htmlFor="ship-fee">Delivery fee (₹)</label>
        <input
          id="ship-fee" data-testid="ship-fee" type="number" min="0" step="1" required
          value={fee} onChange={(e) => setFee(e.target.value)} disabled={!loaded}
          className="w-full border rounded-md px-3 py-2" style={{ borderColor: "var(--line)" }}
        />
        <p className="text-xs mt-1" style={{ color: "var(--ink-2)" }}>Charged on orders below the free-delivery threshold. Set 0 to always ship free.</p>
      </div>
      <div>
        <label className="label block mb-2" htmlFor="ship-threshold">Free delivery on orders above (₹)</label>
        <input
          id="ship-threshold" data-testid="ship-threshold" type="number" min="0" step="1"
          value={threshold} onChange={(e) => setThreshold(e.target.value)} disabled={!loaded}
          className="w-full border rounded-md px-3 py-2" style={{ borderColor: "var(--line)" }}
        />
        <p className="text-xs mt-1" style={{ color: "var(--ink-2)" }}>Leave empty to charge the fee on every order.</p>
      </div>
      <button data-testid="ship-save" type="submit" disabled={!loaded || saving} className="btn-primary">
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
