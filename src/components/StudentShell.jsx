import { useContext, useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/axiosSetup.js';
import axios from 'axios';
import {  
  FiBriefcase,
  FiBook,
  FiClipboard,
  FiFolder,
  FiGrid,
  FiMenu,
  FiSearch,
  FiTrendingUp,
  FiVideo,
  FiX,
} from 'react-icons/fi';

import { AuthContext } from '../context/AuthContext.jsx';
import { useCourses } from '../context/CourseContext.jsx';
import CyfenixLogo from '../assets/images/Cyfenix-Logo.png';
import WelcomeTour from './WelcomeTour.jsx';

const mainNavItems = [
  { icon: FiGrid, label: 'Dashboard', path: '/dashboard' },
  { icon: FiBook, label: 'Courses', path: '/courses' },
  { icon: FiTrendingUp, label: 'Course Progress', path: '/course-progress' },
  { icon: FiClipboard, label: 'Assessment', path: '/assessment' },
  { icon: FiBriefcase, label: 'Campus Placement Programs', path: '/dashboard' },
  { icon: FiVideo, label: 'Interactive Sessions', path: '/dashboard' },
];

const registerNavItem = {
  icon: FiFolder,
  label: 'Registration',
  path: '/register',
};

const NAV_TOUR_IDS = {
  Registration: 'nav-registration',
  Courses: 'nav-courses',
  'Course Progress': 'nav-course-progress',
  Assessment: 'nav-assessment',
};

export const registrationNavItems = [
  { ...registerNavItem, active: true },
  { icon: FiGrid, label: 'Dashboard', path: '/dashboard' },
  { icon: FiBook, label: 'Courses', path: '/courses' },
  { icon: FiTrendingUp, label: 'Course Progress', path: '/course-progress' },
  { icon: FiClipboard, label: 'Assessment', path: '/assessment' },
];

function getProfileInfo() {
  const raw = localStorage.getItem('name');

  const fullName = raw
    ? (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      })()
    : '';

  const parts = String(fullName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const firstName = parts[0] || 'Student';

  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (parts[0]?.[0] ?? 'S').toUpperCase();

  return {
    firstName,
    initials,
  };
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
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  const { registered, setUser } = useContext(AuthContext);
  const { courses, courseTypes } = useCourses();

  const registrationStatus = registered;

  const { firstName, initials } = getProfileInfo();

  const navigate = useNavigate();
  const location = useLocation();

  const shellNavItems =
    navItems ??
    (registrationStatus
      ? mainNavItems
      : [registerNavItem, ...mainNavItems]);

  /*
   * Fetch profile image URL from backend only
   */
  useEffect(() => {
    let cancelled = false;

    const loadProfileImage = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/registration/me`
        );

        console.log('Profile info response:', response.data);

        if (cancelled) return;

        const data = response.data?.data;

        if (!data?.hasProfileImage || !data?.id) {
          setProfileImageUrl(null);
          return;
        }

        const imageResponse = await axios.get(
          `${API_BASE_URL}/api/registration/file/${data.id}/profileImage`
        );

        if (cancelled) return;

        if (imageResponse.data?.success && imageResponse.data?.url) {
          setProfileImageUrl(imageResponse.data.url);
        } else {
          setProfileImageUrl(null);
        }
      } catch (error) {
        if (!cancelled) {
          setProfileImageUrl(null);
        }

        console.error('Failed to load profile image:', error);
      }
    };

    loadProfileImage();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoryLabels = useMemo(
    () =>
      courseTypes.reduce((labels, category) => {
        labels[category.id] = category.label;
        return labels;
      }, {}),
    [courseTypes]
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
  }, [categoryLabels, courseQuery, courses]);

  const handleNav = (path) => {
    setMobileNavOpen(false);

    if (onBeforeNav && onBeforeNav(path) === false) {
      return;
    }

    navigate(path);
  };

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/api/users/logout`,
        {},
        {
          withCredentials: true,
        }
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
          <strong>
            <img
              className="brand-logo"
              src={CyfenixLogo}
              alt="Cyfenix Logo"
            />
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

        {shellNavItems.map(
          ({ icon: Icon, label, path, active }) => {
            const isActive =
              active ??
              (location.pathname === path ||
                location.pathname.startsWith(`${path}/`));

            return (
              <div
                key={label}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNav(path)}
                style={{ cursor: 'pointer' }}
                data-tour={NAV_TOUR_IDS[label]}
              >
                <Icon />
                {label}
              </div>
            );
          }
        )}

        <div style={{ flex: 1 }} />
      </aside>

      <div
        className={`sidebar-overlay ${
          mobileNavOpen ? 'open' : ''
        }`}
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
                  onChange={(event) =>
                    setCourseQuery(event.target.value)
                  }
                  placeholder="Search courses, skills, or topics..."
                />

                {courseQuery && (
                  <button
                    type="button"
                    aria-label="Clear course search"
                    onClick={() => setCourseQuery('')}
                  >
                    <FiX />
                  </button>
                )}
              </label>

              {courseQuery.trim() && (
                <div className="dashboard-course-results">
                  {courseResults.length > 0 ? (
                    courseResults.map((course) => (
                      <button
                        type="button"
                        key={course.id}
                        onClick={() => openCourse(course.id)}
                      >
                        <span>
                          <strong>{course.title}</strong>
                          <small>
                            {course.topic} | {course.level}
                          </small>
                        </span>

                        <em>
                          {categoryLabels[course.category]}
                        </em>
                      </button>
                    ))
                  ) : (
                    <div className="dashboard-course-empty">
                      No courses found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Profile */}
          <div
            className={profileClassName}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/profile')}
            data-tour="profile-chip"
          >
            <div
              className="brand-logo"
              style={{
                width: 36,
                height: 36,
                background: profileImageUrl
                  ? 'transparent'
                  : 'var(--grad-btn)',
                border: 0,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={firstName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                  }}
                  onError={() => setProfileImageUrl(null)}
                />
              ) : (
                initials
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {firstName}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                }}
              >
                Student
              </div>
            </div>
          </div>
        </div>

        {children}
      </div>

      <WelcomeTour />
    </div>
  );
}
