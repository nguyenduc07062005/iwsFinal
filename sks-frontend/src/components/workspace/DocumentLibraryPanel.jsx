/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import {
  ArrowRightLeft,
  ArrowUpDown,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  FolderClosed,
  Heart,
  Image as ImageIcon,
  MoreVertical,
  PencilLine,
  Presentation,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppEmptyState, AppPagination, AppSkeleton } from '@/components/ui/index.js';
import { cn } from '@/lib/utils.js';

const MotionDiv = motion.div;

export const getFileExtension = (doc) => {
  const source = doc?.title || doc?.fileRef || '';
  const parts = source.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : 'file';
};

export const getFileIcon = (type) => {
  switch (type) {
    case 'pdf':
      return <FileText className="text-brand-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="text-blue-500" />;
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className="text-green-500" />;
    case 'ppt':
    case 'pptx':
      return <Presentation className="text-accent" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return <ImageIcon className="text-orange-500" />;
    default:
      return <FileText className="text-slate-500" />;
  }
};

export const getFileBg = (type) => {
  switch (type) {
    case 'pdf':
      return 'bg-brand-50 text-brand-600';
    case 'doc':
    case 'docx':
      return 'bg-blue-50 text-blue-600';
    case 'xls':
    case 'xlsx':
      return 'bg-green-50 text-green-600';
    case 'ppt':
    case 'pptx':
      return 'bg-orange-50 text-orange-600';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return 'bg-yellow-50 text-yellow-600';
    default:
      return 'bg-slate-50 text-slate-600';
  }
};

export const formatDateLabel = (value) => {
  if (!value) return 'Chưa có ngày';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return 'Chưa có ngày';
  }
};

export const getFilePresentation = (doc) => {
  const extension = getFileExtension(doc);
  const accent = getFileBg(extension);
  const labelMap = {
    pdf: 'PDF',
    doc: 'DOC',
    docx: 'DOCX',
    xls: 'XLS',
    xlsx: 'XLSX',
    ppt: 'PPT',
    pptx: 'PPTX',
    txt: 'TXT',
    png: 'IMG',
    jpg: 'IMG',
    jpeg: 'IMG',
    gif: 'IMG',
  };

  return {
    extension,
    accent,
    label: labelMap[extension] || extension.toUpperCase().slice(0, 4) || 'FILE',
  };
};

