import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownAZ,
  BrainCircuit,
  CloudUpload,
  FileText,
  FolderClosed,
  LayoutGrid,
  List,
  Tag,
} from 'lucide-react';
import { useDocumentsContext } from '../components/DocumentsContext.jsx';
import UploadModal from '../components/documents/UploadModal.jsx';
import FoldersPanel from '../components/folders/FoldersPanel.jsx';
import DocumentLibraryPanel from '../components/workspace/DocumentLibraryPanel.jsx';
import FilterDropdown from '../components/workspace/FilterDropdown.jsx';
import WorkspaceDocumentModals from '../components/workspace/WorkspaceDocumentModals.jsx';
import WorkspaceHero from '../components/workspace/WorkspaceHero.jsx';
import useWorkspacePreferences from '../hooks/useWorkspacePreferences.js';
import useWorkspaceDocuments from '../hooks/useWorkspaceDocuments.js';
import useWorkspaceActions from '../hooks/useWorkspaceActions.js';
import { WORKSPACE_SCROLL_RESTORE_KEY } from '../hooks/useWorkspaceDocuments.js';
import { cn } from '@/lib/utils.js';
import { buildRoutePath } from '../utils/workspaceNavigation.js';

const MotionDiv = motion.div;
const MotionAside = motion.aside;

// ─── Filter Option Constants ──────────────────────────────────────────────────

const TYPE_FILTERS = [
  { label: 'All', value: '', description: 'Show all file types' },
  { label: 'PDF', value: 'pdf', description: 'Show only PDF files' },
  { label: 'Word', value: 'docx', description: 'Show only DOCX files' },
  { label: 'Text', value: 'txt', description: 'Show only TXT files' },
];

const SORT_OPTIONS = [
  { label: 'Recently uploaded', sortBy: 'createdAt', sortOrder: 'desc', description: 'Recently uploaded documents first', Icon: FileText },
  { label: 'Recently updated', sortBy: 'updatedAt', sortOrder: 'desc', description: 'Recently updated documents first', Icon: FileText },
  { label: 'Name A-Z', sortBy: 'title', sortOrder: 'asc', description: 'Sort documents by name from A to Z', Icon: ArrowDownAZ },
  { label: 'Largest files', sortBy: 'fileSize', sortOrder: 'desc', description: 'Largest files first', Icon: FileText },
];

const getFolderLabel = (folder, rootFolder) => {
  if (!folder) return 'All documents';
  if (rootFolder && folder.id === rootFolder.id) return 'All documents';
  return folder.name || 'Folder';
};

