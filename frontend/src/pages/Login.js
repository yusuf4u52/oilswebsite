import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Phone, ShieldCheck } from "lucide-react";

export default function Login() {
  const [step, setStep] = useState("mobile");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginWithToken } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/";

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
      nav(next);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid OTP");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16 fade-in">
      <div className="chip mb-6">Secure login</div>
      <h1 className="serif text-4xl leading-tight">Sign in with your<br/>mobile number.</h1>
      <p className="mt-3 text-sm" style={{ color: "var(--ink-2)" }}>
        We&apos;ll send you a 6-digit code. No passwords to remember.
      </p>

      {step === "mobile" && (
        <form onSubmit={requestOtp} className="mt-10 space-y-4">
          <label className="label">Mobile number</label>
          <div className="flex items-center border rounded-xl px-3" style={{ borderColor: "var(--line)" }}>
            <Phone size={16} className="opacity-60"/>
            <span className="ml-2 text-sm" style={{ color: "var(--ink-2)" }}>+91</span>
            <input
              data-testid="login-mobile-input"
              autoFocus
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit mobile"
              className="flex-1 bg-transparent outline-none py-3 px-3"
            />
          </div>
          <button data-testid="login-send-otp" type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? "Sending…" : "Send OTP"}
          </button>
          <div className="text-xs text-center pt-2" style={{ color: "var(--ink-2)" }}>
            Or <Link to="/admin/login" data-testid="login-admin-link" className="underline">sign in as admin</Link>
          </div>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={verifyOtp} className="mt-10 space-y-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--ink-2)" }}>
            <ShieldCheck size={16}/> Enter the 6-digit code sent to +91 {mobile}
          </div>
          {demoCode && (
            <div className="text-xs rounded-lg px-3 py-2" style={{ background: "var(--bg-2)", color: "var(--ink-2)" }}>
              Demo mode — your code is <b data-testid="login-demo-code">{demoCode}</b>
            </div>
          )}
          <input
            data-testid="login-otp-input"
            autoFocus
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="——————"
            className="input text-center serif text-3xl tracking-[0.4em]"
          />
          <button data-testid="login-verify-otp" type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full justify-center">
            {loading ? "Verifying…" : "Verify & Continue"}
          </button>
          <button type="button" data-testid="login-change-mobile" onClick={() => setStep("mobile")} className="text-sm underline w-full">
            Change mobile number
          </button>
        </form>
      )}
    </div>
  );
}
