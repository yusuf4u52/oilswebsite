"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { inr } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useRequireAdmin } from "@/hooks/useRequireAuth";
import { toast } from "sonner";
import { LogOut, Package, ShoppingBag, IndianRupee, Users, Plus, Trash2, Pencil, X, UploadCloud } from "lucide-react";

const emptyProduct = {
  slug: "", name: "", category: "groundnut",
  short_description: "", description: "",
  image_url: "", gallery: [],
  highlights: [],
  variants: [{ size: "500ml", price: 0, mrp: 0, stock: 100 }],
  is_active: true,
};

export default function AdminDashboardView() {
  const authorized = useRequireAdmin();
  const [tab, setTab] = useState("orders");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [uploading, setUploading] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const load = async () => {
    const [s, o, p, c] = await Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/orders"),
      api.get("/products"),
      api.get("/admin/users"),
    ]);
    setStats(s.data); setOrders(o.data.orders ?? []); setProducts(p.data.products ?? []);
    setCustomers(c.data.users ?? []);
  };

  useEffect(() => {
    if (!authorized) return;
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  if (!authorized) return null;

  const changeStatus = async (id, status) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status });
      toast.success("Order updated");
      load();
    } catch (err) { toast.error("Failed to update"); }
  };

  const openNew = () => { setEditing(null); setForm(emptyProduct); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      slug: p.slug, name: p.name, category: p.category,
      short_description: p.short_description, description: p.description,
      image_url: p.image_url, gallery: p.gallery || [],
      highlights: p.highlights || [],
      variants: p.variants.map((v) => ({ ...v })),
      is_active: p.is_active,
    });
    setShowForm(true);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    if (!form.image_url) {
      toast.error("Please upload a product image");
      return;
    }
    try {
      if (editing) await api.put(`/admin/products/${editing.id}`, form);
      else await api.post("/admin/products", form);
      toast.success("Saved");
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed");
    }
  };

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await api.post("/admin/upload", fd);
      setForm((f) => ({ ...f, image_url: res.data.url }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await api.delete(`/admin/products/${id}`);
    toast.success("Deleted");
    load();
  };

  const updateVariant = (idx, patch) => {
    const v = [...form.variants]; v[idx] = { ...v[idx], ...patch }; setForm({ ...form, variants: v });
  };
  const addVariant = () => setForm({ ...form, variants: [...form.variants, { size: "", price: 0, mrp: 0, stock: 100 }] });
  const removeVariant = (idx) => setForm({ ...form, variants: form.variants.filter((_, i) => i !== idx) });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="border-b" style={{ borderColor: "var(--line)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="serif text-xl" style={{ color: "var(--brand)" }}>Premium Oils · Console</div>
          </div>
          <button data-testid="admin-logout" onClick={() => { logout(); router.push("/admin/login"); }} className="btn-ghost !py-2 !px-3 !rounded-md text-sm">
            <LogOut size={14}/> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: IndianRupee, label: "Revenue", value: stats ? inr(stats.revenue) : "—" },
            { icon: ShoppingBag, label: "Orders", value: stats?.total_orders ?? "—" },
            { icon: Package, label: "Products", value: stats?.products ?? "—" },
            { icon: Users, label: "Customers", value: stats?.users ?? "—" },
          ].map((c) => {
            const Ic = c.icon;
            return (
              <div key={c.label} className="border rounded-md p-5" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center gap-2 label"><Ic size={14}/> {c.label}</div>
                <div className="serif text-3xl mt-2">{c.value}</div>
              </div>
            );
          })}
        </div>

        {/* tabs */}
        <div className="flex gap-2 mt-8 border-b" style={{ borderColor: "var(--line)" }}>
          {["orders", "products", "customers"].map((t) => (
            <button
              data-testid={`admin-tab-${t}`}
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm capitalize ${tab === t ? "border-b-2 font-semibold" : ""}`}
              style={{ borderColor: tab === t ? "var(--brand)" : "transparent", color: tab === t ? "var(--brand)" : "var(--ink)" }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "orders" && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left label" style={{ color: "var(--ink-2)" }}>
                  <th className="py-3">Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center" style={{ color: "var(--ink-2)" }}>No orders yet.</td></tr>
                )}
                {orders.map((o) => {
                  const isUnpaid = o.payment_method === "razorpay" && o.payment_status !== "paid";
                  const paymentColors = { paid: "#1B7A43", cod_pending: "#B7791F", failed: "#C0392B" };
                  const statusOptions = isUnpaid
                    ? ["pending", "cancelled"]
                    : ["pending", "confirmed", "shipped", "delivered", "cancelled"];
                  return (
                  <tr key={o.id} className="border-t" style={{ borderColor: "var(--line)" }} data-testid={`admin-order-${o.id}`}>
                    <td className="py-3">
                      <div className="font-mono text-xs">{o.id.slice(0, 8)}</div>
                      <div className="text-xs" style={{ color: "var(--ink-2)" }}>{new Date(o.created_at).toLocaleDateString("en-IN")}</div>
                    </td>
                    <td>
                      <div>{o.address.name}</div>
                      <div className="text-xs" style={{ color: "var(--ink-2)" }}>+91 {o.address.mobile}</div>
                    </td>
                    <td>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                    <td className="font-medium">{inr(o.total)}</td>
                    <td className="text-xs">
                      <div>{o.payment_method}</div>
                      <div style={{ color: paymentColors[o.payment_status] || "var(--ink-2)", fontWeight: isUnpaid ? 600 : 400 }}>
                        {isUnpaid ? "unpaid" : o.payment_status}
                      </div>
                    </td>
                    <td>
                      <select
                        data-testid={`admin-order-status-${o.id}`}
                        value={o.status}
                        onChange={(e) => changeStatus(o.id, e.target.value)}
                        className="input !py-1 !px-2 text-xs"
                      >
                        {statusOptions.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td></td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === "customers" && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left label" style={{ color: "var(--ink-2)" }}>
                  <th className="py-3">Customer</th><th>Contact</th><th>Joined</th><th>Orders</th><th>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center" style={{ color: "var(--ink-2)" }}>No customers yet.</td></tr>
                )}
                {customers.map((c) => (
                  <tr key={c.id} className="border-t" style={{ borderColor: "var(--line)" }} data-testid={`admin-customer-${c.id}`}>
                    <td className="py-3">
                      <div>{c.name || "—"}</div>
                    </td>
                    <td>
                      <div className="text-xs">{c.email || "—"}</div>
                      <div className="text-xs" style={{ color: "var(--ink-2)" }}>{c.mobile ? `+91 ${c.mobile}` : ""}</div>
                    </td>
                    <td className="text-xs" style={{ color: "var(--ink-2)" }}>{c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN") : "—"}</td>
                    <td>{c.order_count ?? 0}</td>
                    <td className="font-medium">{inr(c.total_spent ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "products" && (
          <div className="mt-6">
            <div className="flex justify-end mb-4">
              <button data-testid="admin-new-product" onClick={openNew} className="btn-primary !rounded-md text-sm"><Plus size={14}/> New Product</button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {products.map((p) => (
                <div key={p.id} data-testid={`admin-product-${p.slug}`} className="border rounded-md p-5 flex gap-4" style={{ borderColor: "var(--line)" }}>
                  <img src={p.image_url} alt={p.name} className="w-24 h-28 object-cover rounded-md"/>
                  <div className="flex-1">
                    <div className="label" style={{ color: "var(--amber)" }}>{p.category}</div>
                    <div className="serif text-xl mt-1">{p.name}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--ink-2)" }}>{p.variants.length} sizes · from {inr(Math.min(...p.variants.map(v => v.price)))}</div>
                    <div className="mt-3 flex gap-2">
                      <button data-testid={`admin-edit-${p.slug}`} onClick={() => openEdit(p)} className="btn-ghost !py-1.5 !px-3 !rounded-md text-xs"><Pencil size={12}/> Edit</button>
                      <button data-testid={`admin-delete-${p.slug}`} onClick={() => deleteProduct(p.id)} className="btn-ghost !py-1.5 !px-3 !rounded-md text-xs"><Trash2 size={12}/> Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <form
            onSubmit={saveProduct}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="serif text-2xl">{editing ? "Edit Product" : "New Product"}</div>
              <button type="button" onClick={() => setShowForm(false)}><X size={18}/></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input data-testid="pf-name" required className="input col-span-2" placeholder="Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")})}/>
              <input data-testid="pf-slug" required className="input" placeholder="Slug (unique)" value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})}/>
              <select data-testid="pf-category" className="input" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                {["groundnut","coconut","almond","other"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="col-span-2 flex items-center gap-3">
                <label className="btn-ghost !py-1.5 !px-3 !rounded-md text-xs cursor-pointer">
                  <UploadCloud size={12}/> {uploading ? "Uploading..." : form.image_url ? "Replace image" : "Upload image"}
                  <input data-testid="pf-image-file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={uploadImage} disabled={uploading}/>
                </label>
                {form.image_url && (
                  <img src={form.image_url} alt="Preview" className="h-12 w-12 object-cover rounded-md border" style={{ borderColor: "var(--line)" }}/>
                )}
              </div>
              <input data-testid="pf-short" required className="input col-span-2" placeholder="Short description" value={form.short_description} onChange={(e) => setForm({...form, short_description: e.target.value})}/>
              <textarea data-testid="pf-desc" required className="input col-span-2" rows={3} placeholder="Full description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}/>
              <input data-testid="pf-highlights" className="input col-span-2" placeholder="Highlights (comma-separated)" value={(form.highlights || []).join(", ")} onChange={(e) => setForm({...form, highlights: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)})}/>
            </div>
            <div>
              <div className="label mb-2">Variants</div>
              <div className="grid grid-cols-12 gap-2 mb-1 text-xs" style={{ color: "var(--ink-2)" }}>
                <div className="col-span-3">Size</div>
                <div className="col-span-3">Price</div>
                <div className="col-span-3">MRP</div>
                <div className="col-span-2">Stock</div>
                <div className="col-span-1"></div>
              </div>
              {form.variants.map((v, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  <input data-testid={`pf-v-size-${idx}`} className="input col-span-3" placeholder="Size" value={v.size} onChange={(e) => updateVariant(idx, { size: e.target.value })}/>
                  <input data-testid={`pf-v-price-${idx}`} type="number" className="input col-span-3" placeholder="Price" value={v.price} onChange={(e) => updateVariant(idx, { price: Number(e.target.value) })}/>
                  <input data-testid={`pf-v-mrp-${idx}`} type="number" className="input col-span-3" placeholder="MRP" value={v.mrp} onChange={(e) => updateVariant(idx, { mrp: Number(e.target.value) })}/>
                  <input data-testid={`pf-v-stock-${idx}`} type="number" className="input col-span-2" placeholder="Stock" value={v.stock} onChange={(e) => updateVariant(idx, { stock: Number(e.target.value) })}/>
                  <button type="button" onClick={() => removeVariant(idx)} className="col-span-1"><Trash2 size={14}/></button>
                </div>
              ))}
              <button type="button" onClick={addVariant} className="btn-ghost !py-1.5 !px-3 !rounded-md text-xs"><Plus size={12}/> Add variant</button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost !rounded-md">Cancel</button>
              <button data-testid="pf-save" type="submit" className="btn-primary !rounded-md">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
