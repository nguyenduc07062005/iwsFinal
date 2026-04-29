import apiClient from '../services/apiClient.js';

const getTags = async (options = {}) => {
  const response = await apiClient.get('/tags', {
    params: {
      ...(options.type ? { type: options.type } : {}),
    },
  });
  return response.data;
};

const createTag = async ({ color, name, type = 'TAG' }) => {
  const response = await apiClient.post('/tags', {
    name,
    type,
    ...(color ? { color } : {}),
  });
  return response.data;
};

const updateTag = async (tagId, payload) => {
  const response = await apiClient.patch(`/tags/${tagId}`, payload);
  return response.data;
};

const deleteTag = async (tagId) => {
  const response = await apiClient.delete(`/tags/${tagId}`);
  return response.data;
};

export {
  createTag,
  deleteTag,
  getTags,
  updateTag,
};
