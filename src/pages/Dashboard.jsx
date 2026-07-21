import { useContext } from 'react';
import { FiArrowRight, FiBriefcase, FiBook, FiAward, FiCheckCircle, FiClock, FiPlay, FiMonitor, FiMapPin } from 'react-icons/fi';
import StudentShell from '../components/StudentShell.jsx';
import { Link } from 'react-router-dom';
import { AuthContext } from "../context/AuthContext";


const DRAFT_KEY = 'student-portal-registration-draft';

function getStoredName() {
  const name = localStorage.getItem('name');
  if (!name) return 'Student';
  try { return JSON.parse(name); } catch { return name; }
}

function getProfileMeta() {
  const raw = localStorage.getItem('name');
  const fullName = raw ? ((() => { try { return JSON.parse(raw); } catch { return raw; } })()) : '';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : (parts[0]?.[0] ?? 'S').toUpperCase();
  const profileImage = localStorage.getItem('profileImage') || null;
  return { initials, profileImage };
}

function getRegistrationDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function getRegistrationProgress() {
  const draft = getRegistrationDraft();
  const steps = [
    {
      label: 'Basic Data',
      done: !!(draft.fullName?.trim() && draft.email?.trim() && draft.phone?.trim()),
    },
    {
      label: 'Education',
      done: !!(draft.qualificationAfter10th || draft.undergraduateDegree?.trim() || draft.has12th || draft.hasdiploma),
    },
    {
      label: 'Projects',
      done: draft.hasProjects === false || (Array.isArray(draft.projects) && draft.projects.some(p => p.title?.trim())),
    },
    {
      label: 'Experience',
      done: draft.hasWorkExperience === false || (Array.isArray(draft.positions) && draft.positions.some(p => p.company?.trim() || p.title?.trim())),
    },
  ];
  const completed = steps.filter(s => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);
  return { steps, pct };
}

function getProfileTags(draft) {
  const ts = draft.projects?.[0]?.techStack || '';
  if (!ts) return [];
  if (ts === 'Full Stack')          return ['Full-Stack'];
  if (ts === 'Data Science / ML')   return ['Data Science', 'AI/ML'];
  if (ts === 'DevOps / Cloud')      return ['DevOps', 'Cloud'];
  if (ts === 'Front-end Only')      return ['Front-end'];
  if (ts === 'Back-end Only')       return ['Back-end'];
  if (ts === 'Mobile App')          return ['Mobile'];
  if (ts === 'Embedded Systems')    return ['Embedded'];
  return [ts.split('/')[0].trim()];
}

const courseCounters = [
  { label: 'Registered',  value: 2, icon: FiBook,        tone: 'blue'   },
  { label: 'In Progress', value: 2, icon: FiClock,       tone: 'orange' },
  { label: 'Completed',   value: 1, icon: FiCheckCircle, tone: 'green'  },
  { label: 'Certified',   value: 1, icon: FiAward,       tone: 'purple' },
];

const ENROLLED_COURSES = [
  { id: 'web-dev',      title: 'Full Stack Web Development', tag: 'Development', progress: 65,  status: 'In Progress', tone: 'blue'   },
  { id: 'data-science', title: 'Data Science Fundamentals',  tag: 'Analytics',   progress: 30,  status: 'In Progress', tone: 'purple' },
  { id: 'cloud-arch',   title: 'Cloud Architecture',         tag: 'DevOps',      progress: 100, status: 'Completed',   tone: 'green'  },
];

