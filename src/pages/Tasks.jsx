import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowLeft,
  FiBarChart2,
  FiClock,
  FiCode,
  FiCpu,
  FiDatabase,
  FiEdit2,
  FiFileText,
  FiFilter,
  FiGlobe,
  FiGrid,
  FiKey,
  FiLayers,
  FiLock,
  FiMessageCircle,
  FiMic,
  FiPackage,
  FiPieChart,
  FiServer,
  FiShield,
  FiTarget,
  FiTrendingUp,
  FiAward,
  FiZap,
} from 'react-icons/fi';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/axiosSetup.js';
import StudentShell from '../components/StudentShell.jsx';

const ICON_MAP = {
  FiLayers, FiCode, FiCpu, FiDatabase, FiPackage, FiServer,
  FiTarget, FiBarChart2, FiGrid, FiFileText, FiFilter, FiZap,
  FiMic, FiEdit2, FiPieChart, FiTrendingUp, FiAward,
  FiGlobe, FiKey, FiLock, FiShield,
};

const DRAFT_KEY = 'student-portal-registration-draft';

const RELATED_COURSE = {
  'data-structures':    'fullstack-lab',
  'web-development':    'react-essentials',
  'algorithms':         'fullstack-lab',
  'databases':          'data-science-bootcamp',
  'oop':                'advanced-react-patterns',
  'system-design':      'cloud-computing-masterclass',
  'logical-reasoning':  'data-science-bootcamp',
  'numerical-aptitude': 'data-science-bootcamp',
  'pattern-recognition':'data-science-bootcamp',
  'verbal-reasoning':   'fullstack-lab',
  'critical-thinking':  'cloud-computing-masterclass',
  'decision-making':    'cloud-computing-masterclass',
  'network-security':   'cybersecurity-essentials',
  'secure-coding':      'cybersecurity-essentials',
  'threat-analysis':    'cybersecurity-essentials',
  'cryptography':       'cybersecurity-essentials',
  'incident-response':  'cybersecurity-essentials',
  'owasp':              'cybersecurity-essentials',
  'sql-fundamentals':   'data-science-bootcamp',
  'data-analysis':      'data-science-bootcamp',
  'data-visualization': 'data-science-bootcamp',
  'statistics':         'data-science-bootcamp',
  'ml-basics':          'data-science-bootcamp',
  'big-data':           'cloud-computing-masterclass',
  'speaking-test':      'fullstack-lab',
  'writing-test':       'fullstack-lab',
};

