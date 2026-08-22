"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { inr } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useRequireAdmin } from "@/hooks/useRequireAuth";
import { useLoadOnReady } from "@/hooks/useLoadOnReady";
import { toast } from "sonner";
import { LogOut, Package, ShoppingBag, IndianRupee, Users } from "lucide-react";
import OrdersTab from "@/components/admin/OrdersTab";
import CustomersTab from "@/components/admin/CustomersTab";
import ProductsTab from "@/components/admin/ProductsTab";
import ReviewsTab from "@/components/admin/ReviewsTab";
import ProductFormModal from "@/components/admin/ProductFormModal";

export default function AdminDashboardView() {
  const authorized = useRequireAdmin();
  const [tab, setTab] = useState("orders");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const { logout } = useAuth();
  const router = useRouter();

  const load = async () => {
    const [s, o, p, c, r] = await Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/orders"),
      api.get("/products"),
      api.get("/admin/users"),
      api.get("/admin/reviews"),
    ]);
    setStats(s.data); setOrders(o.data.orders ?? []); setProducts(p.data.products ?? []);
    setCustomers(c.data.users ?? []); setReviews(r.data.reviews ?? []);
  };

  useLoadOnReady(authorized, load, "Failed to load dashboard data");

  if (!authorized) return null;

  const changeStatus = async (id, status) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status });
      toast.success("Order updated");
      load();
    } catch (err) { toast.error("Failed to update"); }
  };

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (p) => { setEditing(p); setShowForm(true); };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to delete product");
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this unpaid order?")) return;
    try {
      await api.delete(`/admin/orders/${id}`);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to delete order");
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to delete review");
    }
  };

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
          {["orders", "products", "customers", "reviews"].map((t) => (
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

        {tab === "orders" && <OrdersTab orders={orders} onChangeStatus={changeStatus} onDelete={deleteOrder} />}
        {tab === "customers" && <CustomersTab customers={customers} />}
        {tab === "products" && (
          <ProductsTab products={products} onNew={openNew} onEdit={openEdit} onDelete={deleteProduct} />
        )}
        {tab === "reviews" && <ReviewsTab reviews={reviews} onDelete={deleteReview} />}
      </div>

      {showForm && (
        <ProductFormModal
          editing={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}
