import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FiArrowRight, FiCheck, FiCopy, FiEye, FiPlay, FiUsers } from 'react-icons/fi';
import StudentShell from '../../components/StudentShell.jsx';
import {
  KahootPanel, KahootTimer, Leaderboard, Podium, OPTION_LETTERS, toneClass,
} from '../../components/kahoot/KahootBits.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

const POLL_MS = 1500;

export default function KahootHost({ onSignOut }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef(null);

  const poll = () => {
    axios
      .get(`${API_BASE_URL}/api/kahoot/sessions/${sessionId}/state`)
      .then((res) => {
        if (res.data?.success) {
          setState(res.data.data);
          setError('');
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load this session.'));
  };

  useEffect(() => {
    poll();
    pollRef.current = setInterval(poll, POLL_MS);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const act = (path, failMsg) => {
    setBusy(true);
    axios
      .post(`${API_BASE_URL}/api/kahoot/sessions/${sessionId}/${path}`)
      .then(() => poll())
      .catch((err) => setError(err.response?.data?.message || failMsg))
      .finally(() => setBusy(false));
  };

  const copyPin = () => {
    if (!state?.pin) return;
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(state.pin).then(done).catch(() => {});
    }
  };

  const status = state?.status;
  let subtitle = '';
  if (status === 'LOBBY') subtitle = 'Share the PIN below. Players join from Kahoot Learning in the sidebar.';
  else if (status === 'FINISHED') subtitle = 'The quiz is over. Here is how everyone did.';
  else if (state) subtitle = `Question ${state.currentQuestionIndex + 1} of ${state.totalQuestions}`;

  let body;
  if (!state) {
    body = <div className="kh-empty">{error || 'Loading…'}</div>;
  } else if (status === 'LOBBY') {
    body = (
      <div className="kh-lobby">
        <div className="kh-pin-card">
          <span className="kh-pin-label">Join PIN</span>
          <strong className="kh-pin-value">{state.pin}</strong>
          <button type="button" className="kh-pin-copy" onClick={copyPin}>
            {copied ? <><FiCheck /> Copied</> : <><FiCopy /> Copy PIN</>}
          </button>
        </div>

        <div className="kh-card">
          <div className="kh-card-head">
            <FiUsers /> <strong>{state.playerCount}</strong> {state.playerCount === 1 ? 'player' : 'players'} joined
          </div>
          <div className="kh-chip-row">
            {(state.players || []).map((name, i) => (
              <span key={i} className="kh-player-chip">{name}</span>
            ))}
            {state.playerCount === 0 && (
              <span className="kh-muted">Waiting for players to join with the PIN above…</span>
            )}
          </div>
        </div>

        <div className="kh-action-row">
          <button
            type="button"
            className="kh-btn-primary kh-btn-lg"
            onClick={() => act('start', 'Could not start the quiz.')}
            disabled={busy || state.playerCount === 0}
          >
            <FiPlay /> Start quiz
          </button>
          {state.playerCount === 0 && <span className="kh-muted">At least one player needs to join first.</span>}
        </div>
      </div>
    );
  } else if (status === 'QUESTION') {
    const answeredPct = state.playerCount > 0 ? Math.min(100, (state.answersSoFar / state.playerCount) * 100) : 0;
    body = (
      <div className="kh-live">
        <KahootTimer seconds={state.secondsRemaining} total={state.questionDurationSeconds} />
        <h2 className="kh-question-text">{state.question.text}</h2>
        <div className="kh-tile-grid">
          {state.question.options.map((opt, i) => (
            <div key={i} className={`kh-tile ${toneClass(i)}`}>
              <span className="kh-tile-letter">{OPTION_LETTERS[i]}</span>
              <span className="kh-tile-text">{opt}</span>
            </div>
          ))}
        </div>
        <div className="kh-answered">
          <div className="kh-answered-label">
            <FiUsers /> {state.answersSoFar} of {state.playerCount} answered
          </div>
          <div className="kh-bar-track"><div className="kh-bar-fill" style={{ width: `${answeredPct}%` }} /></div>
        </div>
        <div className="kh-action-row">
          <button type="button" className="kh-btn-ghost" onClick={() => act('next', 'Could not reveal results.')} disabled={busy}>
            <FiEye /> Reveal results now
          </button>
        </div>
      </div>
    );
  } else if (status === 'QUESTION_RESULTS') {
    const counts = state.optionCounts || [];
    const max = Math.max(1, ...counts);
    const isLast = state.currentQuestionIndex + 1 >= state.totalQuestions;
    body = (
      <div className="kh-live">
        <h2 className="kh-question-text">{state.question.text}</h2>
        <div className="kh-result-bars">
          {state.question.options.map((opt, i) => (
            <div key={i} className={`kh-result-row ${toneClass(i)} ${i === state.question.correct ? 'is-correct' : ''}`}>
              <span className="kh-option-letter">{OPTION_LETTERS[i]}</span>
              <span className="kh-result-label">
                {opt}
                {i === state.question.correct && <FiCheck className="kh-result-check" />}
              </span>
              <div className="kh-bar-track"><div className="kh-bar-fill" style={{ width: `${((counts[i] || 0) / max) * 100}%` }} /></div>
              <span className="kh-result-count">{counts[i] || 0}</span>
            </div>
          ))}
        </div>
        <Leaderboard rows={state.leaderboard} title="Top players" />
        <div className="kh-action-row">
          <button type="button" className="kh-btn-primary kh-btn-lg" onClick={() => act('next', 'Could not advance the quiz.')} disabled={busy}>
            {isLast ? 'See final results' : 'Next question'} <FiArrowRight />
          </button>
        </div>
      </div>
    );
  } else {
    const rows = state.leaderboard || [];
    body = (
      <div className="kh-live">
        {rows.length === 0 ? (
          <div className="kh-empty">No one answered any questions.</div>
        ) : (
          <>
            <Podium rows={rows} />
            <Leaderboard rows={rows.slice(3)} offset={3} title={rows.length > 3 ? 'Everyone else' : null} />
          </>
        )}
        <div className="kh-action-row">
          <button type="button" className="kh-btn-ghost" onClick={() => navigate('/kahoot')}>Back to Kahoot Learning</button>
          <button type="button" className="kh-btn-primary" onClick={() => navigate('/kahoot/create')}>Host another quiz</button>
        </div>
      </div>
    );
  }

  return (
    <StudentShell onSignOut={onSignOut}>
      <KahootPanel title={state?.title || 'Live quiz'} subtitle={subtitle} backTo="/kahoot">
        {error && state && <div className="kh-form-error" role="alert">{error}</div>}
        {body}
      </KahootPanel>
    </StudentShell>
  );
}
