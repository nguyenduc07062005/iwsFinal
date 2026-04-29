import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownAZ,
  Clock,
  CloudUpload,
  FolderClosed,
  HardDrive,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { useDocumentsContext } from '../components/DocumentsContext.jsx';
import UploadModal from '../components/documents/UploadModal.jsx';
import FoldersPanel from '../components/folders/FoldersPanel.jsx';
import DocumentLibraryPanel from '../components/workspace/DocumentLibraryPanel.jsx';
import WorkspaceDocumentModals from '../components/workspace/WorkspaceDocumentModals.jsx';
import { addDocumentToFolder } from '../service/folderAPI.js';
import {
  deleteDocument,
  downloadDocumentFile,
  getDocuments,
  toggleFavorite,
  updateDocumentName,
  uploadDocument,
} from '../service/documentAPI.js';
import { cn } from '@/lib/utils.js';
import { getApiErrorMessage } from '../utils/apiError.js';

const DEFAULT_LIMIT = 12;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'desc';
const VALID_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'title', 'docDate', 'fileSize']);
const VALID_SORT_ORDERS = new Set(['asc', 'desc']);
const VALID_TYPES = new Set(['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif']);

const TYPE_FILTERS = [
  { label: 'Tất cả', value: '', description: 'Hiển thị mọi loại tài liệu' },
  { label: 'PDF', value: 'pdf', description: 'Chỉ hiển thị file PDF' },
  { label: 'Word', value: 'docx', description: 'Chỉ hiển thị file DOCX' },
  { label: 'Text', value: 'txt', description: 'Chỉ hiển thị file TXT' },
];

const SORT_OPTIONS = [
  {
    label: 'Mới tải lên',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    description: 'Tài liệu được upload gần đây nhất đứng trước',
    Icon: Clock,
  },
  {
    label: 'Cập nhật mới',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    description: 'Tài liệu vừa được chỉnh sửa hoặc xử lý gần đây nhất đứng trước',
    Icon: RefreshCw,
  },
  {
    label: 'Tên A-Z',
    sortBy: 'title',
    sortOrder: 'asc',
    description: 'Sắp xếp theo tên tài liệu từ A đến Z',
    Icon: ArrowDownAZ,
  },
  {
    label: 'Dung lượng lớn',
    sortBy: 'fileSize',
    sortOrder: 'desc',
    description: 'File có dung lượng lớn hơn đứng trước',
    Icon: HardDrive,
  },
];

const MotionDiv = motion.div;
const MotionButton = motion.button;

const readPositiveInt = (value, fallback) => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const getFolderLabel = (folder, rootFolder) => {
  if (!folder) return 'Workspace';
  return folder.id === rootFolder?.id ? 'Workspace' : folder.name || 'Workspace';
};

const WorkspacePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    folderOptions,
    foldersLoading,
    refreshFolders,
    rootFolder,
    selectedFolder,
    selectedFolderId,
    selectFolder,
  } = useDocumentsContext();

  const [flash, setFlash] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(searchParams.get('openUpload') === 'true');
  const [viewMode, setViewMode] = useState('table');

  const [renameTarget, setRenameTarget] = useState(null);
  const [renameName, setRenameName] = useState('');
  const [renameError, setRenameError] = useState('');
  const [renaming, setRenaming] = useState(false);

  const [moveTarget, setMoveTarget] = useState(null);
  const [moveDestinationId, setMoveDestinationId] = useState('');
  const [moveError, setMoveError] = useState('');
  const [moving, setMoving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  });

  const [searchInput, setSearchInput] = useState(searchParams.get('keyword') || '');
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  const page = readPositiveInt(searchParams.get('page'), 1);
  const limit = readPositiveInt(searchParams.get('limit'), DEFAULT_LIMIT);
  const sortBy = VALID_SORT_FIELDS.has(searchParams.get('sortBy')) ? searchParams.get('sortBy') : DEFAULT_SORT_BY;
  const sortOrder = VALID_SORT_ORDERS.has(searchParams.get('sortOrder')) ? searchParams.get('sortOrder') : DEFAULT_SORT_ORDER;
  const type = VALID_TYPES.has(searchParams.get('type')) ? searchParams.get('type') : '';
  const keyword = (searchParams.get('keyword') || '').trim();
  const favorite = searchParams.get('favorite') === 'true';
  const folderIdParam = searchParams.get('folderId') || '';

  const activeFolder = selectedFolder || rootFolder;
  const activeFolderId = activeFolder?.id || null;
  const activeFolderLabel = getFolderLabel(activeFolder, rootFolder);
  const activeTypeOption = TYPE_FILTERS.find((option) => option.value === type) || TYPE_FILTERS[0];

  useEffect(() => {
    if (!flash) return undefined;
    const timer = window.setTimeout(() => setFlash(null), 4500);
    return () => window.clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    if (searchParams.get('openUpload') !== 'true') return;

    setShowUploadModal(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('openUpload');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setSearchInput(keyword);
  }, [keyword]);

  useEffect(() => {
    if (!rootFolder) return;
    const normalizedFolderId = folderIdParam && folderIdParam !== rootFolder.id ? folderIdParam : null;
    if (selectedFolderId !== normalizedFolderId) {
      selectFolder(normalizedFolderId);
    }
  }, [folderIdParam, rootFolder, selectFolder, selectedFolderId]);

  const updateQuery = (updates, options = {}) => {
    const { resetPage = false } = options;
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      const shouldRemove =
        value === undefined ||
        value === null ||
        value === '' ||
        (key === 'page' && Number(value) <= 1) ||
        (key === 'limit' && Number(value) === DEFAULT_LIMIT) ||
        (key === 'sortBy' && value === DEFAULT_SORT_BY) ||
        (key === 'sortOrder' && value === DEFAULT_SORT_ORDER) ||
        (key === 'favorite' && value !== true) ||
        (key === 'folderId' && rootFolder && value === rootFolder.id);

      if (shouldRemove) {
        nextParams.delete(key);
        return;
      }

      nextParams.set(key, String(value));
    });

    if (resetPage) nextParams.delete('page');
    setSearchParams(nextParams);
  };

  const refreshList = () => setReloadKey((current) => current + 1);

  useEffect(() => {
    if (!rootFolder || !activeFolderId) return;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const loadDocuments = async () => {
      try {
        setDocumentsLoading(true);
        const result = await getDocuments({
          favorite: favorite ? true : undefined,
          folderId: activeFolderId,
          keyword: keyword || undefined,
          limit,
          page,
          sortBy,
          sortOrder,
          type: type || undefined,
        });

        if (requestId !== requestIdRef.current) return;

        setDocuments(result.documents || []);
        setPagination(
          result.pagination || {
            currentPage: page,
            hasNextPage: false,
            hasPreviousPage: false,
            limit,
            total: 0,
            totalPages: 1,
          },
        );
        setDocumentsError('');
      } catch (requestError) {
        if (requestId !== requestIdRef.current) return;
        setDocuments([]);
        setPagination({
          currentPage: page,
          hasNextPage: false,
          hasPreviousPage: false,
          limit,
          total: 0,
          totalPages: 1,
        });
        setDocumentsError(getApiErrorMessage(requestError, 'Không tải được danh sách tài liệu.'));
      } finally {
        if (requestId === requestIdRef.current) {
          setDocumentsLoading(false);
        }
      }
    };

    void loadDocuments();
  }, [activeFolderId, favorite, keyword, limit, page, reloadKey, rootFolder, sortBy, sortOrder, type]);

  const showSuccess = (message) => setFlash({ tone: 'success', message });
  const showError = (message) => setFlash({ tone: 'error', message });

  const getFallbackPage = () => (documents.length === 1 && page > 1 ? page - 1 : page);

  const handleFolderSelectionChange = (folderId) => {
    if (!rootFolder) return;
    const normalizedFolderId = folderId && folderId !== rootFolder.id ? folderId : null;
    selectFolder(normalizedFolderId);
    updateQuery({ folderId: normalizedFolderId || undefined, favorite: undefined }, { resetPage: true });
  };

  const handleApplySearch = () => {
    updateQuery({ keyword: searchInput.trim() || undefined }, { resetPage: true });
  };

  const handleUpload = async (file, title, folderId) => {
    const targetFolderId = folderId || activeFolderId || rootFolder?.id;
    await uploadDocument(file, title, targetFolderId);
    await refreshFolders(targetFolderId);
    refreshList();
    showSuccess('Đã tải tài liệu lên workspace.');
  };

  const handleToggleFavorite = async (documentId) => {
    try {
      await toggleFavorite(documentId);
      refreshList();
    } catch (requestError) {
      showError(getApiErrorMessage(requestError, 'Không cập nhật được yêu thích.'));
    }
  };

  const handleDownloadDocument = async (documentId, title) => {
    try {
      await downloadDocumentFile(documentId, title);
    } catch (requestError) {
      showError(getApiErrorMessage(requestError, 'Không tải xuống được tài liệu.'));
    }
  };

  const handleRenameDocumentConfirm = async () => {
    if (!renameTarget) return;
    if (!renameName.trim()) {
      setRenameError('Vui lòng nhập tên tài liệu.');
      return;
    }

    try {
      setRenaming(true);
      await updateDocumentName(renameTarget.id, renameName.trim());
      setRenameTarget(null);
      setRenaming(false);
      refreshList();
      showSuccess('Đã đổi tên tài liệu.');
    } catch (requestError) {
      setRenameError(getApiErrorMessage(requestError, 'Không đổi tên được tài liệu.'));
      setRenaming(false);
    }
  };

  const handleMoveDocumentConfirm = async () => {
    if (!moveTarget) return;
    const destinationId = moveDestinationId || rootFolder?.id;

    if (!destinationId) {
      setMoveError('Vui lòng chọn thư mục đến.');
      return;
    }

    if (destinationId === moveTarget.folderId) {
      setMoveTarget(null);
      return;
    }

    try {
      setMoving(true);
      await addDocumentToFolder(destinationId, moveTarget.id);
      await refreshFolders(activeFolderId);
      updateQuery({ page: getFallbackPage() });
      setMoveTarget(null);
      setMoving(false);
      refreshList();
      showSuccess('Đã di chuyển tài liệu.');
    } catch (requestError) {
      setMoveError(getApiErrorMessage(requestError, 'Không di chuyển được tài liệu.'));
      setMoving(false);
    }
  };

  const handleDeleteDocumentConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await deleteDocument(deleteTarget.id);
      setDeleteTarget(null);
      setDeleting(false);
      updateQuery({ page: getFallbackPage() });
      refreshList();
      showSuccess('Đã xóa tài liệu.');
    } catch (requestError) {
      setDeleteError(getApiErrorMessage(requestError, 'Không xóa được tài liệu.'));
      setDeleting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-20">
      <div
        className="workspace-aurora pointer-events-none inset-0 z-0"
      />

      <AnimatePresence>
        {flash && (
          <MotionDiv
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            className={cn(
              'fixed bottom-10 left-1/2 z-[100] -translate-x-1/2 rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.18em] shadow-2xl',
              flash.tone === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white',
            )}
          >
            {flash.message}
          </MotionDiv>
        )}
      </AnimatePresence>

      <main className="relative z-10 w-full">
        <MotionDiv
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mx-auto flex min-h-[340px] max-w-6xl flex-col items-center justify-start overflow-visible px-3 pb-10 pt-1 text-center sm:px-6 lg:pt-3"
        >
          <div className="relative flex flex-col items-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-brand-600 shadow-sm backdrop-blur-xl">
              <Sparkles size={14} />
              Không gian học tập
            </div>

            <h1 className="max-w-5xl pb-3 text-4xl font-black leading-[1.18] tracking-normal text-[#25304a] drop-shadow-[0_8px_26px_rgba(255,255,255,0.62)] sm:text-5xl lg:text-[4rem]">
              Tri thức của bạn,
              <span className="block pb-2 leading-[1.16] bg-gradient-to-r from-[#1f2a44] via-[#9b3f36] to-[#e56f56] bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(255,255,255,0.82)]">
                Gọn gàng & Nghệ thuật.
              </span>
            </h1>
          </div>

          <div className="relative mt-7 flex w-full max-w-3xl items-center rounded-full border border-[#ead2c9] bg-white/95 p-1.5 shadow-[0_28px_82px_-36px_rgba(66,53,48,0.72),0_0_0_6px_rgba(255,255,255,0.34)] backdrop-blur-xl transition-all duration-300 focus-within:border-[#e56f56] focus-within:shadow-[0_30px_88px_-34px_rgba(139,63,54,0.78),0_0_0_7px_rgba(229,111,86,0.14)]">
            <div className="pl-5 pr-2 text-slate-500">
              <Search size={19} />
            </div>

            <input
              type="text"
              placeholder="Tìm tài liệu, môn học, bài tập lớn..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleApplySearch();
              }}
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-left text-sm font-bold text-slate-800 outline-none placeholder:text-slate-500"
            />

            <MotionButton
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApplySearch}
              className="rounded-full bg-gradient-to-r from-[#9b3f36] to-[#e56f56] px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-[#9b3f36]/28 transition-opacity hover:opacity-95"
            >
              Tìm kiếm
            </MotionButton>
          </div>
        </MotionDiv>

        <section className="-mt-3 grid w-full grid-cols-1 gap-5 px-4 sm:px-6 lg:px-8 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="min-w-0 overflow-hidden rounded-[2rem] border border-white/70 bg-white/62 p-4 shadow-[0_30px_90px_-62px_rgba(45,44,47,0.55)] backdrop-blur-xl">
            <FoldersPanel onFolderSelectionChange={handleFolderSelectionChange} />
          </aside>

          <div className="min-w-0 rounded-[2rem] border border-white/70 bg-white/62 p-4 shadow-[0_30px_90px_-62px_rgba(45,44,47,0.55)] backdrop-blur-xl sm:p-5">
            <div className="mb-5 rounded-[1.75rem] border border-white/70 bg-white/68 p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-extrabold text-slate-900">Tài liệu</h3>
                    <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-extrabold text-slate-500">
                      {pagination.total} file
                    </span>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
                    <FolderClosed size={16} />
                    {activeFolderLabel}
                    {keyword ? <span>· "{keyword}"</span> : null}
                    {type ? <span>· {activeTypeOption.label}</span> : null}
                    {favorite ? <span>· Yêu thích</span> : null}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-2.5 text-sm font-extrabold text-white shadow-[var(--shadow-brand)] transition-all hover:-translate-y-0.5 hover:bg-brand-600"
                  >
                    <CloudUpload size={17} />
                    Tải lên
                  </button>

                  <div className="flex rounded-full border border-white/70 bg-white/62 p-1">
                    <button
                      type="button"
                      aria-label="Xem dạng lưới"
                      title="Xem dạng lưới"
                      className={cn(
                        'rounded-full p-2 transition-all',
                        viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600',
                      )}
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Xem dạng danh sách"
                      title="Xem dạng danh sách"
                      className={cn(
                        'rounded-full p-2 transition-all',
                        viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600',
                      )}
                      onClick={() => setViewMode('table')}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div className="flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-white/55 bg-white/28 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                  {TYPE_FILTERS.map((option) => {
                    const activeType = type === option.value;

                    return (
                      <button
                        key={option.label}
                        type="button"
                        title={option.description}
                        onClick={() => updateQuery({ type: option.value || undefined }, { resetPage: true })}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-xs font-extrabold transition-all',
                          activeType
                            ? 'bg-brand-900 text-white shadow-sm'
                            : 'bg-white/62 text-slate-500 hover:bg-white hover:text-brand-600',
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-white/55 bg-white/28 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                  {SORT_OPTIONS.map((option) => {
                    const activeSort = sortBy === option.sortBy && sortOrder === option.sortOrder;
                    const SortIcon = option.Icon;

                    return (
                      <button
                        key={`${option.sortBy}-${option.sortOrder}`}
                        type="button"
                        title={option.description}
                        aria-label={option.description}
                        onClick={() => updateQuery(
                          { sortBy: option.sortBy, sortOrder: option.sortOrder },
                          { resetPage: true },
                        )}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition-all',
                          activeSort
                            ? 'bg-brand-900 text-white shadow-sm'
                            : 'bg-white/62 text-slate-500 hover:bg-white hover:text-brand-600',
                        )}
                      >
                        <SortIcon size={14} />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <DocumentLibraryPanel
              viewMode={viewMode}
              childFolders={[]}
              documents={documents}
              emptyTitle={favorite ? 'Danh sách yêu thích trống' : 'Không có tài liệu'}
              emptyDescription="Tải tài liệu đầu tiên hoặc đổi bộ lọc đang áp dụng."
              emptyAction={(
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-brand)] transition-all hover:-translate-y-0.5 hover:bg-brand-600"
                >
                  <CloudUpload size={17} />
                  Tải tài liệu
                </button>
              )}
              error={documentsError}
              loading={foldersLoading || documentsLoading}
              onOpenFolder={handleFolderSelectionChange}
              onOpenDocument={(id) => navigate(`/app/documents/${id}`)}
              onDownloadDocument={handleDownloadDocument}
              onToggleFavorite={handleToggleFavorite}
              onMoveDocument={(doc) => {
                setMoveTarget(doc);
                setMoveDestinationId(doc.folderId || rootFolder?.id);
              }}
              onRenameDocument={(doc) => {
                setRenameTarget(doc);
                setRenameName(doc.title);
              }}
              onDeleteDocument={(doc) => setDeleteTarget(doc)}
              pagination={{
                currentPage: pagination.currentPage,
                totalPages: pagination.totalPages,
                total: pagination.total,
                onPageChange: (nextPage) => updateQuery({ page: nextPage }),
              }}
              showFolderContext={favorite || Boolean(keyword) || Boolean(selectedFolderId)}
            />
          </div>
        </section>
      </main>

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUpload}
        folders={folderOptions}
        defaultFolderId={activeFolderId || ''}
      />

      <WorkspaceDocumentModals
        deleteError={deleteError}
        deleteTarget={deleteTarget}
        deleting={deleting}
        folderOptions={folderOptions}
        moveDestinationId={moveDestinationId}
        moveError={moveError}
        moveTarget={moveTarget}
        moving={moving}
        onCloseDelete={() => setDeleteTarget(null)}
        onCloseMove={() => setMoveTarget(null)}
        onCloseRename={() => setRenameTarget(null)}
        onConfirmDelete={handleDeleteDocumentConfirm}
        onConfirmMove={handleMoveDocumentConfirm}
        onConfirmRename={handleRenameDocumentConfirm}
        onMoveDestinationChange={(event) => setMoveDestinationId(event.target.value)}
        onRenameNameChange={(event) => setRenameName(event.target.value)}
        renameError={renameError}
        renameName={renameName}
        renameTarget={renameTarget}
        renaming={renaming}
      />
    </div>
  );
};

export default WorkspacePage;
