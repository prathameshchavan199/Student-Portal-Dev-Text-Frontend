import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiDownload, FiMic, FiRefreshCw, FiPlay, FiPause } from 'react-icons/fi';
import axios from 'axios';
import { API_BASE_URL } from '../api/axiosSetup.js';
import StudentShell from '../components/StudentShell.jsx';
import { downloadAssessmentCertificate } from '../utils/certificate.js';

const MAX_SECS   = 120;
const GUIDELINES = 'Maximum 2 minutes. Focus on articulation, technical vocabulary, and clear structural flow.';

const WAVE_HEIGHTS = Array.from({ length: 22 }, (_, i) =>
  8 + Math.abs(Math.sin(i * 0.9 + 0.3)) * 16
);

function fmtTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
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
  const moduleId    = location.state?.moduleId ?? 'speaking-test';

  const [topicData,    setTopicData]    = useState(null);
  const [topicLoading, setTopicLoading] = useState(true);
  const [submitting,   setSubmitting]   = useState(false);

  const [phase,       setPhase]       = useState('test');
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [timeLeft,    setTimeLeft]    = useState(MAX_SECS);
  const [transcript,  setTranscript]  = useState('');
  const [audioUrl,    setAudioUrl]    = useState(null);
  const [result,      setResult]      = useState(null);

  const timerRef          = useRef(null);
  const srRef             = useRef(null);
  const mrRef             = useRef(null);
  const chunksRef         = useRef([]);
  const streamRef         = useRef(null);
  const baseTranscriptRef = useRef('');

  // Fetch a random topic on mount
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/communication/speaking/topic/random`)
      .then(res => {
        if (res.data?.success) setTopicData(res.data.data);
      })
      .catch(() => {
        // Fallback topic if backend unreachable
        setTopicData({
          id: null,
          topicText: 'The Future of Artificial Intelligence',
          challenge: 'Describe a time you solved a difficult technical problem.',
        });
      })
      .finally(() => setTopicLoading(false));
  }, []);

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

  const handleSubmit = async () => {
    const elapsed = MAX_SECS - timeLeft;
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/communication/speaking/submit?moduleId=${moduleId}`,
        {
          topicId: topicData?.id ?? null,
          transcript,
          elapsedSecs: elapsed,
        },
      );
      if (res.data?.success) {
        const data = res.data.data;
        setResult({ ...data, attemptNo: data.attemptNumber });
        setPhase('result');
      }
    } catch (err) {
      console.error('Speaking submit error:', err);
    } finally {
      setSubmitting(false);
    }
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
    // Fetch a fresh random topic on redo
    setTopicLoading(true);
    axios.get(`${API_BASE_URL}/api/communication/speaking/topic/random`)
      .then(res => { if (res.data?.success) setTopicData(res.data.data); })
      .catch(() => {})
      .finally(() => setTopicLoading(false));
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

          <h1 className="spk-result-title">
            {moduleTitle}: {topicData?.topicText?.split(' ').slice(0, 4).join(' ')}…
          </h1>
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
            {skills.map(({ label, pct, raw, max }) => (
              <div className="spk-skill-row" key={label}>
                <div className="spk-skill-top">
                  <span className="spk-skill-label">{label}</span>
                  <span className="spk-skill-pct">
                    {raw != null ? `${raw} / ${max}` : `${pct}%`}
                  </span>
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
  const challenge = topicLoading ? 'Loading your challenge…' : (topicData?.challenge ?? '');

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

        <div className="spk-challenge-card">
          <p className="spk-challenge-label">💡 COMMUNICATION CHALLENGE</p>
          <p className="spk-challenge-text">"{challenge}"</p>
          <div className="spk-guidelines-box">
            <p className="spk-guidelines-label">ℹ️ RECORDING GUIDELINES</p>
            <p className="spk-guidelines-text">{GUIDELINES}</p>
          </div>
        </div>

        <div className="spk-timer-row">
          <p className="spk-status-text">
            {isRecording ? 'L I S T E N I N G' : 'S T A R T'}
          </p>
          <span className="spk-timer">⏱ {fmtTime(timeLeft)}</span>
        </div>

        <div className="spk-mic-wrap">
          <button
            className={`spk-mic-btn${isRecording ? ' spk-mic-active' : ''}`}
            onClick={handleMic}
            disabled={topicLoading}
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
          disabled={!hasRecorded || submitting}
          onClick={handleSubmit}
        >
          {submitting ? '⏳ Evaluating…' : '☁️ SUBMIT'}
        </button>
      </section>
      </main>
    </StudentShell>
  );
}
