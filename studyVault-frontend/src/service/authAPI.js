import apiClient from "../services/apiClient.js";
import { getApiErrorMessage } from "../utils/apiError.js";
import { setCsrfToken } from "../utils/auth.js";

const postLogin = async (email, password) => {
  const response = await apiClient.post("/auth/login", {
    email,
    password,
  });

  if (response.data?.csrfToken) {
    setCsrfToken(response.data.csrfToken);
  }

  return response.data;
};

const postLogout = async () => {
  const response = await apiClient.post("/auth/logout");
  return response.data;
};

const postLogoutAll = async () => {
  const response = await apiClient.post("/auth/logout-all");
  return response.data;
};

const postRegister = async (data) => {
  const response = await apiClient.post("/auth/register", data);
  return response.data;
};

const getProfile = async () => {
  const response = await apiClient.get("/auth/profile");
  return response.data;
};

const updateProfile = async (data) => {
  const response = await apiClient.patch("/auth/profile", data);
  return response.data;
};

const changePassword = async (currentPassword, newPassword) => {
  const response = await apiClient.patch("/auth/password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

const requestPasswordReset = async (email) => {
  const response = await apiClient.post("/auth/forgot-password", { email });
  return response.data;
};

const submitPasswordReset = async (token, password) => {
  const response = await apiClient.post("/auth/reset-password", {
    token,
    password,
  });
  return response.data;
};

const completeRegistration = async (token, password) => {
  const response = await apiClient.post("/auth/complete-registration", {
    token,
    password,
  });
  return response.data;
};

const resendVerificationEmail = async (email) => {
  const response = await apiClient.post("/auth/resend-verification", { email });
  return response.data;
};

export {
  changePassword,
  completeRegistration,
  getApiErrorMessage,
  getProfile,
  postLogin,
  postLogout,
  postLogoutAll,
  postRegister,
  resendVerificationEmail,
  requestPasswordReset,
  submitPasswordReset,
  updateProfile,
};
