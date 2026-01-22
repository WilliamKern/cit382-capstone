import { useEffect, useMemo, useState } from "react";
import { createPayment, getPayments } from "../api/payments";

const METHODS = ["cash", "check", "card", "ach", "other"]; // UI-only; server can accept whatever you use.

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [q, setQ] = useState("");

  // Add payment form state (keep minimal + explicit)
  const [showNew, setShowNew] = useState(false);
  const [leaseId, setLeaseId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(METHODS[0]);
  const [paidDate, setPaidDate] = useState(""); // yyyy-mm-dd
  const [status, setStatus] = useState("posted"); // UI default; adjust to your server’s accepted values
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  async function load() {
    setLoading(true);
    setErrMsg("");
    try {
      const data = await getPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrMsg(err?.message || "Failed to load payments.");
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return payments;

    return payments.filter((p) => {
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

  async function handleCreate(e) {
    e.preventDefault();
    setSuccessMsg("");
    setErrMsg("");

    // Minimal validation (no guessing)
    if (!String(leaseId).trim()) {
      setErrMsg("Lease ID is required.");
      return;
    }
    if (!String(amount).trim()) {
      setErrMsg("Amount is required.");
      return;
    }
    if (!String(paidDate).trim()) {
      setErrMsg("Paid date is required.");
      return;
    }
    if (!String(method).trim()) {
      setErrMsg("Method is required.");
      return;
    }
    if (!String(status).trim()) {
      setErrMsg("Status is required.");
      return;
    }

    const payload = {
      lease_id: Number(leaseId),
      amount: Number(amount),
      method,
      paid_date: paidDate,
      status,
    };

    setSaving(true);
    try {
      await createPayment(payload);

      setSuccessMsg("Payment created.");
      setLeaseId("");
      setAmount("");
      setPaidDate("");
      setMethod(METHODS[0]);
      setStatus("posted");
      setShowNew(false);

      await load();
    } catch (err) {
      setErrMsg(err?.message || "Failed to create payment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <h2 style={{ margin: 0 }}>Payments</h2>
        <div style={{ opacity: 0.75 }}>
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
          placeholder="Search payments..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: 10, minWidth: 320 }}
        />
        <button
          onClick={load}
          style={{ padding: "10px 12px", cursor: "pointer" }}
        >
          Refresh
        </button>
        <button
          onClick={() => setQ("")}
          style={{ padding: "10px 12px", cursor: "pointer" }}
        >
          Clear
        </button>

        <button
          onClick={() => {
            setErrMsg("");
            setSuccessMsg("");
            setShowNew((s) => !s);
          }}
          style={{
            marginLeft: "auto",
            padding: "10px 12px",
            cursor: "pointer",
            borderRadius: 10,
            border: "1px solid #1f6feb",
            background: showNew ? "#f0f7ff" : "#fff",
            fontWeight: 700,
          }}
        >
          {showNew ? "Close New Payment" : "New Payment"}
        </button>
      </div>

      {successMsg && (
        <div style={{ color: "green", whiteSpace: "pre-wrap" }}>
          {successMsg}
        </div>
      )}
      {errMsg && (
        <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{errMsg}</div>
      )}

      {showNew && (
        <form
          onSubmit={handleCreate}
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 12,
            background: "#fff",
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 800 }}>Add Payment</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 10,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              Lease ID
              <input
                value={leaseId}
                onChange={(e) => setLeaseId(e.target.value)}
                placeholder="e.g., 101"
                style={{ padding: 10 }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Amount
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 1495.00"
                style={{ padding: 10 }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Paid Date
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                style={{ padding: 10 }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Method
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={{ padding: 10 }}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Status
              <input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="e.g., posted"
                style={{ padding: 10 }}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 12px",
                cursor: saving ? "not-allowed" : "pointer",
                borderRadius: 10,
                border: "1px solid #1f6feb",
                background: "#1f6feb",
                color: "#fff",
                fontWeight: 800,
              }}
            >
              {saving ? "Saving..." : "Create Payment"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowNew(false);
                setErrMsg("");
                setSuccessMsg("");
              }}
              style={{ padding: "10px 12px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>

          <div style={{ opacity: 0.7, fontSize: 13 }}>
            Note: this UI only supports creating payments + viewing the ledger.
          </div>
        </form>
      )}

      {loading && <div>Loading payments...</div>}

      {!loading && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #e5e5e5",
              background: "#fff",
            }}
          >
            <thead>
              <tr style={{ background: "#fafafa" }}>
                {[
                  "Paid Date",
                  "Amount",
                  "Method",
                  "Status",
                  "Lease ID",
                  "Unit ID",
                  "Period",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: 10,
                      borderBottom: "1px solid #e5e5e5",
                      whiteSpace: "nowrap",
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
                  <td colSpan={7} style={{ padding: 12, opacity: 0.7 }}>
                    No payments match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p?.payment_id ?? JSON.stringify(p)}>
                    <td
                      style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}
                    >
                      {formatDateTime(p?.paid_date)}
                    </td>
                    <td
                      style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}
                    >
                      {p?.amount ?? "—"}
                    </td>
                    <td
                      style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}
                    >
                      {p?.method ?? "—"}
                    </td>
                    <td
                      style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}
                    >
                      {p?.status ?? "—"}
                    </td>
                    <td
                      style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}
                    >
                      {p?.lease_id ?? "—"}
                    </td>
                    <td
                      style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}
                    >
                      {p?.unit_id ?? "—"}
                    </td>
                    <td
                      style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}
                    >
                      {p?.period_month && p?.period_year
                        ? `${p.period_month}/${p.period_year}`
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ marginTop: 8, opacity: 0.75 }}>
            Showing <strong>{filtered.length}</strong> of{" "}
            <strong>{payments.length}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
