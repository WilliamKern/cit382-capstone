// src/api/residents.js
import { apiFetch } from "./client";

// Using /residents route (no /api prefix) as requested
export function getResidents() {
  return apiFetch("/api/residents");
}

export function deleteResident(residentId) {
  return apiFetch(`/api/residents/${residentId}`, { method: "DELETE" });
}
