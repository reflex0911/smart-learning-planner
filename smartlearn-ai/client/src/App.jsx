import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";

function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "obsidian"
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // theme apply
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 🌌 FIXED background gradient
  const bgStyle = useMemo(() => {
    if (theme === "pearl") {
      return {
        background: "linear-gradient(-45deg,#ffffff,#f8fafc,#eef2ff,#ffffff)",
        backgroundSize: "400% 400%",
        animation: "gradientMove 20s ease infinite",
      };
    }
    if (theme === "midnight") {
      return {
        background: "linear-gradient(-45deg,#0f172a,#1e293b,#1e1b4b,#0f172a)",
        backgroundSize: "400% 400%",
        animation: "gradientMove 20s ease infinite",
      };
    }
    return {
      background: "linear-gradient(-45deg,#0f172a,#312e81,#4c1d95,#0f172a)",
      backgroundSize: "400% 400%",
      animation: "gradientMove 20s ease infinite",
    };
  }, [theme]);

  // overlay glow
  const overlayStyle = useMemo(() => {
    if (theme === "pearl") {
      return {
        background:
          "radial-gradient(circle at 50% -20%, rgba(0,0,0,0.06), transparent 60%)",
      };
    }
    return {
      background:
        "radial-gradient(circle at 50% -20%, rgba(255,255,255,0.12), transparent 60%)",
    };
  }, [theme]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ color: `rgb(var(--text))` }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{ color: `rgb(var(--text))` }}
    >
      {/* ✅ FIXED WALLPAPER (never scrolls, never takes layout space) */}
      <div className="fixed inset-0 z-0 overflow-hidden" style={bgStyle}>
        <div className="absolute inset-0" style={overlayStyle} />
      </div>

      {/* ✅ FIXED BLOBS (never scroll) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="bg-blob"
          style={{
            left: "-140px",
            top: "-160px",
            background:
              theme === "pearl"
                ? "radial-gradient(circle, rgba(99,102,241,0.25), transparent 60%)"
                : theme === "midnight"
                ? "radial-gradient(circle, rgba(168,85,247,0.35), transparent 60%)"
                : "radial-gradient(circle, rgba(168,85,247,0.35), transparent 60%)",
          }}
        />

        <div
          className="bg-blob blob-2"
          style={{
            right: "-180px",
            top: "10%",
            background:
              theme === "pearl"
                ? "radial-gradient(circle, rgba(16,185,129,0.20), transparent 60%)"
                : theme === "midnight"
                ? "radial-gradient(circle, rgba(59,130,246,0.25), transparent 60%)"
                : "radial-gradient(circle, rgba(16,185,129,0.30), transparent 60%)",
          }}
        />

        <div
          className="bg-blob blob-3"
          style={{
            left: "20%",
            bottom: "-220px",
            background:
              theme === "pearl"
                ? "radial-gradient(circle, rgba(148,163,184,0.20), transparent 60%)"
                : theme === "midnight"
                ? "radial-gradient(circle, rgba(236,72,153,0.22), transparent 60%)"
                : "radial-gradient(circle, rgba(168,85,247,0.25), transparent 60%)",
          }}
        />
      </div>

      {/* ✅ UI LAYER (above background) */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Navbar theme={theme} setTheme={setTheme} />

        {/* ✅ Main grows, footer bottom */}
        <main className="flex-grow pt-16 page-fade">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
            />
            <Route
              path="/dashboard"
              element={user ? <Dashboard /> : <Navigate to="/login" replace />}
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
