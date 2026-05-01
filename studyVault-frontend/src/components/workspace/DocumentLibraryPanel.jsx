/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRightLeft,
  Check,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  FolderClosed,
  Heart,
  Image as ImageIcon,
  MoreVertical,
  PencilLine,
  Plus,
  Presentation,
  Tag,
  Trash2,
  X,
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
  if (!value) return 'No date';
  try {
    return new Date(value).toLocaleDateString('vi-VN');
  } catch {
    return 'No date';
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
      'inline-flex h-9 w-9 items-center justify-center rounded-2xl text-slate-400 transition-all hover:bg-white hover:text-brand-600 hover:shadow-sm',
      className,
    )}
  >
    {children}
  </button>
);

const DropdownActions = ({
  doc,
  onCreateTag,
  onDeleteDocument,
  onMoveDocument,
  onRenameDocument,
  onUpdateDocumentTags,
  tagOptions = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#9b3f36');
  const [tagSaving, setTagSaving] = useState(false);
  const [tagError, setTagError] = useState('');
  const menuRef = useRef(null);
  const currentTagIds = (doc.tags || []).map((tag) => tag.id);
  const hasTagActions = Boolean(onUpdateDocumentTags && (tagOptions.length > 0 || onCreateTag));
  const hasMoreActions = Boolean(
    onRenameDocument ||
      onMoveDocument ||
      onDeleteDocument ||
      hasTagActions,
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
        setShowTagPanel(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  if (!hasMoreActions) return null;

  const syncDocumentTags = async (nextTagIds) => {
    if (!onUpdateDocumentTags) return;

    try {
      setTagSaving(true);
      setTagError('');
      await onUpdateDocumentTags(doc, nextTagIds);
    } catch {
      setTagError('Tags could not be updated. Please try again.');
    } finally {
      setTagSaving(false);
    }
  };

  const toggleDocumentTag = async (tagId) => {
    if (tagSaving) return;

    const nextTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((currentTagId) => currentTagId !== tagId)
      : [...currentTagIds, tagId];

    await syncDocumentTags(nextTagIds);
  };

  const handleCreateAndAttachTag = async () => {
    const name = newTagName.trim();
    if (!name || !onCreateTag || tagSaving) return;

    try {
      setTagSaving(true);
      setTagError('');
      const createdTag = await onCreateTag({
        color: newTagColor,
        name,
        type: 'TAG',
      });

      if (createdTag?.id) {
        const nextTagIds = currentTagIds.includes(createdTag.id)
          ? currentTagIds
          : [...currentTagIds, createdTag.id];
        await onUpdateDocumentTags(doc, nextTagIds);
      }

      setNewTagName('');
      setNewTagColor('#9b3f36');
    } catch {
      setTagError('The tag could not be created. Please check the name and try again.');
    } finally {
      setTagSaving(false);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <IconButton label="More actions" onClick={() => setIsOpen(!isOpen)}>
        <MoreVertical size={17} />
      </IconButton>

      {isOpen ? (
        <div className={cn(
          "absolute bottom-full right-0 z-[80] mb-2 rounded-2xl border border-white/85 bg-white/95 p-2 shadow-[0_24px_70px_-35px_rgba(45,44,47,0.55)] backdrop-blur-xl transition-all",
          showTagPanel ? "w-80" : "w-max"
        )}>
          <div className="flex items-center gap-1">
            {onRenameDocument ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onRenameDocument(doc);
                }}
                aria-label="Rename"
                title="Rename"
                className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl text-[0px] text-slate-500 transition-all hover:bg-brand-50 hover:text-brand-600"
              >
                <PencilLine size={16} />
                Rename
              </button>
            ) : null}

            {onMoveDocument ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onMoveDocument(doc);
                }}
                aria-label="Move"
                title="Move"
                className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl text-[0px] text-slate-500 transition-all hover:bg-brand-50 hover:text-brand-600"
              >
                <ArrowRightLeft size={16} />
                Move
              </button>
            ) : null}

            {hasTagActions ? (
              <button
                type="button"
                onClick={() => setShowTagPanel((current) => !current)}
                aria-label="Manage tags"
                title="Manage tags"
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl text-[0px] transition-all hover:bg-brand-50 hover:text-brand-600',
                  showTagPanel ? 'bg-brand-50 text-brand-600' : 'text-slate-500',
                )}
              >
                <Tag size={16} />
                Manage tags
              </button>
            ) : null}

            {onDeleteDocument ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onDeleteDocument(doc);
                }}
                aria-label="Delete document"
                title="Delete document"
                className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl text-[0px] text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={16} />
                Delete document
              </button>
            ) : null}
          </div>

          {showTagPanel ? (
            <div className="mt-2 border-t border-slate-100 pt-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Document tags
                </p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">
                  {currentTagIds.length}
                </span>
              </div>

              <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                {tagOptions.length > 0 ? (
                  tagOptions.map((tag) => {
                    const selected = currentTagIds.includes(tag.id);
                    return (
                      <div
                        key={tag.id}
                        className={cn(
                          'flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors',
                          selected ? 'bg-brand-50' : 'hover:bg-slate-50',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => void toggleDocumentTag(tag.id)}
                          disabled={tagSaving}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-wait disabled:opacity-60"
                        >
                          <span
                            className={cn(
                              'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                              selected
                                ? 'border-brand-600 bg-brand-600 text-white'
                                : 'border-slate-200 bg-white text-transparent',
                            )}
                          >
                            <Check size={12} />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs font-extrabold text-slate-700">
                            {tag.type === 'SUBJECT' ? `Subject: ${tag.name}` : tag.name}
                          </span>
                        </button>

                        {selected ? (
                          <button
                            type="button"
                            onClick={() => void toggleDocumentTag(tag.id)}
                            disabled={tagSaving}
                            aria-label={`Remove ${tag.name}`}
                            title="Remove from document"
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white hover:text-rose-600 disabled:cursor-wait disabled:opacity-60"
                          >
                            <X size={14} />
                          </button>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                    No saved tags yet.
                  </p>
                )}
              </div>

              <div className="mt-2 grid grid-cols-[minmax(0,1fr)_40px_40px] gap-2">
                <input
                  value={newTagName}
                  onChange={(event) => {
                    setNewTagName(event.target.value);
                    setTagError('');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleCreateAndAttachTag();
                    }
                  }}
                  placeholder="New tag"
                  className="h-10 min-w-0 rounded-xl border border-slate-100 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-brand-200 focus:bg-white"
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(event) => setNewTagColor(event.target.value)}
                  aria-label="Tag color"
                  title="Tag color"
                  className="h-10 w-10 rounded-xl border border-slate-100 bg-white p-1"
                />
                <button
                  type="button"
                  onClick={() => void handleCreateAndAttachTag()}
                  disabled={!newTagName.trim() || tagSaving}
                  aria-label="Create and assign tag"
                  title="Create and assign tag"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-900 text-white transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Plus size={15} />
                </button>
              </div>

              {tagError ? (
                <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">
                  {tagError}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export const LoadingState = ({ viewMode }) => (
  <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-2.5'}>
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="rounded-2xl border border-white/70 bg-white/62 p-4">
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
    className="group flex w-full items-center gap-4 rounded-2xl border border-white/70 bg-white/62 px-4 py-3 text-left transition-all hover:border-brand-100 hover:bg-white hover:shadow-sm"
  >
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
      <FolderClosed size={20} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-extrabold text-slate-800">{folder.name}</span>
      <span className="mt-0.5 block text-xs font-semibold text-slate-400">Subfolder</span>
    </span>
  </button>
);

const FileMeta = ({ doc, file, showFolderContext }) => (
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
);

const TagBadges = ({ tags = [] }) => {
  if (!tags.length) return null;

  const visibleTags = tags.slice(0, 4);
  const hiddenCount = Math.max(tags.length - visibleTags.length, 0);

  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      {visibleTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex max-w-[150px] items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-sm"
          style={{ backgroundColor: tag.color || '#9b3f36' }}
          title={tag.type === 'SUBJECT' ? `Subject: ${tag.name}` : tag.name}
        >
          <span className="truncate">
            {tag.type === 'SUBJECT' ? `Subject: ${tag.name}` : tag.name}
          </span>
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
          +{hiddenCount}
        </span>
      ) : null}
    </span>
  );
};

const DocumentRow = ({
  doc,
  index,
  onCreateTag,
  onDeleteDocument,
  onDownloadDocument,
  onMoveDocument,
  onOpenDocument,
  onRenameDocument,
  onToggleFavorite,
  onUpdateDocumentTags,
  showFolderContext,
  tagOptions,
}) => {
  const ext = getFileExtension(doc);
  const file = getFilePresentation(doc);

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.16) }}
      className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 rounded-2xl border border-white/75 bg-white/66 px-4 py-3 shadow-[0_12px_34px_-32px_rgba(45,44,47,0.55)] transition-all hover:border-brand-100 hover:bg-white hover:shadow-[0_20px_50px_-38px_rgba(45,44,47,0.48)] lg:grid-cols-[auto_minmax(0,1fr)_auto]"
    >
      <button
        type="button"
        onClick={() => onOpenDocument(doc.id)}
        aria-label="Open document"
        title="Open document"
        className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', file.accent)}
      >
        {getFileIcon(ext)}
      </button>

      <button type="button" onClick={() => onOpenDocument(doc.id)} className="min-w-0 text-left">
        <span className="block truncate text-sm font-extrabold text-slate-900 transition-colors group-hover:text-brand-600">
          {doc.title}
        </span>
        <FileMeta doc={doc} file={file} showFolderContext={showFolderContext} />
        <TagBadges tags={doc.tags || []} />
      </button>

      <div className="col-span-2 flex items-center justify-end gap-1 border-t border-slate-100 pt-3 lg:col-span-1 lg:border-t-0 lg:pt-0">
        <IconButton
          label="Favorites"
          onClick={() => onToggleFavorite(doc.id)}
          className={doc.isFavorite ? 'text-amber-500 hover:text-amber-500' : ''}
        >
          <Heart size={17} fill={doc.isFavorite ? 'currentColor' : 'none'} />
        </IconButton>

        <IconButton label="View document" onClick={() => onOpenDocument(doc.id)}>
          <Eye size={17} />
        </IconButton>

        <IconButton label="Download" onClick={() => onDownloadDocument(doc.id, doc.title)}>
          <Download size={17} />
        </IconButton>

        <DropdownActions
          doc={doc}
          onRenameDocument={onRenameDocument}
          onDeleteDocument={onDeleteDocument}
          onMoveDocument={onMoveDocument}
          onCreateTag={onCreateTag}
          onUpdateDocumentTags={onUpdateDocumentTags}
          tagOptions={tagOptions}
        />
      </div>
    </MotionDiv>
  );
};

const DocumentCard = ({
  doc,
  index,
  onCreateTag,
  onDeleteDocument,
  onDownloadDocument,
  onMoveDocument,
  onOpenDocument,
  onRenameDocument,
  onToggleFavorite,
  onUpdateDocumentTags,
  showFolderContext,
  tagOptions,
}) => {
  const ext = getFileExtension(doc);
  const file = getFilePresentation(doc);

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.18) }}
      whileHover={{ y: -2 }}
      className="group rounded-2xl border border-white/75 bg-white/66 p-4 shadow-[0_14px_38px_-34px_rgba(45,44,47,0.55)] transition-all hover:border-brand-100 hover:bg-white"
    >
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => onOpenDocument(doc.id)}
          aria-label="Open document"
          title="Open document"
          className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl', file.accent)}
        >
          {getFileIcon(ext)}
        </button>

        <IconButton
          label="Favorites"
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
        <FileMeta doc={doc} file={file} showFolderContext={showFolderContext} />
        <TagBadges tags={doc.tags || []} />
      </button>

      <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-3">
        <IconButton label="View document" onClick={() => onOpenDocument(doc.id)}>
          <Eye size={17} />
        </IconButton>
        <IconButton label="Download" onClick={() => onDownloadDocument(doc.id, doc.title)}>
          <Download size={17} />
        </IconButton>
        <DropdownActions
          doc={doc}
          onRenameDocument={onRenameDocument}
          onDeleteDocument={onDeleteDocument}
          onMoveDocument={onMoveDocument}
          onCreateTag={onCreateTag}
          onUpdateDocumentTags={onUpdateDocumentTags}
          tagOptions={tagOptions}
        />
      </div>
    </MotionDiv>
  );
};

