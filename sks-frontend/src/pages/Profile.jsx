import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import {
  changePassword,
  getApiErrorMessage,
  getProfile,
  updateProfile,
} from '../service/authAPI.js';
import { logout } from '../utils/auth.js';

const MotionDiv = motion.div;

const inputClass =
  'w-full rounded-2xl border border-white/75 bg-white/82 px-4 py-3 text-sm font-bold text-slate-800 outline-none shadow-sm transition-all placeholder:text-slate-400 focus:border-[#d86b54] focus:bg-white focus:ring-4 focus:ring-[#d86b54]/14';

const readOnlyClass =
  'flex min-h-[48px] items-center gap-3 rounded-2xl border border-white/75 bg-white/58 px-4 text-sm font-bold text-slate-600 shadow-sm';

const Feedback = ({ feedback }) => {
  if (!feedback) return null;

  return (
    <div
      className={[
        'rounded-2xl px-4 py-3 text-sm font-bold',
        feedback.tone === 'error'
          ? 'border border-rose-200 bg-rose-50 text-rose-700'
          : 'border border-emerald-200 bg-emerald-50 text-emerald-700',
      ].join(' ')}
    >
      {feedback.message}
    </div>
  );
};

const InfoPill = ({ icon, label, value }) => {
  const IconComponent = icon;

  return (
    <div className="rounded-[1.35rem] border border-white/70 bg-white/66 p-4 shadow-sm backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#9b3f36] shadow-sm">
          <IconComponent size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 truncate text-sm font-black text-slate-900">
            {value || 'Chưa có'}
          </p>
        </div>
      </div>
    </div>
  );
};

