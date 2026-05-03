import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderClosed,
  HardDrive,
  History,
  LockKeyhole,
  Loader2,
  Mail,
  Search,
  ShieldCheck,
  UnlockKeyhole,
  UsersRound,
  X,
} from "lucide-react";
import {
  getAdminAuditLogs,
  getAdminStats,
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../service/adminAPI.js";
import { cn } from "../lib/utils.js";
import { getApiErrorMessage } from "../utils/apiError.js";

const MotionDiv = motion.div;

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Locked", value: "locked" },
];

const DEFAULT_LIMIT = 10;
const AUDIT_LOG_LIMIT = 5;

const readPositiveInt = (value, fallback) => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
};

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value || 0));

const formatBytes = (bytes) => {
  const value = Number(bytes || 0);
  if (value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );

  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const getRoleLabel = (role) => (role === "admin" ? "Admin" : "User");

const getStatusLabel = (isActive) => (isActive ? "Active" : "Locked");

const formatAuditStatus = (value) =>
  typeof value === "boolean" ? getStatusLabel(value) : "Unknown";

const formatAuditRole = (value) =>
  value === "admin" || value === "user" ? getRoleLabel(value) : "Unknown";

const formatAuditAction = (action) => {
  if (action === "USER_LOCKED")
    return { label: "Locked account", icon: LockKeyhole, tone: "rose" };
  if (action === "USER_PROMOTED_TO_ADMIN")
    return { label: "Promoted account", icon: ShieldCheck, tone: "brand" };
  if (action === "USER_UNLOCKED")
    return { label: "Unlocked account", icon: UnlockKeyhole, tone: "emerald" };
  return { label: action || "Action", icon: History, tone: "slate" };
};

const formatDateTime = (value) => {
  if (!value) return "Unknown time";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const formatRelativeTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return `${Math.floor(seconds / 86400)}d ago`;
};

/* ──────────────────────────── Stat Card ──────────────────────────── */

const StatCard = ({ icon, label, value, subLabel, index = 0 }) => {
  const StatIcon = icon;

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.07,
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="workspace-metric-tile group relative flex-col !items-start !gap-0 !p-0"
    >
      <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-[inherit] p-5">
        {/* brand accent top bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-900 to-brand-500" />

        <div className="flex items-center justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-900 text-white shadow-md shadow-brand-900/20">
            <StatIcon size={18} strokeWidth={2.4} />
          </span>
        </div>

        <div className="mt-4">
          <p className="text-[10.5px] font-extrabold uppercase tracking-widest text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>
          {subLabel ? (
            <p className="mt-1 text-[11.5px] font-semibold leading-snug text-slate-500">
              {subLabel}
            </p>
          ) : null}
        </div>
      </div>
    </MotionDiv>
  );
};

/* ──────────────────────────── Timeline Item ──────────────────────── */

const TimelineItem = ({ log, index }) => {
  const actionInfo = formatAuditAction(log.action);
  const ActionIcon = actionInfo.icon;
  const beforeActive = log.metadata?.previousIsActive;
  const afterActive = log.metadata?.nextIsActive;
  const beforeRole = log.metadata?.previousRole;
  const afterRole = log.metadata?.nextRole;
  const isRoleChange = log.action === "USER_PROMOTED_TO_ADMIN";

  return (
    <MotionDiv
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="group relative flex min-h-[5.75rem] gap-3.5 py-3"
    >
      {/* timeline line */}
      <div className="absolute bottom-0 left-[17px] top-0 w-px bg-gradient-to-b from-brand-200 via-brand-100 to-transparent" />

      {/* icon dot */}
      <div
        className={cn(
          "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-110",
          actionInfo.tone === "rose"
            ? "bg-rose-50 text-rose-600"
            : actionInfo.tone === "emerald"
              ? "bg-emerald-50 text-emerald-600"
              : actionInfo.tone === "brand"
                ? "bg-brand-50 text-brand-900"
                : "bg-slate-100 text-slate-600",
        )}
      >
        <ActionIcon size={14} strokeWidth={2.4} />
      </div>

      {/* content */}
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-800">
            {actionInfo.label}{" "}
            <span className="font-black text-slate-950">
              {log.metadata?.targetName || "User"}
            </span>
          </p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
            {log.metadata?.targetEmail || log.targetUserId || "Unknown"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-block rounded-md px-1.5 py-0.5 text-[10px] font-black",
              beforeActive === true
                ? "bg-emerald-50 text-emerald-700"
                : beforeActive === false
                  ? "bg-rose-50 text-rose-600"
                  : "bg-slate-50 text-slate-500",
            )}
          >
            {isRoleChange
              ? formatAuditRole(beforeRole)
              : formatAuditStatus(beforeActive)}
          </span>
          <span className="text-[10px] text-slate-300">→</span>
          <span
            className={cn(
              "inline-block rounded-md px-1.5 py-0.5 text-[10px] font-black",
              isRoleChange
                ? "bg-brand-50 text-brand-900"
                : afterActive === true
                  ? "bg-emerald-50 text-emerald-700"
                  : afterActive === false
                    ? "bg-rose-50 text-rose-600"
                    : "bg-slate-50 text-slate-500",
            )}
          >
            {isRoleChange
              ? formatAuditRole(afterRole)
              : formatAuditStatus(afterActive)}
          </span>
          <span className="ml-auto whitespace-nowrap text-[10px] font-semibold text-slate-400">
            {formatRelativeTime(log.createdAt) || formatDateTime(log.createdAt)}
          </span>
        </div>
      </div>
    </MotionDiv>
  );
};

/* ──────────────────────────── User Row ──────────────────────────── */

const UserRow = ({
  user,
  index,
  updatingUserId,
  updatingRoleUserId,
  onToggle,
  onPromote,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  const isAdmin = user.role === "admin";
  const isUpdating = updatingUserId === user.id;
  const isPromoting = updatingRoleUserId === user.id;
  const isBusy = isUpdating || isPromoting;

  const handleAction = () => {
    if (isAdmin) return;
    setShowPromoteConfirm(false);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onToggle(user);
  };

  const handlePromoteAction = () => {
    if (isAdmin) return;
    setShowConfirm(false);
    setShowPromoteConfirm(true);
  };

  const handlePromoteConfirm = () => {
    setShowPromoteConfirm(false);
    onPromote(user);
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group flex items-center gap-3.5 border-b border-slate-100 px-5 py-3.5 transition-colors last:border-b-0 hover:bg-brand-50/30"
    >
      {/* avatar */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-black text-white shadow-sm",
          isAdmin
            ? "bg-brand-900"
            : user.isActive
              ? "bg-dark"
              : "bg-slate-400",
        )}
      >
        {(user.name || user.email || "U").slice(0, 2).toUpperCase()}
      </div>

      {/* info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-black text-slate-950">
            {user.name || "Unnamed"}
          </p>
          {isAdmin && (
            <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-brand-900">
              Admin
            </span>
          )}
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] font-medium text-slate-500">
          <Mail size={11} />
          <span className="truncate">{user.email}</span>
        </p>
      </div>

      {/* role */}
      <span className="hidden rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 sm:inline-block">
        {getRoleLabel(user.role)}
      </span>

      {/* status */}
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            user.isActive
              ? "bg-emerald-500 shadow-[0_0_6px] shadow-emerald-500/40"
              : "bg-rose-500 shadow-[0_0_6px] shadow-rose-500/40",
          )}
        />
        <span
          className={cn(
            "text-[11px] font-bold",
            user.isActive ? "text-emerald-700" : "text-rose-600",
          )}
        >
          {getStatusLabel(user.isActive)}
        </span>
      </div>

      {/* action */}
      <div className="ml-1 flex shrink-0 items-center gap-1.5">
        {!isAdmin ? (
          <AnimatePresence mode="wait">
            {showPromoteConfirm ? (
              <MotionDiv
                key="promote-confirm"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="flex items-center gap-1.5"
              >
                <button
                  type="button"
                  onClick={handlePromoteConfirm}
                  disabled={isBusy}
                  className="rounded-lg bg-brand-900 px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPromoting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Promote"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPromoteConfirm(false)}
                  disabled={isBusy}
                  className="rounded-lg bg-slate-100 p-1.5 text-slate-500 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={12} />
                </button>
              </MotionDiv>
            ) : (
              <MotionDiv
                key="promote-action"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
              >
                <button
                  type="button"
                  onClick={handlePromoteAction}
                  disabled={isBusy}
                  title="Make this user an admin"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-[11px] font-black text-brand-900 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isPromoting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck size={12} />
                      <span>Make admin</span>
                    </>
                  )}
                </button>
              </MotionDiv>
            )}
          </AnimatePresence>
        ) : null}

        <AnimatePresence mode="wait">
          {showConfirm ? (
            <MotionDiv
              key="confirm"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="flex items-center gap-1.5"
            >
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isBusy}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition-all hover:-translate-y-0.5",
                  user.isActive
                    ? "bg-rose-500 hover:bg-rose-600"
                    : "bg-emerald-500 hover:bg-emerald-600",
                )}
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Confirm"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isBusy}
                className="rounded-lg bg-slate-100 p-1.5 text-slate-500 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={12} />
              </button>
            </MotionDiv>
          ) : (
            <MotionDiv
              key="action"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
            >
              <button
                type="button"
                onClick={handleAction}
                disabled={isAdmin || isBusy}
                title={
                  isAdmin
                    ? "Admin accounts cannot be locked"
                    : user.isActive
                      ? "Lock this account"
                      : "Unlock this account"
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-black shadow-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35",
                  user.isActive
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white",
                )}
              >
                {isUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : user.isActive ? (
                  <>
                    <LockKeyhole size={12} />
                    <span>Lock</span>
                  </>
                ) : (
                  <>
                    <UnlockKeyhole size={12} />
                    <span>Unlock</span>
                  </>
                )}
              </button>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>
    </MotionDiv>
  );
};

