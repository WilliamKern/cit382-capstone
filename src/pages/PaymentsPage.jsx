import { useMemo, useState } from "react";
import { createPayment } from "../services/payments";
import PaymentForm from "../components/PaymentForm";

export default function PaymentsPage({
  payments,
  paymentsLoading,
  paymentsErrMsg,
  refreshPayments,
}) {
  const [q, setQ] = useState("");

  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [localErrMsg, setLocalErrMsg] = useState("");

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

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return payments || [];

    return (payments || []).filter((p) => {
      const vals = [
        p?.payment_id,
        p?.lease_id,
        p?.unit_id,
        p?.amount,
        p?.method,
        p?.paid_date,
        p?.period_month,
        p?.period_year,
        p?.status,
      ]
        .filter((v) => v !== undefined && v !== null)
        .map((v) => String(v).toLowerCase());

      return vals.some((v) => v.includes(query));
    });
  }, [payments, q]);

  async function handleCreate(payload) {
    setSuccessMsg("");
    setLocalErrMsg("");

    // Minimal validation, no guessing
    const leaseId = Number(payload?.lease_id);
    const amount = Number(payload?.amount);

    if (!Number.isFinite(leaseId) || leaseId <= 0) {
      setLocalErrMsg("Valid Lease ID is required.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setLocalErrMsg("Valid payment amount is required.");
      return;
    }

    if (!payload?.method) {
      setLocalErrMsg("Payment method is required.");
      return;
    }

    if (!payload?.paid_date) {
      setLocalErrMsg("Paid date is required.");
      return;
    }

    if (!payload?.status) {
      setLocalErrMsg("Payment status is required.");
      return;
    }

    setSaving(true);
    try {
      await createPayment({
        ...payload,
        lease_id: leaseId,
        amount,
      });
      setSuccessMsg("Payment created.");
      setShowNew(false);

      // ✅ Updates shared state in App so Dashboard reflects it too
      await refreshPayments();
    } catch (err) {
      setLocalErrMsg(err?.message || "Failed to create payment.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    padding: 10,
    minWidth: 320,
    background: "var(--panel)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    outline: "none",
  };

  const buttonStyle = {
    padding: "10px 12px",
    cursor: "pointer",
    background: "var(--panel)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    fontWeight: 750,
  };

  return (
    <div style={{ display: "grid", gap: 12, color: "var(--text)" }}>
      <div style={{ display: "grid", gap: 6 }}>
        <h2 style={{ margin: 0 }}>Payments</h2>
        <div style={{ color: "var(--muted)" }}>
          Ledger view + add payments. Editing/deleting is intentionally disabled
          in the UI.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          placeholder="Search payments by lease ID..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={inputStyle}
        />

        <button onClick={refreshPayments} style={buttonStyle}>
          Refresh
        </button>

        <button onClick={() => setShowNew((s) => !s)} style={buttonStyle}>
          {showNew ? "Cancel" : "Add Payment"}
        </button>
      </div>

      {(paymentsErrMsg || localErrMsg) && (
        <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>
          {paymentsErrMsg || localErrMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ color: "limegreen", whiteSpace: "pre-wrap" }}>
          {successMsg}
        </div>
      )}

      {showNew && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 12,
            background: "var(--panel)",
            boxShadow: "0 10px 30px var(--shadow)",
          }}
        >
          <PaymentForm onCreate={handleCreate} saving={saving} />
        </div>
      )}

      {paymentsLoading ? (
        <div style={{ color: "var(--muted)" }}>Loading payments...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid var(--border)",
              background: "var(--panel)",
              color: "var(--text)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ background: "var(--tableHead)" }}>
                {["Date", "Amount", "Method", "Status", "Lease"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: 10,
                      borderBottom: "1px solid var(--border)",
                      whiteSpace: "nowrap",
                      fontWeight: 800,
                      color: "var(--muted)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{ padding: 12, color: "var(--muted)" }}
                  >
                    No payments match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <tr
                    key={p?.payment_id ?? `${p?.lease_id}-${p?.paid_date}-${i}`}
                  >
                    <td
                      style={{
                        padding: 10,
                        borderBottom: "1px solid var(--rowBorder)",
                      }}
                    >
                      {formatDateTime(p?.paid_date)}
                    </td>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: "1px solid var(--rowBorder)",
                      }}
                    >
                      {p?.amount ?? "—"}
                    </td>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: "1px solid var(--rowBorder)",
                      }}
                    >
                      {p?.method ?? "—"}
                    </td>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: "1px solid var(--rowBorder)",
                      }}
                    >
                      {p?.status ?? "—"}
                    </td>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: "1px solid var(--rowBorder)",
                      }}
                    >
                      {p?.lease_id ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
