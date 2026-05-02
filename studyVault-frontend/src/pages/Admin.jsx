import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
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
} from "lucide-react";
import {
  getAdminAuditLogs,
  getAdminStats,
  getAdminUsers,
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

const formatAuditAction = (action) => {
  if (action === "USER_LOCKED") return "Locked account";
  if (action === "USER_UNLOCKED") return "Unlocked account";
  return action || "Admin action";
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

const StatCard = ({ icon, label, value, subLabel }) => {
  const StatIcon = icon;

  return (
    <div className="rounded-[1.6rem] border border-white/70 bg-white/66 p-4 shadow-sm backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-900 text-white shadow-lg shadow-brand-900/18">
          <StatIcon size={19} />
        </span>
        <BarChart3 className="h-5 w-5 text-slate-300" />
      </div>
      <p className="mt-5 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      {subLabel ? (
        <p className="mt-1 text-xs font-bold text-slate-500">{subLabel}</p>
      ) : null}
    </div>
  );
};

const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 5,
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
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const requestIdRef = useRef(0);

  const page = readPositiveInt(searchParams.get("page"), 1);
  const limit = readPositiveInt(searchParams.get("limit"), DEFAULT_LIMIT);
  const keyword = (searchParams.get("keyword") || "").trim();
  const status = STATUS_FILTERS.some(
    (item) => item.value === searchParams.get("status"),
  )
    ? searchParams.get("status")
    : "all";

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

  const loadAdminData = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setLoading(true);
      setError("");
      setAccessDenied(false);

      const [statsResult, usersResult, auditResult] = await Promise.all([
        getAdminStats(),
        getAdminUsers({
          keyword: keyword || undefined,
          limit,
          page,
          status,
        }),
        getAdminAuditLogs({
          limit: 5,
          page: 1,
        }),
      ]);

      if (requestId !== requestIdRef.current) return;

      setStats(statsResult.data || null);
      setUsers(usersResult.data || []);
      setPagination((current) => usersResult.pagination || current);
      setAuditLogs(auditResult.data || []);
      setAuditPagination((current) => auditResult.pagination || current);
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
  }, [keyword, limit, page, status]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

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

  const handleSearch = () => {
    updateQuery(
      { keyword: keywordInput.trim() || undefined },
      { resetPage: true },
    );
  };

  const handleToggleStatus = async (user) => {
    try {
      setUpdatingUserId(user.id);
      await updateAdminUserStatus(user.id, !user.isActive);
      await loadAdminData();
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

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-20">
      <div className="workspace-aurora pointer-events-none inset-0 z-0" />

      <main className="relative z-10 w-full px-4 pt-2 sm:px-6 lg:px-8">
        <MotionDiv
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-[1480px] rounded-[2rem] border border-white/70 bg-white/62 p-4 shadow-[0_30px_90px_-62px_rgba(45,44,47,0.55)] backdrop-blur-xl sm:p-5"
        >
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/78 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-900 shadow-sm">
                <ShieldCheck size={14} />
                System administration
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Admin Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                Monitor accounts, user status, and StudyVault data scale.
              </p>
            </div>

            <div className="relative flex w-full items-center rounded-full border border-brand-200 bg-white/95 p-1.5 shadow-[0_24px_72px_-42px_rgba(66,53,48,0.72)] lg:max-w-md">
              <Search className="ml-4 h-5 w-5 text-slate-400" />
              <input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Search name or email..."
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-brand-900/20 transition-all hover:-translate-y-0.5"
              >
                Search
              </button>
            </div>
          </header>

          {accessDenied ? (
            <div className="mt-6 rounded-[1.75rem] border border-rose-100 bg-rose-50 px-5 py-5 text-sm font-bold text-rose-700">
              You do not have permission to access the admin page.
            </div>
          ) : null}

          {error && !accessDenied ? (
            <div className="mt-6 flex items-center gap-3 rounded-[1.75rem] border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
              <AlertTriangle size={18} />
              {error}
            </div>
          ) : null}

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </section>

          <section className="mt-6 overflow-hidden rounded-[1.8rem] border border-white/70 bg-white/68 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 border-b border-white/70 px-4 py-4 sm:px-5">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-950">
                  <History size={20} className="text-brand-900" />
                  Admin audit log
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {formatNumber(auditPagination.total)} recorded actions
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/70">
                <thead>
                  <tr className="text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Target</th>
                    <th className="px-5 py-3">Before</th>
                    <th className="px-5 py-3">After</th>
                    <th className="px-5 py-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/70">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center">
                        <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-500">
                          <Loader2 className="h-5 w-5 animate-spin text-brand-900" />
                          Loading audit logs...
                        </div>
                      </td>
                    </tr>
                  ) : auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="transition-colors hover:bg-white/45"
                      >
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              "rounded-full px-3 py-1.5 text-xs font-black shadow-sm",
                              log.action === "USER_LOCKED"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-emerald-50 text-emerald-700",
                            )}
                          >
                            {formatAuditAction(log.action)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="min-w-[220px]">
                            <p className="truncate text-sm font-black text-slate-950">
                              {log.metadata?.targetName || "User account"}
                            </p>
                            <p className="mt-1 truncate text-xs font-bold text-slate-500">
                              {log.metadata?.targetEmail ||
                                log.targetUserId ||
                                "Unknown target"}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-600">
                          {formatAuditStatus(log.metadata?.previousIsActive)}
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-600">
                          {formatAuditStatus(log.metadata?.nextIsActive)}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-bold text-slate-500">
                          {formatDateTime(log.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center">
                        <p className="text-sm font-black text-slate-900">
                          No admin actions recorded yet
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          Lock or unlock a user account to create the first
                          audit entry.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-[1.8rem] border border-white/70 bg-white/68 shadow-sm backdrop-blur-xl">
            <div className="flex flex-col gap-4 border-b border-white/70 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950">
                  Users
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {formatNumber(pagination.total)} accounts
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((item) => {
                  const active = status === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        updateQuery({ status: item.value }, { resetPage: true })
                      }
                      className={cn(
                        "rounded-full px-4 py-2 text-xs font-black transition-all",
                        active
                          ? "bg-brand-900 text-white shadow-lg shadow-brand-900/18"
                          : "bg-white/78 text-slate-500 hover:bg-white hover:text-brand-900",
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/70">
                <thead>
                  <tr className="text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                    <th className="px-5 py-3">Account</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/70">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center">
                        <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-500">
                          <Loader2 className="h-5 w-5 animate-spin text-brand-900" />
                          Loading data...
                        </div>
                      </td>
                    </tr>
                  ) : users.length > 0 ? (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-white/45"
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-[260px] items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-dark text-sm font-black text-white shadow-lg shadow-dark/12">
                              {(user.name || user.email || "U")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-950">
                                {user.name || "Unnamed"}
                              </p>
                              <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs font-bold text-slate-500">
                                <Mail size={13} />
                                <span className="truncate">{user.email}</span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm">
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              "rounded-full px-3 py-1.5 text-xs font-black shadow-sm",
                              user.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700",
                            )}
                          >
                            {getStatusLabel(user.isActive)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => void handleToggleStatus(user)}
                            disabled={
                              updatingUserId === user.id ||
                              user.role === "admin"
                            }
                            title={
                              user.role === "admin"
                                ? "Admin accounts cannot be locked from this interface"
                                : user.isActive
                                  ? "Lock account"
                                  : "Unlock account"
                            }
                            className={cn(
                              "inline-flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45",
                              user.isActive
                                ? "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white",
                            )}
                          >
                            {updatingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.isActive ? (
                              <LockKeyhole size={17} />
                            ) : (
                              <UnlockKeyhole size={17} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center">
                        <p className="text-sm font-black text-slate-900">
                          No matching accounts
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          Try changing the keyword or status filter.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-slate-500">
                Page {pagination.currentPage} / {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => updateQuery({ page: page - 1 })}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => updateQuery({ page: page + 1 })}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </section>
        </MotionDiv>
      </main>
    </div>
  );
};

export default Admin;
