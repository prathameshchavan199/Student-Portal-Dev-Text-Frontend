import { useEffect, useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { API_BASE_URL } from '../api/axiosSetup.js';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser, setAuthenticated, setRegistered } = useContext(AuthContext);
  const handled = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      navigate('/login', { replace: true });
      return;
    }

    const redirectUri = window.location.origin + '/auth/callback';

    axios
      .post(
        `${API_BASE_URL}/api/users/google-callback`,
        { code, redirectUri },
        { withCredentials: true },
      )
      .then((res) => {
        const data = res.data;

        localStorage.setItem('name', data.name);
        localStorage.setItem('email', data.email);
        localStorage.setItem('user', JSON.stringify(data));
        localStorage.setItem('id', JSON.stringify(data.id));
        localStorage.setItem('provider', 'GOOGLE');
        if (data.idToken) localStorage.setItem('idToken', data.idToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

        setUser(data);
        setAuthenticated(true);
        setRegistered(data.registered);

        navigate(data.registered ? '/dashboard' : '/register', { replace: true });
      })
      .catch((err) => {
        console.error('Google sign-in failed:', err);
        const msg = err.response?.data?.message
          || err.response?.data
          || err.message
          || 'Unknown error';
        setError(`Sign-in failed (${err.response?.status ?? 'network'}): ${msg}`);
      });
  }, []);

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 16, padding: 24 }}>
        <p style={{ color: 'red', fontSize: 14, maxWidth: 500, textAlign: 'center', wordBreak: 'break-word' }}>{error}</p>
        <button onClick={() => navigate('/login', { replace: true })} style={{ padding: '8px 20px', cursor: 'pointer' }}>
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--accent, #6c63ff)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--muted, #888)', fontSize: 14 }}>Signing you in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
