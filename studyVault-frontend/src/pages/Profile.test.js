import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profileSource = readFileSync(
  new URL("./Profile.jsx", import.meta.url),
  "utf8",
);

test("profile exposes a single change password entry point", () => {
  const passwordOpenTriggers = profileSource.match(
    /onClick=\{\(\) => setPasswordOpen\(true\)\}/g,
  );

  assert.equal(passwordOpenTriggers?.length, 1);
});
