import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownAZ,
  BrainCircuit,
  Check,
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
  X,
} from 'lucide-react';
import { useDocumentsContext } from '../components/DocumentsContext.jsx';
import UploadModal from '../components/documents/UploadModal.jsx';
import FoldersPanel from '../components/folders/FoldersPanel.jsx';
import DocumentLibraryPanel from '../components/workspace/DocumentLibraryPanel.jsx';
import WorkspaceDocumentModals from '../components/workspace/WorkspaceDocumentModals.jsx';
import { addDocumentToFolder } from '../service/folderAPI.js';
import workspaceHeroAiImage from '../assets/workspace-hero-ai.png';
import workspaceHeroFlowImage from '../assets/workspace-hero-flow.png';
import workspaceHeroLibraryImage from '../assets/workspace-hero-library.png';
import workspaceHeroOverviewImage from '../assets/workspace-hero-overview.png';
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
import { buildRoutePath } from '../utils/workspaceNavigation.js';

const DEFAULT_LIMIT = 12;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'desc';
const VALID_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'title', 'docDate', 'fileSize']);
const VALID_SORT_ORDERS = new Set(['asc', 'desc']);
const VALID_TYPES = new Set(['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif']);
const VALID_VIEW_MODES = new Set(['grid', 'table']);
const WORKSPACE_DOCUMENTS_PREFERENCES_KEY = 'studyvault.workspace.documents.preferences';
const WORKSPACE_SCROLL_RESTORE_KEY = 'studyvault.workspace.scrollY';

