import baseURL from "../Constants/BaseURL";

const withBaseURL = (input) => {
  if (typeof input === "string" && !input.startsWith("http://") && !input.startsWith("https://")) {
    return `${baseURL}${input}`;
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
      }).then(() => fetch(withBaseURL(input), requestInit));
    }

    isRefreshing = true;

    const refreshResp = await fetch(withBaseURL("/api/auth/refresh"), {
      method: "POST",
      credentials: "include",
    });

    isRefreshing = false;

    if (refreshResp.ok) {
      processQueue(null);
      return fetch(withBaseURL(input), requestInit);
    }

    // Refresh failed — session is gone. Redirect to login.
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

