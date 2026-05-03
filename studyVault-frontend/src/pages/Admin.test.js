import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminSource = readFileSync(new URL("./Admin.jsx", import.meta.url), "utf8");

test("admin data loader participates in hook dependency checking", () => {
  assert.match(adminSource, /const loadAdminData = useCallback\(async \(\) =>/);
  assert.doesNotMatch(adminSource, /eslint-disable-next-line react-hooks\/exhaustive-deps/);
  assert.match(adminSource, /\}, \[loadAdminData\]\);/);
});

test("admin activity timeline uses its own paginated audit loader", () => {
  assert.match(adminSource, /const AUDIT_LOG_LIMIT = 5;/);
  assert.match(adminSource, /const \[auditPage, setAuditPage\] = useState\(1\);/);
  assert.match(
    adminSource,
    /getAdminAuditLogs\(\{\s*limit: AUDIT_LOG_LIMIT,\s*page: nextPage,\s*\}\)/s,
  );
  assert.match(adminSource, /Page \{auditCurrentPage\} \/ \{auditTotalPages\}/);
  assert.doesNotMatch(
    adminSource,
    /getAdminAuditLogs\(\{\s*limit: 5,\s*page: 1,\s*\}\)/s,
  );
});

test("admin activity pagination keeps existing timeline visible while fetching pages", () => {
  assert.match(
    adminSource,
    /const activityInitialLoading = auditLoading && auditLogs\.length === 0;/,
  );
  assert.match(
    adminSource,
    /const activityRefreshing = auditLoading && auditLogs\.length > 0;/,
  );
  assert.match(adminSource, /activityRefreshing && "opacity-70"/);
  assert.doesNotMatch(adminSource, /\{activityLoading \? \(/);
});

test("admin user pagination keeps existing account rows visible while fetching pages", () => {
  assert.match(adminSource, /const userCurrentPage = page;/);
  assert.match(adminSource, /const usersInitialLoading = loading && users\.length === 0;/);
  assert.match(adminSource, /const usersRefreshing = loading && users\.length > 0;/);
  assert.match(adminSource, /usersRefreshing && "opacity-70"/);
  assert.match(adminSource, /Page \{userCurrentPage\} \/ \{userTotalPages\}/);
  assert.doesNotMatch(adminSource, /\{loading \? \(/);
});

test("admin users can be promoted to admin from the users table", () => {
  assert.match(adminSource, /updateAdminUserRole/);
  assert.match(adminSource, /const \[updatingRoleUserId, setUpdatingRoleUserId\] = useState\(""\);/);
  assert.match(adminSource, /const handlePromoteToAdmin = async \(user\) =>/);
  assert.match(adminSource, /role: "admin"/);
  assert.match(adminSource, /onPromote=\{\(userToPromote\) =>\s*void handlePromoteToAdmin\(userToPromote\)\s*\}/s);
  assert.match(adminSource, /Make admin/);
  assert.match(adminSource, /showPromoteConfirm/);
});

test("admin activity and users cards share a fixed-height two-column layout", () => {
  assert.match(adminSource, /mt-8 grid items-stretch gap-5 xl:grid-cols-5/);
  assert.match(adminSource, /sks-card flex h-full min-h-\[38rem\] flex-col overflow-hidden xl:col-span-2/);
  assert.match(adminSource, /sks-card flex h-full min-h-\[38rem\] flex-col overflow-hidden xl:col-span-3/);
});

test("admin activity reserves five timeline slots and keeps pagination pinned to the bottom", () => {
  assert.match(
    adminSource,
    /const activitySlotPlaceholders = Math\.max\(\s*AUDIT_LOG_LIMIT - auditLogs\.length,\s*0,\s*\);/s,
  );
  assert.match(adminSource, /Array\.from\(\{ length: activitySlotPlaceholders \}\)/);
  assert.match(adminSource, /aria-hidden="true"/);
  assert.match(adminSource, /min-h-\[5\.75rem\]/);
  assert.match(adminSource, /flex-1 px-5 py-2/);
  assert.match(adminSource, /mt-auto flex flex-col gap-3 border-t border-slate-100 px-5 py-3/);
});
