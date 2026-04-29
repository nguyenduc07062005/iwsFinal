import { useEffect, useMemo, useRef, useState } from 'react';
import { FileUp, FolderClosed, X } from 'lucide-react';
import {
  AppButton,
  AppInput,
  AppModal,
} from '@/components/ui/index.js';
import { cn } from '@/lib/utils.js';
import { getApiErrorMessage } from '../../utils/apiError.js';

const selectClassName =
  'control-surface w-full rounded-[var(--radius-control)] px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition-all duration-300 focus:border-brand-200 focus:bg-white focus:shadow-[var(--shadow-medium)] focus:ring-2 focus:ring-brand-500/15';

const UploadModal = ({
  defaultFolderId = '',
  folders = [],
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    if (!isOpen) return;

    setFile(null);
    setTitle('');
    setSelectedFolderId(defaultFolderId || folders[0]?.id || '');
    setError('');
    setIsDragOver(false);
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [defaultFolderId, folders, isOpen]);

  if (!isOpen) {
    return null;
  }

  const validateSelectedFile = (selectedFile) => {
    if (!selectedFile) return null;

    if (!acceptedTypes.includes(selectedFile.type)) {
      return 'Chỉ hỗ trợ PDF, DOCX hoặc TXT.';
    }

    if (selectedFile.size > maxFileSize) {
      return 'Tệp tối đa 10MB.';
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

    setError(validationError || 'Vui lòng chọn tệp hợp lệ.');
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    const validationError = validateSelectedFile(selectedFile);

    if (selectedFile && !validationError) {
      handleFileAccepted(selectedFile);
      return;
    }

    setFile(null);
    setError(validationError || 'Vui lòng chọn tệp hợp lệ.');
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
      setError('Vui lòng chọn tệp.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      await onUploadSuccess(file, title || file.name, selectedFolderId || null);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Tải lên thất bại.'));
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
        Hủy
      </AppButton>
      <AppButton
        type="submit"
        form={formId}
        loading={isUploading}
        disabled={!file}
        leadingIcon={!isUploading ? <FileUp className="h-4.5 w-4.5" /> : null}
      >
        Tải lên
      </AppButton>
    </>
  );

  return (
    <AppModal
      open={isOpen}
      onClose={isUploading ? () => {} : onClose}
      title="Thêm tài liệu"
      size="sm"
      footer={footer}
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'group relative flex w-full items-center gap-4 rounded-[1.6rem] border-2 border-dashed px-5 py-5 text-left transition-all duration-300',
            isDragOver
              ? 'border-brand-400 bg-brand-50'
              : file
                ? 'border-brand-200 bg-white/90'
                : 'border-white/80 bg-white/55 hover:border-brand-200 hover:bg-white/80',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />

          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-sm">
            <FileUp className="h-6 w-6" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold text-slate-900">
              {file ? file.name : 'Chọn hoặc kéo thả tệp'}
            </span>
            <span className="mt-1 block text-xs font-bold text-slate-400">
              {file ? formatFileSize(file.size) : 'PDF, DOCX, TXT · tối đa 10MB'}
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

        <AppInput
          label="Tên tài liệu"
          placeholder="Tên hiển thị"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

        <label className="flex w-full flex-col gap-2">
          <span className="pl-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            Thư mục
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
