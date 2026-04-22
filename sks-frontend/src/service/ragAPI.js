import apiClient from '../services/apiClient.js';

const askDocument = async (documentId, question) => {
  const response = await apiClient.post(`/rag/documents/${documentId}/ask`, {
    question,
  });
  return response.data;
};

const getDocumentAskHistory = async (documentId) => {
  const response = await apiClient.get(`/rag/documents/${documentId}/ask/history`);
  return response.data;
};

const clearDocumentAskHistory = async (documentId) => {
  const response = await apiClient.delete(`/rag/documents/${documentId}/ask/history`);
  return response.data;
};

const getDocumentSummary = async (
  documentId,
  language = 'en',
  options = {},
) => {
  const response = await apiClient.post(
    `/rag/documents/${documentId}/summary`,
    {
      language,
      forceRefresh: Boolean(options.forceRefresh),
      slot: options.slot,
      instruction:
        typeof options.instruction === 'string'
          ? options.instruction
          : undefined,
    },
    {
      timeout: 60_000,
    },
  );
  return response.data;
};

export {
  askDocument,
  clearDocumentAskHistory,
  getDocumentAskHistory,
  getDocumentSummary,
};
