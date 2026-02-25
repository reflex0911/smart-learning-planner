import { NavLink, Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

const THEME_LABEL = {
  obsidian: "Obsidian 🌖",
  midnight: "Midnight 🌙",
  pearl: "Pearl ☀️",
};

export default function Navbar({ theme, setTheme }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm transition ${
      isActive
        ? "bg-[rgba(var(--btn),0.18)]"
        : "opacity-80 hover:opacity-100 hover:bg-[rgba(var(--btn),0.12)]"
    }`;

  useEffect(() => {
    const close = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  const pick = (t) => {
    setTheme(t);
    setOpen(false);
  };

  const doLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const menuBg = theme === "pearl" ? "rgb(255 255 255)" : "rgb(15 23 42)";
  const menuText = theme === "pearl" ? "rgb(15 23 42)" : "rgb(255 255 255)";
  const menuMuted = theme === "pearl" ? "rgb(71 85 105)" : "rgb(203 213 225)";
  const divider =
    theme === "pearl"
      ? "rgba(15,23,42,0.10)"
      : "rgba(255,255,255,0.10)";
  const selectedBg =
    theme === "pearl"
      ? "rgba(15,23,42,0.06)"
      : "rgba(255,255,255,0.10)";
  const hoverBg =
    theme === "pearl"
      ? "rgba(15,23,42,0.05)"
      : "rgba(255,255,255,0.08)";

  return (
    <header
  className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl"
  style={{
    backgroundColor:
      theme === "pearl"
        ? "rgba(255,255,255,0.72)"
        : "rgba(0,0,0,0.18)",

    borderBottom:
      theme === "pearl"
        ? "1px solid rgba(15,23,42,0.10)"
        : "1px solid rgba(255,255,255,0.10)",

    boxShadow:
      theme === "pearl"
        ? "0 10px 30px rgba(0,0,0,0.08)"
        : "0 10px 30px rgba(0,0,0,0.35)",
  }}
>
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-bold text-lg tracking-tight">
          <span className="text-emerald-400">Smart</span>Planner
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/" className={linkClass}>Home</NavLink>
          <NavLink to="/login" className={linkClass}>Login</NavLink>
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {/* User Chip */}
          {user && (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{
                backgroundColor: `rgba(var(--btn), 0.10)`,
                borderColor: `rgba(var(--border), var(--border-alpha))`,
                color: `rgb(var(--text))`,
              }}
            >
              <span className="text-sm opacity-90">Signed in</span>
              <span className="text-sm font-semibold">
                {user.displayName ||
                  (user.email
                    ? user.email.split("@")[0]
                    : "User")}
              </span>
            </div>
          )}

          {/* Logout */}
          {user && (
            <button
              onClick={doLogout}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition border"
              style={{
                backgroundColor: "rgba(239,68,68,0.14)",
                borderColor: "rgba(239,68,68,0.30)",
                color: "rgb(var(--text))",
              }}
            >
              Logout
            </button>
          )}

          {/* Theme Dropdown */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="px-3 py-2 rounded-xl text-sm border flex items-center gap-2"
              style={{
                backgroundColor: `rgba(var(--btn), var(--btn-alpha))`,
                borderColor: `rgba(var(--border), var(--border-alpha))`,
                color: `rgb(var(--text))`,
              }}
            >
              {THEME_LABEL[theme]} <span className="opacity-70">▾</span>
            </button>

            {open && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl border overflow-hidden z-[9999] shadow-[0_25px_70px_rgba(0,0,0,0.45)]"
                style={{
                  backgroundColor: menuBg,
                  color: menuText,
                  borderColor:
                    theme === "pearl"
                      ? "rgba(15,23,42,0.14)"
                      : "rgba(255,255,255,0.18)",
                }}
              >
                {["obsidian", "midnight", "pearl"].map((t, idx) => (
                  <div key={t}>
                    <button
                      onClick={() => pick(t)}
                      className="w-full text-left px-4 py-3 text-sm transition"
                      style={{
                        backgroundColor:
                          theme === t ? selectedBg : "transparent",
                      }}
                    >
                      <div className="font-semibold">
                        {THEME_LABEL[t]}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: menuMuted }}
                      >
                        {t === "obsidian" && "Balanced dark purple"}
                        {t === "midnight" && "Ultra dark pro theme"}
                        {t === "pearl" && "Premium light theme"}
                      </div>
                    </button>

                    {idx !== 2 && (
                      <div
                        style={{
                          height: 1,
                          backgroundColor: divider,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}