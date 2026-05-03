import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getFilePresentation } from '../components/workspace/DocumentLibraryPanel.jsx';
import {
    downloadDocumentFile,
    fetchDocumentFile,
    fetchDocumentPreviewHtml,
    getDocumentDetails,
    getRelatedDocuments,
    toggleFavorite,
} from '../service/documentAPI.js';
import {
    askDocument,
    clearDocumentAskHistory,
    getCachedDocumentSummary,
    getDocumentAskHistory,
    getDocumentSummary,
} from '../service/ragAPI.js';
import { getApiErrorMessage } from '../utils/apiError.js';
import {
    getActiveSummary,
    getSummaryKeyPoints,
    getSummaryVersions,
    normalizeSummaryText,
} from '../utils/summary.js';

const DOCX_MIME_TYPE =
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DEFAULT_SUMMARY_LANGUAGE = 'en';

const isDocxPreviewType = (contentType = '', fileExtension = '') => {
    const normalized = contentType.toLowerCase();
    const ext = fileExtension.toLowerCase();
    return (
        normalized.includes(DOCX_MIME_TYPE) ||
        normalized.includes('wordprocessingml') ||
        ext === 'docx'
    );
};

/**
 * Custom hook managing all DocumentViewer data loading, state, and actions:
 * - Document metadata + file blob loading
 * - Related documents
 * - AI summary (cached + on-demand generation)
 * - Q&A history
 * - Favorite toggle
 *
 * @param {string} documentId - The document ID from URL params
 * @returns {Object} All state and action handlers for the viewer
 */
