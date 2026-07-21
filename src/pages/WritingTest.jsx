import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiArrowLeft, FiArrowRight, FiRefreshCw,
  FiBold, FiDownload, FiItalic, FiList, FiLink, FiFileText,
} from 'react-icons/fi';
import StudentShell from '../components/StudentShell.jsx';
import { downloadAssessmentCertificate } from '../utils/certificate.js';

const PROMPT_TITLE = 'Explain the impact of Edge Computing on IoT Scalability.';
const PROMPT_HINT  = 'Discuss decentralized data processing, latency reduction, and bandwidth optimization in large-scale ecosystems.';
const MAX_SECS  = 15 * 60;
const MAX_WORDS = 500;

const TECH_WORDS = new Set([
  'algorithm','implementation','architecture','database','system','solution','framework','api',
  'server','client','deploy','optimize','performance','scalable','integration','component',
  'module','function','interface','protocol','network','security','authentication',
  'encryption','cache','query','endpoint','code','software','hardware','data','logic',
  'edge','computing','iot','latency','bandwidth','decentralized','processing','throughput',
  'microservice','docker','kubernetes','devops','runtime','pipeline','model','cloud',
  'testing','agile','feature','scalability','ecosystem','infrastructure','sensor',
  'gateway','node','cluster','distributed','concurrent','asynchronous','synchronous',
]);

const TRANSITIONS = [
  'however','therefore','furthermore','additionally','moreover','consequently',
  'in contrast','as a result','for example','in conclusion','on the other hand',
  'first','second','finally','in addition','nevertheless','thus','hence','specifically',
];

const ARG_GROUPS = [
  ['context','currently','today','background','introduction','overview','traditionally'],
  ['challenge','problem','issue','concern','limitation','drawback','constraint','difficulty'],
  ['solution','approach','method','technique','strategy','implementation','using','by applying'],
  ['result','benefit','advantage','improvement','enables','allows','achieves','outcome'],
];

const PROMPT_KEYWORDS = [
  'edge','computing','iot','scalability','decentralized','latency','bandwidth',
  'processing','ecosystem','sensor','gateway','device','cloud','network',
];

const EVIDENCE_MARKERS = [
  'because','for example','for instance','such as','this means','this allows',
  'as a result','therefore','consequently','compared with','in practice',
];

const MECHANICS_ISSUES = [
  /\bi\b/g,
  /\s+[,.!?;]/g,
  /[,.!?;:]{2,}/g,
  /\b(the|a|an|and|or|but|to|of|in|on|for|with)\s+\1\b/gi,
];

function fmtTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function countWords(text) {
  const clean = text.replace(/\*\*?|__?|\[.*?\]|\(.*?\)/g, '').trim();
  return clean ? clean.split(/\s+/).length : 0;
}

