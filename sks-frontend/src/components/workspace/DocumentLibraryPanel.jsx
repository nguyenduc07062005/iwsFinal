/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import {
  ArrowRightLeft,
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
import { AppPagination, AppSkeleton } from '@/components/ui/index.js';
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
    return new Date(value).toLocaleDateString('vi-VN');
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

const IconButton = ({ children, className, label, onClick }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={cn(
      'inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition-all hover:bg-white hover:text-brand-600 hover:shadow-sm',
      className,
    )}
  >
    {children}
  </button>
);

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
      <IconButton label="Thêm thao tác" onClick={() => setIsOpen(!isOpen)}>
        <MoreVertical size={17} />
      </IconButton>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-white/80 bg-white p-2 shadow-[0_18px_55px_-25px_rgba(45,44,47,0.35)]">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenDocument(doc.id);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
          >
            <Eye size={16} />
            Xem chi tiết
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onDownloadDocument(doc.id, doc.title);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
          >
            <Download size={16} />
            Tải xuống
          </button>

          {onRenameDocument ? (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onRenameDocument(doc);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
            >
              <PencilLine size={16} />
              Đổi tên
            </button>
          ) : null}

          {onMoveDocument ? (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onMoveDocument(doc);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-brand-600"
            >
              <ArrowRightLeft size={16} />
              Di chuyển
            </button>
          ) : null}

          {onDeleteDocument ? (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onDeleteDocument(doc);
              }}
              className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-slate-50 px-3 py-2 text-left text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <Trash2 size={16} />
              Xóa tài liệu
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export const LoadingState = ({ viewMode }) => (
  <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="rounded-3xl border border-white/70 bg-white/65 p-4">
        <div className="flex items-center gap-4">
          <AppSkeleton className="h-12 w-12 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <AppSkeleton className="h-4 w-3/4" />
            <AppSkeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const FolderRow = ({ folder, onOpenFolder }) => (
  <button
    type="button"
    onClick={() => onOpenFolder(folder.id)}
    className="group flex w-full items-center gap-4 rounded-3xl border border-white/70 bg-white/60 px-4 py-3 text-left transition-all hover:border-brand-100 hover:bg-white hover:shadow-sm"
  >
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
      <FolderClosed size={20} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-extrabold text-slate-800">{folder.name}</span>
      <span className="mt-0.5 block text-xs font-semibold text-slate-400">Thư mục con</span>
    </span>
  </button>
);

const DocumentRow = ({
  doc,
  index,
  onDeleteDocument,
  onDownloadDocument,
  onMoveDocument,
  onOpenDocument,
  onRenameDocument,
  onToggleFavorite,
  showFolderContext,
}) => {
  const ext = getFileExtension(doc);
  const file = getFilePresentation(doc);

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.18) }}
      className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-3xl border border-white/75 bg-white/68 px-4 py-3 shadow-[0_12px_36px_-32px_rgba(45,44,47,0.55)] transition-all hover:border-brand-100 hover:bg-white hover:shadow-[0_20px_55px_-38px_rgba(45,44,47,0.48)] lg:grid-cols-[auto_minmax(0,1fr)_auto]"
    >
      <button
        type="button"
        onClick={() => onOpenDocument(doc.id)}
        className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', file.accent)}
      >
        {getFileIcon(ext)}
      </button>

      <button type="button" onClick={() => onOpenDocument(doc.id)} className="min-w-0 text-left">
        <span className="block truncate text-sm font-extrabold text-slate-900 transition-colors group-hover:text-brand-600">
          {doc.title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-slate-400">
          <span>{file.label}</span>
          <span>{doc.formattedFileSize || 'N/A'}</span>
          <span>{formatDateLabel(doc.updatedAt || doc.createdAt)}</span>
          {showFolderContext && doc.folderName ? (
            <span className="inline-flex min-w-0 max-w-[180px] items-center gap-1 truncate rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">
              <FolderClosed size={12} />
              {doc.folderName}
            </span>
          ) : null}
        </span>
      </button>

      <div className="col-span-2 flex items-center justify-end gap-1 border-t border-slate-100 pt-3 lg:col-span-1 lg:border-t-0 lg:pt-0">
        <IconButton
          label="Yêu thích"
          onClick={() => onToggleFavorite(doc.id)}
          className={doc.isFavorite ? 'text-amber-500 hover:text-amber-500' : ''}
        >
          <Heart size={17} fill={doc.isFavorite ? 'currentColor' : 'none'} />
        </IconButton>

        <IconButton label="Xem tài liệu" onClick={() => onOpenDocument(doc.id)}>
          <Eye size={17} />
        </IconButton>

        <IconButton label="Tải xuống" onClick={() => onDownloadDocument(doc.id, doc.title)}>
          <Download size={17} />
        </IconButton>

        <DropdownActions
          doc={doc}
          onOpenDocument={onOpenDocument}
          onDownloadDocument={onDownloadDocument}
          onRenameDocument={onRenameDocument}
          onDeleteDocument={onDeleteDocument}
          onMoveDocument={onMoveDocument}
        />
      </div>
    </MotionDiv>
  );
};