const useDocumentViewer = (documentId) => {
    const fileUrlRef = useRef('');
    const loadRequestIdRef = useRef(0);
    const summaryRequestIdRef = useRef(0);

    // Document metadata + file
    const [documentData, setDocumentData] = useState(null);
    const [relatedDocuments, setRelatedDocuments] = useState([]);
    const [fileUrl, setFileUrl] = useState('');
    const [contentType, setContentType] = useState('');
    const [docxPreviewHtml, setDocxPreviewHtml] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewerError, setViewerError] = useState('');
    const [previewError, setPreviewError] = useState('');

    // Summary
    const [summaryState, setSummaryState] = useState({
        loading: false,
        generating: false,
        error: '',
        data: null,
        checked: false,
    });

    // Q&A
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

    // ── Loaders ────────────────────────────────────────────────────────────────

    const cleanupFileUrl = useCallback(() => {
        if (fileUrlRef.current) {
            URL.revokeObjectURL(fileUrlRef.current);
            fileUrlRef.current = '';
        }
        setFileUrl('');
    }, []);

    const loadViewer = useCallback(async () => {
        if (!documentId) return;

        const requestId = ++loadRequestIdRef.current;
        const isStale = () => requestId !== loadRequestIdRef.current;

        try {
            setLoading(true);
            setViewerError('');
            setPreviewError('');
            setDocxPreviewHtml('');
            cleanupFileUrl();

            const detailResult = await getDocumentDetails(documentId);
            if (isStale()) return;
            setDocumentData(detailResult.document);

            void getRelatedDocuments(documentId)
                .then((result) => { if (!isStale()) setRelatedDocuments(result.documents || []); })
                .catch(() => { if (!isStale()) setRelatedDocuments([]); });

            try {
                const { blob, contentType: nextContentType } = await fetchDocumentFile(documentId);
                const nextFileUrl = URL.createObjectURL(blob);
                if (isStale()) { URL.revokeObjectURL(nextFileUrl); return; }

                const file = getFilePresentation(detailResult.document || { title: '', fileRef: '' });
                const resolvedContentType = nextContentType || blob.type || '';
                fileUrlRef.current = nextFileUrl;
                setFileUrl(nextFileUrl);
                setContentType(resolvedContentType);

                if (isDocxPreviewType(resolvedContentType, file.extension)) {
                    const preview = await fetchDocumentPreviewHtml(documentId);
                    if (isStale()) return;
                    setDocxPreviewHtml(preview.html || '');
                }
            } catch (previewError) {
                if (isStale()) return;
                setPreviewError(
                    getApiErrorMessage(
                        previewError,
                        'This file could not be previewed. Please download it or upload it again.',
                    ),
                );
            }
        } catch (error) {
            if (isStale()) return;
            setViewerError(
                getApiErrorMessage(
                    error,
                    'The document could not be opened. Please refresh and try again.',
                ),
            );
        } finally {
            if (!isStale()) setLoading(false);
        }
    }, [cleanupFileUrl, documentId]);

    const loadCachedSummary = useCallback(async () => {
        if (!documentId) return;

        const requestId = ++summaryRequestIdRef.current;
        const isStale = () => requestId !== summaryRequestIdRef.current;

        try {
            setSummaryState({
                loading: true,
                generating: false,
                error: '',
                data: null,
                checked: false,
            });
            const result = await getCachedDocumentSummary(documentId, DEFAULT_SUMMARY_LANGUAGE);
            if (isStale()) return;
            setSummaryState({ loading: false, generating: false, error: '', data: result.summary || null, checked: true });
        } catch (error) {
            if (isStale()) return;
            setSummaryState({
                loading: false,
                generating: false,
                error: getApiErrorMessage(error, 'Saved summaries could not be loaded. Please try again.'),
                data: null,
                checked: true,
            });
        }
    }, [documentId]);

    const generateSummary = useCallback(async (options = {}) => {
        if (!documentId) return;

        const language = options.language || DEFAULT_SUMMARY_LANGUAGE;
        const requestId = ++summaryRequestIdRef.current;
        const isStale = () => requestId !== summaryRequestIdRef.current;

        try {
            setSummaryState((s) => ({ ...s, loading: true, generating: true, error: '' }));
            const result = await getDocumentSummary(documentId, language, options);
            if (isStale()) return;
            setSummaryState({ loading: false, generating: false, error: '', data: result, checked: true });
        } catch (error) {
            if (isStale()) return;
            setSummaryState({
                loading: false,
                generating: false,
                error: getApiErrorMessage(error, 'A summary could not be created for this document. Please try again.'),
                data: null,
                checked: true,
            });
        }
    }, [documentId]);

    const loadAskHistory = useCallback(async () => {
        if (!documentId || askHistoryLoading) return;

        try {
            setAskHistoryLoading(true);
            const result = await getDocumentAskHistory(documentId);
            setAskHistory(result.items || []);
            setAskHistoryLoaded(true);
            setAskHistoryError('');
        } catch (error) {
            setAskHistoryError(
                getApiErrorMessage(error, 'Q&A history could not be loaded. Please refresh and try again.'),
            );
            setAskHistoryLoaded(true);
        } finally {
            setAskHistoryLoading(false);
        }
    }, [askHistoryLoading, documentId]);

    // ── Effects ────────────────────────────────────────────────────────────────

    useEffect(() => {
        void loadCachedSummary();
    }, [loadCachedSummary]);

    // ── Actions ────────────────────────────────────────────────────────────────

    const handleToggleFavorite = async () => {
        if (!documentId) return;
        try {
            const result = await toggleFavorite(documentId);
            setDocumentData((current) => ({ ...(current || {}), ...(result.document || {}) }));
        } catch (error) {
            setViewerError(
                getApiErrorMessage(error, 'Favorite status could not be updated. Please try again.'),
            );
        }
    };

    const handleDownload = async (title) => {
        if (!documentId) return;
        try {
            await downloadDocumentFile(documentId, title);
        } catch (error) {
            setViewerError(
                getApiErrorMessage(error, 'The document could not be downloaded. Please try again.'),
            );
        }
    };

    const handleAsk = async () => {
        const trimmed = askQuestion.trim();
        if (!documentId || !trimmed || askState.loading) return;

        try {
            setAskState({ loading: true, error: '', pendingQuestion: trimmed });
            const result = await askDocument(documentId, trimmed);
            setAskHistory((current) => [...current, result.historyItem].slice(-8));
            setAskHistoryLoaded(true);
            setAskQuestion('');
            setAskState({ loading: false, error: '', pendingQuestion: '' });
        } catch (error) {
            setAskState({
                loading: false,
                error: getApiErrorMessage(error, 'An answer could not be created. Please try again.'),
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
            setAskHistoryError(
                getApiErrorMessage(error, 'Q&A history could not be cleared. Please try again.'),
            );
        } finally {
            setAskHistoryLoading(false);
        }
    };

    // ── Derived values ─────────────────────────────────────────────────────────

    const filePresentation = useMemo(
        () => getFilePresentation(documentData || { title: '', fileRef: '' }),
        [documentData],
    );

    const canNativePreview = useMemo(() => {
        const normalized = contentType.toLowerCase();
        return normalized.includes('pdf') || normalized.startsWith('text/');
    }, [contentType]);

    const canDocxPreview = useMemo(
        () => isDocxPreviewType(contentType, filePresentation.extension),
        [contentType, filePresentation.extension],
    );

    const summaryVersions = useMemo(
        () => getSummaryVersions(summaryState.data),
        [summaryState.data],
    );
    const activeSummary = useMemo(
        () => getActiveSummary(summaryState.data),
        [summaryState.data],
    );

    const keyPoints = getSummaryKeyPoints(activeSummary);
    const summaryTitle = normalizeSummaryText(activeSummary?.title);
    const summaryBody = typeof activeSummary?.body === 'string' ? activeSummary.body : '';
    const summaryOverview = typeof activeSummary?.overview === 'string' ? activeSummary.overview : '';
    const summaryConclusion = typeof activeSummary?.conclusion === 'string' ? activeSummary.conclusion : '';

    return {
        // Document state
        documentData,
        setDocumentData,
        relatedDocuments,
        fileUrl,
        contentType,
        docxPreviewHtml,
        loading,
        viewerError,
        previewError,
        // File helpers
        filePresentation,
        canNativePreview,
        canDocxPreview,
        cleanupFileUrl,
        loadViewer,
        loadRequestIdRef,
        // Summary
        summaryState,
        generateSummary,
        summaryVersions,
        activeSummary,
        summaryTitle,
        keyPoints,
        summaryBody,
        summaryOverview,
        summaryConclusion,
        // Q&A
        askHistory,
        askHistoryLoaded,
        askHistoryLoading,
        askHistoryError,
        askQuestion,
        setAskQuestion,
        askState,
        loadAskHistory,
        // Actions
        handleToggleFavorite,
        handleDownload,
        handleAsk,
        handleClearAskHistory,
    };
};

export default useDocumentViewer;
export { isDocxPreviewType, getSummaryKeyPoints, DOCX_MIME_TYPE };
