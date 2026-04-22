import apiClient from '../services/apiClient.js';
import { getApiErrorMessage } from '../utils/apiError.js';

const postLogin = async (email, password) => {
  const response = await apiClient.post('/auth/login', {
    email,
    password,
  });

  return response.data;
};

const postRegister = async (data) => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

const getProfile = async () => {
  const response = await apiClient.get('/auth/profile');
  return response.data;
};

const requestPasswordReset = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

const submitPasswordReset = async (token, password) => {
  const response = await apiClient.post('/auth/reset-password', {
    token,
    password,
  });
  return response.data;
};

export {
  getApiErrorMessage,
  getProfile,
  postLogin,
  postRegister,
  requestPasswordReset,
  submitPasswordReset,
};
