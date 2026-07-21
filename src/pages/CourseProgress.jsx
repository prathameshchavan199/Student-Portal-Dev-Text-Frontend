import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseCard from './CourseCard.jsx';
import { courses } from './courseData.js';
import StudentShell from '../components/StudentShell.jsx';

const progressTypes = [
  { id: 'registered', label: 'Registered Courses', shortLabel: 'Registered' },
  { id: 'completed', label: 'Completed Courses', shortLabel: 'Completed' },
  { id: 'inProgress', label: 'In-Progress Courses', shortLabel: 'In-Progress' },
  { id: 'certified', label: 'Certified Courses', shortLabel: 'Certified' },
];

const courseProgress = {
  registered: ['cloud-computing-masterclass', 'cybersecurity-essentials'],
  completed: ['react-essentials'],
  inProgress: ['advanced-react-patterns', 'data-science-bootcamp'],
  certified: ['fullstack-lab'],
};

const actionLabels = {
  registered: 'View Course',
  completed: 'Review Course',
  inProgress: 'Continue Course',
  certified: 'View Certificate',
};

export default function CourseProgress({ onSignOut }) {
  const [progressMode, setProgressMode] = useState('registered');
  const navigate = useNavigate();

  const activeType = progressTypes.find((type) => type.id === progressMode);
  const visibleCourses = useMemo(() => {
    const courseIds = courseProgress[progressMode] || [];
    return courseIds
      .map((courseId) => courses.find((course) => course.id === courseId))
      .filter(Boolean);
  }, [progressMode]);

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
            {progressTypes.map((type) => (
              <button
                type="button"
                key={type.id}
                className={progressMode === type.id ? 'active' : ''}
                onClick={() => setProgressMode(type.id)}
              >
                {type.shortLabel}
              </button>
            ))}
          </div>

          <div className="course-results-count">
            {visibleCourses.length} course{visibleCourses.length === 1 ? '' : 's'} found
          </div>

          <div className="course-booking-list">
            {visibleCourses.map((course) => (
              <CourseCard
                key={course.id}
                {...course}
                showPrice={false}
                actionLabel={actionLabels[progressMode]}
                onAction={() => navigate(`/courses/${course.id}`)}
              />
            ))}
            {visibleCourses.length === 0 && (
              <div className="course-empty-state">
                No courses found in this progress category.
              </div>
            )}
          </div>
        </section>
      </main>
    </StudentShell>
  );
}
