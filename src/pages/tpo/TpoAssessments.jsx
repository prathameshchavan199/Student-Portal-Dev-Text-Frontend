import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiSearch, FiClipboard, FiCheckCircle, FiUsers, FiTrendingUp } from 'react-icons/fi';
import TpoShell from '../../components/TpoShell.jsx';
import TpoPagination from '../../components/TpoPagination.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

const PAGE_SIZE = 10;

function pctClass(pct) {
  if (pct >= 80) return 'tpo-badge-green';
  if (pct >= 60) return 'tpo-badge-blue';
  return 'tpo-badge-red';
}

export default function TpoAssessments() {
  const [search, setSearch] = useState('');
  const [degree, setDegree] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = { page, size: PAGE_SIZE };
    if (search.trim()) params.search = search.trim();
    if (degree.trim()) params.degree = degree.trim();

    axios
      .get(`${API_BASE_URL}/api/tpo/assessments`, { params })
      .then((res) => {
        if (res.data?.success) setData(res.data.data);
      })
      .catch((err) => {
        console.error('TPO assessments fetch error:', err);
        setError('Could not load assessments.');
      });
  }, [search, degree, page]);

  const totalPages = data?.totalPages ?? 1;

  return (
    <TpoShell title="Assessments">
      <div className="tpo-page">
        <div className="tpo-section-header">
          <div className="tpo-section-header-icon"><FiClipboard /></div>
          <div>
            <h2>Assessments</h2>
            <p>Track assessment participation and completion across your college</p>
          </div>
        </div>

        {data?.summary && (
          <div className="tpo-stats-row tpo-stats-row-tinted">
            <div className="tpo-stat-tile tone-purple static">
              <span className="tpo-stat-tile-icon"><FiClipboard /></span>
              <span className="tpo-stat-tile-text">
                <strong>{data.summary.totalAssessments}</strong>
                <em>Total Assessments</em>
              </span>
            </div>

            <div className="tpo-stat-tile tone-green static">
              <span className="tpo-stat-tile-icon"><FiCheckCircle /></span>
              <span className="tpo-stat-tile-text">
                <strong>{data.summary.totalAttempts.toLocaleString()}</strong>
                <em>Total Attempts</em>
              </span>
            </div>

            <div className="tpo-stat-tile tone-orange static">
              <span className="tpo-stat-tile-icon"><FiUsers /></span>
              <span className="tpo-stat-tile-text">
                <strong>{data.summary.studentsAttempted.toLocaleString()}</strong>
                <em>Students Attempted</em>
              </span>
            </div>

            <div className="tpo-stat-tile tone-blue static">
              <span className="tpo-stat-tile-icon"><FiTrendingUp /></span>
              <span className="tpo-stat-tile-text">
                <strong>{data.summary.averageScorePct}%</strong>
                <em>Avg Score</em>
              </span>
            </div>
          </div>
        )}

        <div className="tpo-toolbar">
          <label className="tpo-search-field">
            <FiSearch />
            <input
              placeholder="Search assessments..."
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
            />
          </label>

          <input
            className="tpo-dept-input"
            placeholder="Undergraduate Degree"
            value={degree}
            onChange={(e) => {
              setPage(0);
              setDegree(e.target.value);
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
                    <th>Undergraduate Degree</th>
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
                        <td>{a.degree}</td>
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