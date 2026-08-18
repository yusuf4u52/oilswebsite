import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider, useCart } from "@/context/CartContext";
import Home from "@/pages/Home";
import CartDrawer from "@/components/CartDrawer";
import { ShoppingBag, User, Package, MapPin, LogOut, ChevronDown } from "lucide-react";
import "@/App.css";

const Shop = lazy(() => import("@/pages/Shop"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Login = lazy(() => import("@/pages/Login"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Orders = lazy(() => import("@/pages/Orders"));
const Profile = lazy(() => import("@/pages/Profile"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));

function UserMenu() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const firstName = (user?.name || "").trim().split(" ")[0] || "Account";
  const go = (path) => { setOpen(false); nav(path); };

  const items = [
    { key: "profile", label: "Profile", icon: User, action: () => go("/profile") },
    { key: "addresses", label: "Addresses", icon: MapPin, action: () => go("/profile?tab=addresses") },
    { key: "orders", label: "Orders", icon: Package, action: () => go("/profile?tab=orders") },
  ];

  return (
    <div className="relative" ref={ref}>
      <button data-testid="nav-user-menu" onClick={() => setOpen((o) => !o)} className="btn-ghost !py-2 !px-3">
        <User size={16}/>
        <span className="hidden sm:inline">{firstName}</span>
        <ChevronDown size={14} style={{ transition: "transform 150ms ease", transform: open ? "rotate(180deg)" : "none" }}/>
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-52 rounded-2xl border z-50 py-2"
          style={{ borderColor: "var(--line)", background: "var(--bg)", boxShadow: "0 20px 40px -20px rgba(28,25,23,0.25)" }}
        >
          {items.map((it) => {
            const Ic = it.icon;
            return (
              <button
                key={it.key}
                data-testid={`user-menu-${it.key}`}
                onClick={it.action}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:opacity-70"
              >
                <Ic size={15}/> {it.label}
              </button>
            );
          })}
          <div className="my-1 mx-4" style={{ borderTop: "1px solid var(--line)" }}/>
          <button
            data-testid="user-menu-logout"
            onClick={() => { setOpen(false); logout(); nav("/"); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:opacity-70"
            style={{ color: "var(--ink-2)" }}
          >
            <LogOut size={15}/> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Header() {
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const isAdmin = loc.pathname.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <header className="glass-header sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2">
          <span className="serif text-2xl font-semibold" style={{ color: "var(--brand)" }}>Premium</span>
          <span className="label" style={{ color: "var(--amber)" }}>Oils</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link data-testid="nav-home" to="/" className="hover:opacity-70">Home</Link>
          <Link data-testid="nav-shop" to="/shop" className="hover:opacity-70">Shop</Link>
          <Link data-testid="nav-shop-groundnut" to="/shop?category=groundnut" className="hover:opacity-70">Groundnut</Link>
          <Link data-testid="nav-shop-coconut" to="/shop?category=coconut" className="hover:opacity-70">Coconut</Link>
          <Link data-testid="nav-shop-almond" to="/shop?category=almond" className="hover:opacity-70">Almond</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user && user.role !== "admin" ? (
            <UserMenu />
          ) : (
            <button data-testid="nav-login" onClick={() => nav("/login")} className="btn-ghost !py-2 !px-3">
              <User size={16}/><span className="hidden sm:inline">Login</span>
            </button>
          )}
          <button data-testid="nav-cart" onClick={() => setOpen(true)} className="relative btn-primary !py-2 !px-4">
            <ShoppingBag size={16}/>
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span data-testid="cart-count" className="ml-1 min-w-[22px] h-[22px] rounded-full bg-white text-[#1B4332] text-xs font-semibold flex items-center justify-center px-1">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const loc = useLocation();
  if (loc.pathname.startsWith("/admin")) return null;
  return (
    <footer className="mt-24 border-t" style={{ borderColor: "var(--line)" }}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-14 grid md:grid-cols-4 gap-10">
        <div>
          <div className="serif text-2xl font-semibold" style={{ color: "var(--brand)" }}>Premium Oils</div>
          <p className="mt-3 text-sm" style={{ color: "var(--ink-2)" }}>
            Cold-pressed, unrefined, honest oils — made the way your grandmother would have chosen.
          </p>
        </div>
        <div>
          <div className="label mb-3">Shop</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop?category=groundnut">Groundnut Oil</Link></li>
            <li><Link to="/shop?category=coconut">Coconut Oil</Link></li>
            <li><Link to="/shop?category=almond">Almond Oil</Link></li>
          </ul>
        </div>
        <div>
          <div className="label mb-3">Company</div>
          <ul className="space-y-2 text-sm" style={{ color: "var(--ink-2)" }}>
            <li>About</li><li>Sourcing</li><li>Contact</li>
          </ul>
        </div>
        <div>
          <div className="label mb-3">Support</div>
          <ul className="space-y-2 text-sm" style={{ color: "var(--ink-2)" }}>
            <li>+91 8407986619</li>
            <li>care@premiumoils.in</li>
            <li>Mon–Sat, 9am–7pm</li>
          </ul>
        </div>
      </div>
      <div className="text-xs text-center py-6 border-t" style={{ color: "var(--ink-2)", borderColor: "var(--line)" }}>
        © {new Date().getFullYear()} Premium Oils · Made with care in India
      </div>
    </footer>
  );
}

function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return null;
  if (!user || user.role === "admin") {
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  }
  return children;
}

function RequireAdmin({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user || user.role !== "admin") return <Navigate to="/admin/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="App">
            <Header />
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              </Routes>
            </Suspense>
            <CartDrawer />
            <Footer />
          </div>
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
