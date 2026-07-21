import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiCloud, FiDownload } from 'react-icons/fi';
import { getCourseById } from './courseData.js';
import StudentShell from '../components/StudentShell.jsx';

export default function CourseSuccess({ onSignOut }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = getCourseById(courseId);

  if (!course) return <Navigate to="/courses" replace />;

  const idNum = String(course.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 37).slice(-4);
  const bookingId = `ACZ-${course.id.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${idNum}`;

  return (
    <StudentShell onSignOut={onSignOut}>
      <div className="cs-page">

        {/* Hero */}
        <div className="cs-hero">
          <div className="cs-dot cs-dot-orange" />
          <div className="cs-dot cs-dot-blue" />

          <div className="cs-check-outer">
            <div className="cs-check-mid">
              <div className="cs-check-inner">
                <FiCheck />
              </div>
            </div>
          </div>

          <h1 className="cs-title">Seat Reserved<br />Successfully!</h1>
          <p className="cs-desc">
            Your spot in the <span>{course.title}</span> is secured.
            We've sent the details to your registered email.
          </p>
        </div>

        {/* Info card */}
        <div className="cs-card">
          <div className="cs-badge">CONFIRMED</div>

          <div className="cs-program-row">
            <div className="cs-program-icon"><FiCloud /></div>
            <div>
              <small className="cs-label">PROGRAM</small>
              <strong className="cs-program-title">{course.title}</strong>
            </div>
          </div>

          <div className="cs-divider" />

          <div className="cs-meta-row">
            <div>
              <small className="cs-label">SESSION DATE</small>
              <p className="cs-meta-val">{course.date ?? 'Flexible'}</p>
            </div>
            <div>
              <small className="cs-label">TIME</small>
              <p className="cs-meta-val">{course.time ?? 'Self-paced'}</p>
            </div>
          </div>

          <div className="cs-booking">
            <small className="cs-label">BOOKING ID</small>
            <span className="cs-booking-pill">{bookingId}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="cs-actions">
          <button type="button" className="cs-btn-primary" onClick={() => navigate('/courses-progress')}>
            Go to My Learning <FiArrowRight />
          </button>
          <button type="button" className="cs-btn-outline">
            <FiDownload /> Download Receipt
          </button>
        </div>

      </div>
    </StudentShell>
  );
}
