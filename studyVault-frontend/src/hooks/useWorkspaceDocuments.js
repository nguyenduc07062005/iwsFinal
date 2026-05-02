import { useCallback, useEffect, useRef, useState } from 'react';
import { getDocuments } from '../service/documentAPI.js';
import { getApiErrorMessage } from '../utils/apiError.js';

const WORKSPACE_SCROLL_RESTORE_KEY = 'workspace:scrollY';

/**
 * Custom hook managing document fetching, pagination, scroll restoration,
 * and reload signaling for the workspace page.
 *
 * @param {Object} params
 * @param {boolean} params.queryPreferencesHydrated - Are query preferences loaded?
 * @param {Object|null} params.rootFolder - Root folder object
 * @param {string|null} params.activeFolderId - Currently active folder ID
 * @param {boolean} params.isGlobalDocumentSearch - Is a keyword search active?
 * @param {string|undefined} params.documentQueryFolderId - Folder ID to pass to API
 * @param {boolean} params.favorite - Filter favorites
 * @param {string} params.keyword - Search keyword
 * @param {number} params.limit - Items per page
 * @param {number} params.page - Current page number
 * @param {string} params.sortBy - Sort field
 * @param {string} params.sortOrder - Sort direction
 * @param {string} params.subjectId - Subject tag filter
 * @param {string} params.tagId - Tag filter
 * @param {string} params.type - File type filter
 */
const useWorkspaceDocuments = ({
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
}) => {
    const [documents, setDocuments] = useState([]);
    const [documentsLoading, setDocumentsLoading] = useState(true);
    const [documentsError, setDocumentsError] = useState('');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        limit,
        total: 0,
        totalPages: 1,
    });
    const [reloadKey, setReloadKey] = useState(0);
    const requestIdRef = useRef(0);

    const refreshList = useCallback(() => setReloadKey((c) => c + 1), []);

    // Fetch documents when query parameters change
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
    }, [
        activeFolderId,
        documentQueryFolderId,
        favorite,
        isGlobalDocumentSearch,
        keyword,
        limit,
        page,
        queryPreferencesHydrated,
        reloadKey,
        rootFolder,
        sortBy,
        sortOrder,
        subjectId,
        tagId,
        type,
    ]);

    // Restore scroll position when returning from DocumentViewer
    useEffect(() => {
        if (documentsLoading) return;

        const savedY = sessionStorage.getItem(WORKSPACE_SCROLL_RESTORE_KEY);
        if (savedY === null) return;

        sessionStorage.removeItem(WORKSPACE_SCROLL_RESTORE_KEY);
        const targetY = Number(savedY);
        if (!Number.isFinite(targetY) || targetY <= 0) return;

        requestAnimationFrame(() => {
            window.scrollTo({ top: targetY, behavior: 'instant' });
        });
    }, [documentsLoading]);

    return {
        documents,
        documentsError,
        documentsLoading,
        pagination,
        refreshList,
        setDocuments,
        setPagination,
    };
};

export default useWorkspaceDocuments;
export { WORKSPACE_SCROLL_RESTORE_KEY };
