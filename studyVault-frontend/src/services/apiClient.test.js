import assert from "node:assert/strict";
import test from "node:test";

const loadApiClientModule = async () => {
  const modulePath = `./apiClient.js?cacheBust=${Date.now()}-${Math.random()}`;
  return import(modulePath);
};

test("does not classify logout-all as an unauthenticated auth flow request", async () => {
  const { isAuthFlowRequest } = await loadApiClientModule();

  assert.equal(isAuthFlowRequest("/auth/logout"), true);
  assert.equal(isAuthFlowRequest("/auth/logout?reason=user"), true);
  assert.equal(isAuthFlowRequest("/auth/logout-all"), false);
});
