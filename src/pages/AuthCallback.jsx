import { useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { API_BASE_URL } from '../api/axiosSetup.js';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser, setAuthenticated, setRegistered } = useContext(AuthContext);
  const handled = useRef(false);

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
        if (data.idToken) localStorage.setItem('idToken', data.idToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

        setUser(data);
        setAuthenticated(true);
        setRegistered(data.registered);

        navigate(data.registered ? '/dashboard' : '/register', { replace: true });
      })
      .catch((err) => {
        console.error('Google sign-in failed:', err);
        navigate('/login', { replace: true });
      });
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--accent, #6c63ff)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--muted, #888)', fontSize: 14 }}>Signing you in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
