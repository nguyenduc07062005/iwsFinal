import apiClient from "../services/apiClient.js";

const getAdminStats = async () => {
  const response = await apiClient.get("/admin/stats");
  return response.data;
};

const getAdminUsers = async (params = {}) => {
  const response = await apiClient.get("/admin/users", {
    params,
  });
  return response.data;
};

const getAdminAuditLogs = async (params = {}) => {
  const response = await apiClient.get("/admin/audit-logs", {
    params,
  });
  return response.data;
};

const updateAdminUserStatus = async (userId, isActive) => {
  const response = await apiClient.patch(`/admin/users/${userId}/status`, {
    isActive,
  });
  return response.data;
};

export {
  getAdminAuditLogs,
  getAdminStats,
  getAdminUsers,
  updateAdminUserStatus,
};
