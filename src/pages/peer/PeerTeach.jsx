import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  FiUser, FiBook, FiInbox, FiCalendar, FiPlus, FiCheck, FiX, FiLink, FiStar,
} from 'react-icons/fi';
import StudentShell from '../../components/StudentShell.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';
import { peerStyles, TagInput, SuggestTagInput, StatusBadge, PeerPanel } from '../../components/peer/PeerBits.jsx';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Dummy data — swap for a real subjects/skills catalog when one exists.
const SUBJECT_OPTIONS = [
  'Python', 'Java', 'C++', 'JavaScript', 'Data Structures', 'Algorithms',
  'DBMS', 'Operating Systems', 'Computer Networks', 'Web Development',
  'Machine Learning', 'Data Science', 'SQL', 'React', 'Node.js',
  'Cloud Computing', 'Cyber Security', 'Aptitude', 'System Design',
];
const SKILL_OPTIONS = [
  'Python Basics', 'OOPs in Python', 'Web Development', 'REST APIs',
  'React Basics', 'Git & GitHub', 'Problem Solving', 'Data Visualization',
  'Machine Learning Basics', 'SQL Queries', 'System Design Basics',
  'Communication Skills', 'Resume Building', 'Interview Preparation',
];
const EXPERIENCE_OPTIONS = [
  'Less than 6 Months', '6 Months - 1 Year', '1+ Years', '2+ Years', '3+ Years', '5+ Years',
];
const AVAILABILITY_OPTIONS = [
  'Mon - Fri, 9:00 AM - 12:00 PM',
  'Mon - Fri, 4:00 PM - 8:00 PM',
  'Weekends Only, 10:00 AM - 6:00 PM',
  'Flexible / Anytime',
];

const TABS = [
  { id: 'profile',  label: 'My Profile',  icon: FiUser },
  { id: 'topics',   label: 'My Topics',   icon: FiBook },
  { id: 'requests', label: 'Requests',    icon: FiInbox },
  { id: 'sessions', label: 'My Sessions', icon: FiCalendar },
];

export default function PeerTeach() {
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/peer/profile/me`);
      if (res.data?.success) setProfile(res.data.data);
    } finally {
      setProfileLoaded(true);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  return (
    <StudentShell>
      <style>{peerStyles}</style>
      <PeerPanel  topbarLabel="Peer to Peer" title="Teach" subtitle="Share what you know with other students." showBack>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`pp-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <t.icon size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <ProfileTab profile={profile} profileLoaded={profileLoaded} onSaved={setProfile} />
        )}
        {tab === 'topics' && (
          <TopicsTab hasProfile={Boolean(profile)} />
        )}
        {tab === 'requests' && <RequestsTab />}
        {tab === 'sessions' && <SessionsTab />}
      </PeerPanel>
    </StudentShell>
  );
}

/* ─── Profile tab ─────────────────────────────────────────────── */

const emptyProfileForm = {
  displayName: '', bio: '', subjects: [], skills: [], availability: '', experience: '', proficiencyLevel: 'Advanced',
};

