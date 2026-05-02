import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRoutePath,
  getSafeWorkspaceReturnPath,
} from "./workspaceNavigation.js";

test("builds a workspace return path with query and hash intact", () => {
  assert.equal(
    buildRoutePath({
      pathname: "/app",
      search: "?folderId=folder-1&page=2",
      hash: "#documents",
    }),
    "/app?folderId=folder-1&page=2#documents",
  );
});

test("keeps document viewer back navigation inside workspace list routes", () => {
  assert.equal(
    getSafeWorkspaceReturnPath("/app?folderId=folder-1&type=pdf"),
    "/app?folderId=folder-1&type=pdf",
  );
  assert.equal(
    getSafeWorkspaceReturnPath("/app/favorites?page=2"),
    "/app/favorites?page=2",
  );
  assert.equal(getSafeWorkspaceReturnPath("/app/documents/doc-1"), "/app");
  assert.equal(getSafeWorkspaceReturnPath("https://evil.test/app"), "/app");
  assert.equal(getSafeWorkspaceReturnPath("/login"), "/app");
});
