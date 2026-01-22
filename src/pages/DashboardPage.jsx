import { useEffect, useMemo, useState } from "react";
import { getResidents } from "../api/residents";
import { getUnits } from "../api/units";
import { getPayments } from "../api/payments";

function Card({ title, value, subtext }) {
  return (
    <div
      style={{
        border: "1px solid #e9e9e9",
        borderRadius: 16,
        background: "#fff",
        padding: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        display: "grid",
        gap: 6,
        minHeight: 84,
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.3 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, opacity: 0.75 }}>{subtext}</div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "—";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function Panel({ title, children, right }) {
  return (
    <div
      style={{
        border: "1px solid #e9e9e9",
        borderRadius: 16,
        background: "#fff",
        padding: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        display: "grid",
        gap: 10,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 900 }}>{title}</div>
        <div style={{ marginLeft: "auto" }}>{right}</div>
      </div>
      {children}
    </div>
  );
}

function formatMoney(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function parseDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export default function DashboardPage() {
  const [residents, setResidents] = useState([]);
  const [units, setUnits] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  async function load() {
    setLoading(true);
    setErrMsg("");
    try {
      const [r, u, p] = await Promise.all([
        getResidents(),
        getUnits(),
        getPayments(),
      ]);
      setResidents(Array.isArray(r) ? r : []);
      setUnits(Array.isArray(u) ? u : []);
      setPayments(Array.isArray(p) ? p : []);
    } catch (err) {
      setErrMsg(err?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const unitStatusCounts = useMemo(() => {
    const counts = new Map();
    for (const u of units) {
      const status = (u?.status ?? "unknown").toString();
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [units]);

  const paymentsSorted = useMemo(() => {
    const copy = [...payments];
    copy.sort((a, b) => {
      const da = parseDate(a?.paid_date);
      const db = parseDate(b?.paid_date);
      const ta = da ? da.getTime() : -Infinity;
      const tb = db ? db.getTime() : -Infinity;
      return tb - ta;
    });
    return copy;
  }, [payments]);

  const recentPayments = useMemo(
    () => paymentsSorted.slice(0, 8),
    [paymentsSorted],
  );

  const totals = useMemo(() => {
    const totalPaymentsAllTime = payments.reduce((sum, p) => {
      const amt = Number(p?.amount);
      return Number.isFinite(amt) ? sum + amt : sum;
    }, 0);

    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalPaymentsLast30 = payments.reduce((sum, p) => {
      const dt = parseDate(p?.paid_date);
      if (!dt || dt < last30) return sum;
      const amt = Number(p?.amount);
      return Number.isFinite(amt) ? sum + amt : sum;
    }, 0);

    const paymentsLast30Count = payments.reduce((count, p) => {
      const dt = parseDate(p?.paid_date);
      return dt && dt >= last30 ? count + 1 : count;
    }, 0);

    return { totalPaymentsAllTime, totalPaymentsLast30, paymentsLast30Count };
  }, [payments]);

  const topStatus = unitStatusCounts[0]?.status ?? "—";
  const topStatusCount = unitStatusCounts[0]?.count ?? 0;

  return (
    <div style={{ display: "grid", gap: 14, width: "100%" }}>
      {/* Header strip */}
      <div
        style={{
          border: "1px solid #e9e9e9",
          borderRadius: 18,
          background: "#fff",
          padding: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          width: "100%",
        }}
      >
        <div style={{ display: "grid", gap: 2 }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.3 }}>
            Dashboard
          </div>
          <div style={{ opacity: 0.75 }}>
            Snapshot of residents, units, and payments.
          </div>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {loading ? (
            <div style={{ opacity: 0.7 }}>Loading…</div>
          ) : (
            <div style={{ opacity: 0.7 }}>Updated just now</div>
          )}

          <button
            onClick={load}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e5e5e5",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {errMsg && (
        <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{errMsg}</div>
      )}

      {/* KPI grid: responsive auto-fit */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          width: "100%",
        }}
      >
        <Card
          title="Residents"
          value={loading ? "—" : residents.length}
          subtext="Total residents in system"
        />
        <Card
          title="Units"
          value={loading ? "—" : units.length}
          subtext="Total units in system"
        />
        <Card
          title="Top Unit Status"
          value={loading ? "—" : `${topStatusCount}`}
          subtext={loading ? "—" : `${topStatus} (most common)`}
        />
        <Card
          title="Payments (Last 30 days)"
          value={loading ? "—" : formatMoney(totals.totalPaymentsLast30)}
          subtext={loading ? "—" : `${totals.paymentsLast30Count} payment(s)`}
        />
      </div>

      {/* Panels grid: responsive, consistent */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 14,
          alignItems: "start",
          width: "100%",
        }}
      >
        <Panel
          title="Unit Status Breakdown"
          right={
            <div style={{ opacity: 0.7, fontSize: 13 }}>
              {loading ? "—" : `${unitStatusCounts.length} status type(s)`}
            </div>
          }
        >
          {loading ? (
            <div style={{ opacity: 0.7 }}>Loading unit statuses…</div>
          ) : unitStatusCounts.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No unit data available.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {unitStatusCounts.map((s) => {
                const pct = units.length
                  ? Math.round((s.count / units.length) * 100)
                  : 0;
                return (
                  <div
                    key={s.status}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 1fr 60px",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 800 }}>{s.status}</div>

                    <div
                      style={{
                        height: 10,
                        borderRadius: 999,
                        background: "#f1f1f1",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "#1f6feb",
                        }}
                      />
                    </div>

                    <div style={{ textAlign: "right", opacity: 0.75 }}>
                      {s.count}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          title="Recent Payments"
          right={
            <div style={{ opacity: 0.7, fontSize: 13 }}>
              {loading
                ? "—"
                : `All-time: ${formatMoney(totals.totalPaymentsAllTime)}`}
            </div>
          }
        >
          {loading ? (
            <div style={{ opacity: 0.7 }}>Loading payments…</div>
          ) : payments.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No payments found.</div>
          ) : (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Date", "Amount", "Method", "Status", "Lease"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            fontSize: 12,
                            opacity: 0.7,
                            paddingBottom: 8,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p) => (
                    <tr
                      key={
                        p?.payment_id ??
                        `${p?.lease_id}-${formatDateTime(p?.paid_date)}
-${p?.amount}`
                      }
                    >
                      <td style={{ padding: "6px 0", whiteSpace: "nowrap" }}>
                        {formatDateTime(p?.paid_date)}
                      </td>
                      <td style={{ padding: "6px 0", whiteSpace: "nowrap" }}>
                        {p?.amount ?? "—"}
                      </td>
                      <td style={{ padding: "6px 0", whiteSpace: "nowrap" }}>
                        {p?.method ?? "—"}
                      </td>
                      <td style={{ padding: "6px 0", whiteSpace: "nowrap" }}>
                        {p?.status ?? "—"}
                      </td>
                      <td style={{ padding: "6px 0", whiteSpace: "nowrap" }}>
                        {p?.lease_id ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: 8, opacity: 0.7, fontSize: 13 }}>
                Showing the 8 most recent payments (by paid_date).
              </div>
            </div>
          )}
        </Panel>
      </div>

      <div
        style={{
          border: "1px solid #e9e9e9",
          borderRadius: 16,
          background: "#fff",
          padding: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          display: "grid",
          gap: 8,
          width: "100%",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 900 }}>Notes</div>
        <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.8 }}>
          <li>Residents: search and manage records.</li>
          <li>Units: read-only list with search + sort.</li>
          <li>
            Payments: view ledger and add new payments (no edit/delete in UI).
          </li>
        </ul>
      </div>
    </div>
  );
}
