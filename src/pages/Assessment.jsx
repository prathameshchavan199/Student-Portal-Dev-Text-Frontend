import { useEffect, useState } from 'react';
import { FiAward, FiCode, FiDatabase, FiEdit3, FiPlay, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/axiosSetup.js';
import StudentShell from '../components/StudentShell.jsx';

const ICON_MAP = { FiCode, FiEdit3, FiShield, FiDatabase };

export default function Assessment({ onSignOut }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/assessments`)
      .then(res => {
        if (res.data?.success) setCategories(res.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Loading assessments…</div>
          ) : (
            <div className="assessment-grid">
              {categories.map((cat) => {
                const Icon = ICON_MAP[cat.icon] || FiAward;
                const path = `/assessment/${cat.id}`;
                return (
                  <article className="assessment-card" key={cat.id}>
                    <div className="assessment-card-visual">
                      <div className="assessment-orbit" />
                      <span>{cat.tag}</span>
                    </div>

                    <div className="assessment-card-body">
                      <div className="assessment-card-heading">
                        <div className="assessment-card-icon">
                          <Icon />
                        </div>
                        <div>
                          <h2>{cat.title}</h2>
                          <p>{cat.subtitle}</p>
                        </div>
                      </div>

                      <div className="assessment-card-meta">
                        <span>{cat.tag}</span>
                        <span>{cat.badge}</span>
                      </div>
                    </div>

                    <div className="assessment-card-cta">
                      <button type="button" onClick={() => navigate(path)}>
                        Start Task <FiPlay />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </StudentShell>
  );
}
