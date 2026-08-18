import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { inr } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import AuthGate from "@/components/AuthGate";
import AddressForm from "@/components/AddressForm";
import { toast } from "sonner";
import { Plus, Minus, Trash2, MapPin, CreditCard, Truck, CheckCircle2, Check, ChevronDown } from "lucide-react";

const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();
  const existing = document.querySelector(`script[src="${RAZORPAY_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SRC;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// Inline sign-in, rendered in place on the checkout page — no route change,
// so a guest never gets bounced away from checkout and back.
function InlineLogin() {
  return (
    <div className="max-w-md">
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

function StepBadge({ n, active, done }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
      style={{
        background: done || active ? "var(--brand)" : "var(--bg-2)",
        color: done || active ? "#FDFBF7" : "var(--ink-2)",
        border: done || active ? "none" : "1px solid var(--line)",
      }}
    >
      {done ? <Check size={14}/> : n}
    </div>
  );
}

function OrderSummaryItems({ items, updateQty, removeItem }) {
  return (
    <div className="space-y-4 max-h-72 overflow-auto">
      {items.map((i) => (
        <div key={`${i.product_id}-${i.variant_id}`} className="flex gap-3">
          <img src={i.image_url} alt={i.name} className="w-14 h-16 object-cover rounded-lg bg-white"/>
          <div className="flex-1 text-sm">
            <div className="font-medium">{i.name}</div>
            <div style={{ color: "var(--ink-2)" }}>{i.size}</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1 border rounded-full" style={{ borderColor: "var(--line)" }}>
                <button data-testid={`ck-dec-${i.variant_id}`} className="p-2" onClick={() => updateQty(i.product_id, i.variant_id, Math.max(0, i.qty - 1))}><Minus size={12}/></button>
                <span className="text-xs min-w-[14px] text-center">{i.qty}</span>
                <button data-testid={`ck-inc-${i.variant_id}`} className="p-2" onClick={() => updateQty(i.product_id, i.variant_id, i.qty + 1)}><Plus size={12}/></button>
              </div>
              <button data-testid={`ck-remove-${i.variant_id}`} onClick={() => removeItem(i.product_id, i.variant_id)} className="opacity-60 hover:opacity-100 p-2">
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
          <div className="text-sm font-medium">{inr(i.price * i.qty)}</div>
        </div>
      ))}
    </div>
  );
}

export default function Checkout() {
  const { items, subtotal, delivery, total, clear, updateQty, removeItem } = useCart();
  const { user, ready } = useAuth();
  const isCustomer = !!user && user.role !== "admin" && !!user.mobile;
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addrSaving, setAddrSaving] = useState(false);
  const [step, setStep] = useState("address"); // "address" | "payment"
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [method, setMethod] = useState("razorpay");
  const [placing, setPlacing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "", mobile: "", line1: "", line2: "", city: "", state: "", pincode: "", landmark: "",
  });

  const loadAddresses = async () => {
    const r = await api.get("/addresses");
    const addrs = r.data.addresses ?? [];
    setAddresses(addrs);
    const def = addrs.find((a) => a.is_default) || addrs[0];
    if (def) setSelectedId(def.id);
    if (addrs.length === 0) setShowAdd(true);
  };

  useEffect(() => {
    if (items.length === 0 && !confirmedOrder) { nav("/shop"); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isCustomer) loadAddresses().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomer]);

  const saveAddress = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.mobile)) return toast.error("Enter valid mobile");
    if (!/^\d{6}$/.test(form.pincode)) return toast.error("Enter valid 6-digit pincode");
    setAddrSaving(true);
    try {
      const r = await api.post("/addresses", { ...form, is_default: addresses.length === 0 });
      toast.success("Address saved");
      setShowAdd(false);
      setForm({ name: "", mobile: "", line1: "", line2: "", city: "", state: "", pincode: "", landmark: "" });
      await loadAddresses();
      if (r?.data?.id) setSelectedId(r.data.id);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save address");
    } finally { setAddrSaving(false); }
  };

  const confirmAddress = () => {
    if (!selectedId) return toast.error("Select an address");
    setStep("payment");
  };

  const placeOrder = async () => {
    if (!selectedId) return toast.error("Select an address");
    setPlacing(true);
    try {
      const payload = {
        items: items.map((i) => ({
          product_id: i.product_id, variant_id: i.variant_id,
          name: i.name, size: i.size, price: i.price, qty: i.qty, image_url: i.image_url,
        })),
        address_id: selectedId,
        payment_method: method,
      };
      const r = await api.post("/orders", payload);
      const order = r.data.order;
      const finishOrder = (successMsg) => {
        clear();
        toast.success(successMsg);
        setConfirmedOrder({ ...order, _items: items, _total: total });
      };
      if (method === "cod") {
        await api.post(`/orders/${order.id}/cod-confirm`);
        finishOrder("Order placed! You'll pay on delivery.");
        return;
      }
      // Razorpay flow
      if (r.data.razorpay_mode === "mock") {
        // simulate a successful payment
        await api.post("/orders/verify", {
          order_id: order.id,
          razorpay_order_id: order.razorpay_order_id,
          razorpay_payment_id: `pay_mock_${Math.random().toString(36).slice(2, 10)}`,
          razorpay_signature: "mock_signature",
        });
        finishOrder("Payment successful (demo)");
        return;
      }
      try {
        await loadRazorpayScript();
      } catch {
        toast.error("Failed to load payment gateway. Please try again.");
        return;
      }
      const options = {
        key: r.data.razorpay_key_id,
        name: "Premium Oils",
        description: "Order Payment",
        order_id: order.razorpay_order_id,
        prefill: {
          name: order.address.name,
          contact: order.address.mobile,
        },
        theme: { color: "#1B4332" },
        modal: {
          ondismiss: () => {
            toast.error("Payment cancelled");
          },
        },
        handler: async (resp) => {
          try {
            await api.post("/orders/verify", {
              order_id: order.id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            finishOrder("Payment successful");
          } catch (e) {
            toast.error("Payment verification failed");
          }
        },
      };
      // eslint-disable-next-line no-undef
      const rz = new window.Razorpay(options);
      rz.on("payment.failed", (resp) => {
        toast.error(resp?.error?.description || "Payment failed. Please try again.");
      });
      rz.open();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to place order");
    } finally { setPlacing(false); }
  };

  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-6 md:px-10 py-20 text-center fade-in">
        <CheckCircle2 size={56} style={{ color: "var(--brand)" }} className="mx-auto"/>
        <div className="label mt-6">Order Confirmed</div>
        <h1 className="serif text-5xl mt-2">Thank you!</h1>
        <p className="mt-4 text-lg" style={{ color: "var(--ink-2)" }}>
          Order <b data-testid="ck-confirmed-order-id">#{confirmedOrder.id.slice(0, 8)}</b> is on its way. We'll deliver your liquid gold soon.
        </p>
        <div className="mt-8 border rounded-3xl p-6 text-left" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}>
          <div className="space-y-4 max-h-60 overflow-auto">
            {confirmedOrder._items.map((i) => (
              <div key={`${i.product_id}-${i.variant_id}`} className="flex gap-3">
                <img src={i.image_url} alt={i.name} className="w-14 h-16 object-cover rounded-lg bg-white"/>
                <div className="flex-1 text-sm">
                  <div className="font-medium">{i.name}</div>
                  <div style={{ color: "var(--ink-2)" }}>{i.size} · Qty {i.qty}</div>
                </div>
                <div className="text-sm font-medium">{inr(i.price * i.qty)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between text-lg font-semibold" style={{ borderColor: "var(--line)" }}>
            <span>Total</span><span>{inr(confirmedOrder._total)}</span>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <button data-testid="ck-confirmed-view-orders" onClick={() => nav("/orders")} className="btn-primary">View My Orders</button>
          <button data-testid="ck-confirmed-continue-shopping" onClick={() => nav("/shop")} className="btn-ghost">Continue Shopping</button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return <div className="max-w-6xl mx-auto px-6 md:px-10 py-24 text-center text-sm" style={{ color: "var(--ink-2)" }}>Loading…</div>;
  }

  if (!isCustomer) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        <InlineLogin />
      </div>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === selectedId);

  const ctaLabel = step === "address"
    ? "Continue to Payment"
    : placing ? "Processing…" : method === "razorpay" ? `Pay ${inr(total)}` : `Place Order · ${inr(total)}`;
  const ctaDisabled = step === "address" ? !selectedId : (placing || items.length === 0);
  const ctaAction = step === "address" ? confirmAddress : placeOrder;

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
      <div className="label">Checkout</div>
      <h1 className="serif text-5xl mt-2">Almost there.</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mt-8 max-w-md">
        <div className="flex items-center gap-2">
          <StepBadge n={1} active={step === "address"} done={step === "payment"}/>
          <span className="text-sm" style={{ color: step === "address" ? "var(--ink)" : "var(--ink-2)", fontWeight: step === "address" ? 600 : 400 }}>Address</span>
        </div>
        <div className="flex-1 h-px" style={{ background: "var(--line)" }}/>
        <div className="flex items-center gap-2">
          <StepBadge n={2} active={step === "payment"} done={false}/>
          <span className="text-sm" style={{ color: step === "payment" ? "var(--ink)" : "var(--ink-2)", fontWeight: step === "payment" ? 600 : 400 }}>Payment</span>
        </div>
      </div>

      {/* Mobile order summary — collapsible, sits above the steps */}
      <div className="md:hidden mt-6">
        <button
          data-testid="ck-summary-toggle"
          onClick={() => setSummaryOpen((o) => !o)}
          className="w-full flex items-center justify-between border rounded-2xl px-5 py-4"
          style={{ borderColor: "var(--line)" }}
        >
          <span className="text-sm font-medium">Order summary · {items.length} {items.length === 1 ? "item" : "items"}</span>
          <span className="flex items-center gap-2 text-sm" style={{ color: "var(--ink-2)" }}>
            {inr(total)}
            <ChevronDown size={16} style={{ transform: summaryOpen ? "rotate(180deg)" : "none", transition: "transform 180ms ease" }}/>
          </span>
        </button>
        {summaryOpen && (
          <div className="border border-t-0 rounded-b-2xl px-5 py-5" style={{ borderColor: "var(--line)" }}>
            <OrderSummaryItems items={items} updateQty={updateQty} removeItem={removeItem}/>
            <div className="mt-4 pt-4 border-t space-y-2 text-sm" style={{ borderColor: "var(--line)" }}>
              <div className="flex justify-between"><span style={{ color: "var(--ink-2)" }}>Subtotal</span><span>{inr(subtotal)}</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--ink-2)" }}>Delivery</span><span>{delivery === 0 ? "FREE" : inr(delivery)}</span></div>
              <div className="flex justify-between text-base font-semibold pt-1"><span>Total</span><span>{inr(total)}</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-12 gap-10 mt-8">
        {/* LEFT */}
        <div className="md:col-span-7 space-y-6">
          {/* Step 1: Address */}
          <section className="border rounded-3xl p-6" style={{ borderColor: "var(--line)" }}>
            {step === "address" ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="serif text-2xl flex items-center gap-2"><MapPin size={18}/> Delivery Address</div>
                  {!showAdd && (
                    <button data-testid="ck-add-addr" onClick={() => setShowAdd(true)} className="btn-ghost !py-2 !px-3 text-sm"><Plus size={14}/> New</button>
                  )}
                </div>

                {addresses.length === 0 && !showAdd && (
                  <p className="text-sm" style={{ color: "var(--ink-2)" }}>No addresses yet. Add one.</p>
                )}

                <div className="space-y-3">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      data-testid={`addr-option-${a.id}`}
                      className={`block border rounded-2xl p-5 cursor-pointer transition-colors ${selectedId === a.id ? "border-[#1B4332] bg-[#1B4332]/5" : ""}`}
                      style={{ borderColor: selectedId === a.id ? "var(--brand)" : "var(--line)" }}
                    >
                      <div className="flex items-start gap-3">
                        <input type="radio" name="addr" checked={selectedId === a.id} onChange={() => setSelectedId(a.id)} className="mt-1 w-[18px] h-[18px]"/>
                        <div>
                          <div className="font-medium">{a.name} · +91 {a.mobile}</div>
                          <div className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>
                            {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} — {a.pincode}
                            {a.landmark ? ` · Near ${a.landmark}` : ""}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {showAdd && (
                  <AddressForm
                    value={form}
                    onChange={setForm}
                    onSubmit={saveAddress}
                    onCancel={addresses.length > 0 ? () => setShowAdd(false) : undefined}
                    submitting={addrSaving}
                    testIdPrefix="addr"
                  />
                )}

                {!showAdd && addresses.length > 0 && (
                  <button data-testid="ck-confirm-address" onClick={confirmAddress} disabled={!selectedId} className="btn-primary w-full justify-center mt-5">
                    Deliver to this address
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="mt-0.5" style={{ color: "var(--brand)" }}/>
                  <div>
                    <div className="font-medium">{selectedAddress?.name} · +91 {selectedAddress?.mobile}</div>
                    <div className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>
                      {selectedAddress?.line1}{selectedAddress?.line2 ? `, ${selectedAddress.line2}` : ""}, {selectedAddress?.city}, {selectedAddress?.state} — {selectedAddress?.pincode}
                      {selectedAddress?.landmark ? ` · Near ${selectedAddress.landmark}` : ""}
                    </div>
                  </div>
                </div>
                <button data-testid="ck-change-address" onClick={() => setStep("address")} className="text-sm underline shrink-0">Change</button>
              </div>
            )}
          </section>

          {/* Step 2: Payment */}
          {step === "payment" && (
            <section className="border rounded-3xl p-6" style={{ borderColor: "var(--line)" }}>
              <div className="serif text-2xl mb-4 flex items-center gap-2"><CreditCard size={18}/> Payment Method</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: "razorpay", title: "Online Payment", desc: "UPI, Cards, Netbanking via Razorpay", icon: CreditCard },
                  { key: "cod", title: "Cash on Delivery", desc: "Pay when you receive", icon: Truck },
                ].map((m) => {
                  const active = method === m.key;
                  const Ic = m.icon;
                  return (
                    <button
                      data-testid={`pay-${m.key}`}
                      key={m.key}
                      type="button"
                      onClick={() => setMethod(m.key)}
                      className={`text-left border rounded-2xl p-5 transition-colors ${active ? "border-[#1B4332] bg-[#1B4332]/5" : ""}`}
                      style={{ borderColor: active ? "var(--brand)" : "var(--line)" }}
                    >
                      <Ic size={20} style={{ color: "var(--brand)" }}/>
                      <div className="serif text-xl mt-3">{m.title}</div>
                      <div className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>{m.desc}</div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT: summary — desktop only, mobile uses the collapsible above + sticky bar below */}
        <div className="hidden md:block md:col-span-5">
          <div className="sticky top-24 border rounded-3xl p-6" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}>
            <div className="label">Order Summary</div>
            <div className="mt-4">
              <OrderSummaryItems items={items} updateQty={updateQty} removeItem={removeItem}/>
            </div>
            <div className="mt-6 pt-4 border-t space-y-2 text-sm" style={{ borderColor: "var(--line)" }}>
              <div className="flex justify-between"><span style={{ color: "var(--ink-2)" }}>Subtotal</span><span>{inr(subtotal)}</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--ink-2)" }}>Delivery</span><span>{delivery === 0 ? "FREE" : inr(delivery)}</span></div>
              <div className="flex justify-between text-lg font-semibold pt-2"><span>Total</span><span data-testid="ck-total">{inr(total)}</span></div>
            </div>
            <button data-testid="ck-place-order" onClick={ctaAction} disabled={ctaDisabled} className="btn-primary w-full justify-center mt-6">
              {ctaLabel}
            </button>
            <p className="text-xs text-center mt-3" style={{ color: "var(--ink-2)" }}>
              By placing this order you agree to our terms.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile sticky action bar — sticky (not fixed) so it releases at the end of this
          container instead of permanently floating over the global footer below it. */}
      <div
        className="md:hidden sticky bottom-0 z-40 -mx-6 mt-6 flex items-center justify-between gap-4 px-5 py-3"
        style={{ background: "var(--bg)", borderTop: "1px solid var(--line)" }}
      >
        <div>
          <div className="text-xs" style={{ color: "var(--ink-2)" }}>Total</div>
          <div className="text-lg font-semibold" data-testid="ck-total-mobile">{inr(total)}</div>
        </div>
        <button data-testid="ck-place-order-mobile" onClick={ctaAction} disabled={ctaDisabled} className="btn-primary flex-1 justify-center">
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
