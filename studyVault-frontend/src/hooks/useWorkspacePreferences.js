import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { shouldHydrateStoredWorkspaceQuery } from './workspacePreferenceHydration.js';

const STORAGE_KEY = 'workspace:document-query';
const DEFAULT_LIMIT = 12;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER = 'desc';
const EMPTY_QUERY = {};

const VALID_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'title', 'fileSize']);
const VALID_SORT_ORDERS = new Set(['asc', 'desc']);
const VALID_TYPES = new Set(['', 'pdf', 'docx', 'txt']);

/** Parse a positive integer from a string value, falling back to a default. */
const readPositiveInt = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : fallback;
};

/** Feature-detect localStorage availability. */
const canUseLocalStorage = () => {
    try {
        const key = '__workspace_ls_test__';
        window.localStorage.setItem(key, '1');
        window.localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
};

/** Normalize a saved query object, filtering out invalid values. */
const normalizeStoredWorkspaceQuery = (storedQuery = {}) => {
    const readString = (key) =>
        typeof storedQuery[key] === 'string' ? storedQuery[key] : '';

    return {
        favorite: storedQuery.favorite === true ? true : undefined,
        folderId: readString('folderId') || undefined,
        keyword: readString('keyword') || undefined,
        limit: readPositiveInt(storedQuery.limit, undefined),
        sortBy: VALID_SORT_FIELDS.has(readString('sortBy')) ? readString('sortBy') : undefined,
        sortOrder: VALID_SORT_ORDERS.has(readString('sortOrder')) ? readString('sortOrder') : undefined,
        subjectId: readString('subjectId') || undefined,
        tagId: readString('tagId') || undefined,
        type: VALID_TYPES.has(readString('type')) ? readString('type') || undefined : undefined,
    };
};

/** Read saved workspace preferences from localStorage. */
const readWorkspaceDocumentPreferences = () => {
    if (!canUseLocalStorage()) return { query: {}, viewMode: 'grid' };

    try {
        const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');

        return {
            query: normalizeStoredWorkspaceQuery(stored.query),
            viewMode: stored.viewMode === 'table' ? 'table' : 'grid',
        };
    } catch {
        return { query: {}, viewMode: 'grid' };
    }
};

/** Build a query object from the current search parameters suitable for persistence. */
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
    if (favorite) query.favorite = true;
    if (folderId) query.folderId = folderId;
    if (keyword) query.keyword = keyword;
    if (limit && limit !== DEFAULT_LIMIT) query.limit = limit;
    if (sortBy && sortBy !== DEFAULT_SORT_BY) query.sortBy = sortBy;
    if (sortOrder && sortOrder !== DEFAULT_SORT_ORDER) query.sortOrder = sortOrder;
    if (subjectId) query.subjectId = subjectId;
    if (tagId) query.tagId = tagId;
    if (type) query.type = type;
    return query;
};

/** Persist the current workspace preferences to localStorage. */
const writeWorkspaceDocumentPreferences = ({ query, viewMode }) => {
    if (!canUseLocalStorage()) return;

    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ query, viewMode }),
        );
    } catch {
        // Storage full or unavailable — silently ignore.
    }
};

/** Merge stored preferences into URL search params (used on initial load). */
const mergeStoredWorkspaceQuery = (params, storedQuery) => {
    const nextParams = new URLSearchParams(params);

    Object.entries(storedQuery).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && !nextParams.has(key)) {
            nextParams.set(key, String(value));
        }
    });

    return nextParams;
};

/**
 * Custom hook managing workspace URL query parameters, localStorage persistence,
 * and view mode toggling.
 *
 * @param {import('react-router-dom').Location} rootFolder - The root folder object
 * @returns Workspace query state and helpers
 */
const useWorkspacePreferences = (rootFolder) => {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [initialPreferences] = useState(() => readWorkspaceDocumentPreferences());
    const [initialLocationKey] = useState(() => location.key);
    const [viewMode, setViewMode] = useState(initialPreferences.viewMode);
    const storedQuery = initialPreferences.query ?? EMPTY_QUERY;
    const isInitialWorkspaceLocation = location.key === initialLocationKey;
    const queryPreferencesHydrated = !shouldHydrateStoredWorkspaceQuery({
        hydrationCompleted: !isInitialWorkspaceLocation,
        searchParams,
        storedQuery,
    });

    // Derived query values from URL search params
    const page = readPositiveInt(searchParams.get('page'), 1);
    const limit = readPositiveInt(searchParams.get('limit'), DEFAULT_LIMIT);
    const sortBy = VALID_SORT_FIELDS.has(searchParams.get('sortBy'))
        ? searchParams.get('sortBy')
        : DEFAULT_SORT_BY;
    const sortOrder = VALID_SORT_ORDERS.has(searchParams.get('sortOrder'))
        ? searchParams.get('sortOrder')
        : DEFAULT_SORT_ORDER;
    const type = VALID_TYPES.has(searchParams.get('type'))
        ? searchParams.get('type')
        : '';
    const keyword = (searchParams.get('keyword') || '').trim();
    const favorite = searchParams.get('favorite') === 'true';
    const folderIdParam = searchParams.get('folderId') || '';
    const subjectId = searchParams.get('subjectId') || '';
    const tagId = searchParams.get('tagId') || '';

    // Hydrate saved preferences into URL on initial load
    useEffect(() => {
        if (
            !shouldHydrateStoredWorkspaceQuery({
                hydrationCompleted: !isInitialWorkspaceLocation,
                searchParams,
                storedQuery,
            })
        ) {
            return;
        }

        const nextParams = mergeStoredWorkspaceQuery(searchParams, storedQuery);

        if (nextParams.toString() !== searchParams.toString()) {
            setSearchParams(nextParams, { replace: true });
        }
    }, [isInitialWorkspaceLocation, searchParams, setSearchParams, storedQuery]);

    // Persist preferences when query values change
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

    /** Update one or more URL search params, optionally resetting the page. */
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

    return {
        // Derived query values
        favorite,
        folderIdParam,
        keyword,
        limit,
        page,
        queryPreferencesHydrated,
        searchParams,
        setSearchParams,
        sortBy,
        sortOrder,
        subjectId,
        tagId,
        type,
        // View mode
        viewMode,
        setViewMode,
        // Helpers
        updateQuery,
    };
};

export default useWorkspacePreferences;
export { DEFAULT_LIMIT, VALID_SORT_FIELDS, VALID_SORT_ORDERS, VALID_TYPES };