const WHATS_NEW = [
  { title: 'Advanced AI Analytics'     },
  { title: 'Cloud Security Essentials' },
];

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

  const { registered } = useContext(AuthContext);
  const displayName  = getStoredName();
  const { initials, profileImage } = getProfileMeta();
  const draft        = getRegistrationDraft();
  const { steps, pct } = getRegistrationProgress();
  const isRegistered = registered;
  
  

  const technicalScore  = Math.min(95, Math.max(30, Math.round(pct * 0.9  + 10)));
  const analyticalScore = Math.min(92, Math.max(28, Math.round(pct * 0.85 + 5)));
  const commScore       = Math.min(88, Math.max(25, Math.round(pct * 0.75)));
  const masteryScore    = Math.round((technicalScore + analyticalScore + commScore) / 3);

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
              <span className="db-reg-pct-label">{pct}%</span>
            </div>
            <div className="db-reg-track" style={{ margin: '10px 0 12px' }}>
              <div className="db-reg-fill" style={{ width: `${pct}%` }} />
            </div>
            {isRegistered ? (
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
              {steps.map(s => (
                <li key={s.label} className={`db-reg-step-item${s.done ? ' done' : ''}`}>
                  <span className="db-reg-step-bullet" />
                  {s.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Quick Stats Strip ── */}
        

        {/* ── Skills Row ── */}
        <div className="db-skills-row">
          {/* Gauge */}
          <div className="db-card db-gauge-card">
            <p className="db-section-label">SKILLS OVERVIEW</p>
            <h3 className="db-card-title">Overall Proficiency</h3>
            
            <GaugeMeter pct={masteryScore} />
            <div className="db-metrics-row">
              <div className="db-metric">
                <span className="db-metric-dot db-dot-green" />
                <span className="db-metric-pct">{technicalScore}%</span>
                <span className="db-metric-label">Technical</span>
              </div>
              <div className="db-metric">
                <span className="db-metric-dot db-dot-green" />
                <span className="db-metric-pct">{analyticalScore}%</span>
                <span className="db-metric-label">Analytical</span>
              </div>
              <div className="db-metric">
                <span className="db-metric-dot db-dot-orange" />
                <span className="db-metric-pct">{commScore}%</span>
                <span className="db-metric-label">Comm.</span>
              </div>
            </div>
          </div>

          {/* Course Overview bars */}
          <div className="db-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="db-card-top">
              <div>
                <p className="db-section-label">COURSE OVERVIEW</p>
                <h3 className="db-card-title">Enrollment Breakdown</h3>
              </div>
              <span className="db-avg-badge">{courseCounters.reduce((s, c) => s + c.value, 0)} Total</span>
            </div>
            {(() => {
              const maxVal = Math.max(...courseCounters.map(c => c.value));
              const barColors = { blue: '#2563eb', orange: '#f97316', green: '#22c55e', purple: '#7c3aed' };
              return courseCounters.map(({ label, value, tone }) => (
                <div key={label} className="db-perf-row">
                  <div className="db-perf-header">
                    <span className="db-perf-label">{label}</span>
                    <span className="db-perf-pct" style={{  }}>{value}</span>
                  </div>
                  <div className="db-perf-bar-bg">
                    <div
                      className="db-perf-bar-fill"
                      style={{
                        width: `${(value / maxVal) * 100}%`,
                        background: barColors[tone],
                      }}
                    />
                  </div>
                </div>
              ));
            })()}

            {/* Job matches chip */}
            {/* <div className="db-job-chip">
              <div className="db-job-chip-icon"><FiBriefcase /></div>
              <div>
                <p className="db-job-chip-title">24 Job Matches</p>
                <p className="db-job-chip-sub">Tailored to your tech stack</p>
              </div>
              <FiArrowRight className="db-job-chip-arrow" />
            </div> */}
          </div>
        </div>

        {/* ── Course Progress ── */}
        <div className="db-new-cards">
        <div className="db-section-header-row">
          <h3 className="db-section-heading" style={{ marginBottom: 10 }}>My Courses</h3>
          <Link to="/courses" className="db-see-all">See all <FiArrowRight /></Link>
        </div>
        <div className="db-course-list">
          {ENROLLED_COURSES.map(({ id, title, tag, progress, status, tone }) => (
            <Link key={id} to="/courses-progress" className="db-course-card">
              <div className="db-course-card-top">
                <div>
                  <span className={`db-course-tag db-course-tag-${tone}`}>{tag}</span>
                  <p className="db-course-title">{title}</p>
                </div>
                <span className={`db-course-status db-course-status-${tone}`}>{status}</span>
              </div>
              <div className="db-course-progress-row">
                <div className="db-course-bar-bg">
                  <div className={`db-course-bar-fill db-course-bar-${tone}`} style={{ width: `${progress}%` }} />
                </div>
                <span className="db-course-pct">{progress}%</span>
              </div>
            </Link>
          ))}
        </div>
        </div>

        {/* <div className="db-new-card">
        <div className="db-section-header-row">
          <h3 className="db-section-heading" style={{ marginBottom: 10 }}>Course Overview</h3>
          <Link to="/courses-progress" className="db-see-all">View all <FiArrowRight /></Link>
        </div>
        <div className="db-stats-strip">
          {courseCounters.map(({ label, value, icon: Icon, tone }) => (
            <Link key={label} to="/courses-progress" className={`db-stat-chip db-stat-${tone}`}>
              <div className="db-stat-icon"><Icon /></div>
              <div className="db-stat-body">
                <span className="db-stat-value">{value}</span>
                <span className="db-stat-label">{label}</span>
              </div>
            </Link>
          ))}
        </div>
        </div> */}

        {/* ── What's New ── */}
        <div className="db-new-cards">
          <div className="db-section-header-row">
            <h3 className="db-section-heading" style={{ marginBottom: 10 }}>What's New</h3>
          </div>
          <div className="db-whats-new">
            {WHATS_NEW.map(({ title }) => (
              <div key={title} className="db-new-card">
                <span className="db-new-badge">NEW</span>
                <p className="db-new-title">{title}</p>
                <button className="db-new-link">View Details <FiArrowRight /></button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Registered Sessions ── */}
        <div className="db-new-card">
        <div className="db-section-header-row">
          <h3 className="db-section-heading" style={{ marginBottom: 10 }}>Registered Sessions</h3>
          {/* <Link to="/courses-progress" className="db-see-all">View all <FiArrowRight /></Link> */}
        </div>
        <div className="db-sessions">
          <Link to="/courses-progress" className="db-session-row db-session-blue">
            <div className="db-session-icon"><FiPlay /></div>
            <div className="db-session-body">
              <p className="db-session-title">On-Demand</p>
              <p className="db-session-sub">Self-paced courses. Learn anytime.</p>
            </div>
            <span className="db-session-count" style={{color:'#f97316'}}>12</span>
          </Link>
          <Link to="/courses-progress" className="db-session-row db-session-dark">
            <div className="db-session-icon"><FiMonitor /></div>
            <div className="db-session-body">
              <p className="db-session-title">Online Programs</p>
              <p className="db-session-sub">Live sessions &amp; webinars. Join virtually.</p>
            </div>
            <span className="db-session-count" style={{color:'#f97316'}}>8</span>
          </Link>
          <Link to="/courses-progress" className="db-session-row db-session-orange">
            <div className="db-session-icon"><FiMapPin /></div>
            <div className="db-session-body">
              <p className="db-session-title">Offline Programs</p>
              <p className="db-session-sub">In-person workshops. At campus.</p>
            </div>
            <span className="db-session-count db-session-count-orange" style={{color:'#f97316'}}>5</span>
          </Link>
        </div>
            </div>
      </div>
    </StudentShell>
  );
}
