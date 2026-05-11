// In-memory + sessionStorage token store.
// Tokens are kept in memory for fast access and persisted to sessionStorage
// so they survive soft-navigations (but not tab close — that's intentional).

const KEYS = { access: "gk_access_token", refresh: "gk_refresh_token" };

let accessToken = sessionStorage.getItem(KEYS.access) || null;
let refreshToken = sessionStorage.getItem(KEYS.refresh) || null;

export function setTokens(access, refresh) {
  accessToken = access || null;
  refreshToken = refresh || null;
  if (access) sessionStorage.setItem(KEYS.access, access);
  else sessionStorage.removeItem(KEYS.access);
  if (refresh) sessionStorage.setItem(KEYS.refresh, refresh);
  else sessionStorage.removeItem(KEYS.refresh);
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  sessionStorage.removeItem(KEYS.access);
  sessionStorage.removeItem(KEYS.refresh);
}
