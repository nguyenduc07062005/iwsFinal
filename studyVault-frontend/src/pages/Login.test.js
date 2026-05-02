import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const loginSource = readFileSync(new URL("./Login.jsx", import.meta.url), "utf8");

test("login auth notices use auto-dismiss toasts instead of an inline banner", () => {
  assert.match(loginSource, /from "react-hot-toast"|from 'react-hot-toast'/);
  assert.doesNotMatch(loginSource, /role="status"[\s\S]+mb-5/);
  assert.doesNotMatch(loginSource, /const \[notice, setNotice\]/);
  assert.match(loginSource, /duration: 3000/);
  assert.match(loginSource, /toast\.success\(nextNotice\.message/);
});
