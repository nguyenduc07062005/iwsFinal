import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownAZ,
  ArrowLeft,
  Clock,
  FileHeart,
  HardDrive,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils.js';
import DocumentLibraryPanel from '../components/workspace/DocumentLibraryPanel.jsx';
import {
  downloadDocumentFile,
  getFavorites,
  toggleFavorite,
} from '../service/documentAPI.js';
import { getApiErrorMessage } from '../utils/apiError.js';

const DEFAULT_LIMIT = 10;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'desc';
const VALID_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'title', 'docDate', 'fileSize']);
const VALID_SORT_ORDERS = new Set(['asc', 'desc']);
const VALID_TYPES = new Set(['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif']);

const TYPE_FILTERS = [
  { label: 'All', value: '', description: 'Show all favorite documents' },
  { label: 'PDF', value: 'pdf', description: 'Show only PDF files' },
  { label: 'Word', value: 'docx', description: 'Show only DOCX files' },
  { label: 'Text', value: 'txt', description: 'Show only TXT files' },
];

const SORT_OPTIONS = [
  {
    label: 'Recently saved',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    description: 'Recently added documents',
    Icon: Clock,
  },
  {
    label: 'Recently updated',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    description: 'Recently updated documents',
    Icon: RefreshCw,
  },
  {
    label: 'Name A-Z',
    sortBy: 'title',
    sortOrder: 'asc',
    description: 'Sort by document name',
    Icon: ArrowDownAZ,
  },
  {
    label: 'Largest files',
    sortBy: 'fileSize',
    sortOrder: 'desc',
    description: 'Largest files first',
    Icon: HardDrive,
  },
];

const MotionDiv = motion.div;
const MotionButton = motion.button;

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

  const activeTypeOption = useMemo(
    () => TYPE_FILTERS.find((option) => option.value === type) || TYPE_FILTERS[0],
    [type],
  );

  useEffect(() => {
    if (!flash) return undefined;
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

    if (resetPage) nextParams.delete('page');
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
        setError(getApiErrorMessage(requestError, 'Could not load favorites.'));
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
        message: getApiErrorMessage(requestError, 'Could not load file.'),
      });
    }
  };

  const handleToggleFavorite = async (documentId) => {
    try {
      await toggleFavorite(documentId);
      if (documents.length === 1 && page > 1) {
        updateQuery({ page: page - 1 });
        return;
      }

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
    } catch (requestError) {
      setFlash({
        tone: 'error',
        message: getApiErrorMessage(requestError, 'Could not update favorites.'),
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-20">
      <div className="workspace-aurora pointer-events-none inset-0 z-0" />

      <AnimatePresence>
        {flash ? (
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
        ) : null}
      </AnimatePresence>

      <main className="relative z-10 w-full px-4 pt-2 sm:px-6 lg:px-8">
        <MotionDiv
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-[1480px] rounded-[2rem] border border-white/70 bg-white/62 p-4 shadow-[0_30px_90px_-62px_rgba(45,44,47,0.55)] backdrop-blur-xl sm:p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#9b3f36] text-white shadow-lg shadow-[#9b3f36]/18">
                  <Star size={19} fill="currentColor" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black tracking-tight text-slate-950">
                      Favorites
                    </h1>
                    <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-extrabold text-slate-500">
                      {pagination.total} file
                    </span>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
                    <FileHeart size={16} />
                    Starred documents
                    {keyword ? <span>· "{keyword}"</span> : null}
                    {type ? <span>· {activeTypeOption.label}</span> : null}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="inline-flex items-center gap-2 rounded-full bg-white/82 px-4 py-2.5 text-sm font-extrabold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:text-[#9b3f36]"
              >
                <ArrowLeft size={16} />
                Workspace
              </button>

              <div className="flex rounded-full border border-white/70 bg-white/62 p-1">
                <button
                  type="button"
                  aria-label="Grid view"
                  title="Grid view"
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
                  aria-label="List view"
                  title="List view"
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

          <div className="relative mt-5 flex w-full items-center rounded-full border border-[#ead2c9] bg-white/95 p-1.5 shadow-[0_24px_72px_-42px_rgba(66,53,48,0.72)] backdrop-blur-xl transition-all duration-300 focus-within:border-[#e56f56] focus-within:shadow-[0_28px_80px_-40px_rgba(139,63,54,0.78),0_0_0_6px_rgba(229,111,86,0.12)]">
            <div className="pl-5 pr-2 text-slate-500">
              <Search size={19} />
            </div>
            <input
              type="text"
              placeholder="Search favorite documents..."
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
              Search
            </MotionButton>
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

          <div className="mt-5">
            <DocumentLibraryPanel
              viewMode={viewMode}
              childFolders={[]}
              documents={documents}
              emptyTitle="No favorite documents yet"
              emptyDescription="Star important files to reopen them quickly while studying or reviewing."
              emptyAction={(
                <button
                  type="button"
                  onClick={() => navigate('/app')}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-brand)] transition-all hover:-translate-y-0.5 hover:bg-brand-600"
                >
                  <Sparkles size={17} />
                  Back to workspace
                </button>
              )}
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
        </MotionDiv>
      </main>
    </div>
  );
};

export default Favorites;
