import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Phone, ShieldCheck } from "lucide-react";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

// Handles Google sign-in and, if the account has no mobile number yet (Google doesn't
// provide one), a follow-up step to collect it before calling onDone. Used both on the
// full-page /login route and inline on /checkout, so a returning session that is signed
// in but still missing a mobile number resumes straight at the mobile step.
export default function AuthGate({ onDone }) {
  const { user, loginWithToken, setUser } = useAuth();
  const btnRef = useRef(null);
  const [step, setStep] = useState(() => (user && user.role !== "admin" && !user.mobile) ? "mobile" : "google");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [mockName, setMockName] = useState("");
  const [mockEmail, setMockEmail] = useState("");

  const finishLogin = async (credential) => {
    setLoading(true);
    try {
      const r = await api.post("/auth/google", { credential });
      loginWithToken(r.data.token, r.data.user);
      if (r.data.needs_mobile) setStep("mobile");
      else onDone?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Google sign-in failed");
    } finally { setLoading(false); }
  };

  const saveMobile = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobile)) { toast.error("Enter a valid 10-digit mobile"); return; }
    setLoading(true);
    try {
      const r = await api.put("/auth/me", { mobile });
      setUser(r.data.user);
      onDone?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save mobile number");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (step !== "google" || !GOOGLE_CLIENT_ID) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp) => finishLogin(resp.credential),
      });
      window.google.accounts.id.renderButton(btnRef.current, { theme: "outline", size: "large", width: 320, shape: "pill" });
    };
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (step === "mobile") {
    return (
      <form onSubmit={saveMobile} className="space-y-4">
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink-2)" }}>
          <ShieldCheck size={16}/> One last thing — add your mobile number
        </div>
        <div className="flex items-center border rounded-xl px-3" style={{ borderColor: "var(--line)" }}>
          <Phone size={16} className="opacity-60"/>
          <span className="ml-2 text-sm" style={{ color: "var(--ink-2)" }}>+91</span>
          <input
            data-testid="mobile-gate-input"
            autoFocus
            inputMode="numeric"
            maxLength={10}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
            placeholder="10-digit mobile"
            className="flex-1 bg-transparent outline-none py-3 px-3"
          />
        </div>
        <button data-testid="mobile-gate-submit" type="submit" disabled={loading || mobile.length !== 10} className="btn-primary w-full justify-center">
          {loading ? "Saving…" : "Continue"}
        </button>
      </form>
    );
  }

  if (GOOGLE_CLIENT_ID) {
    return <div ref={btnRef} className="flex justify-center"/>;
  }

  const submitMock = (e) => {
    e.preventDefault();
    if (!mockEmail) { toast.error("Enter an email"); return; }
    finishLogin(JSON.stringify({ sub: mockEmail, email: mockEmail, name: mockName, picture: "" }));
  };

  return (
    <form onSubmit={submitMock} className="space-y-3">
      <div className="text-xs rounded-lg px-3 py-2" style={{ background: "var(--bg-2)", color: "var(--ink-2)" }}>
        Demo mode — Google sign-in isn&apos;t configured yet. Enter a test profile to continue.
      </div>
      <input data-testid="google-mock-name" className="input" placeholder="Name" value={mockName} onChange={(e) => setMockName(e.target.value)}/>
      <input data-testid="google-mock-email" className="input" placeholder="Email" value={mockEmail} onChange={(e) => setMockEmail(e.target.value)}/>
      <button data-testid="google-mock-submit" type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? "Signing in…" : "Continue (demo)"}
      </button>
    </form>
  );
}
