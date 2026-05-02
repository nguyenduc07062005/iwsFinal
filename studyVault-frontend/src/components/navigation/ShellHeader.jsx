import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Library,
  LogOut,
  Plus,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils.js";
import { getProfile, postLogout } from "../../service/authAPI.js";
import { logout } from "../../utils/auth.js";

const NAV_LINKS = [
  { name: "Workspace", path: "/app", icon: Library, end: true },
  { name: "Favorites", path: "/app/favorites", icon: Star },
];

const MotionDiv = motion.div;

const isActivePath = (pathname, path, end) =>
  end ? pathname === path : pathname.startsWith(path);

const ShellHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const accountMenuRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const response = await getProfile();
        if (active) setProfile(response);
      } catch {
        if (active) setProfile(null);
      }
    };
    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleProfileUpdated = (event) => {
      if (event.detail) {
        setProfile(event.detail);
      }
    };

    window.addEventListener("studyvault:profile-updated", handleProfileUpdated);

    return () => {
      window.removeEventListener(
        "studyvault:profile-updated",
        handleProfileUpdated,
      );
    };
  }, []);

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (accountMenuRef.current?.contains(event.target)) return;
      setIsAccountMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  const profileInitials = useMemo(() => {
    const source =
      profile?.name?.trim() || profile?.email?.split("@")[0] || "SV";
    const parts = source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    return (
      parts
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "SV"
    );
  }, [profile]);

  const navLinks = useMemo(() => {
    if (profile?.role !== "admin") {
      return NAV_LINKS;
    }

    return [...NAV_LINKS, { name: "Admin", path: "/admin", icon: ShieldCheck }];
  }, [profile]);

  const profileName =
    profile?.name?.trim() || profile?.email?.split("@")[0] || "StudyVault user";
  const profileEmail = profile?.email || "Signed in";
  const showQuickUpload =
    location.pathname.startsWith("/app") && location.pathname !== "/app";

  const handleUploadClick = () => navigate("/app?openUpload=true");

  const handleLogout = async () => {
    try {
      await postLogout();
    } catch {
      // Local logout still keeps the UI responsive if the session was already gone.
    }

    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 w-full px-3 pt-3 sm:px-6 lg:px-8">
      <div
        className={cn(
          "relative mx-auto flex h-16 w-full max-w-[1760px] items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all duration-300 sm:px-5",
          isScrolled &&
          "border-brand-100/30 bg-white/95 shadow-lg shadow-brand-500/5",
        )}
      >
        <Link
          to="/app"
          className="group relative z-10 flex shrink-0 items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-900 to-brand-500 text-white shadow-md transition-transform group-hover:scale-105 active:scale-95">
            <Library size={18} strokeWidth={2.5} />
          </div>
          <span className="hidden text-lg font-bold tracking-tight text-slate-800 sm:block">
            StudyVault
          </span>
        </Link>

        <div className="pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = isActivePath(
              location.pathname,
              link.path,
              link.end,
            );
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "relative flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all duration-200",
                  active
                    ? "bg-brand-50 text-brand-700 shadow-sm shadow-brand-500/10"
                    : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-900",
                )}
              >
                {active && (
                  <MotionDiv
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl border border-brand-200/70"
                    transition={{
                      type: "spring",
                      bounce: 0.2,
                      duration: 0.5,
                      stiffness: 300,
                      damping: 28,
                    }}
                  />
                )}
                <Icon
                  className="relative z-10"
                  size={18}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className="relative z-10 whitespace-nowrap">
                  {link.name}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="relative z-10 ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
          {showQuickUpload && (
            <>
              <motion.button
                type="button"
                onClick={handleUploadClick}
                aria-label="Upload document"
                whileHover={{ y: -2, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-900 px-3 text-white shadow-lg shadow-brand-900/10 transition-colors hover:bg-brand-600 sm:px-4"
              >
                <Plus size={20} strokeWidth={3} />
                <span className="hidden text-sm font-bold lg:inline">
                  Upload
                </span>
              </motion.button>

              <div className="hidden h-6 w-px bg-slate-200/70 lg:block" />
            </>
          )}

          <div ref={accountMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen((open) => !open)}
              aria-expanded={isAccountMenuOpen}
              aria-label="Open account menu"
              className="group flex h-10 items-center gap-2 rounded-xl px-1.5 transition-colors hover:bg-slate-100/70 sm:px-2"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white bg-gradient-to-tr from-brand-900 to-brand-500 text-xs font-black text-white shadow-sm transition-transform group-hover:scale-105">
                {profileInitials}
              </span>
              <div className="hidden min-w-0 flex-col items-start leading-tight xl:flex">
                <span className="max-w-28 truncate text-sm font-bold text-slate-800">
                  {profileName}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {profile?.role === "admin" ? "Admin" : "Account"}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={cn(
                  "hidden text-slate-400 transition-transform sm:block",
                  isAccountMenuOpen && "rotate-180",
                )}
              />
            </button>

            <AnimatePresence>
              {isAccountMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -6, scale: 0.98, filter: 'blur(4px)' }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10"
                >
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {profileName}
                    </p>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                      {profileEmail}
                    </p>
                  </div>

                  <div className="p-1.5">
                    <Link
                      to="/profile"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <UserRound size={17} />
                      Profile
                    </Link>

                    {profile?.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setIsAccountMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <ShieldCheck size={17} />
                        Admin dashboard
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        void handleLogout();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      <LogOut size={17} />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            aria-label="Sign out"
            className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500 active:scale-95 sm:flex md:hidden"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <nav className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-4 right-4 z-50 flex h-16 items-center justify-around rounded-2xl border border-white/60 bg-white/90 px-2 shadow-2xl backdrop-blur-xl md:hidden">
        {navLinks.map((link) => {
          const active = isActivePath(location.pathname, link.path, link.end);
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 transition-all",
                active ? "text-brand-600" : "text-slate-400",
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="max-w-full truncate text-[10px] font-bold uppercase tracking-wide">
                {link.name}
              </span>
              {active && (
                <MotionDiv
                  layoutId="mobile-nav-pill"
                  className="absolute -top-1 h-1 w-6 rounded-full bg-brand-600"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </nav>
  );
};

export default ShellHeader;
