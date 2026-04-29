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
        Hủy
      </AppButton>
      <AppButton variant="danger" onClick={onConfirmDelete} loading={deleting}>
        Xóa tài liệu
      </AppButton>
    </>
  );

  const moveFooter = (
    <>
      <AppButton variant="secondary" onClick={onCloseMove} disabled={moving}>
        Hủy
      </AppButton>
      <AppButton onClick={onConfirmMove} loading={moving}>
        Di chuyển tài liệu
      </AppButton>
    </>
  );

  const renameFooter = (
    <>
      <AppButton variant="secondary" onClick={onCloseRename} disabled={renaming}>
        Hủy
      </AppButton>
      <AppButton onClick={onConfirmRename} loading={renaming}>
        Lưu tên mới
      </AppButton>
    </>
  );

  return (
    <>
      <AppModal
        open={Boolean(renameTarget)}
        onClose={onCloseRename}
        title="Đổi tên tài liệu"
        description="Nhập tên mới cho tài liệu."
        footer={renameFooter}
      >
        <div className="space-y-4">
          <ErrorBox message={renameError} />
          <AppInput
            label="Tên tài liệu"
            value={renameName}
            onChange={onRenameNameChange}
            placeholder="Tên tài liệu mới"
            autoFocus
          />
        </div>
      </AppModal>

      <AppModal
        open={Boolean(moveTarget)}
        onClose={onCloseMove}
        title="Di chuyển tài liệu"
        description="Chọn thư mục đích."
        footer={moveFooter}
      >
        <div className="space-y-4">
          <ErrorBox message={moveError} />
          <FolderSelect
            label="Thư mục đích"
            value={moveDestinationId}
            onChange={onMoveDestinationChange}
            options={folderOptions}
          />
        </div>
      </AppModal>

      <AppModal
        open={Boolean(deleteTarget)}
        onClose={onCloseDelete}
        title="Xóa tài liệu"
        description="Tài liệu sẽ bị xóa khỏi workspace của bạn."
        footer={deleteFooter}
      >
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50 px-5 py-4 text-sm leading-7 text-rose-700">
            Xóa <strong>{deleteTarget?.title || 'tài liệu này'}</strong>?
          </div>
          <ErrorBox message={deleteError} />
        </div>
      </AppModal>
    </>
  );
};

export default WorkspaceDocumentModals;
