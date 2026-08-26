import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FiActivity, FiAward, FiBookOpen, FiCheckCircle, FiTrendingUp, FiUsers,
} from 'react-icons/fi';
import AdminShell from '../../components/AdminShell.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

const STATUS_COLORS = {
  Registered: '#94a3b8',
  'In Progress': '#f59e0b',
  Completed: '#22c55e',
  Certified: '#4C6FFF',
};

const BAR_COLORS = ['#FF6B00', '#4C6FFF', '#7b5cff', '#22c55e', '#f59e0b', '#0ea5e9'];

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="glass-card admin-stat-card">
      <div className="admin-stat-icon" style={{ background: accent }}>
        <Icon />
      </div>
      <div>
        <div className="admin-stat-label">{label}</div>
        <div className="admin-stat-value">{value}</div>
        {sub && <div className="admin-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function Donut({ segments, total }) {
  const size = 150;
  const stroke = 20;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offsetAccumulator = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-color)" strokeWidth={stroke} />
      {segments.filter(s => s.count > 0).map((seg) => {
        const fraction = total === 0 ? 0 : seg.count / total;
        const dash = fraction * circumference;
        const circle = (
          <circle
            key={seg.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={STATUS_COLORS[seg.label] || '#94a3b8'}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offsetAccumulator}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        offsetAccumulator += dash;
        return circle;
      })}
      <text x="50%" y="46%" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--text-heading)">
        {total}
      </text>
      <text x="50%" y="62%" textAnchor="middle" fontSize="11" fill="var(--text-subtle)">
        ENROLLMENTS
      </text>
    </svg>
  );
}

