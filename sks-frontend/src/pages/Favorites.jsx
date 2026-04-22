import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import DocumentLibraryPanel from '../components/workspace/DocumentLibraryPanel.jsx';
import {
  downloadDocumentFile,
  getFavorites,
  toggleFavorite,
} from '../service/documentAPI.js';
import { getApiErrorMessage } from '../utils/apiError.js';

const DEFAULT_LIMIT = 8;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'desc';
const VALID_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'title', 'docDate', 'fileSize']);
const VALID_SORT_ORDERS = new Set(['asc', 'desc']);
const VALID_TYPES = new Set(['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif']);

const readPositiveInt = (value, fallback) => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const Favorites = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [searchInput, setSearchInput] = useState(searchParams.get('keyword') || '');
  const requestIdRef = useRef(0);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  });

  const page = readPositiveInt(searchParams.get('page'), 1);
  const limit = readPositiveInt(searchParams.get('limit'), DEFAULT_LIMIT);
  const sortBy = VALID_SORT_FIELDS.has(searchParams.get('sortBy')) ? searchParams.get('sortBy') : DEFAULT_SORT_BY;
  const sortOrder = VALID_SORT_ORDERS.has(searchParams.get('sortOrder')) ? searchParams.get('sortOrder') : DEFAULT_SORT_ORDER;
  const type = VALID_TYPES.has(searchParams.get('type')) ? searchParams.get('type') : '';
  const keyword = (searchParams.get('keyword') || '').trim();

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 4000);
    return () => window.clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    setSearchInput(keyword);
  }, [keyword]);

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
        (key === 'sortOrder' && value === DEFAULT_SORT_ORDER);

      if (shouldRemove) {
        nextParams.delete(key);
        return;
      }

      nextParams.set(key, String(value));
    });

    if (resetPage) {
      nextParams.delete('page');
    }

    setSearchParams(nextParams);
  };

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const loadFavorites = async () => {
      try {
        setLoading(true);
        const result = await getFavorites({
          keyword: keyword || undefined,
          limit,
          page,
          sortBy,
          sortOrder,
          type: type || undefined,
        });

        if (requestId !== requestIdRef.current) return;

        setDocuments(result.favorites || []);
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
        setError('');
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
        setError(getApiErrorMessage(requestError, 'Failed to load favorites.'));
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    void loadFavorites();
  }, [keyword, limit, page, sortBy, sortOrder, type]);

  const handleApplySearch = () => {
    updateQuery({ keyword: searchInput.trim() || undefined }, { resetPage: true });
  };

  const handleOpenDocument = (documentId) => {
    navigate(`/app/documents/${documentId}`);
  };

  const handleDownloadDocument = async (documentId, title) => {
    try {
      await downloadDocumentFile(documentId, title);
    } catch (requestError) {
      setFlash({
        tone: 'error',
        message: getApiErrorMessage(requestError, 'Unable to download the file.'),
      });
    }
  };

  const handleToggleFavorite = async (documentId) => {
    try {
      await toggleFavorite(documentId);
      if (documents.length === 1 && page > 1) {
        updateQuery({ page: page - 1 });
      } else {
        updateQuery({}, {});
        requestIdRef.current = 0;
        const result = await getFavorites({
          keyword: keyword || undefined,
          limit,
          page,
          sortBy,
          sortOrder,
          type: type || undefined,
        });
        setDocuments(result.favorites || []);
        setPagination(result.pagination || pagination);
      }
    } catch (requestError) {
      setFlash({
        tone: 'error',
        message: getApiErrorMessage(requestError, 'Unable to update favorites.'),
      });
    }
  };

  return (
    <div className="relative min-h-full pb-16">
      {flash ? (
        <div
          className={cn(
            'fixed top-24 right-8 z-50 rounded-2xl px-6 py-4 shadow-lg text-sm font-bold',
            flash.tone === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white',
          )}
        >
          {flash.message}
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-8 sm:pt-14">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-amber-600 shadow-sm ring-1 ring-slate-200/60">
            <Star size={14} fill="currentColor" />
            Yêu thích
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Tài liệu quan trọng luôn trong tầm tay
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500 md:text-base">
            Trang này chỉ hiển thị những tài liệu đã được đánh dấu yêu thích, với
            cùng luồng phân trang, sắp xếp, và lọc từ backend thật.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/app')}
          className="bg-white text-slate-600 border border-slate-200 px-6 py-3 rounded-full font-bold shadow-sm hover:bg-slate-50 transition-all w-full md:w-auto"
        >
          Quay lại không gian
        </button>
      </div>

      <div className="glass p-4 rounded-2xl shadow-sm mb-8 flex flex-col xl:flex-row gap-4 items-center justify-between border border-white/60">
        <div className="flex flex-1 w-full gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search favorites..."
              placeholder="Tìm trong tài liệu yêu thích..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleApplySearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            type="button"
            onClick={handleApplySearch}
            className="w-11 h-11 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-brand-600 hover:border-brand-200 transition-colors shrink-0"
          >
            <Filter size={18} />
          </button>
        </div>

        <div className="flex w-full xl:w-auto gap-3 items-center overflow-x-auto no-scrollbar pb-1 xl:pb-0">
          <select
            value={type || ''}
            onChange={(event) => updateQuery({ type: event.target.value }, { resetPage: true })}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none min-w-[150px] appearance-none cursor-pointer"
          >
            <option value="">Mọi loại tệp</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="txt">TXT</option>
          </select>

          <select
            value={sortBy || DEFAULT_SORT_BY}
            onChange={(event) => updateQuery({ sortBy: event.target.value }, { resetPage: true })}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none min-w-[150px] appearance-none cursor-pointer"
          >
            <option value="createdAt">Mới tải lên</option>
            <option value="updatedAt">Vừa cập nhật</option>
            <option value="title">Tên A-Z</option>
            <option value="fileSize">Dung lượng</option>
          </select>

          <div className="flex bg-slate-100 p-1 rounded-xl ml-auto xl:ml-4 shrink-0 shadow-inner">
            <button
              type="button"
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-bold transition-all',
                viewMode === 'table'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
              onClick={() => setViewMode('table')}
            >
              Danh sách
            </button>
            <button
              type="button"
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-bold transition-all',
                viewMode === 'grid'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
              onClick={() => setViewMode('grid')}
            >
              Lưới
            </button>
          </div>
        </div>
      </div>

      <DocumentLibraryPanel
        viewMode={viewMode}
        childFolders={[]}
        documents={documents}
        emptyTitle="Chưa có tài liệu yêu thích"
        emptyDescription="Đánh dấu những tài liệu quan trọng từ workspace để giữ chúng luôn ở gần khi học hoặc demo."
        error={error}
        loading={loading}
        showFolderContext
        onOpenFolder={() => {}}
        onOpenDocument={handleOpenDocument}
        onDownloadDocument={handleDownloadDocument}
        onToggleFavorite={handleToggleFavorite}
        pagination={{
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          total: pagination.total,
          onPageChange: (nextPage) => updateQuery({ page: nextPage }),
        }}
      />
    </div>
  );
};

export default Favorites;