const DropdownActions = ({
  doc,
  onDeleteDocument,
  onDownloadDocument,
  onMoveDocument,
  onOpenDocument,
  onRenameDocument,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative" onMouseLeave={() => setIsOpen(false)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-900"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-slate-100 bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenDocument(doc.id);
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
          >
            <span className="flex items-center gap-3">
              <Eye size={16} />
              Xem chi tiết
            </span>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onDownloadDocument(doc.id, doc.title);
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
          >
            <span className="flex items-center gap-3">
              <Download size={16} />
              Tải xuống
            </span>
          </button>

          {onRenameDocument ? (
            <button
              onClick={() => {
                setIsOpen(false);
                onRenameDocument(doc);
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
            >
              <span className="flex items-center gap-3">
                <PencilLine size={16} />
                Đổi tên
              </span>
            </button>
          ) : null}

          {onMoveDocument ? (
            <button
              onClick={() => {
                setIsOpen(false);
                onMoveDocument(doc);
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
            >
              <span className="flex items-center gap-3">
                <ArrowRightLeft size={16} />
                Di chuyển
              </span>
            </button>
          ) : null}

          {onDeleteDocument ? (
            <button
              onClick={() => {
                setIsOpen(false);
                onDeleteDocument(doc);
              }}
              className="mt-1 w-full rounded-lg border-t border-slate-50 px-3 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
            >
              <span className="flex items-center gap-3">
                <Trash2 size={16} />
                Xóa tài liệu
              </span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export const LoadingState = ({ viewMode }) => (
  <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'space-y-4'}>
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <AppSkeleton className="h-14 w-14 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <AppSkeleton className="h-5 w-4/5" />
            <AppSkeleton className="h-4 w-3/5" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const DocumentLibraryPanel = ({
  childFolders = [],
  documents = [],
  emptyAction,
  emptyDescription,
  emptyTitle,
  error,
  loading,
  onDeleteDocument,
  onDownloadDocument,
  onMoveDocument,
  onOpenDocument,
  onOpenFolder,
  onRenameDocument,
  onToggleFavorite,
  pagination = null,
  showFolderContext = false,
  viewMode = 'table',
}) => {
  const hasVisibleContent = childFolders.length > 0 || documents.length > 0;

  if (error) {
    return (
      <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
        {error}
      </div>
    );
  }

  if (loading) {
    return <LoadingState viewMode={viewMode} />;
  }

  if (!hasVisibleContent) {
    return (
      <AppEmptyState
        icon={<FileText className="h-7 w-7" />}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="space-y-6">
      {viewMode === 'table' ? (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="group cursor-pointer px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-400 transition-colors hover:text-brand-600">
                    <div className="flex items-center gap-2">
                      Tên
                      <ArrowUpDown size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </th>
                  <th className="hidden px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-400 md:table-cell">
                    Danh mục
                  </th>
                  <th className="group hidden cursor-pointer px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-400 transition-colors hover:text-brand-600 lg:table-cell">
                    <div className="flex items-center gap-2">
                      Cập nhật
                      <ArrowUpDown size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {childFolders.map((folder) => (
                  <tr
                    key={`folder-${folder.id}`}
                    className="group cursor-pointer border-l-[3px] border-transparent transition-colors hover:border-brand-500 hover:bg-slate-50"
                    onClick={() => onOpenFolder(folder.id)}
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                          <FolderClosed size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-bold">{folder.name}</div>
                          <div className="text-[10px] font-medium text-slate-400">Thư mục</div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-slate-600 md:table-cell">-</td>
                    <td className="hidden px-6 py-4 text-sm text-slate-500 lg:table-cell">-</td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}

                {documents.map((doc) => {
                  const ext = getFileExtension(doc);

                  return (
                    <tr
                      key={doc.id}
                      className="group border-l-[3px] border-transparent transition-colors hover:border-brand-500 hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-4">
                          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', getFileBg(ext))}>
                            {getFileIcon(ext)}
                          </div>
                          <div>
                            <div
                              className="cursor-pointer text-sm transition-colors hover:text-brand-600"
                              onClick={() => onOpenDocument(doc.id)}
                            >
                              {doc.title}
                            </div>
                            <div className="mt-1 flex gap-1 md:hidden">
                              <span className="text-[10px] font-medium text-slate-400">
                                {doc.formattedFileSize || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-6 py-4 text-sm text-slate-600 md:table-cell">
                        {showFolderContext && doc.folderName ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 font-medium whitespace-nowrap">
                            <FolderClosed size={12} className="text-slate-400" />
                            {doc.folderName}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">--</span>
                        )}
                      </td>
                      <td className="hidden px-6 py-4 text-sm font-medium text-slate-500 lg:table-cell">
                        {formatDateLabel(doc.updatedAt || doc.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                          <button
                            onClick={() => onToggleFavorite(doc.id)}
                            className={cn(
                              'rounded-lg p-2 transition-colors hover:bg-slate-200',
                              doc.isFavorite ? 'text-amber-500' : 'text-slate-400',
                            )}
                          >
                            <Heart size={16} fill={doc.isFavorite ? 'currentColor' : 'none'} />
                          </button>

                          <DropdownActions
                            doc={doc}
                            onOpenDocument={onOpenDocument}
                            onDownloadDocument={onDownloadDocument}
                            onRenameDocument={onRenameDocument}
                            onDeleteDocument={onDeleteDocument}
                            onMoveDocument={onMoveDocument}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {childFolders.map((folder) => (
            <MotionDiv
              key={folder.id}
              onClick={() => onOpenFolder(folder.id)}
              whileHover={{ y: -5, boxShadow: "0 20px 40px -15px rgba(0,0,0,0.1)" }}
              className="validate-folder relative flex cursor-pointer flex-col items-center rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] group transition-all"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-3xl text-brand-600">
                <FolderClosed size={32} />
              </div>
              <h4 className="mb-1 line-clamp-2 text-sm font-bold text-slate-800">{folder.name}</h4>
              <p className="text-xs font-medium text-slate-400">Thư mục</p>
            </MotionDiv>
          ))}

          {documents.map((doc, index) => {
            const ext = getFileExtension(doc);

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ 
                  y: -5,
                  boxShadow: "0 20px 40px -15px rgba(0,0,0,0.1)",
                  borderColor: "rgba(184,115,51,0.15)"
                }}
                className="group relative rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]"
              >
                <button
                  onClick={() => onToggleFavorite(doc.id)}
                  className={cn(
                    'absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 transition-all hover:bg-white hover:shadow-sm',
                    doc.isFavorite ? 'text-amber-500' : 'text-slate-200 hover:text-amber-500',
                  )}
                >
                  <Heart size={16} fill={doc.isFavorite ? 'currentColor' : 'none'} />
                </button>

                <div
                  className={cn('mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl shadow-inner', getFileBg(ext))}
                  onClick={() => onOpenDocument(doc.id)}
                >
                  {getFileIcon(ext)}
                </div>

                <h4
                  className="mb-1 line-clamp-2 cursor-pointer text-sm font-bold text-slate-800 hover:text-brand-600"
                  onClick={() => onOpenDocument(doc.id)}
                >
                  {doc.title}
                </h4>
                <p className="mb-4 text-xs font-medium text-slate-400">
                  {doc.formattedFileSize || 'N/A'} • {formatDateLabel(doc.updatedAt || doc.createdAt)}
                </p>

                <div className="mb-4 flex flex-wrap gap-1">
                  {showFolderContext && doc.folderName ? (
                    <span className="max-w-full truncate rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600">
                      {doc.folderName}
                    </span>
                  ) : null}
                </div>

                <div className="flex w-full gap-2 border-t border-slate-50 pt-4">
                  <button
                    onClick={() => onOpenDocument(doc.id)}
                    className="flex-1 rounded-xl bg-slate-50 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-600"
                  >
                    Xem
                  </button>
                  <button
                    onClick={() => onDownloadDocument(doc.id, doc.title)}
                    className="flex-1 rounded-xl bg-slate-50 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    Tải về
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="hidden text-sm font-medium text-slate-500 sm:block">
            Trang {pagination.currentPage} / {pagination.totalPages} ({pagination.total} tài liệu)
          </p>
          <AppPagination
            onPageChange={pagination.onPageChange}
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
          />
        </div>
      ) : null}
    </div>
  );
};

export default DocumentLibraryPanel;
