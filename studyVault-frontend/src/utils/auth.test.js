import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";

const createStorage = () => {
  const values = new Map();

  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
};

const base64UrlEncode = (value) =>
  Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const createJwt = (payload) =>
  ["header", base64UrlEncode(payload), "signature"].join(".");

const loadAuthModule = async () => {
  const modulePath = `./auth.js?cacheBust=${Date.now()}-${Math.random()}`;
  return import(modulePath);
};

test("stores access tokens in memory instead of localStorage", async () => {
  const localStorage = createStorage();
  globalThis.window = {
    localStorage,
    sessionStorage: createStorage(),
  };
  globalThis.document = { cookie: "" };

  const { getToken, setToken } = await loadAuthModule();

  setToken(createJwt({ exp: Math.floor(Date.now() / 1000) + 60 }));

  assert.equal(getToken()?.includes("signature"), true);
  assert.equal(localStorage.getItem("token"), null);
});

test("treats an expired access token without refresh hint as unauthenticated", async () => {
  globalThis.window = {
    localStorage: createStorage(),
    sessionStorage: createStorage(),
  };
  globalThis.document = { cookie: "" };

  const { isAuthenticated, setToken } = await loadAuthModule();

  setToken(createJwt({ exp: Math.floor(Date.now() / 1000) - 60 }));

  assert.equal(isAuthenticated(), false);
});

test("allows protected routes to rehydrate from the CSRF cookie", async () => {
  globalThis.window = {
    localStorage: createStorage(),
    sessionStorage: createStorage(),
  };
  globalThis.document = { cookie: "studyvault_csrf_token=csrf-token" };

  const { isAuthenticated } = await loadAuthModule();

  assert.equal(isAuthenticated(), true);
});

test("keeps CSRF tokens out of localStorage while retaining a cookie fallback", async () => {
  const localStorage = createStorage();
  globalThis.window = {
    localStorage,
    sessionStorage: createStorage(),
  };
  globalThis.document = { cookie: "" };

  const { getCsrfToken, setCsrfToken } = await loadAuthModule();

  setCsrfToken("csrf-token");

  assert.equal(getCsrfToken(), "csrf-token");
  assert.equal(localStorage.getItem("csrf_token"), null);
});
