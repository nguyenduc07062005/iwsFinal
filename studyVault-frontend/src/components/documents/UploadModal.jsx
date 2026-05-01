import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, FileUp, FolderClosed, Plus, Tag, X } from 'lucide-react';
import { AppButton, AppInput, AppModal } from '@/components/ui/index.js';
import { cn } from '@/lib/utils.js';
import { getApiErrorMessage } from '../../utils/apiError.js';

const selectClassName =
  'control-surface w-full appearance-none rounded-[var(--radius-control)] px-4 py-3 pr-11 text-sm font-semibold text-slate-800 outline-none transition-all duration-300 focus:border-brand-200 focus:bg-white focus:shadow-[var(--shadow-medium)] focus:ring-2 focus:ring-brand-500/15';

const iconButtonClassName =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-white bg-white text-slate-500 shadow-sm transition-all hover:-translate-y-0.5 hover:text-brand-600 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45';

const UploadModal = ({
  defaultFolderId = '',
  folders = [],
  isOpen,
  onClose,
  onCreateTag,
  onDeleteTag,
  onUploadSuccess,
  tags = [],
}) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [tagPickerValue, setTagPickerValue] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#9b3f36');
  const [isTagMutating, setIsTagMutating] = useState(false);
  const [tagError, setTagError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const fileInputRef = useRef(null);
  const tagDropdownRef = useRef(null);

  const acceptedTypes = useMemo(
    () => [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    [],
  );

  const maxFileSize = 10 * 1024 * 1024;
  const formId = 'studyvault-upload-form';
  const selectedTags = useMemo(
    () => tags.filter((tag) => selectedTagIds.includes(tag.id)),
    [selectedTagIds, tags],
  );
  const selectedTagSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);
  const activePickerTag = tags.find((tag) => tag.id === tagPickerValue);

  useEffect(() => {
    if (!isOpen) return;

    setFile(null);
    setTitle('');
    setSelectedFolderId(defaultFolderId || folders[0]?.id || '');
    setSelectedTagIds([]);
    setTagPickerValue('');
    setNewTagName('');
    setNewTagColor('#9b3f36');
    setIsTagMutating(false);
    setTagError('');
    setIsTagDropdownOpen(false);
    setError('');
    setIsDragOver(false);
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [defaultFolderId, folders, isOpen]);

  useEffect(() => {
    const tagIds = new Set(tags.map((tag) => tag.id));

    setSelectedTagIds((current) => {
      const next = current.filter((tagId) => tagIds.has(tagId));
      return next.length === current.length ? current : next;
    });

    if (tagPickerValue && !tagIds.has(tagPickerValue)) {
      setTagPickerValue('');
    }
  }, [tagPickerValue, tags]);

  useEffect(() => {
    if (!isTagDropdownOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!tagDropdownRef.current?.contains(event.target)) {
        setIsTagDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isTagDropdownOpen]);

  if (!isOpen) {
    return null;
  }

  const validateSelectedFile = (selectedFile) => {
    if (!selectedFile) return null;

    if (!acceptedTypes.includes(selectedFile.type)) {
      return 'Only PDF, DOCX, or TXT files are supported.';
    }

    if (selectedFile.size > maxFileSize) {
      return 'Maximum file size is 10MB.';
    }

    return null;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const base = 1024;
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const index = Math.floor(Math.log(bytes) / Math.log(base));

    return `${parseFloat((bytes / Math.pow(base, index)).toFixed(2))} ${units[index]}`;
  };

  const handleFileAccepted = (selectedFile) => {
    setFile(selectedFile);
    setTitle((currentTitle) => currentTitle || selectedFile.name);
    setError('');
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const droppedFile = event.dataTransfer.files[0];
    const validationError = validateSelectedFile(droppedFile);

    if (droppedFile && !validationError) {
      handleFileAccepted(droppedFile);
      return;
    }

    setError(validationError || 'Please choose a valid file.');
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    const validationError = validateSelectedFile(selectedFile);

    if (selectedFile && !validationError) {
      handleFileAccepted(selectedFile);
      return;
    }

    setFile(null);
    setError(validationError || 'Please choose a valid file.');
  };

  const clearFile = () => {
    setFile(null);
    setTitle('');
    setError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError('Please choose a file.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      await onUploadSuccess(
        file,
        title || file.name,
        selectedFolderId || null,
        selectedTagIds,
      );
      onClose();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          'The document could not be uploaded. Please check the file and try again.',
        ),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const footer = (
    <>
      <AppButton
        variant="secondary"
        onClick={onClose}
        disabled={isUploading}
      >
        Cancel
      </AppButton>
      <AppButton
        type="submit"
        form={formId}
        loading={isUploading}
        disabled={!file}
        leadingIcon={!isUploading ? <FileUp className="h-4.5 w-4.5" /> : null}
      >
        Upload
      </AppButton>
    </>
  );

  const toggleTag = (tagId) => {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((currentTagId) => currentTagId !== tagId)
        : [...current, tagId],
    );
  };

  const handlePickSavedTag = (tagId) => {
    setTagPickerValue(tagId);
    setTagError('');

    if (!tagId) return;

    setSelectedTagIds((current) =>
      current.includes(tagId) ? current : [...current, tagId],
    );
    setIsTagDropdownOpen(false);
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();

    if (!name) {
      setTagError('Please enter a tag name.');
      return;
    }

    if (!onCreateTag) return;

    try {
      setIsTagMutating(true);
      setTagError('');
      const createdTag = await onCreateTag({
        color: newTagColor,
        name,
        type: 'TAG',
      });

      if (createdTag?.id) {
        setSelectedTagIds((current) =>
          current.includes(createdTag.id) ? current : [...current, createdTag.id],
        );
        setTagPickerValue(createdTag.id);
      }

      setNewTagName('');
      setNewTagColor('#9b3f36');
    } catch (err) {
      setTagError(
        getApiErrorMessage(
          err,
          'The tag could not be created. Please check the name and try again.',
        ),
      );
    } finally {
      setIsTagMutating(false);
    }
  };

  const handleDeleteSavedTag = async (tagId) => {
    if (!tagId || !onDeleteTag) return;

    const targetTag = tags.find((tag) => tag.id === tagId);
    const shouldDelete = window.confirm(
      `Delete "${targetTag?.name || 'this tag'}"? It will be removed from documents.`,
    );

    if (!shouldDelete) return;

    try {
      setIsTagMutating(true);
      setTagError('');
      await onDeleteTag(tagId);
      setSelectedTagIds((current) =>
        current.filter((currentTagId) => currentTagId !== tagId),
      );
      if (tagPickerValue === tagId) {
        setTagPickerValue('');
      }
    } catch (err) {
      setTagError(
        getApiErrorMessage(
          err,
          'The tag could not be deleted. Please refresh and try again.',
        ),
      );
    } finally {
      setIsTagMutating(false);
    }
  };

  return (
    <AppModal
      open={isOpen}
      onClose={isUploading ? () => {} : onClose}
      title="Add document"
      size="lg"
      footer={footer}
    >
      <form id={formId} className="space-y-3" onSubmit={handleSubmit}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'group relative flex w-full items-center gap-3 rounded-[1.25rem] border-2 border-dashed px-4 py-3 text-left transition-all duration-300',
            isDragOver
              ? 'border-brand-400 bg-brand-50/80'
              : file
                ? 'border-brand-200 bg-brand-50/60'
                : 'border-slate-200 bg-slate-50 hover:border-brand-200 hover:bg-white',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />

          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-100">
            <FileUp className="h-5 w-5" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold text-slate-900">
              {file ? file.name : 'Choose or drag and drop a file'}
            </span>
            <span className="mt-1 block text-xs font-bold text-slate-400">
              {file ? formatFileSize(file.size) : 'PDF, DOCX, TXT - up to 10MB'}
            </span>
          </span>

          {file ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                clearFile();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  clearFile();
                }
              }}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-500"
            >
              <X className="h-4 w-4" />
            </span>
          ) : null}
        </button>

        <div className="grid gap-3 md:grid-cols-2">
          <AppInput
            label="Document name"
            placeholder="Display name"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <label className="flex w-full flex-col gap-2">
            <span className="pl-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Folders
            </span>
            <div className="relative">
              <FolderClosed className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedFolderId}
                onChange={(event) => setSelectedFolderId(event.target.value)}
                className={cn(selectClassName, 'pl-11')}
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.depth === 0
                      ? 'Workspace'
                      : `${'-- '.repeat(folder.depth)}${folder.name}`}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>

        <div className="flex w-full flex-col gap-2">
          <span className="pl-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            Tags & subjects
          </span>
          <div className="space-y-2 rounded-[1.1rem] border border-slate-100 bg-slate-50 px-3 py-3">
            <div className="grid gap-2">
              <div ref={tagDropdownRef} className="relative">
                <Tag className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setIsTagDropdownOpen((current) => !current)}
                  disabled={tags.length === 0 || isTagMutating}
                  className={cn(
                    selectClassName,
                    'flex items-center justify-between gap-3 pl-11 text-left disabled:cursor-not-allowed disabled:opacity-60',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {activePickerTag
                      ? `${activePickerTag.type === 'SUBJECT' ? 'Subject: ' : ''}${activePickerTag.name}`
                      : tags.length > 0
                        ? 'Choose a saved tag'
                        : 'No saved tags yet'}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-slate-400 transition-transform',
                      isTagDropdownOpen && 'rotate-180',
                    )}
                  />
                </button>

                {isTagDropdownOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-44 overflow-y-auto rounded-[1rem] border border-slate-200 bg-white py-1 shadow-2xl shadow-slate-900/12">
                    {tags.map((tag) => {
                      const selected = selectedTagSet.has(tag.id);

                      return (
                        <div
                          key={tag.id}
                          role="option"
                          aria-selected={selected}
                          tabIndex={0}
                          onClick={() => handlePickSavedTag(tag.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handlePickSavedTag(tag.id);
                            }
                          }}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700',
                            selected && 'bg-brand-50 text-brand-700',
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {tag.type === 'SUBJECT' ? 'Subject: ' : ''}
                            {tag.name}
                          </span>
                          <button
                            type="button"
                            aria-label={`Delete ${tag.name}`}
                            title="Delete tag"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDeleteSavedTag(tag.id);
                            }}
                            disabled={isTagMutating}
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                <select
                  value={tagPickerValue}
                  onChange={(event) => handlePickSavedTag(event.target.value)}
                  disabled={tags.length === 0 || isTagMutating}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <option value="" />
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs font-black text-white shadow-sm transition-all hover:-translate-y-0.5"
                    style={{ backgroundColor: tag.color }}
                  >
                    <X className="h-3 w-3" />
                    {tag.type === 'SUBJECT' ? 'Subject: ' : ''}
                    {tag.name}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="border-t border-white/80 pt-2">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_52px_44px]">
                <input
                  value={newTagName}
                  onChange={(event) => {
                    setNewTagName(event.target.value);
                    setTagError('');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleCreateTag();
                    }
                  }}
                  placeholder="New tag or subject"
                  className="control-surface min-w-0 rounded-[var(--radius-control)] px-4 py-3 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500/15"
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(event) => setNewTagColor(event.target.value)}
                  className="h-12 w-full rounded-[var(--radius-control)] border border-white bg-white p-1.5 shadow-sm"
                  aria-label="Tag color"
                  title="Tag color"
                />
                <button
                  type="button"
                  aria-label="Create tag"
                  title="Create tag"
                  onClick={() => void handleCreateTag()}
                  disabled={!newTagName.trim() || isTagMutating}
                  className={iconButtonClassName}
                >
                  <Plus className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {tagError ? (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {tagError}
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}
      </form>
    </AppModal>
  );
};

export default UploadModal;
