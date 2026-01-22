import { apiFetch } from "./client";

/**
 * GET /payments
 */
export async function getPayments() {
  return apiFetch("/payments");
}

/**
 * POST /payments
 * We are NOT guessing extra fields beyond what the user inputs.
 * You can include period_month / period_year if your server supports it.
 */
export async function createPayment(payload) {
  return apiFetch("/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
