import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
import { downloadDocumentFile } from '../service/documentAPI.js';
import { cn } from '@/lib/utils.js';
import { getSafeWorkspaceReturnPath } from '../utils/workspaceNavigation.js';
import useDocumentViewer from '../hooks/useDocumentViewer.js';
import useDocumentNotes from '../hooks/useDocumentNotes.js';

const MotionDiv = motion.div;

// ─── Constants ────────────────────────────────────────────────────────────────

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

const SUMMARY_LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN', name: 'English' },
  { value: 'vi', label: 'VI', name: 'Tiếng Việt' },
];

const buildDocxPreviewDocument = (bodyHtml) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { color: #1f2937; background: #ffffff; font-family: "Plus Jakarta Sans", Arial, sans-serif; }
      body { margin: 0; padding: 48px; line-height: 1.72; font-size: 15px; }
      h1, h2, h3 { color: #111827; line-height: 1.22; margin: 1.4em 0 0.6em; }
      h1 { font-size: 2rem; } h2 { font-size: 1.5rem; } h3 { font-size: 1.2rem; }
      p { margin: 0 0 1rem; }
      ul, ol { padding-left: 1.5rem; }
      table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; }
      td, th { border: 1px solid #e5e7eb; padding: 0.65rem; vertical-align: top; }
      img { max-width: 100%; height: auto; }
      a { color: var(--color-brand-900); }
      @media (max-width: 720px) { body { padding: 28px; } }
    </style>
  </head>
  <body>${bodyHtml}</body>
</html>`;

const markdownComponents = {
  p: ({ children }) => <p className="mb-3 text-sm leading-7 text-slate-600 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-600 last:mb-0">{children}</ol>,
  strong: ({ children }) => <strong className="font-black text-slate-900">{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="font-bold text-brand-900 underline underline-offset-4">
      {children}
    </a>
  ),
};

// ─── Shared UI primitives ─────────────────────────────────────────────────────

const ActionButton = ({ children, className, label, onClick }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={cn(
      'inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/82 text-slate-500 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white hover:text-brand-900 hover:shadow-md',
      className,
    )}
  >
    {children}
  </button>
);

const LoadingBlock = ({ label = 'Loading data...' }) => (
  <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 text-center">
    <Loader2 className="h-9 w-9 animate-spin text-brand-900" />
    <p className="text-sm font-bold text-slate-500">{label}</p>
  </div>
);


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
        <p className="truncate text-sm font-black text-slate-900 transition-colors group-hover:text-brand-900">{document.title}</p>
        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
          {document.folderName || 'Workspace'} - {document.formattedFileSize || 'Unknown size'}
        </p>
      </div>
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const DocumentViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: documentId } = useParams();
  const { clearDocViewer } = useDocViewer();

  const workspaceReturnPath = useMemo(
    () => getSafeWorkspaceReturnPath(location.state?.returnTo),
    [location.state],
  );
  const handleBackToWorkspace = useCallback(() => {
    navigate(workspaceReturnPath, { replace: true });
  }, [navigate, workspaceReturnPath]);

  const [activeTab, setActiveTab] = useState('study');

  // ── Custom hooks ───────────────────────────────────────────────────────────

  const viewer = useDocumentViewer(documentId);
  const notes = useDocumentNotes(documentId);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    void viewer.loadViewer();
    void notes.loadNotes();

    return () => {
      viewer.loadRequestIdRef.current += 1;
      viewer.cleanupFileUrl();
      clearDocViewer?.();
    };
    // loadViewer and loadNotes are stable callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  // Destructure stable values to avoid depending on the entire viewer object (new ref every render)
  const { askHistoryLoaded, loadAskHistory, loading, viewerError } = viewer;
  useEffect(() => {
    if (activeTab === 'ask' && !askHistoryLoaded && !loading && !viewerError) {
      void loadAskHistory();
    }
  }, [activeTab, askHistoryLoaded, loadAskHistory, loading, viewerError]);

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderLanguageSelector = (variant = 'light') => {

    return (
      <div className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full p-1',
        variant === 'dark'
          ? 'bg-white/16 ring-1 ring-white/18 backdrop-blur-xl'
          : 'bg-white/82 shadow-sm ring-1 ring-slate-100',
      )}>
        {SUMMARY_LANGUAGE_OPTIONS.map((language) => (
          <button
            key={language.value}
            type="button"
            onClick={() => viewer.setSelectedLanguage(language.value)}
            title={language.name}
            className={cn(
              'rounded-full px-3 py-1.5 text-[11px] font-black uppercase transition-all',
              viewer.selectedLanguage === language.value
                ? variant === 'dark' ? 'bg-white text-brand-900 shadow-sm' : 'bg-brand-900 text-white shadow-sm'
                : variant === 'dark' ? 'text-white/62 hover:text-white' : 'text-slate-500 hover:text-brand-900',
            )}
          >
            {language.label}
          </button>
        ))}
      </div>
    );
  };

  const renderPreview = () => {
    if (viewer.loading) return <LoadingBlock label="Opening preview..." />;

    if (viewer.viewerError) {
      return (
        <EmptyState
          icon={RefreshCcw}
          title="Could not open document"
          description={viewer.viewerError}
          action={<button type="button" onClick={() => void viewer.loadViewer()} className="rounded-full bg-brand-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-brand-900/20 transition-all hover:-translate-y-0.5">Reload</button>}
        />
      );
    }

    if (viewer.canDocxPreview && viewer.docxPreviewHtml) {
      return (
        <iframe
          srcDoc={buildDocxPreviewDocument(viewer.docxPreviewHtml)}
          title="Word document preview"
          sandbox=""
          className="h-full w-full border-0 bg-white"
        />
      );
    }

    if (viewer.canNativePreview && viewer.fileUrl) {
      return <iframe src={`${viewer.fileUrl}#toolbar=0`} title="Document preview" className="h-full w-full border-0 bg-white" />;
    }

    return (
      <EmptyState
        icon={FileText}
        title="Preview is not supported"
        description={viewer.previewError || 'This file type cannot be previewed yet. You can download it to open it on your device.'}
        action={
          <button type="button" onClick={() => void downloadDocumentFile(documentId, viewer.documentData?.title)} className="rounded-full bg-brand-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-brand-900/20 transition-all hover:-translate-y-0.5">
            Download
          </button>
        }
      />
    );
  };

  const renderStudy = () => (
    <div className="space-y-4">
      <section className="rounded-[1.45rem] border border-white/82 bg-white/82 p-4 shadow-sm backdrop-blur-xl">
        <p className="text-[11px] font-black uppercase tracking-[0.17em] text-brand-900">My study notes</p>
        <textarea
          value={notes.noteContent}
          onChange={(event) => notes.setNoteContent(event.target.value)}
          rows={3}
          placeholder="Write a note for this document..."
          className="mt-3 w-full resize-none rounded-[1.1rem] border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-brand-200 focus:bg-white focus:ring-2 focus:ring-brand-500/15"
        />
        <div className="mt-2 flex justify-end">
          <button type="button" onClick={() => void notes.handleCreateNote()} disabled={!notes.noteContent.trim() || notes.noteSaving} className="rounded-full bg-dark px-4 py-2 text-xs font-black text-white shadow-lg shadow-dark/16 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55">
            Save note
          </button>
        </div>

        {notes.noteError ? (
          <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{notes.noteError}</div>
        ) : null}

        <div className="mt-4 space-y-3">
          {notes.notesLoading ? <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">Loading notes...</div> : null}
          {!notes.notesLoading && notes.studyNotes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm font-semibold text-slate-500">No notes yet.</div>
          ) : null}

          {notes.studyNotes.map((note) => {
            const editing = notes.editingNoteId === note.id;
            return (
              <article key={note.id} className="rounded-[1.2rem] border border-white/80 bg-white px-4 py-3 shadow-sm">
                {editing ? (
                  <textarea value={notes.editingNoteContent} onChange={(e) => notes.setEditingNoteContent(e.target.value)} rows={3} className="w-full resize-none rounded-[1rem] border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold leading-6 text-slate-700 outline-none focus:border-brand-200 focus:bg-white" />
                ) : (
                  <p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{note.content}</p>
                )}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold text-slate-400">
                    {new Date(note.updatedAt || note.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                  <div className="flex items-center gap-1">
                    {editing ? (
                      <>
                        <button type="button" onClick={() => void notes.handleUpdateNote(note.id)} className="rounded-full bg-brand-900 px-3 py-1.5 text-xs font-black text-white">Save</button>
                        <button type="button" onClick={() => notes.cancelEditingNote()} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => notes.startEditingNote(note)} aria-label="Edit note" title="Edit note" className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-brand-50 hover:text-brand-600"><PencilLine size={14} /></button>
                        <button type="button" onClick={() => void notes.handleDeleteNote(note.id)} aria-label="Delete note" title="Delete note" className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>
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
    const selectedLangOption = SUMMARY_LANGUAGE_OPTIONS.find((o) => o.value === viewer.selectedLanguage) || SUMMARY_LANGUAGE_OPTIONS[0];

    if (viewer.summaryState.loading) {
      return <LoadingBlock label={viewer.summaryState.generating ? `Generating ${selectedLangOption.name} summary...` : 'Checking saved summary...'} />;
    }

    if (viewer.summaryState.error) {
      return (
        <EmptyState icon={RefreshCcw} title="Summary could not be loaded" description={viewer.summaryState.error}
          action={<div className="flex flex-col items-center gap-3">{renderLanguageSelector()}<button type="button" onClick={() => void viewer.generateSummary(viewer.selectedLanguage)} className="rounded-full bg-brand-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-brand-900/20 transition-all hover:-translate-y-0.5">Generate summary</button></div>}
        />
      );
    }

    if (!viewer.activeSummary) {
      return (
        <EmptyState icon={Sparkles} title="No summary yet" description="Select a language, then generate a saved summary for this document."
          action={<div className="flex flex-col items-center gap-3">{renderLanguageSelector()}<button type="button" onClick={() => void viewer.generateSummary(viewer.selectedLanguage)} className="rounded-full bg-brand-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-brand-900/20 transition-all hover:-translate-y-0.5">Generate {selectedLangOption.label} summary</button></div>}
        />
      );
    }

    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-[1.45rem] bg-gradient-to-br from-dark via-brand-800 to-brand-500 p-4 text-white shadow-xl shadow-dark/14">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/62">AI summary</p>
              <h3 className="mt-2 line-clamp-2 text-lg font-black leading-snug tracking-tight text-white">
                {viewer.activeSummary.title || viewer.documentData?.title || 'Main content'}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {renderLanguageSelector('dark')}
              <button type="button" aria-label="Regenerate summary" title="Regenerate summary" onClick={() => void viewer.generateSummary(viewer.selectedLanguage, { forceRefresh: true })} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/16 text-white/70 ring-1 ring-white/18 transition-colors hover:bg-white hover:text-brand-900">
                <RefreshCcw size={14} />
              </button>
            </div>
          </div>
        </div>

        {viewer.summaryBody ? (
          <div className="rounded-[1.45rem] border border-white/82 bg-white/84 p-4 shadow-sm backdrop-blur-xl">
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.17em] text-brand-900"><Sparkles size={13} />Summary</p>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{viewer.summaryBody}</ReactMarkdown>
          </div>
        ) : null}

        {viewer.summaryOverview ? (
          <div className="rounded-[1.45rem] border border-white/82 bg-white/72 p-4 shadow-sm backdrop-blur-xl">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.17em] text-slate-400">Overview</p>
            <p className="text-sm font-semibold leading-7 text-slate-600">{viewer.summaryOverview}</p>
          </div>
        ) : null}

        {viewer.keyPoints.length > 0 ? (
          <div className="rounded-[1.45rem] border border-white/82 bg-white/64 p-3 shadow-sm backdrop-blur-xl">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.17em] text-slate-400">Key points</p>
            <div className="space-y-2">
              {viewer.keyPoints.map((point, index) => (
                <div key={`${index}-${String(point).slice(0, 20)}`} className="group flex gap-3 rounded-[1.1rem] bg-white/82 p-3 text-sm leading-7 text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-900 text-[11px] font-black text-white shadow-sm">{index + 1}</span>
                  <span className="font-semibold text-slate-700">{point}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {viewer.summaryConclusion ? (
          <div className="rounded-[1.45rem] bg-gradient-to-br from-dark to-brand-900 p-4 text-white shadow-xl shadow-dark/14">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/60">Conclusion</p>
            <p className="mt-3 text-sm font-semibold leading-7 text-white/90">{viewer.summaryConclusion}</p>
          </div>
        ) : null}
      </div>
    );
  };

  const renderAsk = () => (
    <div className="flex h-full min-h-0 flex-col">
      {viewer.askHistory.length > 0 ? (
        <div className="mb-3 flex items-center justify-between rounded-[1.1rem] border border-white/82 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-2">
            <Bot size={15} className="shrink-0 text-brand-900" />
            <h3 className="truncate text-xs font-black uppercase tracking-[0.14em] text-slate-500">Conversation</h3>
          </div>
          <button type="button" aria-label="Clear Q&A history" title="Clear Q&A history" onClick={() => void viewer.handleClearAskHistory()} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500">
            <Trash2 size={14} />
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {viewer.askHistoryLoading && viewer.askHistory.length === 0 ? <LoadingBlock label="Loading conversation..." /> : null}

        {!viewer.askHistoryLoading && viewer.askHistory.length === 0 ? (
          <div className="rounded-[1.45rem] border border-white/82 bg-white/68 p-4 shadow-sm backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-900/10 text-brand-900"><MessageSquare size={18} /></div>
              <div>
                <h3 className="text-base font-black text-slate-950">Start asking AI</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">Choose a suggestion or enter your question.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button key={q} type="button" onClick={() => viewer.setAskQuestion(q)} className="rounded-full border border-white/80 bg-white/82 px-3 py-2 text-left text-xs font-black text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:text-brand-900">{q}</button>
              ))}
            </div>
          </div>
        ) : null}

        {viewer.askHistory.map((item) => (
          <div key={item.id} className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[86%] rounded-[1.25rem] rounded-tr-sm bg-dark px-4 py-3 text-sm font-semibold leading-7 text-white shadow-md">{item.question}</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-900/10 text-brand-900 shadow-sm"><Sparkles className="h-4 w-4" /></div>
              <div className="flex-1 rounded-[1.25rem] rounded-tl-sm border border-white/82 bg-white/86 px-4 py-3 shadow-sm backdrop-blur-xl">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{item.answer || ''}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {viewer.askState.loading && viewer.askState.pendingQuestion ? (
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[86%] rounded-[1.25rem] rounded-tr-sm bg-dark px-4 py-3 text-sm font-semibold leading-7 text-white shadow-md">{viewer.askState.pendingQuestion}</div>
            </div>
            <div className="flex items-center gap-3 rounded-[1.25rem] border border-white/82 bg-white/82 px-4 py-3 shadow-sm backdrop-blur-xl">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-900/10 text-brand-900"><Sparkles className="h-4 w-4" /></div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-brand-900/45 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-brand-900/45 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-brand-900/45" />
              </div>
            </div>
          </div>
        ) : null}

        {viewer.askHistoryError || viewer.askState.error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {viewer.askHistoryError || viewer.askState.error}
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex items-end gap-2 rounded-[1rem] border border-white/82 bg-white/88 px-3 py-2 shadow-sm backdrop-blur-xl">
        <textarea
          value={viewer.askQuestion}
          onChange={(event) => viewer.setAskQuestion(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void viewer.handleAsk(); } }}
          rows={1}
          placeholder="Ask a quick question about this document..."
          className="min-h-9 flex-1 resize-none border-none bg-transparent px-0 py-2 text-sm font-semibold leading-5 text-slate-700 outline-none placeholder:text-slate-400"
        />
        <button type="button" onClick={() => void viewer.handleAsk()} disabled={viewer.askState.loading || !viewer.askQuestion.trim()} className="mb-0.5 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-brand-900 px-3.5 text-xs font-black text-white shadow-lg shadow-brand-900/18 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55">
          <Send size={13} />Send
        </button>
      </div>
    </div>
  );

  const renderRelated = () => (
    <div className="space-y-3">
      {viewer.relatedDocuments.length > 0 ? (
        viewer.relatedDocuments.map((document) => (
          <RelatedCard
            key={document.id}
            document={document}
            onOpen={(nextId) => navigate(`/app/documents/${nextId}`, { state: { returnTo: workspaceReturnPath } })}
          />
        ))
      ) : (
        <EmptyState icon={FileText} title="No related documents yet" description="Upload more related documents so the system can improve its suggestions." />
      )}
    </div>
  );

  // ── Layout ─────────────────────────────────────────────────────────────────

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="flex min-h-[calc(100dvh-10.75rem)] flex-col overflow-visible rounded-[1.35rem] border border-white/74 bg-white/30 shadow-[0_30px_90px_-58px_rgba(31,42,68,0.42)] backdrop-blur-xl xl:h-full xl:min-h-0 xl:overflow-hidden"
    >
      <header className="flex min-h-[3.25rem] items-center gap-2 border-b border-white/70 bg-white/42 px-2 py-2 backdrop-blur-2xl sm:px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button type="button" onClick={handleBackToWorkspace} aria-label="Back to workspace" title="Back to workspace" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/82 text-slate-500 shadow-sm transition-all hover:-translate-y-0.5 hover:text-brand-900">
            <ArrowLeft size={16} />
          </button>
          <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]', viewer.filePresentation.accent)}>
            {viewer.filePresentation.label}
          </span>
          <h1 className="min-w-0 flex-1 truncate text-sm font-black tracking-tight text-slate-950 sm:text-base lg:text-lg">
            {viewer.documentData?.title || 'Opening document'}
          </h1>
          <span className="hidden min-w-0 shrink items-center gap-1.5 truncate rounded-full bg-white/66 px-2.5 py-1 text-xs font-bold text-slate-500 shadow-sm md:inline-flex">
            <FolderClosed size={12} />
            <span className="truncate">{viewer.documentData?.folderName || 'Workspace'}</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <ActionButton
            label={viewer.documentData?.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={viewer.handleToggleFavorite}
            className={cn('h-9 w-9 rounded-xl', viewer.documentData?.isFavorite ? 'text-amber-500' : '')}
          >
            <Heart size={17} fill={viewer.documentData?.isFavorite ? 'currentColor' : 'none'} />
          </ActionButton>
          <button type="button" onClick={() => void downloadDocumentFile(documentId, viewer.documentData?.title)} className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-900 px-3 text-sm font-black text-white shadow-lg shadow-brand-900/20 transition-all hover:-translate-y-0.5">
            <Download size={16} />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-2 overflow-visible p-2 xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_520px] xl:overflow-hidden 2xl:grid-cols-[minmax(0,1fr)_580px]">
        <section className="relative min-h-[42dvh] overflow-hidden rounded-[1.35rem] border border-white/82 bg-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_22px_62px_-58px_rgba(31,42,68,0.48)] backdrop-blur-xl xl:min-h-0">
          <div className="h-full overflow-hidden">{renderPreview()}</div>
        </section>

        <aside className="flex min-h-[31rem] flex-col overflow-hidden rounded-[1.35rem] border border-white/82 bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_22px_62px_-58px_rgba(31,42,68,0.48)] backdrop-blur-xl xl:min-h-0">
          <div className="border-b border-white/70 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-dark to-brand-900 text-white shadow-lg shadow-dark/15"><Sparkles size={16} /></div>
                <h2 className="text-base font-black tracking-tight text-slate-950">Document assistant</h2>
              </div>
              <span className="rounded-full bg-white/76 px-2.5 py-1 text-[10px] font-black text-slate-500 shadow-sm">AI</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-white/62 p-1 shadow-sm sm:grid-cols-4">
              {AI_TABS.map((tab) => {
                const Icon = tab.Icon;
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={cn('inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-black transition-all', active ? 'bg-white text-brand-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}>
                    <Icon size={14} />{tab.label}
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
