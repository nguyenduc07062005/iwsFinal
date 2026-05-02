import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const documentViewerSource = readFileSync(
  new URL("./DocumentViewer.jsx", import.meta.url),
  "utf8",
);

test("document viewer guards stale async loads before updating file preview state", () => {
  assert.match(documentViewerSource, /loadRequestIdRef = useRef\(0\)/);
  assert.match(documentViewerSource, /const requestId = \+\+loadRequestIdRef\.current/);
  assert.match(
    documentViewerSource,
    /if \(requestId !== loadRequestIdRef\.current\) \{\s*URL\.revokeObjectURL\(nextFileUrl\);\s*return;\s*\}/s,
  );
});
