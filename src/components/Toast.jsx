export default function Toast({ message, kind = "info", onClose }) {
  if (!message) return null;

  const title = kind === "error" ? "Error" : "Notice";

  const containerStyle = {
    position: "fixed",
    right: 16,
    bottom: 16,
    padding: "10px 12px",
    borderRadius: 10,
    border: `1px solid ${kind === "error" ? "var(--dangerBorder)" : "var(--border)"}`,
    background: kind === "error" ? "var(--dangerBg)" : "var(--panel)",
    color: kind === "error" ? "var(--dangerText)" : "var(--text)",
    maxWidth: 360,
    boxShadow: "0 6px 24px var(--shadow)",
  };

  const closeBtnStyle = {
    cursor: "pointer",
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: 8,
    padding: "4px 8px",
    fontWeight: 800,
    lineHeight: 1,
  };

  return (
    <div style={containerStyle} role="status">
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <strong>{title}</strong>
        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={onClose}
            style={closeBtnStyle}
            aria-label="Close toast"
          >
            X
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: 6,
          color: kind === "error" ? "var(--dangerText)" : "var(--text)",
        }}
      >
        {message}
      </div>
    </div>
  );
}
