import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  FolderOpen,
  FolderClosed,
  Star,
  ChevronRight,
  MoreVertical,
  LayoutGrid,
  List,
  Sparkles,
  Clock,
  HardDrive,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { useDocumentsContext } from '../components/DocumentsContext.jsx';
import UploadModal from '../components/documents/UploadModal.jsx';
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
const MotionDiv = motion.div;
const MotionButton = motion.button;

const readPositiveInt = (value, fallback) => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

// Component thống kê nhỏ gọn
const StatCard = ({ icon, label, value, color }) => {
  const IconComponent = icon;

  return (
  <div className="flex items-center gap-4 px-5 py-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group">
    <div className={cn("p-2.5 rounded-2xl transition-colors", color)}>
      <IconComponent size={18} />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-black text-slate-800">{value}</p>
    </div>
  </div>
  );
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
    total: totalDocuments,
  } = useDocumentsContext();

  const [flash, setFlash] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(searchParams.get('openUpload') === 'true');
  const [viewMode, setViewMode] = useState('grid');
  
  // Modals state
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

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 4500);
    return () => window.clearTimeout(timer);
  }, [flash]);

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

  const activeFolder = selectedFolder || rootFolder;
  const activeFolderId = activeFolder?.id || null;
  const childFolders = activeFolder?.children || [];

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
        setPagination({ currentPage: page, hasNextPage: false, hasPreviousPage: false, limit, total: 0, totalPages: 1 });
        setDocumentsError(getApiErrorMessage(requestError, 'Failed to load documents.'));
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

  const getFallbackPage = () => documents.length === 1 && page > 1 ? page - 1 : page;

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
    showSuccess('Đã tải lên tài liệu thành công.');
  };

  const handleToggleFavorite = async (documentId) => {
    try {
      await toggleFavorite(documentId);
      refreshList();
    } catch (requestError) {
      showError(getApiErrorMessage(requestError, 'Lỗi cập nhật yêu thích.'));
    }
  };

  const handleDownloadDocument = async (documentId, title) => {
    try {
      await downloadDocumentFile(documentId, title);
    } catch (requestError) {
      showError(getApiErrorMessage(requestError, 'Lỗi tải xuống tài liệu.'));
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
      showSuccess('Đã sửa tên thành công.');
    } catch (requestError) {
      setRenameError(getApiErrorMessage(requestError, 'Lỗi đổi tên.'));
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
      setMoveError(getApiErrorMessage(requestError, 'Lỗi di chuyển.'));
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
      setDeleteError(getApiErrorMessage(requestError, 'Lỗi xóa tài liệu.'));
      setDeleting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center pb-20 px-6 max-w-7xl mx-auto">
      <AnimatePresence>
        {flash && (
          <MotionDiv 
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-10 z-[100] rounded-full px-8 py-3.5 shadow-2xl text-xs font-black uppercase tracking-widest border ${flash.tone === 'error' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-900 border-slate-800 text-white'}`}
          >
            {flash.message}
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* --- HEADER BLOCK (NEAT & ARTISTIC) --- */}
      <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 pt-8 pb-12">
        <div className="text-center lg:text-left">
          <MotionDiv 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-black uppercase tracking-widest border border-brand-100"
          >
            <Sparkles size={12} /> Personal Workspace
          </MotionDiv>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight text-slate-900 mb-2">
            Chào ngày mới!
          </h1>
          <p className="text-slate-400 font-medium max-w-md">Quản lý tri thức của bạn một cách nghệ thuật và khoa học.</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full lg:w-auto">
          <StatCard icon={BarChart3} label="Tài liệu" value={totalDocuments || 0} color="bg-blue-50 text-blue-600" />
          <StatCard icon={HardDrive} label="Dung lượng" value="1.2 GB" color="bg-brand-50 text-brand-600" />
          <StatCard icon={Calendar} label="Cập nhật" value="Hôm nay" color="bg-purple-50 text-purple-600" />
        </div>
      </div>

      {/* --- SUPER SEARCH BAR (COMPACT VERSION) --- */}
      <div className="w-full max-w-4xl mb-16">
        <div className="bg-white/80 backdrop-blur-xl rounded-full shadow-[0_15px_45px_-10px_rgba(0,0,0,0.08)] border border-white/50 flex items-center p-2 group transition-all duration-500 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.12)] focus-within:ring-8 focus-within:ring-brand-500/5">
          <div className="pl-6 pr-3 text-slate-400 group-focus-within:text-brand-500 transition-colors">
            <Search size={22} />
          </div>
          
          <input 
            type="text" 
            placeholder="Tìm nhanh tài liệu, môn học..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplySearch()}
            className="flex-1 bg-transparent border-none outline-none py-4 text-base font-semibold text-slate-700 placeholder:text-slate-300"
          />

          <div className="hidden sm:flex items-center gap-2 px-6 border-l border-slate-100 mr-2">
            <select 
              value={type || ''} 
              onChange={(e) => updateQuery({ type: e.target.value }, { resetPage: true })}
              className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:text-brand-600 transition-colors appearance-none pr-4"
            >
              <option value="">Tất cả</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOC</option>
              <option value="xlsx">XLS</option>
            </select>
          </div>

          <MotionButton 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApplySearch}
            className="bg-brand-900 text-white rounded-full px-8 py-3.5 font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-500/20 hover:bg-slate-900 transition-all"
          >
            Tìm kiếm
          </MotionButton>
        </div>
      </div>

      {/* --- REFINED NAVIGATION --- */}
      <div className="w-full mb-12 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full md:w-auto">
          <button 
            onClick={() => { updateQuery({ favorite: undefined, folderId: undefined }, { resetPage: true }); selectFolder(null); }}
            className={cn(
              "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
              !favorite && (!selectedFolderId || selectedFolderId === rootFolder?.id)
                ? "bg-brand-900 text-white shadow-xl shadow-brand-500/20"
                : "text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
            )}
          >
            Mọi tài liệu
          </button>
          <button 
            onClick={() => { updateQuery({ favorite: true, folderId: undefined }, { resetPage: true }); selectFolder(null); }}
            className={cn(
              "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2",
              favorite 
                ? "bg-amber-500 text-white shadow-xl shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
            )}
          >
            <Star size={14} fill={favorite ? "currentColor" : "none"} /> Yêu thích
          </button>
          <div className="h-4 w-px bg-slate-200 mx-2 hidden md:block" />
          <div className="flex items-center gap-2">
            {childFolders.slice(0, 4).map(folder => (
              <button 
                key={folder.id}
                onClick={() => handleFolderSelectionChange(folder.id)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2",
                  selectedFolderId === folder.id
                    ? "bg-brand-50 text-brand-600 border border-brand-200"
                    : "text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                )}
              >
                <FolderClosed size={14} /> {folder.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-brand-900 transition-all shadow-lg"
          >
            <Plus size={16} /> Tải lên
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
            <button 
              className={cn("p-2 rounded-full transition-all", viewMode === 'grid' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              className={cn("p-2 rounded-full transition-all", viewMode === 'table' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}
              onClick={() => setViewMode('table')}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- MAIN GRID SECTION --- */}
      <div className="w-full">
        {/* Recent Section (What's missing) */}
        {!keyword && !favorite && !selectedFolderId && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Clock size={16} className="text-brand-500" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Gần đây</h2>
            </div>
            {/* We could render a small carousel or first 4 docs here */}
          </div>
        )}

        <DocumentLibraryPanel
          viewMode={viewMode}
          childFolders={favorite ? [] : childFolders}
          documents={documents}
          emptyTitle={favorite ? "Danh sách yêu thích trống" : "Không có tài liệu"}
          emptyDescription="Bắt đầu hành trình bằng cách tải lên tài liệu đầu tiên của bạn."
          error={documentsError}
          loading={foldersLoading || documentsLoading}
          onOpenFolder={handleFolderSelectionChange}
          onOpenDocument={(id) => navigate(`/app/documents/${id}`)}
          onDownloadDocument={handleDownloadDocument}
          onToggleFavorite={handleToggleFavorite}
          onMoveDocument={(doc) => { setMoveTarget(doc); setMoveDestinationId(doc.folderId || rootFolder?.id); }}
          onRenameDocument={(doc) => { setRenameTarget(doc); setRenameName(doc.title); }}
          onDeleteDocument={(doc) => setDeleteTarget(doc)}
          pagination={{
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            total: pagination.total,
            onPageChange: (nextPage) => updateQuery({ page: nextPage }),
          }}
          showFolderContext={favorite || searchInput !== ''}
        />
      </div>

      {/* Modals */}
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
        onMoveDestinationChange={(e) => setMoveDestinationId(e.target.value)}
        onRenameNameChange={(e) => setRenameName(e.target.value)}
        renameError={renameError}
        renameName={renameName}
        renameTarget={renameTarget}
        renaming={renaming}
      />
    </div>
  );
};

export default WorkspacePage;