function ProfileTab({ profile, profileLoaded, onSaved }) {
  const [form, setForm] = useState(emptyProfileForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        subjects: profile.subjects || [],
        skills: profile.skills || [],
        availability: profile.availability || '',
        experience: profile.experience || '',
        proficiencyLevel: profile.proficiencyLevel || 'Advanced',
      });
    }
  }, [profile]);

  const setField = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.displayName.trim()) { setError('Display name is required.'); return; }

    setSaving(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/peer/profile`, form);
      if (res.data?.success) {
        onSaved(res.data.data);
        setSuccess(profile ? 'Profile updated!' : 'Teaching profile created!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!profileLoaded) return <div style={{ color: 'var(--text-subtle)', fontSize: 13 }}>Loading…</div>;

  return (
    <form onSubmit={handleSubmit} className="pp-card">
      {!profile && (
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-subtle)' }}>
          Let students know what you can teach — this is required before you can publish a topic.
        </p>
      )}
      {error && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#ef4444', fontSize: 13 }}>{error}</div>}
      {success && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', color: '#15803d', fontSize: 13 }}>{success}</div>}

      <div style={{ marginBottom: 14 }}>
        <label className="pp-label">Display Name</label>
        <input className="pp-input" value={form.displayName} onChange={setField('displayName')} placeholder="e.g. Rahul Kumar" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="pp-label">Short Bio</label>
        <textarea className="pp-textarea" value={form.bio} onChange={setField('bio')} placeholder="Passionate about teaching and sharing knowledge." />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="pp-label">Subjects You Can Teach</label>
        <SuggestTagInput values={form.subjects} onChange={(v) => setForm((p) => ({ ...p, subjects: v }))} options={SUBJECT_OPTIONS} placeholder="Start typing a subject…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="pp-label">Skills / Topics</label>
        <SuggestTagInput values={form.skills} onChange={(v) => setForm((p) => ({ ...p, skills: v }))} options={SKILL_OPTIONS} placeholder="Start typing a skill…" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <label className="pp-label">Experience</label>
          <select className="pp-select" value={form.experience} onChange={setField('experience')}>
            <option value="">Select experience</option>
            {EXPERIENCE_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="pp-label">Proficiency Level</label>
          <select className="pp-select" value={form.proficiencyLevel} onChange={setField('proficiencyLevel')}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            <option value="Expert">Expert</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label className="pp-label">Availability</label>
        <select className="pp-select" value={form.availability} onChange={setField('availability')}>
          <option value="">Select availability</option>
          {AVAILABILITY_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <button type="submit" className="pp-btn-primary" disabled={saving}>
        {saving ? 'Saving…' : (profile ? 'Save Changes' : 'Create Profile')}
      </button>
    </form>
  );
}

/* ─── Topics tab ─────────────────────────────────────────────── */

const emptyTopicForm = {
  title: '', description: '', level: 'Beginner', tags: [], availableDays: [], timeSlotStart: '', timeSlotEnd: '', sessionDuration: '1 Hour',
};

function TopicsTab({ hasProfile }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyTopicForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/peer/topics/mine`);
      if (res.data?.success) setTopics(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTopics(); }, []);

  const toggleDay = (day) => {
    setForm((p) => ({
      ...p,
      availableDays: p.availableDays.includes(day) ? p.availableDays.filter((d) => d !== day) : [...p.availableDays, day],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Topic title is required.'); return; }

    setSaving(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/peer/topics`, form);
      if (res.data?.success) {
        setTopics((t) => [res.data.data, ...t]);
        setForm(emptyTopicForm);
        setShowForm(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!hasProfile) {
    return (
      <div className="pp-card" style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13.5 }}>
        Create your teaching profile first, then come back here to publish a topic.
      </div>
    );
  }

  return (
    <div>
      {!showForm && (
        <button type="button" className="pp-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }} onClick={() => setShowForm(true)}>
          <FiPlus size={14} /> Create Topic
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="pp-card" style={{ marginBottom: 20 }}>
          {error && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#ef4444', fontSize: 13 }}>{error}</div>}
          <div style={{ marginBottom: 14 }}>
            <label className="pp-label">Topic Title</label>
            <input className="pp-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Python Basics for Beginners" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="pp-label">Description</label>
            <textarea className="pp-textarea" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Learn Python from scratch with hands-on examples and practice questions." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="pp-label">Level</label>
              <select className="pp-select" value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="pp-label">Session Duration</label>
              <input className="pp-input" value={form.sessionDuration} onChange={(e) => setForm((p) => ({ ...p, sessionDuration: e.target.value }))} placeholder="e.g. 1 Hour" />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="pp-label">Tags</label>
            <TagInput values={form.tags} onChange={(v) => setForm((p) => ({ ...p, tags: v }))} placeholder="e.g. Python, Beginner, Programming" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="pp-label">Available Days</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DAYS.map((d) => (
                <button
                  type="button" key={d} onClick={() => toggleDay(d)}
                  style={{
                    padding: '7px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: form.availableDays.includes(d) ? 'var(--brand-blue)' : 'var(--card-bg)',
                    color: form.availableDays.includes(d) ? '#fff' : 'var(--text-body)',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div>
              <label className="pp-label">Time Slot Start</label>
              <input className="pp-input" type="time" value={form.timeSlotStart} onChange={(e) => setForm((p) => ({ ...p, timeSlotStart: e.target.value }))} />
            </div>
            <div>
              <label className="pp-label">Time Slot End</label>
              <input className="pp-input" type="time" value={form.timeSlotEnd} onChange={(e) => setForm((p) => ({ ...p, timeSlotEnd: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="pp-btn-ghost" onClick={() => { setShowForm(false); setError(''); }}>Cancel</button>
            <button type="submit" className="pp-btn-primary" disabled={saving}>{saving ? 'Publishing…' : 'Publish Topic'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-subtle)', fontSize: 13 }}>Loading…</div>
      ) : topics.length === 0 ? (
        <div className="pp-card" style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13.5 }}>
          You haven't published any topics yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topics.map((t) => (
            <div key={t.id} className="pp-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>{t.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 4 }}>{t.level} • {t.sessionDuration}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--brand-orange)', fontWeight: 700 }}>
                  <FiStar size={13} style={{ fill: 'var(--brand-orange)' }} /> {t.rating || '—'} {t.reviewCount ? `(${t.reviewCount})` : ''}
                </div>
              </div>
              {t.description && <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text-body)' }}>{t.description}</p>}
              {t.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {t.tags.map((tag) => (
                    <span key={tag} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: 'var(--bg-7)', color: 'var(--brand-blue)' }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Requests tab ─────────────────────────────────────────────── */

function RequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState({});   // id -> meeting link draft
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/peer/sessions/requests`);
      if (res.data?.success) setRequests(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const respond = async (id, accept) => {
    setBusyId(id); setError('');
    try {
      await axios.put(`${API_BASE_URL}/api/peer/sessions/${id}/respond`, {
        accept, meetingLink: accept ? (links[id] || '') : undefined,
      });
      setRequests((r) => r.filter((req) => req.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div style={{ color: 'var(--text-subtle)', fontSize: 13 }}>Loading…</div>;
  if (requests.length === 0) return <div className="pp-card" style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13.5 }}>No pending requests right now.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#ef4444', fontSize: 13 }}>{error}</div>}
      {requests.map((r) => (
        <div key={r.id} className="pp-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>{r.learnerName || r.learnerEmail}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 2 }}>{r.topicTitle}</div>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', textAlign: 'right' }}>
              {r.requestedDate}{r.requestedTimeSlot ? `, ${r.requestedTimeSlot}` : ''}
            </div>
          </div>
          {r.message && <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text-body)', fontStyle: 'italic' }}>"{r.message}"</p>}

          <div style={{ marginTop: 12 }}>
            <label className="pp-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><FiLink size={12} /> Meeting link (optional, sent to the student if you accept)</label>
            <input
              className="pp-input" placeholder="Paste a Google Meet / Zoom link"
              value={links[r.id] || ''} onChange={(e) => setLinks((l) => ({ ...l, [r.id]: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button type="button" className="pp-btn-danger" disabled={busyId === r.id} onClick={() => respond(r.id, false)}>
              <FiX size={12} style={{ verticalAlign: -1, marginRight: 4 }} /> Reject
            </button>
            <button type="button" className="pp-btn-accept" disabled={busyId === r.id} onClick={() => respond(r.id, true)}>
              <FiCheck size={12} style={{ verticalAlign: -1, marginRight: 4 }} /> Accept
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Sessions tab (as teacher) ─────────────────────────────────────────────── */

const SESSION_BUCKETS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

function SessionsTab() {
  const [data, setData] = useState({ upcoming: [], completed: [], cancelled: [] });
  const [loading, setLoading] = useState(true);
  const [bucket, setBucket] = useState('upcoming');
  const [busyId, setBusyId] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/peer/sessions/mine`, { params: { role: 'teacher' } });
      if (res.data?.success) setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const markComplete = async (id) => {
    setBusyId(id);
    try {
      await axios.put(`${API_BASE_URL}/api/peer/sessions/${id}/complete`);
      fetchSessions();
    } finally {
      setBusyId(null);
    }
  };

  const list = data[bucket] || [];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {SESSION_BUCKETS.map((b) => (
          <button key={b.id} type="button" className={`pp-tab ${bucket === b.id ? 'active' : ''}`} onClick={() => setBucket(b.id)}>
            {b.label} ({(data[b.id] || []).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-subtle)', fontSize: 13 }}>Loading…</div>
      ) : list.length === 0 ? (
        <div className="pp-card" style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13.5 }}>Nothing here yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((s) => (
            <div key={s.id} className="pp-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>{s.topicTitle}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 2 }}>with {s.learnerName || s.learnerEmail}</div>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 8 }}>
                {s.requestedDate}{s.requestedTimeSlot ? `, ${s.requestedTimeSlot}` : ''}
              </div>
              {s.meetingLink && (
                <div style={{ fontSize: 12.5, marginTop: 6 }}>
                  <FiLink size={12} style={{ verticalAlign: -1, marginRight: 4 }} />
                  <a href={s.meetingLink} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-blue)' }}>{s.meetingLink}</a>
                </div>
              )}
              {s.status === 'ACCEPTED' && (
                <button type="button" className="pp-btn-primary" style={{ marginTop: 12 }} disabled={busyId === s.id} onClick={() => markComplete(s.id)}>
                  {busyId === s.id ? 'Saving…' : 'Mark as Complete'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
