import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownAZ,
  BrainCircuit,
  ChevronDown,
  Clock,
  CloudUpload,
  FileText,
  FolderClosed,
  HardDrive,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
} from 'lucide-react';
import { useDocumentsContext } from '../components/DocumentsContext.jsx';
import UploadModal from '../components/documents/UploadModal.jsx';
import FoldersPanel from '../components/folders/FoldersPanel.jsx';
import DocumentLibraryPanel from '../components/workspace/DocumentLibraryPanel.jsx';
import WorkspaceDocumentModals from '../components/workspace/WorkspaceDocumentModals.jsx';
import { addDocumentToFolder } from '../service/folderAPI.js';
import studyImage from '../assets/study.png';
import studyIllustration from '../assets/study2.png';
import {
  deleteDocument,
  downloadDocumentFile,
  getDocuments,
  toggleFavorite,
  updateDocumentName,
  updateDocumentTags,
  uploadDocument,
} from '../service/documentAPI.js';
import { createTag, deleteTag, getTags } from '../service/tagAPI.js';
import { cn } from '@/lib/utils.js';
import { getApiErrorMessage } from '../utils/apiError.js';

const DEFAULT_LIMIT = 12;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'desc';
const VALID_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'title', 'docDate', 'fileSize']);
const VALID_SORT_ORDERS = new Set(['asc', 'desc']);
const VALID_TYPES = new Set(['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif']);

const TYPE_FILTERS = [
  { label: 'All', value: '', description: 'Show all document types' },
  { label: 'PDF', value: 'pdf', description: 'Show only PDF files' },
  { label: 'Word', value: 'docx', description: 'Show only DOCX files' },
  { label: 'Text', value: 'txt', description: 'Show only TXT files' },
];