function getRecommendedModuleIds() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return new Set();
    const draft = JSON.parse(raw);
    const ids = new Set();

    for (const p of (draft.projects ?? [])) {
      if (!p.isTechnical) continue;
      const { techStack, frontEnd, backEnd, database } = p;

      if (techStack === 'Full Stack')           { ids.add('web-development'); ids.add('databases'); ids.add('system-design'); ids.add('oop'); }
      else if (techStack === 'Front-end Only')  { ids.add('web-development'); ids.add('oop'); }
      else if (techStack === 'Back-end Only')   { ids.add('web-development'); ids.add('databases'); ids.add('system-design'); ids.add('oop'); }
      else if (techStack === 'Data Science / ML') { ids.add('data-analysis'); ids.add('statistics'); ids.add('ml-basics'); ids.add('sql-fundamentals'); }
      else if (techStack === 'DevOps / Cloud')  { ids.add('system-design'); ids.add('big-data'); }
      else if (techStack === 'Mobile App')      { ids.add('web-development'); ids.add('oop'); }
      else if (techStack === 'Embedded Systems') { ids.add('algorithms'); ids.add('oop'); }

      if (['React.js', 'Vue.js', 'Angular', 'Next.js', 'HTML / CSS / JS'].includes(frontEnd)) ids.add('web-development');
      if (['Flutter', 'React Native', 'Android (Kotlin)', 'iOS (Swift)'].includes(frontEnd)) { ids.add('web-development'); ids.add('oop'); }

      if (backEnd && backEnd !== '' && backEnd !== 'Other') { ids.add('web-development'); ids.add('system-design'); }
      if (['Python (Django)', 'Python (Flask)', 'Python (FastAPI)'].includes(backEnd)) ids.add('data-analysis');

      if (['MySQL', 'PostgreSQL', 'SQLite', 'Oracle', 'Microsoft SQL Server'].includes(database)) { ids.add('databases'); ids.add('sql-fundamentals'); }
      else if (database && database !== '' && database !== 'Other') ids.add('databases');

      if (techStack === 'Full Stack')           { ids.add('logical-reasoning'); ids.add('critical-thinking'); ids.add('decision-making'); }
      else if (techStack === 'Front-end Only')  { ids.add('logical-reasoning'); ids.add('verbal-reasoning'); ids.add('pattern-recognition'); }
      else if (techStack === 'Back-end Only')   { ids.add('logical-reasoning'); ids.add('numerical-aptitude'); ids.add('critical-thinking'); ids.add('decision-making'); }
      else if (techStack === 'Data Science / ML') { ids.add('numerical-aptitude'); ids.add('pattern-recognition'); ids.add('logical-reasoning'); ids.add('critical-thinking'); }
      else if (techStack === 'DevOps / Cloud')  { ids.add('logical-reasoning'); ids.add('critical-thinking'); ids.add('decision-making'); }
      else if (techStack === 'Mobile App')      { ids.add('logical-reasoning'); ids.add('pattern-recognition'); }
      else if (techStack === 'Embedded Systems') { ids.add('numerical-aptitude'); ids.add('logical-reasoning'); ids.add('pattern-recognition'); }

      if (['React.js', 'Vue.js', 'Angular', 'Next.js', 'HTML / CSS / JS'].includes(frontEnd)) { ids.add('logical-reasoning'); ids.add('verbal-reasoning'); }
      if (['Flutter', 'React Native', 'Android (Kotlin)', 'iOS (Swift)'].includes(frontEnd))   { ids.add('logical-reasoning'); ids.add('pattern-recognition'); }

      if (backEnd && backEnd !== '' && backEnd !== 'Other')                                    { ids.add('critical-thinking'); ids.add('decision-making'); }
      if (['Python (Django)', 'Python (Flask)', 'Python (FastAPI)'].includes(backEnd))         { ids.add('numerical-aptitude'); ids.add('logical-reasoning'); }

      if (['MySQL', 'PostgreSQL', 'SQLite', 'Oracle', 'Microsoft SQL Server'].includes(database)) { ids.add('numerical-aptitude'); ids.add('logical-reasoning'); }

      if (techStack) { ids.add('speaking-test'); ids.add('writing-test'); }
    }

    return ids;
  } catch { return new Set(); }
}

