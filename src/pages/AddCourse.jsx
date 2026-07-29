import { useCallback, useEffect, useState } from 'react';
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiBook,
  FiCheck,
  FiEdit2,
  FiImage,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiUser,
  FiX,
} from 'react-icons/fi';
import axios from 'axios';
import StudentShell from '../components/StudentShell.jsx';
import { API_BASE_URL } from '../api/axiosSetup.js';

/* ─── constants ─────────────────────────────────────────────── */

const CATEGORIES = [
  { value: 'onlineProgram',  label: 'Online Program' },
  { value: 'onDemand',       label: 'On-Demand' },
  { value: 'offlineProgram', label: 'Offline Program' },
];
const LEVELS      = ['Beginner', 'Intermediate', 'Advanced'];
const FORMATS     = ['Self Paced', 'Live Online', 'In Person'];
const ACCENTS     = ['blue', 'orange', 'purple', 'green'];
const COURSE_AREAS = ['Development','Business','Marketing','Design','Data Science','AI/ML','Cloud','Security','DevOps'];
const TOPICS      = ['Frontend','Fullstack','Backend','Cloud','Security','Data','AI/ML','DevOps','Design'];

const CATEGORY_LABELS = { onlineProgram: 'Online', onDemand: 'On-Demand', offlineProgram: 'Offline' };
const CATEGORY_COLORS = {
  onlineProgram:  { bg: '#eff6ff', color: '#1d4ed8' },
  onDemand:       { bg: '#fff7ed', color: '#c2410c' },
  offlineProgram: { bg: '#f0fdf4', color: '#15803d' },
};

const emptyForm = {
  id: '', title: '', category: 'onlineProgram', price: '', duration: '',
  level: 'Beginner', imageUrl: '', instructor: '', description: '',
  courseArea: 'Development', topic: 'Frontend', format: 'Live Online',
  date: '', time: '', platform: '', location: '', startsIn: '', seatsLeft: '', accent: 'blue',
};

const emptySession = { id: '', title: '', date: '', time: '' };

/* ─── main component ─────────────────────────────────────────── */

