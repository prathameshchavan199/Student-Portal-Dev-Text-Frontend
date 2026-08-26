import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiUsers, FiAward, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import TpoShell from '../../components/TpoShell.jsx';
import DonutChart from '../../components/DonutChart.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="tpo-stat-card">
      <div className={`tpo-stat-icon tone-${tone}`}>
        <Icon />
      </div>
      <div className="tpo-stat-label">{label}</div>
      <div className="tpo-stat-value">{value}</div>
    </div>
  );
}

export default function TpoDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/tpo/dashboard`)
      .then((res) => {
        if (res.data?.success) setData(res.data.data);
      })
      .catch((err) => {
        console.error('TPO dashboard fetch error:', err);
        setError('Could not load dashboard data.');
      });
  }, []);

  return (
    <TpoShell title="Dashboard">
      <div className="tpo-page">
        {error && <div className="tpo-empty-state">{error}</div>}

        {data && (
          <>
            <div className="tpo-stats-row">
              <StatCard icon={FiUsers} label="Student Enrollment" value={data.totalStudents.toLocaleString()} tone="purple" />
              <StatCard
                icon={FiTrendingUp}
                label="Avg Assessment Score"
                value={`${data.assessmentStatus.averageScorePct}%`}
                tone="blue"
              />
              <StatCard
                icon={FiCheckCircle}
                label="Course Completion Rate"
                value={`${data.courseStatus.total ? Math.round((data.courseStatus.completed / data.courseStatus.total) * 1000) / 10 : 0}%`}
                tone="green"
              />
              <StatCard
                icon={FiAward}
                label="Fully Qualified Students"
                value={`${data.studentQualification.totalStudents ? Math.round((data.studentQualification.fullyQualified / data.studentQualification.totalStudents) * 1000) / 10 : 0}%`}
                tone="orange"
              />
            </div>

            <div className="tpo-panel">
              <div className="tpo-panel-header-title">Courses Status</div>
              <div className="tpo-donut-wrap">
                <DonutChart
                  size={200}
                  strokeWidth={26}
                  centerLabel={data.courseStatus.total.toLocaleString()}
                  centerSub="Courses"
                  segments={[
                    { value: data.courseStatus.completed, color: '#22c55e' },
                    { value: data.courseStatus.inProgress, color: '#f97316' },
                    { value: data.courseStatus.notStarted, color: '#4c6fff' },
                  ]}
                />
                <div className="tpo-legend-list">
                  {[
                    { label: 'Completed', value: data.courseStatus.completed, color: '#22c55e' },
                    { label: 'In Progress', value: data.courseStatus.inProgress, color: '#f97316' },
                    { label: 'Not Started', value: data.courseStatus.notStarted, color: '#4c6fff' },
                  ].map((row) => (
                    <div key={row.label} className="tpo-legend-row">
                      <span className="tpo-legend-dot" style={{ background: row.color }} />
                      <span className="tpo-legend-label">{row.label}</span>
                      <span className="tpo-legend-value">{row.value.toLocaleString()}</span>
                      <span className="tpo-legend-pct">
                        ({data.courseStatus.total ? Math.round((row.value / data.courseStatus.total) * 100) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="tpo-panel">
              <div className="tpo-panel-header-title">Dept. Readiness Index</div>
              {data.departmentReadiness.length === 0 ? (
                <div className="tpo-empty-state">No assessment attempts yet — this fills in once students start taking assessments.</div>
              ) : (
                <div className="tpo-readiness-list">
                  {data.departmentReadiness.map((d) => (
                    <div key={d.department} className="tpo-readiness-row">
                      <div className="tpo-readiness-label">
                        <span>{d.department}</span>
                        <strong>{d.averageScorePct}%</strong>
                      </div>
                      <div className="tpo-readiness-track">
                        <div
                          className={`tpo-readiness-fill ${d.averageScorePct < 72 ? 'tone-warn' : ''}`}
                          style={{ width: `${Math.min(100, d.averageScorePct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="tpo-panel">
              <div className="tpo-panel-header-title">Assessment / Student</div>
              <div className="tpo-qual-list">
                {[
                  { label: 'Fully Qualified', value: data.studentQualification.fullyQualified },
                  { label: 'In Evaluation', value: data.studentQualification.inEvaluation },
                  { label: 'Remediation Assigned', value: data.studentQualification.remediationAssigned },
                ].map((row) => (
                  <div key={row.label} className="tpo-qual-row">
                    <span>{row.label}</span>
                    <strong>
                      {row.value.toLocaleString()}
                      <em>
                        ({data.studentQualification.totalStudents
                          ? Math.round((row.value / data.studentQualification.totalStudents) * 100)
                          : 0}%)
                      </em>
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="tpo-panel">
              <div className="tpo-panel-header-title">Assessment Status by Category</div>
              {data.assessmentPillars.length === 0 ? (
                <div className="tpo-empty-state">No assessment attempts yet — this fills in once students start taking assessments.</div>
              ) : (
                <div className="tpo-pillar-list">
                  {data.assessmentPillars.map((p) => (
                    <div key={p.name} className="tpo-pillar-row">
                      <div className="tpo-pillar-label">
                        <span>{p.name}</span>
                        <strong>{p.pct}%</strong>
                      </div>
                      <div className="tpo-readiness-track">
                        <div
                          className={`tpo-readiness-fill ${p.pct < 72 ? 'tone-warn' : ''}`}
                          style={{ width: `${Math.min(100, p.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!data && !error && <div className="tpo-empty-state">Loading dashboard…</div>}
      </div>
    </TpoShell>
  );
}
