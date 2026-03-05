import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const THEME_LABEL = {
  obsidian: "Obsidian 🌖",
  midnight: "Midnight 🌙",
  pearl: "Pearl ☀️",
};

export default function Sidebar({ open, onClose, theme, setTheme, user }) {
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // lock body scroll on mobile when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const doLogout = async () => {
    await signOut(auth);
    onClose();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition border ${
      isActive
        ? "border-emerald-400/40 bg-emerald-400/15"
        : "border-transparent hover:border-white/10 hover:bg-white/5"
    }`;

  const isPearl = theme === "pearl";

  const panelBg = isPearl ? "rgba(255,255,255,0.78)" : "rgba(2,6,23,0.72)";
  const panelBorder = isPearl ? "rgba(15,23,42,0.12)" : "rgba(255,255,255,0.12)";
  const text = isPearl ? "rgb(15 23 42)" : "rgb(255 255 255)";
  const muted = isPearl ? "rgb(71 85 105)" : "rgba(255,255,255,0.72)";

  // outside click
  const onOverlayClick = (e) => {
    if (!panelRef.current) return;
    if (!panelRef.current.contains(e.target)) onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* overlay */}
      <div
        onMouseDown={onOverlayClick}
        className={`absolute inset-0 transition ${
          open ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: isPearl ? "rgba(15,23,42,0.30)" : "rgba(0,0,0,0.55)",
          backdropFilter: "blur(10px)",
        }}
      />

      {/* panel */}
      <aside
        ref={panelRef}
        className={`absolute left-0 top-0 h-full w-[86%] max-w-[360px] transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: panelBg,
          borderRight: `1px solid ${panelBorder}`,
          color: text,
          backdropFilter: "blur(18px)",
        }}
      >
        {/* header */}
        <div className="px-5 py-4 border-b" style={{ borderColor: panelBorder }}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-lg font-extrabold tracking-tight">
                <span className="text-emerald-400">Smart</span>Planner
              </div>
              <div className="text-xs mt-1" style={{ color: muted }}>
                Plan • Focus • Streaks ✨
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl px-3 py-2 text-sm font-semibold border"
              style={{
                borderColor: panelBorder,
                background: isPearl ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.06)",
              }}
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* user */}
          {user ? (
            <div
              className="mt-4 rounded-2xl p-3 border"
              style={{
                borderColor: panelBorder,
                background: isPearl ? "rgba(15,23,42,0.05)" : "rgba(255,255,255,0.05)",
              }}
            >
              <div className="text-xs" style={{ color: muted }}>
                Signed in as
              </div>
              <div className="text-sm font-bold truncate">
                {user.displayName || (user.email ? user.email.split("@")[0] : "User")}
              </div>
              {user.email && (
                <div className="text-xs truncate mt-1" style={{ color: muted }}>
                  {user.email}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 text-sm" style={{ color: muted }}>
              You’re not logged in.
            </div>
          )}
        </div>

        {/* nav */}
        <div className="px-4 py-4 space-y-2">
          <NavLink to="/" className={linkClass} onClick={onClose}>
            🏠 Home
          </NavLink>

          {user ? (
            <NavLink to="/dashboard" className={linkClass} onClick={onClose}>
              📊 Dashboard
            </NavLink>
          ) : (
            <NavLink to="/login" className={linkClass} onClick={onClose}>
              🔐 Login
            </NavLink>
          )}

          {/* Quick actions */}
          <div
            className="mt-4 rounded-2xl p-3 border"
            style={{
              borderColor: panelBorder,
              background: isPearl ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.04)",
            }}
          >
            <div className="text-xs font-bold" style={{ color: muted }}>
              Quick Actions
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onClose();
                  navigate("/dashboard");
                }}
                className="rounded-2xl px-3 py-3 text-sm font-semibold border transition active:scale-[0.99]"
                style={{
                  borderColor: panelBorder,
                  background: isPearl ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.06)",
                }}
              >
                ⚡ Open Planner
              </button>

              <button
                onClick={() => {
                  // optional: you can wire this to your own reset event later
                  onClose();
                  navigate("/dashboard");
                }}
                className="rounded-2xl px-3 py-3 text-sm font-semibold border transition active:scale-[0.99]"
                style={{
                  borderColor: panelBorder,
                  background: "linear-gradient(90deg, rgba(52,211,153,0.55), rgba(45,212,191,0.45))",
                  color: "rgb(2 6 23)",
                }}
              >
                ➕ New Plan
              </button>
            </div>
          </div>

          {/* Theme */}
          <div
            className="mt-4 rounded-2xl p-3 border"
            style={{ borderColor: panelBorder }}
          >
            <div className="text-xs font-bold" style={{ color: muted }}>
              Theme
            </div>

            <div className="mt-2 space-y-2">
              {["obsidian", "midnight", "pearl"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold border transition"
                  style={{
                    borderColor: theme === t ? "rgba(52,211,153,0.55)" : panelBorder,
                    background:
                      theme === t
                        ? "rgba(52,211,153,0.18)"
                        : isPearl
                        ? "rgba(15,23,42,0.05)"
                        : "rgba(255,255,255,0.06)",
                  }}
                >
                  {THEME_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Logout */}
          {user && (
            <button
              onClick={doLogout}
              className="mt-4 w-full rounded-2xl px-4 py-3 text-sm font-bold border transition active:scale-[0.99]"
              style={{
                background: "rgba(239,68,68,0.14)",
                borderColor: "rgba(239,68,68,0.30)",
                color: text,
              }}
            >
              🚪 Logout
            </button>
          )}
        </div>

        {/* footer */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-4 text-xs border-t" style={{ borderColor: panelBorder, color: muted }}>
          Built for college project 💛
        </div>
      </aside>
    </div>
  );
}