const DocumentCard = ({
  doc,
  index,
  onDeleteDocument,
  onDownloadDocument,
  onMoveDocument,
  onOpenDocument,
  onRenameDocument,
  onToggleFavorite,
  showFolderContext,
}) => {
  const ext = getFileExtension(doc);
  const file = getFilePresentation(doc);

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.2) }}
      whileHover={{ y: -3 }}
      className="group rounded-3xl border border-white/75 bg-white/68 p-4 shadow-[0_14px_42px_-34px_rgba(45,44,47,0.55)] transition-all hover:border-brand-100 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => onOpenDocument(doc.id)}
          className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl', file.accent)}
        >
          {getFileIcon(ext)}
        </button>

        <IconButton
          label="Yêu thích"
          onClick={() => onToggleFavorite(doc.id)}
          className={doc.isFavorite ? 'text-amber-500 hover:text-amber-500' : ''}
        >
          <Heart size={17} fill={doc.isFavorite ? 'currentColor' : 'none'} />
        </IconButton>
      </div>

      <button type="button" onClick={() => onOpenDocument(doc.id)} className="mt-5 block w-full text-left">
        <span className="line-clamp-2 text-sm font-extrabold text-slate-900 group-hover:text-brand-600">
          {doc.title}
        </span>
        <span className="mt-2 block text-xs font-bold text-slate-400">
          {file.label} · {doc.formattedFileSize || 'N/A'} · {formatDateLabel(doc.updatedAt || doc.createdAt)}
        </span>
      </button>

      {showFolderContext && doc.folderName ? (
        <span className="mt-4 inline-flex max-w-full items-center gap-1 truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
          <FolderClosed size={12} />
          {doc.folderName}
        </span>
      ) : null}

      <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-3">
        <IconButton label="Xem tài liệu" onClick={() => onOpenDocument(doc.id)}>
          <Eye size={17} />
        </IconButton>
        <IconButton label="Tải xuống" onClick={() => onDownloadDocument(doc.id, doc.title)}>
          <Download size={17} />
        </IconButton>
        <DropdownActions
          doc={doc}
          onOpenDocument={onOpenDocument}
          onDownloadDocument={onDownloadDocument}
          onRenameDocument={onRenameDocument}
          onDeleteDocument={onDeleteDocument}
          onMoveDocument={onMoveDocument}
        />
      </div>
    </MotionDiv>
  );
};

const EmptyPanel = ({ action, description, title }) => (
  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/80 bg-white/45 p-8 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-brand-500 shadow-sm">
      <FileText size={28} />
    </div>
    <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
    <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-slate-500">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
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
      <div className="rounded-3xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
        {error}
      </div>
    );
  }

  if (loading) {
    return <LoadingState viewMode={viewMode} />;
  }

  if (!hasVisibleContent) {
    return (
      <EmptyPanel
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="space-y-5">
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {childFolders.map((folder) => (
            <FolderRow key={`folder-${folder.id}`} folder={folder} onOpenFolder={onOpenFolder} />
          ))}

          {documents.map((doc, index) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              index={index}
              onDeleteDocument={onDeleteDocument}
              onDownloadDocument={onDownloadDocument}
              onMoveDocument={onMoveDocument}
              onOpenDocument={onOpenDocument}
              onRenameDocument={onRenameDocument}
              onToggleFavorite={onToggleFavorite}
              showFolderContext={showFolderContext}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {childFolders.map((folder) => (
            <FolderRow key={`folder-${folder.id}`} folder={folder} onOpenFolder={onOpenFolder} />
          ))}

          {documents.map((doc, index) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              index={index}
              onDeleteDocument={onDeleteDocument}
              onDownloadDocument={onDownloadDocument}
              onMoveDocument={onMoveDocument}
              onOpenDocument={onOpenDocument}
              onRenameDocument={onRenameDocument}
              onToggleFavorite={onToggleFavorite}
              showFolderContext={showFolderContext}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/70 bg-white/45 px-4 py-3 sm:flex-row">
          <p className="text-sm font-bold text-slate-500">
            Trang {pagination.currentPage} / {pagination.totalPages} · {pagination.total} tài liệu
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
