import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Library, Menu, Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils.js';
import { getProfile } from '../../service/authAPI.js';
import { logout } from '../../utils/auth.js';

const NAV_LINKS = [
  { name: 'Không gian', path: '/app', end: true },
  { name: 'Yêu thích', path: '/app/favorites' },
  { name: 'Hồ sơ', path: '/profile' },
];

const MotionDiv = motion.div;

const isActivePath = (pathname, path, end) =>
  end ? pathname === path : pathname.startsWith(path);

const ShellHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const response = await getProfile();
        if (active) {
          setProfile(response);
        }
      } catch {
        if (active) {
          setProfile(null);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const avatarUrl = useMemo(() => {
    const seed = encodeURIComponent(profile?.name || profile?.email || 'StudyVault');
    return `https://ui-avatars.com/api/?name=${seed}&background=f4d6d0&color=8c4238&bold=true`;
  }, [profile]);

  const displayName = useMemo(
    () => profile?.name?.trim() || profile?.email?.split('@')[0] || 'StudyVault User',
    [profile],
  );

  const handleUploadClick = () => {
    setIsMobileMenuOpen(false);
    navigate('/app?openUpload=true');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav
      className={cn(
        'sticky top-4 z-50 px-4 sm:px-6 lg:px-8',
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-7xl items-center justify-between rounded-full bg-white/80 backdrop-blur-xl px-8 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 transition-all duration-500',
          isScrolled && 'bg-white/95 py-2 shadow-lg shadow-brand-500/5 border-brand-100/20',
        )}
      >
        <Link to="/app" className="flex items-center gap-3 cursor-pointer group">
          <div className="bg-gradient-to-tr from-brand-600 to-[var(--color-accent)] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
            <Library size={20} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800">
            StudyVault
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-semibold text-sm text-slate-600">
          {NAV_LINKS.map((link) => {
            const active = isActivePath(location.pathname, link.path, link.end);

            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'relative py-1 transition-colors hover:text-brand-600',
                  active && 'text-brand-600',
                )}
              >
                {link.name}
                {active ? (
                  <MotionDiv
                    layoutId="shell-nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand-600"
                  />
                ) : null}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button
            type="button"
            onClick={handleUploadClick}
            className="flex items-center gap-2 rounded-full bg-brand-900 px-5 py-2 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-xl"
          >
            <Plus size={16} />
            Tải lên
          </button>

          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-full bg-white/80 pl-2 pr-4 py-2 shadow-sm transition-all hover:shadow-md"
          >
            <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-100">
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 max-w-[160px]">
              <p className="truncate text-sm font-bold text-slate-800">{displayName}</p>
              <p className="truncate text-[11px] font-medium text-slate-500">
                {profile?.email || 'workspace member'}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-bold text-slate-600 transition-colors hover:text-brand-600"
          >
            Đăng xuất
          </button>
        </div>

        <button
          type="button"
          className="md:hidden text-slate-600"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <AnimatePresence>
          {isMobileMenuOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute left-4 right-4 top-full mt-4 glass rounded-3xl p-6 md:hidden shadow-xl"
            >
              <div className="flex flex-col gap-4">
                {NAV_LINKS.map((link) => {
                  const active = isActivePath(location.pathname, link.path, link.end);

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'text-lg font-bold transition-colors',
                        active ? 'text-brand-600' : 'text-slate-700 hover:text-brand-600',
                      )}
                    >
                      {link.name}
                    </Link>
                  );
                })}

                <hr className="border-slate-100" />

                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="bg-brand-900 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Tải lên tài liệu
                </button>

                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center py-3 border border-slate-200 rounded-2xl font-bold text-slate-600"
                >
                  Xem hồ sơ
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-center py-3 rounded-2xl font-bold text-rose-600 bg-rose-50"
                >
                  Đăng xuất
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default ShellHeader;
