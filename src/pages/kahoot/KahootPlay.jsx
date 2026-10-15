import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FiCheck, FiX, FiClock, FiUsers } from 'react-icons/fi';
import StudentShell from '../../components/StudentShell.jsx';
import {
  KahootPanel, KahootTimer, Leaderboard, Podium, OPTION_LETTERS, toneClass,
} from '../../components/kahoot/KahootBits.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

const POLL_MS = 1500;

export default function KahootPlay({ onSignOut }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [playerId] = useState(() => sessionStorage.getItem(`kahoot-player-${sessionId}`));
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const lastQuestionIndexRef = useRef(-1);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!playerId) navigate(`/kahoot/join/${sessionId}`, { replace: true });
  }, [playerId, sessionId, navigate]);

  const poll = () => {
    axios
      .get(`${API_BASE_URL}/api/kahoot/sessions/${sessionId}/state`, { params: { playerId } })
      .then((res) => {
        if (!res.data?.success) return;
        const data = res.data.data;
        setError('');
        // A fresh question arrived: clear the previous question's submit lock.
        if (data.currentQuestionIndex !== lastQuestionIndexRef.current) {
          lastQuestionIndexRef.current = data.currentQuestionIndex;
          setSubmitting(false);
        }
        setState(data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load this quiz.'));
  };

  useEffect(() => {
    if (!playerId) return undefined;
    poll();
    pollRef.current = setInterval(poll, POLL_MS);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, playerId]);

  const handleAnswer = (optionIndex) => {
    if (submitting || state?.youAnswered) return;
    setSubmitting(true);
    axios
      .post(`${API_BASE_URL}/api/kahoot/sessions/${sessionId}/answer`, {
        playerId: Number(playerId),
        selectedOption: optionIndex,
      })
      .then(() => poll())
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not submit your answer.');
        setSubmitting(false);
      });
  };

  if (!playerId) return null;

  const status = state?.status;
  const you = state?.you;
  let subtitle = '';
  if (status === 'LOBBY') subtitle = 'You’re in. Hang tight until the host starts.';
  else if (status === 'FINISHED') subtitle = 'The quiz is over.';
  else if (state) subtitle = `Question ${state.currentQuestionIndex + 1} of ${state.totalQuestions}`;

  let body;
  if (!state) {
    body = <div className="kh-empty">{error || 'Loading…'}</div>;
  } else if (status === 'LOBBY') {
    body = (
      <div className="kh-live">
        <div className="kh-waiting">
          <div className="kh-spinner" />
          <strong>Waiting for the host to start</strong>
          <span>Get ready, the first question is coming up.</span>
        </div>
        <div className="kh-card">
          <div className="kh-card-head">
            <FiUsers /> <strong>{state.playerCount}</strong> {state.playerCount === 1 ? 'player' : 'players'} in the lobby
          </div>
          <div className="kh-chip-row">
            {(state.players || []).map((name, i) => (
              <span key={i} className={`kh-player-chip ${you && name === you.nickname ? 'is-you' : ''}`}>
                {name}{you && name === you.nickname ? ' (you)' : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  } else if (status === 'QUESTION' && !state.youAnswered) {
    body = (
      <div className="kh-live">
        <KahootTimer seconds={state.secondsRemaining} total={state.questionDurationSeconds} />
        <h2 className="kh-question-text">{state.question.text}</h2>
        <div className="kh-tile-grid kh-tile-grid-tap">
          {state.question.options.map((opt, i) => (
            <button
              type="button"
              key={i}
              className={`kh-tile ${toneClass(i)}`}
              onClick={() => handleAnswer(i)}
              disabled={submitting}
            >
              <span className="kh-tile-letter">{OPTION_LETTERS[i]}</span>
              <span className="kh-tile-text">{opt}</span>
            </button>
          ))}
        </div>
      </div>
    );
  } else if (status === 'QUESTION') {
    const pct = state.playerCount > 0 ? Math.min(100, (state.answersSoFar / state.playerCount) * 100) : 0;
    body = (
      <div className="kh-live">
        <div className="kh-waiting">
          <span className="kh-waiting-icon ok"><FiCheck size={26} /></span>
          <strong>Answer locked in</strong>
          <span>Waiting for the other players…</span>
        </div>
        <div className="kh-answered">
          <div className="kh-answered-label"><FiClock /> {state.secondsRemaining}s left · {state.answersSoFar} of {state.playerCount} answered</div>
          <div className="kh-bar-track"><div className="kh-bar-fill" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>
    );
  } else if (status === 'QUESTION_RESULTS') {
    const r = state.yourResult;
    body = (
      <div className="kh-live">
        <div className={`kh-result-banner ${r ? (r.correct ? 'correct' : 'wrong') : 'wrong'}`}>
          {r && r.correct ? <FiCheck size={34} /> : <FiX size={34} />}
          <strong>{r ? (r.correct ? 'Correct!' : 'Not quite') : 'No answer submitted'}</strong>
          {r && <span>+{r.pointsAwarded.toLocaleString()} points</span>}
        </div>
        {you && (
          <div className="kh-you-card">
            <span>Your position</span>
            <strong>#{you.rank}</strong>
            <span>{you.score.toLocaleString()} pts</span>
          </div>
        )}
        <Leaderboard rows={state.leaderboard} youRank={you?.rank} title="Top players" />
        <div className="kh-muted kh-center">Waiting for the host to continue…</div>
      </div>
    );
  } else {
    const rows = state.leaderboard || [];
    body = (
      <div className="kh-live">
        {you && (
          <div className="kh-you-card kh-you-final">
            <span>You finished</span>
            <strong>#{you.rank}</strong>
            <span>{you.score.toLocaleString()} pts</span>
          </div>
        )}
        <Podium rows={rows} youRank={you?.rank} />
        <Leaderboard rows={rows.slice(3)} offset={3} youRank={you?.rank} title={rows.length > 3 ? 'Everyone else' : null} />
        <div className="kh-action-row">
          <button type="button" className="kh-btn-primary" onClick={() => navigate('/kahoot')}>Back to Kahoot Learning</button>
        </div>
      </div>
    );
  }

  return (
    <StudentShell onSignOut={onSignOut}>
      <KahootPanel title={state?.title || 'Live quiz'} subtitle={subtitle}>
        {error && state && <div className="kh-form-error" role="alert">{error}</div>}
        {body}
      </KahootPanel>
    </StudentShell>
  );
}
