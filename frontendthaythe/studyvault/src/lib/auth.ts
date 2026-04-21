const TOKEN_KEY = 'studyvault_access_token';

const canUseStorage = () => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
};

const decodeBase64Url = (value: string) => {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
};

export const setToken = (token: string) => {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore storage failures
  }
};

export const getToken = () => {
  if (!canUseStorage()) return null;

  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearToken = () => {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage failures
  }
};

export const getTokenPayload = () => {
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

export const isTokenExpired = () => {
  const payload = getTokenPayload();

  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
};

export const isAuthenticated = () => {
  const token = getToken();

  if (!token) {
    return false;
  }

  return !isTokenExpired();
};

export const getUserRoleFromToken = () => {
  const payload = getTokenPayload();
  return payload?.role ?? null;
};
