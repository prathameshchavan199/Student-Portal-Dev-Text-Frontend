import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiCheck, FiCloud } from 'react-icons/fi';
import { getCourseById } from './courseData.js';
import StudentShell from '../components/StudentShell.jsx';

function QRCode() {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="sc-qr-svg">
      <rect width="100" height="100" fill="white" rx="6"/>
      <rect x="7"  y="7"  width="28" height="28" rx="3" fill="#1f2937"/>
      <rect x="11" y="11" width="20" height="20" rx="2" fill="white"/>
      <rect x="15" y="15" width="12" height="12" rx="1" fill="#1f2937"/>
      <rect x="65" y="7"  width="28" height="28" rx="3" fill="#1f2937"/>
      <rect x="69" y="11" width="20" height="20" rx="2" fill="white"/>
      <rect x="73" y="15" width="12" height="12" rx="1" fill="#1f2937"/>
      <rect x="7"  y="65" width="28" height="28" rx="3" fill="#1f2937"/>
      <rect x="11" y="69" width="20" height="20" rx="2" fill="white"/>
      <rect x="15" y="73" width="12" height="12" rx="1" fill="#1f2937"/>
      <rect x="40" y="7"  width="5" height="5" fill="#1f2937"/>
      <rect x="48" y="7"  width="5" height="5" fill="#1f2937"/>
      <rect x="56" y="7"  width="5" height="5" fill="#1f2937"/>
      <rect x="40" y="15" width="5" height="5" fill="#1f2937"/>
      <rect x="56" y="15" width="5" height="5" fill="#1f2937"/>
      <rect x="48" y="23" width="5" height="5" fill="#1f2937"/>
      <rect x="56" y="23" width="5" height="5" fill="#1f2937"/>
      <rect x="7"  y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="15" y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="23" y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="40" y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="56" y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="64" y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="80" y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="88" y="40" width="5" height="5" fill="#1f2937"/>
      <rect x="7"  y="48" width="5" height="5" fill="#1f2937"/>
      <rect x="23" y="48" width="5" height="5" fill="#1f2937"/>
      <rect x="40" y="48" width="5" height="5" fill="#1f2937"/>
      <rect x="56" y="48" width="5" height="5" fill="#1f2937"/>
      <rect x="72" y="48" width="5" height="5" fill="#1f2937"/>
      <rect x="88" y="48" width="5" height="5" fill="#1f2937"/>
      <rect x="7"  y="56" width="5" height="5" fill="#1f2937"/>
      <rect x="15" y="56" width="5" height="5" fill="#1f2937"/>
      <rect x="31" y="56" width="5" height="5" fill="#1f2937"/>
      <rect x="48" y="56" width="5" height="5" fill="#1f2937"/>
      <rect x="64" y="56" width="5" height="5" fill="#1f2937"/>
      <rect x="80" y="56" width="5" height="5" fill="#1f2937"/>
      <rect x="40" y="65" width="5" height="5" fill="#1f2937"/>
      <rect x="56" y="65" width="5" height="5" fill="#1f2937"/>
      <rect x="72" y="65" width="5" height="5" fill="#1f2937"/>
      <rect x="88" y="65" width="5" height="5" fill="#1f2937"/>
      <rect x="40" y="73" width="5" height="5" fill="#1f2937"/>
      <rect x="48" y="73" width="5" height="5" fill="#1f2937"/>
      <rect x="64" y="73" width="5" height="5" fill="#1f2937"/>
      <rect x="80" y="73" width="5" height="5" fill="#1f2937"/>
      <rect x="40" y="81" width="5" height="5" fill="#1f2937"/>
      <rect x="56" y="81" width="5" height="5" fill="#1f2937"/>
      <rect x="72" y="81" width="5" height="5" fill="#1f2937"/>
      <rect x="40" y="89" width="5" height="5" fill="#1f2937"/>
      <rect x="48" y="89" width="5" height="5" fill="#1f2937"/>
      <rect x="64" y="89" width="5" height="5" fill="#1f2937"/>
      <rect x="80" y="89" width="5" height="5" fill="#1f2937"/>
      <rect x="88" y="89" width="5" height="5" fill="#1f2937"/>
    </svg>
  );
}

export default function PaymentSuccess({ onSignOut }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = getCourseById(courseId);

  if (!course) return <Navigate to="/courses" replace />;

  const bookingId = `ACZ-${course.id.slice(0, 4).toUpperCase()}-${course.id.slice(4, 8).toUpperCase()}`;

  return (
    <StudentShell onSignOut={onSignOut}>
      <div className="ps-page">
        <div className="ps-card">

          {/* <div className="ps-topbar">
            <button type="button" className="mcq-topbar-back" aria-label="Go back" onClick={() => navigate(-1)}>
              <FiArrowLeft />
            </button>
          </div> */}
          <div className="course-phone-topbar course-detail-header">
            <button type="button" className="mcq-topbar-back" aria-label="Go back" onClick={() => navigate(-1)}>
              <FiArrowLeft />
            </button>
            <span>Payment Status</span>
          </div>

          <div className="ps-hero">
            <div className="ps-check-ring">
              <div className="ps-check-inner"><FiCheck /></div>
            </div>
            <h1 className="ps-title">Seat Reserved<br />Successfully!</h1>
            <p className="ps-desc">
              Your spot in the <span>{course.title}</span> is secured.
              We have sent the details to your registered email.
            </p>
          </div>

          <div className="ps-section">
            <div className="ps-program-row">
              <div className="ps-program-icon"><FiCloud /></div>
              <div className="ps-program-info">
                <small>PROGRAM</small>
                <strong>{course.title}</strong>
              </div>
              <span className="ps-badge">CONFIRMED</span>
            </div>
          </div>

          <div className="ps-section">
            <div className="ps-details-row">
              <div className="ps-details-col">
                <div className="ps-detail">
                  <small>SESSION DATE</small>
                  <p>{course.date ?? 'Flexible'}</p>
                </div>
                <div className="ps-detail">
                  <small>TIME</small>
                  <p>{course.time ?? 'Self-paced'}</p>
                </div>
                <div className="ps-detail">
                  <small>BOOKING ID</small>
                  <p className="ps-mono">{bookingId}</p>
                </div>
              </div>
              <div className="ps-qr"><QRCode /></div>
            </div>
          </div>

          <div className="ps-cta-wrap">
            <button type="button" className="ps-cta" onClick={() => navigate('/courses-progress')}>
              Go to My Learning <FiArrowRight />
            </button>
          </div>

        </div>
      </div>
    </StudentShell>
  );
}