const WORKSPACE_QUERY_PREFERENCE_KEYS = [
  'favorite',
  'folderId',
  'keyword',
  'limit',
  'sortBy',
  'sortOrder',
  'subjectId',
  'tagId',
  'type',
];

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
  Icon,
  groups = [],
  label,
  onChangeValue,
  options = [],
  value,
}) => {
  const FilterIcon = Icon;
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const normalizedGroups = groups.length > 0 ? groups : [{ options }];
  const flatOptions = normalizedGroups.flatMap((group) => group.options || []);
  const activeOption =
    flatOptions.find((option) => option.value === value) || flatOptions[0];
  const optionCount = flatOptions.length;
  const groupCount = normalizedGroups.filter((group) => group.label).length;

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button || typeof window === 'undefined') return;

    const rect = button.getBoundingClientRect();
    const viewportPadding = 16;
    const targetWidth = Math.min(
      Math.max(rect.width, 280),
      window.innerWidth - viewportPadding * 2,
    );
    const left = Math.min(
      Math.max(rect.left, viewportPadding),
      window.innerWidth - targetWidth - viewportPadding,
    );
    const estimatedHeight = Math.min(288, 18 + optionCount * 58 + groupCount * 28);
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const openUp = spaceBelow < Math.min(estimatedHeight, 220) && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      180,
      Math.min(288, openUp ? spaceAbove - 8 : spaceBelow - 8),
    );
    const top = openUp
      ? Math.max(viewportPadding, rect.top - maxHeight - 8)
      : rect.bottom + 8;

    setMenuStyle({
      left,
      maxHeight,
      top,
      width: targetWidth,
    });
  }, [groupCount, optionCount, setMenuStyle]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (
        !buttonRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;

    updateMenuPosition();

    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  const selectOption = (optionValue) => {
    onChangeValue(optionValue);
    setIsOpen(false);
  };

  const toggleMenu = () => {
    if (!isOpen) {
      updateMenuPosition();
    }

    setIsOpen((current) => !current);
  };

  return (
    <div className="relative min-w-0">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={toggleMenu}
        className={cn(
          'group flex h-14 w-full min-w-0 items-center gap-3 rounded-[1.35rem] border border-white/70 bg-white/72 px-3.5 text-left shadow-sm transition-all hover:border-brand-100 hover:bg-white hover:shadow-[0_18px_46px_-38px_rgba(45,44,47,0.5)] focus:outline-none focus:ring-2 focus:ring-brand-500/15',
          isOpen && 'border-brand-100 bg-white shadow-[0_18px_48px_-34px_rgba(155,63,54,0.5)]',
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
          <FilterIcon size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            {label}
          </span>
          <span className="mt-0.5 block truncate text-sm font-extrabold text-slate-800">
            {activeOption?.label || 'Select'}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-slate-400 transition-transform',
            isOpen && 'rotate-180 text-brand-600',
          )}
        />
      </button>

      {typeof document !== 'undefined'
        ? createPortal(
          <AnimatePresence>
            {isOpen ? (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                style={{
                  left: menuStyle?.left ?? 0,
                  maxHeight: menuStyle?.maxHeight ?? 288,
                  top: menuStyle?.top ?? 0,
                  width: menuStyle?.width ?? 320,
                  visibility: menuStyle ? 'visible' : 'hidden',
                }}
                className="fixed z-[1000] overflow-hidden rounded-[1.35rem] border border-white/85 bg-white/95 p-2 shadow-[0_26px_76px_-36px_rgba(45,44,47,0.58)] backdrop-blur-xl"
                role="listbox"
              >
                <div
                  className="overflow-y-auto pr-1"
                  style={{ maxHeight: Math.max((menuStyle?.maxHeight ?? 288) - 16, 160) }}
                >
                  {normalizedGroups.map((group, groupIndex) => {
                    const groupOptions = group.options || [];
                    if (groupOptions.length === 0) return null;

                    return (
                      <div key={group.label || `group-${groupIndex}`} className={groupIndex > 0 ? 'mt-2' : ''}>
                        {group.label ? (
                          <p className="px-3 pb-1.5 pt-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                            {group.label}
                          </p>
                        ) : null}

                        <div className="space-y-1">
                          {groupOptions.map((option) => {
                            const selected = option.value === value;
                            const OptionIcon = option.Icon;

                            return (
                              <button
                                key={option.value || option.label}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={() => selectOption(option.value)}
                                title={option.description || option.label}
                                className={cn(
                                  'grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all',
                                  selected
                                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                                )}
                              >
                                <span
                                  className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-full',
                                    selected ? 'bg-white text-brand-600' : 'bg-slate-50 text-slate-400',
                                  )}
                                >
                                  {OptionIcon ? <OptionIcon size={15} /> : <FilterIcon size={15} />}
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-extrabold">
                                    {option.label}
                                  </span>
                                  {option.description ? (
                                    <span className="mt-0.5 block truncate text-xs font-semibold text-slate-400">
                                      {option.description}
                                    </span>
                                  ) : null}
                                </span>
                                <span
                                  className={cn(
                                    'flex h-6 w-6 items-center justify-center rounded-full transition-all',
                                    selected
                                      ? 'bg-brand-600 text-white'
                                      : 'bg-white text-transparent ring-1 ring-slate-100',
                                  )}
                                >
                                  <Check size={13} />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
        : null}
    </div>
  );
};

const MotionDiv = motion.div;
const MotionButton = motion.button;
const MotionAside = motion.aside;
const MotionImg = motion.img;

const WORKSPACE_HERO_SLIDES = [
  {
    src: workspaceHeroOverviewImage,
    alt: 'StudyVault workspace overview with documents and AI assistant',
    label: 'StudyVault overview',
    description: 'Search, organize, and review documents in one workspace.',
  },
  {
    src: workspaceHeroLibraryImage,
    alt: 'Wide StudyVault document library dashboard',
    label: 'Smart library',
    description: 'Organize PDFs, notes, and lectures by folder.',
  },
  {
    src: workspaceHeroAiImage,
    alt: 'Wide AI assistant workspace for study documents',
    label: 'AI assistant',
    description: 'Summarize files and ask questions from your materials.',
  },
  {
    src: workspaceHeroFlowImage,
    alt: 'Wide StudyVault upload and review workflow',
    label: 'Study flow',
    description: 'Track uploads, tags, and review context in one place.',
  },
];

const readPositiveInt = (value, fallback) => {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const canUseLocalStorage = () => {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    );
  } catch {
    return false;
  }
};

const normalizeStoredWorkspaceQuery = (storedQuery = {}) => {
  if (!storedQuery || typeof storedQuery !== 'object') return {};

  const query = {};
  const readString = (key) =>
    typeof storedQuery[key] === 'string' ? storedQuery[key].trim() : '';

  const favorite = readString('favorite');
  const folderId = readString('folderId');
  const keyword = readString('keyword');
  const limit = readPositiveInt(readString('limit'), DEFAULT_LIMIT);
  const sortBy = readString('sortBy');
  const sortOrder = readString('sortOrder');
  const subjectId = readString('subjectId');
  const tagId = readString('tagId');
  const type = readString('type');

  if (favorite === 'true') query.favorite = favorite;
  if (folderId) query.folderId = folderId;
  if (keyword) query.keyword = keyword;
  if (limit !== DEFAULT_LIMIT) query.limit = String(limit);
  if (VALID_SORT_FIELDS.has(sortBy)) query.sortBy = sortBy;
  if (VALID_SORT_ORDERS.has(sortOrder)) query.sortOrder = sortOrder;
  if (subjectId) query.subjectId = subjectId;
  if (tagId) query.tagId = tagId;
  if (VALID_TYPES.has(type)) query.type = type;

  return query;
};

const readWorkspaceDocumentPreferences = () => {
  const fallback = { query: {}, viewMode: 'table' };
  if (!canUseLocalStorage()) return fallback;

  try {
    const rawValue = window.localStorage.getItem(
      WORKSPACE_DOCUMENTS_PREFERENCES_KEY,
    );
    if (!rawValue) return fallback;

    const parsedValue = JSON.parse(rawValue);
    return {
      query: normalizeStoredWorkspaceQuery(parsedValue?.query),
      viewMode: VALID_VIEW_MODES.has(parsedValue?.viewMode)
        ? parsedValue.viewMode
        : fallback.viewMode,
    };
  } catch {
    return fallback;
  }
};

const buildWorkspaceQueryPreferences = ({
  favorite,
  folderId,
  keyword,
  limit,
  sortBy,
  sortOrder,
  subjectId,
  tagId,
  type,
}) => {
  const query = {};

  if (favorite) query.favorite = 'true';
  if (folderId) query.folderId = folderId;
  if (keyword) query.keyword = keyword;
  if (limit !== DEFAULT_LIMIT) query.limit = String(limit);
  if (sortBy !== DEFAULT_SORT_BY) query.sortBy = sortBy;
  if (sortOrder !== DEFAULT_SORT_ORDER) query.sortOrder = sortOrder;
  if (subjectId) query.subjectId = subjectId;
  if (tagId) query.tagId = tagId;
  if (type) query.type = type;

  return query;
};

const writeWorkspaceDocumentPreferences = ({ query, viewMode }) => {
  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.setItem(
      WORKSPACE_DOCUMENTS_PREFERENCES_KEY,
      JSON.stringify({
        query: normalizeStoredWorkspaceQuery(query),
        viewMode: VALID_VIEW_MODES.has(viewMode) ? viewMode : 'table',
      }),
    );
  } catch {
    // Preferences are optional. If storage is blocked, the URL still works.
  }
};

const hasWorkspaceQueryPreferences = (params) =>
  WORKSPACE_QUERY_PREFERENCE_KEYS.some((key) => params.has(key));

const mergeStoredWorkspaceQuery = (params, storedQuery) => {
  const nextParams = new URLSearchParams(params);

  Object.entries(storedQuery).forEach(([key, value]) => {
    if (value) {
      nextParams.set(key, value);
    }
  });

  return nextParams;
};

const getFolderLabel = (folder, rootFolder) => {
  if (!folder) return 'Workspace';
  return folder.id === rootFolder?.id ? 'Workspace' : folder.name || 'Workspace';
};

const WorkspacePage = () => {
  const location = useLocation();
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
  const initialPreferencesRef = useRef(null);
  const [queryPreferencesHydrated, setQueryPreferencesHydrated] = useState(false);

  if (!initialPreferencesRef.current) {
    initialPreferencesRef.current = readWorkspaceDocumentPreferences();
  }

  const [flash, setFlash] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(searchParams.get('openUpload') === 'true');
  const [viewMode, setViewMode] = useState(initialPreferencesRef.current.viewMode);
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
  const isGlobalDocumentSearch = Boolean(keyword);
  const documentQueryFolderId = isGlobalDocumentSearch ? undefined : activeFolderId;
  const documentScopeLabel = isGlobalDocumentSearch ? 'All documents' : activeFolderLabel;
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
  const typeFilterOptions = TYPE_FILTERS.map((option) => ({
    ...option,
    Icon: FileText,
    label: option.label === 'All' ? 'All file types' : option.label,
  }));
  const tagFilterGroups = [
    {
      options: [
        {
          Icon: Tag,
          description: tagOptions.length > 0 ? 'Show documents from every tag' : 'No saved tags yet',
          label: 'All tags',
          value: '',
        },
      ],
    },
    subjectOptions.length > 0
      ? {
        label: 'Subjects',
        options: subjectOptions.map((subject) => ({
          Icon: BrainCircuit,
          description: 'Filter by subject',
          label: subject.name,
          value: `subject:${subject.id}`,
        })),
      }
      : null,
    otherTagOptions.length > 0
      ? {
        label: 'Tags',
        options: otherTagOptions.map((tag) => ({
          Icon: Tag,
          description: 'Filter by saved tag',
          label: tag.name,
          value: `tag:${tag.id}`,
        })),
      }
      : null,
  ].filter(Boolean);
  const sortFilterOptions = SORT_OPTIONS.map((option) => ({
    Icon: option.Icon,
    description: option.description,
    label: option.label,
    value: `${option.sortBy}:${option.sortOrder}`,
  }));
  const workspaceMetrics = [
    {
      label: 'Documents',
      value: pagination.total,
      icon: <FileText size={16} />,
    },
    {
      label: isGlobalDocumentSearch ? 'Search scope' : 'Current folder',
      value: documentScopeLabel,
      icon: <FolderClosed size={16} />,
    },
    {
      label: 'View mode',
      value: viewMode === 'grid' ? 'Grid' : 'List',
      icon: <ActiveViewIcon size={16} />,
    },
  ];
  const documentReturnPath = buildRoutePath(location);

  useEffect(() => {
    if (queryPreferencesHydrated) return;

    const storedQuery = initialPreferencesRef.current?.query || {};
    const shouldRestoreStoredQuery =
      !hasWorkspaceQueryPreferences(searchParams) &&
      Object.keys(storedQuery).length > 0;

    if (shouldRestoreStoredQuery) {
      const nextParams = mergeStoredWorkspaceQuery(searchParams, storedQuery);

      if (nextParams.toString() !== searchParams.toString()) {
        setSearchParams(nextParams, { replace: true });
        return;
      }
    }

    setQueryPreferencesHydrated(true);
  }, [queryPreferencesHydrated, searchParams, setSearchParams]);

  useEffect(() => {
    if (!queryPreferencesHydrated) return;

    writeWorkspaceDocumentPreferences({
      query: buildWorkspaceQueryPreferences({
        favorite,
        folderId: folderIdParam,
        keyword,
        limit,
        sortBy,
        sortOrder,
        subjectId,
        tagId,
        type,
      }),
      viewMode,
    });
  }, [favorite, folderIdParam, keyword, limit, queryPreferencesHydrated, sortBy, sortOrder, subjectId, tagId, type, viewMode]);

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
    if (!queryPreferencesHydrated || !rootFolder) return;
    const normalizedFolderId = folderIdParam && folderIdParam !== rootFolder.id ? folderIdParam : null;
    if (selectedFolderId !== normalizedFolderId) {
      selectFolder(normalizedFolderId);
    }
  }, [folderIdParam, queryPreferencesHydrated, rootFolder, selectFolder, selectedFolderId]);

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
    if (
      !queryPreferencesHydrated ||
      !rootFolder ||
      (!isGlobalDocumentSearch && !activeFolderId)
    ) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const loadDocuments = async () => {
      try {
        setDocumentsLoading(true);
        const result = await getDocuments({
          favorite: favorite ? true : undefined,
          folderId: documentQueryFolderId,
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
        setDocumentsError(
          getApiErrorMessage(
            requestError,
            'Documents could not be loaded. Please refresh and try again.',
          ),
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setDocumentsLoading(false);
        }
      }
    };

    void loadDocuments();
  }, [activeFolderId, documentQueryFolderId, favorite, isGlobalDocumentSearch, keyword, limit, page, queryPreferencesHydrated, reloadKey, rootFolder, sortBy, sortOrder, subjectId, tagId, type]);

  // Restore scroll position after documents finish loading (when returning from DocumentViewer)
  useEffect(() => {
    if (documentsLoading) return;

    const savedY = sessionStorage.getItem(WORKSPACE_SCROLL_RESTORE_KEY);
    if (savedY === null) return;

    sessionStorage.removeItem(WORKSPACE_SCROLL_RESTORE_KEY);
    const targetY = Number(savedY);
    if (!Number.isFinite(targetY) || targetY <= 0) return;

    // rAF ensures the DOM has painted new documents before scrolling
    requestAnimationFrame(() => {
      window.scrollTo({ top: targetY, behavior: 'instant' });
    });
  }, [documentsLoading]);

  const showSuccess = (message) => setFlash({ tone: 'success', message });
  const showError = (message) => setFlash({ tone: 'error', message });

  const getFallbackPage = () => (documents.length === 1 && page > 1 ? page - 1 : page);

  const handleFolderSelectionChange = (folderId) => {
    if (!rootFolder) return;
    const normalizedFolderId = folderId && folderId !== rootFolder.id ? folderId : null;
    selectFolder(normalizedFolderId);
    setSearchInput('');
    updateQuery(
      {
        folderId: normalizedFolderId || undefined,
        favorite: undefined,
        keyword: undefined,
      },
      { resetPage: true },
    );
  };

  const handleSearchInputChange = (event) => {
    const nextValue = event.target.value;
    setSearchInput(nextValue);

    if (!nextValue.trim() && keyword) {
      updateQuery({ keyword: undefined }, { resetPage: true });
    }
  };

  const handleApplySearch = () => {
    updateQuery({ keyword: searchInput.trim() || undefined }, { resetPage: true });
  };

  const handleClearSearch = () => {
    setSearchInput('');
    if (keyword) {
      updateQuery({ keyword: undefined }, { resetPage: true });
    }
  };

  const handleTagFilterChange = (value) => {
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

  const handleSortChange = (value) => {
    const [nextSortBy, nextSortOrder] = value.split(':');
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
      showError(
        getApiErrorMessage(
          requestError,
          'Favorite status could not be updated. Please try again.',
        ),
      );
    }
  };

  const handleDownloadDocument = async (documentId, title) => {
    try {
      await downloadDocumentFile(documentId, title);
    } catch (requestError) {
      showError(
        getApiErrorMessage(
          requestError,
          'The document could not be downloaded. Please try again.',
        ),
      );
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
      setRenameError(
        getApiErrorMessage(
          requestError,
          'The document could not be renamed. Please check the name and try again.',
        ),
      );
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
      setMoveError(
        getApiErrorMessage(
          requestError,
          'The document could not be moved. Please choose another folder and try again.',
        ),
      );
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
      setDeleteError(
        getApiErrorMessage(
          requestError,
          'The document could not be deleted. Please refresh and try again.',
        ),
      );
      setDeleting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-24 md:pb-8">
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
              'fixed bottom-24 left-1/2 z-[100] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full px-5 py-3 text-center text-xs font-black uppercase tracking-[0.14em] shadow-2xl md:bottom-10 md:px-6 md:tracking-[0.18em]',
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
          className="relative mx-auto grid w-full max-w-[1480px] grid-cols-1 items-center gap-4 overflow-visible px-0 pb-5 pt-0 sm:pb-6 lg:min-h-[300px] lg:grid-cols-[minmax(0,1fr)_minmax(540px,44vw)] lg:pt-2 2xl:grid-cols-[minmax(0,1fr)_760px]"
        >
          <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-brand-600 shadow-sm">
              <Sparkles size={14} />
              Study workspace
            </div>

            <h1 className="workspace-hero-title pb-2 text-4xl font-black leading-[1.05] tracking-normal sm:whitespace-nowrap sm:text-5xl lg:text-[3.35rem] xl:text-[3.75rem]">
              Study smarter
            </h1>

            <div className="relative mt-4 flex w-full max-w-3xl items-center rounded-[1.15rem] border border-brand-200 bg-white p-1.5 shadow-[0_20px_56px_-34px_rgba(66,53,48,0.65)] transition-all duration-300 focus-within:-translate-y-0.5 focus-within:border-brand-500 focus-within:shadow-[0_24px_68px_-34px_rgba(139,63,54,0.72),0_0_0_5px_rgba(198,90,70,0.12)]">
              <div className="pl-5 pr-2 text-slate-500">
                <Search size={19} />
              </div>

              <input
                type="text"
                placeholder="Search all documents..."
                value={searchInput}
                onChange={handleSearchInputChange}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleApplySearch();
                }}
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-left text-sm font-bold text-slate-800 outline-none placeholder:text-slate-500"
              />

              {searchInput || keyword ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  title="Clear search"
                  onClick={handleClearSearch}
                  className="mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-brand-600"
                >
                  <X size={16} />
                </button>
              ) : null}

              <MotionButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplySearch}
                className="sks-ai-glow-btn shrink-0 rounded-[0.95rem] bg-brand-900 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-brand-900/20 transition-all hover:bg-brand-600 sm:px-5"
              >
                Search
              </MotionButton>
            </div>

            <div className="mt-3 flex w-full max-w-3xl flex-wrap gap-2">
              {workspaceMetrics.map(({ label, value, icon }, index) => (
                <MotionDiv
                  key={label}
                  aria-label={`${label}: ${value}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.16 + index * 0.08, ease: 'easeOut' }}
                  className="workspace-metric-tile group min-h-[3.15rem] flex-1 basis-[104px] justify-center !rounded-[1rem] !px-2.5 !py-2 sm:basis-[160px] sm:justify-start sm:!px-3"
                >
                  <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-transform group-hover:scale-105 sm:flex">
                    {icon}
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="hidden truncate text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 sm:block">
                      {label}
                    </span>
                    <span className="block truncate text-sm font-black text-slate-900 sm:mt-0.5">
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
            className="workspace-visual-panel workspace-visual-panel--compact group hidden sm:block"
          >
            <AnimatePresence mode="wait">
              <MotionImg
                key={currentHeroSlide.src}
                src={currentHeroSlide.src}
                alt={currentHeroSlide.alt}
                initial={{ opacity: 0, scale: 1.01, y: 8 }}
                animate={{ opacity: 1, scale: 1.01, y: 0 }}
                exit={{ opacity: 0, scale: 1.03, y: -8 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="workspace-visual-image"
              />
            </AnimatePresence>

            <div className="workspace-hero-dots">
              {WORKSPACE_HERO_SLIDES.map((slide, index) => (
                <button
                  key={slide.label}
                  type="button"
                  aria-label={`Show ${slide.label}`}
                  aria-current={activeHeroSlide === index ? 'true' : undefined}
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
          </MotionDiv>
        </MotionDiv>

        <section className="mt-1 grid w-full grid-cols-1 gap-5 px-0 sm:-mt-3 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)]">
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
                    {documentScopeLabel}
                    {keyword ? <span>- Search: "{keyword}"</span> : null}
                    {type ? <span>- {activeTypeOption.label}</span> : null}
                    {activeSubjectOption ? <span>- {activeSubjectOption.name}</span> : null}
                    {activeTagOption ? <span>- {activeTagOption.name}</span> : null}
                    {favorite ? <span>- Favorites</span> : null}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {documents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(true)}
                      className="sks-ai-glow-btn inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-2.5 text-sm font-extrabold text-white shadow-[var(--shadow-brand)] transition-all hover:-translate-y-0.5 hover:bg-brand-600"
                    >
                      <CloudUpload size={17} />
                      Upload
                    </button>
                  )}

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
                  options={typeFilterOptions}
                  value={type}
                  onChangeValue={(nextType) =>
                    updateQuery(
                      { type: nextType || undefined },
                      { resetPage: true },
                    )
                  }
                />

                <FilterDropdown
                  Icon={Tag}
                  groups={tagFilterGroups}
                  label="Tag"
                  value={tagFilterValue}
                  onChangeValue={handleTagFilterChange}
                />

                <FilterDropdown
                  Icon={ArrowDownAZ}
                  label="Sort"
                  options={sortFilterOptions}
                  value={sortValue}
                  onChangeValue={handleSortChange}
                />
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
              onOpenDocument={(id) => {
                sessionStorage.setItem(WORKSPACE_SCROLL_RESTORE_KEY, String(window.scrollY));
                navigate(`/app/documents/${id}`, {
                  state: { returnTo: documentReturnPath },
                });
              }}
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
