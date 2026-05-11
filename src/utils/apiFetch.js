import apiConfig from "../Constants/BaseURL";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./tokenStore";

const withBaseURL = (input) => {
  if (typeof input === "string" && !input.startsWith("http://") && !input.startsWith("https://")) {
    return `${apiConfig.baseURL}${input}`;
  }
  return input;
};

let isRefreshing = false;
let pendingRequests = [];

const processQueue = (error) => {
  pendingRequests.forEach((p) => (error ? p.reject(error) : p.resolve()));
  pendingRequests = [];
};

const apiFetch = async (input, init = {}) => {
  const requestInit = {
    ...init,
    credentials: "include",
    headers: {
      ...(init.headers || {}),
    },
  };

  // Attach Authorization header if we have an access token
  const token = getAccessToken();
  if (token) {
    requestInit.headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(withBaseURL(input), requestInit);

  // If the access token has expired, attempt one silent refresh then retry.
  if (response.status === 401) {
    // Don't attempt to refresh if the failed request IS the refresh endpoint
    // (avoids an infinite loop when the refresh token itself is invalid/expired).
    const url = typeof input === "string" ? input : input.url ?? "";
    if (url.includes("/api/auth/refresh") || url.includes("/api/login")) {
      return response;
    }

    if (isRefreshing) {
      // Another request already triggered a refresh — queue this one.
      return new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject });
      }).then(() => {
        const retryInit = { ...requestInit };
        const newToken = getAccessToken();
        if (newToken) retryInit.headers = { ...retryInit.headers, Authorization: `Bearer ${newToken}` };
        return fetch(withBaseURL(input), retryInit);
      });
    }

    isRefreshing = true;

    const refreshResp = await fetch(withBaseURL("/api/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: getRefreshToken() }),
    });

    isRefreshing = false;

    if (refreshResp.ok) {
      const data = await refreshResp.json();
      if (data.access_token) {
        setTokens(data.access_token, getRefreshToken());
      }
      processQueue(null);
      const retryInit = { ...requestInit };
      const newToken = getAccessToken();
      if (newToken) retryInit.headers = { ...retryInit.headers, Authorization: `Bearer ${newToken}` };
      return fetch(withBaseURL(input), retryInit);
    }

    // Refresh failed — session is gone. Redirect to login.
    clearTokens();
    processQueue(new Error("Session expired"));
    if (typeof window !== "undefined") {
      const authPaths = ["/login", "/signup", "/register"];
      const onAuthPage = authPaths.some((p) => window.location.pathname.startsWith(p));
      if (!onAuthPage) {
        window.location.href = "/login";
      }
    }
    return response;
  }

  return response;
};

export default apiFetch;

