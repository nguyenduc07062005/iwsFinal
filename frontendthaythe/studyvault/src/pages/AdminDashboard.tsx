import React from 'react';
import { motion } from 'motion/react';
import { Users, FileText, BookOpen, HardDrive, ArrowUpRight, ArrowDownRight, MoreHorizontal, Search, Filter } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const stats = [
    { label: 'Tổng người dùng', value: '1,284', change: '+12%', isUp: true, icon: Users, color: 'blue' },
    { label: 'Tổng tài liệu', value: '15,402', change: '+5.4%', isUp: true, icon: FileText, color: 'purple' },
    { label: 'Môn học', value: '42', change: '-2%', isUp: false, icon: BookOpen, color: 'green' },
    { label: 'Dung lượng hệ thống', value: '840 GB', change: '+18%', isUp: true, icon: HardDrive, color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Quản trị hệ thống</h1>
            <p className="text-slate-500 mt-1">Theo dõi và quản lý toàn bộ hoạt động của StudyVault.</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
              <Search size={16} /> Tìm kiếm
            </button>
            <button className="bg-brand-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-600 transition-all shadow-md">
              Xuất báo cáo
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "p-3 rounded-2xl",
                  stat.color === 'blue' ? "bg-blue-50 text-blue-500" :
                  stat.color === 'purple' ? "bg-purple-50 text-purple-500" :
                  stat.color === 'green' ? "bg-green-50 text-green-500" :
                  "bg-orange-50 text-orange-500"
                )}>
                  <stat.icon size={24} />
                </div>
                <div className={cn(
                  "flex items-center text-xs font-bold px-2 py-1 rounded-lg",
                  stat.isUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                )}>
                  {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</h3>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Users Table */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Người dùng mới nhất</h3>
              <button className="text-brand-600 text-sm font-bold hover:underline">Xem tất cả</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Người dùng</th>
                    <th className="px-6 py-4">Vai trò</th>
                    <th className="px-6 py-4">Ngày tham gia</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <tr key={item} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                            <img src={`https://ui-avatars.com/api/?name=User+${item}&background=random`} alt="" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">User {item}</p>
                            <p className="text-xs text-slate-400">user${item}@studyvault.com</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">User</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">15/04/2024</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Hoạt động
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-brand-600 transition-colors">
                          <MoreHorizontal size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Hoạt động gần đây</h3>
            <div className="space-y-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="flex gap-4 relative">
                  {item !== 6 && <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-100"></div>}
                  <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 z-10">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-800">
                      <span className="font-bold">Nguyễn Văn A</span> đã tải lên tài liệu mới <span className="text-brand-600 font-bold">Báo cáo thực tập.pdf</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">10 phút trước</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-colors">
              Xem toàn bộ nhật ký
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