/* ─────────────────────────── Main Component ─────────────────────── */

const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPagination, setAuditPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: AUDIT_LOG_LIMIT,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: DEFAULT_LIMIT,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [keywordInput, setKeywordInput] = useState(
    searchParams.get("keyword") || "",
  );
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const requestIdRef = useRef(0);
  const auditRequestIdRef = useRef(0);

  const page = readPositiveInt(searchParams.get("page"), 1);
  const limit = readPositiveInt(searchParams.get("limit"), DEFAULT_LIMIT);
  const keyword = (searchParams.get("keyword") || "").trim();

  useEffect(() => {
    setKeywordInput(keyword);
  }, [keyword]);

  const updateQuery = (updates, options = {}) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      const shouldRemove =
        value === undefined ||
        value === null ||
        value === "" ||
        (key === "page" && Number(value) <= 1) ||
        (key === "limit" && Number(value) === DEFAULT_LIMIT) ||
        (key === "status" && value === "all");

      if (shouldRemove) {
        nextParams.delete(key);
        return;
      }

      nextParams.set(key, String(value));
    });

    if (options.resetPage) {
      nextParams.delete("page");
    }

    setSearchParams(nextParams);
  };

  const loadAuditLogs = useCallback(async (nextPage, options = {}) => {
    const auditRequestId = auditRequestIdRef.current + 1;
    auditRequestIdRef.current = auditRequestId;

    try {
      if (!options.silent) {
        setAuditLoading(true);
      }

      const auditResult = await getAdminAuditLogs({
        limit: AUDIT_LOG_LIMIT,
        page: nextPage,
      });

      if (auditRequestId !== auditRequestIdRef.current) return;

      setAuditLogs(auditResult.data || []);
      setAuditPagination((current) => auditResult.pagination || current);
    } catch (requestError) {
      if (auditRequestId !== auditRequestIdRef.current) return;

      setAuditLogs([]);
      setAccessDenied(requestError.response?.status === 403);
      setError(
        getApiErrorMessage(
          requestError,
          "Activity logs could not be loaded. Please refresh and try again.",
        ),
      );
    } finally {
      if (auditRequestId === auditRequestIdRef.current) {
        setAuditLoading(false);
      }
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setLoading(true);
      setError("");
      setAccessDenied(false);

      const [statsResult, usersResult] = await Promise.all([
        getAdminStats(),
        getAdminUsers({
          keyword: keyword || undefined,
          limit,
          page,
        }),
      ]);

      if (requestId !== requestIdRef.current) return;

      setStats(statsResult.data || null);
      setUsers(usersResult.data || []);
      setPagination((current) => usersResult.pagination || current);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;
      setUsers([]);
      setAuditLogs([]);
      setStats(null);
      setAccessDenied(requestError.response?.status === 403);
      setError(
        getApiErrorMessage(
          requestError,
          "Admin data could not be loaded. Please refresh and try again.",
        ),
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [keyword, limit, page]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    void loadAuditLogs(auditPage);
  }, [auditPage, loadAuditLogs]);

  const filteredUsers = useMemo(() => {
    if (statusFilter === "all") return users;
    if (statusFilter === "active") return users.filter((user) => user.isActive);
    return users.filter((user) => !user.isActive);
  }, [users, statusFilter]);

  const statCards = useMemo(() => {
    const usersStat = stats?.users || {};
    const documentsStat = stats?.documents || {};
    const foldersStat = stats?.folders || {};
    const storageStat = stats?.storage || {};

    return [
      {
        icon: UsersRound,
        label: "Users",
        value: formatNumber(usersStat.total),
        subLabel: `${formatNumber(usersStat.active)} active · ${formatNumber(usersStat.locked)} locked`,
      },
      {
        icon: FileText,
        label: "Documents",
        value: formatNumber(documentsStat.total),
        subLabel: `PDF ${formatNumber(documentsStat.byType?.pdf)} · DOCX ${formatNumber(documentsStat.byType?.docx)} · TXT ${formatNumber(documentsStat.byType?.txt)}`,
      },
      {
        icon: FolderClosed,
        label: "Folders",
        value: formatNumber(foldersStat.total),
        subLabel: "Total folders in the system",
      },
      {
        icon: HardDrive,
        label: "Storage",
        value: formatBytes(storageStat.totalBytes),
        subLabel: "Total stored data",
      },
    ];
  }, [stats]);

  const auditCurrentPage = auditPage;
  const auditTotalPages = Math.max(auditPagination.totalPages || 1, 1);
  const auditHasPreviousPage = auditCurrentPage > 1;
  const auditHasNextPage = auditCurrentPage < auditTotalPages;
  const activityInitialLoading = auditLoading && auditLogs.length === 0;
  const activityRefreshing = auditLoading && auditLogs.length > 0;
  const activitySlotPlaceholders = Math.max(
    AUDIT_LOG_LIMIT - auditLogs.length,
    0,
  );
  const userCurrentPage = page;
  const userTotalPages = Math.max(pagination.totalPages || 1, 1);
  const usersInitialLoading = loading && users.length === 0;
  const usersRefreshing = loading && users.length > 0;

  const handleAuditPageChange = (nextPage) => {
    const boundedPage = Math.min(Math.max(nextPage, 1), auditTotalPages);
    if (boundedPage === auditCurrentPage) return;
    setAuditPage(boundedPage);
  };

  const handleSearch = () => {
    updateQuery(
      { keyword: keywordInput.trim() || undefined },
      { resetPage: true },
    );
  };

  const handleToggleStatus = async (user) => {
    const nextIsActive = !user.isActive;

    try {
      setUpdatingUserId(user.id);
      await updateAdminUserStatus(user.id, nextIsActive);

      // Optimistic update — patch local state without full reload
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, isActive: nextIsActive } : item,
        ),
      );

      // Update stat counters locally
      setStats((current) => {
        if (!current?.users) return current;
        const delta = nextIsActive ? 1 : -1;
        return {
          ...current,
          users: {
            ...current.users,
            active: (current.users.active || 0) + delta,
            locked: (current.users.locked || 0) - delta,
          },
        };
      });

      // New status actions should appear at the top of the activity timeline.
      if (auditPage === 1) {
        void loadAuditLogs(1, { silent: true });
      } else {
        setAuditPage(1);
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Account status could not be updated. Please refresh and try again.",
        ),
      );
    } finally {
      setUpdatingUserId("");
    }
  };

  const handlePromoteToAdmin = async (user) => {
    if (user.role === "admin") return;

    try {
      setUpdatingRoleUserId(user.id);
      const result = await updateAdminUserRole(user.id, "admin");
      const updatedUser = result.data || {
        ...user,
        isActive: true,
        role: "admin",
      };

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, ...updatedUser } : item,
        ),
      );

      setStats((current) => {
        if (!current?.users || user.isActive) return current;

        return {
          ...current,
          users: {
            ...current.users,
            active: (current.users.active || 0) + 1,
            locked: Math.max((current.users.locked || 0) - 1, 0),
          },
        };
      });

      if (auditPage === 1) {
        void loadAuditLogs(1, { silent: true });
      } else {
        setAuditPage(1);
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "User role could not be updated. Please refresh and try again.",
        ),
      );
    } finally {
      setUpdatingRoleUserId("");
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-20">
      <div className="workspace-aurora pointer-events-none inset-0 z-0" />

      <main className="relative z-10 w-full px-4 pt-2 sm:px-6 lg:px-8">
        <MotionDiv
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-[1480px]"
        >
          {/* ─── Header ─── */}
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <MotionDiv
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-brand-900"
              >
                <ShieldCheck size={14} />
                System administration
              </MotionDiv>
              <h1 className="workspace-hero-title mt-4 text-4xl font-black sm:text-5xl">
                Admin Dashboard
              </h1>
              <p className="mt-2 max-w-xl text-sm font-semibold leading-7 text-slate-500">
                Monitor accounts, manage user status, and track platform
                metrics.
              </p>
            </div>

            <MotionDiv
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="control-surface relative flex w-full items-center !rounded-xl p-1.5 lg:max-w-md"
            >
              <Search className="ml-3 h-5 w-5 text-slate-400" />
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Search name or email..."
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="sks-button-primary !rounded-lg !px-5 !py-2 !text-sm"
              >
                Search
              </button>
            </MotionDiv>
          </header>

          {/* ─── Errors ─── */}
          {accessDenied ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-5 text-sm font-bold text-rose-700">
              You do not have permission to access the admin page.
            </div>
          ) : null}

          {error && !accessDenied ? (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
              <AlertTriangle size={18} />
              {error}
            </div>
          ) : null}

          {/* ─── Stat Cards ─── */}
          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card, index) => (
              <StatCard key={card.label} {...card} index={index} />
            ))}
          </section>

          {/* ─── Two-Column Layout ─── */}
          <div className="mt-8 grid items-stretch gap-5 xl:grid-cols-5">
            {/* ─── Activity Timeline ─── */}
            <section className="sks-card flex h-full min-h-[38rem] flex-col overflow-hidden xl:col-span-2">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-900 text-white shadow-sm shadow-brand-900/20">
                    <History size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-950">
                      Activity
                    </h2>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {formatNumber(auditPagination.total)} recorded actions
                    </p>
                  </div>
                  {activityRefreshing ? (
                    <Loader2 className="ml-auto h-4 w-4 animate-spin text-brand-900" />
                  ) : null}
                </div>
              </div>

              <div className="flex-1 px-5 py-2">
                {activityInitialLoading ? (
                  <div className="flex min-h-[28.75rem] items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-brand-900" />
                    <span className="ml-3 text-sm font-bold text-slate-500">
                      Loading...
                    </span>
                  </div>
                ) : auditLogs.length > 0 ? (
                  <div
                    className={cn(
                      "relative pl-1 transition-opacity duration-200",
                      activityRefreshing && "opacity-70",
                    )}
                  >
                    {auditLogs.map((log, index) => (
                      <TimelineItem key={log.id} log={log} index={index} />
                    ))}
                    {Array.from({ length: activitySlotPlaceholders }).map(
                      (_, index) => (
                        <div
                          key={`activity-placeholder-${index}`}
                          aria-hidden="true"
                          className="min-h-[5.75rem]"
                        />
                      ),
                    )}
                  </div>
                ) : (
                  <div className="flex min-h-[28.75rem] items-center justify-center text-center">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        No actions recorded yet
                      </p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Lock, unlock, or promote a user to create the first
                        entry.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold text-slate-500">
                  Page {auditCurrentPage} / {auditTotalPages}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={auditLoading || !auditHasPreviousPage}
                    onClick={() =>
                      handleAuditPageChange(auditCurrentPage - 1)
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:-translate-y-0.5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous activity page"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={auditLoading || !auditHasNextPage}
                    onClick={() =>
                      handleAuditPageChange(auditCurrentPage + 1)
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:-translate-y-0.5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next activity page"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </section>

            {/* ─── Users ─── */}
            <section className="sks-card flex h-full min-h-[38rem] flex-col overflow-hidden xl:col-span-3">
              <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-900 text-white shadow-sm shadow-brand-900/20">
                    <UsersRound size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-950">
                      Users
                    </h2>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {formatNumber(pagination.total)} accounts
                    </p>
                  </div>
                  {usersRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin text-brand-900" />
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {STATUS_FILTERS.map((item) => {
                    const active = statusFilter === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setStatusFilter(item.value)}
                        className={cn(
                          "rounded-lg px-3.5 py-1.5 text-[11px] font-bold transition-all",
                          active
                            ? "bg-brand-900 text-white shadow-sm shadow-brand-900/20"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700",
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1">
                {usersInitialLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-5 w-5 animate-spin text-brand-900" />
                    <span className="ml-3 text-sm font-bold text-slate-500">
                      Loading...
                    </span>
                  </div>
                ) : filteredUsers.length > 0 ? (
                  <div
                    className={cn(
                      "transition-opacity duration-200",
                      usersRefreshing && "opacity-70",
                    )}
                  >
                    {filteredUsers.map((user, index) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        index={index}
                        updatingUserId={updatingUserId}
                        updatingRoleUserId={updatingRoleUserId}
                        onToggle={(userToToggle) =>
                          void handleToggleStatus(userToToggle)
                        }
                        onPromote={(userToPromote) =>
                          void handlePromoteToAdmin(userToPromote)
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <p className="text-sm font-black text-slate-900">
                      No matching accounts
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Try changing the keyword or status filter.
                    </p>
                  </div>
                )}
              </div>

              {/* pagination */}
              <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold text-slate-500">
                  Page {userCurrentPage} / {userTotalPages}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={loading || userCurrentPage <= 1}
                    onClick={() => updateQuery({ page: userCurrentPage - 1 })}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:-translate-y-0.5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={loading || userCurrentPage >= userTotalPages}
                    onClick={() => updateQuery({ page: userCurrentPage + 1 })}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:-translate-y-0.5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </MotionDiv>
      </main>
    </div>
  );
};

export default Admin;
