import { useEffect, useMemo, useRef, useState } from "react";
import { lookupLeasesByPrefix } from "../services/payments";

const METHODS = ["cash", "check", "card", "ach", "other"];

export default function PaymentForm({ onCreate, saving }) {
  const [leaseId, setLeaseId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(METHODS[0]);
  const [paidDate, setPaidDate] = useState("");
  const [status, setStatus] = useState("posted");

  // Typeahead state
  const [matches, setMatches] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [lookupErr, setLookupErr] = useState("");

  const debounceRef = useRef(null);
  const lastReqRef = useRef(0);

  // De-dupe rows that may repeat per resident join (one per lease_id is enough for dropdown)
  const uniqueMatches = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const m of matches || []) {
      const id = m?.lease_id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(m);
    }
    return out;
  }, [matches]);

  useEffect(() => {
    const raw = String(leaseId || "").trim();

    // Close dropdown when empty
    if (raw.length === 0) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setMatches([]);
      setOpen(false);
      setActiveIndex(-1);
      setLookupErr("");
      return;
    }

    // Only allow digits for this lease-id prefix UX
    if (!/^\d+$/.test(raw)) {
      setMatches([]);
      setOpen(false);
      setActiveIndex(-1);
      setLookupErr("");
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const reqId = ++lastReqRef.current;

      try {
        setLookupErr("");
        const data = await lookupLeasesByPrefix(raw);

        // Ignore stale responses
        if (reqId !== lastReqRef.current) return;

        const arr = Array.isArray(data) ? data : [];
        setMatches(arr);
        setOpen(arr.length > 0);
        setActiveIndex(-1);
      } catch (e) {
        if (reqId !== lastReqRef.current) return;
        setLookupErr(e?.message || "Lease lookup failed.");
        setMatches([]);
        setOpen(false);
        setActiveIndex(-1);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [leaseId]);

  function selectLease(m) {
    setLeaseId(String(m?.lease_id ?? ""));
    setOpen(false);
    setActiveIndex(-1);
  }

  function onLeaseKeyDown(e) {
    if (!open || uniqueMatches.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, uniqueMatches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        selectLease(uniqueMatches[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    await onCreate({
      lease_id: Number(leaseId),
      amount: Number(amount),
      method,
      paid_date: paidDate,
      status,
    });

    // reset on success (PaymentsPage decides if it was successful)
    setLeaseId("");
    setAmount("");
    setMethod(METHODS[0]);
    setPaidDate("");
    setStatus("posted");
    setMatches([]);
    setOpen(false);
    setActiveIndex(-1);
    setLookupErr("");
  }

  const fieldStyle = {
    padding: 10,
    width: "100%",
    background: "var(--panel)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    outline: "none",
  };

  const selectStyle = {
    ...fieldStyle,
    // selects sometimes look odd; keep it consistent
    appearance: "auto",
  };

  const dropdownStyle = {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    background: "var(--panel)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    zIndex: 50,
    overflow: "hidden",
    boxShadow: "0 12px 24px var(--shadow)",
    maxHeight: 240,
    overflowY: "auto",
    color: "var(--text)",
  };

  const rowStyle = (active, isLast) => ({
    padding: "10px 12px",
    cursor: "pointer",
    background: active ? "var(--accentBg)" : "transparent",
    display: "grid",
    gridTemplateColumns: "90px 1fr 90px",
    gap: 10,
    alignItems: "center",
    borderBottom: isLast ? "none" : "1px solid var(--rowBorder)",
  });

  const submitStyle = {
    padding: "10px 12px",
    cursor: saving ? "not-allowed" : "pointer",
    fontWeight: 700,
    background: "var(--panel)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: 10,
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "grid", gap: 10, color: "var(--text)" }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        <label style={{ position: "relative" }}>
          Lease ID{" "}
          <input
            value={leaseId}
            onChange={(e) => setLeaseId(e.target.value)}
            onKeyDown={onLeaseKeyDown}
            autoComplete="off"
            style={fieldStyle}
            placeholder="Type lease id…"
          />
          {lookupErr && (
            <div style={{ fontSize: 12, color: "crimson", marginTop: 6 }}>
              {lookupErr}
            </div>
          )}
          {open && uniqueMatches.length > 0 && (
            <div style={dropdownStyle}>
              {uniqueMatches.map((m, idx) => (
                <div
                  key={m.lease_id}
                  onMouseDown={(ev) => {
                    // Prevent blur before click fires
                    ev.preventDefault();
                    selectLease(m);
                  }}
                  style={rowStyle(
                    idx === activeIndex,
                    idx === uniqueMatches.length - 1,
                  )}
                >
                  <div style={{ fontWeight: 800 }}>{m.lease_id}</div>
                  <div style={{ color: "var(--text)" }}>
                    {m.resident_name || "Unknown resident"}
                  </div>
                  <div style={{ textAlign: "right", color: "var(--muted)" }}>
                    {m.unit_number ? `Unit ${m.unit_number}` : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </label>

        <label>
          Amount{" "}
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={fieldStyle}
          />
        </label>

        <label>
          Paid Date{" "}
          <input
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            style={fieldStyle}
          />
        </label>

        <label>
          Method{" "}
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={selectStyle}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label>
          Status{" "}
          <input
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={fieldStyle}
          />
        </label>
      </div>

      <button type="submit" disabled={saving} style={submitStyle}>
        {saving ? "Saving..." : "Create Payment"}
      </button>
    </form>
  );
}