const getRoleLabel = (role) => {
  if (role === 'admin') return 'Quản trị viên';
  return 'Người dùng';
};

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState({ name: '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [passwordOpen, setPasswordOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await getProfile();
        if (!active) return;
        setProfile(response);
        setProfileForm({ name: response?.name || '' });
        setError('');
      } catch (requestError) {
        if (!active) return;
        setError(getApiErrorMessage(requestError, 'Không tải được thông tin tài khoản.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const displayName = useMemo(
    () => profile?.name?.trim() || profile?.email?.split('@')[0] || 'StudyVault User',
    [profile],
  );

  const avatarUrl = useMemo(() => {
    const seed = encodeURIComponent(displayName);
    return `https://ui-avatars.com/api/?name=${seed}&background=9b3f36&color=ffffff&bold=true&size=256`;
  }, [displayName]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    const name = profileForm.name.trim();

    if (!name) {
      setProfileFeedback({ tone: 'error', message: 'Tên hiển thị không được để trống.' });
      return;
    }

    try {
      setProfileSaving(true);
      setProfileFeedback(null);
      const result = await updateProfile({ name });
      const nextProfile = result.user || result;
      setProfile(nextProfile);
      setProfileForm({ name: nextProfile.name || '' });
      setProfileFeedback({ tone: 'success', message: 'Đã lưu tên hiển thị.' });
    } catch (requestError) {
      setProfileFeedback({
        tone: 'error',
        message: getApiErrorMessage(requestError, 'Không cập nhật được hồ sơ.'),
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const closePasswordPanel = () => {
    setPasswordOpen(false);
    setPasswordFeedback(null);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordFeedback({ tone: 'error', message: 'Vui lòng nhập đầy đủ mật khẩu.' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordFeedback({ tone: 'error', message: 'Mật khẩu mới cần tối thiểu 6 ký tự.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ tone: 'error', message: 'Xác nhận mật khẩu chưa khớp.' });
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordFeedback(null);
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordFeedback({ tone: 'success', message: 'Đã cập nhật mật khẩu.' });
    } catch (requestError) {
      setPasswordFeedback({
        tone: 'error',
        message: getApiErrorMessage(requestError, 'Không cập nhật được mật khẩu.'),
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-20">
      <div className="workspace-aurora pointer-events-none inset-0 z-0" />

      <main className="relative z-10 mx-auto w-full max-w-[1120px] px-4 pt-3 sm:px-6 lg:px-8">
        <MotionDiv
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/62 shadow-[0_30px_90px_-62px_rgba(45,44,47,0.55)] backdrop-blur-xl"
        >
          <div className="relative overflow-hidden border-b border-white/70 p-5 sm:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(216,107,84,0.24),transparent_34%),radial-gradient(circle_at_88%_4%,rgba(80,72,190,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.76),rgba(255,255,255,0.36))]" />
            <div className="relative flex flex-col gap-6">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/app')}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/82 text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:text-[#9b3f36]"
                  aria-label="Quay lại workspace"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full bg-[#9b3f36] px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-[#9b3f36]/20 transition-all hover:-translate-y-0.5"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-20 w-20 shrink-0 rounded-[1.6rem] border-4 border-white object-cover shadow-xl"
                  />
                  <div className="min-w-0">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/78 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#9b3f36] shadow-sm">
                      <ShieldCheck size={13} />
                      Hồ sơ cá nhân
                    </div>
                    <h1 className="truncate text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                      {displayName}
                    </h1>
                    <p className="mt-1 flex min-w-0 items-center gap-2 truncate text-sm font-semibold text-slate-500">
                      <Mail size={15} />
                      <span className="truncate">{profile?.email || 'Đang tải email...'}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPasswordOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1f2a44] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#1f2a44]/18 transition-all hover:-translate-y-0.5"
                >
                  <KeyRound size={16} />
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {loading ? (
              <div className="flex min-h-[280px] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/70 border-t-[#9b3f36]" />
              </div>
            ) : error ? (
              <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
                {error}
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
                <section className="rounded-[1.75rem] border border-white/70 bg-white/56 p-5 shadow-sm backdrop-blur-xl">
                  <div className="mb-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d86b54]">
                      Thông tin hiển thị
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                      Cập nhật tên trong StudyVault
                    </h2>
                    <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
                      Email dùng để đăng nhập và không thể chỉnh sửa tại đây.
                    </p>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <label className="block space-y-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        Tên hiển thị
                      </span>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(event) => setProfileForm({ name: event.target.value })}
                        className={inputClass}
                        placeholder="Tên của bạn"
                      />
                    </label>

                    <div className="space-y-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        Email đăng nhập
                      </span>
                      <div className={readOnlyClass}>
                        <Mail size={17} className="text-slate-400" />
                        <span className="min-w-0 truncate">{profile?.email}</span>
                      </div>
                    </div>

                    <Feedback feedback={profileFeedback} />

                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="inline-flex items-center gap-2 rounded-full bg-[#9b3f36] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#9b3f36]/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save size={16} />
                      {profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </form>
                </section>

                <aside className="space-y-4">
                  <InfoPill icon={UserRound} label="Vai trò" value={getRoleLabel(profile?.role)} />
                  <InfoPill
                    icon={CheckCircle2}
                    label="Trạng thái"
                    value={profile?.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                  />

                  <div className="rounded-[1.75rem] border border-white/70 bg-white/54 p-5 shadow-sm backdrop-blur-xl">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1f2a44] text-white shadow-lg shadow-[#1f2a44]/12">
                        <KeyRound size={18} />
                      </span>
                      <div>
                        <h3 className="text-base font-black text-slate-950">Bảo mật</h3>
                        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                          Cập nhật mật khẩu khi cần tăng bảo mật tài khoản.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPasswordOpen(true)}
                      className="mt-4 w-full rounded-full bg-white px-4 py-3 text-sm font-extrabold text-[#1f2a44] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#1f2a44] hover:text-white"
                    >
                      Đổi mật khẩu
                    </button>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </MotionDiv>
      </main>

      <AnimatePresence>
        {passwordOpen && (
          <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/36 p-3 backdrop-blur-md sm:items-center">
            <MotionDiv
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              className="w-full max-w-[500px] rounded-[2rem] border border-white/70 bg-white/88 p-5 shadow-2xl backdrop-blur-2xl sm:p-6"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1f2a44] text-white shadow-lg shadow-[#1f2a44]/16">
                    <KeyRound size={19} />
                  </span>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#d86b54]">
                      Bảo mật
                    </p>
                    <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                      Đổi mật khẩu
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closePasswordPanel}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition-all hover:text-rose-500"
                  aria-label="Đóng form đổi mật khẩu"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <label className="block space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Mật khẩu hiện tại
                  </span>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))}
                    className={inputClass}
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Mật khẩu mới
                  </span>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))}
                    className={inputClass}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Xác nhận mật khẩu
                  </span>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))}
                    className={inputClass}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </label>

                <Feedback feedback={passwordFeedback} />

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="mt-2 w-full rounded-full bg-[#1f2a44] px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-[#1f2a44]/16 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {passwordSaving ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </button>
              </form>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
