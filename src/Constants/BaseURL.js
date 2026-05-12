// In production, VITE_API_URL points to the deployed backend (full URL).
// In dev, Vite proxy routes /api and /ws to localhost:8080 — so we use
// an empty string (relative path) to avoid cross-origin issues.
const REMOTE_URL = import.meta.env.VITE_API_URL || "";
const LOCALHOST_URL = "http://localhost:8080";

// Dev  → prefer '' (Vite proxy), fallback to localhost:8080 if proxy is down.
// Prod → prefer REMOTE_URL, fallback to localhost:8080 if remote is down.
const PRIMARY_URL = import.meta.env.DEV ? "" : REMOTE_URL;

// Mutable config — updated by the health check below.
// Consumers read apiConfig.baseURL at request time (not at import time)
// so they always get the resolved value.
const apiConfig = { baseURL: PRIMARY_URL, resolved: false };

// On load, check if the primary backend is reachable.
// Retry up to 3 times with increasing timeout to handle Render cold-starts.
const healthUrl = PRIMARY_URL
  ? `${PRIMARY_URL}/api/health`
  : "/api/health"; // relative → goes through Vite proxy in dev

(async () => {
  const attempts = [8000, 20000, 45000]; // timeouts: 8s, 20s, 45s
  for (let i = 0; i < attempts.length; i++) {
    try {
      const r = await fetch(healthUrl, {
        method: "GET",
        mode: "cors",
        signal: AbortSignal.timeout(attempts[i]),
      });
      if (!r.ok) throw new Error("unhealthy");
      console.log(`[api] Backend reachable via ${PRIMARY_URL || "proxy"}`);
      apiConfig.resolved = true;
      return;
    } catch {
      console.warn(`[api] Health check attempt ${i + 1}/${attempts.length} failed`);
    }
  }
  console.warn(`[api-fallback] Primary unreachable — switching to ${LOCALHOST_URL}`);
  apiConfig.baseURL = LOCALHOST_URL;
  apiConfig.resolved = true;
})();

export default apiConfig;
