"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, User, Package, MapPin, LogOut, ChevronDown } from "lucide-react";

function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const firstName = (user?.name || "").trim().split(" ")[0] || "Account";
  const go = (path) => { setOpen(false); router.push(path); };

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
            onClick={() => { setOpen(false); logout(); router.push("/"); }}
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

export default function Header() {
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  return (
    <header className="glass-header sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
        <Link href="/" data-testid="nav-logo" className="flex items-center gap-2">
          <span className="serif text-2xl font-semibold" style={{ color: "var(--brand)" }}>Premium</span>
          <span className="label" style={{ color: "var(--amber)" }}>Oils</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link data-testid="nav-home" href="/" className="hover:opacity-70">Home</Link>
          <Link data-testid="nav-shop" href="/shop" className="hover:opacity-70">Shop</Link>
          <Link data-testid="nav-shop-groundnut" href="/shop?category=groundnut" className="hover:opacity-70">Groundnut</Link>
          <Link data-testid="nav-shop-coconut" href="/shop?category=coconut" className="hover:opacity-70">Coconut</Link>
          <Link data-testid="nav-shop-almond" href="/shop?category=almond" className="hover:opacity-70">Almond</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user && user.role !== "admin" ? (
            <UserMenu />
          ) : (
            <button data-testid="nav-login" onClick={() => router.push("/login")} className="btn-ghost !py-2 !px-3">
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
