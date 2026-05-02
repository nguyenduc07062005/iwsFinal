import axios from "axios";
import {
  getCsrfToken,
  getToken,
  expireSession,
  isAuthRoutePath,
  isTokenExpired,
  setCsrfToken,
  setToken,
} from "../utils/auth.js";

const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const AUTH_FLOW_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/complete-registration",
  "/auth/resend-verification",
  "/auth/logout",
  "/auth/refresh",
];
const CSRF_PROTECTED_AUTH_PATHS = [
  "/auth/refresh",
  "/auth/logout",
  "/auth/logout-all",
];

let refreshPromise = null;

const getRequestPath = (url = "") => {
  const rawUrl = String(url);

  try {
    return new URL(rawUrl, "http://studyvault.local").pathname.replace(
      /\/+$/,
      "",
    );
  } catch {
    return rawUrl.split(/[?#]/)[0].replace(/\/+$/, "");
  }
};

const requestPathMatches = (url, paths) => {
  const requestPath = getRequestPath(url);
  return paths.includes(requestPath);
};

export const isAuthFlowRequest = (url = "") =>
  requestPathMatches(url, AUTH_FLOW_PATHS);
export const isCsrfProtectedRequest = (url = "") =>
  requestPathMatches(url, CSRF_PROTECTED_AUTH_PATHS);

const attachCsrfHeader = (config) => {
  if (!isCsrfProtectedRequest(config.url)) {
    return config;
  }

  const csrfToken = getCsrfToken();
  if (!csrfToken) {
    return config;
  }

  config.headers = config.headers || {};
  config.headers["X-CSRF-Token"] = csrfToken;
  return config;
};

const redirectToLoginAfterSessionExpiry = () => {
  if (typeof window === "undefined") {
    return;
  }

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const isAuthRoute = isAuthRoutePath(window.location.pathname);

  expireSession({
    redirectPath: isAuthRoute ? "" : currentPath,
  });

  if (!isAuthRoute) {
    window.location.assign("/login");
  }
};

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post("/auth/refresh", undefined, {
        headers: {
          "X-CSRF-Token": getCsrfToken() || "",
        },
      })
      .then((response) => {
        const accessToken = response.data?.accessToken;
        const csrfToken = response.data?.csrfToken;

        if (!accessToken) {
          throw new Error("Refresh response did not include an access token.");
        }

        setToken(accessToken);
        if (csrfToken) {
          setCsrfToken(csrfToken);
        }
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

apiClient.interceptors.request.use(async (config) => {
  if (isAuthFlowRequest(config.url)) {
    return attachCsrfHeader(config);
  }

  const token = getToken();
  let activeToken = token;

  if (!activeToken || isTokenExpired()) {
    if (!getCsrfToken()) {
      return config;
    }

    try {
      activeToken = await refreshAccessToken();
    } catch {
      redirectToLoginAfterSessionExpiry();

      return Promise.reject(
        new axios.CanceledError("Session expired. Please sign in again."),
      );
    }
  }

  if (!config.headers) {
    config.headers = {};
  }

  if (activeToken) {
    config.headers.Authorization = `Bearer ${activeToken}`;
  }

  return attachCsrfHeader(config);
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthFlowRequest(originalRequest.url)
    ) {
      const hadToken = Boolean(getToken());

      if (hadToken) {
        originalRequest._retry = true;

        try {
          const accessToken = await refreshAccessToken();
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return apiClient(originalRequest);
        } catch {
          redirectToLoginAfterSessionExpiry();
        }
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
