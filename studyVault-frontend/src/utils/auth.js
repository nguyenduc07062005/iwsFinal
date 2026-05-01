const TOKEN_KEY = "token";
const CSRF_TOKEN_KEY = "csrf_token";
const CSRF_TOKEN_COOKIE_NAME = "studyvault_csrf_token";
const AUTH_NOTICE_KEY = "auth_notice";
const AUTH_REDIRECT_KEY = "auth_redirect_path";
const AUTH_ROUTE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];
let accessToken = null;
let csrfTokenMemory = null;

const decodeBase64Url = (value) => {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

const getTokenPayload = () => {
  const token = getToken();

  if (!token) {
    return null;
  }

  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  return decodeBase64Url(payload);
};

const canUseSessionStorage = () => {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.sessionStorage !== "undefined"
    );
  } catch {
    return false;
  }
};

export const isTokenExpired = () => {
  const payload = getTokenPayload();

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
};

export const setToken = (token) => {
  accessToken = typeof token === "string" && token.trim() ? token : null;

  try {
    window.localStorage?.removeItem(TOKEN_KEY);
  } catch {
    // Ignore browser storage failures and keep token memory-only.
  }
};

export const getToken = () => {
  return accessToken;
};

export const clearToken = () => {
  accessToken = null;

  try {
    window.localStorage?.removeItem(TOKEN_KEY);
  } catch {
    // Ignore browser storage failures and keep the app responsive.
  }
};

const getCookieValue = (cookieName) => {
  if (typeof document === "undefined") {
    return null;
  }

  return (
    document.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${cookieName}=`))
      ?.slice(`${cookieName}=`.length) || null
  );
};

export const setCsrfToken = (csrfToken) => {
  csrfTokenMemory =
    typeof csrfToken === "string" && csrfToken.trim() ? csrfToken : null;

  try {
    window.localStorage?.removeItem(CSRF_TOKEN_KEY);
  } catch {
    // Ignore browser storage failures; cookie fallback may still be available.
  }
};

export const getCsrfToken = () => {
  if (csrfTokenMemory) {
    return csrfTokenMemory;
  }

  const csrfCookie = getCookieValue(CSRF_TOKEN_COOKIE_NAME);
  return csrfCookie ? decodeURIComponent(csrfCookie) : null;
};

export const clearCsrfToken = () => {
  csrfTokenMemory = null;

  try {
    window.localStorage?.removeItem(CSRF_TOKEN_KEY);
  } catch {
    // Ignore browser storage failures and keep the app responsive.
  }
};

export const isAuthenticated = () => {
  const token = getToken();

  if (token && !isTokenExpired()) {
    return true;
  }

  return Boolean(getCsrfToken());
};

export const getRoleFromToken = () => {
  const payload = getTokenPayload();

  return payload?.role || payload?.roles || payload?.userRole || null;
};

export const getUserIdFromToken = () => {
  const payload = getTokenPayload();

  return payload?.sub || payload?.userId || null;
};

export const isAuthRoutePath = (pathname = "") =>
  AUTH_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export const setAuthNotice = (message) => {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    const payload =
      typeof message === "string"
        ? { message, tone: "info" }
        : {
            message: message?.message || "",
            tone: message?.tone || "info",
          };
    window.sessionStorage.setItem(AUTH_NOTICE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore session storage failures.
  }
};

export const consumeAuthNotice = () => {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(AUTH_NOTICE_KEY) || "";
    window.sessionStorage.removeItem(AUTH_NOTICE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    if (
      typeof parsedValue?.message !== "string" ||
      !parsedValue.message.trim()
    ) {
      return null;
    }

    return {
      message: parsedValue.message,
      tone: parsedValue.tone || "info",
    };
  } catch {
    return null;
  }
};

export const setAuthRedirectPath = (value) => {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    if (value) {
      window.sessionStorage.setItem(AUTH_REDIRECT_KEY, value);
      return;
    }

    window.sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  } catch {
    // Ignore session storage failures.
  }
};

export const consumeAuthRedirectPath = () => {
  if (!canUseSessionStorage()) {
    return "";
  }

  try {
    const value = window.sessionStorage.getItem(AUTH_REDIRECT_KEY) || "";
    window.sessionStorage.removeItem(AUTH_REDIRECT_KEY);
    return value;
  } catch {
    return "";
  }
};

export const expireSession = ({
  message = "Your session expired. Please sign in again.",
  redirectPath = "",
} = {}) => {
  clearToken();
  clearCsrfToken();
  setAuthNotice({
    message,
    tone: "info",
  });
  setAuthRedirectPath(redirectPath);
};

export const logout = ({
  message = "You signed out successfully.",
  announce = true,
} = {}) => {
  clearToken();
  clearCsrfToken();
  setAuthRedirectPath("");

  if (announce) {
    setAuthNotice({
      message,
      tone: "info",
    });
  }
};
