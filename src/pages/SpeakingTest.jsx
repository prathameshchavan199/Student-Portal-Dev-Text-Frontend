import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiDownload, FiMic, FiRefreshCw, FiPlay, FiPause } from 'react-icons/fi';
import StudentShell from '../components/StudentShell.jsx';
import { downloadAssessmentCertificate } from '../utils/certificate.js';

const TOPIC      = 'The Future of Artificial Intelligence';
const MAX_SECS   = 120;
const CHALLENGE  = '"Describe a time you solved a difficult technical problem."';
const GUIDELINES = 'Maximum 2 minutes. Focus on articulation, technical vocabulary, and clear structural flow.';

const WAVE_HEIGHTS = Array.from({ length: 22 }, (_, i) =>
  8 + Math.abs(Math.sin(i * 0.9 + 0.3)) * 16
);

const FILLERS = new Set([
  'um','uh','like','basically','literally','actually','right','okay','so','well','hmm','you know',
]);
const TECH_WORDS = new Set([
  'algorithm','implementation','architecture','database','system','solution','framework','api',
  'server','client','deploy','debug','optimize','performance','scalable','integration','component',
  'module','function','variable','interface','protocol','network','security','authentication',
  'encryption','cache','query','endpoint','code','software','hardware','data','logic','error',
  'bug','feature','testing','pipeline','model','cloud','repository','sprint','agile','stack',
  'frontend','backend','microservice','docker','kubernetes','devops','runtime','latency','throughput',
]);
const TRANSITIONS = [
  'however','therefore','furthermore','additionally','moreover','consequently',
  'in contrast','as a result','for example','in conclusion','on the other hand',
];
const STAR_GROUPS = [
  ['situation','context','when','working on','during','at the time','we were'],
  ['task','challenge','problem','issue','needed to','had to','required','my role'],
  ['action','decided','implemented','developed','i used','i applied','i created','i fixed','approached','i wrote'],
  ['result','outcome','finally','eventually','achieved','resolved','improved','success','as a result','it worked'],
];

function fmtTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function evaluateSpeech(text, elapsedSecs) {
  const clean = text.trim();

  if (!clean || clean.split(/\s+/).length < 5) {
    return {
      score: 0, badge: 'NO SPEECH DETECTED',
      badgeDesc: 'No speech was captured. Check your microphone and try again.',
      skills: [
        { label: 'ARTICULATION & CLARITY', pct: 0 },
        { label: 'TECHNICAL VOCABULARY',   pct: 0 },
        { label: 'STRUCTURAL FLOW',        pct: 0 },
      ],
      strengths: [],
      areas: [{ bold: 'No speech detected', rest: ' — please allow microphone access and speak clearly.' }],
      wordCount: 0, wpm: 0,
      duration: fmtTime(elapsedSecs),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  }

  const words        = clean.split(/\s+/);
  const wordCount    = words.length;
  const lower        = clean.toLowerCase();
  const sentences    = clean.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const sentCount    = Math.max(sentences.length, 1);
  const avgSentLen   = wordCount / sentCount;
  const wpm          = elapsedSecs > 0 ? Math.round((wordCount / elapsedSecs) * 60) : 0;

  // Filler words
  const fillerCount = words.filter(w =>
    FILLERS.has(w.toLowerCase().replace(/[^a-z]/g, ''))
  ).length;
  const fillerRatio = fillerCount / wordCount;

  // Repeated consecutive words (grammar)
  const repeatCount = words.filter((w, i) =>
    i > 0 && w.toLowerCase() === words[i - 1].toLowerCase()
  ).length;

  // Technical vocabulary
  const techCount = words.filter(w =>
    TECH_WORDS.has(w.toLowerCase().replace(/[^a-z]/g, ''))
  ).length;

  // Vocabulary richness
  const uniqueRatio = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, ''))).size / wordCount;

  // Transition phrases
  const transCount = TRANSITIONS.filter(t => lower.includes(t)).length;

  // STAR method coverage (0–4)
  const starHits = STAR_GROUPS.filter(group => group.some(kw => lower.includes(kw))).length;

  // ── Scores ─────────────────────────────────────────────────────
  let clarity = 65;
  clarity -= fillerRatio * 160;
  clarity -= repeatCount * 4;
  if (avgSentLen >= 8 && avgSentLen <= 22) clarity += 15;
  else if (avgSentLen < 5 || avgSentLen > 32) clarity -= 12;
  if (wpm >= 110 && wpm <= 160) clarity += 12;
  else if (wpm > 170 || (wpm > 0 && wpm < 80)) clarity -= 8;
  clarity = Math.min(100, Math.max(28, Math.round(clarity)));

  let vocab = 48;
  vocab += Math.min(techCount * 7, 36);
  vocab += Math.min(uniqueRatio * 35, 18);
  if (transCount >= 1) vocab += 8;
  if (transCount >= 2) vocab += 6;
  vocab = Math.min(100, Math.max(28, Math.round(vocab)));

  let structure = 38;
  structure += starHits * 13;
  if (sentCount >= 4)    structure += 8;
  if (wordCount >= 60)   structure += 8;
  if (transCount >= 1)   structure += 6;
  structure = Math.min(100, Math.max(28, Math.round(structure)));

  const score = Math.round((clarity + vocab + structure) / 3);

  // Badge
  let badge, badgeDesc;
  if (score >= 82) {
    badge     = 'FLUENT ENGINEER';
    badgeDesc = 'You demonstrate strong technical command and confident articulation.';
  } else if (score >= 65) {
    badge     = 'DEVELOPING SPEAKER';
    badgeDesc = 'A solid foundation — keep refining structure and vocabulary.';
  } else {
    badge     = 'EMERGING VOICE';
    badgeDesc = 'Great start! Focus on structure, pace, and reducing filler words.';
  }

  // Strengths
  const strengths = [];
  if (fillerRatio < 0.04)  strengths.push('Clean delivery with minimal filler words — very professional.');
  if (starHits >= 3)       strengths.push('Strong STAR method structure — Situation, Task, Action & Result clearly present.');
  if (techCount >= 3)      strengths.push(`Good technical vocabulary — ${techCount} domain-specific terms used effectively.`);
  if (transCount >= 1)     strengths.push('Effective transition phrases that improve flow and coherence.');
  if (wpm >= 110 && wpm <= 160) strengths.push(`Excellent speaking pace at approximately ${wpm} words per minute.`);
  if (uniqueRatio >= 0.65) strengths.push('Rich and varied vocabulary throughout your response.');
  if (strengths.length === 0) strengths.push('You completed the full assessment — a great first step toward fluency.');

  // Areas
  const areas = [];
  if (fillerRatio >= 0.04) areas.push({ bold: 'Reduce filler words', rest: ` — ${fillerCount} detected (um, uh, like, basically…).` });
  if (starHits < 2)        areas.push({ bold: 'Apply the STAR method', rest: ' — clearly cover Situation, Task, Action, and Result.' });
  if (techCount < 2)       areas.push({ bold: 'Use more technical terms', rest: ' — demonstrate domain knowledge with specific vocabulary.' });
  if (wpm > 170)           areas.push({ bold: 'Slow down slightly', rest: ` — at ${wpm} wpm it may be difficult to follow (ideal: 110–160).` });
  if (wpm > 0 && wpm < 90) areas.push({ bold: 'Pick up the pace', rest: ` — at ${wpm} wpm the delivery feels slow (ideal: 110–160).` });
  if (avgSentLen > 28)     areas.push({ bold: 'Break up long sentences', rest: ` — avg ${Math.round(avgSentLen)} words/sentence is too long.` });
  if (repeatCount > 1)     areas.push({ bold: 'Avoid repeated consecutive words', rest: ` — ${repeatCount} repetition(s) detected.` });
  if (areas.length === 0)  areas.push({ bold: 'Keep practising', rest: ' — consistency is the key to becoming a confident communicator.' });

  return {
    score, badge, badgeDesc,
    skills: [
      { label: 'ARTICULATION & CLARITY', pct: clarity },
      { label: 'TECHNICAL VOCABULARY',   pct: vocab },
      { label: 'STRUCTURAL FLOW',        pct: structure },
    ],
    strengths, areas, wordCount, wpm,
    duration: fmtTime(elapsedSecs),
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };
}

const PLAYER_STATIC = Array.from({ length: 40 }, (_, i) =>
  Math.max(4, 6 + Math.abs(Math.sin(i * 0.45 + 0.3)) * 22)
);

