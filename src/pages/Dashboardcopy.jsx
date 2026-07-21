import { FiAward, FiBook, FiBriefcase, FiCheckCircle, FiClock } from 'react-icons/fi';
import StudentShell from '../components/StudentShell.jsx';
import { Link } from 'react-router-dom';

function getStoredName() {
  const name = localStorage.getItem('name');
  if (!name) return 'Student';
  try { return JSON.parse(name); } catch { return name; }
}

const DRAFT_KEY = 'student-portal-registration-draft';

function getRegistrationProgress() {
  let draft = {};
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    draft = raw ? JSON.parse(raw) : {};
  } catch {}

  const steps = [
    {
      label: 'Basic Data',
      done: !!(draft.fullName?.trim() && draft.email?.trim() && draft.phone?.trim()),
    },
    {
      label: 'Projects',
      done: draft.hasProjects === false ||
        (Array.isArray(draft.projects) && draft.projects.some(p => p.title?.trim())),
    },
    {
      label: 'Education',
      done: !!(draft.qualificationAfter10th || draft.undergraduateDegree?.trim()),
    },
  ];

  const completed = steps.filter(s => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);
  return { steps, pct };
}

// const name=user.name;

const courseCounters = [
  { label: 'Registered', value: 2, icon: FiBook, tone: 'blue' },
  { label: 'In Progress', value: 2, icon: FiClock, tone: 'orange' },
  { label: 'Completed', value: 1, icon: FiCheckCircle, tone: 'green' },
  { label: 'Certified', value: 1, icon: FiAward, tone: 'purple' },
];

export default function Dashboard({ onSignOut }) {
  const displayName = getStoredName();
  const { steps, pct } = getRegistrationProgress();
  const isRegistered = localStorage.getItem('registered') === 'true';

  return (
    <StudentShell onSignOut={onSignOut}>
        <div className="dash-content" >
          <div className="row g-3">
            <div className="col-lg-8">
              <div className="card-dark dashboard" style={{ background: 'var(--grad-brand)' }}>
                <div style={{ fontSize: 13, opacity: 0.85,color:"white" }}>Welcome back,</div>
                <h2 style={{ fontWeight: 800, margin: '4px 0 8px',color:"white" }}>👋{displayName} </h2>
                <p style={{ maxWidth: 520, color: 'rgba(255,255,255,0.85)' }}>
                  {/* Your registration is almost complete. Pick up where you left off, explore new courses, or check job recommendations. */}
                </p>
                {/* <button className="btn btn-light btn-sm" onClick={() => navigate('/register')}>Continue Registration →</button> */}
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card-dark dashboard">
                <div className="d-flex justify-content-between mb-2">
                  <strong>Registration Progress</strong>
                  <span className="text-orange">{pct}%</span>
                </div>
                <div className="progress-thin">
                  <div className="bar" style={{ width: `${pct}%`, transition: 'width 0.5s ease' }} />
                </div>

                {isRegistered && (
                  <div className="reg-verification-badge">
                    <span className="reg-verification-dot" />
                    Verification in Progress
                  </div>
                )}

                <ul className="list-unstyled mt-3 mb-0 small text-muted-2">
                  {steps.map(s => (
                    <li key={s.label} style={{ color: s.done ? 'var(--text-heading)' : 'var(--text-subtle)', marginBottom: 4 }}>
                      {/* {s.done ? '✓' : '○'} {s.label} */}
                    {'○'} {s.label}

                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="col-12">
              <div className="course-counter-grid">
                
                {courseCounters.map(({ label, value, icon: Icon, tone }) => (
  <Link
    key={label}
    to="/courses-progress"
  >
    <div className={`course-counter-card ${tone}`}>
      <div className="course-counter-icon">
        <Icon />
      </div>
      <div className="course-counter-label">{label}</div>
      <div className="course-counter-value">{value}</div>
    </div>
  </Link>
))}
                
              </div>
            </div>

           <div className="col-md-6">
              <div
                className="card-dark dashboard d-flex align-items-center gap-3"
                // style={{
                //   padding: '20px',
                //   borderRadius: '16px',
                //   background: 'linear-gradient(135deg, rgba(255,140,66,0.12), rgba(255,255,255,0.03))',
                //   border: '1px solid rgba(255,255,255,0.06)',
                //   transition: 'all 0.3s ease',
                //   cursor: 'pointer',
                // }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,140,66,0.15)',
                    color: 'var(--orange)',
                    fontSize: 26,
                    flexShrink: 0,
                  }}
                >
                  <FiBook />
                </div>

                <div>
                  <h5
                    className="mb-1"
                    style={{
                      
                      fontWeight: 700,
                      fontSize: '1.15rem',
                    }}
                  >
                    Courses
                  </h5>

                  <div
                    className="small"
                    style={{
                      color: 'var(--muted)',
                      lineHeight: 1.5,
                    }}
                  >
                  keep learning, keep growing
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div
                className="card-dark dashboard d-flex align-items-center gap-3"
                // style={{
                //   padding: '20px',
                //   borderRadius: '16px',
                //   background: 'linear-gradient(135deg, rgba(255,140,66,0.12), rgba(255,255,255,0.03))',
                //   border: '1px solid rgba(255,255,255,0.06)',
                //   transition: 'all 0.3s ease',
                //   cursor: 'pointer',
                // }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,140,66,0.15)',
                    color: 'var(--orange)',
                    fontSize: 26,
                    flexShrink: 0,
                  }}
                >
                  <FiBriefcase />
                </div>

                <div>
                  <h5
                    className="mb-1"
                    style={{
                    
                      fontWeight: 700,
                      fontSize: '1.15rem',
                    }}
                  >
                    24 Job Matches
                  </h5>

                  <div
                    className="small"
                    style={{
                      color: 'var(--muted)',
                      lineHeight: 1.5,
                    }}
                  >
                    Tailored to your tech stack
                  </div>
                </div>
              </div>
            </div>
            {/* <div className="col-md-4">
              <div className="card-dark dashboard">
                <FiTrendingUp style={{ color: 'var(--orange)', fontSize: 22 }} />
                <h5 className="mt-2">Activity +18%</h5>
                <div className="small text-muted-2">Past 30 days</div>
              </div>
            </div> */}

            {/* <div className="col-lg-7">
              <div className="card-dark dashboard">
                <strong>Activity Overview</strong>
                <div style={{ height: 180, marginTop: 14, borderRadius: 10,
                  background: 'linear-gradient(180deg, rgba(106,92,255,0.2), rgba(239,108,42,0.05))',
                  display: 'flex', alignItems: 'flex-end', gap: 8, padding: 10 }}>
                  {[40, 60, 35, 80, 55, 90, 70, 65, 85, 50, 75, 95].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--grad-btn)', borderRadius: 4 }} />
                  ))}
                </div>
              </div>
            </div> */}
            <div className="col-lg-12">
              
              <div className="card-dark dashboard">
                
                <strong>Notifications</strong>
                <div className="mt-3 small">
                  {[
                    { t: 'New job match: Frontend Intern', s: '2h ago' },
                    { t: 'Course "ML Foundations" updated', s: '1d ago' },
                    { t: 'New announcement: Upcoming Workshop', s: '3d ago' },
                  ].map(n => (
                    <div key={n.t} className="d-flex justify-content-between py-2"
                      style={{ borderBottom: '1px dashed rgba(255,255,255,0.06)' }}>
                      <span>{n.t}</span>
                      <span className="text-muted-2">{n.s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
    </StudentShell>
  );
}
