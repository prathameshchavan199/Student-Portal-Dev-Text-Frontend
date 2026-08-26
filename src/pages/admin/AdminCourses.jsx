import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiPlusCircle } from 'react-icons/fi';
import AdminShell from '../../components/AdminShell.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

export default function AdminCourses() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    axios.get(`${API_BASE_URL}/api/courses`)
      .then((res) => {
        if (cancelled) return;
        const catalog = res.data?.data?.courses ?? res.data?.courses ?? [];
        setCourses(catalog);
      })
      .catch(() => { if (!cancelled) setError('Could not load courses.'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminShell title="Courses" subtitle="Everything in your catalogue">
      <div className="admin-page">
        <div className="glass-card">
          <div className="admin-table-toolbar">
            <span className="admin-table-count">{courses ? `${courses.length} courses` : ''}</span>
            <button type="button" className="admin-primary-btn" onClick={() => navigate('/admin/courses/new')}>
              <FiPlusCircle /> Add Course
            </button>
          </div>

          {error && <div className="admin-empty">{error}</div>}
          {!error && !courses && <div className="admin-empty">Loading courses...</div>}
          {!error && courses && courses.length === 0 && <div className="admin-empty">No courses yet — add your first one.</div>}

          {!error && courses && courses.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Level</th>
                    <th>Price</th>
                    <th>Instructor</th>
                    <th>Seats Left</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id}>
                      <td>{c.title}</td>
                      <td>{c.category}</td>
                      <td>{c.level || '—'}</td>
                      <td>{c.price != null ? `₹${c.price}` : '—'}</td>
                      <td>{c.instructor || '—'}</td>
                      <td>{c.seatsLeft ?? '—'}</td>
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
