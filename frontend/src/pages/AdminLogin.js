import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { loginWithToken } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post("/auth/admin/login", { email, password });
      loginWithToken(r.data.token, r.data.user);
      toast.success("Welcome, admin");
      nav("/admin");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16 fade-in">
      <div className="chip mb-6">Admin</div>
      <h1 className="serif text-4xl">Store Console</h1>
      <p className="mt-3 text-sm" style={{ color: "var(--ink-2)" }}>Sign in with your admin credentials.</p>
      <form onSubmit={submit} className="mt-8 space-y-3">
        <input data-testid="admin-email" type="email" required className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}/>
        <div className="relative">
          <input data-testid="admin-password" type="password" required className="input pr-10" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}/>
          <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40"/>
        </div>
        <button data-testid="admin-login-btn" type="submit" disabled={loading} className="btn-primary w-full justify-center !rounded-md">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
