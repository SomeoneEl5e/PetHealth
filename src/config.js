/**
 * Frontend Configuration
 * ----------------------
 * Exports the base URL for all API requests.
 * Uses the VITE_API_BASE environment variable if set,
 * otherwise defaults to localhost:5000 for local development.
 */
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