function WaveformPlayer({ src }) {
  const audioRef    = useRef(null);
  const ctxRef      = useRef(null);
  const analyserRef = useRef(null);
  const rafRef      = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrent] = useState(0);
  const [duration, setDuration]   = useState(0);
  const [bars, setBars]           = useState(PLAYER_STATIC);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd  = () => { setIsPlaying(false); cancelAnimationFrame(rafRef.current); setBars(PLAYER_STATIC); };
    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    return () => {
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      cancelAnimationFrame(rafRef.current);
      if (ctxRef.current) { ctxRef.current.close(); ctxRef.current = null; }
    };
  }, []);

  const initCtx = () => {
    if (ctxRef.current) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx      = new AudioCtx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaElementSource(audioRef.current).connect(analyser);
    analyser.connect(ctx.destination);
    ctxRef.current      = ctx;
    analyserRef.current = analyser;
  };

  const animate = () => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    const step = data.length / 40;
    setBars(Array.from({ length: 40 }, (_, i) => {
      const freq  = data[Math.floor(i * step)] / 255;
      const floor = PLAYER_STATIC[i] * 0.25;
      return Math.max(4, freq * 36 + floor);
    }));
    rafRef.current = requestAnimationFrame(animate);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    initCtx();
    if (ctxRef.current && ctxRef.current.state === 'suspended') ctxRef.current.resume();
    if (isPlaying) {
      audio.pause();
      cancelAnimationFrame(rafRef.current);
      setBars(PLAYER_STATIC);
      setIsPlaying(false);
    } else {
      audio.play();
      animate();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="spk-waveform-player">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button className="spk-wp-playbtn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? <FiPause /> : <FiPlay />}
      </button>
      <div className="spk-wp-right">
        <div className="spk-wp-bars">
          {bars.map((h, i) => (
            <div
              key={i}
              className={`spk-wp-bar${isPlaying ? ' spk-wp-bar-live' : ''}`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
        <div className="spk-wp-track" onClick={handleSeek}>
          <div className="spk-wp-progress" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="spk-wp-times">
          <span>{fmtTime(Math.floor(currentTime))}</span>
          <span>{duration ? fmtTime(Math.floor(duration)) : '--:--'}</span>
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ pct }) {
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="#2563eb" strokeWidth="10"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
      />
      <text x={cx} y={cy + 8} textAnchor="middle"
        fontSize="30" fontWeight="800" fill="#111827">{pct}</text>
      <text x={cx + 20} y={cy - 4} textAnchor="middle"
        fontSize="14" fontWeight="600" fill="#6b7280">%</text>
    </svg>
  );
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function SpeakingTest({ onSignOut }) {
  const navigate    = useNavigate();
  const location    = useLocation();
  const moduleTitle = location.state?.moduleTitle ?? 'Speaking Task';

  const [phase,       setPhase]       = useState('test');
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [timeLeft,    setTimeLeft]    = useState(MAX_SECS);
  const [transcript,  setTranscript]  = useState('');
  const [audioUrl,    setAudioUrl]    = useState(null);
  const [result,      setResult]      = useState(null);
  const timerRef         = useRef(null);
  const srRef            = useRef(null);
  const mrRef            = useRef(null);   // MediaRecorder
  const chunksRef        = useRef([]);
  const streamRef        = useRef(null);
  const baseTranscriptRef = useRef('');    // text accumulated from prior recording segments

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            stopSR();
            stopMR();
            setIsRecording(false);
            setHasRecorded(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startSR = () => {
    if (!SpeechRecognition) return;
    const base = baseTranscriptRef.current;
    const sr = new SpeechRecognition();
    sr.continuous     = true;
    sr.interimResults = true;
    sr.lang           = 'en-US';
    sr.onresult = (e) => {
      let final = '', interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        e.results[i].isFinal ? (final += t + ' ') : (interim += t);
      }
      setTranscript((base ? base + ' ' : '') + final + interim);
    };
    sr.onerror = () => {};
    sr.start();
    srRef.current = sr;
  };

  const stopSR = () => {
    if (srRef.current) { srRef.current.stop(); srRef.current = null; }
  };

  const startMR = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mrRef.current = mr;
    } catch { /* microphone permission denied */ }
  };

  const stopMR = () => {
    if (mrRef.current && mrRef.current.state !== 'inactive') mrRef.current.stop();
    mrRef.current = null;
  };

  const handleMic = () => {
    if (isRecording) {
      stopSR();
      stopMR();
      baseTranscriptRef.current = transcript;
      setIsRecording(false);
      setHasRecorded(true);
    } else {
      setAudioUrl(null);
      startSR();
      startMR();
      setIsRecording(true);
      setHasRecorded(false);
    }
  };

  const handleSubmit = () => {
    const elapsed = MAX_SECS - timeLeft;
    const r = evaluateSpeech(transcript, elapsed);
    const moduleId = location.state?.moduleId ?? 'speaking-test';
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
    setResult({ ...r, attemptNo });
    setPhase('result');
  };

  const handleRedo = () => {
    stopSR();
    stopMR();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    baseTranscriptRef.current = '';
    setPhase('test');
    setIsRecording(false);
    setHasRecorded(false);
    setTimeLeft(MAX_SECS);
    setTranscript('');
    setAudioUrl(null);
    setResult(null);
  };

  /* ── Result Screen ──────────────────────────────────────────── */
  if (phase === 'result' && result) {
    const { score, badge, badgeDesc, skills, strengths, areas, duration, date, wordCount, wpm, attemptNo } = result;
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

          <h1 className="spk-result-title">{moduleTitle}: {TOPIC.split(' ').slice(0, 4).join(' ')}…</h1>
          <p className="spk-result-meta">
            Completed on {date}&nbsp;•&nbsp;Duration: {duration}&nbsp;•&nbsp;{wordCount} words&nbsp;{wpm > 0 ? `• ${wpm} wpm` : ''}
          </p>

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

          {/* Transcription */}
          <div className="spk-result-card">
            <div className="spk-card-header">
              <span className="spk-card-icon">🎙️</span>
              <span className="spk-card-title">Your Speech Transcript</span>
            </div>
            {audioUrl
              ? <WaveformPlayer src={audioUrl} />
              : <p className="spk-no-audio">Audio not available — microphone access was not granted.</p>
            }
            <p className="spk-transcript-label" style={{ marginTop: 14 }}>TRANSCRIPTION</p>
            <div className="spk-transcript-box">
              <p>{transcript || 'No speech was captured.'}</p>
            </div>
          </div>

          <button className="spk-redo-btn" onClick={handleRedo}>
            <FiRefreshCw /> Redo Assessment
          </button>
          <div className="assessment-result-actions">
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
  return (
    <StudentShell onSignOut={onSignOut}>
      <main className="course-shell techskills-shell">
      <section className="course-phone-panel techskills-panel spk-panel">
        <div className="course-phone-topbar">
          <button className="mcq-topbar-back" onClick={() => navigate('/assessment/communication')}>
            <FiArrowLeft />
          </button>
          <span>Speaking Task</span>
        </div>

        {/* <h1 className="spk-heading">Speaking Task</h1> */}

        <div className="spk-challenge-card">
          <p className="spk-challenge-label">💡 COMMUNICATION CHALLENGE</p>
          <p className="spk-challenge-text">{CHALLENGE}</p>
          <div className="spk-guidelines-box">
            <p className="spk-guidelines-label">ℹ️ RECORDING GUIDELINES</p>
            <p className="spk-guidelines-text">{GUIDELINES}</p>
          </div>
        </div>

        
    
        <div className="spk-timer-row">
            <p className="spk-status-text">
          {isRecording ? 'L I S T E N I N G' : hasRecorded ? 'S T A R T' : 'S T A R T'}
        </p>
          
          <span className="spk-timer">⏱ {fmtTime(timeLeft)}</span>
        </div>

      

        <div className="spk-mic-wrap">
          <button
            className={`spk-mic-btn${isRecording ? ' spk-mic-active' : ''}`}
            onClick={handleMic}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <FiMic />
          </button>
        </div>

        <div className={`spk-live-transcript${isRecording ? ' spk-live-active' : ''}`}>
          {transcript
            ? <p className="spk-live-text">{transcript}</p>
            : <p className="spk-live-placeholder">Recording speech will be visible here...</p>
          }
        </div>

        <div className="spk-insight-card">
          <div className="spk-insight-icon">✨</div>
          <div className="spk-insight-body">
            <p className="spk-insight-label">AI INSIGHT: STAR METHOD</p>
            <p className="spk-insight-text">
              Organize your answer: <b>S</b>ituation, <b>T</b>ask,{' '}
              <b>A</b>ction, and <b>R</b>esult for maximum clarity.
            </p>
          </div>
        </div>

        <button
          className="spk-submit-btn"
          disabled={!hasRecorded}
          onClick={handleSubmit}
        >
          ☁️ SUBMIT
        </button>
      </section>
      </main>
    </StudentShell>
  );
}
