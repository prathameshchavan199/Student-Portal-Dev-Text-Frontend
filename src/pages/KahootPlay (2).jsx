import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FiUser } from 'react-icons/fi';
import StudentShell from '../../components/StudentShell.jsx';
import { KahootPanel } from '../../components/kahoot/KahootBits.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

export default function KahootJoin({ onSignOut }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState(null);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    // The state endpoint works before joining too; it just carries no
    // player-specific fields. Used here only to show the quiz title.
    axios
      .get(`${API_BASE_URL}/api/kahoot/sessions/${sessionId}/state`)
      .then((res) => {
        if (res.data?.success) setTitle(res.data.data.title);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not find this quiz.'));
  }, [sessionId]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Pick a nickname so the host knows who you are.');
      return;
    }
    setError('');
    setJoining(true);
    axios
      .post(`${API_BASE_URL}/api/kahoot/sessions/${sessionId}/join`, { nickname: nickname.trim() })
      .then((res) => {
        if (res.data?.success) {
          sessionStorage.setItem(`kahoot-player-${sessionId}`, String(res.data.data.playerId));
          navigate(`/kahoot/play/${sessionId}`);
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not join this quiz.'))
      .finally(() => setJoining(false));
  };

  return (
    <StudentShell onSignOut={onSignOut}>
      <KahootPanel
        title={title ? `Join “${title}”` : 'Join the quiz'}
        subtitle="Pick a nickname. The host and other players will see it on the leaderboard."
        backTo="/kahoot"
      >
        <form className="kh-card kh-join-card" onSubmit={handleJoin}>
          <span className="kh-icon-chip"><FiUser size={20} /></span>
          <label className="kh-label" htmlFor="kh-nick">Your nickname</label>
          <input
            id="kh-nick"
            className="kh-input kh-nickname-input"
            placeholder="e.g. QuizWhiz"
            maxLength={24}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoFocus
          />
          {error && <div className="kh-form-error" role="alert">{error}</div>}
          <button type="submit" className="kh-btn-primary kh-btn-lg" disabled={joining}>
            {joining ? 'Joining…' : 'Let’s go'}
          </button>
        </form>
      </KahootPanel>
    </StudentShell>
  );
}
