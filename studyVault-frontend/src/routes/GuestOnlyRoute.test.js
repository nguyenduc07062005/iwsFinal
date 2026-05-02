import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const guestOnlyRouteSource = readFileSync(
  new URL("./GuestOnlyRoute.jsx", import.meta.url),
  "utf8",
);

test("guest-only routes redirect when any valid auth session is present", () => {
  assert.match(guestOnlyRouteSource, /import \{ isAuthenticated \}/);
  assert.match(guestOnlyRouteSource, /if \(isAuthenticated\(\)\)/);
  assert.doesNotMatch(guestOnlyRouteSource, /hasValidAccessToken/);
});
