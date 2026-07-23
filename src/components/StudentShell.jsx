import { useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiBriefcase, FiBook, FiClipboard, FiFolder, FiGrid, FiLogOut, FiMenu, FiSearch, FiTrendingUp, FiVideo, FiX } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext.jsx';
import { courseType, courses } from '../pages/courseData.js';
import CyfenixLogo from "../assets/images/Cyfenix-Logo.png";

const mainNavItems = [
  { icon: FiGrid,       label: 'Dashboard',       path: '/dashboard' },
  { icon: FiBook,       label: 'Courses',          path: '/courses' },
  { icon: FiTrendingUp, label: 'Course Progress',  path: '/course-progress' },
  { icon: FiClipboard,  label: 'Assessment',       path: '/assessment' },
  { icon: FiBriefcase, label: 'Campus Placement Programs', path: '/dashboard' },
  { icon: FiVideo,     label: 'Interactive Sessions',   path: '/dashboard' },
];

const registerNavItem = { icon: FiFolder, label: 'Registration', path: '/register' };

export const registrationNavItems = [
  { ...registerNavItem, active: true },
  { icon: FiGrid,       label: 'Dashboard',       path: '/dashboard' },
  { icon: FiBook,       label: 'Courses',          path: '/courses' },
  { icon: FiTrendingUp, label: 'Course Progress',  path: '/course-progress' },
  { icon: FiClipboard,  label: 'Assessment',       path: '/assessment' },
];

function getProfileInfo() {
  const raw = localStorage.getItem('name');
  const fullName = raw ? ((() => { try { return JSON.parse(raw); } catch { return raw; } })()) : '';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || 'Student';
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : (parts[0]?.[0] ?? 'S').toUpperCase();
  const profileImage = localStorage.getItem('profileImage') || null;
  return { firstName, initials, profileImage };
}

export default function StudentShell({
  children,
  navItems,
  showCourseSearch = true,
  profileClassName = 'course-topnav-profile d-flex align-items-start gap-2',
  onSignOut,
  onBeforeNav,
}) {
    
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [courseQuery, setCourseQuery] = useState('');
  const { registered, setUser } = useContext(AuthContext);
  const registrationStatus = registered;

  const { firstName, initials, profileImage } = getProfileInfo();
  const navigate = useNavigate();
  const location = useLocation();
  const shellNavItems = navItems ?? (registrationStatus ? mainNavItems : [registerNavItem, ...mainNavItems]);

  const categoryLabels = useMemo(
    () =>
      courseType.reduce((labels, category) => {
        labels[category.id] = category.label;
        return labels;
      }, {}),
    [],
  );

  const courseResults = useMemo(() => {
    const normalizedQuery = courseQuery.trim().toLowerCase();
    if (!normalizedQuery) return [];

    return courses.filter((course) => {
      const haystack = [
        course.title,
        course.instructor,
        course.description,
        course.level,
        course.courseArea,
        course.topic,
        course.format,
        course.platform,
        course.location,
        categoryLabels[course.category],
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [categoryLabels, courseQuery]);

  const handleNav = (path) => {
    setMobileNavOpen(false);
    if (onBeforeNav && onBeforeNav(path) === false) return;
    navigate(path);
  };

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
      return;
    }

    try {
      await axios.post(
        'http://13.201.129.245:8081/api/users/logout',
        {},
        {
          withCredentials: true,
        },
      );

      setUser({});
      localStorage.removeItem('user');
      localStorage.removeItem('email');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const openCourse = (courseId) => {
    setCourseQuery('');
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="dash-wrap">
      <aside className={`sidebar ${mobileNavOpen ? 'open' : ''}`}>
        <div className="brand">
          {/* <div className="brand-logo" style={{ background: 'var(--grad-btn)', border: 0 }}>
            SP
          </div> */}
          <strong>
            <img className='brand-logo' src={CyfenixLogo} alt=" Logo"  />
          </strong>
          <button
            type="button"
            className="mobile-nav-close"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            <FiX />
          </button>
        </div>
        {shellNavItems.map(({ icon: Icon, label, path, active }) => {
          const isActive = active ?? (location.pathname === path || location.pathname.startsWith(`${path}/`));

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
        {/* <div className="nav-item" onClick={() => {
          if (onBeforeNav && onBeforeNav('__logout__') === false) return;
          handleSignOut();
        }}>
          <FiLogOut /> Logout
        </div> */}
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

          {showCourseSearch && (
            <div className="dashboard-course-search">
              <label className="course-search-field">
                <FiSearch />
                <input
                  value={courseQuery}
                  onChange={(event) => setCourseQuery(event.target.value)}
                  placeholder="Search courses, skills, or topics..."
                />
                {courseQuery && (
                  <button type="button" aria-label="Clear course search" onClick={() => setCourseQuery('')}>
                    <FiX />
                  </button>
                )}
              </label>
              {courseQuery.trim() && (
                <div className="dashboard-course-results">
                  {courseResults.length > 0 ? (
                    courseResults.map((course) => (
                      <button type="button" key={course.id} onClick={() => openCourse(course.id)}>
                        <span>
                          <strong>{course.title}</strong>
                          <small>{course.topic} | {course.level}</small>
                        </span>
                        <em>{categoryLabels[course.category]}</em>
                      </button>
                    ))
                  ) : (
                    <div className="dashboard-course-empty">No courses found</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className={profileClassName} style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
            <div className="brand-logo" style={{ width: 36, height: 36, background: profileImage ? 'transparent' : 'var(--grad-btn)', border: 0, overflow: 'hidden', flexShrink: 0 }}>
              {profileImage ? (
                <img src={profileImage} alt={firstName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : initials}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{firstName}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Student</div>
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
