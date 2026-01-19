// src/api/client.js
// Simple wrapper around fetch() that:
// - sets JSON headers by default
// - throws a useful error message on non-2xx responses
// - parses JSON when possible

export async function apiFetch(path, options = {}) {
  const opts = {
    method: "GET",
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  };

  // If we're sending a body and user didn't specify Content-Type, assume JSON.
  const hasBody = opts.body !== undefined && opts.body !== null;
  const hasContentType = Object.keys(opts.headers).some(
    (h) => h.toLowerCase() === "content-type"
  );

  if (hasBody && !hasContentType) {
    opts.headers["Content-Type"] = "application/json";
  }

  const res = await fetch(path, opts);

  // Try to parse JSON response if present
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  let data = null;
  try {
    data = isJson ? await res.json() : await res.text();
  } catch {
    // ignore parse errors; data stays null
  }

  if (!res.ok) {
    // Prefer API-provided error messages (your backend often sends { error: "..." })
    const apiMsg =
      (data && typeof data === "object" && (data.error || data.message)) ||
      (typeof data === "string" && data) ||
      "";

    const msg = apiMsg || `Request failed: ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  return data;
}
