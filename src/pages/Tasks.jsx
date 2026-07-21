import { useMemo } from 'react';
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowRight,
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
import StudentShell from '../components/StudentShell.jsx';

const DRAFT_KEY    = 'student-portal-registration-draft';
const ATTEMPTS_KEY = 'assessment-attempts';

const RELATED_COURSE = {
  'data-structures':  'fullstack-lab',
  'web-development':  'react-essentials',
  'algorithms':       'fullstack-lab',
  'databases':        'data-science-bootcamp',
  'oop':              'advanced-react-patterns',
  'system-design':    'cloud-computing-masterclass',
  'logical-reasoning':   'data-science-bootcamp',
  'numerical-aptitude':  'data-science-bootcamp',
  'pattern-recognition': 'data-science-bootcamp',
  'verbal-reasoning':    'fullstack-lab',
  'critical-thinking':   'cloud-computing-masterclass',
  'decision-making':     'cloud-computing-masterclass',
  'network-security':  'cybersecurity-essentials',
  'secure-coding':     'cybersecurity-essentials',
  'threat-analysis':   'cybersecurity-essentials',
  'cryptography':      'cybersecurity-essentials',
  'incident-response': 'cybersecurity-essentials',
  'owasp':             'cybersecurity-essentials',
  'sql-fundamentals':   'data-science-bootcamp',
  'data-analysis':      'data-science-bootcamp',
  'data-visualization': 'data-science-bootcamp',
  'statistics':         'data-science-bootcamp',
  'ml-basics':          'data-science-bootcamp',
  'big-data':           'cloud-computing-masterclass',
  'speaking-test':      'fullstack-lab',
  'writing-test':       'fullstack-lab',
};

function loadAllAttempts() {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function getRecommendedModuleIds() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return new Set();
    const draft = JSON.parse(raw);
    const ids = new Set();

    for (const p of (draft.projects ?? [])) {
      if (!p.isTechnical) continue;
      const { techStack, frontEnd, backEnd, database } = p;

      // ── Technical Skills ──────────────────────────────────────────
      if (techStack === 'Full Stack')         { ids.add('web-development'); ids.add('databases'); ids.add('system-design'); ids.add('oop'); }
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

      // ── Problem Solving ───────────────────────────────────────────
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

      // ── Communication (Security) ──────────────────────────────────
      if (techStack === 'Full Stack')           { ids.add('secure-coding'); ids.add('owasp'); ids.add('incident-response'); ids.add('threat-analysis'); }
      else if (techStack === 'Front-end Only')  { ids.add('owasp'); ids.add('secure-coding'); }
      else if (techStack === 'Back-end Only')   { ids.add('secure-coding'); ids.add('network-security'); ids.add('cryptography'); ids.add('owasp'); }
      else if (techStack === 'DevOps / Cloud')  { ids.add('network-security'); ids.add('incident-response'); ids.add('threat-analysis'); }
      else if (techStack === 'Data Science / ML') { ids.add('secure-coding'); }
      else if (techStack === 'Embedded Systems') { ids.add('cryptography'); }

      if (['React.js', 'Vue.js', 'Angular', 'Next.js', 'HTML / CSS / JS'].includes(frontEnd)) { ids.add('owasp'); ids.add('secure-coding'); }

      if (backEnd && backEnd !== '' && backEnd !== 'Other')                                    { ids.add('secure-coding'); ids.add('owasp'); }
      if (['Python (Django)', 'Python (Flask)', 'Python (FastAPI)'].includes(backEnd))         { ids.add('secure-coding'); ids.add('owasp'); }

      if (database && database !== '' && database !== 'Other')                                 { ids.add('owasp'); ids.add('secure-coding'); }

      // ── Communication Skills ──────────────────────────────────────
      if (techStack) { ids.add('speaking-test'); ids.add('writing-test'); }
    }

    return ids;
  } catch { return new Set(); }
}

