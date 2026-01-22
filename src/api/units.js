import { apiFetch } from "./client";

/**
 * GET /units
 */
export async function getUnits() {
  return apiFetch("/units");
}
