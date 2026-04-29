import { AppButton, AppInput, AppModal } from '@/components/ui/index.js';

const selectClassName =
  'control-surface w-full rounded-[var(--radius-control)] px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition-all duration-300 focus:border-brand-200 focus:bg-white focus:shadow-[var(--shadow-medium)] focus:ring-2 focus:ring-brand-500/15';

const FolderSelect = ({ label, onChange, options, value }) => (
  <label className="flex w-full flex-col gap-2">
    <span className="pl-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
      {label}
    </span>
    <select value={value} onChange={onChange} className={selectClassName}>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.depth === 0 ? 'Workspace' : `${'-- '.repeat(option.depth)}${option.name}`}
        </option>
      ))}
    </select>
  </label>
);

const ErrorBox = ({ message }) =>
  message ? (
    <div className="rounded-[1.4rem] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
      {message}
    </div>
  ) : null;

const WorkspaceDocumentModals = ({
  deleteError,
  deleteTarget,
  deleting,
  folderOptions,
  moveDestinationId,
  moveError,
  moveTarget,
  moving,
  onCloseDelete,
  onCloseMove,
  onCloseRename,
  onConfirmDelete,
  onConfirmMove,
  onConfirmRename,
  onMoveDestinationChange,
  onRenameNameChange,
  renameError,
  renameName,
  renameTarget,
  renaming,
}) => {
  const deleteFooter = (
    <>
      <AppButton variant="secondary" onClick={onCloseDelete} disabled={deleting}>
        Cancel
      </AppButton>
      <AppButton variant="danger" onClick={onConfirmDelete} loading={deleting}>
        Delete document
      </AppButton>
    </>
  );

  const moveFooter = (
    <>
      <AppButton variant="secondary" onClick={onCloseMove} disabled={moving}>
        Cancel
      </AppButton>
      <AppButton onClick={onConfirmMove} loading={moving}>
        Move document
      </AppButton>
    </>
  );

  const renameFooter = (
    <>
      <AppButton variant="secondary" onClick={onCloseRename} disabled={renaming}>
        Cancel
      </AppButton>
      <AppButton onClick={onConfirmRename} loading={renaming}>
        Save new name
      </AppButton>
    </>
  );

  return (
    <>
      <AppModal
        open={Boolean(renameTarget)}
        onClose={onCloseRename}
        title="Rename document"
        description="Enter a new document name."
        footer={renameFooter}
      >
        <div className="space-y-4">
          <ErrorBox message={renameError} />
          <AppInput
            label="Document name"
            value={renameName}
            onChange={onRenameNameChange}
            placeholder="New document name"
            autoFocus
          />
        </div>
      </AppModal>

      <AppModal
        open={Boolean(moveTarget)}
        onClose={onCloseMove}
        title="Move document"
        description="Choose a destination folder."
        footer={moveFooter}
      >
        <div className="space-y-4">
          <ErrorBox message={moveError} />
          <FolderSelect
            label="Destination folder"
            value={moveDestinationId}
            onChange={onMoveDestinationChange}
            options={folderOptions}
          />
        </div>
      </AppModal>

      <AppModal
        open={Boolean(deleteTarget)}
        onClose={onCloseDelete}
        title="Delete document"
        description="This document will be removed from your workspace."
        footer={deleteFooter}
      >
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50 px-5 py-4 text-sm leading-7 text-rose-700">
            Delete <strong>{deleteTarget?.title || 'this document'}</strong>?
          </div>
          <ErrorBox message={deleteError} />
        </div>
      </AppModal>
    </>
  );
};

export default WorkspaceDocumentModals;
