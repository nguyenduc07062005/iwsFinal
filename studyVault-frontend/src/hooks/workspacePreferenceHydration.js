const WORKSPACE_QUERY_KEYS = [
  "sortBy",
  "sortOrder",
  "type",
  "favorite",
  "keyword",
  "subjectId",
  "tagId",
  "folderId",
  "limit",
];

export const hasWorkspaceQueryPreferences = (params) =>
  WORKSPACE_QUERY_KEYS.some((key) => params.has(key));

const hasStoredWorkspaceQueryPreferences = (storedQuery) =>
  Object.values(storedQuery ?? {}).some(
    (value) => value !== undefined && value !== null && value !== "",
  );

export const shouldHydrateStoredWorkspaceQuery = ({
  hydrationCompleted,
  searchParams,
  storedQuery,
}) => {
  if (hydrationCompleted) return false;
  if (hasWorkspaceQueryPreferences(searchParams)) return false;
  return hasStoredWorkspaceQueryPreferences(storedQuery);
};
