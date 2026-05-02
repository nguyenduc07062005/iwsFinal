import { useCallback, useEffect, useState } from 'react';
import {
    deleteDocument,
    downloadDocumentFile,
    toggleFavorite,
    updateDocumentName,
    updateDocumentTags,
    uploadDocument,
} from '../service/documentAPI.js';
import { createTag, deleteTag, getTags } from '../service/tagAPI.js';
import { addDocumentToFolder } from '../service/folderAPI.js';
import { getApiErrorMessage } from '../utils/apiError.js';

/** Sort tags alphabetically by type then name. */
const sortTagOptions = (tags) =>
    [...tags].sort((a, b) => {
        const typeOrder = a.type.localeCompare(b.type);
        if (typeOrder !== 0) return typeOrder;
        return a.name.localeCompare(b.name);
    });

/**
 * Custom hook encapsulating all workspace document action handlers:
 * upload, rename, move, delete, tag management, favorites, and downloads.
 *
 * @param {Object} params
 * @param {Function} params.updateQuery - Update URL search params
 * @param {Function} params.refreshList - Trigger document list reload
 * @param {Function} params.refreshFolders - Refresh folder tree
 * @param {Function} params.setDocuments - Update documents array
 * @param {string|null} params.activeFolderId - Currently active folder ID
 * @param {Object|null} params.rootFolder - Root folder object
 * @param {number} params.page - Current page
 * @param {Array} params.documents - Current documents list
 * @param {string} params.subjectId - Active subject filter
 * @param {string} params.tagId - Active tag filter
 */
const useWorkspaceActions = ({
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
}) => {
    // Flash notification
    const [flash, setFlash] = useState(null);

    useEffect(() => {
        if (!flash) return undefined;
        const timer = window.setTimeout(() => setFlash(null), 4500);
        return () => window.clearTimeout(timer);
    }, [flash]);

    const showSuccess = (message) => setFlash({ tone: 'success', message });
    const showError = (message) => setFlash({ tone: 'error', message });

    // Tag options
    const [tagOptions, setTagOptions] = useState([]);

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

    // Rename state
    const [renameTarget, setRenameTarget] = useState(null);
    const [renameName, setRenameName] = useState('');
    const [renameError, setRenameError] = useState('');
    const [renaming, setRenaming] = useState(false);

    // Move state
    const [moveTarget, setMoveTarget] = useState(null);
    const [moveDestinationId, setMoveDestinationId] = useState('');
    const [moveError, setMoveError] = useState('');
    const [moving, setMoving] = useState(false);

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteError, setDeleteError] = useState('');
    const [deleting, setDeleting] = useState(false);

    const getFallbackPage = () => (documents.length === 1 && page > 1 ? page - 1 : page);

    // --- Action handlers ---

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
                .map((doc) =>
                    doc.id === document.id
                        ? { ...doc, subject: nextSubject, tags: nextTags }
                        : doc,
                )
                .filter(
                    (doc) => doc.id !== document.id || activeFilterStillMatches,
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

    return {
        // Flash
        flash,
        // Tags
        tagOptions,
        // Rename
        renameTarget,
        renameName,
        renameError,
        renaming,
        setRenameTarget,
        setRenameName,
        // Move
        moveTarget,
        moveDestinationId,
        moveError,
        moving,
        setMoveTarget,
        setMoveDestinationId,
        // Delete
        deleteTarget,
        deleteError,
        deleting,
        setDeleteTarget,
        // Handlers
        handleUpload,
        handleCreateTag,
        handleDeleteTag,
        handleUpdateDocumentTags,
        handleToggleFavorite,
        handleDownloadDocument,
        handleRenameDocumentConfirm,
        handleMoveDocumentConfirm,
        handleDeleteDocumentConfirm,
    };
};

export default useWorkspaceActions;
