import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { inr } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Plus, MapPin, CreditCard, Truck, Phone, ShieldCheck, CheckCircle2 } from "lucide-react";

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
  const { loginWithToken } = useAuth();
  const [step, setStep] = useState("mobile");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile)) { toast.error("Enter valid 10-digit mobile"); return; }
    setLoading(true);
    try {
      const r = await api.post("/auth/otp/request", { mobile });
      if (r.data.demo_code) setDemoCode(r.data.demo_code);
      setStep("otp");
      toast.success("OTP sent");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to send OTP");
    } finally { setLoading(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post("/auth/otp/verify", { mobile, code });
      loginWithToken(r.data.token, r.data.user);
      toast.success("Welcome!");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid OTP");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md">
      <div className="chip mb-6">Sign in to checkout</div>
      <h1 className="serif text-4xl leading-tight">Almost there —<br/>just verify your number.</h1>
      <p className="mt-3 text-sm" style={{ color: "var(--ink-2)" }}>
        We&apos;ll send you a 6-digit code. Your bag is saved, nothing is lost.
      </p>

      {step === "mobile" && (
        <form onSubmit={requestOtp} className="mt-8 space-y-4">
          <label className="label">Mobile number</label>
          <div className="flex items-center border rounded-xl px-3" style={{ borderColor: "var(--line)" }}>
            <Phone size={16} className="opacity-60"/>
            <span className="ml-2 text-sm" style={{ color: "var(--ink-2)" }}>+91</span>
            <input
              data-testid="ck-login-mobile-input"
              autoFocus
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit mobile"
              className="flex-1 bg-transparent outline-none py-3 px-3"
            />
          </div>
          <button data-testid="ck-login-send-otp" type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? "Sending…" : "Send OTP"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={verifyOtp} className="mt-8 space-y-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink-2)" }}>
            <ShieldCheck size={16}/> Enter the 6-digit code sent to +91 {mobile}
          </div>
          {demoCode && (
            <div className="text-xs rounded-lg px-3 py-2" style={{ background: "var(--bg-2)", color: "var(--ink-2)" }}>
              Demo mode — your code is <b data-testid="ck-login-demo-code">{demoCode}</b>
            </div>
          )}
          <input
            data-testid="ck-login-otp-input"
            autoFocus
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="——————"
            className="input text-center serif text-3xl tracking-[0.4em]"
          />
          <button data-testid="ck-login-verify-otp" type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full justify-center">
            {loading ? "Verifying…" : "Verify & Continue"}
          </button>
          <button type="button" data-testid="ck-login-change-mobile" onClick={() => setStep("mobile")} className="text-sm underline w-full">
            Change mobile number
          </button>
        </form>
      )}
    </div>
  );
}

export default function Checkout() {
  const { items, subtotal, delivery, total, clear } = useCart();
  const { user, ready } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
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
    if (user) loadAddresses().catch(() => {});
  }, [user]);

  const saveAddress = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.mobile)) return toast.error("Enter valid mobile");
    if (!/^\d{6}$/.test(form.pincode)) return toast.error("Enter valid 6-digit pincode");
    try {
      await api.post("/addresses", { ...form, is_default: addresses.length === 0 });
      toast.success("Address saved");
      setShowAdd(false);
      setForm({ name: "", mobile: "", line1: "", line2: "", city: "", state: "", pincode: "", landmark: "" });
      await loadAddresses();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save address");
    }
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
        amount: Math.round(order.total * 100),
        currency: "INR",
        name: "Premium Oils",
        description: "Order Payment",
        order_id: order.razorpay_order_id,
        prefill: {
          name: order.address.name,
          contact: order.address.mobile,
        },
        theme: { color: "#1B4332" },
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

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        <InlineLogin />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
      <div className="label">Checkout</div>
      <h1 className="serif text-5xl mt-2">Almost there.</h1>

      <div className="grid md:grid-cols-12 gap-10 mt-10">
        {/* LEFT */}
        <div className="md:col-span-7 space-y-10">
          {/* Addresses */}
          <section>
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
                    <input type="radio" name="addr" checked={selectedId === a.id} onChange={() => setSelectedId(a.id)} className="mt-1"/>
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
              <form onSubmit={saveAddress} className="border rounded-2xl p-6 mt-4 grid grid-cols-2 gap-4" style={{ borderColor: "var(--line)" }}>
                <input data-testid="addr-name" required className="input col-span-2" placeholder="Full name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}/>
                <input data-testid="addr-mobile" required className="input col-span-2" placeholder="10-digit mobile" value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value.replace(/\D/g, "")})} maxLength={10}/>
                <input data-testid="addr-line1" required className="input col-span-2" placeholder="House / Flat / Building, Street" value={form.line1} onChange={(e) => setForm({...form, line1: e.target.value})}/>
                <input data-testid="addr-line2" className="input col-span-2" placeholder="Area / Locality (optional)" value={form.line2} onChange={(e) => setForm({...form, line2: e.target.value})}/>
                <input data-testid="addr-city" required className="input" placeholder="City" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})}/>
                <input data-testid="addr-state" required className="input" placeholder="State" value={form.state} onChange={(e) => setForm({...form, state: e.target.value})}/>
                <input data-testid="addr-pincode" required className="input" placeholder="Pincode" maxLength={6} value={form.pincode} onChange={(e) => setForm({...form, pincode: e.target.value.replace(/\D/g, "")})}/>
                <input data-testid="addr-landmark" className="input" placeholder="Landmark (optional)" value={form.landmark} onChange={(e) => setForm({...form, landmark: e.target.value})}/>
                <div className="col-span-2 flex gap-3 justify-end">
                  {addresses.length > 0 && <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>}
                  <button data-testid="addr-save" type="submit" className="btn-primary">Save Address</button>
                </div>
              </form>
            )}
          </section>

          {/* Payment */}
          <section>
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
        </div>

        {/* RIGHT: summary */}
        <div className="md:col-span-5">
          <div className="sticky top-24 border rounded-3xl p-6" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}>
            <div className="label">Order Summary</div>
            <div className="mt-4 space-y-4 max-h-72 overflow-auto">
              {items.map((i) => (
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
            <div className="mt-6 pt-4 border-t space-y-2 text-sm" style={{ borderColor: "var(--line)" }}>
              <div className="flex justify-between"><span style={{ color: "var(--ink-2)" }}>Subtotal</span><span>{inr(subtotal)}</span></div>
              <div className="flex justify-between"><span style={{ color: "var(--ink-2)" }}>Delivery</span><span>{delivery === 0 ? "FREE" : inr(delivery)}</span></div>
              <div className="flex justify-between text-lg font-semibold pt-2"><span>Total</span><span data-testid="ck-total">{inr(total)}</span></div>
            </div>
            <button data-testid="ck-place-order" onClick={placeOrder} disabled={placing || !selectedId || items.length === 0} className="btn-primary w-full justify-center mt-6">
              {placing ? "Processing…" : `Place Order · ${inr(total)}`}
            </button>
            <p className="text-xs text-center mt-3" style={{ color: "var(--ink-2)" }}>
              By placing this order you agree to our terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