const categoryData = {
  'technical-skills': {
    topbarLabel: 'Technical Skills',
    heading: 'Technical Proficiency',
    accentWord: 'Modules',
    subtitle:
      'Select a technical module to begin your skills assessment. Each session is timed and contributes to your overall competency score.',
    modules: [
      {
        id: 'data-structures',
        icon: FiLayers,
        level: 'ADVANCED',
        levelClass: 'advanced',
        title: 'Data Structures',
        description:
          'Evaluate mastery of complex data types, sorting algorithms, and space-time complexity analysis.',
        duration: '60 mins',
        questions: 35,
      },
      {
        id: 'web-development',
        icon: FiCode,
        level: 'INTERMEDIATE',
        levelClass: 'intermediate',
        title: 'Web Development',
        description:
          'Assess front-end frameworks, responsive design, and modern backend integration patterns.',
        duration: '45 mins',
        questions: 25,
      },
      {
        id: 'algorithms',
        icon: FiCpu,
        level: 'ADVANCED',
        levelClass: 'advanced',
        title: 'Algorithms & Complexity',
        description:
          'Test knowledge of algorithm design, Big-O analysis, recursion, dynamic programming, and optimization techniques.',
        duration: '75 mins',
        questions: 40,
      },
      {
        id: 'databases',
        icon: FiDatabase,
        level: 'INTERMEDIATE',
        levelClass: 'intermediate',
        title: 'Database & SQL',
        description:
          'Measure proficiency in relational databases, query optimization, indexing strategies, and normalization.',
        duration: '50 mins',
        questions: 30,
      },
      {
        id: 'oop',
        icon: FiPackage,
        level: 'INTERMEDIATE',
        levelClass: 'intermediate',
        title: 'Object-Oriented Programming',
        description:
          'Validate understanding of OOP principles, design patterns, inheritance, encapsulation, and polymorphism.',
        duration: '45 mins',
        questions: 28,
      },
      {
        id: 'system-design',
        icon: FiServer,
        level: 'ADVANCED',
        levelClass: 'advanced',
        title: 'System Design',
        description:
          'Demonstrate ability to architect scalable distributed systems, REST APIs, and infrastructure components.',
        duration: '90 mins',
        questions: 20,
      },
    ],
  },

  'problem-solving': {
    topbarLabel: 'Problem Solving',
    heading: 'Aptitude &',
    accentWord: 'Reasoning',
    subtitle:
      'Select a reasoning module to evaluate your logical thinking, numerical ability, and decision-making under timed conditions.',
    modules: [
      {
        id: 'logical-reasoning',
        icon: FiTarget,
        level: 'INTERMEDIATE',
        levelClass: 'intermediate',
        title: 'Logical Reasoning',
        description:
          'Evaluate deductive and inductive reasoning skills through structured argument and syllogism problems.',
        duration: '40 mins',
        questions: 30,
      },
      {
        id: 'numerical-aptitude',
        icon: FiBarChart2,
        level: 'INTERMEDIATE',
        levelClass: 'intermediate',
        title: 'Numerical Aptitude',
        description:
          'Test speed and accuracy in arithmetic, percentages, ratios, and data sufficiency problems.',
        duration: '35 mins',
        questions: 25,
      },
      {
        id: 'pattern-recognition',
        icon: FiGrid,
        level: 'ADVANCED',
        levelClass: 'advanced',
        title: 'Pattern Recognition',
        description:
          'Identify visual and numerical sequences, analogies, and abstract reasoning patterns within time limits.',
        duration: '30 mins',
        questions: 20,
      },
      {
        id: 'verbal-reasoning',
        icon: FiFileText,
        level: 'INTERMEDIATE',
        levelClass: 'intermediate',
        title: 'Verbal Reasoning',
        description:
          'Assess reading comprehension, critical analysis of passages, and inferential thinking from written content.',
        duration: '40 mins',
        questions: 28,
      },
      {
        id: 'critical-thinking',
        icon: FiFilter,
        level: 'ADVANCED',
        levelClass: 'advanced',
        title: 'Critical Thinking',
        description:
          'Measure ability to evaluate arguments, identify assumptions, and draw logical conclusions from complex data.',
        duration: '45 mins',
        questions: 22,
      },
      {
        id: 'decision-making',
        icon: FiZap,
        level: 'ADVANCED',
        levelClass: 'advanced',
        title: 'Decision Making',
        description:
          'Evaluate judgment under uncertainty, trade-off analysis, and structured problem resolution strategies.',
        duration: '35 mins',
        questions: 18,
      },
    ],
  },

  'communication': {
    topbarLabel: 'Communication',
    heading: 'Soft Skill Module',
    accentWord: '',
    subtitle:
      'Refine your professional interaction capabilities. Select a specialised module to evaluate and improve your tech-centric communication proficiency.',
    modules: [
      {
        id: 'speaking-test',
        icon: FiMic,
        title: 'Speaking Test',
        description:
          'Master the art of technical articulation. This module requires a <b>2-minute oral presentation</b> on a randomly assigned technical topic to assess clarity and confidence.',
        tags: ['Presentation'],
        accentColor: 'purple',
      },
      {
        id: 'writing-test',
        icon: FiEdit2,
        title: 'Writing Test',
        description:
          'Enhance your technical documentation. Demonstrate your ability to craft a <b>Professional technical report</b> with precision and logical structure.',
        tags: ['Technical Writing'],
        accentColor: 'orange',
      },
    ],
    tips: [
      { icon: FiMessageCircle, title: 'Focus on Conciseness', body: 'Technical communication values brevity. Avoid jargon unless necessary for the specific technical context.' },
      { icon: FiClock,         title: 'Manage Your Time',    body: 'Practice with a timer to ensure your oral presentation hits the required duration accurately.' },
    ],
    badgeLabel: "Eloquent Engineer",
  },

  'data-skills': {
    topbarLabel: 'Data Skills',
    heading: 'Data Proficiency',
    accentWord: 'Modules',
    subtitle:
      'Select a data module to test your SQL, analytics, and visualization skills across practical real-world scenarios.',
    modules: [
      {
        id: 'sql-fundamentals',
        icon: FiDatabase,
        level: 'INTERMEDIATE',
        levelClass: 'intermediate',
        title: 'SQL Fundamentals',
        description:
          'Evaluate query writing, joins, aggregations, subqueries, and relational database fundamentals.',
        duration: '50 mins',
        questions: 30,
      },
      {
        id: 'data-analysis',
        icon: FiBarChart2,
        level: 'INTERMEDIATE',
        levelClass: 'intermediate',
        title: 'Data Analysis',
        description:
          'Assess ability to clean, explore, and interpret datasets to extract actionable business insights.',
        duration: '55 mins',
        questions: 28,
      },
      {
        id: 'data-visualization',
        icon: FiPieChart,
        level: 'INTERMEDIATE',
        levelClass: 'intermediate',
        title: 'Data Visualization',
        description:
          'Test knowledge of chart selection, dashboard design principles, and storytelling through visual data.',
        duration: '40 mins',
        questions: 22,
      },
      {
        id: 'statistics',
        icon: FiTrendingUp,
        level: 'ADVANCED',
        levelClass: 'advanced',
        title: 'Statistics & Probability',
        description:
          'Measure understanding of descriptive statistics, hypothesis testing, distributions, and regression analysis.',
        duration: '60 mins',
        questions: 35,
      },
      {
        id: 'ml-basics',
        icon: FiCpu,
        level: 'ADVANCED',
        levelClass: 'advanced',
        title: 'Machine Learning Basics',
        description:
          'Evaluate grasp of supervised and unsupervised algorithms, model evaluation metrics, and feature engineering.',
        duration: '65 mins',
        questions: 32,
      },
      {
        id: 'big-data',
        icon: FiServer,
        level: 'ADVANCED',
        levelClass: 'advanced',
        title: 'Big Data Concepts',
        description:
          'Test familiarity with distributed computing, Hadoop, Spark, data lakes, and large-scale pipeline design.',
        duration: '50 mins',
        questions: 26,
      },
    ],
  },
};

