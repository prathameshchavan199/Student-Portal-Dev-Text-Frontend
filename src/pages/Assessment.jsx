import { FiAward, FiCode, FiDatabase, FiEdit3, FiPlay, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import StudentShell from '../components/StudentShell.jsx';

const assessmentCards = [
  {
    tag: 'Coding',
    title: 'Technical Skills',
    description: 'Solve complex algorithmic problems and demonstrate your coding proficiency across multiple languages.',
    meta: '12 tasks',
    score: '8.4',
    icon: FiCode,
    path: '/assessment/technical-skills',
  },
  {
    tag: 'Aptitude',
    title: 'Problem Solving',
    description: 'Measure logical reasoning, pattern recognition, quantitative thinking, and decision speed.',
    meta: '8 tasks',
    score: '7.8',
    icon: FiEdit3,
    path: '/assessment/problem-solving',
  },
  {
    tag: 'Communication',
    title: 'Communication',
    description: 'Validate fundamentals in secure development, threat awareness, and defensive practices.',
    meta: '6 tasks',
    score: '8.1',
    icon: FiShield,
    path: '/assessment/communication',
  },
  {
    tag: 'Data',
    title: 'Data Skills',
    description: 'Test SQL, analytics, visualization judgment, and practical data interpretation skills.',
    meta: '10 tasks',
    score: '8.6',
    icon: FiDatabase,
    path: '/assessment/data-skills',
  },
];

export default function Assessment({ onSignOut }) {
  const navigate = useNavigate();
  return (
    <StudentShell onSignOut={onSignOut}>
      <main className="course-shell assessment-shell">
        <section className="course-phone-panel assessment-panel">
          <div className="course-phone-topbar ">
            <span>Assessment</span>
          </div>

          <div className="assessment-hero">
            <div className="assessment-hero-copy">
              <h1>Evaluate Yourself</h1>
              <p>
                Measure your readiness for the modern tech landscape with curated assessments.
              </p>
            </div>
            <div className="assessment-hero-badge" aria-hidden="true">
              <FiAward />
            </div>
          </div>

          <div className="assessment-progress-card">
            <div className="assessment-progress-head">
              <span>Overall Progress</span>
              <strong>65%</strong>
            </div>
            <div className="assessment-progress-track">
              <div style={{ width: '65%' }} />
            </div>
            <div className="assessment-stat-grid">
              <div>
                <span>Completed</span>
                <strong>12 Tasks</strong>
              </div>
              <div>
                <span>Avg. Score</span>
                <strong>8.4<small>/10</small></strong>
              </div>
            </div>
          </div>

          <div className="assessment-grid">
            {assessmentCards.map(({ tag, title, description, meta, score, icon: Icon, path }) => (
              <article className="assessment-card" key={title}>
                <div className="assessment-card-visual">
                  <div className="assessment-orbit" />
                  <span>{tag}</span>
                </div>

                <div className="assessment-card-body">
                  <div className="assessment-card-heading">
                    <div className="assessment-card-icon">
                      <Icon />
                    </div>
                    <div>
                      <h2>{title}</h2>
                      <p>{description}</p>
                    </div>
                  </div>

                  <div className="assessment-card-meta">
                    <span>{meta}</span>
                    <span>Score {score}/10</span>
                  </div>
                </div>

                <div className="assessment-card-cta">
                  <button
                    type="button"
                    onClick={() => navigate(path)}
                  >
                    Start Task <FiPlay />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </StudentShell>
  );
}
