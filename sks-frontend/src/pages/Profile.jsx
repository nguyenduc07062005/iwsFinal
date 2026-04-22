import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Bell,
  ChevronRight,
  CreditCard,
  HardDrive,
  Key,
  LogOut,
  Settings,
  Shield,
  User,
  Zap,
} from 'lucide-react';
import { getApiErrorMessage, getProfile } from '../service/authAPI.js';
import { logout } from '../utils/auth.js';

const QUICK_LINKS = [
  { label: 'Personal information', icon: User, active: true },
  { label: 'Login and security', icon: Key, active: false },
  { label: 'Notifications', icon: Bell, active: false },
  { label: 'Membership plan', icon: CreditCard, active: false },
  { label: 'System settings', icon: Settings, active: false },
];

const MotionDiv = motion.div;

const RECENT_SESSIONS = [
  { device: 'Chrome on Windows', location: 'Ho Chi Minh City', time: 'Active now', active: true },
  { device: 'Chrome on Android', location: 'Thu Duc', time: '2 hours ago', active: false },
  { device: 'Edge on Windows', location: 'Home network', time: '3 days ago', active: false },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await getProfile();
        if (!active) return;
        setProfile(response);
        setError('');
      } catch (requestError) {
        if (!active) return;
        setError(getApiErrorMessage(requestError, 'Unable to load profile information.'));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const displayName = useMemo(
    () => profile?.name?.trim() || profile?.email?.split('@')[0] || 'StudyVault Member',
    [profile],
  );

  const avatarUrl = useMemo(() => {
    const seed = encodeURIComponent(displayName);
    return `https://ui-avatars.com/api/?name=${seed}&background=f4d6d0&color=8c4238&bold=true&size=256`;
  }, [displayName]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-full bg-[var(--color-base-50)] px-4 py-8 sm:px-6 lg:px-8">
      <MotionDiv
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-6xl space-y-8"
      >
        <MotionDiv variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-brand-600 to-[var(--color-accent)] opacity-10" />
          <div className="relative flex flex-col sm:flex-row items-center gap-6 mt-8 sm:mt-0">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100">
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full border-4 border-white bg-emerald-500 shadow-sm" />
            </div>

            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-extrabold text-slate-900">{displayName}</h1>
              <p className="text-slate-500 font-medium">{profile?.email || 'No email attached'}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                <span className="bg-brand-50 text-brand-600 text-xs font-bold px-3 py-1 rounded-full border border-brand-100">
                  {profile?.role || 'user'}
                </span>
                <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100">
                  Workspace active
                </span>
              </div>
            </div>

            <div className="sm:ml-auto">
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="rounded-2xl bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-600"
              >
                Go to workspace
              </button>
            </div>
          </div>
        </MotionDiv>

        {loading ? (
          <MotionDiv variants={itemVariants} className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
          </MotionDiv>
        ) : error ? (
          <MotionDiv variants={itemVariants} className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-sm font-bold text-rose-600">{error}</p>
          </MotionDiv>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <MotionDiv variants={itemVariants} className="lg:col-span-1 space-y-2">
              {QUICK_LINKS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={[
                    'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all',
                    item.active
                      ? 'bg-brand-900 text-white shadow-lg shadow-brand-900/20'
                      : 'text-slate-500 hover:bg-white hover:text-brand-600',
                  ].join(' ')}
                >
                  <span className="inline-flex items-center gap-3">
                    <item.icon size={18} />
                    {item.label}
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
              <hr className="my-4 border-slate-200" />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </MotionDiv>

            <div className="lg:col-span-3 space-y-8">
              <MotionDiv variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Profile details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Full name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      readOnly
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile?.email || ''}
                      readOnly
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value={profile?.role || 'user'}
                      readOnly
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Session status
                    </label>
                    <input
                      type="text"
                      value={profile?.isActive ? 'Active' : 'Inactive'}
                      readOnly
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                    />
                  </div>
                </div>
              </MotionDiv>

              <div className="grid gap-6 sm:grid-cols-2">
                <MotionDiv variants={itemVariants} className="group overflow-hidden rounded-[2.5rem] border border-white/50 bg-gradient-to-br from-brand-900 to-brand-700 p-8 shadow-xl relative text-white">
                  <div className="absolute bottom-0 left-0 h-32 w-32 bg-brand-500/30 rounded-full blur-3xl" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                        <HardDrive className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-100">
                        Storage
                      </span>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-brand-100">
                      Used space
                    </p>
                    <h4 className="mt-2 text-4xl font-black tracking-tighter">
                      1.2 <span className="text-xl text-brand-100">GB</span>
                    </h4>
                    <div className="mt-6 flex h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[35%] rounded-full bg-gradient-to-r from-white to-brand-100" />
                    </div>
                    <p className="mt-3 text-[11px] font-bold text-brand-100">3.8 GB available</p>
                  </div>
                </MotionDiv>

                <MotionDiv variants={itemVariants} className="group overflow-hidden rounded-[2.5rem] border border-white/50 bg-white/70 p-8 shadow-sm backdrop-blur-xl relative">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <Zap className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        AI usage
                      </span>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-brand-600">
                      Summary requests
                    </p>
                    <h4 className="mt-2 text-4xl font-black tracking-tighter text-slate-900">342</h4>
                    <div className="mt-6 flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500">
                        Stable for defense demos
                      </span>
                      <Shield className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </MotionDiv>
              </div>

              <MotionDiv variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Recent sessions</h3>
                  <button className="text-brand-600 text-sm font-bold hover:underline">
                    Manage all
                  </button>
                </div>
                <div className="space-y-4">
                  {RECENT_SESSIONS.map((session) => (
                    <div
                      key={`${session.device}-${session.time}`}
                      className="flex items-center justify-between rounded-[1.5rem] border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-brand-100 hover:bg-white"
                    >
                      <div>
                        <h4 className="text-[13px] font-bold text-slate-900">{session.device}</h4>
                        <p className="text-[11px] font-medium text-slate-400">{session.location}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        {session.active ? (
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                            Current
                          </span>
                        ) : null}
                        <span className="mt-1 text-[11px] font-bold text-slate-400">{session.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </MotionDiv>
            </div>
          </div>
        )}
      </MotionDiv>
    </div>
  );
};

export default Profile;
