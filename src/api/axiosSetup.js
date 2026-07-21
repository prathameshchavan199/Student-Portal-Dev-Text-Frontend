import axios from 'axios';

const API_BASE_URL = 'http://3.111.47.41:8081';

// Attach stored idToken as Bearer on every outgoing request
axios.interceptors.request.use(request => {
  const token = localStorage.getItem('idToken');
  if (token) {
    request.headers['Authorization'] = `Bearer ${token}`;
  }
  return request;
});

// On 401, try to refresh using stored refreshToken; retry the original request
axios.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;

    const isAuthEndpoint =
      original.url?.includes('/api/users/refresh') ||
      original.url?.includes('/api/users/login');

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const email = localStorage.getItem('email');
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post(
          `${API_BASE_URL}/api/users/refresh`,
          { email, refreshToken },
          { withCredentials: true }
        );
        if (res.data.idToken) {
          localStorage.setItem('idToken', res.data.idToken);
        }
        return axios(original);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('email');
        localStorage.removeItem('name');
        localStorage.removeItem('idToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