function CommTasks({ data, navigate, recommendedIds, allAttempts }) {
  const { topbarLabel, heading, subtitle, modules, tips, badgeLabel } = data;
  const completedCount = 0;

  return (
    <main className="course-shell techskills-shell">
      <section className="course-phone-panel techskills-panel">

        <div className="course-phone-topbar">
          <button
            type="button"
            className="mcq-topbar-back"
            aria-label="Back to Assessment"
            onClick={() => navigate('/assessment')}
          >
            <FiArrowLeft />
          </button>
          <span>{topbarLabel}</span>
        </div>

        <div className="techskills-hero">
          <h1>{heading}</h1>
          <p>{subtitle}</p>
        </div>

      <div className="comm-modules">
        {modules.map(({ id, icon: Icon, title, description, tags }) => {
          const isRecommended = recommendedIds.has(id);
          const attempts = allAttempts[id] ?? [];
          return (
          <div className="comm-card" key={id}>
            <div className="comm-card-header">
              <div className="comm-icon"><Icon /></div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {isRecommended && (
                  <span className="task-recommended-badge">Recommended</span>
                )}
                <div className="comm-tags">
                  {tags.map(tag => <span key={tag} className="comm-tag">{tag}</span>)}
                </div>
              </div>
            </div>
            <h2 className="comm-card-title">{title}</h2>
            <p className="comm-card-desc" dangerouslySetInnerHTML={{ __html: description }} />

            <div className="task-attempt-history">
              <div className="task-attempt-row task-attempt-header">
                <span>Attempt</span>
                <span>Percentage</span>
                <span>Marks</span>
                <span>Date &amp; Time</span>
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
                      <>
                        <span className="task-attempt-empty">-</span>
                        <span className="task-attempt-empty">-</span>
                        <span className="task-attempt-empty">-</span>
                      </>
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
                  id === 'writing-test'
                    ? `/assessment/communication/writing-test`
                    : `/assessment/communication/test`,
                  { state: { moduleTitle: title, moduleId: id } }
                )}
              >
                Start Assessment 
                {/* <FiArrowRight /> */}
              </button>
              <button
                type="button"
                className="comm-related-btn"
                onClick={() => navigate(`/courses/${RELATED_COURSE[id]}`)}
              >
                Related Courses
              </button>
            </div>
          </div>
          );
        })}
      </div>

      <div className="comm-tips-card">
        <div className="comm-tips-header">
          <span>Tips for Success</span>
          {/* <button type="button" className="comm-tips-link">View Guides</button> */}
        </div>
        {tips.map(({ icon: TipIcon, title: tipTitle, body }) => (
          <div className="comm-tip-row" key={tipTitle}>
            <div className="comm-tip-icon"><TipIcon /></div>
            <div>
              <strong>{tipTitle}</strong>
              <p>{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="comm-progress-section">
        <div className="comm-trophy"><FiAward /></div>
        <h3 className="comm-progress-title">Your Hub Progress</h3>
        <p className="comm-progress-desc">Complete both tests to earn the '{badgeLabel}' badge.</p>
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
  const recommendedIds = useMemo(() => getRecommendedModuleIds(), []);
  const allAttempts    = useMemo(() => loadAllAttempts(), []);

  const data = categoryData[category];
  if (!data) return <Navigate to="/assessment" replace />;

  if (category === 'communication') {
    return (
      <StudentShell onSignOut={onSignOut}>
        <CommTasks data={data} navigate={navigate} recommendedIds={recommendedIds} allAttempts={allAttempts} />
      </StudentShell>
    );
  }

  const { topbarLabel, heading, accentWord, subtitle, modules } = data;

  const sortedModules = recommendedIds.size > 0
    ? [...modules].sort((a, b) => (recommendedIds.has(a.id) ? 0 : 1) - (recommendedIds.has(b.id) ? 0 : 1))
    : modules;

  return (
    <StudentShell onSignOut={onSignOut}>
      <main className="course-shell techskills-shell">
        <section className="course-phone-panel techskills-panel">

          <div className="course-phone-topbar">
            <button
              type="button"
              className="mcq-topbar-back"
              aria-label="Back to Assessment"
              onClick={() => navigate('/assessment')}
            >
              <FiArrowLeft />
            </button>
            <span>{topbarLabel}</span>
          </div>

          <div className="techskills-hero">
            <h1>
              {heading}{' '}
              {accentWord}
            </h1>
            <p>{subtitle}</p>
          </div>

          <div className="techskills-grid">
            {sortedModules.map(({ id, icon: Icon, level, levelClass, title, description, duration, questions }) => {
              const isRecommended = recommendedIds.has(id);
              const attempts      = allAttempts[id] ?? [];
              const attemptCount  = attempts.length;
              const maxAttempts   = 3;
              const exhausted     = attemptCount >= maxAttempts;

              const startLabel = exhausted
                ? 'Attempts Completed'
                : attemptCount > 0
                  ? 'Reassess Yourself'
                  : 'Start Assessment';

              return (
                <article className="techskills-module-card" key={id}>
                  <div className="techskills-module-card-header">
                    <div className="techskills-module-icon">
                      <Icon />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      {isRecommended && (
                        <span className="task-recommended-badge">Recommended</span>
                      )}
                      <span className={`module-level-badge ${levelClass}`}>{level}</span>
                    </div>
                  </div>

                  <h2 className="techskills-module-title">{title}</h2>
                  <p className="techskills-module-desc">{description}</p>

                  <div className="techskills-module-meta">
                    <span><FiClock />{duration}</span>
                    <span><FiFileText />{questions} Questions</span>
                  </div>

                  <div className="task-attempt-history">
                    <div className="task-attempt-row task-attempt-header">
                      <span>Attempt</span>
                      <span>Percentage</span>
                      <span>Marks</span>
                      <span>Date &amp; Time</span>
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
                            <>
                              <span className="task-attempt-empty">-</span>
                              <span className="task-attempt-empty">-</span>
                              <span className="task-attempt-empty">-</span>
                            </>
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
                      onClick={() => navigate(`/assessment/${category}/test`, { state: { moduleTitle: title, moduleId: id } })}
                    >
                      {startLabel}
                    </button>
                    <button
                      type="button"
                      className="techskills-related-btn"
                      onClick={() => navigate(`/courses/${RELATED_COURSE[id]}`)}
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
