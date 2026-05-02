import { Fragment, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
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

const MotionDiv = motion.div;
const MotionButton = motion.button;

const explorerVariants = {
  enter: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 18 : -18,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -18 : 18,
  }),
};

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
      'inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all hover:bg-white hover:shadow-sm sm:h-9 sm:w-9 sm:rounded-2xl',
      tone === 'danger'
        ? 'text-rose-500 hover:text-rose-600'
        : 'text-slate-600 hover:text-brand-900',
    )}
  >
    {icon}
  </button>
);

const SelectField = ({ label, onChange, options, value }) => (
  <label className="flex w-full flex-col gap-2">
    <span className="pl-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">
      {label}
    </span>
    <select
      value={value}
      onChange={onChange}
      className="control-surface w-full appearance-none rounded-[var(--radius-control)] px-4 py-3.5 pr-10 text-sm font-semibold text-slate-900 outline-none transition-all duration-300 focus:border-brand-600 focus:bg-white focus:shadow-[var(--shadow-medium)] focus:ring-2 focus:ring-brand-600/20"
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
  const [navigationDirection, setNavigationDirection] = useState(1);
  const shouldReduceMotion = useReducedMotion();

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
  const currentPathDepth = folderPath.length || 1;
  const activeExplorerKey = currentExplorerFolder?.id || rootFolder?.id || 'workspace-root';
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

  const getFolderLabel = (folder) =>
    folder?.id === rootFolder?.id ? 'Workspace' : folder?.name || 'Untitled folder';

  const getTargetDepth = (folderId) => {
    if (!rootFolder || !folderId || folderId === rootFolder.id) return 1;
    const targetPath = findFolderPath([rootFolder], folderId);
    return targetPath.length || currentPathDepth;
  };

  const goToFolder = (folderId) => {
    if (!rootFolder) return;

    const normalizedFolderId =
      !folderId || folderId === rootFolder.id ? null : folderId;

    if (normalizedFolderId === selectedFolderId) return;

    const targetDepth = getTargetDepth(normalizedFolderId || rootFolder.id);
    setNavigationDirection(targetDepth >= currentPathDepth ? 1 : -1);
    selectFolder(normalizedFolderId);
    onFolderSelectionChange?.(normalizedFolderId);
  };

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
      setModalError(
        getApiErrorMessage(
          error,
          'The folder could not be created. Please check the name and try again.',
        ),
      );
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
      setModalError(
        getApiErrorMessage(
          error,
          'The folder could not be renamed. Please check the name and try again.',
        ),
      );
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
      setModalError(
        getApiErrorMessage(
          error,
          'The folder could not be moved. Please choose another destination and try again.',
        ),
      );
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
      setModalError(
        getApiErrorMessage(
          error,
          'The folder could not be deleted. Please move or remove its contents first.',
        ),
      );
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
      <div className="flex h-full min-h-[360px] flex-col sm:min-h-[420px] xl:min-h-[520px]">
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-900 text-white shadow-[var(--shadow-brand)]">
                <FolderOpen size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-600">
                  Folders
                </p>
                <div className="relative h-7 min-w-0 overflow-hidden">
                  <AnimatePresence mode="wait" initial={false} custom={navigationDirection}>
                    <MotionDiv
                      key={`title-${activeExplorerKey}`}
                      custom={navigationDirection}
                      variants={explorerVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={transition}
                      className="absolute inset-0 min-w-0"
                    >
                      <h2 className="truncate text-xl font-extrabold leading-7 text-slate-900">
                        {getFolderLabel(currentExplorerFolder || rootFolder)}
                      </h2>
                    </MotionDiv>
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs font-bold text-slate-600">
              {totalFolderCount} folders - {visibleFolders.length} branches
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            aria-label="Create folder"
            title="Create folder"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-900 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-900 hover:text-white"
          >
            <FolderPlus size={20} />
          </button>
        </header>

        <div className="mb-4 min-h-[2.15rem] overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={navigationDirection}>
            <MotionDiv
              key={`crumbs-${activeExplorerKey}`}
              custom={navigationDirection}
              variants={explorerVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="flex flex-wrap items-center gap-1.5"
            >
              {folderPath.map((folder, index) => {
                const isCurrent = index === folderPath.length - 1;

                return (
                  <Fragment key={folder.id}>
                    {index > 0 ? <ChevronRight className="h-4 w-4 text-slate-400" /> : null}
                    <button
                      type="button"
                      onClick={() => goToFolder(folder.id)}
                      disabled={isCurrent}
                      title={getFolderLabel(folder)}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={cn(
                        'inline-flex max-w-[150px] items-center gap-1.5 truncate rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/25',
                        isCurrent
                          ? 'bg-brand-900 text-white shadow-sm'
                          : 'border border-slate-300 bg-white text-slate-700 hover:border-brand-200 hover:text-brand-900 hover:shadow-sm',
                      )}
                    >
                      {index === 0 ? <Home size={12} /> : null}
                      <span className="truncate">{getFolderLabel(folder)}</span>
                    </button>
                  </Fragment>
                );
              })}
            </MotionDiv>
          </AnimatePresence>
        </div>

        <div className={`mb-3 overflow-hidden transition-all duration-200 ${parentFolder ? 'h-10' : 'h-0'}`}>
          <AnimatePresence mode="wait" initial={false}>
            {parentFolder ? (
              <MotionButton
                key="back-btn"
                type="button"
                onClick={() => goToFolder(parentFolder.id)}
                initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
                transition={transition}
                className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 shadow-sm transition-colors hover:border-brand-200 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/25"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </MotionButton>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={navigationDirection}>
            <MotionDiv
              key={`explorer-${activeExplorerKey}-${foldersLoading ? 'loading' : 'ready'}`}
              custom={navigationDirection}
              variants={explorerVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="h-full overflow-y-auto pr-1"
              aria-live="polite"
            >
              <div className="space-y-2">
                {foldersLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-white p-3"
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
                        <MotionDiv
                          key={folder.id}
                          layout
                          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            ...transition,
                            delay: shouldReduceMotion ? 0 : Math.min(index * 0.025, 0.1),
                          }}
                          className={cn(
                            'group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 transition-all hover:border-brand-200 hover:bg-white hover:shadow-sm',
                            isActive && 'border-brand-200 bg-white shadow-sm',
                          )}
                        >
                          <MotionButton
                            type="button"
                            onClick={() => goToFolder(folder.id)}
                            whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/25"
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
                              <span className="mt-0.5 block text-xs font-bold text-slate-600">
                                {childCount > 0 ? `${childCount} subfolders` : 'Open folder'}
                              </span>
                            </span>
                          </MotionButton>

                          <div className="flex shrink-0 opacity-100 transition-opacity xl:opacity-0 xl:group-hover:opacity-100 xl:group-focus-within:opacity-100">
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
                        </MotionDiv>
                      );
                    })
                  ) : (
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center transition-all hover:border-brand-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/25"
                    >
                      <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-900 shadow-sm">
                        <FolderPlus size={24} />
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">No subfolders yet</span>
                      <span className="mt-1 text-xs font-bold text-slate-600">Create folders to organize documents.</span>
                    </button>
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
                    <span className="text-sm font-extrabold text-slate-900">Workspace is not ready</span>
                  </div>
                )}
              </div>
            </MotionDiv>
          </AnimatePresence>
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
