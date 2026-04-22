import { Fragment, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  FolderClosed,
  FolderPlus,
  PencilLine,
  Trash2,
} from 'lucide-react';
import {
  createFolder,
  deleteFolder,
  moveFolder,
  updateFolder,
} from '../../service/folderAPI.js';
import { useDocumentsContext } from '../DocumentsContext.jsx';
import {
  AppButton,
  AppEmptyState,
  AppInput,
  AppModal,
  AppSkeleton,
} from '@/components/ui/index.js';
import { cn } from '@/lib/utils.js';
import { getApiErrorMessage } from '../../utils/apiError.js';

const findFolderPath = (folders, folderId, trail = []) => {
  for (const folder of folders) {
    const nextTrail = [...trail, folder];

    if (folder.id === folderId) {
      return nextTrail;
    }

    const nestedTrail = findFolderPath(folder.children || [], folderId, nextTrail);
    if (nestedTrail.length > 0) {
      return nestedTrail;
    }
  }

  return [];
};

const buildFolderOptionLabel = (folder) => {
  if (folder.depth === 0) {
    return 'Workspace';
  }

  return `${'-- '.repeat(folder.depth)}${folder.name}`;
};

const toneForIndex = (index) => {
  const tones = [
    'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white',
    'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white',
    'bg-fuchsia-50 text-fuchsia-500 group-hover:bg-fuchsia-500 group-hover:text-white',
  ];

  return tones[index % tones.length];
};

const FolderActionButton = ({ icon, label, onClick, tone = 'default' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={cn(
      'inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors',
      tone === 'danger'
        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
        : 'bg-white text-slate-400 hover:bg-brand-50 hover:text-brand-600',
    )}
  >
    {icon}
  </button>
);

const SelectField = ({ label, onChange, options, value }) => (
  <label className="flex w-full flex-col gap-2">
    <span className="pl-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
      {label}
    </span>
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-brand-200 focus:bg-white focus:ring-2 focus:ring-brand-500/15"
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {buildFolderOptionLabel(option)}
        </option>
      ))}
    </select>
  </label>
);

