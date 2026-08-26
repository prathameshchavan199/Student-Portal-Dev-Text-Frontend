import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiSearch } from 'react-icons/fi';
import TpoShell from '../../components/TpoShell.jsx';
import TpoPagination from '../../components/TpoPagination.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

const PAGE_SIZE = 10;
const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduated'];

function statusClass(status) {
  if (status === 'Completed') return 'tpo-badge-green';
  if (status === 'Active') return 'tpo-badge-blue';
  return 'tpo-badge-gray';
}

export default function TpoStudents() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = { page, size: PAGE_SIZE };
    if (search.trim()) params.search = search.trim();
    if (department.trim()) params.department = department.trim();
    if (year) params.year = year;
    if (status) params.status = status;

    axios
      .get(`${API_BASE_URL}/api/tpo/students`, { params })
      .then((res) => {
        if (res.data?.success) setData(res.data.data);
      })
      .catch((err) => {
        console.error('TPO students fetch error:', err);
        setError('Could not load students.');
      });
  }, [search, department, year, status, page]);

  const totalPages = data?.totalPages ?? 1;

  return (
    <TpoShell title="Students">
      <div className="tpo-page">
        <div className="tpo-toolbar">
          <label className="tpo-search-field">
            <FiSearch />
            <input
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
            />
          </label>

          <input
            className="tpo-dept-input"
            placeholder="Department"
            value={department}
            onChange={(e) => {
              setPage(0);
              setDepartment(e.target.value);
            }}
          />

          <select
            value={year}
            onChange={(e) => {
              setPage(0);
              setYear(e.target.value);
            }}
          >
            <option value="">All Years</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setPage(0);
              setStatus(e.target.value);
            }}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
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
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th>Avg Score</th>
                    <th>Assessments</th>
                    <th>Courses</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="tpo-table-empty">No students match your filters.</td>
                    </tr>
                  ) : (
                    data.items.map((s) => (
                      <tr key={s.studentId}>
                        <td>{s.studentId}</td>
                        <td className="tpo-table-title">{s.name}</td>
                        <td>{s.department}</td>
                        <td>{s.year}</td>
                        <td>
                          <span className={`tpo-badge ${statusClass(s.status)}`}>{s.status}</span>
                        </td>
                        <td>{s.readinessPct}%</td>
                        <td>{s.assessmentsCompleted} / {s.assessmentsTotal}</td>
                        <td>{s.coursesCompleted} / {s.coursesTotal}</td>
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

        {!data && !error && <div className="tpo-empty-state">Loading students…</div>}
      </div>
    </TpoShell>
  );
}