const SORT_OPTIONS = [
  {
    label: 'Recently uploaded',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    description: 'Recently uploaded documents first',
    Icon: Clock,
  },
  {
    label: 'Recently updated',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    description: 'Recently edited or processed documents first',
    Icon: RefreshCw,
  },
  {
    label: 'Name A-Z',
    sortBy: 'title',
    sortOrder: 'asc',
    description: 'Sort documents by name from A to Z',
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

const sortTagOptions = (tags) =>
  [...tags].sort((firstTag, secondTag) => {
    const typeOrder = firstTag.type.localeCompare(secondTag.type);
    if (typeOrder !== 0) return typeOrder;
    return firstTag.name.localeCompare(secondTag.name);
  });

const FilterDropdown = ({
  children,
  Icon,
  label,
  onChange,
  value,
}) => {
  const FilterIcon = Icon;

  return (
    <label className="flex h-12 min-w-0 items-center gap-2 rounded-full border border-white/70 bg-white/72 px-3 shadow-sm transition-all focus-within:border-brand-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/15">
      <FilterIcon size={16} className="shrink-0 text-brand-600" />
      <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={onChange}
        className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-extrabold text-slate-700 outline-none"
      >
        {children}
      </select>
      <ChevronDown size={14} className="shrink-0 text-slate-400" />
    </label>
  );
};

const MotionDiv = motion.div;
const MotionButton = motion.button;
const MotionAside = motion.aside;
const MotionImg = motion.img;

const WORKSPACE_HERO_SLIDES = [
  {
    src: studyIllustration,
    alt: 'Bright AI learning visualization',
    label: 'AI support',
    description: 'Summaries and Q&A for faster review.',
  },
  {
    src: studyImage,
    alt: 'Study workspace with organized learning resources',
    label: 'Smart library',
    description: 'Organize documents into a searchable study hub.',
  },
];

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
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

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
  const [tagOptions, setTagOptions] = useState([]);
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
  const subjectId = searchParams.get('subjectId') || '';
  const tagId = searchParams.get('tagId') || '';

  const activeFolder = selectedFolder || rootFolder;
  const activeFolderId = activeFolder?.id || null;
  const activeFolderLabel = getFolderLabel(activeFolder, rootFolder);
  const activeTypeOption = TYPE_FILTERS.find((option) => option.value === type) || TYPE_FILTERS[0];
  const subjectOptions = tagOptions.filter((tag) => tag.type === 'SUBJECT');
  const otherTagOptions = tagOptions.filter((tag) => tag.type !== 'SUBJECT');
  const activeSubjectOption = subjectOptions.find((tag) => tag.id === subjectId);
  const activeTagOption = otherTagOptions.find((tag) => tag.id === tagId);
  const tagFilterValue = subjectId
    ? `subject:${subjectId}`
    : tagId
      ? `tag:${tagId}`
      : '';
  const sortValue = `${sortBy}:${sortOrder}`;
  const currentHeroSlide = WORKSPACE_HERO_SLIDES[activeHeroSlide];
  const ActiveViewIcon = viewMode === 'grid' ? LayoutGrid : List;
  const workspaceMetrics = [
    {
      label: 'Documents',
      value: pagination.total,
      icon: <FileText size={16} />,
    },
    {
      label: 'Current folder',
      value: activeFolderLabel,
      icon: <FolderClosed size={16} />,
    },
    {
      label: 'View mode',
      value: viewMode === 'grid' ? 'Grid' : 'List',
      icon: <ActiveViewIcon size={16} />,
    },
  ];

  useEffect(() => {
    if (!flash) return undefined;
    const timer = window.setTimeout(() => setFlash(null), 4500);
    return () => window.clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % WORKSPACE_HERO_SLIDES.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

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

  const loadTags = useCallback(async () => {
    try {
      const result = await getTags();
      setTagOptions(sortTagOptions(result.tags || []));
    } catch {
      setTagOptions([]);
    }
  }, []);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

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
          subjectId: subjectId || undefined,
          tagId: tagId || undefined,
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
        setDocumentsError(getApiErrorMessage(requestError, 'Could not load documents.'));
      } finally {
        if (requestId === requestIdRef.current) {
          setDocumentsLoading(false);
        }
      }
    };

    void loadDocuments();
  }, [activeFolderId, favorite, keyword, limit, page, reloadKey, rootFolder, sortBy, sortOrder, subjectId, tagId, type]);

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

  const handleTagFilterChange = (event) => {
    const value = event.target.value;

    if (!value) {
      updateQuery({ subjectId: undefined, tagId: undefined }, { resetPage: true });
      return;
    }

    const [kind, id] = value.split(':');
    updateQuery(
      {
        subjectId: kind === 'subject' ? id : undefined,
        tagId: kind === 'tag' ? id : undefined,
      },
      { resetPage: true },
    );
  };

  const handleSortChange = (event) => {
    const [nextSortBy, nextSortOrder] = event.target.value.split(':');
    updateQuery(
      { sortBy: nextSortBy, sortOrder: nextSortOrder },
      { resetPage: true },
    );
  };

  const handleUpload = async (file, title, folderId, tagIds = []) => {
    const targetFolderId = folderId || activeFolderId || rootFolder?.id;
    await uploadDocument(file, title, targetFolderId, tagIds);
    await refreshFolders(targetFolderId);
    refreshList();
    showSuccess('Document uploaded to workspace.');
  };

  const handleCreateTag = async (payload) => {
    const result = await createTag(payload);
    const createdTag = result.tag;

    if (createdTag) {
      setTagOptions((current) =>
        sortTagOptions([
          ...current.filter((tag) => tag.id !== createdTag.id),
          createdTag,
        ]),
      );
      showSuccess('Tag saved.');
    }

    return createdTag;
  };

  const handleDeleteTag = async (tagIdToDelete) => {
    await deleteTag(tagIdToDelete);
    setTagOptions((current) =>
      current.filter((tag) => tag.id !== tagIdToDelete),
    );
    setDocuments((current) =>
      current.map((document) => ({
        ...document,
        subject:
          document.subject?.id === tagIdToDelete ? null : document.subject,
        tags: Array.isArray(document.tags)
          ? document.tags.filter((tag) => tag.id !== tagIdToDelete)
          : document.tags,
      })),
    );

    if (subjectId === tagIdToDelete || tagId === tagIdToDelete) {
      updateQuery(
        { subjectId: undefined, tagId: undefined },
        { resetPage: true },
      );
    } else {
      refreshList();
    }

    showSuccess('Tag deleted.');
  };

  const handleUpdateDocumentTags = async (document, nextTagIds) => {
    const result = await updateDocumentTags(document.id, nextTagIds);
    const nextTags = result.tags || [];
    const nextSubject = nextTags.find((tag) => tag.type === 'SUBJECT') || null;
    const activeFilterStillMatches =
      (!subjectId || nextTags.some((tag) => tag.id === subjectId)) &&
      (!tagId || nextTags.some((tag) => tag.id === tagId));

    setDocuments((current) =>
      current
        .map((currentDocument) =>
          currentDocument.id === document.id
            ? {
                ...currentDocument,
                subject: nextSubject,
                tags: nextTags,
              }
            : currentDocument,
        )
        .filter(
          (currentDocument) =>
            currentDocument.id !== document.id || activeFilterStillMatches,
        ),
    );

    return result;
  };

  const handleToggleFavorite = async (documentId) => {
    try {
      await toggleFavorite(documentId);
      refreshList();
    } catch (requestError) {
      showError(getApiErrorMessage(requestError, 'Could not update favorites.'));
    }
  };

  const handleDownloadDocument = async (documentId, title) => {
    try {
      await downloadDocumentFile(documentId, title);
    } catch (requestError) {
      showError(getApiErrorMessage(requestError, 'Could not download document.'));
    }
  };

  const handleRenameDocumentConfirm = async () => {
    if (!renameTarget) return;
    if (!renameName.trim()) {
      setRenameError('Please enter a document name.');
      return;
    }

    try {
      setRenaming(true);
      await updateDocumentName(renameTarget.id, renameName.trim());
      setRenameTarget(null);
      setRenaming(false);
      refreshList();
      showSuccess('Document renamed.');
    } catch (requestError) {
      setRenameError(getApiErrorMessage(requestError, 'Could not rename document.'));
      setRenaming(false);
    }
  };

  const handleMoveDocumentConfirm = async () => {
    if (!moveTarget) return;
    const destinationId = moveDestinationId || rootFolder?.id;

    if (!destinationId) {
      setMoveError('Please choose a destination folder.');
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
      showSuccess('Document moved.');
    } catch (requestError) {
      setMoveError(getApiErrorMessage(requestError, 'Could not move document.'));
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
      showSuccess('Document deleted.');
    } catch (requestError) {
      setDeleteError(getApiErrorMessage(requestError, 'Could not delete document.'));
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
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative mx-auto grid min-h-[380px] w-full max-w-[1480px] grid-cols-1 items-center gap-6 overflow-visible px-4 pb-10 pt-2 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:pt-4 2xl:grid-cols-[minmax(0,1fr)_470px]"
        >
          <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/76 px-5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-brand-600 shadow-sm ring-1 ring-white/80 backdrop-blur-xl">
              <Sparkles size={14} />
              Study workspace
            </div>

            <h1 className="workspace-hero-title whitespace-nowrap pb-3 text-4xl font-black leading-[1.12] tracking-normal drop-shadow-[0_8px_26px_rgba(255,255,255,0.62)] sm:text-5xl lg:text-[3.75rem] xl:text-[4.15rem]">
              Study smarter
            </h1>

            <div className="relative mt-5 flex w-full max-w-3xl items-center rounded-full border border-[#ead2c9] bg-white/95 p-1.5 shadow-[0_28px_82px_-36px_rgba(66,53,48,0.72),0_0_0_6px_rgba(255,255,255,0.34)] backdrop-blur-xl transition-all duration-300 focus-within:-translate-y-0.5 focus-within:border-[#e56f56] focus-within:shadow-[0_30px_88px_-34px_rgba(139,63,54,0.78),0_0_0_7px_rgba(229,111,86,0.14)]">
              <div className="pl-5 pr-2 text-slate-500">
                <Search size={19} />
              </div>

              <input
                type="text"
                placeholder="Search documents..."
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
                className="sks-ai-glow-btn rounded-full bg-gradient-to-r from-[#9b3f36] to-[#e56f56] px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-[#9b3f36]/28 transition-opacity hover:opacity-95"
              >
                Search
              </MotionButton>
            </div>

            <div className="mt-5 grid w-full max-w-3xl grid-cols-1 gap-2 sm:grid-cols-3">
              {workspaceMetrics.map(({ label, value, icon }, index) => (
                <MotionDiv
                  key={label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.16 + index * 0.08, ease: 'easeOut' }}
                  className="workspace-metric-tile group"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm transition-transform group-hover:scale-105">
                    {icon}
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                      {label}
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-black text-slate-900">
                      {value}
                    </span>
                  </span>
                </MotionDiv>
              ))}
            </div>
          </div>

          <MotionDiv
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12, ease: 'easeOut' }}
            className="workspace-visual-panel group"
          >
            <AnimatePresence mode="wait">
              <MotionImg
                key={currentHeroSlide.src}
                src={currentHeroSlide.src}
                alt={currentHeroSlide.alt}
                initial={{ opacity: 0, scale: 1.01, y: 12 }}
                animate={{ opacity: 1, scale: 1.06, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -10 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="workspace-visual-image"
              />
            </AnimatePresence>

            <div className="absolute bottom-2 left-5 right-5 z-10 rounded-[1.25rem] border border-white/72 bg-white/78 p-4 text-slate-900 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                    <BrainCircuit size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{currentHeroSlide.label}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">
                      {currentHeroSlide.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {WORKSPACE_HERO_SLIDES.map((slide, index) => (
                  <button
                    key={slide.label}
                    type="button"
                    aria-label={`Show ${slide.label}`}
                    onClick={() => setActiveHeroSlide(index)}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      activeHeroSlide === index
                        ? 'w-8 bg-brand-600'
                        : 'w-2 bg-slate-300 hover:bg-brand-300',
                    )}
                  />
                ))}
              </div>
            </div>
          </MotionDiv>
        </MotionDiv>

        <section className="-mt-3 grid w-full grid-cols-1 gap-5 px-4 sm:px-6 lg:px-8 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <MotionAside
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className="workspace-panel-rise min-w-0 overflow-hidden rounded-[2rem] border border-white/70 bg-white/62 p-4 shadow-[0_30px_90px_-62px_rgba(45,44,47,0.55)] backdrop-blur-xl"
          >
            <FoldersPanel onFolderSelectionChange={handleFolderSelectionChange} />
          </MotionAside>

          <MotionDiv
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.28, ease: 'easeOut' }}
            className="workspace-panel-rise min-w-0 rounded-[2rem] border border-white/70 bg-white/62 p-4 shadow-[0_30px_90px_-62px_rgba(45,44,47,0.55)] backdrop-blur-xl sm:p-5"
          >
            <div className="workspace-document-toolbar mb-5 rounded-[1.75rem] border border-white/70 bg-white/68 p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-extrabold text-slate-900">Documents</h3>
                    <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-extrabold text-slate-500">
                      {pagination.total} file
                    </span>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
                    <FolderClosed size={16} />
                    {activeFolderLabel}
                    {keyword ? <span>- "{keyword}"</span> : null}
                    {type ? <span>- {activeTypeOption.label}</span> : null}
                    {activeSubjectOption ? <span>- {activeSubjectOption.name}</span> : null}
                    {activeTagOption ? <span>- {activeTagOption.name}</span> : null}
                    {favorite ? <span>- Favorites</span> : null}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="sks-ai-glow-btn inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-2.5 text-sm font-extrabold text-white shadow-[var(--shadow-brand)] transition-all hover:-translate-y-0.5 hover:bg-brand-600"
                  >
                    <CloudUpload size={17} />
                    Upload
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

              <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <FilterDropdown
                  Icon={FileText}
                  label="Type"
                  value={type}
                  onChange={(event) =>
                    updateQuery(
                      { type: event.target.value || undefined },
                      { resetPage: true },
                    )
                  }
                >
                  {TYPE_FILTERS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label === 'All' ? 'All file types' : option.label}
                    </option>
                  ))}
                </FilterDropdown>

                <FilterDropdown
                  Icon={Tag}
                  label="Tag"
                  value={tagFilterValue}
                  onChange={handleTagFilterChange}
                >
                  <option value="">All tags</option>
                  {subjectOptions.length > 0 ? (
                    <optgroup label="Subjects">
                      {subjectOptions.map((subject) => (
                        <option key={subject.id} value={`subject:${subject.id}`}>
                          {subject.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  {otherTagOptions.length > 0 ? (
                    <optgroup label="Tags">
                      {otherTagOptions.map((tag) => (
                        <option key={tag.id} value={`tag:${tag.id}`}>
                          {tag.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </FilterDropdown>

                <FilterDropdown
                  Icon={ArrowDownAZ}
                  label="Sort"
                  value={sortValue}
                  onChange={handleSortChange}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option
                      key={`${option.sortBy}-${option.sortOrder}`}
                      value={`${option.sortBy}:${option.sortOrder}`}
                    >
                      {option.label}
                    </option>
                  ))}
                </FilterDropdown>
              </div>

            </div>

            <DocumentLibraryPanel
              viewMode={viewMode}
              childFolders={[]}
              documents={documents}
              emptyTitle={favorite ? 'Favorites list is empty' : 'No documents'}
              emptyDescription="Upload your first document or change the active filters."
              emptyAction={(
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-brand)] transition-all hover:-translate-y-0.5 hover:bg-brand-600"
                >
                  <CloudUpload size={17} />
                  Upload document
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
              onCreateTag={handleCreateTag}
              onUpdateDocumentTags={handleUpdateDocumentTags}
              pagination={{
                currentPage: pagination.currentPage,
                totalPages: pagination.totalPages,
                total: pagination.total,
                onPageChange: (nextPage) => updateQuery({ page: nextPage }),
              }}
              tagOptions={tagOptions}
              showFolderContext={
                favorite ||
                Boolean(keyword) ||
                Boolean(selectedFolderId) ||
                Boolean(subjectId) ||
                Boolean(tagId)
              }
            />
          </MotionDiv>
        </section>
      </main>

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onCreateTag={handleCreateTag}
        onDeleteTag={handleDeleteTag}
        onUploadSuccess={handleUpload}
        folders={folderOptions}
        defaultFolderId={activeFolderId || ''}
        tags={tagOptions}
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
