import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiSearch, FiBookOpen, FiCheckCircle, FiClock, FiMoreHorizontal } from 'react-icons/fi';
import TpoShell from '../../components/TpoShell.jsx';
import TpoPagination from '../../components/TpoPagination.jsx';
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

const CATEGORY_LABELS = { onDemand: 'On-Demand', onlineProgram: 'Online', offlineProgram: 'Offline' };
const PAGE_SIZE = 10;

function statusClass(status) {
  if (status === 'Completed') return 'tpo-badge-green';
  if (status === 'In Progress') return 'tpo-badge-blue';
  return 'tpo-badge-red';
}

export default function TpoCourses() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [degree, setDegree] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = { page, size: PAGE_SIZE };
    if (search.trim()) params.search = search.trim();
    if (category) params.category = category;
    if (degree.trim()) params.degree = degree.trim();
    if (status) params.status = status;

    axios
      .get(`${API_BASE_URL}/api/tpo/courses`, { params })
      .then((res) => {
        if (res.data?.success) setData(res.data.data);
      })
      .catch((err) => {
        console.error('TPO courses fetch error:', err);
        setError('Could not load courses.');
      });
  }, [search, category, degree, status, page]);

  const totalPages = data?.totalPages ?? 1;

  return (
    <TpoShell title="Courses">
      <div className="tpo-page">
        {data?.summary && (
          <div className="tpo-stats-row">
            <StatCard icon={FiBookOpen} label="Total Courses" value={data.summary.total} tone="purple" />
            <StatCard icon={FiCheckCircle} label="Completed" value={data.summary.completed} tone="green" />
            <StatCard icon={FiClock} label="In Progress" value={data.summary.inProgress} tone="orange" />
            <StatCard icon={FiMoreHorizontal} label="Not Started" value={data.summary.notStarted} tone="gray" />
          </div>
        )}

        <div className="tpo-toolbar">
          <label className="tpo-search-field">
            <FiSearch />
            <input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
            />
          </label>

          <select
            value={category}
            onChange={(e) => {
              setPage(0);
              setCategory(e.target.value);
            }}
          >
            <option value="">All Categories</option>
            <option value="onDemand">On-Demand</option>
            <option value="onlineProgram">Online</option>
            <option value="offlineProgram">Offline</option>
          </select>

          <input
            className="tpo-dept-input"
            placeholder="Undergraduate Degree"
            value={degree}
            onChange={(e) => {
              setPage(0);
              setDegree(e.target.value);
            }}
          />

          <select
            value={status}
            onChange={(e) => {
              setPage(0);
              setStatus(e.target.value);
            }}
          >
            <option value="">All Status</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Not Started">Not Started</option>
          </select>
        </div>

        {error && <div className="tpo-empty-state">{error}</div>}

        {data && (
          <>
            <div className="tpo-table-wrap">
              <table className="tpo-table">
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>Undergraduate Degree</th>
                    <th>Category</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="tpo-table-empty">No courses match your filters.</td>
                    </tr>
                  ) : (
                    data.items.map((c) => (
                      <tr key={c.courseId}>
                        <td className="tpo-table-title">{c.courseName}</td>
                        <td>{c.degree}</td>
                        <td>{CATEGORY_LABELS[c.category] || c.category}</td>
                        <td>{c.students}</td>
                        <td>
                          <span className={`tpo-badge ${statusClass(c.status)}`}>{c.status}</span>
                        </td>
                        <td>{c.completedStudents.toLocaleString()}/{c.students}</td>
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

        {!data && !error && <div className="tpo-empty-state">Loading courses…</div>}
      </div>
    </TpoShell>
  );
}
