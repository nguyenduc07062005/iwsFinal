const WORKSPACE_FALLBACK_PATH = "/app";
const WORKSPACE_LIST_PATHS = new Set(["/app", "/app/favorites"]);

export const buildRoutePath = (location = {}) => {
  const pathname =
    typeof location.pathname === "string" && location.pathname.startsWith("/")
      ? location.pathname
      : WORKSPACE_FALLBACK_PATH;
  const search =
    typeof location.search === "string" && location.search.startsWith("?")
      ? location.search
      : "";
  const hash =
    typeof location.hash === "string" && location.hash.startsWith("#")
      ? location.hash
      : "";

  return `${pathname}${search}${hash}`;
};

export const getSafeWorkspaceReturnPath = (returnTo) => {
  if (typeof returnTo !== "string" || !returnTo.startsWith("/")) {
    return WORKSPACE_FALLBACK_PATH;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(returnTo, "http://studyvault.local");
  } catch {
    return WORKSPACE_FALLBACK_PATH;
  }

  if (parsedUrl.origin !== "http://studyvault.local") {
    return WORKSPACE_FALLBACK_PATH;
  }

  if (!WORKSPACE_LIST_PATHS.has(parsedUrl.pathname)) {
    return WORKSPACE_FALLBACK_PATH;
  }

  return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
};
