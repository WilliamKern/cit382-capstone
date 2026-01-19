// src/api/residents.js
import { apiFetch } from "./client";

// Using /residents route (no /api prefix) as requested
export function getResidents() {
  return apiFetch("/residents");
}

export function deleteResident(residentId) {
  return apiFetch(`/residents/${residentId}`, { method: "DELETE" });
}
