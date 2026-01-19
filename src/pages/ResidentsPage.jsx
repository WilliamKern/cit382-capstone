import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deleteResident, getResidents } from "../api/residents";
import Toast from "../components/Toast";

/* ---------- helpers ---------- */

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function matchesQuery(resident, query) {
  if (!query) return true;

  const fullName = `${resident.first_name ?? ""} ${resident.last_name ?? ""}`;

  const haystack = [
    resident.resident_id,
    fullName,
    resident.email,
    resident.phone,
  ]
    .map(normalize)
    .join(" ");

  return haystack.includes(query);
}

/* ---------- component ---------- */

export default function ResidentsPage() {
  /* ----- data state ----- */
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* ----- UI state ----- */
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("name"); // "name" | "id"
  const [selectedId, setSelectedId] = useState(null);

  /* ----- toast state ----- */
  const [toast, setToast] = useState({ message: "", kind: "info" });
  const toastTimerRef = useRef(null);

  const showToast = (message, kind = "info") => {
    setToast({ message, kind });
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast({ message: "", kind: "info" });
    }, 2500);
  };

  /* ----- data loading (FIXED) ----- */
  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const data = await getResidents();
      setResidents(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load residents");
      showToast("Failed to load residents", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => window.clearTimeout(toastTimerRef.current);
  }, [load]);

  /* ----- derived state ----- */
  const filteredSortedResidents = useMemo(() => {
    const q = normalize(query);

    const filtered = residents.filter((r) => matchesQuery(r, q));

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "id") {
        return Number(a.resident_id) - Number(b.resident_id);
      }

      const nameA = normalize(`${a.last_name ?? ""} ${a.first_name ?? ""}`);
      const nameB = normalize(`${b.last_name ?? ""} ${b.first_name ?? ""}`);
      return nameA.localeCompare(nameB);
    });

    return sorted;
  }, [residents, query, sortBy]);

  /* ----- actions ----- */
  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this resident?");
    if (!confirmed) return;

    const previous = residents;
    setResidents((cur) =>
      cur.filter((r) => String(r.resident_id) !== String(id))
    );

    try {
      await deleteResident(id);
      showToast("Resident deleted");
      if (String(selectedId) === String(id)) {
        setSelectedId(null);
      }
    } catch (err) {
      setResidents(previous);
      showToast(err.message || "Delete failed", "error");
    }
  };

  /* ----- render ----- */
  return (
    <div style={{ padding: 18, display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Residents</h2>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, phone, or ID..."
          style={{ padding: 10, minWidth: 320 }}
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: 10 }}
        >
          <option value="name">Sort: Name</option>
          <option value="id">Sort: ID</option>
        </select>

        <button
          onClick={load}
          disabled={loading}
          style={{ padding: "10px 12px" }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>

        <button
          onClick={() => setQuery("")}
          disabled={!query}
          style={{ padding: "10px 12px" }}
        >
          Clear
        </button>

        <div style={{ marginLeft: "auto", opacity: 0.8 }}>
          Showing <strong>{filteredSortedResidents.length}</strong> of{" "}
          <strong>{residents.length}</strong>
        </div>
      </div>

      {/* Error */}
      {errorMsg && (
        <div
          style={{
            padding: 12,
            border: "1px solid #f1c0c0",
            borderRadius: 10,
            background: "#fff7f7",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #e5e5e5",
          }}
        >
          <thead>
            <tr style={{ background: "#fafafa" }}>
              {["ID", "Name", "Email", "Phone", ""].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: 10,
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredSortedResidents.map((r) => {
              const id = r.resident_id;
              const selected = String(selectedId) === String(id);
              const fullName = `${r.first_name ?? ""} ${
                r.last_name ?? ""
              }`.trim();

              return (
                <tr
                  key={id}
                  onClick={() => setSelectedId(id)}
                  style={{
                    background: selected ? "#f0f7ff" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>
                    {id}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>
                    {fullName}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>
                    {r.email ?? ""}
                  </td>
                  <td style={{ padding: 10, borderBottom: "1px solid #eee" }}>
                    {r.phone ?? ""}
                  </td>
                  <td
                    style={{
                      padding: 10,
                      borderBottom: "1px solid #eee",
                      whiteSpace: "nowrap",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button onClick={() => showToast("Edit coming next step")}>
                      Edit
                    </button>{" "}
                    <button onClick={() => handleDelete(id)}>Delete</button>
                  </td>
                </tr>
              );
            })}

            {!loading && filteredSortedResidents.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 12, opacity: 0.7 }}>
                  No matches.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Toast
        message={toast.message}
        kind={toast.kind}
        onClose={() => setToast({ message: "", kind: "info" })}
      />
    </div>
  );
}
