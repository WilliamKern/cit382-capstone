export default function Toast({ message, kind = "info", onClose }) {
  if (!message) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #ddd",
        background: "#fff",
        maxWidth: 360,
        boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
      }}
      role="status"
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <strong>{kind === "error" ? "Error" : "Notice"}</strong>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={onClose}>X</button>
        </div>
      </div>
      <div style={{ marginTop: 6 }}>{message}</div>
    </div>
  );
}
