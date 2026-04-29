import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Library, Star, UserRound, Plus, LogOut, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils.js';
import { getProfile } from '../../service/authAPI.js';
import { logout } from '../../utils/auth.js';

const NAV_LINKS = [
  { name: 'Library', path: '/app', icon: Library, end: true },
  { name: 'Favorites', path: '/app/favorites', icon: Star },
  { name: 'Profile', path: '/profile', icon: UserRound },
];

const MotionDiv = motion.div;

const isActivePath = (pathname, path, end) =>
  end ? pathname === path : pathname.startsWith(path);

const ShellHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    return () => { active = false; };
  }, []);

  const avatarUrl = useMemo(() => {
    const seed = encodeURIComponent(profile?.name || profile?.email || 'StudyVault');
    return `https://ui-avatars.com/api/?name=${seed}&background=6366f1&color=ffffff&bold=true`;
  }, [profile]);

  const navLinks = useMemo(() => {
    if (profile?.role !== 'admin') {
      return NAV_LINKS;
    }

    return [
      ...NAV_LINKS,
      { name: 'Admin', path: '/admin', icon: ShieldCheck },
    ];
  }, [profile]);

  const handleUploadClick = () => navigate('/app?openUpload=true');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 w-full px-4 pt-4 sm:px-6 lg:px-8">
      <div
        className={cn(
          "mx-auto flex w-full items-center justify-between rounded-2xl border border-white/40 bg-white/70 px-4 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 sm:px-6",
          isScrolled && "border-brand-100/20 bg-white/90 shadow-lg shadow-brand-500/5 py-2"
        )}
      >
        {/* Left Section: Logo & Nav */}
        <div className="flex items-center gap-6 sm:gap-10">
          <Link to="/app" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-md transition-transform group-hover:scale-105 active:scale-95">
              <Library size={18} strokeWidth={2.5} />
            </div>
            <span className="hidden lg:block text-lg font-bold tracking-tight text-slate-800">
              StudyVault
            </span>
          </Link>

          {/* Icon-centric Navigation */}
          <div className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const active = isActivePath(location.pathname, link.path, link.end);
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-label={link.name}
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 group/nav",
                    active 
                      ? "bg-brand-50 text-brand-600 shadow-sm shadow-brand-500/10" 
                      : "text-slate-500 hover:bg-slate-100/50 hover:text-slate-800"
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  
                  {/* Tooltip */}
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 scale-0 rounded-md bg-slate-800 px-2 py-1 text-[10px] font-medium text-white transition-all group-hover/nav:scale-100">
                    {link.name}
                  </span>

                  {active && (
                    <MotionDiv
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl border-2 border-brand-200/50"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={handleUploadClick}
            aria-label="Upload document"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-900 text-white shadow-lg shadow-brand-900/10 transition-all hover:bg-brand-600 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
          </button>

          <div className="h-6 w-px bg-slate-200/60" />

          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              aria-label="User profile"
              className="group flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-slate-100/50"
            >
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="h-8 w-8 rounded-lg border border-white object-cover shadow-sm transition-transform group-hover:scale-105"
                />
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
              </div>
            </Link>

            <button
              onClick={handleLogout}
              aria-label="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500 active:scale-95"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Nav - keeping it for better mobile UX but keeping top bar as well */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 flex h-16 items-center justify-around rounded-2xl border border-white/40 bg-white/80 px-2 shadow-2xl backdrop-blur-xl md:hidden">
        {navLinks.map((link) => {
          const active = isActivePath(location.pathname, link.path, link.end);
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-4 transition-all",
                active ? "text-brand-600" : "text-slate-400"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{link.name}</span>
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
