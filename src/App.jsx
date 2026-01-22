import { useMemo, useState } from "react";
import ResidentsPage from "./pages/ResidentsPage";
import DashboardPage from "./pages/DashboardPage";
import UnitsPage from "./pages/UnitsPage";
import PaymentsPage from "./pages/PaymentsPage";

const VIEWS = {
  DASHBOARD: "dashboard",
  RESIDENTS: "residents",
  UNITS: "units",
  PAYMENTS: "payments",
};

export default function App() {
  const [view, setView] = useState(VIEWS.DASHBOARD);

  const headerTitle = useMemo(() => {
    switch (view) {
      case VIEWS.RESIDENTS:
        return "Residents";
      case VIEWS.UNITS:
        return "Units";
      case VIEWS.PAYMENTS:
        return "Payments";
      default:
        return "Dashboard";
    }
  }, [view]);

  const navBtn = (target, label) => {
    const active = view === target;

    return (
      <button
        onClick={() => setView(target)}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: active ? "1px solid #1f6feb" : "1px solid #e5e5e5",
          background: active ? "#f0f7ff" : "#fff",
          cursor: "pointer",
          fontWeight: active ? 800 : 650,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background:
          "radial-gradient(1200px 600px at 15% 0%, #f1f7ff 0%, #ffffff 50%)",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(10px)",
          background: "rgba(255,255,255,0.85)",
          borderBottom: "1px solid #eee",
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
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              Property Management
            </div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{headerTitle}</div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              marginLeft: "auto",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {navBtn(VIEWS.DASHBOARD, "Dashboard")}
            {navBtn(VIEWS.RESIDENTS, "Residents")}
            {navBtn(VIEWS.UNITS, "Units")}
            {navBtn(VIEWS.PAYMENTS, "Payments")}
          </div>
        </div>
      </div>

      {/* Page shell (consistent width/padding across ALL tabs) */}
      <div
        style={{
          width: "100%",
          padding: "18px clamp(16px, 3vw, 32px) 28px",
        }}
      >
        {/* Inner panel keeps vertical rhythm consistent (but does NOT limit width) */}
        <div style={{ width: "100%" }}>
          {view === VIEWS.DASHBOARD && (
            <DashboardPage onNavigate={setView} views={VIEWS} />
          )}
          {view === VIEWS.RESIDENTS && <ResidentsPage />}
          {view === VIEWS.UNITS && <UnitsPage />}
          {view === VIEWS.PAYMENTS && <PaymentsPage />}
        </div>
      </div>
    </div>
  );
}
