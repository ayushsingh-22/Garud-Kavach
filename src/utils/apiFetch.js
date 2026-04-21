import baseURL from "../Constants/BaseURL";

const withBaseURL = (input) => {
  if (typeof input === "string" && !input.startsWith("http://") && !input.startsWith("https://")) {
    return `${baseURL}${input}`;
  }
  return input;
};

const apiFetch = (input, init = {}) => {
  const requestInit = {
    ...init,
    credentials: "include",
    headers: {
      ...(init.headers || {}),
    },
  };

  return fetch(withBaseURL(input), requestInit);
};

export default apiFetch;
