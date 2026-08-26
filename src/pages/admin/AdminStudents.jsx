import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FiSearch } from 'react-icons/fi';
import AdminShell from '../../components/AdminShell.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

export default function AdminStudents() {
  const [students, setStudents] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    axios.get(`${API_BASE_URL}/api/admin/students`)
      .then((res) => { if (!cancelled) setStudents(res.data?.data ?? []); })
      .catch(() => { if (!cancelled) setError('Could not load students.'); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      (s.fullName || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q));
  }, [students, query]);

  return (
    <AdminShell title="Students" subtitle="Everyone registered on the portal">
      <div className="admin-page">
        <div className="glass-card">
          <div className="admin-table-toolbar">
            <label className="admin-search-field">
              <FiSearch />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email..."
              />
            </label>
            {students && <span className="admin-table-count">{filtered.length} of {students.length} students</span>}
          </div>

          {error && <div className="admin-empty">{error}</div>}
          {!error && !students && <div className="admin-empty">Loading students...</div>}
          {!error && students && filtered.length === 0 && (
            <div className="admin-empty">No students match your search.</div>
          )}

          {!error && students && filtered.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Registration</th>
                    <th>Provider</th>
                    <th>Enrolled</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.email}>
                      <td>{s.fullName || '—'}</td>
                      <td>{s.email}</td>
                      <td>
                        <span className={`admin-status-chip ${s.registrationComplete ? 'admin-status-chip-green' : 'admin-status-chip-gray'}`}>
                          {s.registrationComplete ? 'Complete' : 'Incomplete'}
                        </span>
                      </td>
                      <td>{s.provider || '—'}</td>
                      <td>{s.enrolledCourses}</td>
                      <td>{s.completedCourses}</td>
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
