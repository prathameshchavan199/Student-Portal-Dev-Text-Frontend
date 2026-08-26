import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminShell from '../../components/AdminShell.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

export default function AdminAssessments() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    axios.get(`${API_BASE_URL}/api/admin/dashboard`)
      .then((res) => { if (!cancelled) setDashboard(res.data?.data ?? null); })
      .catch(() => { if (!cancelled) setError('Could not load assessment data.'); });
    return () => { cancelled = true; };
  }, []);

  const modules = dashboard?.assessmentPerformance ?? [];

  return (
    <AdminShell title="Assessments" subtitle="Average performance across modules">
      <div className="admin-page">
        <div className="glass-card">
          {error && <div className="admin-empty">{error}</div>}
          {!error && !dashboard && <div className="admin-empty">Loading assessment data...</div>}
          {!error && dashboard && modules.length === 0 && (
            <div className="admin-empty">No assessment attempts recorded yet.</div>
          )}

          {!error && modules.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Attempts</th>
                    <th>Avg. Score</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((mod) => (
                    <tr key={mod.moduleId}>
                      <td>{mod.title}</td>
                      <td>{mod.attempts}</td>
                      <td>
                        <div className="admin-table-bar-cell">
                          <div className="admin-table-bar-track">
                            <div className="admin-table-bar-fill" style={{ width: `${mod.avgScorePct}%` }} />
                          </div>
                          <span>{mod.avgScorePct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
