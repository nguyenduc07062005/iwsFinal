import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const documentViewerSource = readFileSync(
  new URL("./DocumentViewer.jsx", import.meta.url),
  "utf8",
);
const documentViewerHookSource = readFileSync(
  new URL("../hooks/useDocumentViewer.js", import.meta.url),
  "utf8",
);

test("document viewer guards stale async loads before updating file preview state", () => {
  assert.match(documentViewerHookSource, /loadRequestIdRef = useRef\(0\)/);
  assert.match(documentViewerHookSource, /const requestId = \+\+loadRequestIdRef\.current/);
  assert.match(
    documentViewerHookSource,
    /if \(isStale\(\)\) \{\s*URL\.revokeObjectURL\(nextFileUrl\);\s*return;\s*\}/s,
  );
  assert.match(documentViewerSource, /viewer\.loadRequestIdRef\.current \+= 1/);
});
