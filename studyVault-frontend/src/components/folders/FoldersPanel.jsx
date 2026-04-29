import { Fragment, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  FolderClosed,
  FolderOpen,
  FolderPlus,
  Home,
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
  AppInput,
  AppModal,
  AppSkeleton,
} from '@/components/ui/index.js';
import { cn } from '@/lib/utils.js';
import { getApiErrorMessage } from '../../utils/apiError.js';

const findFolderPath = (folders, folderId, trail = []) => {
  for (const folder of folders) {
    const nextTrail = [...trail, folder];

    if (folder.id === folderId) return nextTrail;

    const nestedTrail = findFolderPath(folder.children || [], folderId, nextTrail);
    if (nestedTrail.length > 0) return nestedTrail;
  }

  return [];
};

const buildFolderOptionLabel = (folder) => {
  if (folder.depth === 0) return 'Workspace';
  return `${'-- '.repeat(folder.depth)}${folder.name}`;
};

const toneForIndex = (index) => {
  const tones = [
    'bg-brand-50 text-brand-600',
    'bg-blue-50 text-blue-600',
    'bg-emerald-50 text-emerald-600',
    'bg-amber-50 text-amber-700',
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
      'inline-flex h-9 w-9 items-center justify-center rounded-2xl transition-all hover:bg-white hover:shadow-sm',
      tone === 'danger'
        ? 'text-rose-500 hover:text-rose-600'
        : 'text-slate-400 hover:text-brand-600',
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
      className="control-surface w-full appearance-none rounded-[var(--radius-control)] px-4 py-3.5 pr-10 text-sm font-semibold text-slate-800 outline-none transition-all duration-300 focus:border-brand-200 focus:bg-white focus:shadow-[var(--shadow-medium)] focus:ring-2 focus:ring-brand-500/15"
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
    if (!rootFolder) return [];

    const activeFolderId = selectedFolderId || rootFolder.id;
    const nextPath = findFolderPath([rootFolder], activeFolderId);
    return nextPath.length > 0 ? nextPath : [rootFolder];
  }, [rootFolder, selectedFolderId]);

  const currentExplorerFolder = folderPath[folderPath.length - 1] || rootFolder;
  const parentFolder = folderPath.length > 1 ? folderPath[folderPath.length - 2] : null;
  const visibleFolders = currentExplorerFolder?.children || [];
  const totalFolderCount = Math.max(folderOptions.length - 1, 0);

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
      setModalError(getApiErrorMessage(error, 'Could not create folder.'));
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
      setModalError(getApiErrorMessage(error, 'Could not rename folder.'));
      setIsSubmitting(false);
    }
  };

  const handleMoveFolder = async () => {
    if (!activeFolder) return;

    try {
      setIsSubmitting(true);
      const targetParentId = moveParentId || rootFolder?.id;
      await moveFolder(activeFolder.id, targetParentId);
      await refreshFolders(activeFolder.id);
      closeModals();
    } catch (error) {
      setModalError(getApiErrorMessage(error, 'Could not move folder.'));
      setIsSubmitting(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!activeFolder) return;

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
      setModalError(getApiErrorMessage(error, 'Could not delete folder.'));
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
      <div className="flex h-full min-h-[520px] flex-col">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-900 text-white shadow-[var(--shadow-brand)]">
                <FolderOpen size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-600">
                  Folders
                </p>
                <h2 className="truncate text-xl font-extrabold text-slate-900">
                  {getFolderLabel(currentExplorerFolder || rootFolder)}
                </h2>
              </div>
            </div>
            <p className="mt-3 text-xs font-bold text-slate-400">
              {totalFolderCount} folders · {visibleFolders.length} branches
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            aria-label="Create folder"
            title="Create folder"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-white/80 transition-all hover:-translate-y-0.5 hover:bg-brand-900 hover:text-white"
          >
            <FolderPlus size={20} />
          </button>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {folderPath.map((folder, index) => {
            const isCurrent = index === folderPath.length - 1;

            return (
              <Fragment key={folder.id}>
                {index > 0 ? <ChevronRight className="h-4 w-4 text-slate-300" /> : null}
                <button
                  type="button"
                  onClick={() => goToFolder(folder.id)}
                  disabled={isCurrent}
                  title={getFolderLabel(folder)}
                  className={cn(
                    'inline-flex max-w-[150px] items-center gap-1.5 truncate rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] transition-all',
                    isCurrent
                      ? 'bg-brand-900 text-white shadow-sm'
                      : 'bg-white/70 text-slate-500 hover:bg-white hover:text-brand-600',
                  )}
                >
                  {index === 0 ? <Home size={12} /> : null}
                  <span className="truncate">{getFolderLabel(folder)}</span>
                </button>
              </Fragment>
            );
          })}
        </div>

        {parentFolder ? (
          <button
            type="button"
            onClick={() => goToFolder(parentFolder.id)}
            className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-white/75 px-3 py-2 text-xs font-extrabold text-slate-500 shadow-sm transition-colors hover:text-brand-600"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        ) : null}

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {foldersLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/70 bg-white/60 p-3"
              >
                <div className="flex items-center gap-3">
                  <AppSkeleton className="h-11 w-11 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <AppSkeleton className="h-4 w-28" />
                    <AppSkeleton className="h-3 w-20" />
                  </div>
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
                      'group flex items-center gap-3 rounded-2xl border border-white/70 bg-white/58 px-3 py-3 transition-all hover:border-brand-100 hover:bg-white hover:shadow-sm',
                      isActive && 'border-brand-200 bg-white shadow-sm',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => goToFolder(folder.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                          isActive ? 'bg-brand-900 text-white' : toneForIndex(index),
                        )}
                      >
                        <FolderClosed size={20} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-extrabold text-slate-900">
                          {getFolderLabel(folder)}
                        </span>
                        <span className="mt-0.5 block text-xs font-bold text-slate-400">
                          {childCount > 0 ? `${childCount} subfolders` : 'Open folder'}
                        </span>
                      </span>
                    </button>

                    <div className="flex shrink-0 opacity-100 transition-opacity xl:opacity-0 xl:group-hover:opacity-100">
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
              <button
                type="button"
                onClick={openCreateModal}
                className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/80 bg-white/50 px-5 py-8 text-center transition-all hover:border-brand-200 hover:bg-white/75"
              >
                <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-500 shadow-sm">
                  <FolderPlus size={24} />
                </span>
                <span className="text-sm font-extrabold text-slate-900">No subfolders yet</span>
                <span className="mt-1 text-xs font-bold text-slate-400">Create folders to organize documents.</span>
              </button>
            )
          ) : (
            <div className="rounded-2xl border border-dashed border-white/80 bg-white/50 px-5 py-8 text-center">
              <span className="text-sm font-extrabold text-slate-900">Workspace is not ready</span>
            </div>
          )}
        </div>
      </div>

      <AppModal
        open={showCreateModal}
        onClose={closeModals}
        title="Create folder"
        description="Choose a name and save location."
        footer={modalFooter('Create folder', handleCreateFolder)}
      >
        <div className="space-y-4">
          {modalError ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {modalError}
            </div>
          ) : null}
          <AppInput
            label="Folder name"
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
            placeholder="Enter folder name"
            autoFocus
          />
          <SelectField
            label="Parent folder"
            value={createParentId}
            onChange={(event) => setCreateParentId(event.target.value)}
            options={folderOptions}
          />
        </div>
      </AppModal>

      <AppModal
        open={showRenameModal}
        onClose={closeModals}
        title="Rename folder"
        description="Enter a new folder name."
        footer={modalFooter('Save new name', handleRenameFolder)}
      >
        <div className="space-y-4">
          {modalError ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {modalError}
            </div>
          ) : null}
          <AppInput
            label="New name"
            value={renameName}
            onChange={(event) => setRenameName(event.target.value)}
            placeholder="Updated folder name"
            autoFocus
          />
        </div>
      </AppModal>

      <AppModal
        open={showMoveModal}
        onClose={closeModals}
        title="Move folder"
        description="Choose a destination folder."
        footer={modalFooter('Move folder', handleMoveFolder)}
      >
        <div className="space-y-4">
          {modalError ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {modalError}
            </div>
          ) : null}
          <SelectField
            label="Destination folder"
            value={moveParentId}
            onChange={(event) => setMoveParentId(event.target.value)}
            options={folderOptions.filter((folder) => folder.id !== activeFolder?.id)}
          />
        </div>
      </AppModal>

      <AppModal
        open={showDeleteModal}
        onClose={closeModals}
        title="Delete folder"
        footer={modalFooter('Delete folder', handleDeleteFolder, 'danger')}
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            Delete <strong>{activeFolder?.name}</strong>?
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