export default function AddCourse() {
  // 'list' | 'add' | 'edit'
  const [view, setView]               = useState('list');
  const [courses, setCourses]         = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError]     = useState('');

  // form state
  const [form, setForm]         = useState(emptyForm);
  const [sessions, setSessions] = useState([]);
  const [editId, setEditId]     = useState(null);   // ID being edited

  // operation state
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null); // course obj
  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState('');

  /* fetch course list */
  const fetchCourses = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/courses`);
      setCourses(res.data.data.courses);
    } catch {
      setListError('Failed to load courses. Please refresh.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  /* ── helpers ── */
  const openAdd = () => {
    setForm(emptyForm);
    setSessions([]);
    setEditId(null);
    setFormError('');
    setFormSuccess('');
    setView('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (course) => {
    setForm({
      id:          course.id,
      title:       course.title,
      category:    course.category,
      price:       String(course.price ?? ''),
      duration:    course.duration    ?? '',
      level:       course.level       ?? 'Beginner',
      imageUrl:    course.imageUrl    ?? '',
      instructor:  course.instructor  ?? '',
      description: course.description ?? '',
      courseArea:  course.courseArea  ?? 'Development',
      topic:       course.topic       ?? 'Frontend',
      format:      course.format      ?? 'Live Online',
      date:        course.date        ?? '',
      time:        course.time        ?? '',
      platform:    course.platform    ?? '',
      location:    course.location    ?? '',
      startsIn:    course.startsIn    ?? '',
      seatsLeft:   course.seatsLeft != null ? String(course.seatsLeft) : '',
      accent:      course.accent      ?? 'blue',
    });
    setSessions(Array.isArray(course.sessions) ? course.sessions.map(s => ({ ...s })) : []);
    setEditId(course.id);
    setFormError('');
    setFormSuccess('');
    setView('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToList = () => {
    setView('list');
    setDeleteTarget(null);
    setDeleteError('');
  };

  const setField = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setFormError('');
    setFormSuccess('');
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setForm((p) => ({
      ...p,
      title,
      ...(view === 'add' ? {
        id: title.toLowerCase().trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-'),
      } : {}),
    }));
    setFormError('');
    setFormSuccess('');
  };

  const addSession    = () => setSessions((s) => [...s, { ...emptySession }]);
  const removeSession = (i) => setSessions((s) => s.filter((_, idx) => idx !== i));
  const updateSession = (i, field) => (e) =>
    setSessions((s) => s.map((sess, idx) => idx === i ? { ...sess, [field]: e.target.value } : sess));

  /* ── submit (add / edit) ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!form.id.trim())                            { setFormError('ID is required.');             return; }
    if (!form.title.trim())                         { setFormError('Title is required.');           return; }
    if (!form.price || isNaN(Number(form.price)))   { setFormError('A valid price is required.');   return; }

    const payload = {
      ...form,
      price:    Number(form.price),
      seatsLeft: form.seatsLeft !== '' ? Number(form.seatsLeft) : null,
      sessions: sessions.filter((s) => s.id.trim() && s.title.trim()),
    };

    setSubmitting(true);
    try {
      if (view === 'add') {
        await axios.post(`${API_BASE_URL}/api/courses`, payload);
        setFormSuccess('Course created successfully!');
        setForm(emptyForm);
        setSessions([]);
      } else {
        await axios.put(`${API_BASE_URL}/api/courses/${editId}`, payload);
        setFormSuccess('Course updated successfully!');
      }
      await fetchCourses();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await axios.delete(`${API_BASE_URL}/api/courses/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchCourses();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  /* ─── render ─────────────────────────────────────────────── */
  return (
    <StudentShell showCourseSearch={false}>
      <main style={{ padding: '24px 20px', maxWidth: 860, margin: '0 auto' }}>

        {view === 'list'
          ? <ListView
              courses={courses}
              loading={loadingList}
              error={listError}
              onAdd={openAdd}
              onEdit={openEdit}
              onDelete={(c) => { setDeleteTarget(c); setDeleteError(''); }}
            />
          : <FormView
              view={view}
              form={form}
              sessions={sessions}
              submitting={submitting}
              formError={formError}
              formSuccess={formSuccess}
              onBack={backToList}
              onSubmit={handleSubmit}
              setField={setField}
              handleTitleChange={handleTitleChange}
              addSession={addSession}
              removeSession={removeSession}
              updateSession={updateSession}
            />
        }

        {/* ── Delete confirmation modal ── */}
        {deleteTarget && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
          }}>
            <div style={{
              background: 'var(--card-bg)', borderRadius: 18, padding: '28px 28px 24px',
              maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <span style={{
                  width: 44, height: 44, borderRadius: 12, background: '#fef2f2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#ef4444', flexShrink: 0,
                }}>
                  <FiAlertTriangle size={20} />
                </span>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>
                    Delete Course
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-subtle)', lineHeight: 1.5 }}>
                    Are you sure you want to delete <strong style={{ color: 'var(--text-body)' }}>"{deleteTarget.title}"</strong>?
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              {deleteError && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10,
                  padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#991b1b',
                }}>
                  {deleteError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => { setDeleteTarget(null); setDeleteError(''); }}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: '11px 0', background: 'var(--bg-7)',
                    border: '1px solid var(--border-color)', borderRadius: 10,
                    cursor: 'pointer', fontWeight: 600, fontSize: 14, color: 'var(--text-body)',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: '11px 0', background: deleting ? '#fca5a5' : '#ef4444',
                    border: 'none', borderRadius: 10, cursor: deleting ? 'not-allowed' : 'pointer',
                    fontWeight: 700, fontSize: 14, color: '#fff',
                  }}
                >
                  {deleting ? 'Deleting…' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          .ac-input {
            width: 100%;
            padding: 10px 14px;
            background: var(--input-bg);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            font-size: 14px;
            color: var(--text-body);
            outline: none;
            font-family: inherit;
            transition: border-color 0.15s;
          }
          .ac-input:focus { border-color: var(--brand-blue); background: #fff; }
          .ac-input::placeholder { color: var(--text-subtle); }
          .ac-input:read-only { opacity: 0.6; cursor: not-allowed; background: var(--bg-7); }
          .course-row-action {
            display: flex; align-items: center; gap: 6px;
            padding: 7px 14px; border-radius: 8px; cursor: pointer;
            font-size: 13px; font-weight: 600; border: 1px solid;
            transition: opacity 0.15s;
          }
          .course-row-action:hover { opacity: 0.8; }
        `}</style>
      </main>
    </StudentShell>
  );
}

/* ─── List View ──────────────────────────────────────────────── */

function ListView({ courses, loading, error, onAdd, onEdit, onDelete }) {
  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-heading)' }}>
            Course Management
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-subtle)' }}>
            {loading ? 'Loading…' : `${courses.length} course${courses.length !== 1 ? 's' : ''} in catalogue`}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 18px', background: 'var(--grad-btn)',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            fontWeight: 700, fontSize: 14, color: '#fff',
          }}
        >
          <FiPlus size={15} /> Add Course
        </button>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12,
          padding: '14px 18px', marginBottom: 18, color: '#991b1b', fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-subtle)' }}>
          Loading courses…
        </div>
      ) : courses.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--card-bg)', borderRadius: 16, border: '1px solid var(--border-color)',
        }}>
          <FiBook size={36} style={{ color: 'var(--text-subtle)', marginBottom: 12 }} />
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-heading)' }}>No courses yet</p>
          <p style={{ margin: '6px 0 18px', fontSize: 13, color: 'var(--text-subtle)' }}>
            Click "Add Course" to create your first one.
          </p>
          <button
            type="button" onClick={onAdd}
            style={{
              padding: '10px 20px', background: 'var(--grad-btn)',
              border: 'none', borderRadius: 10, cursor: 'pointer',
              fontWeight: 700, fontSize: 14, color: '#fff',
            }}
          >
            <FiPlus size={14} style={{ marginRight: 6 }} /> Add Course
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 40 }}>
          {courses.map((course) => (
            <CourseRow key={course.id} course={course} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </>
  );
}

function CourseRow({ course, onEdit, onDelete }) {
  const cat  = CATEGORY_COLORS[course.category] ?? { bg: '#f3f4f6', color: '#374151' };
  const accentVar = course.accent === 'blue' ? 'var(--brand-blue)'
                  : course.accent === 'orange' ? 'var(--brand-orange)'
                  : `var(--${course.accent})`;

  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border-color)',
      borderRadius: 14, padding: '16px 18px',
      borderLeft: `4px solid ${accentVar}`,
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-heading)' }}>
            {course.title}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            background: cat.bg, color: cat.color,
          }}>
            {CATEGORY_LABELS[course.category] ?? course.category}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-subtle)', flexWrap: 'wrap' }}>
          <span>ID: <code style={{ fontFamily: 'monospace', color: 'var(--text-body)' }}>{course.id}</code></span>
          {course.level    && <span>{course.level}</span>}
          {course.duration && <span>{course.duration}</span>}
          {course.instructor && <span>by {course.instructor}</span>}
        </div>
      </div>

      {/* Price */}
      <div style={{ textAlign: 'right', minWidth: 70 }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-heading)' }}>
          ₹{(course.price ?? 0).toLocaleString()}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className="course-row-action"
          onClick={() => onEdit(course)}
          style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}
        >
          <FiEdit2 size={13} /> Edit
        </button>
        <button
          type="button"
          className="course-row-action"
          onClick={() => onDelete(course)}
          style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#ef4444' }}
        >
          <FiTrash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );
}

/* ─── Form View (Add / Edit) ─────────────────────────────────── */

function FormView({
  view, form, sessions, submitting, formError, formSuccess,
  onBack, onSubmit, setField, handleTitleChange,
  addSession, removeSession, updateSession,
}) {
  const isEdit = view === 'edit';

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          type="button" onClick={onBack}
          style={{
            background: 'var(--card-bg)', border: '1px solid var(--border-color)',
            borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', color: 'var(--text-body)',
          }}
        >
          <FiArrowLeft />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-heading)' }}>
            {isEdit ? 'Edit Course' : 'Add New Course'}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-subtle)' }}>
            {isEdit
              ? `Editing: ${form.title || form.id}`
              : 'Fill in the details below to add a course to the catalogue.'}
          </p>
        </div>
      </div>

      {formSuccess && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12,
          padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center',
          gap: 10, color: '#166534', fontSize: 14, fontWeight: 500,
        }}>
          <FiCheck size={18} /> {formSuccess}
        </div>
      )}

      {formError && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12,
          padding: '14px 18px', marginBottom: 20, color: '#991b1b', fontSize: 14,
        }}>
          {formError}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate>

        {/* ── Core Details ── */}
        <Section icon={<FiBook />} title="Core Details">
          <Row>
            <Field label="Course Title *">
              <input
                className="ac-input"
                placeholder="e.g. Cloud Computing Masterclass"
                value={form.title}
                onChange={handleTitleChange}
                required
              />
            </Field>
            <Field label={isEdit ? 'Course ID (read-only)' : 'Course ID (slug) *'}>
              <input
                className="ac-input"
                placeholder="auto-generated from title"
                value={form.id}
                onChange={isEdit ? undefined : setField('id')}
                readOnly={isEdit}
                required={!isEdit}
              />
            </Field>
          </Row>

          <Row>
            <Field label="Category *">
              <select className="ac-input" value={form.category} onChange={setField('category')}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Level *">
              <select className="ac-input" value={form.level} onChange={setField('level')}>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
          </Row>

          <Row>
            <Field label="Price (₹) *">
              <input
                className="ac-input" type="number" min="0"
                placeholder="e.g. 1299"
                value={form.price} onChange={setField('price')} required
              />
            </Field>
            <Field label="Duration">
              <input
                className="ac-input"
                placeholder="e.g. 12 Weeks / 6 Hours"
                value={form.duration} onChange={setField('duration')}
              />
            </Field>
          </Row>

          <Field label="Description">
            <textarea
              className="ac-input" rows={3}
              placeholder="What will students learn in this course?"
              value={form.description} onChange={setField('description')}
              style={{ resize: 'vertical' }}
            />
          </Field>
        </Section>

        {/* ── Instructor & Media ── */}
        <Section icon={<FiUser />} title="Instructor & Media">
          <Row>
            <Field label="Instructor Name">
              <input
                className="ac-input"
                placeholder="e.g. Alex Rivera"
                value={form.instructor} onChange={setField('instructor')}
              />
            </Field>
            <Field label="Accent Colour">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select className="ac-input" value={form.accent} onChange={setField('accent')}>
                  {ACCENTS.map((a) => (
                    <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
                  ))}
                </select>
                <span style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: form.accent === 'blue' ? 'var(--brand-blue)'
                    : form.accent === 'orange' ? 'var(--brand-orange)'
                    : `var(--${form.accent})`,
                }} />
              </div>
            </Field>
          </Row>
          <Field label="Image URL">
            <div style={{ position: 'relative' }}>
              <FiImage style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-subtle)',
              }} />
              <input
                className="ac-input" style={{ paddingLeft: 36 }}
                placeholder="https://cdn.example.com/course-image.jpg"
                value={form.imageUrl} onChange={setField('imageUrl')}
              />
            </div>
          </Field>
        </Section>

        {/* ── Schedule & Format ── */}
        <Section icon={<FiMapPin />} title="Schedule & Format">
          <Row>
            <Field label="Format">
              <select className="ac-input" value={form.format} onChange={setField('format')}>
                {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Platform">
              <input
                className="ac-input"
                placeholder="e.g. Zoom Platform / Learning Portal"
                value={form.platform} onChange={setField('platform')}
              />
            </Field>
          </Row>
          <Row>
            <Field label="Date">
              <input
                className="ac-input"
                placeholder="e.g. June 15 - June 17 / Available Now"
                value={form.date} onChange={setField('date')}
              />
            </Field>
            <Field label="Time">
              <input
                className="ac-input"
                placeholder="e.g. 10:00 AM - 01:00 PM / Anytime"
                value={form.time} onChange={setField('time')}
              />
            </Field>
          </Row>
          <Row>
            <Field label="Starts In">
              <input
                className="ac-input"
                placeholder="e.g. Starts in 2 days / Instant access"
                value={form.startsIn} onChange={setField('startsIn')}
              />
            </Field>
            <Field label="Seats Left">
              <input
                className="ac-input" type="number" min="0"
                placeholder="Leave blank for on-demand"
                value={form.seatsLeft} onChange={setField('seatsLeft')}
              />
            </Field>
          </Row>
          {form.category === 'offlineProgram' && (
            <Field label="Location">
              <input
                className="ac-input"
                placeholder="e.g. Bengaluru"
                value={form.location} onChange={setField('location')}
              />
            </Field>
          )}
        </Section>

        {/* ── Categorisation ── */}
        <Section icon={<FiBook />} title="Categorisation">
          <Row>
            <Field label="Course Area">
              <select className="ac-input" value={form.courseArea} onChange={setField('courseArea')}>
                {COURSE_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Topic">
              <select className="ac-input" value={form.topic} onChange={setField('topic')}>
                {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </Row>
        </Section>

        {/* ── Sessions ── */}
        <Section icon={<FiBook />} title="Sessions (optional)">
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-subtle)' }}>
            Add named sessions for online/offline programs. Leave empty for on-demand courses.
          </p>

          {sessions.map((session, index) => (
            <div key={index} style={{
              background: 'var(--bg-7)', borderRadius: 12,
              padding: '14px 16px', marginBottom: 12,
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>
                  Session {index + 1}
                </span>
                <button
                  type="button" onClick={() => removeSession(index)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, display: 'flex', alignItems: 'center' }}
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
              <Row>
                <Field label="Session ID">
                  <input className="ac-input" placeholder="e.g. summer-intake" value={session.id} onChange={updateSession(index, 'id')} />
                </Field>
                <Field label="Title">
                  <input className="ac-input" placeholder="e.g. Session 1: Summer Intake" value={session.title} onChange={updateSession(index, 'title')} />
                </Field>
              </Row>
              <Row>
                <Field label="Date">
                  <input className="ac-input" placeholder="e.g. June 15 - June 17, 2025" value={session.date} onChange={updateSession(index, 'date')} />
                </Field>
                <Field label="Time">
                  <input className="ac-input" placeholder="e.g. 09:00 - 17:00 IST" value={session.time} onChange={updateSession(index, 'time')} />
                </Field>
              </Row>
            </div>
          ))}

          <button
            type="button" onClick={addSession}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              background: 'var(--bg-7)', border: '1px dashed var(--brand-blue)',
              borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: 'var(--brand-blue)',
            }}
          >
            <FiPlus size={14} /> Add Session
          </button>
        </Section>

        {/* ── Submit buttons ── */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingBottom: 40 }}>
          <button
            type="button" onClick={onBack}
            style={{
              flex: 1, padding: '13px 0', background: 'var(--card-bg)',
              border: '1px solid var(--border-color)', borderRadius: 12,
              cursor: 'pointer', fontWeight: 600, fontSize: 14, color: 'var(--text-body)',
            }}
          >
            Cancel
          </button>
          <button
            type="submit" disabled={submitting}
            style={{
              flex: 2, padding: '13px 0',
              background: submitting ? 'var(--text-subtle)' : 'var(--grad-btn)',
              border: 'none', borderRadius: 12,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: 15, color: '#fff',
            }}
          >
            {submitting
              ? (isEdit ? 'Saving…' : 'Creating…')
              : (isEdit ? 'Save Changes' : 'Create Course')}
          </button>
        </div>
      </form>
    </>
  );
}

/* ─── shared sub-components ─────────────────────────────────── */

function Section({ icon, title, children }) {
  return (
    <div style={{
      background: 'var(--card-bg)', border: '1px solid var(--border-color)',
      borderRadius: 16, padding: '20px 22px', marginBottom: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 8, background: 'var(--bg-7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-blue)',
        }}>
          {icon}
        </span>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Row({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)',
        marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}
