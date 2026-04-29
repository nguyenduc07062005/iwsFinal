import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  Download,
  FileText,
  FolderClosed,
  Heart,
  Loader2,
  MessageSquare,
  PencilLine,
  RefreshCcw,
  Send,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getFilePresentation } from '../components/workspace/DocumentLibraryPanel.jsx';
import { useDocViewer } from '../context/DocViewerContext.jsx';
import {
  downloadDocumentFile,
  createDocumentNote,
  deleteDocumentNote,
  fetchDocumentFile,
  getDocumentDetails,
  getDocumentNotes,
  getRelatedDocuments,
  toggleFavorite,
  updateDocumentNote,
} from '../service/documentAPI.js';
import {
  askDocument,
  clearDocumentAskHistory,
  getDocumentAskHistory,
  getDocumentSummary,
} from '../service/ragAPI.js';
import { cn } from '../lib/utils.js';
import { getApiErrorMessage } from '../utils/apiError.js';

const MotionDiv = motion.div;

const AI_TABS = [
  { id: 'study', label: 'Study', Icon: Tag },
  { id: 'summary', label: 'Summary', Icon: Sparkles },
  { id: 'ask', label: 'Ask AI', Icon: MessageSquare },
  { id: 'related', label: 'Related', Icon: FileText },
];

const SUGGESTED_QUESTIONS = [
  'Summarize this document in 5 points',
  'What are the key concepts?',
  'Suggest review questions',
];

const markdownComponents = {
  p: ({ children }) => (
    <p className="mb-3 text-sm leading-7 text-slate-600 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-600 last:mb-0">
      {children}
    </ol>
  ),
  strong: ({ children }) => <strong className="font-black text-slate-900">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-bold text-[#9b3f36] underline underline-offset-4"
    >
      {children}
    </a>
  ),
};

const getSummaryKeyPoints = (summary) => {
  if (Array.isArray(summary?.key_points)) return summary.key_points;
  if (Array.isArray(summary?.keyPoints)) return summary.keyPoints;
  return [];
};

const ActionButton = ({ children, className, label, onClick }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={cn(
      'inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/82 text-slate-500 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white hover:text-[#9b3f36] hover:shadow-md',
      className,
    )}
  >
    {children}
  </button>
);

const LoadingBlock = ({ label = 'Loading data...' }) => (
  <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 text-center">
    <Loader2 className="h-9 w-9 animate-spin text-[#9b3f36]" />
    <p className="text-sm font-bold text-slate-500">{label}</p>
  </div>
);