const EmptyPanel = ({ action, description, title }) => (
  <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/80 bg-white/45 p-8 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand-500 shadow-sm">
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
  onCreateTag,
  onDeleteDocument,
  onDownloadDocument,
  onMoveDocument,
  onOpenDocument,
  onOpenFolder,
  onRenameDocument,
  onToggleFavorite,
  onUpdateDocumentTags,
  pagination = null,
  showFolderContext = false,
  tagOptions = [],
  viewMode = 'table',
}) => {
  const hasVisibleContent = childFolders.length > 0 || documents.length > 0;

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {childFolders.map((folder) => (
            <FolderRow key={`folder-${folder.id}`} folder={folder} onOpenFolder={onOpenFolder} />
          ))}

          {documents.map((doc, index) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              index={index}
              onCreateTag={onCreateTag}
              onDeleteDocument={onDeleteDocument}
              onDownloadDocument={onDownloadDocument}
              onMoveDocument={onMoveDocument}
              onOpenDocument={onOpenDocument}
              onRenameDocument={onRenameDocument}
              onToggleFavorite={onToggleFavorite}
              onUpdateDocumentTags={onUpdateDocumentTags}
              showFolderContext={showFolderContext}
              tagOptions={tagOptions}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {childFolders.map((folder) => (
            <FolderRow key={`folder-${folder.id}`} folder={folder} onOpenFolder={onOpenFolder} />
          ))}

          {documents.map((doc, index) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              index={index}
              onCreateTag={onCreateTag}
              onDeleteDocument={onDeleteDocument}
              onDownloadDocument={onDownloadDocument}
              onMoveDocument={onMoveDocument}
              onOpenDocument={onOpenDocument}
              onRenameDocument={onRenameDocument}
              onToggleFavorite={onToggleFavorite}
              onUpdateDocumentTags={onUpdateDocumentTags}
              showFolderContext={showFolderContext}
              tagOptions={tagOptions}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/70 bg-white/45 px-4 py-3 sm:flex-row">
          <p className="text-sm font-bold text-slate-500">
            Page {pagination.currentPage} / {pagination.totalPages} - {pagination.total} documents
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
