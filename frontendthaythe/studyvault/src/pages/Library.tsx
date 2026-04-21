import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderClosed,
  Heart,
  Image as ImageIcon,
  MoreVertical,
  Presentation,
  Search,
  Sparkles,
} from 'lucide-react';
import { MOCK_DOCUMENTS } from '../constants';
import { FileType } from '../types';

type LibraryProps = {
  title?: string;
  defaultFilter?: 'all' | 'favorites';
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export default function Library({
  title = 'Workspace',
  defaultFilter = 'all',
}: LibraryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [favorites, setFavorites] = useState<string[]>(['d2']);

  const documents = useMemo(() => {
    if (defaultFilter === 'favorites') {
      return MOCK_DOCUMENTS.filter((document) => favorites.includes(document.id));
    }

    return MOCK_DOCUMENTS;
  }, [defaultFilter, favorites]);

  const getFileIcon = (type: FileType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-brand-500" />;
      case 'word':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'excel':
        return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
      case 'powerpoint':
        return <Presentation className="h-5 w-5 text-orange-500" />;
      case 'image':
        return <ImageIcon className="h-5 w-5 text-amber-500" />;
      default:
        return <FileText className="h-5 w-5 text-slate-500" />;
    }
  };

  const getFileTone = (type: FileType) => {
    switch (type) {
      case 'pdf':
        return 'bg-brand-50 text-brand-600';
      case 'word':
        return 'bg-blue-50 text-blue-600';
      case 'excel':
        return 'bg-emerald-50 text-emerald-600';
      case 'powerpoint':
        return 'bg-orange-50 text-orange-600';
      case 'image':
        return 'bg-amber-50 text-amber-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((previous) =>
      previous.includes(id)
        ? previous.filter((favoriteId) => favoriteId !== id)
        : [...previous, id],
    );
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass rounded-[2rem] border border-white/60 p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-brand-600 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Workspace Library
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Đây là shell cho workspace chính. Ở các phase sau, khu vực này sẽ được nối API
              thật để hỗ trợ CRUD, sorting, filtering, pagination và favorite actions.
            </p>
          </div>

          <button className="inline-flex items-center justify-center rounded-full bg-brand-900 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-brand-600">
            Upload tài liệu
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="glass rounded-[2rem] border border-white/60 p-4 shadow-sm sm:p-5"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên tài liệu..."
                className="w-full rounded-[1.25rem] border border-white/60 bg-white/80 px-4 py-3 pl-11 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand-100 focus:bg-white focus:ring-4 focus:ring-brand-100/60"
              />
            </div>
            <button className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-white text-slate-500 shadow-sm transition-colors hover:text-brand-600">
              <Filter className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select className="rounded-[1rem] border border-white/60 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none">
              <option>Sort by: Updated</option>
              <option>Sort by: Name</option>
              <option>Sort by: Size</option>
            </select>
            <button className="inline-flex items-center gap-2 rounded-[1rem] bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:text-brand-600">
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </button>
            <div className="inline-flex rounded-full bg-white p-1 shadow-sm">
              <button
                onClick={() => setViewMode('table')}
                className={cx(
                  'rounded-full px-4 py-2 text-sm font-bold transition-all',
                  viewMode === 'table' ? 'bg-brand-900 text-white' : 'text-slate-500',
                )}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cx(
                  'rounded-full px-4 py-2 text-sm font-bold transition-all',
                  viewMode === 'grid' ? 'bg-brand-900 text-white' : 'text-slate-500',
                )}
              >
                Grid
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {viewMode === 'table' ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/85 shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Document
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Subject
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Updated
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Size
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {documents.map((document) => {
                  const isFavorite = favorites.includes(document.id);

                  return (
                    <tr key={document.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={cx(
                              'flex h-11 w-11 items-center justify-center rounded-[1rem] shadow-sm',
                              getFileTone(document.type),
                            )}
                          >
                            {getFileIcon(document.type)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{document.name}</p>
                            <p className="mt-1 text-xs font-medium text-slate-400">
                              Foundation state ready for API binding
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                          <FolderClosed className="h-3.5 w-3.5 text-slate-400" />
                          {document.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">{document.updatedAt}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">{document.size}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleFavorite(document.id)}
                            className={cx(
                              'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                              isFavorite
                                ? 'bg-amber-50 text-accent'
                                : 'bg-slate-50 text-slate-400 hover:text-accent',
                            )}
                          >
                            <Heart className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
                          </button>
                          <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors hover:text-brand-600">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors hover:text-slate-700">
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors hover:text-slate-700">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {documents.map((document) => {
            const isFavorite = favorites.includes(document.id);

            return (
              <div
                key={document.id}
                className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/85 p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <button
                  onClick={() => toggleFavorite(document.id)}
                  className={cx(
                    'absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-colors',
                    isFavorite ? 'bg-amber-50 text-accent' : 'bg-white text-slate-300 hover:text-accent',
                  )}
                >
                  <Heart className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} />
                </button>

                <div
                  className={cx(
                    'mb-4 flex h-14 w-14 items-center justify-center rounded-[1.25rem] shadow-sm',
                    getFileTone(document.type),
                  )}
                >
                  {getFileIcon(document.type)}
                </div>

                <h3 className="text-lg font-bold tracking-tight text-slate-800">{document.name}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">{document.subject}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  {document.size} • {document.updatedAt}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button className="rounded-full bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:text-brand-600">
                    Xem
                  </button>
                  <button className="rounded-full bg-brand-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600">
                    Tải về
                  </button>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      <div className="glass flex flex-col gap-4 rounded-[2rem] border border-white/60 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="text-sm font-medium text-slate-500">
          Hiển thị {documents.length} tài liệu trong shell Phase 1. Pagination thật sẽ gắn ở phase sau.
        </p>
        <div className="flex items-center gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-colors hover:text-slate-700">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="flex h-10 min-w-10 items-center justify-center rounded-full bg-brand-900 px-3 text-sm font-extrabold text-white shadow-sm">
            1
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition-colors hover:text-slate-800">
            2
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-colors hover:text-slate-700">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