function evaluateWriting(text) {
  const clean = text.replace(/\*\*?|__?|\[.*?\]|\(.*?\)/g, '').trim();

  if (!clean || clean.split(/\s+/).length < 5) {
    return {
      score: 0, badge: 'NO CONTENT',
      badgeDesc: 'No writing was submitted. Please write your response and try again.',
      skills: [
        { label: 'CLARITY & READABILITY', pct: 0 },
        { label: 'TECHNICAL ACCURACY', pct: 0 },
        { label: 'PROMPT RELEVANCE', pct: 0 },
        { label: 'EVIDENCE & EXPLANATION', pct: 0 },
        { label: 'ORGANIZATION & MECHANICS', pct: 0 },
      ],
      strengths: [],
      areas: [{ bold: 'No content submitted', rest: ' — please write your response.' }],
      wordCount: 0,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  }

  const words      = clean.split(/\s+/);
  const wordCount  = words.length;
  const lower      = clean.toLowerCase();
  const sentences  = clean.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const sentCount  = Math.max(sentences.length, 1);
  const avgSentLen = wordCount / sentCount;
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  const paraCount  = Math.max(paragraphs.length, 1);

  const sentLens  = sentences.map(s => s.split(/\s+/).length);
  const meanLen   = sentLens.reduce((a, b) => a + b, 0) / sentLens.length;
  const variance  = sentLens.reduce((a, b) => a + Math.abs(b - meanLen), 0) / sentLens.length;

  const normalizedWords = words
    .map(w => w.toLowerCase().replace(/[^a-z]/g, ''))
    .filter(Boolean);

  const techCount  = normalizedWords.filter(w => TECH_WORDS.has(w)).length;
  const promptHits = PROMPT_KEYWORDS.filter(kw => lower.includes(kw)).length;
  const evidenceHits = EVIDENCE_MARKERS.filter(marker => lower.includes(marker)).length;
  const uniqueRatio = new Set(normalizedWords).size / Math.max(normalizedWords.length, 1);
  const transCount = TRANSITIONS.filter(t => lower.includes(t)).length;
  const argHits    = ARG_GROUPS.filter(g => g.some(kw => lower.includes(kw))).length;
  const tokenCounts = normalizedWords.reduce((counts, word) => {
    counts[word] = (counts[word] || 0) + 1;
    return counts;
  }, {});
  const dominantTokenCount = Math.max(...Object.values(tokenCounts), 0);
  const dominantTokenRatio = dominantTokenCount / Math.max(normalizedWords.length, 1);
  const repeatedTokenRatio = 1 - (new Set(normalizedWords).size / Math.max(normalizedWords.length, 1));
  const mechanicsIssueCount = MECHANICS_ISSUES.reduce((sum, pattern) => {
    const matches = clean.match(pattern);
    return sum + (matches ? matches.length : 0);
  }, 0);
  const hasConclusion = /\b(in conclusion|to conclude|overall|finally|therefore|as a result)\b/i.test(clean);
  const hasQuestionFocus = promptHits >= 4 && lower.includes('edge') && lower.includes('iot');
  const hasCauseEffect = /\b(reduce|reduces|improve|improves|enable|enables|allow|allows|increase|decrease|optimize|optimise)\b/i.test(clean);
  const lowMeaningResponse =
    promptHits === 0 &&
    (uniqueRatio < 0.35 || dominantTokenRatio >= 0.3 || repeatedTokenRatio >= 0.65);

  let clarity = 56;
  if (avgSentLen >= 10 && avgSentLen <= 24) clarity += 18;
  else if (avgSentLen < 7) clarity -= 10;
  else if (avgSentLen > 32) clarity -= 14;
  if (sentCount >= 6) clarity += 8;
  if (variance >= 4 && variance <= 18) clarity += 8;
  if (uniqueRatio >= 0.55) clarity += 6;
  clarity = Math.min(100, Math.max(25, Math.round(clarity)));

  let technical = 42;
  technical += Math.min(techCount * 5, 35);
  technical += Math.min(promptHits * 3, 18);
  if (lower.includes('latency') && lower.includes('bandwidth')) technical += 8;
  if (lower.includes('gateway') || lower.includes('sensor') || lower.includes('device')) technical += 5;
  if (hasCauseEffect) technical += 5;
  technical = Math.min(100, Math.max(25, Math.round(technical)));

  let relevance = 40;
  relevance += Math.min(promptHits * 5, 35);
  if (hasQuestionFocus) relevance += 12;
  if (lower.includes('scalability') || lower.includes('scale')) relevance += 8;
  if (wordCount < 80) relevance -= 10;
  relevance = Math.min(100, Math.max(25, Math.round(relevance)));

  let evidence = 36;
  evidence += Math.min(evidenceHits * 8, 32);
  evidence += argHits * 6;
  if (hasCauseEffect) evidence += 8;
  if (wordCount >= 150) evidence += 8;
  if (wordCount >= 220) evidence += 4;
  evidence = Math.min(100, Math.max(25, Math.round(evidence)));

  let organization = 42;
  organization += argHits * 9;
  if (paraCount >= 2) organization += 8;
  if (paraCount >= 3) organization += 5;
  if (transCount >= 2) organization += 8;
  else if (transCount >= 1) organization += 4;
  if (hasConclusion) organization += 5;
  organization -= Math.min(mechanicsIssueCount * 4, 18);
  organization = Math.min(100, Math.max(25, Math.round(organization)));

  if (lowMeaningResponse) {
    clarity = Math.min(clarity, 18);
    technical = Math.min(technical, 8);
    relevance = Math.min(relevance, 5);
    evidence = Math.min(evidence, 8);
    organization = Math.min(organization, 10);
  }

  const score = Math.round(
    (clarity * 0.2) +
    (technical * 0.24) +
    (relevance * 0.2) +
    (evidence * 0.18) +
    (organization * 0.18)
  );

  let badge, badgeDesc;
  if (score >= 82) {
    badge     = 'ADVANCED TECHNICAL WRITER';
    badgeDesc = 'Your response shows clear structure, strong technical accuracy, and well-supported explanation.';
  } else if (score >= 65) {
    badge     = 'PROFICIENT WRITER';
    badgeDesc = 'Your writing has a solid foundation. Keep improving evidence, flow, and technical precision.';
  } else {
    badge     = 'FOUNDATIONAL WRITER';
    badgeDesc = 'Focus on answering the prompt directly with organized points, technical vocabulary, and examples.';
  }

  const strengths = [];
  if (promptHits >= 6)         strengths.push('The response stays closely aligned with edge computing, IoT scalability, latency, and bandwidth.');
  if (evidenceHits >= 2)       strengths.push('Good explanatory support using examples, cause-effect reasoning, or practical implications.');
  if (techCount >= 4)          strengths.push(`Strong technical vocabulary — ${techCount} domain-specific terms used effectively.`);
  if (transCount >= 2)         strengths.push('Good use of transition phrases that improve readability and flow.');
  if (argHits >= 3)            strengths.push('Well-structured argument covering context, challenge, approach, and outcome.');
  if (avgSentLen >= 10 && avgSentLen <= 25) strengths.push('Clear and readable sentence length — well-balanced prose.');
  if (variance >= 4)           strengths.push('Good sentence variety — alternating lengths keep the reader engaged.');
  if (wordCount >= 200)        strengths.push(`Comprehensive response at ${wordCount} words — good depth of analysis.`);
  if (uniqueRatio >= 0.65)     strengths.push('Rich vocabulary demonstrating broad domain knowledge.');
  if (strengths.length === 0)  strengths.push('You completed the writing assessment — a strong first step in technical communication.');

  if (lowMeaningResponse) strengths.length = 0;

  const areas = [];
  if (lowMeaningResponse) areas.push({ bold: 'Submit meaningful content', rest: ' - repeated or off-topic filler text cannot be evaluated as a valid writing response.' });
  if (mechanicsIssueCount > 1) areas.push({ bold: 'Proofread mechanics', rest: ` - ${mechanicsIssueCount} punctuation, capitalization, or repeated-word issue(s) detected.` });
  if (promptHits < 4)   areas.push({ bold: 'Address the prompt more directly', rest: ' - mention edge computing, IoT scalability, latency, bandwidth, and decentralized processing.' });
  if (evidenceHits < 2) areas.push({ bold: 'Add evidence and explanation', rest: ' - use examples or cause-effect reasoning to support each claim.' });
  if (techCount < 3)    areas.push({ bold: 'Include more technical terms', rest: ' — demonstrate domain-specific knowledge with precise vocabulary.' });
  if (argHits < 2)      areas.push({ bold: 'Structure your argument', rest: ' — cover the context, challenge, your approach, and the outcome.' });
  if (transCount < 2)   areas.push({ bold: 'Use transition phrases', rest: ' — words like "however", "therefore", "as a result" improve flow.' });
  if (wordCount < 120)  areas.push({ bold: 'Expand your response', rest: ` — at ${wordCount} words, add more depth (aim for 150–300).` });
  if (avgSentLen > 30)  areas.push({ bold: 'Break up long sentences', rest: ` — avg ${Math.round(avgSentLen)} words/sentence is hard to follow.` });
  if (paraCount < 2)    areas.push({ bold: 'Organise into paragraphs', rest: ' — separate your introduction, main points, and conclusion.' });
  if (areas.length === 0) areas.push({ bold: 'Keep practising', rest: ' — consistent technical writing builds confidence and clarity.' });

  return {
    score, badge, badgeDesc,
    skills: [
      { label: 'CLARITY & READABILITY', pct: clarity },
      { label: 'TECHNICAL ACCURACY', pct: technical },
      { label: 'PROMPT RELEVANCE', pct: relevance },
      { label: 'EVIDENCE & EXPLANATION', pct: evidence },
      { label: 'ORGANIZATION & MECHANICS', pct: organization },
    ],
    strengths, areas, wordCount,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };
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
  const navigate  = useNavigate();
  const location  = useLocation();
  const moduleTitle = location.state?.moduleTitle || 'Writing Test';

  const [phase,     setPhase]     = useState('test');
  const [text,      setText]      = useState('');
  const [timeLeft,  setTimeLeft]  = useState(MAX_SECS);
  const [autoSaved, setAutoSaved] = useState(false);
  const [result,    setResult]    = useState(null);

  const textareaRef      = useRef(null);
  const timerRef         = useRef(null);
  const autoSaveRef      = useRef(null);
  const timerStartedRef  = useRef(false);

  const wordCount = countWords(text);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const saveAttempt = (r) => {
    const moduleId = location.state?.moduleId ?? 'writing-test';
    let attemptNo = 1;
    try {
      const raw = localStorage.getItem('assessment-attempts');
      const all = raw ? JSON.parse(raw) : {};
      const prev = all[moduleId] ?? [];
      attemptNo = prev.length + 1;
      if (prev.length < 3) {
        const now = new Date();
        all[moduleId] = [...prev, {
          correct: r.score,
          totalQuestions: 100,
          date: now.toISOString().split('T')[0],
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }];
        localStorage.setItem('assessment-attempts', JSON.stringify(all));
      }
    } catch {}
    return attemptNo;
  };

  const handleSubmitAuto = () => {
    setText(prev => {
      const r = evaluateWriting(prev);
      const attemptNo = saveAttempt(r);
      setResult({ ...r, attemptNo });
      setPhase('result');
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

  const handleSubmit = () => {
    clearInterval(timerRef.current);
    const r = evaluateWriting(text);
    const attemptNo = saveAttempt(r);
    setResult({ ...r, attemptNo });
    setPhase('result');
  };

  const handleRedo = () => {
    clearInterval(timerRef.current);
    timerStartedRef.current = false;
    setText('');
    setAutoSaved(false);
    setResult(null);
    setTimeLeft(MAX_SECS);
    setPhase('test');
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
  const timerWarning = timeLeft <= 120;

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

        {/* Timer row */}
       

        {/* Prompt Card */}
        <div className="spk-challenge-card">
          <p className="spk-challenge-label">✍️ TECHNICAL PROMPT <span className={`spk-timer${timerWarning ? ' wrt-timer-warn' : ''}`}>
            ⏱ {fmtTime(timeLeft)}
          </span></p>
           
          <p className="spk-challenge-text">{PROMPT_TITLE}</p>
          <div className="spk-guidelines-box">
            <p className="spk-guidelines-label">ℹ️ WRITING GUIDELINES</p>
            <p className="spk-guidelines-text">{PROMPT_HINT}</p>
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
          disabled={wordCount < 10}
        >
          Submit Assessment <FiArrowRight />
        </button>

      </section>
      </main>
    </StudentShell>
  );
}
