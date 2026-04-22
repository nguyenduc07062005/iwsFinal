const TOKEN_KEY = 'token';
const AUTH_NOTICE_KEY = 'auth_notice';
const AUTH_REDIRECT_KEY = 'auth_redirect_path';
const AUTH_ROUTE_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

const canUseStorage = () => {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    );
  } catch {
    return false;
  }
};

const decodeBase64Url = (value) => {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
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

  const [, payload] = token.split('.');

  if (!payload) {
    return null;
  }

  return decodeBase64Url(payload);
};

const canUseSessionStorage = () => {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.sessionStorage !== 'undefined'
    );
  } catch {
    return false;
  }
};

export const isTokenExpired = () => {
  const payload = getTokenPayload();

  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
};

export const setToken = (token) => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore browser storage failures and fall back to unauthenticated mode.
  }
};

export const getToken = () => {
  if (!canUseStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearToken = () => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore browser storage failures and keep the app responsive.
  }
};

export const isAuthenticated = () => {
  const token = getToken();

  if (!token) {
    return false;
  }

  if (isTokenExpired()) {
    clearToken();
    return false;
  }

  return true;
};

export const getRoleFromToken = () => {
  const payload = getTokenPayload();

  return payload?.role || payload?.roles || payload?.userRole || null;
};

export const getUserIdFromToken = () => {
  const payload = getTokenPayload();

  return payload?.sub || payload?.userId || null;
};

export const isAuthRoutePath = (pathname = '') =>
  AUTH_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export const setAuthNotice = (message) => {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    const payload =
      typeof message === 'string'
        ? { message, tone: 'info' }
        : {
            message: message?.message || '',
            tone: message?.tone || 'info',
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
    const rawValue = window.sessionStorage.getItem(AUTH_NOTICE_KEY) || '';
    window.sessionStorage.removeItem(AUTH_NOTICE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    if (typeof parsedValue?.message !== 'string' || !parsedValue.message.trim()) {
      return null;
    }

    return {
      message: parsedValue.message,
      tone: parsedValue.tone || 'info',
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
    return '';
  }

  try {
    const value = window.sessionStorage.getItem(AUTH_REDIRECT_KEY) || '';
    window.sessionStorage.removeItem(AUTH_REDIRECT_KEY);
    return value;
  } catch {
    return '';
  }
};

export const expireSession = ({
  message = 'Your session expired. Please sign in again.',
  redirectPath = '',
} = {}) => {
  clearToken();
  setAuthNotice({
    message,
    tone: 'info',
  });
  setAuthRedirectPath(redirectPath);
};

export const logout = ({
  message = 'You signed out successfully.',
  announce = true,
} = {}) => {
  clearToken();
  setAuthRedirectPath('');

  if (announce) {
    setAuthNotice({
      message,
      tone: 'info',
    });
  }
};
