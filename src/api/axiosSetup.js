import axios from 'axios';
import { clearAuthStorage } from '../utils/auth.js';

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

// Shared in-flight refresh promise. When several requests 401 at the same
// moment (e.g. a page firing multiple GETs in parallel on mount), they all
// await this ONE refresh call instead of each independently hitting
// /api/users/refresh — which was causing Cognito to rate-limit the burst
// of concurrent AdminInitiateAuth calls and force-logout the user even
// though the token itself was refreshable.
let refreshPromise = null;

function performRefresh() {
  const email = localStorage.getItem('email');
  const refreshToken = localStorage.getItem('refreshToken');
  const provider = localStorage.getItem('provider') || 'LOCAL';

  return axios
    .post(
      `${API_BASE_URL}/api/users/refresh`,
      { email, refreshToken, provider },
      { withCredentials: true }
    )
    .then(res => {
      if (res.data.idToken) {
        localStorage.setItem('idToken', res.data.idToken);
      }
      return res.data.idToken;
    });
}

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
        if (!refreshPromise) {
          refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        return axios(original);
      } catch {
        clearAuthStorage();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);