function TrendChart({ points }) {
  const width = 460;
  const height = 180;
  const padding = 28;
  const values = points.map(p => p.cumulativeEnrollments);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padding + (i * (width - padding * 2)) / (points.length - 1 || 1);
    const y = height - padding - ((p.cumulativeEnrollments - min) / range) * (height - padding * 2);
    return { x, y, ...p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? padding} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4C6FFF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4C6FFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#trendFill)" />
      <path d={linePath} fill="none" stroke="#4C6FFF" strokeWidth="2.5" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={i === coords.length - 1 ? 5 : 3.5} fill="#4C6FFF" />
          <text x={c.x} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--text-subtle)">{c.label}</text>
          {i === coords.length - 1 && (
            <text x={c.x} y={c.y - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--text-heading)">
              {c.cumulativeEnrollments}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function CourseCompletionBars({ courses }) {
  if (courses.length === 0) {
    return <div className="admin-empty">No course enrollments recorded yet.</div>;
  }
  return (
    <div className="admin-bar-list">
      {courses.map((course, i) => (
        <div className="admin-bar-row" key={course.courseId}>
          <div className="admin-bar-row-head">
            <span className="admin-bar-title">{course.title}</span>
            <span className="admin-bar-value">{course.completionPct}%</span>
          </div>
          <div className="admin-bar-track">
            <div
              className="admin-bar-fill"
              style={{ width: `${course.completionPct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
            />
          </div>
          <div className="admin-bar-sub">{course.enrolled} enrolled</div>
        </div>
      ))}
    </div>
  );
}

function AssessmentPerformanceBars({ modules }) {
  if (modules.length === 0) {
    return <div className="admin-empty">No assessment attempts recorded yet.</div>;
  }
  return (
    <div className="admin-bar-list">
      {modules.map((mod, i) => (
        <div className="admin-bar-row" key={mod.moduleId}>
          <div className="admin-bar-row-head">
            <span className="admin-bar-title">{mod.title}</span>
            <span className="admin-bar-value">{mod.avgScorePct}%</span>
          </div>
          <div className="admin-bar-track">
            <div
              className="admin-bar-fill"
              style={{ width: `${mod.avgScorePct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
            />
          </div>
          <div className="admin-bar-sub">{mod.attempts} attempts</div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    axios.get(`${API_BASE_URL}/api/admin/dashboard`)
      .then((res) => { if (!cancelled) setDashboard(res.data?.data ?? null); })
      .catch(() => { if (!cancelled) setError('Could not load dashboard data.'); });
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <AdminShell title="Dashboard" subtitle="Institutional overview">
        <div className="admin-page"><div className="glass-card admin-empty">{error}</div></div>
      </AdminShell>
    );
  }

  if (!dashboard) {
    return (
      <AdminShell title="Dashboard" subtitle="Institutional overview">
        <div className="admin-page"><div className="glass-card admin-empty">Loading dashboard...</div></div>
      </AdminShell>
    );
  }

  const { summary, enrollmentStatus, enrollmentTrend, topCourses, assessmentPerformance, activity } = dashboard;

  return (
    <AdminShell title="Dashboard" subtitle="Institutional overview, updated live from your student data">
      <div className="admin-page">
        <div className="admin-stat-grid">
          <StatCard icon={FiUsers} label="Total Students" value={summary.totalStudents} accent="var(--grad-btn)" />
          <StatCard icon={FiBookOpen} label="Total Courses" value={summary.totalCourses} accent="linear-gradient(135deg,#4C6FFF,#7b5cff)" />
          <StatCard icon={FiCheckCircle} label="Course Completion Rate" value={`${summary.courseCompletionRatePct}%`}
            sub={`${summary.totalEnrollments} total enrollments`} accent="linear-gradient(135deg,#22c55e,#16a34a)" />
          <StatCard icon={FiAward} label="Avg. Assessment Score" value={`${summary.avgAssessmentScorePct}%`}
            sub={`${summary.totalAssessmentAttempts} attempts`} accent="linear-gradient(135deg,#f59e0b,#ef6c2a)" />
        </div>

        <div className="admin-grid-3">
          <div className="admin-col">
            <div className="glass-card">
              <div className="admin-card-title"><FiCheckCircle /> Enrollment Status</div>
              <div className="admin-donut-wrap">
                <Donut segments={enrollmentStatus.segments} total={enrollmentStatus.total} />
                <div className="admin-donut-legend">
                  {enrollmentStatus.segments.map((seg) => (
                    <div className="admin-legend-row" key={seg.label}>
                      <span className="admin-legend-dot" style={{ background: STATUS_COLORS[seg.label] }} />
                      <span className="admin-legend-label">{seg.label}</span>
                      <span className="admin-legend-value">{seg.count} ({seg.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card">
              <div className="admin-card-title"><FiActivity /> Learner Activity</div>
              <div className="admin-metric-row">
                <span>Active Learners</span>
                <span className="admin-metric-pill">{activity.activeLearners}</span>
              </div>
              <div className="admin-metric-row">
                <span>Certificates Issued</span>
                <span className="admin-metric-pill admin-metric-pill-green">{activity.certificatesIssued}</span>
              </div>
              <div className="admin-metric-row">
                <span>Assessment Attempts (7d)</span>
                <span className="admin-metric-pill admin-metric-pill-amber">{activity.assessmentAttemptsLast7Days}</span>
              </div>
            </div>
          </div>

          <div className="admin-col admin-col-wide">
            <div className="glass-card">
              <div className="admin-card-title"><FiTrendingUp /> Enrollment Trend (Last 6 Months)</div>
              <TrendChart points={enrollmentTrend} />
            </div>

            <div className="glass-card">
              <div className="admin-card-title"><FiBookOpen /> Course Completion by Course</div>
              <CourseCompletionBars courses={topCourses} />
            </div>
          </div>

          <div className="admin-col">
            <div className="glass-card">
              <div className="admin-card-title"><FiAward /> Assessment Performance by Module</div>
              <AssessmentPerformanceBars modules={assessmentPerformance} />
            </div>

            <div className="admin-banner-card">
              <div className="admin-banner-eyebrow">THIS WEEK</div>
              <div className="admin-banner-value">{activity.assessmentAttemptsLast7Days} Attempts</div>
              <div className="admin-banner-sub">{activity.activeLearners} active learners &middot; {activity.certificatesIssued} certified</div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
