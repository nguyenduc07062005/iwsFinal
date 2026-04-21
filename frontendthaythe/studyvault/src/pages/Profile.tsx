import React from 'react';
import { motion } from 'motion/react';
import { User, Mail, Shield, Settings, LogOut, Camera, Bell, Lock, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';
import { MOCK_USER } from '../constants';

export default function Profile() {
  const menuItems = [
    { label: 'Thông tin cá nhân', icon: User, active: true },
    { label: 'Bảo mật & Mật khẩu', icon: Lock, active: false },
    { label: 'Thông báo', icon: Bell, active: false },
    { label: 'Gói thành viên', icon: CreditCard, active: false },
    { label: 'Cài đặt hệ thống', icon: Settings, active: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Menu */}
          <div className="lg:col-span-1 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                  item.active 
                    ? "bg-brand-900 text-white shadow-lg shadow-brand-900/20" 
                    : "text-slate-500 hover:bg-white hover:text-brand-600"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
            <hr className="my-4 border-slate-200" />
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all">
              <LogOut size={18} />
              Đăng xuất
            </button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Profile Header */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-brand-600 to-accent opacity-10"></div>
              <div className="relative flex flex-col sm:flex-row items-center gap-6 mt-8 sm:mt-0">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100">
                    <img src={MOCK_USER.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <button className="absolute bottom-0 right-0 w-10 h-10 bg-brand-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-brand-600 transition-all">
                    <Camera size={18} />
                  </button>
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-3xl font-extrabold text-slate-900">{MOCK_USER.name}</h1>
                  <p className="text-slate-500 font-medium">{MOCK_USER.email}</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                    <span className="bg-brand-50 text-brand-600 text-xs font-bold px-3 py-1 rounded-full border border-brand-100">Sinh viên năm 3</span>
                    <span className="bg-green-50 text-green-600 text-xs font-bold px-3 py-1 rounded-full border border-green-100">Tài khoản Pro</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Thông tin chi tiết</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Họ và tên</label>
                  <input
                    type="text"
                    defaultValue={MOCK_USER.name}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
                  <input
                    type="email"
                    defaultValue={MOCK_USER.email}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="Chưa cập nhật"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Trường đại học</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đại học Bách Khoa"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">Hủy bỏ</button>
                <button className="px-8 py-3 bg-brand-900 text-white rounded-2xl text-sm font-bold hover:bg-brand-600 shadow-lg shadow-brand-900/20 transition-all transform hover:-translate-y-1">Lưu thay đổi</button>
              </div>
            </div>

            {/* Storage Info */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Dung lượng lưu trữ</h3>
                <button className="text-brand-600 text-sm font-bold hover:underline">Nâng cấp gói</button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-500">Đã sử dụng 2.4 GB trong tổng số 5 GB</span>
                  <span className="text-brand-600">48%</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '48%' }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-brand-500 to-accent"
                  ></motion.div>
                </div>
                <p className="text-xs text-slate-400">Bạn còn 2.6 GB dung lượng trống. Hãy nâng cấp lên gói Pro để có dung lượng không giới hạn.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
