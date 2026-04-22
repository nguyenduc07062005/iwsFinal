import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Heart,
  MessageSquare,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';
import { getFilePresentation } from '../components/workspace/DocumentLibraryPanel.jsx';
import { useDocViewer } from '../context/DocViewerContext.jsx';
import {
  downloadDocumentFile,
  fetchDocumentFile,
  getDocumentDetails,
  getRelatedDocuments,
  openDocumentFile,
  toggleFavorite,
} from '../service/documentAPI.js';
import {
  askDocument,
  clearDocumentAskHistory,
  getDocumentAskHistory,
  getDocumentSummary,
} from '../service/ragAPI.js';
import { getApiErrorMessage } from '../utils/apiError.js';

const AI_TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'ask', label: 'Ask AI' },
  { id: 'related', label: 'Related' },
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
      className="font-bold text-brand-600 underline underline-offset-4"
    >
      {children}
    </a>
  ),
};

const formatDate = (value) => {
  if (!value) return 'Not available';

  try {
    return new Date(value).toLocaleString();
  } catch {
    return 'Not available';
  }
};

const DetailStat = ({ label, value }) => (
  <div className="rounded-2xl bg-white/85 px-4 py-4 shadow-sm ring-1 ring-slate-100/80">
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
      {label}
    </p>
    <p className="mt-2 text-sm font-bold text-slate-900 break-words">{value}</p>
  </div>
);

