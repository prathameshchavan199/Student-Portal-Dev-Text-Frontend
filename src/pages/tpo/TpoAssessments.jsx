import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiSearch, FiClipboard, FiCheckCircle, FiUsers, FiTrendingUp } from 'react-icons/fi';
import TpoShell from '../../components/TpoShell.jsx';
import TpoPagination from '../../components/TpoPagination.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

const PAGE_SIZE = 10;

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

function pctClass(pct) {
  if (pct >= 80) return 'tpo-badge-green';
  if (pct >= 60) return 'tpo-badge-blue';
  return 'tpo-badge-red';
}

export default function TpoAssessments() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = { page, size: PAGE_SIZE };
    if (search.trim()) params.search = search.trim();
    if (type) params.type = type;
    if (department.trim()) params.department = department.trim();

    axios
      .get(`${API_BASE_URL}/api/tpo/assessments`, { params })
      .then((res) => {
        if (res.data?.success) setData(res.data.data);
      })
      .catch((err) => {
        console.error('TPO assessments fetch error:', err);
        setError('Could not load assessments.');
      });
  }, [search, type, department, page]);

  const totalPages = data?.totalPages ?? 1;
  const types = Array.from(new Set((data?.items || []).map((a) => a.type))).filter(Boolean);

  return (
    <TpoShell title="Assessments">
      <div className="tpo-page">
        {data?.summary && (
          <div className="tpo-stats-row">
            <StatCard icon={FiClipboard} label="Total Assessments" value={data.summary.totalAssessments} tone="purple" />
            <StatCard icon={FiCheckCircle} label="Total Attempts" value={data.summary.totalAttempts.toLocaleString()} tone="green" />
            <StatCard icon={FiUsers} label="Students Attempted" value={data.summary.studentsAttempted.toLocaleString()} tone="orange" />
            <StatCard icon={FiTrendingUp} label="Avg Score" value={`${data.summary.averageScorePct}%`} tone="blue" />
          </div>
        )}

        <div className="tpo-toolbar">
          <label className="tpo-search-field">
            <FiSearch />
            <input
              placeholder="Search assessments, skills, or topics..."
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
            />
          </label>

          <select
            value={type}
            onChange={(e) => {
              setPage(0);
              setType(e.target.value);
            }}
          >
            <option value="">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <input
            className="tpo-dept-input"
            placeholder="Department"
            value={department}
            onChange={(e) => {
              setPage(0);
              setDepartment(e.target.value);
            }}
          />
        </div>

        {error && <div className="tpo-empty-state">{error}</div>}

        {data && (
          <>
            <div className="tpo-table-wrap">
              <table className="tpo-table">
                <thead>
                  <tr>
                    <th>Assessment Name</th>
                    <th>Department</th>
                    <th>Students</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="tpo-table-empty">No assessments match your filters.</td>
                    </tr>
                  ) : (
                    data.items.map((a) => (
                      <tr key={a.assessmentId}>
                        <td className="tpo-table-title">{a.name}</td>
                        <td>{a.department}</td>
                        <td>{a.students}</td>
                        <td>
                          <span className={`tpo-badge ${pctClass(a.completedPct)}`}>{a.completedPct}%</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <TpoPagination
              page={page}
              totalPages={totalPages}
              total={data.total}
              shownFrom={data.items.length === 0 ? 0 : data.page * data.size + 1}
              shownTo={Math.min((data.page + 1) * data.size, data.total)}
              onPageChange={setPage}
            />
          </>
        )}

        {!data && !error && <div className="tpo-empty-state">Loading assessments…</div>}
      </div>
    </TpoShell>
  );
}
