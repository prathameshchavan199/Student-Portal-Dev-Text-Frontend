import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CourseCard from './CourseCard.jsx';
import StudentShell from '../components/StudentShell.jsx';
import { API_BASE_URL } from '../api/axiosSetup.js';

const progressTypes = [
  { id: 'REGISTERED',  label: 'Registered Courses',    shortLabel: 'Registered'  },
  { id: 'IN_PROGRESS', label: 'In-Progress Courses',   shortLabel: 'In-Progress' },
  { id: 'COMPLETED',   label: 'Completed Courses',     shortLabel: 'Completed'   },
  { id: 'CERTIFIED',   label: 'Certified Courses',     shortLabel: 'Certified'   },
];

const actionLabels = {
  REGISTERED:  'Start Learning',
  IN_PROGRESS: 'Continue Learning',
  COMPLETED:   'Review Course',
  CERTIFIED:   'View Certificate',
};

export default function CourseProgress({ onSignOut }) {
  const [progressMode, setProgressMode] = useState('REGISTERED');
  const [courses, setCourses]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const navigate = useNavigate();

  const fetchProgress = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/course-progress`)
      .then(res => { if (res.data?.success) setCourses(res.data.data); })
      .catch(err => console.error('Course progress fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProgress(); }, []);

  const handleStart = async (courseId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/course-progress/${courseId}/start`);
      fetchProgress();
    } catch (err) {
      console.error('Start course error:', err);
    }
  };

  const activeType     = progressTypes.find(t => t.id === progressMode);
  // Registered tab shows all purchased courses; other tabs filter by exact status
  const visibleCourses = progressMode === 'REGISTERED'
    ? courses
    : courses.filter(c => c.status === progressMode);

  return (
    <StudentShell onSignOut={onSignOut}>
      <main className="course-shell">
        <section className="course-phone-panel">
          <div className="course-phone-topbar">
            <span>Course Progress</span>
          </div>

          <h1>{activeType?.label}</h1>
          <p>Track your learning journey across enrolled, active, completed, and certified programs.</p>

          <div className="course-mode-tabs course-progress-tabs" aria-label="Course progress categories">
            {progressTypes.map(type => {
              const count = type.id === 'REGISTERED'
                ? courses.length
                : courses.filter(c => c.status === type.id).length;
              return (
                <button
                  type="button"
                  key={type.id}
                  className={progressMode === type.id ? 'active' : ''}
                  onClick={() => setProgressMode(type.id)}
                >
                  {type.shortLabel}
                  {/* {count > 0 && (
                    <span className="cp-tab-badge">{count}</span>
                  )} */}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="course-empty-state">Loading your courses...</div>
          ) : (
            <>
              <div className="course-results-count">
                {visibleCourses.length} course{visibleCourses.length === 1 ? '' : 's'} found
              </div>

              <div className="course-booking-list">
                {visibleCourses.map(course => (
                  <CourseCard
                    key={course.courseId}
                    title={course.title || course.courseName}
                    instructor={course.instructor}
                    description={course.description}
                    imageUrl={course.imageUrl}
                    date={course.date}
                    time={course.time}
                    platform={course.platform}
                    startsIn={course.startsIn}
                    category={course.category}
                    showPrice={false}
                    actionLabel={actionLabels[course.status]}
                    progressPct={course.status === 'IN_PROGRESS' ? course.progressPct : undefined}
                    onAction={() => {
                      if (course.status === 'REGISTERED') {
                        handleStart(course.courseId);
                      } else {
                        navigate(`/courses/${course.courseId}`);
                      }
                    }}
                  />
                ))}
                {visibleCourses.length === 0 && (
                  <div className="course-empty-state">
                    {progressMode === 'REGISTERED'
                      ? 'No purchased courses yet. Browse and enroll in a course to get started.'
                      : `No courses in "${activeType?.label}" yet.`}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </StudentShell>
  );
}
