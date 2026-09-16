import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { FiCheck, FiX, FiClock, FiBookOpen } from 'react-icons/fi';
import TpoShell from '../../components/TpoShell.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

const TABS = [
  { key: 'pending', label: 'Session Requests' },
  { key: 'approved', label: 'Teacher Student Requests' },
];

function PersonCard({ role, person }) {
  return (
    <div className="tpo-peer-person">
      <span className="tpo-peer-person-role">{role}</span>
      <strong>{person.name || person.email}</strong>
      <span className="tpo-peer-person-meta">{person.degree} · {person.year}</span>
      <span className="tpo-peer-person-email">{person.email}</span>
    </div>
  );
}

export default function TpoSessionRequests() {
  const [tab, setTab] = useState('pending');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState(null);

  const load = useCallback((activeTab) => {
    setError('');
    const endpoint = activeTab === 'approved' ? 'approved' : 'pending';
    axios
      .get(`${API_BASE_URL}/api/tpo/peer-sessions/${endpoint}`)
      .then((res) => {
        if (res.data?.success) setItems(res.data.data);
      })
      .catch((err) => {
        console.error('TPO peer session requests fetch error:', err);
        setError('Could not load session requests.');
      });
  }, []);

  useEffect(() => {
    setItems(null);
    load(tab);
  }, [tab, load]);

  const respond = (id, approve) => {
    setActingId(id);
    axios
      .post(`${API_BASE_URL}/api/tpo/peer-sessions/${id}/respond`, { approve })
      .then((res) => {
        if (res.data?.success) {
          // Approved/rejected requests leave the pending list either way.
          setItems((prev) => (prev || []).filter((it) => it.id !== id));
        }
      })
      .catch((err) => {
        console.error('TPO peer session respond error:', err);
        window.alert(err.response?.data?.message || 'Could not update this request.');
      })
      .finally(() => setActingId(null));
  };

  return (
    <TpoShell title="Session Requests">
      <div className="tpo-page">
        <div className="tpo-toolbar" style={{ gap: 8 }}>
          {TABS.map((t) => (
            <button
              type="button"
              key={t.key}
              className={`tpo-tab-btn ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <div className="tpo-empty-state">{error}</div>}

        {items && items.length === 0 && !error && (
          <div className="tpo-empty-state">
            {tab === 'pending'
              ? 'No peer-to-peer session requests are waiting on your approval right now.'
              : 'No session requests have been approved yet.'}
          </div>
        )}

        {items && items.length > 0 && (
          <div className="tpo-peer-request-list">
            {items.map((req) => (
              <div key={req.id} className="tpo-peer-request-card">
                <div className="tpo-peer-request-topic">
                  <FiBookOpen />
                  <strong>{req.topicTitle}</strong>
                </div>

                <div className="tpo-peer-request-people">
                  <PersonCard role="Teaching" person={req.teacher} />
                  <PersonCard role="Learning" person={req.learner} />
                </div>

                <div className="tpo-peer-request-meta">
                  <span><FiClock /> {req.requestedDate} {req.requestedTimeSlot ? `· ${req.requestedTimeSlot}` : ''}</span>
                  {req.message && <span className="tpo-peer-request-message">"{req.message}"</span>}
                </div>

                {tab === 'pending' ? (
                  <div className="tpo-peer-request-actions">
                    <button
                      type="button"
                      className="tpo-btn-submit tpo-peer-approve-btn"
                      disabled={actingId === req.id}
                      onClick={() => respond(req.id, true)}
                    >
                      <FiCheck /> Approve
                    </button>
                    <button
                      type="button"
                      className="tpo-btn-reset tpo-peer-reject-btn"
                      disabled={actingId === req.id}
                      onClick={() => respond(req.id, false)}
                    >
                      <FiX /> Reject
                    </button>
                  </div>
                ) : (
                  <div className="tpo-peer-request-approved-note">
                    Approved {req.tpoRespondedAt ? new Date(req.tpoRespondedAt).toLocaleString() : ''} · Current status: {req.status}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!items && !error && <div className="tpo-empty-state">Loading session requests…</div>}
      </div>
    </TpoShell>
  );
}