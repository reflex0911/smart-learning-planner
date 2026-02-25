import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
} from "firebase/auth";

const Login = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState("email"); // "email" | "phone"
  const [show, setShow] = useState(false);

  // ✅ auth type toggle for BOTH modes
  const [authMode, setAuthMode] = useState("login"); // "login" | "signup"

  // email auth
  const [email, setEmail] = useState("");
  const [emailPass, setEmailPass] = useState("");

  // phone auth (FREE: synthetic email)
  const countries = useMemo(
    () => [
      { code: "+91", label: "IN" },
      { code: "+1", label: "US" },
      { code: "+44", label: "UK" },
      { code: "+971", label: "UAE" },
    ],
    []
  );
  const [country, setCountry] = useState(countries[0].code);
  const [phone, setPhone] = useState("");
  const [phonePass, setPhonePass] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ✅ Auto-redirect when user is logged in
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) navigate("/dashboard", { replace: true });
    });
    return () => unsub();
  }, [navigate]);

  // UI tokens
  const pillBase =
    "flex-1 rounded-2xl px-3 py-2 text-sm font-semibold transition border";
  const pillActive =
    "bg-emerald-500 text-black border-emerald-400/30 shadow-[0_10px_22px_rgba(16,185,129,0.25)]";
  const pillIdle =
    "bg-white/80 text-slate-700 border-black/10 hover:bg-white shadow-sm";

  const tinyToggle =
    "px-3 py-1.5 rounded-xl text-xs font-semibold border transition";
  const tinyActive =
    "bg-slate-900 text-white border-slate-900 shadow-[0_10px_22px_rgba(0,0,0,0.18)]";
  const tinyIdle =
    "bg-white text-slate-700 border-black/10 hover:bg-slate-50";

  const input =
    "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none shadow-[0_6px_18px_rgba(0,0,0,0.06)] focus:ring-2 focus:ring-emerald-400/40";

  const card =
    "rounded-3xl border border-black/10 bg-white/95 backdrop-blur shadow-[0_30px_120px_rgba(0,0,0,0.25)] p-7 sm:p-8";

  const primaryBtn =
    "w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 py-3 font-semibold text-black shadow-[0_18px_45px_rgba(16,185,129,0.30)] hover:brightness-105 active:scale-[0.99] transition disabled:opacity-60";

  const setPrettyError = (e) => {
    const code = e?.code || "";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password")
      return "Password galat hai.";
    if (code === "auth/user-not-found") return "Account nahi mila (create kar lo).";
    if (code === "auth/invalid-email") return "Email format galat hai.";
    if (code === "auth/email-already-in-use")
      return "Account already exist karta hai. Login kar lo.";
    if (code === "auth/weak-password") return "Password thoda strong rakho (min 6 chars).";
    if (code === "auth/popup-closed-by-user") return "Popup close ho gaya.";
    if (code === "auth/unauthorized-domain")
      return "Firebase me Authorized domains me localhost add nahi hai.";
    return e?.message || "Something went wrong.";
  };

  const normalizePhone = (raw) => raw.replace(/[^\d]/g, "");
  const phoneToEmail = (cc, raw) => `${cc}${normalizePhone(raw)}@phone.local`;

  // ✅ EMAIL login/signup
  const handleEmailAuth = async () => {
    setErr("");
    if (!email || !emailPass) return setErr("Email aur password dono bhar.");
    if (authMode === "signup" && emailPass.length < 6)
      return setErr("Password min 6 characters hona chahiye.");

    setLoading(true);
    try {
      if (authMode === "signup") {
        await createUserWithEmailAndPassword(auth, email.trim(), emailPass);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), emailPass);
      }
    } catch (e) {
      setErr(setPrettyError(e));
    } finally {
      setLoading(false);
    }
  };

  // ✅ PHONE login/signup (FREE: synthetic email)
  const handlePhoneAuth = async () => {
    setErr("");
    const digits = normalizePhone(phone);
    if (!digits || digits.length < 8) return setErr("Phone number sahi se daal.");
    if (!phonePass) return setErr("Password bhar.");
    if (authMode === "signup" && phonePass.length < 6)
      return setErr("Password min 6 characters hona chahiye.");

    const syntheticEmail = phoneToEmail(country, phone);

    setLoading(true);
    try {
      if (authMode === "signup") {
        await createUserWithEmailAndPassword(auth, syntheticEmail, phonePass);
      } else {
        await signInWithEmailAndPassword(auth, syntheticEmail, phonePass);
      }
    } catch (e) {
      setErr(setPrettyError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErr("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      setErr(setPrettyError(e));
    } finally {
      setLoading(false);
    }
  };

  const title =
    authMode === "signup"
      ? "Create Account ✨"
      : "Welcome Back 👋";

  const subtitle =
    authMode === "signup"
      ? "Make your Smart Planner account"
      : "Login to continue to Smart Planner";

  return (
    <div className="w-full">
      <main className="mx-auto max-w-6xl px-4 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-full max-w-md py-10">
          <div className="relative">
            <div className="absolute -inset-3 rounded-[28px] bg-white/10 blur-2xl" />
            <div className="absolute -inset-2 rounded-[26px] border border-white/20 backdrop-blur-xl" />

            <div className={`relative ${card}`}>
              <div className="text-center">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  {title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
              </div>

              {/* ✅ Login / Create toggle (works for BOTH email+phone) */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`${tinyToggle} ${authMode === "login" ? tinyActive : tinyIdle}`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`${tinyToggle} ${authMode === "signup" ? tinyActive : tinyIdle}`}
                >
                  Create account
                </button>
              </div>

              {/* Mode toggle */}
              <div className="mt-5 flex gap-2 rounded-3xl bg-slate-50 p-1 border border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                <button
                  type="button"
                  onClick={() => setMode("email")}
                  className={`${pillBase} ${mode === "email" ? pillActive : pillIdle}`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setMode("phone")}
                  className={`${pillBase} ${mode === "phone" ? pillActive : pillIdle}`}
                >
                  Phone
                </button>
              </div>

              {/* Google login only (still works) */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.10)] hover:bg-slate-50 active:scale-[0.99] transition disabled:opacity-60"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.9 0 7.1 1.3 9.7 3.8l7.2-7.2C36.3 2.4 30.6 0 24 0 14.6 0 6.4 5.4 2.6 13.3l8.6 6.7C13.4 13.3 18.3 9.5 24 9.5z"/>
                    <path fill="#34A853" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.6H24v9h12.6c-.5 2.7-2.1 5-4.4 6.5l6.8 5.3c4-3.7 6.5-9.1 6.5-15.2z"/>
                    <path fill="#4A90E2" d="M11.2 28.9c-1-2.7-1-5.6 0-8.3l-8.6-6.7C-1 20.4-1 27.6 2.6 34.7l8.6-5.8z"/>
                    <path fill="#FBBC05" d="M24 48c6.6 0 12.3-2.2 16.4-6l-6.8-5.3c-2 1.4-4.6 2.2-9.6 2.2-5.7 0-10.6-3.8-12.3-9.1l-8.6 5.8C6.4 42.6 14.6 48 24 48z"/>
                  </svg>
                  {loading ? "Please wait..." : "Continue with Google"}
                </button>
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {err && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {err}
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                {mode === "email" ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        className={`${input} mt-1`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Password
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type={show ? "text" : "password"}
                          placeholder="••••••••"
                          className={`${input} pr-14`}
                          value={emailPass}
                          onChange={(e) => setEmailPass(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
                        />
                        <button
                          type="button"
                          onClick={() => setShow((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                          {show ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleEmailAuth}
                      disabled={loading}
                      className={primaryBtn}
                    >
                      {loading
                        ? "Please wait..."
                        : authMode === "signup"
                        ? "Create account"
                        : "Login"}
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Phone number
                      </label>
                      <div className="mt-1 flex gap-2">
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-slate-900 outline-none shadow-[0_6px_18px_rgba(0,0,0,0.06)] focus:ring-2 focus:ring-emerald-400/40"
                        >
                          {countries.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.label} {c.code}
                            </option>
                          ))}
                        </select>

                        <input
                          type="tel"
                          placeholder="98765 43210"
                          className={`${input} flex-1`}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Password
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type={show ? "text" : "password"}
                          placeholder="••••••••"
                          className={`${input} pr-14`}
                          value={phonePass}
                          onChange={(e) => setPhonePass(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handlePhoneAuth()}
                        />
                        <button
                          type="button"
                          onClick={() => setShow((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                          {show ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePhoneAuth}
                      disabled={loading}
                      className={primaryBtn}
                    >
                      {loading
                        ? "Please wait..."
                        : authMode === "signup"
                        ? "Create account"
                        : "Login"}
                    </button>
                  </>
                )}

                {/* NOTE: No external signup page link now */}
                <p className="text-xs text-center text-slate-500 pt-1">
                  Tip: Create account toggle se hi signup hoga ✅
                </p>

                <p className="text-xs text-center text-slate-500">
                  <Link to="/" className="underline underline-offset-4">
                    Back to Home
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-white/60">
            By continuing, you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;