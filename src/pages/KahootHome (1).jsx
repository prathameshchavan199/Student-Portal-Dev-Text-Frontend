import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiTrash2, FiCheck, FiClock, FiHelpCircle } from 'react-icons/fi';
import StudentShell from '../../components/StudentShell.jsx';
import { KahootPanel, OPTION_LETTERS, toneClass } from '../../components/kahoot/KahootBits.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

const DURATIONS = [10, 20, 30, 45, 60];

function emptyQuestion() {
  return { text: '', options: ['', ''], correct: 0 };
}

export default function KahootCreate({ onSignOut }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(20);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateQuestion = (qi, patch) =>
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...patch } : q)));

  const updateOption = (qi, oi, value) =>
    setQuestions((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) } : q)),
    );

  const addOption = (qi) =>
    setQuestions((prev) =>
      prev.map((q, i) => (i === qi && q.options.length < 6 ? { ...q, options: [...q.options, ''] } : q)),
    );

  const removeOption = (qi, oi) =>
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi || q.options.length <= 2) return q;
        const options = q.options.filter((_, j) => j !== oi);
        const correct = q.correct === oi ? 0 : q.correct > oi ? q.correct - 1 : q.correct;
        return { ...q, options, correct };
      }),
    );

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (qi) =>
    setQuestions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== qi) : prev));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Give your quiz a title.');
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`Question ${i + 1} needs some text.`);
        return;
      }
      if (q.options.some((o) => !o.trim())) {
        setError(`Question ${i + 1} has an empty answer option.`);
        return;
      }
    }

    setSubmitting(true);
    axios
      .post(`${API_BASE_URL}/api/kahoot/sessions`, {
        title: title.trim(),
        questionDurationSeconds: duration,
        questions: questions.map((q) => ({
          text: q.text.trim(),
          options: q.options.map((o) => o.trim()),
          correct: q.correct,
        })),
      })
      .then((res) => {
        if (res.data?.success) navigate(`/kahoot/host/${res.data.data.sessionId}`);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not create the quiz.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <StudentShell onSignOut={onSignOut}>
      <KahootPanel
        title="Create a quiz"
        subtitle="Add your questions, mark the right answer, and share the PIN with your class."
        backTo="/kahoot"
      >
        <form onSubmit={handleSubmit} className="kh-create-form">
          <div className="kh-card">
            <label className="kh-label" htmlFor="kh-title">Quiz title</label>
            <input
              id="kh-title"
              className="kh-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Module 1 Review"
              maxLength={80}
            />

            <div className="kh-label kh-label-spaced"><FiClock /> Time per question</div>
            <div className="kh-chip-row" role="radiogroup" aria-label="Time per question">
              {DURATIONS.map((d) => (
                <button
                  type="button"
                  key={d}
                  role="radio"
                  aria-checked={duration === d}
                  className={`kh-chip ${duration === d ? 'active' : ''}`}
                  onClick={() => setDuration(d)}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {questions.map((q, qi) => (
            <div className="kh-card kh-question-card" key={qi}>
              <div className="kh-question-head">
                <span className="kh-question-number">{qi + 1}</span>
                <strong>Question {qi + 1}</strong>
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="kh-icon-btn"
                    onClick={() => removeQuestion(qi)}
                    aria-label={`Remove question ${qi + 1}`}
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>

              <textarea
                className="kh-input kh-textarea"
                placeholder="Type your question"
                rows={2}
                value={q.text}
                onChange={(e) => updateQuestion(qi, { text: e.target.value })}
              />

              <div className="kh-option-rows">
                {q.options.map((opt, oi) => (
                  <div className={`kh-option-row ${toneClass(oi)} ${q.correct === oi ? 'is-correct' : ''}`} key={oi}>
                    <span className="kh-option-letter">{OPTION_LETTERS[oi]}</span>
                    <input
                      className="kh-input"
                      placeholder={`Answer ${OPTION_LETTERS[oi]}`}
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                    />
                    <button
                      type="button"
                      className={`kh-correct-btn ${q.correct === oi ? 'active' : ''}`}
                      onClick={() => updateQuestion(qi, { correct: oi })}
                      aria-pressed={q.correct === oi}
                    >
                      <FiCheck /> {q.correct === oi ? 'Correct' : 'Mark correct'}
                    </button>
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        className="kh-icon-btn"
                        onClick={() => removeOption(qi, oi)}
                        aria-label={`Remove answer ${OPTION_LETTERS[oi]}`}
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                ))}
                {q.options.length < 6 && (
                  <button type="button" className="kh-link-btn" onClick={() => addOption(qi)}>
                    <FiPlus /> Add answer option
                  </button>
                )}
              </div>
            </div>
          ))}

          <button type="button" className="kh-add-question" onClick={addQuestion}>
            <FiPlus /> Add another question
          </button>

          {error && <div className="kh-form-error" role="alert">{error}</div>}

          <div className="kh-create-footer">
            <span className="kh-create-summary">
              <FiHelpCircle /> {questions.length} {questions.length === 1 ? 'question' : 'questions'} · {duration}s each
            </span>
            <button type="submit" className="kh-btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create quiz & get PIN'}
            </button>
          </div>
        </form>
      </KahootPanel>
    </StudentShell>
  );
}
