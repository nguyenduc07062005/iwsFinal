import { useCallback, useState } from 'react';
import {
    createDocumentNote,
    deleteDocumentNote,
    getDocumentNotes,
    updateDocumentNote,
} from '../service/documentAPI.js';
import { getApiErrorMessage } from '../utils/apiError.js';

/**
 * Custom hook managing study note CRUD operations for the DocumentViewer.
 *
 * @param {string} documentId - The document ID
 * @returns Study note state and action handlers
 */
const useDocumentNotes = (documentId) => {
    const [studyNotes, setStudyNotes] = useState([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [noteError, setNoteError] = useState('');
    const [noteSaving, setNoteSaving] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState('');
    const [editingNoteContent, setEditingNoteContent] = useState('');

    const loadNotes = useCallback(async () => {
        if (!documentId) return;

        try {
            setNotesLoading(true);
            const result = await getDocumentNotes(documentId);
            setStudyNotes(result.notes || []);
            setNoteError('');
        } catch (error) {
            setNoteError(
                getApiErrorMessage(
                    error,
                    'Study notes could not be loaded. Please refresh and try again.',
                ),
            );
        } finally {
            setNotesLoading(false);
        }
    }, [documentId]);

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
            setNoteError(
                getApiErrorMessage(
                    error,
                    'The study note could not be saved. Please try again.',
                ),
            );
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
            setNoteError(
                getApiErrorMessage(
                    error,
                    'The study note could not be updated. Please try again.',
                ),
            );
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
            setNoteError(
                getApiErrorMessage(
                    error,
                    'The study note could not be deleted. Please try again.',
                ),
            );
        } finally {
            setNoteSaving(false);
        }
    };

    const startEditingNote = (note) => {
        setEditingNoteId(note.id);
        setEditingNoteContent(note.content);
    };

    const cancelEditingNote = () => {
        setEditingNoteId('');
        setEditingNoteContent('');
    };

    return {
        studyNotes,
        notesLoading,
        noteContent,
        setNoteContent,
        noteError,
        noteSaving,
        editingNoteId,
        editingNoteContent,
        setEditingNoteContent,
        loadNotes,
        handleCreateNote,
        handleUpdateNote,
        handleDeleteNote,
        startEditingNote,
        cancelEditingNote,
    };
};

export default useDocumentNotes;
