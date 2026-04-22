import { useEffect, useMemo, useRef, useState } from 'react';
import { FileUp, FolderClosed, Sparkles } from 'lucide-react';
import {
  AppBadge,
  AppButton,
  AppCard,
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
    if (!isOpen) {
      return;
    }

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
    if (!selectedFile) {
      return null;
    }

    if (!acceptedTypes.includes(selectedFile.type)) {
      return 'Chỉ hỗ trợ tệp PDF, DOCX, hoặc TXT.';
    }

    if (selectedFile.size > maxFileSize) {
      return 'Kích thước tệp phải nhỏ hơn hoặc bằng 10MB.';
    }

    return null;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) {
      return '0 Bytes';
    }

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

    setError(validationError || 'Vui lòng chọn một tệp hợp lệ.');
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    const validationError = validateSelectedFile(selectedFile);

    if (selectedFile && !validationError) {
      handleFileAccepted(selectedFile);
      return;
    }

    setFile(null);
    setError(validationError || 'Vui lòng chọn một tệp hợp lệ.');
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
      setError('Vui lòng chọn tệp để tải lên.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      await onUploadSuccess(file, title || file.name, selectedFolderId || null);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Tải lên thất bại. Vui lòng thử lại.'));
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
        Tải tài liệu lên
      </AppButton>
    </>
  );

  return (
    <AppModal
      open={isOpen}
      onClose={isUploading ? () => {} : onClose}
      eyebrow="Tiếp nhận tài liệu"
      title="Tải tài liệu mới"
      description="Thêm PDF, DOCX, hoặc TXT trực tiếp vào workspace để CRUD luôn bám dữ liệu backend thật."
      size="lg"
      footer={footer}
    >
      <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
        <AppCard tone="brand" padding="md" className="h-full">
          <AppBadge variant="glass" size="sm">
            Quy tắc tải lên
          </AppBadge>
          <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-white">
            Giữ tệp gọn gàng và sẵn sàng cho bước lập chỉ mục AI.
          </h3>
          <p className="mt-3 text-sm leading-7 text-brand-100">
            Backend sẽ kiểm tra loại tệp, kích thước, quyền sở hữu thư mục, rồi
            lưu tài liệu vào đúng tài khoản đang đăng nhập.
          </p>

          <div className="mt-6 space-y-3">
            {[
              { label: 'Định dạng', value: 'PDF / DOCX / TXT' },
              { label: 'Giới hạn', value: '10 MB' },
              { label: 'Luồng xử lý', value: 'Upload -> Index -> Refresh workspace' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.4rem] border border-white/10 bg-white/10 px-4 py-3 text-sm backdrop-blur-sm"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-100">
                  {item.label}
                </p>
                <p className="mt-1 font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </AppCard>

        <form id={formId} className="space-y-5" onSubmit={handleSubmit}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'relative w-full overflow-hidden rounded-[1.75rem] border-2 border-dashed p-6 text-left transition-all duration-300',
              isDragOver
                ? 'border-brand-400 bg-brand-50'
                : file
                  ? 'border-brand-300 bg-white'
                  : 'border-slate-200 bg-[color:rgba(255,248,243,0.7)] hover:border-brand-300 hover:bg-white',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div className="flex items-start gap-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1.3rem] bg-brand-900 text-white shadow-[var(--shadow-brand)]">
                  <FileUp className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-extrabold tracking-tight text-slate-900">
                    {file.name}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <AppBadge variant="outline" size="sm">
                      {formatFileSize(file.size)}
                    </AppBadge>
                    <AppBadge variant="soft" size="sm">
                      Sẵn sàng tải lên
                    </AppBadge>
                  </div>
                </div>
                <AppButton variant="ghost" size="sm" onClick={clearFile}>
                  Xóa chọn
                </AppButton>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1.3rem] bg-white text-brand-600 shadow-[var(--shadow-soft)]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-extrabold tracking-tight text-slate-900">
                    Kéo thả tệp vào đây hoặc chọn từ máy
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Hệ thống sẽ dùng thư mục hiện tại làm mặc định, hoặc bạn có thể
                    đổi thư mục đích ở bên dưới trước khi gửi.
                  </p>
                </div>
              </div>
            )}
          </button>

          <AppInput
            label="Tên tài liệu"
            placeholder="Đề cương đồ án cuối kỳ"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <label className="flex w-full flex-col gap-2">
            <span className="pl-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Lưu vào thư mục
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
            <div className="rounded-[1.4rem] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}
        </form>
      </div>
    </AppModal>
  );
};

export default UploadModal;
