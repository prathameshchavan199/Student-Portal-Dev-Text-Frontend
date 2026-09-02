import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiSearch, FiStar, FiCalendar, FiSend, FiLink, FiX, FiUsers } from 'react-icons/fi';
import StudentShell from '../../components/StudentShell.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';
import { peerStyles, StatusBadge, StarRating, PeerPanel } from '../../components/peer/PeerBits.jsx';

const TABS = [
  { id: 'browse', label: 'Browse Topics', icon: FiSearch },
  { id: 'sessions', label: 'My Sessions', icon: FiCalendar },
];

export default function PeerLearn() {
  const [tab, setTab] = useState('browse');
  const [requestingTopic, setRequestingTopic] = useState(null); // topic object or null

  return (
    <StudentShell>
      <style>{peerStyles}</style>
      <PeerPanel  topbarLabel="Peer to Peer" title="Learn" subtitle="Find a topic and request a session with a fellow student." showBack>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`pp-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <t.icon size={13} style={{ marginRight: 6, verticalAlign: -2 }} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'browse' && <BrowseTab onRequest={setRequestingTopic} />}
        {tab === 'sessions' && <SessionsTab />}
      </PeerPanel>

      {requestingTopic && (
        <RequestModal topic={requestingTopic} onClose={() => setRequestingTopic(null)} />
      )}
    </StudentShell>
  );
}

/* ─── Browse tab ─────────────────────────────────────────────── */

function BrowseTab({ onRequest }) {
  const [search, setSearch] = useState('');
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTopics = async (q) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/peer/topics`, { params: q ? { search: q } : {} });
      if (res.data?.success) setTopics(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchTopics(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div>
      {/* <div style={{ position: 'relative', marginBottom: 18 }}>
        <FiSearch size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-subtle)' }} />
        <input
          className="pp-input" style={{ paddingLeft: 34 }}
          placeholder="Search by subject or skill…"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div> */}

      {loading ? (
        <div style={{ color: 'var(--text-subtle)', fontSize: 13 }}>Loading…</div>
      ) : topics.length === 0 ? (
        <div className="pp-card" style={{ textAlign: 'center', color: 'var(--text-subtle)', fontSize: 13.5 }}>
          No topics found. Try a different search.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topics.map((t) => (
            <div key={t.id} className="pp-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>{t.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 3 }}>by {t.teacherName || t.teacherEmail}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--brand-orange)', fontWeight: 700 }}>
                  <FiStar size={13} style={{ fill: 'var(--brand-orange)' }} /> {t.rating || '—'} {t.reviewCount ? `(${t.reviewCount})` : ''}
                </div>
              </div>
              {t.description && <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--text-body)' }}>{t.description}</p>}
              <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12.5, color: 'var(--text-subtle)', flexWrap: 'wrap' }}>
                <span>Level: <b style={{ color: 'var(--text-body)' }}>{t.level || '—'}</b></span>
                <span>Duration: <b style={{ color: 'var(--text-body)' }}>{t.sessionDuration || '—'}</b></span>
                {t.availableDays?.length > 0 && <span>Days: <b style={{ color: 'var(--text-body)' }}>{t.availableDays.join(', ')}</b></span>}
              </div>
              {t.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {t.tags.map((tag) => (
                    <span key={tag} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: 'var(--bg-7)', color: 'var(--brand-blue)' }}>{tag}</span>
                  ))}
                </div>
              )}
              <button type="button" className="pp-btn-primary" style={{ marginTop: 14 }} onClick={() => onRequest(t)}>
                Request Session
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Request-a-session modal ─────────────────────────────────────────────── */

function RequestModal({ topic, onClose }) {
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!date) { setError('Pick a date for the session.'); return; }

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/api/peer/sessions`, {
        topicId: topic.id, requestedDate: date, requestedTimeSlot: timeSlot, message,
      });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
    }}>
      <style>{peerStyles}</style>
      <div style={{
        background: 'var(--card-bg)', borderRadius: 18, padding: 26,
        maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative',
      }}>
        <FiX size={18} style={{ position: 'absolute', top: 18, right: 18, cursor: 'pointer', color: 'var(--text-subtle)' }} onClick={onClose} />

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', color: '#15803d',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <FiSend size={24} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>
              Your session request has been sent to {topic.teacherName || 'the teacher'}.
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 20 }}>
              You'll be notified once the request is accepted.
            </p>
            <button type="button" className="pp-btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>Request a Session</div>
            <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 18 }}>{topic.title}</div>

            {error && <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#ef4444', fontSize: 13 }}>{error}</div>}

            <div style={{ marginBottom: 14 }}>
              <label className="pp-label">Select Date</label>
              <input className="pp-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="pp-label">Preferred Time Slot (optional)</label>
              <input className="pp-input" placeholder="e.g. 04:00 PM - 05:00 PM" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="pp-label">Message (optional)</label>
              <textarea className="pp-textarea" placeholder="Write a message for the teacher…" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="pp-btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="pp-btn-primary" disabled={submitting}>{submitting ? 'Sending…' : 'Send Request'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── My Sessions tab (as learner) ─────────────────────────────────────────────── */

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
  const [reviewingId, setReviewingId] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/peer/sessions/mine`, { params: { role: 'learner' } });
      if (res.data?.success) setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const cancelSession = async (id) => {
    setBusyId(id);
    try {
      await axios.put(`${API_BASE_URL}/api/peer/sessions/${id}/cancel`);
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
                  <div style={{ fontSize: 12.5, color: 'var(--text-subtle)', marginTop: 2 }}>with {s.teacherName || s.teacherEmail}</div>
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

              {(s.status === 'PENDING' || s.status === 'ACCEPTED') && (
                <button type="button" className="pp-btn-danger" style={{ marginTop: 12 }} disabled={busyId === s.id} onClick={() => cancelSession(s.id)}>
                  Cancel Session
                </button>
              )}

              {s.status === 'COMPLETED' && !s.reviewed && (
                reviewingId === s.id
                  ? <ReviewForm sessionId={s.id} onDone={() => { setReviewingId(null); fetchSessions(); }} />
                  : <button type="button" className="pp-btn-primary" style={{ marginTop: 12 }} onClick={() => setReviewingId(s.id)}>Rate &amp; Review</button>
              )}
              {s.status === 'COMPLETED' && s.reviewed && (
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: '#15803d' }}>Thanks — you've already reviewed this session.</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewForm({ sessionId, onDone }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      await axios.post(`${API_BASE_URL}/api/peer/sessions/${sessionId}/review`, { rating, reviewText: text });
      onDone();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
      {error && <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 8, background: '#fef2f2', color: '#ef4444', fontSize: 12.5 }}>{error}</div>}
      <label className="pp-label">Rate the Session</label>
      <div style={{ marginBottom: 10 }}><StarRating value={rating} onChange={setRating} size={20} /></div>
      <textarea className="pp-textarea" placeholder="Very clear explanation and good examples. Helped a lot!" value={text} onChange={(e) => setText(e.target.value)} />
      <button type="button" className="pp-btn-primary" style={{ marginTop: 10 }} disabled={submitting} onClick={submit}>
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </div>
  );
}