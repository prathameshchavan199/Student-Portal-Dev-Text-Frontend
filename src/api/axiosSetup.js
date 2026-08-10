import axios from 'axios';

// export const API_BASE_URL = 'http://localhost:8081'; // local dev
export const API_BASE_URL = 'https://api.cyfenix.com'; // production
export const GOOGLE_CLIENT_ID = '77085865510-ra9jjmlc59c5ia7eqhs6ler10u266fhf.apps.googleusercontent.com';


// Attach stored idToken as Bearer on every outgoing request
axios.interceptors.request.use(request => {
  const token = localStorage.getItem('idToken');
  if (token) {
    request.headers['Authorization'] = `Bearer ${token}`;
  }
  return request;
});

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
        const provider = localStorage.getItem('provider') || 'LOCAL';
        const res = await axios.post(
          `${API_BASE_URL}/api/users/refresh`,
          { email, refreshToken, provider },
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
        localStorage.removeItem('provider');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
