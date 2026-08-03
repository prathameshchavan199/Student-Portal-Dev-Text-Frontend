import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiArrowLeft, FiArrowRight, FiRefreshCw,
  FiBold, FiDownload, FiItalic, FiList, FiLink, FiFileText,
} from 'react-icons/fi';
import axios from 'axios';
import { API_BASE_URL } from '../api/axiosSetup.js';
import StudentShell from '../components/StudentShell.jsx';
import { downloadAssessmentCertificate } from '../utils/certificate.js';

const MAX_SECS  = 15 * 60;
const MAX_WORDS = 500;

function fmtTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function countWords(text) {
  const clean = text.replace(/\*\*?|__?|\[.*?\]|\(.*?\)/g, '').trim();
  return clean ? clean.split(/\s+/).length : 0;
}

function ScoreRing({ pct }) {
  const r = 52, cx = 64, cy = 64;
  const circ  = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color  = pct >= 82 ? '#22c55e' : pct >= 65 ? '#f97316' : '#ef4444';
  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-color)" strokeWidth="10" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 64 64)" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fontSize="26" fontWeight="800" fill="var(--text-heading)">{pct}</text>
    </svg>
  );
}

export default function WritingTest({ onSignOut }) {
  const navigate    = useNavigate();
  const location    = useLocation();
  const moduleTitle = location.state?.moduleTitle || 'Writing Test';
  const moduleId    = location.state?.moduleId ?? 'writing-test';

  const [promptData,    setPromptData]    = useState(null);
  const [promptLoading, setPromptLoading] = useState(true);
  const [submitting,    setSubmitting]    = useState(false);

  const [phase,     setPhase]     = useState('test');
  const [text,      setText]      = useState('');
  const [timeLeft,  setTimeLeft]  = useState(MAX_SECS);
  const [autoSaved, setAutoSaved] = useState(false);
  const [result,    setResult]    = useState(null);

  const textareaRef      = useRef(null);
  const timerRef         = useRef(null);
  const autoSaveRef      = useRef(null);
  const timerStartedRef  = useRef(false);
  const submitCalledRef  = useRef(false);

  const wordCount = countWords(text);

  // Fetch a random writing prompt on mount
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/communication/writing/prompt/random`)
      .then(res => {
        if (res.data?.success) setPromptData(res.data.data);
      })
      .catch(() => {
        setPromptData({
          id: null,
          topicText: 'Explain the impact of Edge Computing on IoT Scalability.',
          challenge: 'Discuss decentralized data processing, latency reduction, and bandwidth optimization in large-scale ecosystems.',
        });
      })
      .finally(() => setPromptLoading(false));
  }, []);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const submitToBackend = async (currentText) => {
    if (submitCalledRef.current) return;
    submitCalledRef.current = true;
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/communication/writing/submit?moduleId=${moduleId}`,
        {
          topicId: promptData?.id ?? null,
          text: currentText,
        },
      );
      if (res.data?.success) {
        const data = res.data.data;
        setResult({ ...data, attemptNo: data.attemptNumber });
        setPhase('result');
      }
    } catch (err) {
      console.error('Writing submit error:', err);
      submitCalledRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAuto = () => {
    clearInterval(timerRef.current);
    setText(prev => {
      submitToBackend(prev);
      return prev;
    });
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (countWords(val) > MAX_WORDS) return;
    setText(val);
    setAutoSaved(false);
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => setAutoSaved(true), 2000);
    if (!timerStartedRef.current && val.trim().length > 0) {
      timerStartedRef.current = true;
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); handleSubmitAuto(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
  };

  const applyFormat = (type) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const sel   = text.slice(start, end);
    let wrapped;
    if (type === 'bold')   wrapped = `**${sel || 'bold text'}**`;
    if (type === 'italic') wrapped = `*${sel || 'italic text'}*`;
    if (type === 'list') {
      wrapped = (sel || 'List item').split('\n').map(l => `• ${l}`).join('\n');
    }
    if (type === 'link') {
      const url = window.prompt('Enter URL:', 'https://');
      if (!url) return;
      wrapped = `[${sel || 'link text'}](${url})`;
    }
    const newText = text.slice(0, start) + wrapped + text.slice(end);
    setText(newText);
    setTimeout(() => {
      el.selectionStart = start + wrapped.length;
      el.selectionEnd   = start + wrapped.length;
      el.focus();
    }, 0);
  };

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    await submitToBackend(text);
  };

  const handleRedo = () => {
    clearInterval(timerRef.current);
    timerStartedRef.current = false;
    submitCalledRef.current = false;
    setText('');
    setAutoSaved(false);
    setResult(null);
    setTimeLeft(MAX_SECS);
    setPhase('test');
    // Fetch a fresh random prompt on redo
    setPromptLoading(true);
    axios.get(`${API_BASE_URL}/api/communication/writing/prompt/random`)
      .then(res => { if (res.data?.success) setPromptData(res.data.data); })
      .catch(() => {})
      .finally(() => setPromptLoading(false));
  };

  /* ── Result Screen ──────────────────────────────────────────── */
  if (phase === 'result' && result) {
    const { score, badge, badgeDesc, skills, strengths, areas, wordCount: wc, date, attemptNo } = result;
    const handleDownloadCertificate = () => {
      downloadAssessmentCertificate({
        assessmentName: moduleTitle,
        score,
        totalScore: 100,
        attemptNo,
      });
    };
    return (
      <StudentShell onSignOut={onSignOut}>
        <main className="course-shell techskills-shell">
        <section className="course-phone-panel techskills-panel spk-panel">
          <div className="course-phone-topbar">
            <button className="mcq-topbar-back" onClick={() => navigate('/assessment/communication')}>
              <FiArrowLeft />
            </button>
            <span>Result</span>
          </div>

          <h1 className="spk-result-title">{moduleTitle}</h1>
          <p className="spk-result-meta">Completed on {date}&nbsp;•&nbsp;{wc} words written</p>

          {/* Overall Performance */}
          <div className="spk-result-card">
            <p className="spk-overall-label">OVERALL PERFORMANCE</p>
            <div className="spk-ring-wrap"><ScoreRing pct={score} /></div>
            <span className="spk-badge-pill">{badge}</span>
            <p className="spk-badge-desc">{badgeDesc}</p>
          </div>

          {/* Skill Breakdown */}
          <div className="spk-result-card">
            <div className="spk-card-header">
              <span className="spk-card-icon">📊</span>
              <span className="spk-card-title">Skill Breakdown</span>
            </div>
            {skills.map(({ label, pct }) => (
              <div className="spk-skill-row" key={label}>
                <div className="spk-skill-top">
                  <span className="spk-skill-label">{label}</span>
                  <span className="spk-skill-pct">{pct}%</span>
                </div>
                <div className="spk-skill-bar-bg">
                  <div className="spk-skill-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* AI Feedback */}
          <div className="spk-result-card">
            <div className="spk-card-header">
              <span className="spk-card-icon">🤖</span>
              <span className="spk-card-title">AI Feedback Insights</span>
            </div>
            {strengths.length > 0 && <>
              <p className="spk-fb-label spk-fb-green">✅ STRENGTHS</p>
              <ul className="spk-fb-list">
                {strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </>}
            {areas.length > 0 && <>
              <p className="spk-fb-label spk-fb-orange">⚠️ AREAS TO IMPROVE</p>
              <ul className="spk-fb-list">
                {areas.map(({ bold, rest }, i) => (
                  <li key={i}><strong>{bold}</strong>{rest}</li>
                ))}
              </ul>
            </>}
          </div>

          {/* Submitted Text */}
          <div className="spk-result-card">
            <div className="spk-card-header">
              <span className="spk-card-icon">✍️</span>
              <span className="spk-card-title">Your Written Response</span>
            </div>
            <div className="spk-transcript-box">
              <p style={{ whiteSpace: 'pre-wrap' }}>{text || 'No content was submitted.'}</p>
            </div>
          </div>

          <button className="spk-redo-btn" onClick={handleRedo}>
            <FiRefreshCw /> Redo Assessment
          </button>
          <div className="write-test-btn">
            <button className="spk-finish-btn" onClick={handleDownloadCertificate}>
              <FiDownload /> Download Certificate
            </button>
            <button className="spk-finish-btn" onClick={() => navigate('/assessment/communication')}>
              Finish &amp; Return to Hub <FiArrowRight />
            </button>
          </div>
        </section>
        </main>
      </StudentShell>
    );
  }

  /* ── Test Screen ────────────────────────────────────────────── */
  const timerWarning  = timeLeft <= 120;
  const promptTitle   = promptLoading ? 'Loading your prompt…' : (promptData?.topicText ?? '');
  const promptHint    = promptLoading ? '' : (promptData?.challenge ?? '');

  return (
    <StudentShell onSignOut={onSignOut}>
      <main className="course-shell techskills-shell">
      <section className="course-phone-panel techskills-panel spk-panel">

        <div className="course-phone-topbar">
          <button className="mcq-topbar-back" onClick={() => navigate('/assessment/communication')}>
            <FiArrowLeft />
          </button>
          <span>Writing Task</span>
        </div>

        {/* Prompt Card */}
        <div className="spk-challenge-card">
          <p className="spk-challenge-label">✍️ TECHNICAL PROMPT <span className={`spk-timer${timerWarning ? ' wrt-timer-warn' : ''}`}>
            ⏱ {fmtTime(timeLeft)}
          </span></p>
          <p className="spk-challenge-text">{promptTitle}</p>
          <div className="spk-guidelines-box">
            <p className="spk-guidelines-label">ℹ️ WRITING GUIDELINES</p>
            <p className="spk-guidelines-text">{promptHint}</p>
          </div>
        </div>

        {/* Editor Card */}
        <div className="wrt-editor-card">
          <div className="wrt-toolbar">
            <button className="wrt-toolbar-btn" onClick={() => applyFormat('bold')} title="Bold"><FiBold /></button>
            <button className="wrt-toolbar-btn" onClick={() => applyFormat('italic')} title="Italic"><FiItalic /></button>
            <div className="wrt-toolbar-divider" />
            <button className="wrt-toolbar-btn" onClick={() => applyFormat('list')} title="Bullet list"><FiList /></button>
            <button className="wrt-toolbar-btn" onClick={() => applyFormat('link')} title="Insert link"><FiLink /></button>
            {autoSaved && (
              <span className="wrt-autosave">
                <span className="wrt-autosave-dot" />
                AUTO-SAVED
              </span>
            )}
          </div>
          <textarea
            ref={textareaRef}
            className="wrt-textarea"
            placeholder="Enter your technical analysis..."
            value={text}
            onChange={handleChange}
            disabled={promptLoading}
          />
        </div>

        {/* Word Count */}
        <div className="wrt-word-pill">
          <FiFileText className="wrt-word-icon" />
          <div className="wrt-word-body">
            <span className="wrt-word-label">WORDS</span>
            <span className="wrt-word-count">{wordCount} / {MAX_WORDS}</span>
          </div>
        </div>

        {/* Submit */}
        <button
          className="wrt-submit-btn"
          onClick={handleSubmit}
          disabled={wordCount < 10 || promptLoading || submitting}
        >
          {submitting ? 'Evaluating…' : 'Submit Assessment'} <FiArrowRight />
        </button>

      </section>
      </main>
    </StudentShell>
  );
}
