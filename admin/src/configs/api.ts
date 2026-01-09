const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Admin Auth
  ADMIN_LOGIN: `${API_BASE_URL}/api/admin/auth/login`,
  ADMIN_LOGOUT: `${API_BASE_URL}/api/admin/auth/logout`,
  ADMIN_VERIFY: `${API_BASE_URL}/api/admin/auth/verify`,
  ADMIN_CREATE: `${API_BASE_URL}/api/admin/auth/create`,
  ADMIN_GET_ALL: `${API_BASE_URL}/api/admin/auth/all`,

  // Admin Users
  ADMIN_USERS_GET_ALL: `${API_BASE_URL}/api/admin/users`,
  ADMIN_USERS_GET_STATS: `${API_BASE_URL}/api/admin/users/stats`,
  ADMIN_USERS_GET_BY_ID: (userId: string) => `${API_BASE_URL}/api/admin/users/${userId}`,
  ADMIN_USERS_UPDATE: (userId: string) => `${API_BASE_URL}/api/admin/users/${userId}`,
  ADMIN_USERS_DELETE: (userId: string) => `${API_BASE_URL}/api/admin/users/${userId}`,
};

export default API_BASE_URL;