// Normalise an API attempt to the shape the render expects
function normaliseAttempt(a) {
  const dt = a.attemptedAt ? new Date(a.attemptedAt) : new Date();
  return {
    correct:        a.score,
    totalQuestions: a.total,
    date: dt.toISOString().split('T')[0],
    time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

// CommTasks — communication category has a different card layout
function CommTasks({ data, navigate, recommendedIds, allAttempts }) {
  const { topbarLabel, heading, subtitle, modules, badge } = data;
  const completedCount = modules.filter(m => (allAttempts[m.id] ?? []).length > 0).length;

  const TIPS = [
    { icon: FiMessageCircle, title: 'Focus on Conciseness', body: 'Technical communication values brevity. Avoid jargon unless necessary for the specific technical context.' },
    { icon: FiClock,         title: 'Manage Your Time',    body: 'Practice with a timer to ensure your oral presentation hits the required duration accurately.' },
  ];

  return (
    <main className="course-shell techskills-shell">
      <section className="course-phone-panel techskills-panel">

        <div className="course-phone-topbar">
          <button type="button" className="mcq-topbar-back" aria-label="Back to Assessment" onClick={() => navigate('/assessment')}>
            <FiArrowLeft />
          </button>
          <span>{topbarLabel}</span>
        </div>

        <div className="techskills-hero">
          <h1>{heading}</h1>
          <p>{subtitle}</p>
        </div>

        <div className="comm-modules">
          {modules.map((mod) => {
            const Icon = ICON_MAP[mod.icon] || FiAward;
            const isRecommended = recommendedIds.has(mod.id);
            const attempts = (allAttempts[mod.id] ?? []).map(normaliseAttempt);
            const tags = mod.tag ? mod.tag.split(',').map(t => t.trim()) : [];
            return (
              <div className="comm-card" key={mod.id}>
                <div className="comm-card-header">
                  <div className="comm-icon"><Icon /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {isRecommended && <span className="task-recommended-badge">Recommended</span>}
                    <div className="comm-tags">
                      {tags.map(tag => <span key={tag} className="comm-tag">{tag}</span>)}
                    </div>
                  </div>
                </div>
                <h2 className="comm-card-title">{mod.title}</h2>
                <p className="comm-card-desc" dangerouslySetInnerHTML={{ __html: mod.description }} />

                <div className="task-attempt-history">
                  <div className="task-attempt-row task-attempt-header">
                    <span>Attempt</span><span>Percentage</span><span>Marks</span><span>Date &amp; Time</span>
                  </div>
                  {[0, 1, 2].map((i) => {
                    const a = attempts[i];
                    const pct = a ? Math.round((a.correct / a.totalQuestions) * 100) : null;
                    return (
                      <div key={i} className="task-attempt-row">
                        <span className="task-attempt-label">Attempt {i + 1}</span>
                        {a ? (
                          <>
                            <span className={`task-attempt-score${pct >= 70 ? ' pass' : ' fail'}`}>{pct}%</span>
                            <span className="task-attempt-marks">{a.correct}/{a.totalQuestions}</span>
                            <span className="task-attempt-detail">{a.date}{a.time ? ` · ${a.time}` : ''}</span>
                          </>
                        ) : (
                          <><span className="task-attempt-empty">-</span><span className="task-attempt-empty">-</span><span className="task-attempt-empty">-</span></>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="comm-btn-row">
                  <button
                    type="button"
                    className="comm-btn"
                    onClick={() => navigate(
                      mod.type === 'writing-test'
                        ? '/assessment/communication/writing-test'
                        : '/assessment/communication/test',
                      { state: { moduleTitle: mod.title, moduleId: mod.id } }
                    )}
                  >
                    Start Assessment
                  </button>
                  <button
                    type="button"
                    className="comm-related-btn"
                    onClick={() => navigate(`/courses/${RELATED_COURSE[mod.id]}`)}
                  >
                    Related Courses
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="comm-tips-card">
          <div className="comm-tips-header"><span>Tips for Success</span></div>
          {TIPS.map(({ icon: TipIcon, title: tipTitle, body }) => (
            <div className="comm-tip-row" key={tipTitle}>
              <div className="comm-tip-icon"><TipIcon /></div>
              <div><strong>{tipTitle}</strong><p>{body}</p></div>
            </div>
          ))}
        </div>

        <div className="comm-progress-section">
          <div className="comm-trophy"><FiAward /></div>
          <h3 className="comm-progress-title">Your Hub Progress</h3>
          <p className="comm-progress-desc">Complete both tests to earn the '{badge || 'Eloquent Engineer'}' badge.</p>
          <div className="comm-progress-bar">
            <div className="comm-progress-fill" style={{ width: `${(completedCount / modules.length) * 100}%` }} />
          </div>
          <span className="comm-progress-label">{completedCount} of {modules.length} Modules Completed</span>
        </div>

      </section>
    </main>
  );
}

export default function Tasks({ onSignOut }) {
  const { category } = useParams();
  const navigate = useNavigate();
  const [categoryData, setCategoryData] = useState(null);
  const [allAttempts, setAllAttempts]   = useState({});
  const [loading, setLoading]           = useState(true);
  const [notFound, setNotFound]         = useState(false);

  const recommendedIds = useMemo(() => getRecommendedModuleIds(), []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      axios.get(`${API_BASE_URL}/api/assessments/${category}`),
      axios.get(`${API_BASE_URL}/api/assessments/attempts`),
    ])
      .then(([catRes, attRes]) => {
        if (cancelled) return;
        if (catRes.data?.success) {
          setCategoryData(catRes.data.data);
        } else {
          setNotFound(true);
        }
        if (attRes.data?.success) {
          setAllAttempts(attRes.data.data);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [category]);

  if (loading) {
    return (
      <StudentShell onSignOut={onSignOut}>
        <main className="course-shell techskills-shell">
          <section className="course-phone-panel techskills-panel">
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Loading…</div>
          </section>
        </main>
      </StudentShell>
    );
  }

  if (notFound || !categoryData) return <Navigate to="/assessment" replace />;

  if (category === 'communication') {
    return (
      <StudentShell onSignOut={onSignOut}>
        <CommTasks data={categoryData} navigate={navigate} recommendedIds={recommendedIds} allAttempts={allAttempts} />
      </StudentShell>
    );
  }

  const { topbarLabel, heading, accentWord, subtitle, modules } = categoryData;

  const sortedModules = recommendedIds.size > 0
    ? [...modules].sort((a, b) => (recommendedIds.has(a.id) ? 0 : 1) - (recommendedIds.has(b.id) ? 0 : 1))
    : modules;

  return (
    <StudentShell onSignOut={onSignOut}>
      <main className="course-shell techskills-shell">
        <section className="course-phone-panel techskills-panel">

          <div className="course-phone-topbar">
            <button type="button" className="mcq-topbar-back" aria-label="Back to Assessment" onClick={() => navigate('/assessment')}>
              <FiArrowLeft />
            </button>
            <span>{topbarLabel}</span>
          </div>

          <div className="techskills-hero">
            <h1>{heading}{' '}{accentWord}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="techskills-grid">
            {sortedModules.map((mod) => {
              const Icon = ICON_MAP[mod.icon] || FiAward;
              const levelClass = (mod.level || '').toLowerCase();
              const isRecommended = recommendedIds.has(mod.id);
              const attempts      = (allAttempts[mod.id] ?? []).map(normaliseAttempt);
              const attemptCount  = attempts.length;
              const exhausted     = attemptCount >= 3;

              const startLabel = exhausted
                ? 'Attempts Completed'
                : attemptCount > 0 ? 'Reassess Yourself' : 'Start Assessment';

              return (
                <article className="techskills-module-card" key={mod.id}>
                  <div className="techskills-module-card-header">
                    <div className="techskills-module-icon"><Icon /></div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      {isRecommended && <span className="task-recommended-badge">Recommended</span>}
                      {mod.level && <span className={`module-level-badge ${levelClass}`}>{mod.level}</span>}
                    </div>
                  </div>

                  <h2 className="techskills-module-title">{mod.title}</h2>
                  <p className="techskills-module-desc">{mod.description}</p>

                  {(mod.duration || mod.questions) && (
                    <div className="techskills-module-meta">
                      {mod.duration  && <span><FiClock />{mod.duration}</span>}
                      {mod.questions && <span><FiFileText />{mod.questions} Questions</span>}
                    </div>
                  )}

                  <div className="task-attempt-history">
                    <div className="task-attempt-row task-attempt-header">
                      <span>Attempt</span><span>Percentage</span><span>Marks</span><span>Date &amp; Time</span>
                    </div>
                    {[0, 1, 2].map((i) => {
                      const a = attempts[i];
                      const pct = a ? Math.round((a.correct / a.totalQuestions) * 100) : null;
                      return (
                        <div key={i} className="task-attempt-row">
                          <span className="task-attempt-label">Attempt {i + 1}</span>
                          {a ? (
                            <>
                              <span className={`task-attempt-score${pct >= 70 ? ' pass' : ' fail'}`}>{pct}%</span>
                              <span className="task-attempt-marks">{a.correct}/{a.totalQuestions}</span>
                              <span className="task-attempt-detail">{a.date}{a.time ? ` · ${a.time}` : ''}</span>
                            </>
                          ) : (
                            <><span className="task-attempt-empty">-</span><span className="task-attempt-empty">-</span><span className="task-attempt-empty">-</span></>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="techskills-btn-row">
                    <button
                      type="button"
                      className="techskills-select-btn"
                      disabled={exhausted}
                      onClick={() => navigate(`/assessment/${category}/test`, { state: { moduleTitle: mod.title, moduleId: mod.id } })}
                    >
                      {startLabel}
                    </button>
                    <button
                      type="button"
                      className="techskills-related-btn"
                      onClick={() => navigate(`/courses/${RELATED_COURSE[mod.id]}`)}
                    >
                      Related Courses
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

        </section>
      </main>
    </StudentShell>
  );
}
