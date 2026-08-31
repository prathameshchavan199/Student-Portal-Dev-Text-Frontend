import { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiGrid, FiUsers, FiBookOpen, FiClipboard, FiHelpCircle, FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext.jsx';
import { API_BASE_URL } from '../api/axiosSetup.js';
import CyfenixLogo from '../assets/images/Cyfenix-Logo.png';

const navItems = [
  { icon: FiGrid,      label: 'Dashboard',   path: '/tpo/dashboard' },
  { icon: FiUsers,     label: 'Students',    path: '/tpo/students' },
  { icon: FiBookOpen,  label: 'Courses',     path: '/tpo/courses' },
  { icon: FiClipboard, label: 'Assessments', path: '/tpo/assessments' },
  { icon: FiHelpCircle, label: 'Support',    path: '/tpo/support' },
];

function initialsFor(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export default function TpoShell({ title, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/users/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser({});
      localStorage.removeItem('user');
      localStorage.removeItem('email');
      navigate('/login');
    }
  };

  return (
    <div className="tpo-shell">
      <aside className={`tpo-sidebar ${mobileNavOpen ? 'open' : ''}`}>
        <div className="tpo-brand">
          <img src={CyfenixLogo} alt="Cyfenix" />
          <button
            type="button"
            className="tpo-mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            <FiX />
          </button>
        </div>

        <nav className="tpo-nav">
          {navItems.map(({ icon: Icon, label, path, disabled }) => {
            const isActive = location.pathname === path || location.pathname.startsWith(`${path}/`);
            return (
              <button
                type="button"
                key={label}
                className={`tpo-nav-item ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={() => {
                  if (disabled) return;
                  setMobileNavOpen(false);
                  navigate(path);
                }}
              >
                <Icon />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <button type="button" className="tpo-nav-item tpo-signout" onClick={handleSignOut}>
          <FiLogOut />
          <span>Sign Out</span>
        </button>
      </aside>

      <div className={`tpo-sidebar-overlay ${mobileNavOpen ? 'open' : ''}`} onClick={() => setMobileNavOpen(false)} />

      <div className="tpo-main">
        <div className="tpo-topbar">
          <button
            type="button"
            className="tpo-mobile-toggle"
            aria-label="Open navigation"
            onClick={() => setMobileNavOpen(true)}
          >
            <FiMenu />
          </button>
          <div style={{ flex: 1 }} />
          <div className="tpo-user-chip">
            <div className="tpo-user-avatar">{initialsFor(user?.name)}</div>
            <span className="tpo-user-name">{user?.name || 'Admin'}</span>
          </div>
        </div>
        {title && (
          <div className="tpo-page-title-bar">
            <h1>{title}</h1>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