const RelatedCard = ({ document, onOpen }) => {
  const file = getFilePresentation(document);

  return (
    <button
      type="button"
      onClick={() => onOpen(document.id)}
      className="group flex w-full items-start gap-4 rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-[0.16em] ${file.accent}`}>
        {file.label}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black tracking-tight text-slate-900 transition-colors group-hover:text-brand-600">
          {document.title}
        </p>
        <p className="mt-2 text-[11px] font-medium text-slate-500">
          {document.folderName || 'Workspace'} • {document.formattedFileSize || 'Unknown size'}
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

  const [activeTab, setActiveTab] = useState('summary');
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

  const cleanupFileUrl = useCallback(() => {
    if (fileUrlRef.current) {
      URL.revokeObjectURL(fileUrlRef.current);
      fileUrlRef.current = '';
    }
    setFileUrl('');
  }, []);

  const loadSummary = useCallback(
    async (language = selectedLanguage, options = {}) => {
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
          error: getApiErrorMessage(error, 'Unable to generate the summary.'),
          data: null,
        });
      }
    },
    [documentId, selectedLanguage],
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
      setAskHistoryError(getApiErrorMessage(error, 'Unable to load the ask history.'));
      setAskHistoryLoaded(true);
    } finally {
      setAskHistoryLoading(false);
    }
  }, [askHistoryLoading, documentId]);

  const loadViewer = useCallback(async () => {
    if (!documentId) return;

    try {
      setLoading(true);
      setViewerError('');
      setPreviewError('');
      cleanupFileUrl();

      const [detailResult, relatedResult] = await Promise.all([
        getDocumentDetails(documentId),
        getRelatedDocuments(documentId),
      ]);

      setDocumentData(detailResult.document);
      setRelatedDocuments(relatedResult.documents || []);

      try {
        const { blob, contentType: nextContentType } = await fetchDocumentFile(documentId);
        const nextFileUrl = URL.createObjectURL(blob);
        fileUrlRef.current = nextFileUrl;
        setFileUrl(nextFileUrl);
        setContentType(nextContentType || blob.type || '');
      } catch (previewRequestError) {
        setPreviewError(
          getApiErrorMessage(previewRequestError, 'Preview is not available for this file.'),
        );
      }
    } catch (error) {
      setViewerError(getApiErrorMessage(error, 'Unable to load the document.'));
    } finally {
      setLoading(false);
    }
  }, [cleanupFileUrl, documentId]);

  useEffect(() => {
    void loadViewer();
    void loadSummary(selectedLanguage);

    return () => {
      cleanupFileUrl();
      clearDocViewer?.();
    };
  }, [cleanupFileUrl, clearDocViewer, loadSummary, loadViewer, selectedLanguage]);

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

  const handleToggleFavorite = async () => {
    if (!documentId) return;

    try {
      const result = await toggleFavorite(documentId);
      setDocumentData((current) => ({
        ...(current || {}),
        ...(result.document || {}),
      }));
    } catch (error) {
      setViewerError(getApiErrorMessage(error, 'Unable to update favorites.'));
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
        error: getApiErrorMessage(error, 'Unable to generate the answer.'),
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
      setAskHistoryError(getApiErrorMessage(error, 'Unable to clear the ask history.'));
    } finally {
      setAskHistoryLoading(false);
    }
  };

  const renderSummary = () => {
    if (summaryState.loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
        </div>
      );
    }

    if (summaryState.error) {
      return (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          {summaryState.error}
        </div>
      );
    }

    if (!activeSummary) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-sm font-black uppercase tracking-[0.2em] text-slate-900">
            Summary not ready
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Generate the first summary for this document.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600">
                AI summary
              </p>
              <h3 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">
                {activeSummary.title || documentData?.title || 'Document summary'}
              </h3>
            </div>
            <div className="flex gap-2">
              {['en', 'vi'].map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(language);
                    void loadSummary(language);
                  }}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] ${
                    selectedLanguage === language
                      ? 'bg-brand-900 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-bold text-brand-600">
              {activeSummary.format || 'structured'}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
              {activeSummary.cached ? 'Cached' : 'Fresh'}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
              {formatDate(activeSummary.generatedAt)}
            </span>
          </div>
        </div>

        {activeSummary.body ? (
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {activeSummary.body}
            </ReactMarkdown>
          </div>
        ) : null}

        {activeSummary.overview ? (
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Overview
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">{activeSummary.overview}</p>
          </div>
        ) : null}

        {Array.isArray(activeSummary.key_points) && activeSummary.key_points.length > 0 ? (
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
              Key points
            </p>
            <div className="mt-4 space-y-3">
              {activeSummary.key_points.map((point, index) => (
                <div
                  key={`${index}-${point.slice(0, 24)}`}
                  className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium leading-7 text-slate-700"
                >
                  <span className="font-black text-brand-600">{index + 1}.</span> {point}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeSummary.conclusion ? (
          <div className="rounded-3xl bg-brand-900 p-5 shadow-lg shadow-brand-900/15 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-100">
              Conclusion
            </p>
            <p className="mt-3 text-sm leading-7 text-brand-50">{activeSummary.conclusion}</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void loadSummary(selectedLanguage, { forceRefresh: true })}
          className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm border border-slate-100 transition-colors hover:text-brand-600"
        >
          Refresh summary
        </button>
      </div>
    );
  };

  const renderAsk = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Document Q&A
          </p>
          <h3 className="mt-2 text-lg font-extrabold tracking-tight text-slate-900">
            Ask the document directly
          </h3>
        </div>
        <button
          type="button"
          onClick={() => void handleClearAskHistory()}
          className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 transition-colors hover:text-brand-600"
        >
          Clear
        </button>
      </div>

      <div className="mt-5 flex-1 space-y-4 overflow-y-auto pr-1">
        {askHistoryLoading && askHistory.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
          </div>
        ) : null}

        {!askHistoryLoading && askHistory.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-sm font-black uppercase tracking-[0.2em] text-slate-900">
              No questions yet
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Ask for a recap, explanation, or exact detail from this document.
            </p>
          </div>
        ) : null}

        {askHistory.map((item) => (
          <div key={item.id} className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[88%] rounded-[1.25rem] rounded-tr-sm bg-brand-900 px-4 py-3 text-sm leading-7 text-white shadow-md">
                {item.question}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1 rounded-[1.25rem] rounded-tl-sm border border-slate-100 bg-white px-5 py-4 shadow-sm">
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
              <div className="max-w-[88%] rounded-[1.25rem] rounded-tr-sm bg-brand-900 px-4 py-3 text-sm leading-7 text-white shadow-md">
                {askState.pendingQuestion}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="rounded-[1.25rem] rounded-tl-sm border border-slate-100 bg-white px-5 py-4 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {askHistoryError ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            {askHistoryError}
          </div>
        ) : null}

        {askState.error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            {askState.error}
          </div>
        ) : null}
      </div>

      <div className="mt-5 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <textarea
          value={askQuestion}
          onChange={(event) => setAskQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void handleAsk();
            }
          }}
          rows={4}
          placeholder="Ask for an explanation, recap, or exact point from this document..."
          className="w-full resize-none border-none bg-transparent text-sm leading-7 text-slate-700 outline-none placeholder:text-slate-400"
        />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void handleAsk()}
            disabled={askState.loading || !askQuestion.trim()}
            className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send question
          </button>
        </div>
      </div>
    </div>
  );

  const renderRelated = () => (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
          Related documents
        </p>
        <h3 className="mt-2 text-lg font-extrabold tracking-tight text-slate-900">
          Files connected by semantic search
        </h3>
      </div>

      {relatedDocuments.length > 0 ? (
        relatedDocuments.map((document) => (
          <RelatedCard
            key={document.id}
            document={document}
            onOpen={(nextDocumentId) => navigate(`/app/documents/${nextDocumentId}`)}
          />
        ))
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-sm font-black uppercase tracking-[0.2em] text-slate-900">
            No related documents
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Upload more course files to strengthen related-document discovery.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--color-base-50)] lg:flex-row">
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden border-b border-white/70 bg-white/70 lg:border-b-0 lg:border-r">
        <div className="border-b border-white/70 bg-white/70 px-5 py-5 backdrop-blur-xl">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:text-brand-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${filePresentation.accent}`}>
                  {filePresentation.label}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">
                  {documentData?.folderName || 'Workspace'}
                </span>
              </div>
              <h1 className="mt-4 truncate text-2xl font-extrabold tracking-tight text-slate-900">
                {documentData?.title || 'Document detail'}
              </h1>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Preview the source file, inspect metadata, and use the AI rail for
                summary, questions, and related content.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleToggleFavorite}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:text-amber-600"
              >
                <Heart
                  className="h-4 w-4"
                  fill={documentData?.isFavorite ? 'currentColor' : 'none'}
                />
                {documentData?.isFavorite ? 'Favorited' : 'Favorite'}
              </button>
              <button
                type="button"
                onClick={() => void openDocumentFile(documentId)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:text-brand-600"
              >
                <ExternalLink className="h-4 w-4" />
                Open file
              </button>
              <button
                type="button"
                onClick={() => void downloadDocumentFile(documentId, documentData?.title)}
                className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-600"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <DetailStat label="Folder" value={documentData?.folderName || 'Workspace'} />
            <DetailStat label="File size" value={documentData?.formattedFileSize || 'Unknown'} />
            <DetailStat label="Created at" value={formatDate(documentData?.createdAt)} />
            <DetailStat label="Updated at" value={formatDate(documentData?.updatedAt)} />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
            </div>
          ) : viewerError ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <RefreshCcw className="h-7 w-7" />
              </div>
              <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">
                Unable to open this document
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">{viewerError}</p>
              <button
                type="button"
                onClick={() => void loadViewer()}
                className="mt-8 rounded-full bg-brand-900 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-600"
              >
                Retry document
              </button>
            </div>
          ) : canPreview && fileUrl ? (
            <iframe
              src={`${fileUrl}#toolbar=0`}
              title="Document preview"
              className="h-full w-full border-0 bg-white"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
              <div className={`flex h-20 w-20 items-center justify-center rounded-3xl text-sm font-black uppercase tracking-[0.16em] shadow-lg ${filePresentation.accent}`}>
                {filePresentation.label}
              </div>
              <h2 className="mt-8 text-2xl font-extrabold tracking-tight text-slate-900">
                Preview not available
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                {previewError ||
                  'This file type cannot be rendered directly in the preview pane. You can still open the original file or download it.'}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => void openDocumentFile(documentId)}
                  className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm border border-slate-100 transition-colors hover:text-brand-600"
                >
                  Open externally
                </button>
                <button
                  type="button"
                  onClick={() => void downloadDocumentFile(documentId, documentData?.title)}
                  className="rounded-full bg-brand-900 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-600"
                >
                  Download file
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <aside className="flex w-full shrink-0 flex-col overflow-hidden bg-white/78 lg:w-[430px] xl:w-[460px]">
        <div className="border-b border-white/70 bg-white/72 px-5 py-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-[var(--color-accent)] text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-600">
                StudyVault AI
              </p>
              <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-900">
                Context tools
              </h2>
            </div>
          </div>

          <div className="mt-5 flex rounded-2xl bg-slate-100 p-1">
            {AI_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {activeTab === 'summary' ? renderSummary() : null}
          {activeTab === 'ask' ? renderAsk() : null}
          {activeTab === 'related' ? renderRelated() : null}
        </div>
      </aside>
    </div>
  );
};

export default DocumentViewer;
