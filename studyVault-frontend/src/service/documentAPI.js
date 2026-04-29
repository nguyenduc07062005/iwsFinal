import apiClient from '../services/apiClient.js';

const buildListQueryParams = (options = {}) => {
  const normalizedOptions =
    typeof options === 'number' ? { page: options } : options;

  return {
    ...(normalizedOptions.page ? { page: normalizedOptions.page } : {}),
    ...(normalizedOptions.limit ? { limit: normalizedOptions.limit } : {}),
    ...(normalizedOptions.sortBy ? { sortBy: normalizedOptions.sortBy } : {}),
    ...(normalizedOptions.sortOrder
      ? { sortOrder: normalizedOptions.sortOrder }
      : {}),
    ...(normalizedOptions.folderId ? { folderId: normalizedOptions.folderId } : {}),
    ...(normalizedOptions.subjectId ? { subjectId: normalizedOptions.subjectId } : {}),
    ...(normalizedOptions.tagId ? { tagId: normalizedOptions.tagId } : {}),
    ...(normalizedOptions.favorite !== undefined
      ? { favorite: normalizedOptions.favorite }
      : {}),
    ...(normalizedOptions.type ? { type: normalizedOptions.type } : {}),
    ...(normalizedOptions.keyword ? { keyword: normalizedOptions.keyword } : {}),
  };
};

const uploadDocument = async (file, title, folderId, tagIds = []) => {
  const formData = new FormData();
  formData.append('file', file);
  if (title) {
    formData.append('title', title);
  }
  if (folderId) {
    formData.append('folderId', folderId);
  }
  if (tagIds.length > 0) {
    formData.append('tagIds', tagIds.join(','));
  }

  const response = await apiClient.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

const getDocuments = async (options = {}) => {
  const response = await apiClient.get('/documents', {
    params: buildListQueryParams(options),
  });
  return response.data;
};

const deleteDocument = async (documentId) => {
  const response = await apiClient.delete(`/documents/${documentId}`);
  return response.data;
};

const toggleFavorite = async (documentId) => {
  const response = await apiClient.post(`/documents/${documentId}/toggle-favorite`);
  return response.data;
};

const getFavorites = async (options = {}) => {
  const response = await apiClient.get('/documents/favorites', {
    params: buildListQueryParams(options),
  });
  return response.data;
};

const searchDocuments = async (query, options = {}) => {
  const normalizedOptions =
    typeof options === 'number' ? { limit: options } : options;
  const response = await apiClient.get('/documents/search', {
    params: {
      q: query,
      limit: normalizedOptions.limit ?? 10,
      page: normalizedOptions.page ?? 1,
      ...(normalizedOptions.folderId ? { folderId: normalizedOptions.folderId } : {}),
    },
  });
  return response.data;
};

const getRelatedDocuments = async (documentId, limit = 6) => {
  const response = await apiClient.get(`/documents/${documentId}/related`, {
    params: { limit },
  });
  return response.data;
};

const getDocumentDetails = async (documentId) => {
  const response = await apiClient.get(`/documents/${documentId}`);
  return response.data;
};

const updateDocumentTags = async (documentId, tagIds) => {
  const response = await apiClient.patch(`/documents/${documentId}/tags`, {
    tagIds,
  });
  return response.data;
};

const getDocumentNotes = async (documentId) => {
  const response = await apiClient.get(`/documents/${documentId}/notes`);
  return response.data;
};

const createDocumentNote = async (documentId, content) => {
  const response = await apiClient.post(`/documents/${documentId}/notes`, {
    content,
  });
  return response.data;
};

const updateDocumentNote = async (noteId, content) => {
  const response = await apiClient.patch(`/documents/notes/${noteId}`, {
    content,
  });
  return response.data;
};

const deleteDocumentNote = async (noteId) => {
  const response = await apiClient.delete(`/documents/notes/${noteId}`);
  return response.data;
};

const updateDocumentName = async (documentId, newDocumentName) => {
  const response = await apiClient.patch(`/documents/${documentId}`, {
    newDocumentName,
  });
  return response.data;
};

const fetchDocumentFile = async (documentId) => {
  const response = await apiClient.get(`/documents/${documentId}/file`, {
    responseType: 'blob',
  });

  return {
    blob: response.data,
    contentType: response.headers['content-type'] || response.data.type || '',
  };
};

const openDocumentFile = async (documentId) => {
  const popup = window.open('', '_blank');

  try {
    const { blob } = await fetchDocumentFile(documentId);
    const objectUrl = URL.createObjectURL(blob);

    if (popup) {
      popup.opener = null;
      popup.location.href = objectUrl;
    } else {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    popup?.close();
    throw error;
  }
};

const downloadDocumentFile = async (documentId, title) => {
  const { blob } = await fetchDocumentFile(documentId);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  if (title) {
    link.download = title;
  }

  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
};

export {
  uploadDocument,
  getDocuments,
  deleteDocument,
  toggleFavorite,
  getFavorites,
  searchDocuments,
  getRelatedDocuments,
  getDocumentDetails,
  updateDocumentTags,
  getDocumentNotes,
  createDocumentNote,
  updateDocumentNote,
  deleteDocumentNote,
  fetchDocumentFile,
  openDocumentFile,
  downloadDocumentFile,
  updateDocumentName,
};
