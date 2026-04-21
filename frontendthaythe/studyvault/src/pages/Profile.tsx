import React from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Camera,
  CreditCard,
  Lock,
  LogOut,
  Settings,
  Shield,
  User,
} from 'lucide-react';
import { MOCK_USER } from '../constants';

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export default function Profile() {
  const menuItems = [
    { label: 'Thông tin cá nhân', icon: User, active: true },
    { label: 'Bảo mật & Mật khẩu', icon: Lock, active: false },
    { label: 'Thông báo', icon: Bell, active: false },
    { label: 'Gói thành viên', icon: CreditCard, active: false },
    { label: 'Cài đặt hệ thống', icon: Settings, active: false },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass overflow-hidden rounded-[2rem] border border-white/60 p-6 shadow-sm"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg">
                <img src={MOCK_USER.avatar} alt="Avatar" className="h-full w-full object-cover" />
              </div>
              <button className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-white shadow-sm transition-colors hover:bg-brand-600">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-brand-600 shadow-sm">
                <Shield className="h-4 w-4" />
                Profile Center
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-800">
                {MOCK_USER.name}
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500">{MOCK_USER.email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-600">
                  Sinh viên năm 3
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                  Tài khoản Pro
                </span>
              </div>
            </div>
          </div>

          <div className="glass rounded-[1.5rem] border border-white/60 p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-800">Storage usage</p>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              2.4 GB / 5 GB used. Khu vực này sẽ được nối dữ liệu thật trong phase tích hợp backend.
            </p>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '48%' }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-[var(--color-accent)]"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="glass rounded-[2rem] border border-white/60 p-4 shadow-sm"
        >
          <p className="mb-4 px-2 text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">
            Profile Navigation
          </p>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                className={cx(
                  'flex w-full items-center gap-3 rounded-[1.25rem] px-4 py-3 text-left text-sm font-bold transition-all',
                  item.active
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'bg-white/60 text-slate-600 hover:bg-white hover:text-slate-800',
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 border-t border-white/60 pt-5">
            <button className="flex w-full items-center gap-3 rounded-[1.25rem] px-4 py-3 text-left text-sm font-bold text-rose-500 transition-colors hover:bg-rose-50">
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="glass rounded-[2rem] border border-white/60 p-6 shadow-sm"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">
                Personal Information
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-800">
                Hồ sơ người dùng
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                Đây là foundation profile page cho shell mới. Các phase sau sẽ nối profile API,
                password update, notification settings và membership data vào đây.
              </p>
            </div>
            <button className="rounded-full bg-brand-900 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-brand-600">
              Lưu thay đổi
            </button>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {[
              { label: 'Họ và tên', defaultValue: MOCK_USER.name },
              { label: 'Email', defaultValue: MOCK_USER.email },
              { label: 'Số điện thoại', defaultValue: 'Chưa cập nhật' },
              { label: 'Trường đại học', defaultValue: 'Ví dụ: Đại học Bách Khoa' },
            ].map((field) => (
              <label key={field.label} className="block space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
                  {field.label}
                </span>
                <input
                  type="text"
                  defaultValue={field.defaultValue}
                  className="w-full rounded-[1.25rem] border border-white/60 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all focus:border-brand-100 focus:bg-white focus:ring-4 focus:ring-brand-100/60"
                />
              </label>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
