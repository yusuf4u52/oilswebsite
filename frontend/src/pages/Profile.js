import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api, { inr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { User, Phone, Mail, MapPin, Package, Plus, Trash2, Star, Save } from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const emptyAddrForm = { name: "", mobile: "", line1: "", line2: "", city: "", state: "", pincode: "", landmark: "" };

const TABS = [
  { key: "details", label: "Account Details", icon: User },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "orders", label: "Orders", icon: Package },
];

export default function Profile() {
  const { user, setUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "details";
  const setTab = (t) => setParams(t === "details" ? {} : { tab: t });

  // details
  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (user) setForm({ name: user.name || "", email: user.email || "" }); }, [user]);

  const saveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.put("/auth/me", form);
      setUser(r.data.user);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to update profile");
    } finally { setSaving(false); }
  };

  // addresses
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addrForm, setAddrForm] = useState(emptyAddrForm);

  const loadAddresses = async () => {
    setAddrLoading(true);
    try {
      const r = await api.get("/addresses");
      setAddresses(r.data.addresses ?? []);
    } finally { setAddrLoading(false); }
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(addrForm.mobile)) return toast.error("Enter valid mobile");
    if (!/^\d{6}$/.test(addrForm.pincode)) return toast.error("Enter valid 6-digit pincode");
    try {
      await api.post("/addresses", addrForm);
      toast.success("Address saved");
      setShowAdd(false);
      setAddrForm(emptyAddrForm);
      await loadAddresses();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save address");
    }
  };

  const deleteAddress = async (id) => {
    if (!window.confirm("Remove this address?")) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.success("Address removed");
      await loadAddresses();
    } catch {
      toast.error("Failed to remove address");
    }
  };

  const makeDefault = async (id) => {
    try {
      await api.put(`/addresses/${id}/default`);
      await loadAddresses();
    } catch {
      toast.error("Failed to set default address");
    }
  };

  // orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const r = await api.get("/orders");
      setOrders(r.data.orders ?? []);
    } finally { setOrdersLoading(false); }
  };

  useEffect(() => {
    loadAddresses().catch(() => {});
    loadOrders().catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-14">
      <div className="label">Your Account</div>
      <h1 className="serif text-5xl mt-2">Everything about you.</h1>

      <div className="flex gap-2 mt-10 border-b overflow-x-auto" style={{ borderColor: "var(--line)" }}>
        {TABS.map((t) => {
          const Ic = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              data-testid={`profile-tab-${t.key}`}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm flex items-center gap-2 whitespace-nowrap ${active ? "border-b-2 font-semibold" : ""}`}
              style={{ borderColor: active ? "var(--brand)" : "transparent", color: active ? "var(--brand)" : "var(--ink-2)" }}
            >
              <Ic size={14}/> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "details" && (
        <form onSubmit={saveDetails} className="mt-10 max-w-md space-y-5">
          <div>
            <label className="label">Mobile number</label>
            <div className="flex items-center border rounded-xl px-3 mt-2" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}>
              <Phone size={16} className="opacity-60"/>
              <span data-testid="profile-mobile" className="flex-1 py-3 px-3 text-sm">+91 {user?.mobile}</span>
            </div>
          </div>
          <div>
            <label className="label">Full name</label>
            <input data-testid="profile-name" className="input mt-2" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/>
          </div>
          <div>
            <label className="label">Email</label>
            <div className="flex items-center border rounded-xl px-3 mt-2" style={{ borderColor: "var(--line)" }}>
              <Mail size={16} className="opacity-60"/>
              <input data-testid="profile-email" type="email" className="flex-1 bg-transparent outline-none py-3 px-3" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/>
            </div>
          </div>
          <button data-testid="profile-save" type="submit" disabled={saving} className="btn-primary">
            <Save size={14}/> {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}

      {tab === "addresses" && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div className="serif text-2xl">Saved Addresses</div>
            {!showAdd && (
              <button data-testid="profile-add-addr" onClick={() => setShowAdd(true)} className="btn-ghost !py-2 !px-3 text-sm"><Plus size={14}/> New</button>
            )}
          </div>

          {addrLoading && <div>Loading…</div>}
          {!addrLoading && addresses.length === 0 && !showAdd && (
            <p className="text-sm" style={{ color: "var(--ink-2)" }}>No addresses saved yet.</p>
          )}

          <div className="space-y-3">
            {addresses.map((a) => (
              <div key={a.id} data-testid={`profile-addr-${a.id}`} className="border rounded-2xl p-5" style={{ borderColor: a.is_default ? "var(--brand)" : "var(--line)" }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-medium flex items-center gap-2 flex-wrap">
                      {a.name} · +91 {a.mobile}
                      {a.is_default && <span className="chip !py-0.5 !px-2 text-[10px]">Default</span>}
                    </div>
                    <div className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>
                      {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} — {a.pincode}
                      {a.landmark ? ` · Near ${a.landmark}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {!a.is_default && (
                      <button data-testid={`profile-addr-default-${a.id}`} onClick={() => makeDefault(a.id)} className="text-xs underline flex items-center gap-1">
                        <Star size={12}/> Set default
                      </button>
                    )}
                    <button data-testid={`profile-addr-delete-${a.id}`} onClick={() => deleteAddress(a.id)} style={{ color: "var(--ink-2)" }}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showAdd && (
            <form onSubmit={saveAddress} className="border rounded-2xl p-6 mt-4 grid grid-cols-2 gap-4" style={{ borderColor: "var(--line)" }}>
              <input data-testid="profile-addr-name" required className="input col-span-2" placeholder="Full name" value={addrForm.name} onChange={(e) => setAddrForm({ ...addrForm, name: e.target.value })}/>
              <input data-testid="profile-addr-mobile" required className="input col-span-2" placeholder="10-digit mobile" value={addrForm.mobile} onChange={(e) => setAddrForm({ ...addrForm, mobile: e.target.value.replace(/\D/g, "") })} maxLength={10}/>
              <input data-testid="profile-addr-line1" required className="input col-span-2" placeholder="House / Flat / Building, Street" value={addrForm.line1} onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })}/>
              <input data-testid="profile-addr-line2" className="input col-span-2" placeholder="Area / Locality (optional)" value={addrForm.line2} onChange={(e) => setAddrForm({ ...addrForm, line2: e.target.value })}/>
              <input data-testid="profile-addr-city" required className="input" placeholder="City" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}/>
              <input data-testid="profile-addr-state" required className="input" placeholder="State" value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}/>
              <input data-testid="profile-addr-pincode" required className="input" placeholder="Pincode" maxLength={6} value={addrForm.pincode} onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value.replace(/\D/g, "") })}/>
              <input data-testid="profile-addr-landmark" className="input" placeholder="Landmark (optional)" value={addrForm.landmark} onChange={(e) => setAddrForm({ ...addrForm, landmark: e.target.value })}/>
              <div className="col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
                <button data-testid="profile-addr-save" type="submit" className="btn-primary">Save Address</button>
              </div>
            </form>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="mt-10">
          {ordersLoading && <div>Loading…</div>}
          {!ordersLoading && orders.length === 0 && (
            <div className="mt-6 text-center">
              <div className="serif text-2xl">No orders yet.</div>
              <p className="text-sm mt-2" style={{ color: "var(--ink-2)" }}>Your future orders will appear here.</p>
              <Link data-testid="profile-orders-shop-btn" to="/shop" className="btn-primary mt-6 inline-flex">Start shopping</Link>
            </div>
          )}
          <div className="space-y-5">
            {orders.map((o) => (
              <div key={o.id} data-testid={`profile-order-${o.id}`} className="border rounded-2xl p-6" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="label">Order · {o.id.slice(0, 8)}</div>
                    <div className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>{new Date(o.created_at).toLocaleString("en-IN")}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full ${STATUS_COLORS[o.status] || ""}`}>{o.status}</span>
                    <div className="serif text-xl">{inr(o.total)}</div>
                  </div>
                </div>
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  {o.items.map((i, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <img src={i.image_url} alt={i.name} className="w-14 h-16 object-cover rounded-lg" style={{ background: "var(--bg-2)" }}/>
                      <div className="text-sm">
                        <div className="font-medium">{i.name}</div>
                        <div style={{ color: "var(--ink-2)" }}>{i.size} · Qty {i.qty} · {inr(i.price)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs" style={{ color: "var(--ink-2)" }}>
                  Delivering to {o.address.name}, {o.address.city} — {o.address.pincode} · {o.payment_method === "cod" ? "COD" : "Prepaid"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
