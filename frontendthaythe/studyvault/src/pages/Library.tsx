import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, FileSpreadsheet, Presentation, MoreVertical, Download, Eye, Heart, FolderClosed } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { MOCK_DOCUMENTS } from '../constants';
import { FileType } from '../types';

export default function Library({ title = "Thư viện tài liệu", defaultFilter = "all" }) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>(['d2']);

  const getFileIcon = (type: FileType) => {
    switch (type) {
      case 'pdf': return <FileText className="text-brand-500" />;
      case 'word': return <FileText className="text-blue-500" />;
      case 'excel': return <FileSpreadsheet className="text-green-500" />;
      case 'powerpoint': return <Presentation className="text-accent" />;
      case 'image': return <ImageIcon className="text-orange-500" />;
      default: return <FileText className="text-slate-500" />;
    }
  };

  const getFileBg = (type: FileType) => {
    switch (type) {
      case 'pdf': return 'bg-brand-50 text-brand-600';
      case 'word': return 'bg-blue-50 text-blue-600';
      case 'excel': return 'bg-green-50 text-green-600';
      case 'powerpoint': return 'bg-orange-50 text-orange-600';
      case 'image': return 'bg-yellow-50 text-yellow-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  return (
    <div className="relative min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-slate-500 mt-2">Quản lý, tìm kiếm và sắp xếp tài nguyên học tập của bạn.</p>
        </div>
        
        <button className="bg-brand-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-brand-600 transition-colors hidden md:block">
          Upload Tài liệu
        </button>
      </div>

      {/* Advanced Filters & Search */}
      <div className="glass p-4 rounded-2xl shadow-sm mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between border border-white/60">
        <div className="flex flex-1 w-full gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên tài liệu..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <button className="w-11 h-11 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-brand-600 hover:border-brand-200 transition-colors shrink-0">
            <Filter size={18} />
          </button>
        </div>

        <div className="flex w-full lg:w-auto gap-3 items-center overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none min-w-[140px] appearance-none cursor-pointer">
            <option>Môn học: Tất cả</option>
            <option>Cơ sở dữ liệu</option>
            <option>Thiết kế Web</option>
          </select>
          
          <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none min-w-[140px] appearance-none cursor-pointer">
            <option>Loại File: Tất cả</option>
            <option>PDF Document</option>
            <option>Word Formats</option>
          </select>

          <div className="flex bg-slate-100 p-1 rounded-xl ml-auto lg:ml-4 shrink-0">
            <button 
              className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", viewMode === 'table' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500")}
              onClick={() => setViewMode('table')}
            >
              List
            </button>
            <button 
              className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", viewMode === 'grid' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500")}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-brand-600 group">
                    <div className="flex items-center gap-2">Tên Tài Liệu <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider hidden md:table-cell">Môn Học</th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider hidden lg:table-cell cursor-pointer hover:text-brand-600 group">
                    <div className="flex items-center gap-2">Ngày Tải Lên <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-brand-600 group">
                    <div className="flex items-center gap-2">Kích Thước <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold text-slate-400 uppercase tracking-wider">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_DOCUMENTS.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 border-l-[3px] border-transparent hover:border-brand-500 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", getFileBg(doc.type))}>
                          {getFileIcon(doc.type)}
                        </div>
                        <div>
                          <div className="text-sm">{doc.name}</div>
                          <div className="flex gap-1 mt-1 md:hidden">
                            <span className="text-[10px] text-slate-400 font-medium">{doc.subject}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 font-medium">
                        <FolderClosed size={12} className="text-slate-400" />
                        {doc.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 hidden lg:table-cell font-medium">{doc.updatedAt}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{doc.size}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => toggleFavorite(doc.id)} className={cn("p-2 rounded-lg hover:bg-slate-200 transition-colors", favorites.includes(doc.id) ? "text-accent" : "text-slate-400")}>
                          <Heart size={16} fill={favorites.includes(doc.id) ? "currentColor" : "none"} />
                        </button>
                        <button className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"><Eye size={16} /></button>
                        <button className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors"><Download size={16} /></button>
                        <button className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors"><MoreVertical size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
           {MOCK_DOCUMENTS.map((doc) => (
             <motion.div 
              key={doc.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative"
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

                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4", getFileBg(doc.type))}>
                   {getFileIcon(doc.type)}
                </div>

                <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">{doc.name}</h4>
                <p className="text-xs text-slate-400 font-medium mb-4">{doc.size} • Last edited {doc.updatedAt}</p>
                
                <div className="flex gap-1 flex-wrap mb-4">
                  <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-md font-bold uppercase truncate max-w-full">
                    {doc.subject}
                  </span>
                </div>

                <div className="border-t border-slate-50 pt-4 flex gap-2 w-full">
                   <button className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-brand-50 hover:text-brand-600 transition-colors">Xem</button>
                   <button className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">Tải về</button>
                </div>
             </motion.div>
           ))}
        </div>
      )}

      {/* Pagination UI */}
      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 hidden sm:block">
          Hiển thị 1 đến {MOCK_DOCUMENTS.length} trong số 240 tài liệu
        </p>
        <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
          <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={18} /></button>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-brand-900 text-white font-bold shadow-md">1</button>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 font-bold">2</button>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 font-bold">3</button>
          <span className="w-9 h-9 flex items-center justify-center text-slate-400">...</span>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 font-bold">24</button>
          <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50"><ChevronRight size={18} /></button>
        </div>
      </div>
    </div>
  );
}
