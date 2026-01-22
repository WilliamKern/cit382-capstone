import { useEffect, useMemo, useState } from "react";
import { getUnits } from "../api/units";

const COLS = [
  { key: "unit_number", label: "Unit", type: "string" },
  { key: "floorplan", label: "Floorplan", type: "string" },
  { key: "bedrooms", label: "Beds", type: "number" },
  { key: "bathrooms", label: "Baths", type: "number" },
  { key: "square_feet", label: "Sq Ft", type: "number" },
  { key: "status", label: "Status", type: "string" },
  { key: "market_rent", label: "Market Rent", type: "number" },
];

function normalizeNumber(value) {
  if (value === undefined || value === null || value === "") return null;

  // Handles numbers or strings like "1495.00" or "$1,495"
  const n = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function normalizeString(value) {
  if (value === undefined || value === null) return "";
  return String(value).toLowerCase();
}

function compareValues(a, b, type) {
  // Nulls sort last in ascending, first in descending (handled by caller)
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  if (type === "number") return a - b;

  // string
  return a.localeCompare(b);
}

export default function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [q, setQ] = useState("");

  // Sorting state
  const [sortKey, setSortKey] = useState("unit_number");
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"

  async function load() {
    setLoading(true);
    setErrMsg("");
    try {
      const data = await getUnits();
      setUnits(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrMsg(err?.message || "Failed to load units.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleSort(nextKey) {
    if (nextKey === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(nextKey);
      setSortDir("asc");
    }
  }

  const filteredSorted = useMemo(() => {
    const query = q.trim().toLowerCase();

    // 1) filter
    const filtered = !query
      ? units
      : units.filter((u) => {
          const vals = [
            u?.unit_number,
            u?.floorplan,
            u?.status,
            u?.bedrooms,
            u?.bathrooms,
            u?.square_feet,
            u?.market_rent,
            u?.unit_id,
          ]
            .filter((v) => v !== undefined && v !== null)
            .map((v) => String(v).toLowerCase());

          return vals.some((v) => v.includes(query));
        });

    // 2) sort
    const col = COLS.find((c) => c.key === sortKey) || COLS[0];
    const type = col.type;

    const copy = [...filtered];
    copy.sort((u1, u2) => {
      let a;
      let b;

      if (type === "number") {
        a = normalizeNumber(u1?.[sortKey]);
        b = normalizeNumber(u2?.[sortKey]);
      } else {
        a = normalizeString(u1?.[sortKey]);
        b = normalizeString(u2?.[sortKey]);
      }

      const base = compareValues(a, b, type);
      return sortDir === "asc" ? base : -base;
    });

    return copy;
  }, [units, q, sortKey, sortDir]);

  const sortIndicator = (key) => {
    if (key !== sortKey) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  const headerStyle = (active) => ({
    textAlign: "left",
    padding: 10,
    borderBottom: "1px solid #e5e5e5",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
    fontWeight: active ? 800 : 700,
    opacity: active ? 1 : 0.9,
  });

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <h2 style={{ margin: 0 }}>Units</h2>
        <div style={{ opacity: 0.75 }}>
          Read-only list + search + sortable columns (click a header to sort).
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
          placeholder="Search units..."
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

        <div style={{ marginLeft: "auto", opacity: 0.8 }}>
          Showing <strong>{filteredSorted.length}</strong> of{" "}
          <strong>{units.length}</strong>
        </div>
      </div>

      {loading && <div>Loading units...</div>}
      {errMsg && (
        <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{errMsg}</div>
      )}

      {!loading && !errMsg && (
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
                {COLS.map((c) => {
                  const active = c.key === sortKey;
                  return (
                    <th
                      key={c.key}
                      onClick={() => toggleSort(c.key)}
                      title="Click to sort"
                      style={headerStyle(active)}
                    >
                      {c.label}
                      {sortIndicator(c.key)}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {filteredSorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLS.length}
                    style={{ padding: 12, opacity: 0.7 }}
                  >
                    No units match your search.
                  </td>
                </tr>
              ) : (
                filteredSorted.map((u, i) => (
                  <tr key={u?.unit_id ?? u?.unit_number ?? i}>
                    <td
                      style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}
                    >
                      {u?.unit_number ?? "—"}
                    </td>
                    <td
                      style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}
                    >
                      {u?.floorplan ?? "—"}
                    </td>
                    <td
                      style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}
                    >
                      {u?.bedrooms ?? "—"}
                    </td>
                    <td
                      style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}
                    >
                      {u?.bathrooms ?? "—"}
                    </td>
                    <td
                      style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}
                    >
                      {u?.square_feet ?? "—"}
                    </td>
                    <td
                      style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}
                    >
                      {u?.status ?? "—"}
                    </td>
                    <td
                      style={{ padding: 10, borderBottom: "1px solid #f0f0f0" }}
                    >
                      {u?.market_rent ?? "—"}
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
