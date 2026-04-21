import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Library, Mail, Lock, User, ArrowRight, Github, Chrome, BookOpen, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import studyIllustration from '../assets/study_illustration.png';

export default function Auth() {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Left Column: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-10 lg:p-16 bg-white relative z-10 shadow-2xl">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
            <div className="bg-gradient-to-tr from-brand-600 to-accent text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
              <Library size={24} />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">StudyVault</span>
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {view === 'login' && 'Chào mừng trở lại!'}
                  {view === 'register' && 'Tạo tài khoản mới'}
                  {view === 'forgot' && 'Khôi phục mật khẩu'}
                </h2>
                <p className="text-slate-500 mt-3 text-base">
                  {view === 'login' && 'Đăng nhập để quản lý tài nguyên học tập của bạn.'}
                  {view === 'register' && 'Bắt đầu không gian lưu trữ và sắp xếp tri thức.'}
                  {view === 'forgot' && 'Nhập email của bạn, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.'}
                </p>
              </div>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                {view === 'register' && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <User size={20} />
                    </div>
                    <input
                      type="text"
                      placeholder="Họ và tên"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all placeholder:font-medium placeholder:text-slate-400"
                    />
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    placeholder="Email của bạn"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all placeholder:font-medium placeholder:text-slate-400"
                  />
                </div>

                {view !== 'forgot' && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock size={20} />
                    </div>
                    <input
                      type="password"
                      placeholder="Mật khẩu"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all placeholder:font-medium placeholder:text-slate-400"
                    />
                  </div>
                )}

                {view === 'login' && (
                  <div className="flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => setView('forgot')}
                      className="text-sm font-bold text-brand-600 hover:text-brand-800 transition-colors"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                )}

                {view === 'forgot' && (
                  <div className="flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => setView('login')}
                      className="text-sm font-bold text-brand-600 hover:text-brand-800 transition-colors"
                    >
                      Quay lại Đăng nhập
                    </button>
                  </div>
                )}

                <button className="w-full py-4 mt-2 bg-brand-900 hover:bg-brand-600 text-white rounded-2xl font-extrabold text-base shadow-lg shadow-brand-500/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group">
                  {view === 'login' && 'Đăng nhập'}
                  {view === 'register' && 'Đăng ký ngay'}
                  {view === 'forgot' && 'Gửi liên kết khôi phục'}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              {view !== 'forgot' && (
                <>
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                      <span className="bg-white px-4 text-slate-400">Hoặc tiếp tục với</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm hover:shadow-md">
                      <Chrome size={18} className="text-red-500" /> Google
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm hover:shadow-md">
                      <Github size={18} className="text-slate-900" /> GitHub
                    </button>
                  </div>
                </>
              )}

              <p className="text-center mt-10 text-sm font-medium text-slate-500">
                {view === 'login' ? 'Chưa có tài khoản?' : view === 'register' ? 'Đã có tài khoản?' : ''}
                {view !== 'forgot' && (
                  <button
                    onClick={() => setView(view === 'login' ? 'register' : 'login')}
                    className="ml-2 font-bold text-brand-600 hover:text-brand-800 underline transition-colors"
                  >
                    {view === 'login' ? 'Đăng ký miễn phí' : 'Đăng nhập ngay'}
                  </button>
                )}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Premium Visual Panel (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-8"
        style={{
          background: 'linear-gradient(135deg, #faf9f6 0%, #f4d6d0 30%, #faebe8 60%, #faf9f6 100%)',
        }}
      >
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-mesh opacity-50"></div>
        
        {/* Decorative floating orbs */}
        <motion.div
          className="absolute top-[10%] right-[15%] w-40 h-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(184,115,51,0.25) 0%, transparent 70%)' }}
          animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[15%] left-[10%] w-56 h-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(226,114,91,0.2) 0%, transparent 70%)' }}
          animate={{ y: [0, 15, 0], x: [0, -10, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[50%] left-[50%] w-32 h-32 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(184,115,51,0.15) 0%, transparent 70%)' }}
          animate={{ y: [0, -25, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        
        {/* Main content */}
        <div className="relative z-10 max-w-lg w-full flex flex-col items-center">
          {/* Hero illustration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-5"
          >
            <div className="relative">
              <motion.img
                src={studyIllustration}
                alt="StudyVault - Nền tảng học thuật"
                className="w-72 h-72 object-contain rounded-3xl"
                style={{ mixBlendMode: 'multiply' }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Glow effect behind image */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-500/10 to-accent/10 rounded-3xl blur-2xl scale-90"></div>
            </div>
          </motion.div>

          {/* Title and description */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-5"
          >
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
              Nền tảng Học Thuật <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-accent">Thế Hệ Mới</span>
            </h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
              Quản lý, tổ chức và truy cập tài liệu học tập mọi lúc, mọi nơi.
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-4 w-full">
            {[
              { icon: BookOpen, title: 'Quản lý tài liệu', desc: 'Phân loại theo môn học', color: 'from-brand-500 to-brand-600', delay: 0.4 },
              { icon: Search, title: 'Tìm kiếm nhanh', desc: 'Dễ dàng tra cứu', color: 'from-accent to-yellow-600', delay: 0.5 },
              { icon: ShieldCheck, title: 'Truy cập an toàn', desc: 'Đăng nhập bảo mật', color: 'from-emerald-500 to-teal-600', delay: 0.6 },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: feature.delay }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group cursor-default"
              >
                <div className="glass p-4 rounded-2xl shadow-lg border border-white/50 text-center h-full hover:shadow-xl transition-shadow duration-300">
                  <div className={cn(
                    "w-11 h-11 rounded-xl mx-auto mb-2.5 flex items-center justify-center text-white shadow-md bg-gradient-to-br",
                    feature.color
                  )}>
                    <feature.icon size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-0.5">{feature.title}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-tight">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Corner decorative patterns */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="150" cy="50" r="80" stroke="#b87333" strokeWidth="0.5" />
            <circle cx="150" cy="50" r="60" stroke="#e2725b" strokeWidth="0.5" />
            <circle cx="150" cy="50" r="40" stroke="#b87333" strokeWidth="0.5" />
            <circle cx="150" cy="50" r="20" stroke="#e2725b" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-48 h-48 opacity-10">
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
}
