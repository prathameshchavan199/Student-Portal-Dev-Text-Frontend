import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPlay, FiPlus, FiUsers, FiHelpCircle, FiChevronRight, FiHash } from 'react-icons/fi';
import StudentShell from '../../components/StudentShell.jsx';
import { KahootPanel } from '../../components/kahoot/KahootBits.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

function statusPill(status) {
  if (status === 'LOBBY') return { text: 'Waiting to start', tone: 'amber' };
  if (status === 'QUESTION' || status === 'QUESTION_RESULTS') return { text: 'Live now', tone: 'green' };
  return { text: 'Finished', tone: 'gray' };
}

export default function KahootHome({ onSignOut }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/kahoot/sessions/mine`)
      .then((res) => {
        if (res.data?.success) setSessions(res.data.data);
      })
      .catch(() => setSessions([]));
  }, []);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const pin = pinInput.trim();
    if (!/^\d{6}$/.test(pin)) {
      setJoinError('Enter the 6-digit PIN shown on the host’s screen.');
      return;
    }
    setJoinError('');
    setJoining(true);
    axios
      .get(`${API_BASE_URL}/api/kahoot/sessions/pin/${pin}`)
      .then((res) => {
        if (res.data?.success) navigate(`/kahoot/join/${res.data.data.sessionId}`);
      })
      .catch((err) => setJoinError(err.response?.data?.message || 'Couldn’t find that session.'))
      .finally(() => setJoining(false));
  };

  return (
    <StudentShell onSignOut={onSignOut}>
      <KahootPanel
        title="Learn by playing."
        subtitle="Host a live quiz for your class, or jump into one with a PIN."
      >
        <div className="kh-card-row">
          <form className="kh-card kh-card-join" onSubmit={handleJoinSubmit}>
            <span className="kh-icon-chip"><FiPlay size={22} /></span>
            <div className="kh-card-title">Join a quiz</div>
            <div className="kh-card-blurb">Enter the 6-digit PIN shown on the host’s screen.</div>
            <div className="kh-join-row">
              <input
                className="kh-input kh-pin-input"
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                aria-label="Quiz PIN"
              />
              <button type="submit" className="kh-btn-primary" disabled={joining}>
                {joining ? 'Checking…' : 'Join'}
              </button>
            </div>
            {joinError && <div className="kh-form-error">{joinError}</div>}
          </form>

          <button type="button" className="kh-card kh-card-action" onClick={() => navigate('/kahoot/create')}>
            <span className="kh-icon-chip orange"><FiPlus size={22} /></span>
            <div className="kh-card-title">Host a quiz</div>
            <div className="kh-card-blurb">Build a question set and get a PIN your class can join.</div>
            <span className="kh-card-cta">Create a quiz <FiChevronRight size={14} /></span>
          </button>
        </div>

        <div className="kh-section-title">Your hosted quizzes</div>

        {sessions === null && <div className="kh-empty">Loading…</div>}
        {sessions?.length === 0 && (
          <div className="kh-empty">
            <FiHelpCircle size={22} />
            <strong>No quizzes yet</strong>
            <span>Create your first quiz and it will show up here.</span>
          </div>
        )}
        {sessions?.length > 0 && (
          <div className="kh-session-list">
            {sessions.map((s) => {
              const pill = statusPill(s.status);
              return (
                <button
                  type="button"
                  key={s.sessionId}
                  className="kh-session-row"
                  onClick={() => navigate(`/kahoot/host/${s.sessionId}`)}
                >
                  <span className="kh-icon-chip"><FiHelpCircle /></span>
                  <div className="kh-session-main">
                    <strong>{s.title}</strong>
                    <span className="kh-session-meta">
                      <span><FiHelpCircle /> {s.questionCount} questions</span>
                      <span><FiUsers /> {s.playerCount} joined</span>
                      <span><FiHash /> {s.pin}</span>
                    </span>
                  </div>
                  <span className={`kh-pill ${pill.tone}`}>{pill.text}</span>
                  <FiChevronRight className="kh-session-chevron" />
                </button>
              );
            })}
          </div>
        )}
      </KahootPanel>
    </StudentShell>
  );
}
