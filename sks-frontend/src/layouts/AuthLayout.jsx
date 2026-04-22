import { motion, AnimatePresence } from 'motion/react';
import { Library, BookOpen, Search, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils.js';
import studyIllustration from '../assets/study_illustration.png';
import { Outlet } from 'react-router-dom';

const MotionDiv = motion.div;
const MotionImg = motion.img;

const AuthLayout = () => {
  const location = useLocation();

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      {/* Left Column: Form */}
      <div 
        className="scrollbar-hide relative z-10 flex w-full items-center justify-center overflow-y-auto bg-white p-4 py-8 shadow-2xl sm:p-10 lg:w-1/2 lg:p-16"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="group mb-8 inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-accent text-2xl text-white shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
              <Library size={24} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-brand-600">
              StudyVault
            </span>
          </Link>

          <AnimatePresence mode="wait">
            <MotionDiv
              key={location.pathname}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </MotionDiv>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Premium Visual Panel (Hidden on mobile) */}
      <div
        className="relative hidden flex-col items-center justify-center overflow-hidden p-8 lg:flex lg:w-1/2"
        style={{
          background:
            'linear-gradient(135deg, #faf9f6 0%, #f4d6d0 30%, #faebe8 60%, #faf9f6 100%)',
        }}
      >
        {/* Animated gradient overlay */}
        <div className="bg-mesh absolute inset-0 opacity-50"></div>

        {/* Decorative floating orbs */}
        <MotionDiv
          className="absolute right-[15%] top-[10%] h-40 w-40 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(184,115,51,0.25) 0%, transparent 70%)',
          }}
          animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <MotionDiv
          className="absolute bottom-[15%] left-[10%] h-56 w-56 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(226,114,91,0.2) 0%, transparent 70%)',
          }}
          animate={{ y: [0, 15, 0], x: [0, -10, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <MotionDiv
          className="absolute left-[50%] top-[50%] h-32 w-32 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(184,115,51,0.15) 0%, transparent 70%)',
          }}
          animate={{ y: [0, -25, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        {/* Main content */}
        <div className="relative z-10 flex w-full max-w-lg flex-col items-center">
          {/* Hero illustration */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-5"
          >
            <div className="relative">
              <MotionImg
                src={studyIllustration}
                alt="StudyVault - Nền tảng học thuật"
                className="h-72 w-72 rounded-3xl object-contain"
                style={{ mixBlendMode: 'multiply' }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Glow effect behind image */}
              <div className="absolute inset-0 -z-10 scale-90 rounded-3xl bg-gradient-to-b from-brand-500/10 to-accent/10 blur-2xl"></div>
            </div>
          </MotionDiv>

          {/* Title and description */}
          <MotionDiv
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-5 text-center"
          >
            <h3 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900">
              Nền tảng Học Thuật{' '}
              <span className="bg-gradient-to-r from-brand-500 to-accent bg-clip-text text-transparent">
                Thế Hệ Mới
              </span>
            </h3>
            <p className="mx-auto max-w-sm text-sm font-medium leading-relaxed text-slate-500">
              Quản lý, tổ chức và truy cập tài liệu học tập mọi lúc, mọi nơi.
            </p>
          </MotionDiv>

          {/* Feature cards */}
          <div className="grid w-full grid-cols-3 gap-4">
            {[
              {
                icon: BookOpen,
                title: 'Quản lý tài liệu',
                desc: 'Phân loại theo môn học',
                color: 'from-brand-500 to-brand-600',
                delay: 0.4,
              },
              {
                icon: Search,
                title: 'Tìm kiếm nhanh',
                desc: 'Dễ dàng tra cứu',
                color: 'from-accent to-yellow-600',
                delay: 0.5,
              },
              {
                icon: ShieldCheck,
                title: 'Truy cập an toàn',
                desc: 'Đăng nhập bảo mật',
                color: 'from-emerald-500 to-teal-600',
                delay: 0.6,
              },
            ].map((feature, i) => (
              <MotionDiv
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: feature.delay }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group cursor-default"
              >
                <div className="glass h-full rounded-2xl border border-white/50 p-4 text-center shadow-lg transition-shadow duration-300 hover:shadow-xl">
                  <div
                    className={cn(
                      'mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md',
                      feature.color,
                    )}
                  >
                    <feature.icon size={22} />
                  </div>
                  <h4 className="mb-0.5 text-sm font-bold text-slate-800">
                    {feature.title}
                  </h4>
                  <p className="text-xs font-medium leading-tight text-slate-500">
                    {feature.desc}
                  </p>
                </div>
              </MotionDiv>
            ))}
          </div>
        </div>

        {/* Corner decorative patterns */}
        <div className="absolute right-0 top-0 h-64 w-64 opacity-10">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="150" cy="50" r="80" stroke="#b87333" strokeWidth="0.5" />
            <circle cx="150" cy="50" r="60" stroke="#e2725b" strokeWidth="0.5" />
            <circle cx="150" cy="50" r="40" stroke="#b87333" strokeWidth="0.5" />
            <circle cx="150" cy="50" r="20" stroke="#e2725b" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 h-48 w-48 opacity-10">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="40" height="40" rx="8" stroke="#b87333" strokeWidth="0.5" />
            <rect x="60" y="60" width="40" height="40" rx="8" stroke="#e2725b" strokeWidth="0.5" />
            <rect x="110" y="110" width="40" height="40" rx="8" stroke="#b87333" strokeWidth="0.5" />
            <rect x="35" y="35" width="40" height="40" rx="8" stroke="#e2725b" strokeWidth="0.3" />
            <rect x="85" y="85" width="40" height="40" rx="8" stroke="#b87333" strokeWidth="0.3" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
