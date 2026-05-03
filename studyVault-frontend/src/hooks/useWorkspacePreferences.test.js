import assert from "node:assert/strict";
import test from "node:test";

import { shouldHydrateStoredWorkspaceQuery } from "./workspacePreferenceHydration.js";

const params = (query = "") => new URLSearchParams(query);

test("hydrates a saved folder preference only before the workspace query is initialized", () => {
  assert.equal(
    shouldHydrateStoredWorkspaceQuery({
      hydrationCompleted: false,
      searchParams: params(""),
      storedQuery: { folderId: "folder-1" },
    }),
    true,
  );

  assert.equal(
    shouldHydrateStoredWorkspaceQuery({
      hydrationCompleted: true,
      searchParams: params(""),
      storedQuery: { folderId: "folder-1" },
    }),
    false,
  );
});

test("does not hydrate saved workspace query over an explicit URL query", () => {
  assert.equal(
    shouldHydrateStoredWorkspaceQuery({
      hydrationCompleted: false,
      searchParams: params("folderId=folder-2"),
      storedQuery: { folderId: "folder-1" },
    }),
    false,
  );
});

test("does not hydrate empty normalized workspace preferences", () => {
  assert.equal(
    shouldHydrateStoredWorkspaceQuery({
      hydrationCompleted: false,
      searchParams: params(""),
      storedQuery: { folderId: undefined, keyword: undefined },
    }),
    false,
  );
});