// ─── Main Component ───────────────────────────────────────────────────────────

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

  // ── Hooks ─────────────────────────────────────────────────────────────────

  const prefs = useWorkspacePreferences(rootFolder);
  const {
    favorite, folderIdParam, keyword, limit, page,
    queryPreferencesHydrated, sortBy, sortOrder,
    subjectId, tagId, type,
    viewMode, setViewMode,
    updateQuery,
  } = prefs;

  const activeFolder = selectedFolder || rootFolder;
  const activeFolderId = activeFolder?.id || null;
  const activeFolderLabel = getFolderLabel(activeFolder, rootFolder);
  const isGlobalDocumentSearch = Boolean(keyword);
  const documentQueryFolderId = isGlobalDocumentSearch ? undefined : activeFolderId;
  const documentScopeLabel = isGlobalDocumentSearch ? 'All documents' : activeFolderLabel;

  const {
    documents, documentsError, documentsLoading,
    pagination, refreshList, setDocuments,
  } = useWorkspaceDocuments({
    activeFolderId,
    documentQueryFolderId,
    favorite,
    isGlobalDocumentSearch,
    keyword,
    limit,
    page,
    queryPreferencesHydrated,
    rootFolder,
    sortBy,
    sortOrder,
    subjectId,
    tagId,
    type,
  });

  const actions = useWorkspaceActions({
    activeFolderId,
    documents,
    page,
    refreshFolders,
    refreshList,
    rootFolder,
    setDocuments,
    subjectId,
    tagId,
    updateQuery,
  });

  // ── Local UI state ────────────────────────────────────────────────────────

  const [showUploadModal, setShowUploadModal] = useState(searchParams.get('openUpload') === 'true');
  const [searchInput, setSearchInput] = useState(keyword);

  // Sync search input with keyword from URL
  useEffect(() => { setSearchInput(keyword); }, [keyword]);

  // Handle ?openUpload=true URL param
  useEffect(() => {
    if (searchParams.get('openUpload') !== 'true') return;
    setShowUploadModal(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('openUpload');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Sync folder selection with URL param
  useEffect(() => {
    if (!queryPreferencesHydrated || !rootFolder) return;
    const normalizedFolderId = folderIdParam && folderIdParam !== rootFolder.id ? folderIdParam : null;
    if (selectedFolderId !== normalizedFolderId) {
      selectFolder(normalizedFolderId);
    }
  }, [folderIdParam, queryPreferencesHydrated, rootFolder, selectFolder, selectedFolderId]);

  // ── Derived filter config ─────────────────────────────────────────────────

  const ActiveViewIcon = viewMode === 'grid' ? LayoutGrid : List;
  const sortValue = `${sortBy}:${sortOrder}`;
  const activeTypeOption = TYPE_FILTERS.find((o) => o.value === type) || TYPE_FILTERS[0];

  const subjectOptions = actions.tagOptions.filter((t) => t.type === 'SUBJECT');
  const otherTagOptions = actions.tagOptions.filter((t) => t.type !== 'SUBJECT');
  const activeSubjectOption = subjectOptions.find((t) => t.id === subjectId);
  const activeTagOption = otherTagOptions.find((t) => t.id === tagId);
  const tagFilterValue = subjectId ? `subject:${subjectId}` : tagId ? `tag:${tagId}` : '';

  const typeFilterOptions = TYPE_FILTERS.map((o) => ({
    ...o,
    Icon: FileText,
    label: o.label === 'All' ? 'All file types' : o.label,
  }));

  const tagFilterGroups = [
    {
      options: [{
        Icon: Tag,
        description: actions.tagOptions.length > 0 ? 'Show documents from every tag' : 'No saved tags yet',
        label: 'All tags',
        value: '',
      }],
    },
    subjectOptions.length > 0
      ? { label: 'Subjects', options: subjectOptions.map((s) => ({ Icon: BrainCircuit, description: 'Filter by subject', label: s.name, value: `subject:${s.id}` })) }
      : null,
    otherTagOptions.length > 0
      ? { label: 'Tags', options: otherTagOptions.map((t) => ({ Icon: Tag, description: 'Filter by saved tag', label: t.name, value: `tag:${t.id}` })) }
      : null,
  ].filter(Boolean);

  const sortFilterOptions = SORT_OPTIONS.map((o) => ({
    Icon: o.Icon,
    description: o.description,
    label: o.label,
    value: `${o.sortBy}:${o.sortOrder}`,
  }));

  const workspaceMetrics = [
    { label: 'Documents', value: pagination.total, icon: <FileText size={16} /> },
    { label: isGlobalDocumentSearch ? 'Search scope' : 'Current folder', value: documentScopeLabel, icon: <FolderClosed size={16} /> },
    { label: 'View mode', value: viewMode === 'grid' ? 'Grid' : 'List', icon: <ActiveViewIcon size={16} /> },
  ];

  const documentReturnPath = buildRoutePath(location);

  // ── Search handlers ───────────────────────────────────────────────────────

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
    if (keyword) updateQuery({ keyword: undefined }, { resetPage: true });
  };

  const handleFolderSelectionChange = (folderId) => {
    if (!rootFolder) return;
    const normalizedFolderId = folderId && folderId !== rootFolder.id ? folderId : null;
    selectFolder(normalizedFolderId);
    setSearchInput('');
    updateQuery(
      { folderId: normalizedFolderId || undefined, favorite: undefined, keyword: undefined },
      { resetPage: true },
    );
  };

  const handleTagFilterChange = (value) => {
    if (!value) {
      updateQuery({ subjectId: undefined, tagId: undefined }, { resetPage: true });
      return;
    }
    const [kind, id] = value.split(':');
    updateQuery(
      { subjectId: kind === 'subject' ? id : undefined, tagId: kind === 'tag' ? id : undefined },
      { resetPage: true },
    );
  };

  const handleSortChange = (value) => {
    const [nextSortBy, nextSortOrder] = value.split(':');
    updateQuery({ sortBy: nextSortBy, sortOrder: nextSortOrder }, { resetPage: true });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-24 md:pb-8">
      <div className="workspace-aurora pointer-events-none inset-0 z-0" />

      <AnimatePresence>
        {actions.flash && (
          <MotionDiv
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            className={cn(
              'fixed bottom-24 left-1/2 z-[100] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-full px-5 py-3 text-center text-xs font-black uppercase tracking-[0.14em] shadow-2xl md:bottom-10 md:px-6 md:tracking-[0.18em]',
              actions.flash.tone === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white',
            )}
          >
            {actions.flash.message}
          </MotionDiv>
        )}
      </AnimatePresence>

      <main className="relative z-10 w-full">
        <WorkspaceHero
          searchInput={searchInput}
          onSearchInputChange={handleSearchInputChange}
          onApplySearch={handleApplySearch}
          onClearSearch={handleClearSearch}
          keyword={keyword}
          metrics={workspaceMetrics}
        />

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
            {/* Toolbar */}
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
                    {keyword ? <span>- Search: &quot;{keyword}&quot;</span> : null}
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
                  onChangeValue={(nextType) => updateQuery({ type: nextType || undefined }, { resetPage: true })}
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
                navigate(`/app/documents/${id}`, { state: { returnTo: documentReturnPath } });
              }}
              onDownloadDocument={actions.handleDownloadDocument}
              onToggleFavorite={actions.handleToggleFavorite}
              onMoveDocument={(doc) => {
                actions.setMoveTarget(doc);
                actions.setMoveDestinationId(doc.folderId || rootFolder?.id);
              }}
              onRenameDocument={(doc) => {
                actions.setRenameTarget(doc);
                actions.setRenameName(doc.title);
              }}
              onDeleteDocument={(doc) => actions.setDeleteTarget(doc)}
              onCreateTag={actions.handleCreateTag}
              onUpdateDocumentTags={actions.handleUpdateDocumentTags}
              pagination={{
                currentPage: pagination.currentPage,
                totalPages: pagination.totalPages,
                total: pagination.total,
                onPageChange: (nextPage) => updateQuery({ page: nextPage }),
              }}
              tagOptions={actions.tagOptions}
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
        onCreateTag={actions.handleCreateTag}
        onDeleteTag={actions.handleDeleteTag}
        onUploadSuccess={actions.handleUpload}
        folders={folderOptions}
        defaultFolderId={activeFolderId || ''}
        tags={actions.tagOptions}
      />

      <WorkspaceDocumentModals
        deleteError={actions.deleteError}
        deleteTarget={actions.deleteTarget}
        deleting={actions.deleting}
        folderOptions={folderOptions}
        moveDestinationId={actions.moveDestinationId}
        moveError={actions.moveError}
        moveTarget={actions.moveTarget}
        moving={actions.moving}
        onCloseDelete={() => actions.setDeleteTarget(null)}
        onCloseMove={() => actions.setMoveTarget(null)}
        onCloseRename={() => actions.setRenameTarget(null)}
        onConfirmDelete={actions.handleDeleteDocumentConfirm}
        onConfirmMove={actions.handleMoveDocumentConfirm}
        onConfirmRename={actions.handleRenameDocumentConfirm}
        onMoveDestinationChange={(event) => actions.setMoveDestinationId(event.target.value)}
        onRenameNameChange={(event) => actions.setRenameName(event.target.value)}
        renameError={actions.renameError}
        renameName={actions.renameName}
        renameTarget={actions.renameTarget}
        renaming={actions.renaming}
      />
    </div>
  );
};

export default WorkspacePage;
