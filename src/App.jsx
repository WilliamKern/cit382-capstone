import { useEffect, useMemo, useState } from "react";
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import ResidentsPage from "./pages/ResidentsPage";
import UnitsPage from "./pages/UnitsPage";
import PaymentsPage from "./pages/PaymentsPage";

import { getPayments } from "./services/payments";

export default function App() {
  const location = useLocation();

  // ✅ Shared state that persists across views (theme)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  // ✅ Effect: synchronizes theme with external systems (DOM + localStorage)
  useEffect(() => {
    document.documentElement.dataset.theme = theme; // html[data-theme="dark"]
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  };

  // Lifted/shared state (Dashboard + Payments)
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsErrMsg, setPaymentsErrMsg] = useState("");

  async function refreshPayments() {
    setPaymentsLoading(true);
    setPaymentsErrMsg("");
    try {
      const data = await getPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      setPaymentsErrMsg(err?.message || "Failed to load payments.");
    } finally {
      setPaymentsLoading(false);
    }
  }

  useEffect(() => {
    refreshPayments();
  }, []);

  const headerTitle = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/residents")) return "Residents";
    if (path.startsWith("/units")) return "Units";
    if (path.startsWith("/payments")) return "Payments";
    return "Dashboard";
  }, [location.pathname]);

  const navLinkStyle = ({ isActive }) => ({
    padding: "10px 12px",
    borderRadius: 10,
    border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
    background: isActive ? "var(--accentBg)" : "var(--panel)",
    cursor: "pointer",
    fontWeight: isActive ? 800 : 650,
    whiteSpace: "nowrap",
    textDecoration: "none",
    color: "var(--text)",
    display: "inline-block",
  });

  const themeBtnStyle = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--panel)",
    cursor: "pointer",
    fontWeight: 750,
    whiteSpace: "nowrap",
    color: "var(--text)",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background:
          "radial-gradient(1200px 600px at 15% 0%, var(--bgAccent) 0%, var(--bg) 50%)",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(10px)",
          background: "var(--headerBg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            width: "100%",
            padding: "14px clamp(16px, 3vw, 32px)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: 2 }}>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              Property Management
            </div>
            <div
              style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}
            >
              {headerTitle}
            </div>
          </div>

          <nav
            style={{
              display: "flex",
              gap: 10,
              marginLeft: "auto",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* ✅ Theme toggle (shows on every route because it's in App) */}
            <button type="button" onClick={toggleTheme} style={themeBtnStyle}>
              {theme === "light" ? "🌙 Dark" : "☀️ Light"}
            </button>

            <NavLink to="/dashboard" style={navLinkStyle}>
              Dashboard
            </NavLink>
            <NavLink to="/residents" style={navLinkStyle}>
              Residents
            </NavLink>
            <NavLink to="/units" style={navLinkStyle}>
              Units
            </NavLink>
            <NavLink to="/payments" style={navLinkStyle}>
              Payments
            </NavLink>
          </nav>
        </div>
      </div>

      <div
        style={{ width: "100%", padding: "18px clamp(16px, 3vw, 32px) 28px" }}
      >
        <Routes>
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <DashboardPage
                payments={payments}
                paymentsLoading={paymentsLoading}
                paymentsErrMsg={paymentsErrMsg}
                refreshPayments={refreshPayments}
              />
            }
          />

          <Route path="/residents" element={<ResidentsPage />} />
          <Route path="/units" element={<UnitsPage />} />

          <Route
            path="/payments"
            element={
              <PaymentsPage
                payments={payments}
                paymentsLoading={paymentsLoading}
                paymentsErrMsg={paymentsErrMsg}
                refreshPayments={refreshPayments}
              />
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}
