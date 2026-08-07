import axios from 'axios';

// export const API_BASE_URL = 'http://localhost:8081'; // local dev
export const API_BASE_URL = 'https://api.cyfenix.com'; // production

// Cognito Hosted UI config — used for Google sign-in redirect
// Set these to match your AWS Cognito App Client settings
export const COGNITO_DOMAIN = 'https://ap-south-1feqdepmnn.auth.ap-south-1.amazoncognito.com';
export const COGNITO_CLIENT_ID = '52f6t4i0fmo7ru164k89mktfqf';


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
