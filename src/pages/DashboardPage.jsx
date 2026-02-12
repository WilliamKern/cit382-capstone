import { useEffect, useMemo, useState } from "react";
import { getResidents } from "../services/residents";
import { getUnits } from "../services/units";

function Card({ title, value, subtext }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 16,
        background: "var(--panel)",
        padding: 16,
        boxShadow: "0 10px 30px var(--shadow)",
        display: "grid",
        gap: 6,
        minHeight: 84,
        color: "var(--text)",
      }}
    >
      <div style={{ fontSize: 13, color: "var(--muted)" }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.3 }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)" }}>{subtext}</div>
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
  })
    .format(d)
    .replace(" AM", "am")
    .replace(" PM", "pm");
}

function Panel({ title, children, right }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 16,
        background: "var(--panel)",
        padding: 16,
        boxShadow: "0 10px 30px var(--shadow)",
        display: "grid",
        gap: 10,
        width: "100%",
        color: "var(--text)",
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

export default function DashboardPage({
  payments,
  paymentsLoading,
  paymentsErrMsg,
  refreshPayments,
}) {
  const [residents, setResidents] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  async function load() {
    setLoading(true);
    setErrMsg("");
    try {
      const [r, u] = await Promise.all([getResidents(), getUnits()]);
      setResidents(Array.isArray(r) ? r : []);
      setUnits(Array.isArray(u) ? u : []);
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
    const copy = [...(payments || [])];
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
    const list = payments || [];
    const totalPaymentsAllTime = list.reduce((sum, p) => {
      const amt = Number(p?.amount);
      return Number.isFinite(amt) ? sum + amt : sum;
    }, 0);

    const now = new Date();
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalPaymentsLast30 = list.reduce((sum, p) => {
      const dt = parseDate(p?.paid_date);
      if (!dt || dt < last30) return sum;
      const amt = Number(p?.amount);
      return Number.isFinite(amt) ? sum + amt : sum;
    }, 0);

    const paymentsLast30Count = list.reduce((count, p) => {
      const dt = parseDate(p?.paid_date);
      return dt && dt >= last30 ? count + 1 : count;
    }, 0);

    return { totalPaymentsAllTime, totalPaymentsLast30, paymentsLast30Count };
  }, [payments]);

  const topStatus = unitStatusCounts[0]?.status ?? "—";
  const topStatusCount = unitStatusCounts[0]?.count ?? 0;

  return (
    <div
      style={{ display: "grid", gap: 14, width: "100%", color: "var(--text)" }}
    >
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 18,
          background: "var(--panel)",
          padding: 16,
          boxShadow: "0 10px 30px var(--shadow)",
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
          <div style={{ color: "var(--muted)" }}>
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
          <button
            onClick={() => {
              load();
              refreshPayments();
            }}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--panel)",
              cursor: "pointer",
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {errMsg && (
        <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{errMsg}</div>
      )}
      {paymentsErrMsg && (
        <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>
          {paymentsErrMsg}
        </div>
      )}

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
          value={
            paymentsLoading ? "—" : formatMoney(totals.totalPaymentsLast30)
          }
          subtext={
            paymentsLoading
              ? "Loading..."
              : `${totals.paymentsLast30Count} payment(s)`
          }
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 14,
          alignItems: "start",
          width: "100%",
        }}
      >
        <Panel title="Unit Status Breakdown">
          {loading ? (
            <div style={{ color: "var(--muted)" }}>Loading unit statuses…</div>
          ) : unitStatusCounts.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>No unit data available.</div>
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
                        background: "var(--track)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "var(--accent)",
                        }}
                      />
                    </div>
                    <div style={{ textAlign: "right", color: "var(--muted)" }}>
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
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              {paymentsLoading
                ? "Loading..."
                : `All-time: ${formatMoney(totals.totalPaymentsAllTime)}`}
            </div>
          }
        >
          {paymentsLoading ? (
            <div style={{ color: "var(--muted)" }}>Loading payments…</div>
          ) : (payments || []).length === 0 ? (
            <div style={{ color: "var(--muted)" }}>No payments found.</div>
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
                            color: "var(--muted)",
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
                        `${p?.lease_id}-${p?.paid_date}-${p?.amount}`
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
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
