import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, CloudUpload, PieChart, BookOpen, FolderClosed, Ellipsis, Heart, Download, Eye, Trash, ChevronDown, ArrowRight, FileText, Image as ImageIcon, FileSpreadsheet, Presentation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { MOCK_DOCUMENTS, MOCK_FOLDERS } from '../constants';
import { FileType } from '../types';

export default function Home() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(['d2']);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const getFileIcon = (type: FileType) => {
    switch (type) {
      case 'pdf': return <FileText className="text-red-500" />;
      case 'word': return <FileText className="text-blue-500" />;
      case 'excel': return <FileSpreadsheet className="text-green-500" />;
      case 'powerpoint': return <Presentation className="text-purple-500" />;
      case 'image': return <ImageIcon className="text-orange-500" />;
      default: return <FileText className="text-slate-500" />;
    }
  };

  const getFileBg = (type: FileType) => {
    switch (type) {
      case 'pdf': return 'bg-red-50';
      case 'word': return 'bg-blue-50';
      case 'excel': return 'bg-green-50';
      case 'powerpoint': return 'bg-purple-50';
      case 'image': return 'bg-orange-50';
      default: return 'bg-slate-50';
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* NỀN MÀU TRỪU TƯỢNG */}
      <div
        className="absolute top-0 left-0 w-full h-[500px] bg-mesh -z-10"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0% 100%)' }}
      ></div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* HERO SECTION */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16 animate-float"
        >
          <div className="inline-block px-4 py-1.5 rounded-full glass border-white text-xs font-bold text-brand-600 mb-4 tracking-wide uppercase">
            ✨ Nền tảng quản lý tài nguyên học tập thế hệ mới
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-brand-900 mb-6 leading-tight">
            Tri thức của bạn, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent">
              Gọn gàng & Nghệ thuật.
            </span>
          </h1>

          {/* Super Search Bar */}
          <div className="glass p-2 rounded-full shadow-2xl flex items-center mt-8 relative max-w-2xl mx-auto">
            <div className="pl-4 pr-2 text-slate-400">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Tìm tài liệu, môn học, bài tập lớn..."
              className="w-full bg-transparent border-none outline-none px-3 py-3 text-slate-700 font-medium placeholder-slate-400"
            />
            <div className="border-l border-slate-200 px-3 hidden sm:block">
              <select className="bg-transparent border-none outline-none text-sm font-medium text-slate-500 cursor-pointer">
                <option>Mọi thể loại</option>
                <option>PDF</option>
                <option>Word</option>
              </select>
            </div>
            <button className="bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-full px-6 py-3 font-bold shadow-md hover:opacity-90 transition-opacity">
              Tìm kiếm
            </button>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link 
              to="/auth"
              className="px-8 py-3 bg-brand-900 text-white rounded-full font-bold shadow-lg hover:bg-brand-600 transition-all transform hover:-translate-y-1"
            >
              Bắt đầu ngay
            </Link>
            <button className="px-8 py-3 bg-white text-slate-600 rounded-full font-bold shadow-sm border border-slate-200 hover:bg-slate-50 transition-all">
              Tìm hiểu thêm
            </button>
          </div>
        </motion.div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {/* Khối 1: Tải lên nhanh */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="md:col-span-2 lg:col-span-2 glass rounded-3xl p-6 border-dashed border-2 hover:border-brand-500 transition-colors cursor-pointer group flex flex-col justify-center items-center text-center relative overflow-hidden"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <div className="absolute inset-0 bg-brand-50 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl text-brand-500 mb-4 group-hover:scale-110 transition-transform duration-300">
              <CloudUpload size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">Kéo thả tài liệu vào đây</h3>
            <p className="text-sm text-slate-500">Hoặc click để duyệt file. Hỗ trợ tự động gắn Tag AI.</p>
          </motion.div>

          {/* Khối 2: Thống kê */}
          <div className="glass rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/10 rounded-full blur-xl"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-xl shadow-sm text-accent">
                <PieChart size={24} />
              </div>
              <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-md">Pro</span>
            </div>
            <h4 className="text-3xl font-extrabold text-slate-800 mb-1">
              2.4<span className="text-lg text-slate-500 font-medium"> GB</span>
            </h4>
            <p className="text-sm font-medium text-slate-500 mb-4">Dung lượng đã dùng</p>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-brand-500 w-[45%]"></div>
              <div className="h-full bg-accent w-[15%]"></div>
            </div>
            <div className="flex gap-3 mt-2 text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-brand-500"></span> Tài liệu
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-accent"></span> Hình ảnh
              </span>
            </div>
          </div>

          {/* Khối 3: Môn học Focus */}
          <div className="glass rounded-3xl p-6 bg-gradient-to-br from-brand-900 to-brand-700 text-white relative group cursor-pointer overflow-hidden">
            <div className="absolute right-0 bottom-0 text-brand-500/30 text-8xl transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform">
              <BookOpen size={80} />
            </div>
            <h4 className="text-sm font-semibold text-brand-200 mb-6 uppercase tracking-wider">Môn học hiện tại</h4>
            <h3 className="text-2xl font-bold leading-tight mb-2">Phân tích Thiết kế HTTT</h3>
            <p className="text-brand-200 text-sm mb-6">12 Tài liệu mới tuần này</p>
            <div className="flex items-center text-sm font-bold">
              Khám phá ngay
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </div>

        {/* DỮ LIỆU HIỂN THỊ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột trái: Thư mục & Tags */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Bộ sưu tập</h3>
                <button className="text-slate-400 hover:text-brand-600">
                  <Ellipsis size={20} />
                </button>
              </div>
              <div className="space-y-3">
                {MOCK_FOLDERS.map((folder) => (
                  <motion.div
                    key={folder.id}
                    whileHover={{ x: 5 }}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors",
                      folder.color === 'blue' ? "bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white" :
                      folder.color === 'green' ? "bg-green-50 text-green-500 group-hover:bg-green-500 group-hover:text-white" :
                      "bg-purple-50 text-purple-500 group-hover:bg-purple-500 group-hover:text-white"
                    )}>
                      <FolderClosed size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{folder.name}</h4>
                      <p className="text-xs text-slate-500">{folder.fileCount} Files • {folder.updatedAt}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Thẻ phân loại</h3>
              <div className="flex flex-wrap gap-2">
                {['#Quan_trong', '#Bai_tap_lon', '#Slide_Giang_vien', '#De_thi_cu'].map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm cursor-pointer hover:border-brand-500 hover:text-brand-600 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Cột phải: Tài liệu */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-xl font-extrabold text-slate-800">Tài liệu hoạt động</h3>
              <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm border border-slate-100">
                <button className="px-3 py-1 bg-brand-50 text-brand-600 rounded-md text-sm font-bold">Gần đây</button>
                <button className="px-3 py-1 text-slate-500 hover:bg-slate-50 rounded-md text-sm font-bold">Tất cả</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {MOCK_DOCUMENTS.slice(0, 2).map((doc) => (
                <motion.div
                  key={doc.id}
                  whileHover={{ y: -5 }}
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group relative"
                >
                  <button
                    onClick={() => toggleFavorite(doc.id)}
                    className={cn(
                      "absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full glass transition-colors",
                      favorites.includes(doc.id) ? "text-accent" : "text-slate-300 hover:text-accent"
                    )}
                  >
                    <Heart size={16} fill={favorites.includes(doc.id) ? "currentColor" : "none"} />
                  </button>

                  <div className="flex items-start gap-4 mb-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform",
                      getFileBg(doc.type)
                    )}>
                      {getFileIcon(doc.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-base mb-1 line-clamp-1 group-hover:text-brand-600 transition-colors">
                        {doc.name}
                      </h4>
                      <p className="text-xs font-medium text-slate-400">{doc.size} • {doc.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                    <div className="flex gap-1">
                      {doc.tags.map(tag => (
                        <span key={tag} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-md font-bold uppercase">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-2 shadow-sm">
              {MOCK_DOCUMENTS.slice(2).map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                      getFileBg(doc.type)
                    )}>
                      {getFileIcon(doc.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{doc.name}</h4>
                      <p className="text-xs text-slate-400">{doc.updatedAt}</p>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">{doc.subject}</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-brand-600"><Eye size={18} /></button>
                    <button className="p-2 text-slate-400 hover:text-red-500"><Trash size={18} /></button>
                  </div>
                </div>
              ))}
              <button className="w-full mt-2 py-3 text-sm font-bold text-brand-600 hover:bg-brand-50 rounded-xl transition-colors flex items-center justify-center gap-1">
                Xem tất cả tài liệu <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL TẢI LÊN */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex justify-center items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl p-8 relative"
            >
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-red-100 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Thêm tài liệu mới</h3>
              <p className="text-slate-500 text-sm mb-6">Tải lên và tổ chức không gian học tập của bạn.</p>

              <div className="border-2 border-dashed border-brand-200 bg-brand-50/50 rounded-3xl p-10 text-center hover:border-brand-500 hover:bg-brand-50 transition-all cursor-pointer mb-6 group">
                <div className="h-20 w-20 mx-auto bg-white rounded-2xl shadow-sm flex items-center justify-center text-brand-500 mb-4 group-hover:-translate-y-2 transition-transform duration-300">
                  <CloudUpload size={40} />
                </div>
                <h4 className="font-extrabold text-slate-800 text-lg">Kéo thả file vào đây</h4>
                <p className="text-sm text-slate-500 mt-1 mb-4">hoặc <span className="text-brand-600 font-bold underline">Mở trình duyệt file</span></p>
                <div className="flex justify-center gap-4 text-2xl text-slate-300">
                  <FileText className="hover:text-red-400 transition-colors" />
                  <FileSpreadsheet className="hover:text-green-400 transition-colors" />
                  <Presentation className="hover:text-purple-400 transition-colors" />
                  <ImageIcon className="hover:text-blue-400 transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Môn học</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all">
                    <option>📚 Chọn môn học...</option>
                    <option>Thiết kế Web</option>
                    <option>Trí tuệ nhân tạo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gắn thẻ (Tags)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Quan trọng, BTL..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <button className="w-full py-4 bg-brand-900 hover:bg-brand-600 text-white rounded-xl font-extrabold text-base shadow-lg shadow-brand-500/30 transition-all transform hover:-translate-y-1">
                Tải lên hệ thống <ArrowRight size={20} className="inline ml-2" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ size }: { size: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
}
