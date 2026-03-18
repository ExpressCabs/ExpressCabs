import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/admin/analytics`,
});

const getStoredAdmin = () => {
  try {
    const raw = localStorage.getItem('admin');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const getAuthHeaders = () => {
  const admin = getStoredAdmin();
  return admin?.token
    ? {
        Authorization: `Bearer ${admin.token}`,
      }
    : {};
};

export async function fetchAdminAnalytics(path, params = {}) {
  const response = await api.get(path, {
    params,
    headers: getAuthHeaders(),
  });

  return response.data;
}

export async function postAdminAnalytics(path, data = {}) {
  const response = await api.post(path, data, {
    headers: getAuthHeaders(),
  });

  return response.data;
}
