import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiBarChart2, FiBook, FiClipboard, FiGrid, FiMenu, FiUsers, FiX } from 'react-icons/fi';
import CyfenixLogo from '../assets/images/Cyfenix-Logo.png';

const adminNavItems = [
  { icon: FiGrid,       label: 'Dashboard',   path: '/admin' },
  { icon: FiUsers,      label: 'Students',    path: '/admin/students' },
  { icon: FiBook,       label: 'Courses',     path: '/admin/courses' },
  { icon: FiClipboard,  label: 'Assessments', path: '/admin/assessments' },
];

function getAdminProfileInfo() {
  const raw = localStorage.getItem('name');
  const fullName = raw ? ((() => { try { return JSON.parse(raw); } catch { return raw; } })()) : '';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || 'Admin';
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : (parts[0]?.[0] ?? 'A').toUpperCase();
  return { firstName, initials };
}

export default function AdminShell({ children, title, subtitle }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { firstName, initials } = getAdminProfileInfo();

  const handleNav = (path) => {
    setMobileNavOpen(false);
    navigate(path);
  };

  return (
    <div className="dash-wrap">
      <aside className={`sidebar ${mobileNavOpen ? 'open' : ''}`}>
        <div className="brand">
          <strong>
            <img className="brand-logo" src={CyfenixLogo} alt="Cyfenix Logo" />
          </strong>
          <span className="admin-badge">Admin</span>
          <button
            type="button"
            className="mobile-nav-close"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            <FiX />
          </button>
        </div>
        {adminNavItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || (path !== '/admin' && location.pathname.startsWith(`${path}/`));
          return (
            <div
              key={label}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNav(path)}
              style={{ cursor: 'pointer' }}
            >
              <Icon />
              {label}
            </div>
          );
        })}
        <div style={{ flex: 1 }} />
        <div className="nav-item" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <FiBarChart2 /> Back to Student Portal
        </div>
      </aside>
      <div
        className={`sidebar-overlay ${mobileNavOpen ? 'open' : ''}`}
        onClick={() => setMobileNavOpen(false)}
      />

      <div className="main">
        <div className="topnav">
          <button
            type="button"
            className="mobile-nav-toggle"
            aria-label="Open navigation"
            onClick={() => setMobileNavOpen(true)}
          >
            <FiMenu />
          </button>

          <div className="admin-topnav-heading">
            <div className="admin-topnav-title">{title}</div>
            {subtitle && <div className="admin-topnav-subtitle">{subtitle}</div>}
          </div>

          <div className="course-topnav-profile d-flex align-items-start gap-2">
            <div className="brand-logo" style={{ width: 36, height: 36, background: 'var(--grad-btn)', border: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{firstName}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Administrator</div>
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
