import { useState, useEffect, useContext } from 'react';
import { FiArrowRight, FiBook, FiAward, FiCheckCircle, FiClock, FiPlay, FiMonitor, FiMapPin } from 'react-icons/fi';
import StudentShell from '../components/StudentShell.jsx';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/axiosSetup.js';
import { AuthContext } from '../context/AuthContext.jsx';

function getStoredName() {
  const name = localStorage.getItem('name');
  if (!name) return 'Student';
  try { return JSON.parse(name); } catch { return name; }
}

function getProfileMeta() {
  const raw      = localStorage.getItem('name');
  const fullName = raw
    ? ((() => { try { return JSON.parse(raw); } catch { return raw; } })())
    : '';
  const parts    = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : (parts[0]?.[0] ?? 'S').toUpperCase();
  return { initials };
}

function getRegistrationProgress(draft) {
  const steps = [
    {
      label: 'Personal Details',
      done: !!(draft.fullName?.trim() && draft.email?.trim() && draft.phone?.trim()),
    },
    {
      label: 'Education',
      done: !!(
        draft.qualificationAfter10th === 'intermediate' ? draft.intermediateYearOfPassing
        : draft.qualificationAfter10th === 'diploma' ? draft.diplomaYearOfPassing
        : false
      ),
    },
    {
      label: 'Projects',
      done: draft.hasProjects === false
        || (Array.isArray(draft.projects) && draft.projects.some(p => p.title?.trim())),
    },
    {
      label: 'Work Experience',
      done: draft.hasWorkExperience === false
        || (Array.isArray(draft.positions) && draft.positions.some(p => p.companyName?.trim() || p.role?.trim())),
    },
  ];
  const completed = steps.filter(s => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);
  return { steps, pct };
}

const TONE_CYCLE = ['blue', 'purple', 'green', 'orange'];

function GaugeMeter({ pct }) {
  const r = 102, cx = 100, cy = 120;
  const circumference = 2 * Math.PI * r;
  const halfCircum    = Math.PI * r;
  const filled        = (pct / 100) * halfCircum;
  return (
    <svg width="100%" height="120" viewBox="0 0 200 120" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="db-gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ef4444" />
          <stop offset="45%"  stopColor="#f97316" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="var(--border-color)" strokeWidth="14"
        strokeDasharray={`${halfCircum} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(180 ${cx} ${cy})`}
      />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="url(#db-gauge-grad)" strokeWidth="14"
        strokeDasharray={`${filled} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(180 ${cx} ${cy})`}
      />
      <text x="100" y="94"  textAnchor="middle" fontSize="28" fontWeight="800" fill="var(--text-heading)">{pct}%</text>
      <text x="100" y="112" textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="2.5" fill="var(--text-subtle)">MASTERY</text>
    </svg>
  );
}

