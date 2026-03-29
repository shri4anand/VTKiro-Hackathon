// API Configuration
// In production (Vercel), the API is served from the same domain under /api/
// In local development, VITE_API_URL can point to the local backend (default: http://localhost:3001)
// Empty string = same-domain (production on Vercel); set VITE_API_URL for local dev
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
