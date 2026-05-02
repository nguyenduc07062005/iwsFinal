import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminSource = readFileSync(new URL("./Admin.jsx", import.meta.url), "utf8");

test("admin data loader participates in hook dependency checking", () => {
  assert.match(adminSource, /const loadAdminData = useCallback\(async \(\) =>/);
  assert.doesNotMatch(adminSource, /eslint-disable-next-line react-hooks\/exhaustive-deps/);
  assert.match(adminSource, /\}, \[loadAdminData\]\);/);
});