const FoldersPanel = ({ onFolderSelectionChange }) => {
  const {
    foldersLoading,
    folderOptions,
    refreshFolders,
    rootFolder,
    selectedFolderId,
    selectFolder,
  } = useDocumentsContext();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createParentId, setCreateParentId] = useState('');
  const [renameName, setRenameName] = useState('');
  const [moveParentId, setMoveParentId] = useState('');
  const [activeFolder, setActiveFolder] = useState(null);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goToFolder = (folderId) => {
    if (!folderId || folderId === rootFolder?.id) {
      selectFolder(null);
      onFolderSelectionChange?.(null);
      return;
    }

    selectFolder(folderId);
    onFolderSelectionChange?.(folderId);
  };

  const folderPath = useMemo(() => {
    if (!rootFolder) {
      return [];
    }

    const activeFolderId = selectedFolderId || rootFolder.id;
    const nextPath = findFolderPath([rootFolder], activeFolderId);
    return nextPath.length > 0 ? nextPath : [rootFolder];
  }, [rootFolder, selectedFolderId]);

  const currentExplorerFolder = folderPath[folderPath.length - 1] || rootFolder;
  const parentFolder = folderPath.length > 1 ? folderPath[folderPath.length - 2] : null;
  const visibleFolders = currentExplorerFolder?.children || [];

  const getFolderLabel = (folder) =>
    folder?.id === rootFolder?.id ? 'Workspace' : folder?.name || 'Untitled folder';

  const closeModals = () => {
    setShowCreateModal(false);
    setShowRenameModal(false);
    setShowMoveModal(false);
    setShowDeleteModal(false);
    setModalError('');
    setActiveFolder(null);
    setIsSubmitting(false);
  };

  const openCreateModal = () => {
    setCreateName('');
    setCreateParentId(selectedFolderId || rootFolder?.id || '');
    setModalError('');
    setShowCreateModal(true);
  };

  const openRenameModal = (folder) => {
    setActiveFolder(folder);
    setRenameName(folder.name || '');
    setModalError('');
    setShowRenameModal(true);
  };

  const openMoveModal = (folder) => {
    setActiveFolder(folder);
    setMoveParentId(folder.parentId || rootFolder?.id || '');
    setModalError('');
    setShowMoveModal(true);
  };

  const openDeleteModal = (folder) => {
    setActiveFolder(folder);
    setModalError('');
    setShowDeleteModal(true);
  };

  const handleCreateFolder = async () => {
    if (!createName.trim()) {
      setModalError('Please enter a folder name.');
      return;
    }

    try {
      setIsSubmitting(true);
      const targetParentId = createParentId || rootFolder?.id;
      await createFolder(createName.trim(), targetParentId);
      await refreshFolders(targetParentId);
      goToFolder(targetParentId);
      closeModals();
    } catch (error) {
      setModalError(getApiErrorMessage(error, 'Failed to create folder.'));
      setIsSubmitting(false);
    }
  };

  const handleRenameFolder = async () => {
    if (!activeFolder || !renameName.trim()) {
      setModalError('Please enter a folder name.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateFolder(activeFolder.id, renameName.trim(), activeFolder.parentId);
      await refreshFolders(activeFolder.id);
      closeModals();
    } catch (error) {
      setModalError(getApiErrorMessage(error, 'Failed to rename folder.'));
      setIsSubmitting(false);
    }
  };

  const handleMoveFolder = async () => {
    if (!activeFolder) {
      return;
    }

    try {
      setIsSubmitting(true);
      const targetParentId = moveParentId || rootFolder?.id;
      await moveFolder(activeFolder.id, targetParentId);
      await refreshFolders(activeFolder.id);
      closeModals();
    } catch (error) {
      setModalError(getApiErrorMessage(error, 'Failed to move folder.'));
      setIsSubmitting(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!activeFolder) {
      return;
    }

    try {
      setIsSubmitting(true);
      const nextFolderId = activeFolder.parentId || rootFolder?.id;
      await deleteFolder(activeFolder.id);
      await refreshFolders(nextFolderId);

      if (selectedFolderId === activeFolder.id) {
        goToFolder(nextFolderId);
      }

      closeModals();
    } catch (error) {
      setModalError(getApiErrorMessage(error, 'Failed to delete folder.'));
      setIsSubmitting(false);
    }
  };

  const modalFooter = (label, onConfirm, variant = 'primary') => (
    <>
      <AppButton variant="secondary" onClick={closeModals} disabled={isSubmitting}>
        Cancel
      </AppButton>
      <AppButton variant={variant} onClick={() => void onConfirm()} loading={isSubmitting}>
        {label}
      </AppButton>
    </>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="glass rounded-3xl border border-white/60 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-600">
                Thư mục
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
                {getFolderLabel(currentExplorerFolder || rootFolder)}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Giữ cây thư mục gọn gàng để upload, di chuyển, xóa, và đánh dấu
                yêu thích luôn rõ ràng khi demo.
              </p>
            </div>

            <AppButton
              onClick={openCreateModal}
              leadingIcon={<FolderPlus className="h-4.5 w-4.5" />}
            >
              Thư mục mới
            </AppButton>
          </div>

          {parentFolder ? (
            <button
              type="button"
              onClick={() => goToFolder(parentFolder.id)}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:text-brand-600"
            >
              <ChevronLeft className="h-4 w-4" />
              Quay lại
            </button>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {folderPath.map((folder, index) => {
              const isCurrent = index === folderPath.length - 1;

              return (
                <Fragment key={folder.id}>
                  {index > 0 ? <ChevronRight className="h-4 w-4 text-slate-300" /> : null}
                  <button
                    type="button"
                    onClick={() => goToFolder(folder.id)}
                    disabled={isCurrent}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] transition-all',
                      isCurrent
                        ? 'bg-brand-900 text-white shadow-md'
                        : 'bg-white text-slate-500 hover:text-brand-600',
                    )}
                  >
                    {getFolderLabel(folder)}
                  </button>
                </Fragment>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          {foldersLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100/50 flex items-center gap-4"
              >
                <AppSkeleton className="h-12 w-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <AppSkeleton className="h-4 w-32" />
                  <AppSkeleton className="h-4 w-24" />
                </div>
              </div>
            ))
          ) : rootFolder ? (
            visibleFolders.length > 0 ? (
              visibleFolders.map((folder, index) => {
                const isActive = selectedFolderId === folder.id;
                const childCount = folder.children?.length || 0;

                return (
                  <div
                    key={folder.id}
                    className={cn(
                      'bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-sm border border-slate-100/50 flex items-start gap-4 transition-all group',
                      isActive && 'border-brand-200 shadow-md',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => goToFolder(folder.id)}
                      className="flex min-w-0 flex-1 items-start gap-4 text-left"
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors',
                          isActive
                            ? 'bg-brand-900 text-white'
                            : toneForIndex(index),
                        )}
                      >
                        <FolderClosed size={24} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-sm truncate">
                          {getFolderLabel(folder)}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                          {childCount > 0 ? `${childCount} subfolders` : 'Open folder'}
                          {childCount > 0 ? `${childCount} thư mục con` : 'Mở thư mục'}
                        </p>
                      </div>
                    </button>

                    <div className="flex gap-2">
                      <FolderActionButton
                        label="Rename folder"
                        onClick={() => openRenameModal(folder)}
                        icon={<PencilLine className="h-4 w-4" />}
                      />
                      <FolderActionButton
                        label="Move folder"
                        onClick={() => openMoveModal(folder)}
                        icon={<ArrowRightLeft className="h-4 w-4" />}
                      />
                      <FolderActionButton
                        label="Delete folder"
                        onClick={() => openDeleteModal(folder)}
                        tone="danger"
                        icon={<Trash2 className="h-4 w-4" />}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <AppEmptyState
                icon={<FolderClosed className="h-7 w-7" />}
                title="No subfolders yet"
                description="Create the first folder inside this branch to start structuring the workspace."
                action={(
                  <AppButton
                    onClick={openCreateModal}
                    leadingIcon={<FolderPlus className="h-4.5 w-4.5" />}
                  >
                    Create folder
                  </AppButton>
                )}
              />
            )
          ) : (
            <AppEmptyState
              icon={<FolderClosed className="h-7 w-7" />}
              title="Workspace unavailable"
              description="Folders will appear here after the initial tree is loaded."
            />
          )}
        </div>
      </div>

      <AppModal
        open={showCreateModal}
        onClose={closeModals}
        eyebrow="Folder action"
        title="Tạo thư mục"
        description="Thêm một thư mục mới vào đúng nhánh bạn đang làm việc."
        footer={modalFooter('Tạo thư mục', handleCreateFolder)}
      >
        <div className="space-y-4">
          {modalError ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {modalError}
            </div>
          ) : null}
          <AppInput
            label="Tên thư mục"
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
            placeholder="Phân tích thiết kế hệ thống"
            autoFocus
          />
          <SelectField
            label="Thư mục cha"
            value={createParentId}
            onChange={(event) => setCreateParentId(event.target.value)}
            options={folderOptions}
          />
        </div>
      </AppModal>

      <AppModal
        open={showRenameModal}
        onClose={closeModals}
        eyebrow="Folder action"
        title="Đổi tên thư mục"
        description="Dùng tên rõ ràng để workspace dễ quét và dễ bảo vệ hơn."
        footer={modalFooter('Lưu tên mới', handleRenameFolder)}
      >
        <div className="space-y-4">
          {modalError ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {modalError}
            </div>
          ) : null}
          <AppInput
            label="Tên mới"
            value={renameName}
            onChange={(event) => setRenameName(event.target.value)}
            placeholder="Tên thư mục đã cập nhật"
            autoFocus
          />
        </div>
      </AppModal>

      <AppModal
        open={showMoveModal}
        onClose={closeModals}
        eyebrow="Folder action"
        title="Di chuyển thư mục"
        description="Chọn thư mục cha mới cho nhánh tài liệu này."
        footer={modalFooter('Di chuyển thư mục', handleMoveFolder)}
      >
        <div className="space-y-4">
          {modalError ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {modalError}
            </div>
          ) : null}
          <SelectField
            label="Thư mục đích"
            value={moveParentId}
            onChange={(event) => setMoveParentId(event.target.value)}
            options={folderOptions.filter((folder) => folder.id !== activeFolder?.id)}
          />
        </div>
      </AppModal>

      <AppModal
        open={showDeleteModal}
        onClose={closeModals}
        eyebrow="Folder action"
        title="Xóa thư mục"
        description="Tài liệu và thư mục con sẽ được đưa về nhánh cha để không mất dữ liệu."
        footer={modalFooter('Xóa thư mục', handleDeleteFolder, 'danger')}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm leading-7 text-rose-700">
            Xóa <strong>{activeFolder?.name}</strong>. Backend sẽ dời toàn bộ nội dung
            con về thư mục cha để workspace vẫn nhất quán.
          </div>

          {modalError ? (
            <div className="rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm font-semibold text-rose-700">
              {modalError}
            </div>
          ) : null}
        </div>
      </AppModal>
    </>
  );
};

export default FoldersPanel;