export default function Dashboard({ onSignOut }) {
  const displayName  = getStoredName();
  const { initials } = getProfileMeta();
  const { registered } = useContext(AuthContext);

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registrationDraft, setRegistrationDraft] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/dashboard/summary`)
      .then(res => { if (res.data?.success) setSummary(res.data.data); })
      .catch(err => console.error('Dashboard summary error:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/registration/draft/me`, { withCredentials: true })
      .then(res => { if (res.data?.success && res.data?.data) setRegistrationDraft(res.data.data); })
      .catch(err => console.error('Registration draft fetch error:', err));
  }, []);

  // ── Derived values with safe defaults ────────────────────────────────────
  // A registered user has, by definition, completed registration — regardless
  // of what the in-progress draft record looks like.
  const registrationDraftProgress = registered
    ? { pct: 100, steps: getRegistrationProgress(registrationDraft ?? {}).steps.map(s => ({ ...s, done: true })) }
    : getRegistrationProgress(registrationDraft ?? {});
  const registration = {
    pct: registrationDraftProgress.pct,
    registered: !!registered,
    steps: registrationDraftProgress.steps,
  };
  const assessment     = summary?.assessment     ?? { technical: 0, analytical: 0, communication: 0, masteryScore: 0 };
  const enrollment     = summary?.enrollment     ?? { registered: 0, inProgress: 0, completed: 0, certified: 0 };
  const enrolledCourses = summary?.courses?.enrolled ?? [];
  const whatsNew       = summary?.courses?.whatsNew  ?? [];
  const sessions       = summary?.sessions       ?? { onDemand: 0, online: 0, offline: 0 };

  const courseCounters = [
    { label: 'Registered',  value: enrollment.registered,  icon: FiBook,        tone: 'blue'   },
    { label: 'In Progress', value: enrollment.inProgress,  icon: FiClock,       tone: 'orange' },
    { label: 'Completed',   value: enrollment.completed,   icon: FiCheckCircle, tone: 'green'  },
    { label: 'Certified',   value: enrollment.certified,   icon: FiAward,       tone: 'purple' },
  ];

  const barColors = { blue: '#2563eb', orange: '#f97316', green: '#22c55e', purple: '#7c3aed' };

  return (
    <StudentShell onSignOut={onSignOut}>
      <div className="db-page">

        {/* ── Top Row: Profile + Registration ── */}
        <div className="db-top-row">
          <div className="db-profile-card">
            <p className="db-profile-welcome">Welcome back,</p>
            <h2 className="db-profile-name">👋 {displayName}</h2>
          </div>

          <div className="db-card db-reg-card">
            <div className="db-reg-title-row">
              <h3 className="db-card-title" style={{ margin: 0 }}>Registration Progress</h3>
              <span className="db-reg-pct-label">{registration.pct}%</span>
            </div>
            <div className="db-reg-track" style={{ margin: '10px 0 12px' }}>
              <div className="db-reg-fill" style={{ width: `${registration.pct}%` }} />
            </div>
            {registration.registered ? (
              <div className="reg-verification-badge" style={{ marginBottom: 12 }}>
                <span className="reg-verification-dot" />
                Verification in Progress
              </div>
            ) : (
              <div className="db-reg-pending-badge" style={{ marginBottom: 12 }}>
                <span className="db-reg-pending-dot" />
                Registration Pending
              </div>
            )}
            <ul className="db-reg-steps-list">
              {registration.steps.map(s => (
                <li key={s.label} className={`db-reg-step-item${s.done ? ' done' : ''}`}>
                  <span className="db-reg-step-bullet" />
                  {s.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Skills Row ── */}
        <div className="db-skills-row">

          {/* Gauge */}
          <div className="db-card db-gauge-card">
            <p className="db-section-label">SKILLS OVERVIEW</p>
            <h3 className="db-card-title" style={{ marginBottom: "30px" }}>Overall Proficiency</h3>
            <GaugeMeter pct={assessment.masteryScore} />
            <div className="db-metrics-row">
              <div className="db-metric">
                <span className="db-metric-dot db-dot-green" />
                <span className="db-metric-pct">{assessment.technical}%</span>
                <span className="db-metric-label">Technical</span>
              </div>
              <div className="db-metric">
                <span className="db-metric-dot db-dot-green" />
                <span className="db-metric-pct">{assessment.analytical}%</span>
                <span className="db-metric-label">Analytical</span>
              </div>
              <div className="db-metric">
                <span className="db-metric-dot db-dot-orange" />
                <span className="db-metric-pct">{assessment.communication}%</span>
                <span className="db-metric-label">Comm.</span>
              </div>
            </div>
          </div>

          {/* Enrollment Breakdown bars */}
          <div className="db-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="db-card-top">
              <div>
                <p className="db-section-label">COURSE OVERVIEW</p>
                <h3 className="db-card-title">Enrollment Breakdown</h3>
              </div>
              <span className="db-avg-badge">
                {enrollment.registered} Total
              </span>
            </div>
            {(() => {
              const total = Math.max(enrollment.registered, 1);
              return courseCounters.map(({ label, value, tone }) => {
                const isTotal  = label === 'Registered';
                const barWidth = isTotal ? 100 : Math.round((value / total) * 100);
                const display  = isTotal ? value : `${value}`;
                return (
                  <div key={label} className="db-perf-row">
                    <div className="db-perf-header">
                      <span className="db-perf-label">{label}</span>
                      <span className="db-perf-pct">{display}</span>
                    </div>
                    <div className="db-perf-bar-bg">
                      <div
                        className="db-perf-bar-fill"
                        style={{
                          width: `${barWidth}%`,
                          background: barColors[tone],
                        }}
                      />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* ── My Courses ── */}
        <div className="db-new-cards">
          <div className="db-section-header-row">
            <h3 className="db-section-heading" style={{ marginBottom: 10 }}>My Courses</h3>
            <Link to="/courses" className="db-see-all">See all <FiArrowRight /></Link>
          </div>
          <div className="db-course-list">
            {enrolledCourses.length === 0 && !loading ? (
              <p style={{ color: 'var(--text-subtle)', fontSize: 14 }}>
                No enrolled courses yet.{' '}
                <Link to="/courses" style={{ color: 'var(--accent)' }}>Browse courses →</Link>
              </p>
            ) : enrolledCourses.map((c, i) => {
              const tone   = TONE_CYCLE[i % TONE_CYCLE.length];
              const status = c.progress >= 100 ? 'Completed' : 'In Progress';
              return (
                <Link key={c.id} to="/courses-progress" className="db-course-card">
                  <div className="db-course-card-top">
                    <div>
                      <span className={`db-course-tag db-course-tag-${tone}`}>
                        {c.category || 'Course'}
                      </span>
                      <p className="db-course-title">{c.title}</p>
                    </div>
                    <span className={`db-course-status db-course-status-${tone}`}>{status}</span>
                  </div>
                  <div className="db-course-progress-row">
                    <div className="db-course-bar-bg">
                      <div
                        className={`db-course-bar-fill db-course-bar-${tone}`}
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <span className="db-course-pct">{c.progress}%</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── What's New ── */}
        {whatsNew.length > 0 && (
          <div className="db-new-cards">
            <div className="db-section-header-row">
              <h3 className="db-section-heading" style={{ marginBottom: 10 }}>What's New</h3>
            </div>
            <div className="db-whats-new">
              {whatsNew.map(c => (
                <div key={c.id} className="db-new-card">
                  <span className="db-new-badge">NEW</span>
                  <p className="db-new-title">{c.title}</p>
                  <Link to={`/courses`} className="db-new-link" style={{ cursor: 'pointer' }}>
                    View Details <FiArrowRight />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Registered Sessions ── */}
        <div className="db-new-card">
          <div className="db-section-header-row">
            <h3 className="db-section-heading" style={{ marginBottom: 10 }}>Registered Sessions</h3>
          </div>
          <div className="db-sessions">
            <Link to="/courses-progress" className="db-session-row db-session-blue">
              <div className="db-session-icon"><FiPlay /></div>
              <div className="db-session-body">
                <p className="db-session-title">On-Demand</p>
                <p className="db-session-sub">Self-paced courses. Learn anytime.</p>
              </div>
              <span className="db-session-count" style={{ color: '#f97316' }}>
                {sessions.onDemand}
              </span>
            </Link>
            <Link to="/courses-progress" className="db-session-row db-session-dark">
              <div className="db-session-icon"><FiMonitor /></div>
              <div className="db-session-body">
                <p className="db-session-title">Online Programs</p>
                <p className="db-session-sub">Live sessions &amp; webinars. Join virtually.</p>
              </div>
              <span className="db-session-count" style={{ color: '#f97316' }}>
                {sessions.online}
              </span>
            </Link>
            <Link to="/courses-progress" className="db-session-row db-session-orange">
              <div className="db-session-icon"><FiMapPin /></div>
              <div className="db-session-body">
                <p className="db-session-title">Offline Programs</p>
                <p className="db-session-sub">In-person workshops. At campus.</p>
              </div>
              <span className="db-session-count db-session-count-orange" style={{ color: '#f97316' }}>
                {sessions.offline}
              </span>
            </Link>
          </div>
        </div>

      </div>
    </StudentShell>
  );
}