const EmptyState = ({ icon = FileText, title, description, action }) => {
  const EmptyIcon = icon;

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/80 bg-white/48 px-6 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-[#9b3f36] shadow-sm">
        <EmptyIcon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-xl font-black tracking-tight text-slate-900">{title}</h3>
      <p className="mt-3 max-w-sm text-sm leading-7 text-slate-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
};

const RelatedCard = ({ document, onOpen }) => {
  const file = getFilePresentation(document);

  return (
    <button
      type="button"
      onClick={() => onOpen(document.id)}
      className="group flex w-full items-center gap-3 rounded-[1.5rem] border border-white/70 bg-white/72 p-3 text-left shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
    >
      <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-[0.14em]', file.accent)}>
        {file.label}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-900 transition-colors group-hover:text-[#9b3f36]">
          {document.title}
        </p>
        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
          {document.folderName || 'Workspace'} - {document.formattedFileSize || 'Unknown size'}
        </p>
      </div>
    </button>
  );
};

const DocumentViewer = () => {
  const navigate = useNavigate();
  const { id: documentId } = useParams();
  const { clearDocViewer } = useDocViewer();
  const fileUrlRef = useRef('');

  const [activeTab, setActiveTab] = useState('study');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [documentData, setDocumentData] = useState(null);
  const [relatedDocuments, setRelatedDocuments] = useState([]);
  const [fileUrl, setFileUrl] = useState('');
  const [contentType, setContentType] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewerError, setViewerError] = useState('');
  const [previewError, setPreviewError] = useState('');

  const [summaryState, setSummaryState] = useState({
    loading: false,
    error: '',
    data: null,
  });

  const [askHistory, setAskHistory] = useState([]);
  const [askHistoryLoaded, setAskHistoryLoaded] = useState(false);
  const [askHistoryLoading, setAskHistoryLoading] = useState(false);
  const [askHistoryError, setAskHistoryError] = useState('');
  const [askQuestion, setAskQuestion] = useState('');
  const [askState, setAskState] = useState({
    loading: false,
    error: '',
    pendingQuestion: '',
  });
  const [studyNotes, setStudyNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteError, setNoteError] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState('');
  const [editingNoteContent, setEditingNoteContent] = useState('');

  const cleanupFileUrl = useCallback(() => {
    if (fileUrlRef.current) {
      URL.revokeObjectURL(fileUrlRef.current);
      fileUrlRef.current = '';
    }
    setFileUrl('');
  }, []);

  const loadSummary = useCallback(
    async (language, options = {}) => {
      if (!documentId) return;

      try {
        setSummaryState((current) => ({
          ...current,
          loading: true,
          error: '',
        }));
        const result = await getDocumentSummary(documentId, language, options);
        setSummaryState({
          loading: false,
          error: '',
          data: result,
        });
      } catch (error) {
        setSummaryState({
          loading: false,
          error: getApiErrorMessage(error, 'Could not create a summary for this document.'),
          data: null,
        });
      }
    },
    [documentId],
  );

  const loadAskHistory = useCallback(async () => {
    if (!documentId || askHistoryLoading) return;

    try {
      setAskHistoryLoading(true);
      const result = await getDocumentAskHistory(documentId);
      setAskHistory(result.items || []);
      setAskHistoryLoaded(true);
      setAskHistoryError('');
    } catch (error) {
      setAskHistoryError(getApiErrorMessage(error, 'Could not load Q&A history.'));
      setAskHistoryLoaded(true);
    } finally {
      setAskHistoryLoading(false);
    }
  }, [askHistoryLoading, documentId]);

  const loadNotes = useCallback(async () => {
    if (!documentId) return;

    try {
      setNotesLoading(true);
      const result = await getDocumentNotes(documentId);
      setStudyNotes(result.notes || []);
      setNoteError('');
    } catch (error) {
      setNoteError(getApiErrorMessage(error, 'Could not load study notes.'));
    } finally {
      setNotesLoading(false);
    }
  }, [documentId]);

  const loadViewer = useCallback(async () => {
    if (!documentId) return;

    try {
      setLoading(true);
      setViewerError('');
      setPreviewError('');
      cleanupFileUrl();

      const detailResult = await getDocumentDetails(documentId);
      setDocumentData(detailResult.document);

      void getRelatedDocuments(documentId)
        .then((result) => setRelatedDocuments(result.documents || []))
        .catch(() => setRelatedDocuments([]));

      try {
        const { blob, contentType: nextContentType } = await fetchDocumentFile(documentId);
        const nextFileUrl = URL.createObjectURL(blob);
        fileUrlRef.current = nextFileUrl;
        setFileUrl(nextFileUrl);
        setContentType(nextContentType || blob.type || '');
      } catch (previewRequestError) {
        setPreviewError(
          getApiErrorMessage(previewRequestError, 'Could not preview this file.'),
        );
      }
    } catch (error) {
      setViewerError(getApiErrorMessage(error, 'Could not open the document.'));
    } finally {
      setLoading(false);
    }
  }, [cleanupFileUrl, documentId]);

  useEffect(() => {
    void loadViewer();
    void loadNotes();

    return () => {
      cleanupFileUrl();
      clearDocViewer?.();
    };
  }, [cleanupFileUrl, clearDocViewer, loadNotes, loadViewer]);

  useEffect(() => {
    void loadSummary(selectedLanguage);
  }, [loadSummary, selectedLanguage]);

  useEffect(() => {
    if (activeTab === 'ask' && !askHistoryLoaded && !loading && !viewerError) {
      void loadAskHistory();
    }
  }, [activeTab, askHistoryLoaded, loadAskHistory, loading, viewerError]);

  const canPreview = useMemo(() => {
    const normalizedType = contentType.toLowerCase();
    return normalizedType.includes('pdf') || normalizedType.startsWith('text/');
  }, [contentType]);

  const filePresentation = useMemo(
    () => getFilePresentation(documentData || { title: '', fileRef: '' }),
    [documentData],
  );

  const summaryVersions = useMemo(
    () => (Array.isArray(summaryState.data?.versions) ? summaryState.data.versions : []),
    [summaryState.data],
  );

  const activeSummary =
    summaryVersions.find((version) => version.active) ||
    summaryVersions[0] ||
    summaryState.data;

  const keyPoints = getSummaryKeyPoints(activeSummary);
  const summaryBody = typeof activeSummary?.body === 'string' ? activeSummary.body : '';
  const summaryOverview = typeof activeSummary?.overview === 'string' ? activeSummary.overview : '';
  const summaryConclusion =
    typeof activeSummary?.conclusion === 'string' ? activeSummary.conclusion : '';

  const handleToggleFavorite = async () => {
    if (!documentId) return;

    try {
      const result = await toggleFavorite(documentId);
      setDocumentData((current) => ({
        ...(current || {}),
        ...(result.document || {}),
      }));
    } catch (error) {
      setViewerError(getApiErrorMessage(error, 'Could not update favorites.'));
    }
  };

  const handleAsk = async () => {
    const trimmedQuestion = askQuestion.trim();
    if (!documentId || !trimmedQuestion || askState.loading) return;

    try {
      setAskState({
        loading: true,
        error: '',
        pendingQuestion: trimmedQuestion,
      });

      const result = await askDocument(documentId, trimmedQuestion);
      setAskHistory((current) => [...current, result.historyItem].slice(-8));
      setAskHistoryLoaded(true);
      setAskQuestion('');
      setAskState({
        loading: false,
        error: '',
        pendingQuestion: '',
      });
    } catch (error) {
      setAskState({
        loading: false,
        error: getApiErrorMessage(error, 'Could not create an answer.'),
        pendingQuestion: '',
      });
    }
  };

  const handleClearAskHistory = async () => {
    if (!documentId || askHistoryLoading) return;

    try {
      setAskHistoryLoading(true);
      await clearDocumentAskHistory(documentId);
      setAskHistory([]);
      setAskHistoryError('');
      setAskHistoryLoaded(true);
    } catch (error) {
      setAskHistoryError(getApiErrorMessage(error, 'Could not clear Q&A history.'));
    } finally {
      setAskHistoryLoading(false);
    }
  };

  const handleCreateNote = async () => {
    const content = noteContent.trim();
    if (!documentId || !content || noteSaving) return;

    try {
      setNoteSaving(true);
      const result = await createDocumentNote(documentId, content);
      setStudyNotes((current) => [result.note, ...current]);
      setNoteContent('');
      setNoteError('');
    } catch (error) {
      setNoteError(getApiErrorMessage(error, 'Could not save study note.'));
    } finally {
      setNoteSaving(false);
    }
  };

  const handleUpdateNote = async (noteId) => {
    const content = editingNoteContent.trim();
    if (!noteId || !content || noteSaving) return;

    try {
      setNoteSaving(true);
      const result = await updateDocumentNote(noteId, content);
      setStudyNotes((current) =>
        current.map((note) => (note.id === noteId ? result.note : note)),
      );
      setEditingNoteId('');
      setEditingNoteContent('');
      setNoteError('');
    } catch (error) {
      setNoteError(getApiErrorMessage(error, 'Could not update study note.'));
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!noteId || noteSaving) return;

    try {
      setNoteSaving(true);
      await deleteDocumentNote(noteId);
      setStudyNotes((current) => current.filter((note) => note.id !== noteId));
      setNoteError('');
    } catch (error) {
      setNoteError(getApiErrorMessage(error, 'Could not delete study note.'));
    } finally {
      setNoteSaving(false);
    }
  };

  const renderStudy = () => (
    <div className="space-y-4">
        <section className="rounded-[1.45rem] border border-white/82 bg-white/82 p-4 shadow-sm backdrop-blur-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.17em] text-[#9b3f36]">
            My study notes
          </p>
          <textarea
            value={noteContent}
            onChange={(event) => setNoteContent(event.target.value)}
            rows={3}
            placeholder="Write a note for this document..."
            className="mt-3 w-full resize-none rounded-[1.1rem] border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-brand-200 focus:bg-white focus:ring-2 focus:ring-brand-500/15"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => void handleCreateNote()}
              disabled={!noteContent.trim() || noteSaving}
              className="rounded-full bg-[#1f2a44] px-4 py-2 text-xs font-black text-white shadow-lg shadow-[#1f2a44]/16 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
            >
              Save note
            </button>
          </div>

          {noteError ? (
            <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {noteError}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {notesLoading ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
                Loading notes...
              </div>
            ) : null}

            {!notesLoading && studyNotes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm font-semibold text-slate-500">
                No notes yet.
              </div>
            ) : null}

            {studyNotes.map((note) => {
              const editing = editingNoteId === note.id;
              return (
                <article
                  key={note.id}
                  className="rounded-[1.2rem] border border-white/80 bg-white px-4 py-3 shadow-sm"
                >
                  {editing ? (
                    <textarea
                      value={editingNoteContent}
                      onChange={(event) => setEditingNoteContent(event.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-[1rem] border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold leading-6 text-slate-700 outline-none focus:border-brand-200 focus:bg-white"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                      {note.content}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-slate-400">
                      {new Date(note.updatedAt || note.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    <div className="flex items-center gap-1">
                      {editing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleUpdateNote(note.id)}
                            className="rounded-full bg-[#9b3f36] px-3 py-1.5 text-xs font-black text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId('');
                              setEditingNoteContent('');
                            }}
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditingNoteContent(note.content);
                            }}
                            aria-label="Edit note"
                            title="Edit note"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-brand-50 hover:text-brand-600"
                          >
                            <PencilLine size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteNote(note.id)}
                            aria-label="Delete note"
                            title="Delete note"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
  );

  const renderSummary = () => {
    if (summaryState.loading) {
      return <LoadingBlock label="AI is reading the document..." />;
    }

    if (summaryState.error) {
      return (
        <EmptyState
          icon={RefreshCcw}
          title="Summary could not be created"
          description={summaryState.error}
          action={(
            <button
              type="button"
              onClick={() => void loadSummary(selectedLanguage, { forceRefresh: true })}
              className="rounded-full bg-[#9b3f36] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#9b3f36]/20 transition-all hover:-translate-y-0.5"
            >
              Try again
            </button>
          )}
        />
      );
    }

    if (!activeSummary) {
      return (
        <EmptyState
          icon={Sparkles}
          title="No summary yet"
          description="Create the first summary to quickly understand the document."
          action={(
            <button
              type="button"
              onClick={() => void loadSummary(selectedLanguage, { forceRefresh: true })}
              className="rounded-full bg-[#9b3f36] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#9b3f36]/20 transition-all hover:-translate-y-0.5"
            >
              Create summary
            </button>
          )}
        />
      );
    }

    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-[1.45rem] bg-gradient-to-br from-[#1f2a44] via-[#6f3f3b] to-[#e56f56] p-4 text-white shadow-xl shadow-[#1f2a44]/14">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/62">
                AI summary
              </p>
              <h3 className="mt-2 line-clamp-2 text-lg font-black leading-snug tracking-tight text-white">
                {activeSummary.title || documentData?.title || 'Main content'}
              </h3>
            </div>

            <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/16 p-1 ring-1 ring-white/18 backdrop-blur-xl">
              {['en'].map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => setSelectedLanguage(language)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[11px] font-black uppercase transition-all',
                    selectedLanguage === language
                      ? 'bg-white text-[#9b3f36] shadow-sm'
                      : 'text-white/62 hover:text-white',
                  )}
                >
                  {language}
                </button>
              ))}
              <button
                type="button"
                aria-label="Refresh summary"
                title="Refresh summary"
                onClick={() => void loadSummary(selectedLanguage, { forceRefresh: true })}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/62 transition-colors hover:bg-white hover:text-[#9b3f36]"
              >
                <RefreshCcw size={14} />
              </button>
            </div>
          </div>
        </div>

        {summaryBody ? (
          <div className="rounded-[1.45rem] border border-white/82 bg-white/84 p-4 shadow-sm backdrop-blur-xl">
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.17em] text-[#9b3f36]">
              <Sparkles size={13} />
              Summary
            </p>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {summaryBody}
            </ReactMarkdown>
          </div>
        ) : null}

        {summaryOverview ? (
          <div className="rounded-[1.45rem] border border-white/82 bg-white/72 p-4 shadow-sm backdrop-blur-xl">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.17em] text-slate-400">
              Overview
            </p>
            <p className="text-sm font-semibold leading-7 text-slate-600">{summaryOverview}</p>
          </div>
        ) : null}

        {keyPoints.length > 0 ? (
          <div className="rounded-[1.45rem] border border-white/82 bg-white/64 p-3 shadow-sm backdrop-blur-xl">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.17em] text-slate-400">
              Key points
            </p>
            <div className="space-y-2">
            {keyPoints.map((point, index) => (
              <div
                key={`${index}-${String(point).slice(0, 20)}`}
                className="group flex gap-3 rounded-[1.1rem] bg-white/82 p-3 text-sm leading-7 text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#9b3f36] text-[11px] font-black text-white shadow-sm">
                  {index + 1}
                </span>
                <span className="font-semibold text-slate-700">{point}</span>
              </div>
            ))}
            </div>
          </div>
        ) : null}

        {summaryConclusion ? (
          <div className="rounded-[1.45rem] bg-gradient-to-br from-[#1f2a44] to-[#9b3f36] p-4 text-white shadow-xl shadow-[#1f2a44]/14">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">
              Conclusion
            </p>
            <p className="mt-3 text-sm font-semibold leading-7 text-white/90">{summaryConclusion}</p>
          </div>
        ) : null}
      </div>
    );
  };

  const renderAsk = () => (
    <div className="flex h-full min-h-0 flex-col">
      {askHistory.length > 0 ? (
        <div className="mb-3 flex items-center justify-between rounded-[1.1rem] border border-white/82 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-2">
            <Bot size={15} className="shrink-0 text-[#9b3f36]" />
            <h3 className="truncate text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              Conversation
            </h3>
          </div>
          <button
            type="button"
            aria-label="Clear Q&A history"
            title="Clear Q&A history"
            onClick={() => void handleClearAskHistory()}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {askHistoryLoading && askHistory.length === 0 ? (
          <LoadingBlock label="Loading conversation..." />
        ) : null}

        {!askHistoryLoading && askHistory.length === 0 ? (
          <div className="rounded-[1.45rem] border border-white/82 bg-white/68 p-4 shadow-sm backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#9b3f36]/10 text-[#9b3f36]">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950">Start asking AI</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                  Choose a suggestion or enter your question.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => setAskQuestion(question)}
                  className="rounded-full border border-white/80 bg-white/82 px-3 py-2 text-left text-xs font-black text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:text-[#9b3f36]"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {askHistory.map((item) => (
          <div key={item.id} className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[86%] rounded-[1.25rem] rounded-tr-sm bg-[#1f2a44] px-4 py-3 text-sm font-semibold leading-7 text-white shadow-md">
                {item.question}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#9b3f36]/10 text-[#9b3f36] shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1 rounded-[1.25rem] rounded-tl-sm border border-white/82 bg-white/86 px-4 py-3 shadow-sm backdrop-blur-xl">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {item.answer || ''}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {askState.loading && askState.pendingQuestion ? (
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[86%] rounded-[1.25rem] rounded-tr-sm bg-[#1f2a44] px-4 py-3 text-sm font-semibold leading-7 text-white shadow-md">
                {askState.pendingQuestion}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/82 bg-white/82 px-4 py-3 shadow-sm backdrop-blur-xl">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#9b3f36]/10 text-[#9b3f36]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#9b3f36]/45 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#9b3f36]/45 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#9b3f36]/45" />
              </div>
            </div>
          </div>
        ) : null}

        {askHistoryError || askState.error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {askHistoryError || askState.error}
          </div>
        ) : null}
      </div>

      <div className="mt-2 rounded-[1rem] border border-white/82 bg-white/88 p-2 shadow-sm backdrop-blur-xl">
        <textarea
          value={askQuestion}
          onChange={(event) => setAskQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void handleAsk();
            }
          }}
          rows={2}
          placeholder="Ask a quick question about this document..."
          className="w-full resize-none border-none bg-transparent px-2 py-1.5 text-sm font-semibold leading-5 text-slate-700 outline-none placeholder:text-slate-400"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleAsk()}
            disabled={askState.loading || !askQuestion.trim()}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#9b3f36] px-3.5 py-1.5 text-xs font-black text-white shadow-lg shadow-[#9b3f36]/18 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Send size={13} />
            Send
          </button>
        </div>
      </div>
    </div>
  );

  const renderRelated = () => (
    <div className="space-y-3">
      {relatedDocuments.length > 0 ? (
        relatedDocuments.map((document) => (
          <RelatedCard
            key={document.id}
            document={document}
            onOpen={(nextDocumentId) => navigate(`/app/documents/${nextDocumentId}`)}
          />
        ))
      ) : (
        <EmptyState
          icon={FileText}
          title="No related documents yet"
          description="Upload more related documents so the system can improve its suggestions."
        />
      )}
    </div>
  );

  const renderPreview = () => {
    if (loading) {
      return <LoadingBlock label="Opening preview..." />;
    }

    if (viewerError) {
      return (
        <EmptyState
          icon={RefreshCcw}
          title="Could not open document"
          description={viewerError}
          action={(
            <button
              type="button"
              onClick={() => void loadViewer()}
              className="rounded-full bg-[#9b3f36] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#9b3f36]/20 transition-all hover:-translate-y-0.5"
            >
              Reload
            </button>
          )}
        />
      );
    }

    if (canPreview && fileUrl) {
      return (
        <iframe
          src={`${fileUrl}#toolbar=0`}
          title="Document preview"
          className="h-full w-full border-0 bg-white"
        />
      );
    }

    return (
      <EmptyState
        icon={FileText}
        title="Preview is not supported"
        description={
          previewError ||
          'This file type cannot be previewed yet. You can download it to open it on your device.'
        }
        action={(
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => void downloadDocumentFile(documentId, documentData?.title)}
              className="rounded-full bg-[#9b3f36] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#9b3f36]/20 transition-all hover:-translate-y-0.5"
            >
              Download
            </button>
          </div>
        )}
      />
    );
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.35rem] border border-white/74 bg-white/30 shadow-[0_30px_90px_-58px_rgba(31,42,68,0.42)] backdrop-blur-xl"
    >
      <header className="flex min-h-[3.25rem] items-center gap-2 border-b border-white/70 bg-white/42 px-2 py-2 backdrop-blur-2xl sm:px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/82 text-slate-500 shadow-sm transition-all hover:-translate-y-0.5 hover:text-[#9b3f36]"
            aria-label="Back to workspace"
            title="Back to workspace"
          >
            <ArrowLeft size={16} />
          </button>
          <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]', filePresentation.accent)}>
            {filePresentation.label}
          </span>
          <h1 className="min-w-0 flex-1 truncate text-sm font-black tracking-tight text-slate-950 sm:text-base lg:text-lg">
            {documentData?.title || 'Opening document'}
          </h1>
          <span className="hidden min-w-0 shrink items-center gap-1.5 truncate rounded-full bg-white/66 px-2.5 py-1 text-xs font-bold text-slate-500 shadow-sm md:inline-flex">
            <FolderClosed size={12} />
            <span className="truncate">{documentData?.folderName || 'Workspace'}</span>
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <ActionButton
            label={documentData?.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={handleToggleFavorite}
            className={cn('h-9 w-9 rounded-xl', documentData?.isFavorite ? 'text-amber-500' : '')}
          >
            <Heart size={17} fill={documentData?.isFavorite ? 'currentColor' : 'none'} />
          </ActionButton>
          <button
            type="button"
            onClick={() => void downloadDocumentFile(documentId, documentData?.title)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#9b3f36] px-3 text-sm font-black text-white shadow-lg shadow-[#9b3f36]/20 transition-all hover:-translate-y-0.5"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden p-2 xl:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_455px]">
        <section className="relative min-h-0 overflow-hidden rounded-[1.35rem] border border-white/82 bg-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_22px_62px_-58px_rgba(31,42,68,0.48)] backdrop-blur-xl">
          <div className="h-full overflow-hidden">{renderPreview()}</div>
        </section>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[1.35rem] border border-white/82 bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_22px_62px_-58px_rgba(31,42,68,0.48)] backdrop-blur-xl">
          <div className="border-b border-white/70 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f2a44] to-[#9b3f36] text-white shadow-lg shadow-[#1f2a44]/15">
                  <Sparkles size={16} />
                </div>
                <h2 className="text-base font-black tracking-tight text-slate-950">
                  Document assistant
                </h2>
              </div>
              <span className="rounded-full bg-white/76 px-2.5 py-1 text-[10px] font-black text-slate-500 shadow-sm">
                AI
              </span>
            </div>

            <div className="mt-2 grid grid-cols-4 gap-1 rounded-xl bg-white/62 p-1 shadow-sm">
              {AI_TABS.map((tab) => {
                const Icon = tab.Icon;
                const active = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-black transition-all',
                      active
                        ? 'bg-white text-[#9b3f36] shadow-sm'
                        : 'text-slate-500 hover:text-slate-800',
                    )}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {activeTab === 'study' ? renderStudy() : null}
            {activeTab === 'summary' ? renderSummary() : null}
            {activeTab === 'ask' ? renderAsk() : null}
            {activeTab === 'related' ? renderRelated() : null}
          </div>
        </aside>
      </div>
    </MotionDiv>
  );
};

export default DocumentViewer;
