import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getProfile, postLogout } from "../../service/authAPI.js";
import { logout } from "../../utils/auth.js";

const NAV_ITEMS = [
  { to: "/app/home", label: "Home" },
  { to: "/app", label: "Workspace", end: true },
  { to: "/app/favorites", label: "Favorites" },
];

const WorkspaceShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profileName, setProfileName] = useState("Workspace member");
  const [isScrolled, setIsScrolled] = useState(false);

  const isDocumentViewer = /^\/app\/documents\//.test(location.pathname);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        if (!isActive) return;
        const nextName =
          profile?.name?.trim() ||
          profile?.email?.split("@")[0] ||
          "Workspace member";
        setProfileName(nextName);
      } catch {
        if (isActive) setProfileName("Workspace member");
      }
    };

    void loadProfile();

    const handleScroll = (e) => {
      const scrollTop =
        (e.target && e.target.scrollTop) ||
        window.scrollY ||
        document.documentElement.scrollTop ||
        0;
      setIsScrolled(scrollTop > 20);
    };

    // Use capturing phase (true) to catch ALL scroll events, even from inner containers
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      isActive = false;
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  const profileInitial = useMemo(() => {
    const trimmedName = profileName.trim();
    return trimmedName ? trimmedName[0].toUpperCase() : "S";
  }, [profileName]);

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
    <main
      className={`text-slate-900 relative font-sans ${isDocumentViewer ? "min-h-dvh overflow-x-hidden xl:h-screen xl:overflow-hidden" : "min-h-screen"}`}
    >
      {/* Dynamic Background Container (fixes horizontal scroll without breaking vertical scrollbars) */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-100">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#ffffff_0%,#edf2f7_52%,#fff4f1_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[length:48px_48px]" />
      </div>

      <header
        className={`fixed top-0 left-0 right-0 z-[100] flex w-full items-center transition-all duration-300 ${
          isScrolled
            ? "h-16 border-b border-slate-200/60 bg-white/95 shadow-md backdrop-blur-xl"
            : "h-20 bg-transparent border-transparent shadow-none"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-8 min-w-0">
            {/* ── Brand Logo (Synced) ── */}
            <button
              type="button"
              onClick={() => navigate("/app/home")}
              className="group flex items-center gap-4 transition-all outline-none"
            >
              <div className="relative flex h-9 w-9 items-center justify-center">
                <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl bg-brand-900 shadow-xl transition-all duration-500 hover:scale-105">
                  <span className="font-display text-[14px] font-black italic text-white">
                    S
                  </span>
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-start leading-none pointer-events-none">
                <span className="text-lg font-black tracking-tighter text-slate-900">
                  SKS
                </span>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="relative flex h-1 w-1">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-1 w-1 rounded-full bg-emerald-500"></span>
                  </span>
                  <span className="text-[7px] font-black uppercase tracking-[0.2em] text-brand-900">
                    AI Active
                  </span>
                </div>
              </div>
            </button>

            <nav className="ml-4 hidden items-center gap-8 lg:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative py-1 text-[13px] font-black tracking-wide transition-all ${
                      isActive
                        ? "text-slate-900"
                        : "text-slate-400 hover:text-slate-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && (
                        <div className="absolute -bottom-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-brand-900/10 blur-md" />
                      )}
                      {isActive && (
                        <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-900" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Profile & Logout (Universal Style) */}
            <div
              className={`flex items-center gap-3 ${isDocumentViewer ? "ml-2" : "ml-6"}`}
            >
              <div className="group relative flex items-center gap-3 cursor-pointer">
                <div className="relative flex h-9 w-9 items-center justify-center">
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-brand-900 text-[13px] font-black text-white shadow-lg ring-1 ring-white/20 transition-transform group-hover:scale-105">
                    {profileInitial}
                  </div>
                </div>
                <div className="hidden flex-col items-start leading-tight lg:flex">
                  <span className="text-[12px] font-black text-slate-900">
                    {profileName.split(" ")[0]}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-600 shadow-[0_0_8px_rgba(143,59,50,0.35)]" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-brand-900">
                      Premium Pro
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-5 w-px bg-slate-200/50" />

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="group flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500 active:scale-95"
                title="Logout Account"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="h-5 w-5 transition-transform group-hover:rotate-12"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {isDocumentViewer ? (
        <section className="relative min-h-dvh w-full overflow-x-hidden pt-16 xl:h-screen xl:overflow-hidden">
          <Outlet />
        </section>
      ) : (
        <section className="relative mx-auto w-full max-w-[1440px] px-6 pt-20 lg:px-10 lg:pt-24">
          <Outlet />
        </section>
      )}
    </main>
  );
};

export default WorkspaceShell;
