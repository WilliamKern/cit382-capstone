import { apiFetch } from "./client";

/**
 * GET /payments
 */
export async function getPayments() {
  return apiFetch("/api/payments");
}

/**
 * POST /payments
 * We are NOT guessing extra fields beyond what the user inputs.
 * You can include period_month / period_year if your server supports it.
 */
export async function createPayment(payload) {
  return apiFetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * GET /lease-lookup?prefix=10
 */
export async function lookupLeasesByPrefix(prefix) {
  const q = encodeURIComponent(prefix);
  return apiFetch(`/api/lease-lookup?prefix=${q}`);
  
}
