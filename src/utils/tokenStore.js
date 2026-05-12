// In-memory + localStorage token store.
// Tokens are kept in memory for fast access and persisted to localStorage
// so they survive browser restarts. A "last active" timestamp auto-expires
// the session after 5 days of inactivity.

const KEYS = {
  access: "gk_access_token",
  refresh: "gk_refresh_token",
  lastActive: "gk_last_active",
};

const INACTIVITY_LIMIT_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

// Check if stored session has expired due to inactivity
function isSessionExpired() {
  const lastActive = localStorage.getItem(KEYS.lastActive);
  if (!lastActive) return true;
  return Date.now() - Number(lastActive) > INACTIVITY_LIMIT_MS;
}

// Touch the last-active timestamp
function touchActivity() {
  localStorage.setItem(KEYS.lastActive, String(Date.now()));
}

// On load: restore from localStorage only if the session is still fresh
function loadStoredTokens() {
  if (isSessionExpired()) {
    localStorage.removeItem(KEYS.access);
    localStorage.removeItem(KEYS.refresh);
    localStorage.removeItem(KEYS.lastActive);
    return { access: null, refresh: null };
  }
  touchActivity();
  return {
    access: localStorage.getItem(KEYS.access) || null,
    refresh: localStorage.getItem(KEYS.refresh) || null,
  };
}

const stored = loadStoredTokens();
let accessToken = stored.access;
let refreshToken = stored.refresh;

export function setTokens(access, refresh) {
  accessToken = access || null;
  refreshToken = refresh || null;
  if (access) localStorage.setItem(KEYS.access, access);
  else localStorage.removeItem(KEYS.access);
  if (refresh) localStorage.setItem(KEYS.refresh, refresh);
  else localStorage.removeItem(KEYS.refresh);
  touchActivity();
}

export function getAccessToken() {
  if (isSessionExpired()) {
    clearTokens();
    return null;
  }
  touchActivity();
  return accessToken;
}

export function getRefreshToken() {
  if (isSessionExpired()) {
    clearTokens();
    return null;
  }
  return refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem(KEYS.access);
  localStorage.removeItem(KEYS.refresh);
  localStorage.removeItem(KEYS.lastActive);
}
