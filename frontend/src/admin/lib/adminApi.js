import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api/admin`,
});

let authFailureHandled = false;

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

const clearAdminSession = () => {
  try {
    localStorage.removeItem('admin');
  } catch (error) {
    // Ignore and still redirect.
  }
};

const handleAuthFailure = () => {
  if (authFailureHandled || typeof window === 'undefined') {
    return;
  }

  authFailureHandled = true;
  clearAdminSession();

  const nextPath = `${window.location.pathname}${window.location.search || ''}`;
  const redirect = `/admin/login?next=${encodeURIComponent(nextPath)}`;
  window.location.replace(redirect);
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      handleAuthFailure();
    }
    return Promise.reject(error);
  }
);

export async function fetchAdmin(path, params = {}) {
  const response = await api.get(path, {
    params,
    headers: getAuthHeaders(),
  });

  return response.data;
}

export async function postAdmin(path, data = {}) {
  const response = await api.post(path, data, {
    headers: getAuthHeaders(),
  });

  return response.data;
}
