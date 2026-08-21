"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { inr } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLoadOnReady } from "@/hooks/useLoadOnReady";
import { toast } from "sonner";
import { User, Phone, Mail, MapPin, Package, Plus, Trash2, Star, Save } from "lucide-react";
import AddressForm from "@/components/AddressForm";

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

export default function ProfileView() {
  const authorized = useRequireAuth();
  const { user, setUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "details";
  const setTab = (t) => router.push(t === "details" ? pathname : `${pathname}?tab=${t}`);

  // details
  const [form, setForm] = useState({ name: "", mobile: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing form defaults from loaded user
    if (user) setForm({ name: user.name || "", mobile: user.mobile || "" });
  }, [user]);

  const saveDetails = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.mobile)) return toast.error("Enter a valid 10-digit mobile");
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
  const [addrSaving, setAddrSaving] = useState(false);

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
    setAddrSaving(true);
    try {
      await api.post("/addresses", addrForm);
      toast.success("Address saved");
      setShowAdd(false);
      setAddrForm(emptyAddrForm);
      await loadAddresses();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save address");
    } finally { setAddrSaving(false); }
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

  useLoadOnReady(authorized, loadAddresses, "Failed to load addresses");
  useLoadOnReady(authorized, loadOrders, "Failed to load orders");

  if (!authorized) return null;

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
            <div className="flex items-center border rounded-xl px-3 mt-2" style={{ borderColor: "var(--line)" }}>
              <Phone size={16} className="opacity-60"/>
              <span className="ml-2 text-sm" style={{ color: "var(--ink-2)" }}>+91</span>
              <input
                data-testid="profile-mobile"
                inputMode="numeric"
                maxLength={10}
                className="flex-1 bg-transparent outline-none py-3 px-3"
                placeholder="10-digit mobile"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })}
              />
            </div>
          </div>
          <div>
            <label className="label">Full name</label>
            <input data-testid="profile-name" className="input mt-2" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/>
          </div>
          <div>
            <label className="label">Email</label>
            <div className="flex items-center border rounded-xl px-3 mt-2" style={{ borderColor: "var(--line)", background: "var(--bg-2)" }}>
              <Mail size={16} className="opacity-60"/>
              <span data-testid="profile-email" className="flex-1 py-3 px-3 text-sm">{user?.email}</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--ink-2)" }}>From your Google account — can&apos;t be changed here.</p>
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
            <AddressForm
              value={addrForm}
              onChange={setAddrForm}
              onSubmit={saveAddress}
              onCancel={() => setShowAdd(false)}
              submitting={addrSaving}
              testIdPrefix="profile-addr"
            />
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
              <Link data-testid="profile-orders-shop-btn" href="/shop" className="btn-primary mt-6 inline-flex">Start shopping</Link>
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
                      {i.image_url ? (
                        <Image src={i.image_url} alt={i.name} width={56} height={64} className="w-14 h-16 object-cover rounded-lg" style={{ background: "var(--bg-2)" }}/>
                      ) : (
                        <div className="w-14 h-16 rounded-lg flex-shrink-0" style={{ background: "var(--bg-2)" }}/>
                      )}
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
