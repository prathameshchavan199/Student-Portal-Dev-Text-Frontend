import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FiAlertTriangle, FiArrowLeft, FiCheck, FiChevronLeft,
  FiChevronRight, FiClock, FiCamera, FiCameraOff, FiEyeOff,
  FiDownload, FiMic, FiMicOff,
} from 'react-icons/fi';
import * as faceapi from 'face-api.js';
import StudentShell from '../components/StudentShell.jsx';
import { assessmentQuestions } from './assessmentQuestions.js';
import { getCourseById } from './courseData.js';
import { downloadAssessmentCertificate } from '../utils/certificate.js';

const RELATED_COURSE = {
  'data-structures':    'fullstack-lab',
  'web-development':    'react-essentials',
  'algorithms':         'fullstack-lab',
  'databases':          'data-science-bootcamp',
  'oop':                'advanced-react-patterns',
  'system-design':      'cloud-computing-masterclass',
  'logical-reasoning':  'data-science-bootcamp',
  'numerical-aptitude': 'data-science-bootcamp',
  'pattern-recognition':'data-science-bootcamp',
  'verbal-reasoning':   'fullstack-lab',
  'critical-thinking':  'cloud-computing-masterclass',
  'decision-making':    'cloud-computing-masterclass',
  'network-security':   'cybersecurity-essentials',
  'secure-coding':      'cybersecurity-essentials',
  'threat-analysis':    'cybersecurity-essentials',
  'cryptography':       'cybersecurity-essentials',
  'incident-response':  'cybersecurity-essentials',
  'owasp':              'cybersecurity-essentials',
  'sql-fundamentals':   'data-science-bootcamp',
  'data-analysis':      'data-science-bootcamp',
  'data-visualization': 'data-science-bootcamp',
  'statistics':         'data-science-bootcamp',
  'ml-basics':          'data-science-bootcamp',
  'big-data':           'cloud-computing-masterclass',
};

const CATEGORY_FALLBACK = {
  'technical-skills': 'fullstack-lab',
  'problem-solving':  'data-science-bootcamp',
  'cybersecurity':    'cybersecurity-essentials',
  'data-skills':      'data-science-bootcamp',
  'communication':    'fullstack-lab',
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const WARNINGS = {
  'camera-covered': { Icon: FiCameraOff,     title: 'Camera Blocked',          body: 'Your camera is covered or blocked. Please uncover it to continue.' },
  'tab-switch':     { Icon: FiAlertTriangle, title: 'Tab Switch Detected',     body: 'You switched tabs or minimized the window. This activity is recorded.' },
  'no-face':        { Icon: FiEyeOff,        title: 'No Face Detected',        body: 'No face found in the frame. Please ensure your face is clearly visible to the camera.' },
  'multiple-faces': { Icon: FiAlertTriangle, title: 'Multiple Faces Detected', body: 'More than one person detected. Only the exam candidate is allowed in frame.' },
  'gaze-offscreen': { Icon: FiEyeOff,        title: 'Looking Away',            body: 'Your gaze appears to be off-screen. Keep your eyes focused on the test.' },
  'head-rotation':  { Icon: FiEyeOff,        title: 'Head Rotation Detected',  body: 'Sideways head rotation detected. Please face the camera straight on.' },
  'head-jump':      { Icon: FiAlertTriangle, title: 'Sudden Head Movement',    body: 'A sudden head movement was detected. Avoid turning your head quickly during the assessment.' },
  'face-profile':   { Icon: FiEyeOff,        title: 'Profile View Detected',   body: 'Your face appears to be in profile. Turn to face the camera directly.' },
  'movement':       { Icon: FiAlertTriangle, title: 'Excessive Movement',      body: 'Please remain still and focused on the assessment.' },
  'face-mismatch':  { Icon: FiAlertTriangle, title: 'Identity Mismatch',        body: 'The person in the camera does not match the registered student. This violation has been recorded.' },
  'loud-speech':    { Icon: FiMic,           title: 'Audio Detected',            body: 'Speaking or noise detected. Do not read questions aloud during the assessment.' },
};

export default function McqTest({ onSignOut }) {
  const { category } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const moduleId      = state?.moduleId    ?? null;
  const moduleTitle   = state?.moduleTitle ?? null;
  const relatedCourse = getCourseById(
    RELATED_COURSE[moduleId] ?? CATEGORY_FALLBACK[category] ?? 'fullstack-lab'
  );

  const wasReload = false;
  const savedState = null;

  // ── Camera / proctoring state ──────────────────────────────────
  const [camStatus, setCamStatus]         = useState('requesting'); // 'requesting' | 'granted' | 'denied'
  const [activeWarnings, setActiveWarnings] = useState([]);          // array of active WARNINGS keys
  const [warningCount, setWarningCount]   = useState(savedState?.warningCount ?? 0);
  const [paused, setPaused]             = useState(false);
  const [fsBlocked, setFsBlocked]       = useState(false);
  const [terminated, setTerminated]     = useState(false);
  const [resumeNeeded, setResumeNeeded] = useState(wasReload);     // true when page was reloaded mid-test
  const [step, setStep] = useState(wasReload ? 'ready' : 'verify'); // 'verify' | 'ready'
  const [micStatus, setMicStatus] = useState('requesting'); // 'requesting' | 'granted' | 'denied'

  // ── Test state ─────────────────────────────────────────────────
  const [currentSection, setCurrentSection] = useState(savedState?.currentSection ?? 0);
  const [answers, setAnswers]     = useState(savedState?.answers ?? {});
  const [timeLeft, setTimeLeft]   = useState(savedState?.timeLeft ?? 30 * 60);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore]         = useState(null);
  const [certificateAttemptNo, setCertificateAttemptNo] = useState(1);
  const [showBlocker, setShowBlocker] = useState(false);
  const [pendingNav, setPendingNav]   = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  const submittedRef     = useRef(false);
  const pausedRef        = useRef(false);
  const fsBlockedRef     = useRef(false);
  const terminatedRef    = useRef(false);
  const resumeNeededRef  = useRef(wasReload);
  const fsEnteredTimeRef = useRef(null);  // tracks when fullscreen was entered (blur grace period)
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const streamRef     = useRef(null);
  const faceapiReadyRef = useRef(false); // true once face-api.js models are loaded
  const noFaceMissRef   = useRef(0);     // consecutive ticks with no face detected
  const prevBBoxRef   = useRef(null);   // previous face bounding-box centre
  const prevFrameRef  = useRef(null);   // previous raw pixel data (fallback motion)
  const warnTimersRef = useRef({});
  const verifyVideoRef        = useRef(null);
  const refDescriptorRef      = useRef(null);  // face descriptor extracted from captured photo
  const faceRecognitionReadyRef = useRef(false); // true once faceRecognitionNet is loaded
  const faceMatchTickRef      = useRef(0);      // counts ticks to throttle identity checks
  const micStreamRef   = useRef(null);
  const audioCtxRef    = useRef(null);
  const analyserRef    = useRef(null);
  const audioLoudRef   = useRef(0);             // consecutive loud-audio ticks

  const data = assessmentQuestions[category];

  const fsSupported = !!(
    document.documentElement.requestFullscreen ||
    document.documentElement.webkitRequestFullscreen ||
    document.documentElement.mozRequestFullScreen
  );

  const enterFullscreen = () => {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen)
      ?.call(el)?.catch(() => {});
  };

  const isIOS    = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  // iOS has no Fullscreen API — allow the test but lock via visibilitychange instead
  const canRunTest = fsSupported || isMobile;

  // Toggle body class so CSS can reach .dash-wrap (ancestor — CSS can't select upward)
  useEffect(() => {
    document.body.classList.add('mcq-active');
    return () => document.body.classList.remove('mcq-active');
  }, []);

  // Persist test state so it survives a page reload
  useEffect(() => {
    if (submitted || terminated || camStatus !== 'granted' || step !== 'ready') return;
    try {
      sessionStorage.setItem(`mcq-state-${category}`, JSON.stringify({ answers, timeLeft, currentSection, warningCount }));
    } catch {}
  }, [answers, timeLeft, currentSection, warningCount, category, submitted, terminated, camStatus, step]);

  // Clear session keys when the test ends normally
  useEffect(() => {
    if (submitted || terminated) {
      sessionStorage.removeItem('mcq-active');
      sessionStorage.removeItem(`mcq-state-${category}`);
    }
  }, [submitted, terminated, category]);

  // ── 1a. Load face-api.js models from /public/models ───────────
  useEffect(() => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
    ])
      .then(() => { faceapiReadyRef.current = true; })
      .catch(() => { /* falls back to motion detection */ });

    // Load recognition net independently — if absent, identity check is silently skipped
    faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      .then(() => { faceRecognitionReadyRef.current = true; })
      .catch(() => {});
  }, []);

  // ── 1. Request camera on mount ─────────────────────────────────
  useEffect(() => {
    if (!canRunTest) return;
    let active = true;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 }, audio: false })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        setCamStatus('granted');
      })
      .catch(() => { if (active) setCamStatus('denied'); });

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Attach stream to verify preview during identity step
  useEffect(() => {
    if (camStatus === 'granted' && step === 'verify' && verifyVideoRef.current && streamRef.current) {
      verifyVideoRef.current.srcObject = streamRef.current;
    }
  }, [camStatus, step]);

  // Attach stream to cam bubble once test starts
  useEffect(() => {
    if (camStatus === 'granted' && step === 'ready' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [camStatus, step]);

  // ── 1c. Request microphone access on mount ─────────────────────
  useEffect(() => {
    if (!canRunTest) return;
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        micStreamRef.current = stream;
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(stream).connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        setMicStatus('granted');
      })
      .catch(() => { if (active) setMicStatus('denied'); });
    return () => {
      active = false;
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  // ── 2. Warning helpers ─────────────────────────────────────────
  const dismissWarning = useCallback((type) => {
    if (warnTimersRef.current[type]) {
      clearTimeout(warnTimersRef.current[type]);
      delete warnTimersRef.current[type];
    }
    setActiveWarnings(prev => prev.filter(k => k !== type));
  }, []);

  const triggerWarning = useCallback((type) => {
    if (submittedRef.current) return;
    setWarningCount(c => c + 1);
    // Reset dismiss timer for this type if already shown
    if (warnTimersRef.current[type]) clearTimeout(warnTimersRef.current[type]);
    // Add to stack (deduplicated by key)
    setActiveWarnings(prev => prev.includes(type) ? prev : [...prev, type]);
    // Auto-dismiss after 6 s
    warnTimersRef.current[type] = setTimeout(() => {
      setActiveWarnings(prev => prev.filter(k => k !== type));
      delete warnTimersRef.current[type];
    }, 6000);
  }, []);

  // ── 2a. Audio monitoring loop — detects loud speech during exam ─
  useEffect(() => {
    if (micStatus !== 'granted' || submitted || step !== 'ready') return;
    const id = setInterval(() => {
      if (!analyserRef.current || submittedRef.current) return;
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length);
      if (rms > 25) {
        audioLoudRef.current += 1;
        if (audioLoudRef.current >= 2) {
          triggerWarning('loud-speech');
          audioLoudRef.current = 0;
        }
      } else {
        audioLoudRef.current = Math.max(0, audioLoudRef.current - 1);
      }
    }, 800);
    return () => clearInterval(id);
  }, [micStatus, submitted, step, triggerWarning]);

  // ── 3. Face / motion detection loop (every 2.5 s) ──────────────
  useEffect(() => {
    if (camStatus !== 'granted' || submitted || step !== 'ready') return;

    // Fallback: pixel-diff motion detection when FaceDetector unavailable
    const runMotion = (ctx, canvas) => {
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      if (prevFrameRef.current) {
        let changed = 0;
        const total = frame.length / 4;
        for (let i = 0; i < frame.length; i += 4) {
          if (
            Math.abs(frame[i]   - prevFrameRef.current[i])   +
            Math.abs(frame[i+1] - prevFrameRef.current[i+1]) +
            Math.abs(frame[i+2] - prevFrameRef.current[i+2]) > 55
          ) changed++;
        }
        // >10 % of pixels changed → movement detected (stricter than before)
        if (changed / total > 0.10) triggerWarning('movement');
      }
      prevFrameRef.current = new Uint8Array(frame);
    };

    const tick = async () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext('2d');
      canvas.width  = video.videoWidth  || 320;
      canvas.height = video.videoHeight || 240;
      ctx.drawImage(video, 0, 0);

      // Covered-camera check: average luminance below 15 means near-black frame
      const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let bright = 0;
      for (let i = 0; i < frameData.length; i += 4) {
        bright += frameData[i] * 0.299 + frameData[i + 1] * 0.587 + frameData[i + 2] * 0.114;
      }
      if (bright / (frameData.length / 4) < 15) {
        if (!pausedRef.current) {
          pausedRef.current = true;
          setPaused(true);
          setWarningCount(c => c + 1);
          // Cancel any pending auto-dismiss and pin the warning until camera is uncovered
          if (warnTimersRef.current['camera-covered']) {
            clearTimeout(warnTimersRef.current['camera-covered']);
            delete warnTimersRef.current['camera-covered'];
          }
          setActiveWarnings(prev => prev.includes('camera-covered') ? prev : [...prev, 'camera-covered']);
        }
        return;
      }
      // Camera uncovered — resume and clear the pinned warning
      if (pausedRef.current) {
        pausedRef.current = false;
        setPaused(false);
        setActiveWarnings(prev => prev.filter(k => k !== 'camera-covered'));
      }

      if (faceapiReadyRef.current) {
        try {
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }))
            .withFaceLandmarks(true);

          if (detections.length === 0) {
            noFaceMissRef.current += 1;
            if (noFaceMissRef.current >= 3) triggerWarning('no-face');
            prevBBoxRef.current = null;
          } else if (detections.length > 1) {
            noFaceMissRef.current = 0;
            triggerWarning('multiple-faces');
          } else {
            noFaceMissRef.current = 0;
            const { detection, landmarks } = detections[0];
            const box = detection.box;
            const cx  = (box.x + box.width  / 2) / canvas.width;
            const cy  = (box.y + box.height / 2) / canvas.height;

            // 1. Face drifted toward any edge → off-screen gaze
            if (cx < 0.25 || cx > 0.75 || cy < 0.15 || cy > 0.85) {
              triggerWarning('gaze-offscreen');
              prevBBoxRef.current = { cx, cy, w: box.width };
              return;
            }

            // 2. Eye-span ratio — detects sideways head rotation
            if (landmarks) {
              const le = landmarks.getLeftEye();
              const re = landmarks.getRightEye();
              const lx = le.reduce((s, p) => s + p.x, 0) / le.length;
              const rx = re.reduce((s, p) => s + p.x, 0) / re.length;
              const eyeRatio = Math.abs(lx - rx) / box.width;
              // Straight-on ~0.45; below 0.30 = notable sideways rotation
              if (eyeRatio < 0.30) {
                triggerWarning('head-rotation');
                prevBBoxRef.current = { cx, cy, w: box.width };
                return;
              }
            }

            // 3. Frame-to-frame checks
            if (prevBBoxRef.current) {
              const dx = Math.abs(cx - prevBBoxRef.current.cx);
              const dy = Math.abs(cy - prevBBoxRef.current.cy);
              if (dx > 0.05 || dy > 0.05) {
                triggerWarning('head-jump');
                prevBBoxRef.current = { cx, cy, w: box.width };
                return;
              }
              const sizeRatio = box.width / (prevBBoxRef.current.w || box.width);
              if (sizeRatio < 0.75) {
                triggerWarning('face-profile');
                prevBBoxRef.current = { cx, cy, w: box.width };
                return;
              }
            }

            prevBBoxRef.current = { cx, cy, w: box.width };

            // Identity check every 5 ticks (~7.5 s) — compare live face to captured reference
            faceMatchTickRef.current += 1;
            if (
              refDescriptorRef.current &&
              faceRecognitionReadyRef.current &&
              faceMatchTickRef.current % 5 === 0
            ) {
              try {
                const liveDet = await faceapi
                  .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }))
                  .withFaceLandmarks(true)
                  .withFaceDescriptor();
                if (liveDet) {
                  const dist = faceapi.euclideanDistance(refDescriptorRef.current, liveDet.descriptor);
                  if (dist > 0.55) triggerWarning('face-mismatch');
                }
              } catch {}
            }
          }
        } catch (_) {
          runMotion(ctx, canvas);
        }
      } else {
        runMotion(ctx, canvas);
      }
    };

    const id = setInterval(tick, 1500); // check every 1.5 s (was 2.5 s)
    return () => clearInterval(id);
  }, [camStatus, submitted, step, triggerWarning]);

  // ── 4. Countdown (starts only after camera is granted) ─────────
  useEffect(() => {
    if (!data || camStatus !== 'granted' || step !== 'ready' || submitted) return;
    const id = setInterval(() => {
      if (pausedRef.current || fsBlockedRef.current || terminatedRef.current || resumeNeededRef.current) return;
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id);
          if (!submittedRef.current) { submittedRef.current = true; setSubmitted(true); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!data, camStatus, step, submitted]);

  // ── 5. Navigation blocker ──────────────────────────────────────
  const onBeforeNav = useCallback((path) => {
    if (!submittedRef.current) { setPendingNav(path); setShowBlocker(true); return false; }
  }, []);

  useEffect(() => {
    const h = e => { if (!submittedRef.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, []);

  // ── 6. Fullscreen exit detection (covers tab-switch + minimise) ──
  useEffect(() => {
    if (submitted) return;
    const onFsChange = () => {
      const inFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!inFs && !submittedRef.current && !terminatedRef.current) {
        fsBlockedRef.current = true;
        setFsBlocked(true);
        setWarningCount(c => c + 1);
      } else if (inFs) {
        fsEnteredTimeRef.current = Date.now(); // record entry time for blur grace period
        fsBlockedRef.current = false;
        setFsBlocked(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, [submitted]);

  // ── 7. Alt+Tab termination — window.blur fires when OS focus leaves the browser ──
  useEffect(() => {
    if (camStatus !== 'granted' || submitted) return;
    const onBlur = () => {
      if (submittedRef.current || terminatedRef.current) return;
      // Grace period: ignore blur within 600ms of entering fullscreen (requestFullscreen briefly blurs)
      if (fsEnteredTimeRef.current && Date.now() - fsEnteredTimeRef.current < 600) return;
      terminatedRef.current = true;
      setTerminated(true);
      streamRef.current?.getTracks().forEach(t => t.stop());
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      document.exitFullscreen?.().catch(() => {});
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [camStatus, submitted]);

  // ── 8. Mobile: visibilitychange → terminate when user switches apps ──
  useEffect(() => {
    if (camStatus !== 'granted' || submitted || !isMobile) return;
    const onVis = () => {
      if (!document.hidden) return;
      if (submittedRef.current || terminatedRef.current) return;
      terminatedRef.current = true;
      setTerminated(true);
      streamRef.current?.getTracks().forEach(t => t.stop());
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close().catch(() => {});
      document.exitFullscreen?.().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [camStatus, submitted]);

  if (!data) return <Navigate to="/assessment" replace />;

  const { testTitle, sections } = data;
  const totalQuestions    = sections.reduce((s, sec) => s + sec.questions.length, 0);
  const totalPoints       = totalQuestions * 2;
  const section           = sections[currentSection];
  const sectionStartIndex = sections.slice(0, currentSection).reduce((s, sec) => s + sec.questions.length, 0);
  const totalAnswered     = Object.keys(answers).length;

  const handleAnswer = (qid, idx) => { if (submitted || paused || fsBlocked || terminated || resumeNeeded) return; setAnswers(p => ({ ...p, [qid]: idx })); };

  const handleResume = () => {
    if (fsSupported) enterFullscreen();
    resumeNeededRef.current = false;
    setResumeNeeded(false);
  };

  const handleSubmit = () => {
    let correct = 0;
    sections.forEach(sec => sec.questions.forEach(q => { if (answers[q.id] === q.correct) correct++; }));
    let attemptNo = 1;
    setScore(correct);
    submittedRef.current = true;
    setSubmitted(true);
    streamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    document.exitFullscreen?.().catch(() => {});

    const attemptKey = moduleId ?? category;
    if (attemptKey) {
      try {
        const raw = localStorage.getItem('assessment-attempts');
        const all = raw ? JSON.parse(raw) : {};
        const prev = all[attemptKey] ?? [];
        attemptNo = prev.length + 1;
        if (prev.length < 3) {
          const now = new Date();
          all[attemptKey] = [...prev, {
            correct,
            totalQuestions,
            date: now.toISOString().split('T')[0],
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }];
          localStorage.setItem('assessment-attempts', JSON.stringify(all));
        }
      } catch {}
    }
    setCertificateAttemptNo(attemptNo);
  };

  const handleDownloadCertificate = () => {
    downloadAssessmentCertificate({
      assessmentName: moduleTitle ?? testTitle,
      score,
      totalScore: totalQuestions,
      attemptNo: certificateAttemptNo,
    });
  };

  const handleCapture = async () => {
    const video = verifyVideoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.8));

    // Extract face descriptor to use as reference during the exam
    if (faceRecognitionReadyRef.current) {
      try {
        const det = await faceapi
          .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }))
          .withFaceLandmarks(true)
          .withFaceDescriptor();
        if (det) refDescriptorRef.current = det.descriptor;
      } catch {}
    }
  };

  const handleStartTest = () => {
    sessionStorage.setItem('mcq-active', '1');
    if (fsSupported) {
      const el = document.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen)
        ?.call(el)?.catch(() => {});
    }
    setStep('ready');
  };

  const handleBackBtn = () => {
    const target = `/assessment/${category}`;
    if (!submittedRef.current) { setPendingNav(target); setShowBlocker(true); } else { navigate(target); }
  };

  return (
    <StudentShell onSignOut={onSignOut} onBeforeNav={onBeforeNav}>
      {/* Hidden canvas used for face / motion detection */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── Browser fullscreen not supported (desktop-only gate) ── */}
      {!canRunTest && (
        <div className="mcq-cam-gate">
          <div className="mcq-cam-gate-card">
            <div className="mcq-cam-gate-icon error"><FiAlertTriangle /></div>
            <h3>Browser Not Supported</h3>
            <p>This assessment requires fullscreen mode, which your browser does not support. Please use the latest version of Google Chrome, Firefox, or Microsoft Edge.</p>
          </div>
        </div>
      )}

      {/* ── Resume overlay after page reload ──────────────────────── */}
      {resumeNeeded && !terminated && (
        <div className="mcq-fs-blocker">
          <div className="mcq-fs-blocker-box">
            <FiAlertTriangle size={52} />
            <h2>Resume Your Test</h2>
            <p>Your test session was restored. Click below to re-enter fullscreen and continue where you left off.</p>
            <p className="mcq-terminated-sub">Your previous answers and remaining time have been saved.</p>
            <button className="mcq-fs-blocker-btn" onClick={handleResume}>
              Resume Test →
            </button>
          </div>
        </div>
      )}

      {/* ── Exam terminated (Alt+Tab detected) ────────────────────── */}
      {terminated && (
        <div className="mcq-fs-blocker">
          <div className="mcq-fs-blocker-box">
            <FiAlertTriangle size={52} />
            <h2>Exam Terminated</h2>
            <p>You switched away from the exam window during the test. This action is not permitted.</p>
            <p className="mcq-terminated-sub">Please return to the assessment page and restart the exam.</p>
            <button className="mcq-fs-blocker-btn" onClick={() => { document.exitFullscreen?.().catch(() => {}); navigate(`/assessment/${category}`); }}>
              Go to Assessment
            </button>
          </div>
        </div>
      )}

      {/* ── Fullscreen exit blocker ────────────────────────── */}
      {fsBlocked && !submitted && !terminated && (
        <div className="mcq-fs-blocker">
          <div className="mcq-fs-blocker-box">
            <FiAlertTriangle size={52} />
            <h2>Test Paused</h2>
            <p>You exited fullscreen mode. Please return to fullscreen to continue your test. This violation has been recorded.</p>
            <div style={{display:'flex', justifyContent: 'space-between'}}>
            <button className="mcq-fs-blocker-btn" onClick={enterFullscreen}>
              Return Fullscreen
            </button>
            <button
              type="button"
              className="mcq-exit-btn" style={{marginLeft:'20px'}}
              onClick={() => { document.exitFullscreen?.().catch(() => {}); navigate(`/assessment/${category}`); }}
            >
              Quit Exam
            </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Camera permission gate ─────────────────────────── */}
      {canRunTest && camStatus !== 'granted' && (
        <div className="mcq-cam-gate">
          <div className="mcq-cam-gate-card">
            {camStatus === 'requesting' ? (
              <>
                <div className="mcq-cam-gate-icon spin"><FiCamera /></div>
                <h3>Setting Up Secure Environment</h3>
                <p>Camera and microphone access are required to start the assessment. Please allow both when prompted.</p>
              </>
            ) : (
              <>
                <div className="mcq-cam-gate-icon error"><FiCameraOff /></div>
                <h3>Camera Access Required</h3>
                <p>This proctored assessment requires camera access. Enable your camera in browser settings and reload the page.</p>
                <button className="mcq-nav-btn mcq-nav-next" style={{ marginTop: 8 }} onClick={() => window.location.reload()}>
                  Retry
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Identity verification + instructions ────────────── */}
      {canRunTest && camStatus === 'granted' && step === 'verify' && (
        <div className="mcq-cam-gate">
          <div className="mcq-verify-card">
            <button
              type="button"
              className="mcq-verify-close"
              aria-label="Close"
              onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); navigate(`/assessment/${category}`); }}
            >
              ✕
            </button>

            <div className="mcq-verify-header">
              <div className="mcq-cam-gate-icon"><FiCamera /></div>
              <h3>Verify Your Identity</h3>
            </div>

            <div className="mcq-verify-body">
              {/* ── Left column: camera + capture ── */}
              <div className="mcq-verify-col-cam">
                <div className="mcq-verify-cam-wrap" style={{ display: capturedPhoto ? 'none' : 'flex' }}>
                  <video ref={verifyVideoRef} autoPlay muted playsInline className="mcq-verify-video" />
                  <button type="button" className="mcq-capture-btn" onClick={handleCapture}>
                    <FiCamera /> Capture Photo
                  </button>
                </div>

                {capturedPhoto && (
                  <div className="mcq-verify-photo-col">
                    <img src={capturedPhoto} alt="Captured" className="mcq-verify-photo-large" />
                    <span className="mcq-verify-captured-label">✓ Photo captured</span>
                    <button type="button" className="mcq-capture-btn mcq-capture-retake" onClick={() => setCapturedPhoto(null)}>
                      <FiCamera /> Retake
                    </button>
                  </div>
                )}
              </div>

              {/* ── Right column: instructions + start ── */}
              <div className="mcq-verify-col-info">
                <div className="mcq-verify-instructions">
                  <h4>Instructions — Read before starting</h4>
                  <ol>
                    <li>Ensure you are in a <strong>well-lit, quiet environment</strong>.</li>
                    <li>Keep your face clearly visible in the camera <strong>throughout the test</strong>.</li>
                    <li><strong>Do not switch tabs or minimize the window</strong> — this will terminate your test.</li>
                    <li><strong>No other person</strong> should be present in the camera frame.</li>
                    <li>Do not use any <strong>external resources, notes, or devices</strong>.</li>
                    <li>The test runs in <strong>fullscreen mode</strong> — exiting will pause the timer.</li>
                    <li>Once started, the <strong>timer cannot be stopped or paused</strong>.</li>
                    <li><strong>Do not read questions aloud</strong> — your microphone is monitored.</li>
                  </ol>
                </div>

                <button
                  type="button"
                  className="mcq-verify-start-btn"
                  onClick={handleStartTest}
                  disabled={!capturedPhoto}
                >
                  Start Test →
                </button>
                {!capturedPhoto && (
                  <p className="mcq-verify-status">Capture your photo to enable the start button.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Nav-leave blocker ──────────────────────────────── */}
      {showBlocker && (
        <div className="mcq-blocker-overlay">
          <div className="mcq-blocker-modal">
            <div className="mcq-blocker-icon"><FiAlertTriangle /></div>
            <h3>Leave Assessment?</h3>
            <p>You are leaving a task incomplete. Do you really want to quit?</p>
            <div className="mcq-blocker-actions">
              <button type="button" className="mcq-blocker-stay" onClick={() => { setShowBlocker(false); setPendingNav(null); }}>Stay</button>
              <button type="button" className="mcq-blocker-quit" onClick={() => {
                setShowBlocker(false);
                document.exitFullscreen?.().catch(() => {});
                if (pendingNav === '__logout__') { onSignOut?.(); } else { navigate(pendingNav ?? `/assessment/${category}`); }
              }}>Quit</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Proctoring warning toasts (stacked) ──────────── */}
      {activeWarnings.length > 0 && (
        <div className="mcq-warnings-stack">
          {activeWarnings.map((key, idx) => {
            const w = WARNINGS[key];
            if (!w) return null;
            return (
              <div key={key} className="mcq-proof-warning">
                <w.Icon className="mcq-proof-warning-icon" />
                <div className="mcq-proof-warning-content">
                  <div className="mcq-proof-warning-title">{w.title}</div>
                  <div className="mcq-proof-warning-body">{w.body}</div>
                  {idx === activeWarnings.length - 1 && warningCount >= 3 && (
                    <div className="mcq-proof-warning-count">Warning #{warningCount} — repeated violations may affect your result.</div>
                  )}
                </div>
                <button type="button" className="mcq-proof-warning-close" onClick={() => dismissWarning(key)}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      <main className="course-shell mcq-shell">
        <div className="mcq-header-panel">
            <div className="mcq-topbar">
              <button type="button" className="mcq-topbar-back" aria-label="Back to modules" onClick={handleBackBtn}>
                <FiArrowLeft />
              </button>
              <span className="mcq-topbar-title">{testTitle}</span>
              <div className="mcq-cam-bubble">
                {camStatus === 'granted' && step === 'ready'
                  ? <video ref={videoRef} autoPlay muted playsInline />
                  : <div className="mcq-cam-bubble-off"><FiCameraOff /></div>
                }
                <div className={`mcq-cam-dot ${camStatus === 'granted' && step === 'ready' ? 'live' : 'off'}`} />
              </div>
            </div>

            {camStatus === 'granted' && (
              <>
                <div className="mcq-infobar">
                  <div className="mcq-infobar-left">
                    <span className="mcq-section-tag">{moduleTitle ?? section.label}</span>
                    <span className="mcq-section-step">Section {currentSection + 1} of {sections.length}</span>
                  </div>
                  <span className={`mcq-timer${timeLeft < 300 ? ' mcq-timer-warn' : ''}`}>
                    <FiClock />{formatTime(timeLeft)}
                  </span>
                </div>

                <div className="mcq-progress-block">
                  <div className="mcq-progress-labels">
                    <span>Questions {sectionStartIndex + 1}–{sectionStartIndex + section.questions.length} of {totalQuestions}</span>
                    <span>Section Progress</span>
                  </div>
                  <div className="mcq-progress-track">
                    <div className="mcq-progress-fill" style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }} />
                  </div>
                </div>
              </>
            )}
          </div>
        <section className="course-phone-panel mcq-panel">

          {/* ── TOP PANEL: gradient header ─────────────────── */}
          

          {/* ── BOTTOM PANEL: questions + navigation ───────── */}
          {camStatus === 'granted' && (
            <div className="mcq-content-panel">
              {paused && (
                <div className="mcq-paused-overlay">
                  <div className="mcq-paused-box">
                    <FiCameraOff size={44} />
                    <h3>Test Paused</h3>
                    <p>Camera is covered or blocked. Uncover your camera to resume.</p>
                    <button
                      type="button"
                      className="mcq-exit-btn"
                      onClick={() => { document.exitFullscreen?.().catch(() => {}); navigate(`/assessment/${category}`); }}
                    >
                      Exit Test
                    </button>
                  </div>
                </div>
              )}
              {/* Question cards */}
              <div className="mcq-questions-list">
                {section.questions.map((q, qi) => {
                  const globalNum = sectionStartIndex + qi + 1;
                  const chosen = answers[q.id];
                  return (
                    <article className="mcq-question-card" key={q.id}>
                      <div className="mcq-q-header">
                        <span className="mcq-q-num">Q{globalNum}</span>
                        <span className="mcq-q-pts">{q.points.toFixed(1)} Pts</span>
                      </div>
                      <p className="mcq-q-text">{q.text}</p>
                      <div className="mcq-options-grid">
                        {q.options.map((opt, oi) => {
                          const isSelected = chosen === oi;
                          const isWrong    = submitted && isSelected && oi !== q.correct;
                          return (
                            <label key={oi} className={`mcq-option${isSelected ? ' selected' : ''}${isWrong ? ' wrong' : ''}`}>
                              <span className="mcq-radio-dot">
                                {isSelected && !submitted
                                    ? <span className="mcq-radio-inner" />
                                    : null}
                              </span>
                              <span className="mcq-option-text">{opt}</span>
                              <input type="radio" name={q.id} value={oi} checked={isSelected} onChange={() => handleAnswer(q.id, oi)} disabled={submitted || paused || fsBlocked} />
                            </label>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Section navigation */}
              <div className="mcq-nav-row">
                <button type="button" className="mcq-nav-btn mcq-nav-prev" onClick={() => setCurrentSection(s => s - 1)} disabled={currentSection === 0}>
                  <FiChevronLeft /> Previous
                </button>
                <div className="mcq-section-dots">
                  {sections.map((_, i) => (
                    <span key={i} className={`mcq-dot${i === currentSection ? ' active' : ''}${i < currentSection ? ' done' : ''}`} />
                  ))}
                </div>
                {currentSection < sections.length - 1 ? (
                  <button type="button" className="mcq-nav-btn mcq-nav-next" onClick={() => setCurrentSection(s => s + 1)}>
                    Next <FiChevronRight />
                  </button>
                ) : (
                  <button type="button" className="mcq-nav-btn mcq-submit-btn" onClick={handleSubmit} disabled={submitted}>
                    Submit <FiCheck />
                  </button>
                )}
              </div>

              {!submitted && (
                <div className="mcq-answer-progress">
                  <span>{totalAnswered}/{totalQuestions} answered</span>
                  <div className="mcq-answer-track">
                    <div style={{ width: `${(totalAnswered / totalQuestions) * 100}%` }} />
                  </div>
                </div>
              )}

              {submitted && score !== null && (
                <div className="mcq-score-panel">
                  <div className="mcq-score-ring">
                    <span className="mcq-score-value">{score}</span>
                    <span className="mcq-score-total">/{totalQuestions}</span>
                  </div>
                  <div className="mcq-score-label">Questions Correct</div>
                  <div className="mcq-score-pts">{(score * 2).toFixed(1)} <span>/ {totalPoints.toFixed(1)} Points</span></div>
                  <div className="mcq-score-pct">{Math.round((score / totalQuestions) * 100)}% Score</div>
                  <div className="assessment-result-actions mcq-result-actions">
                    <button type="button" className="mcq-score-back-btn" onClick={handleDownloadCertificate}>
                      <FiDownload /> Download Certificate
                    </button>
                    <button type="button" className="mcq-score-back-btn" onClick={() => navigate('/assessment')}>Back to Assessment</button>
                  </div>

                  <div className="mcq-recommended-course">
                    <div className="mcq-recommended-label">Recommended Course</div>
                    <div className="mcq-recommended-card">
                      <div className={`mcq-recommended-accent accent-${relatedCourse.accent ?? 'blue'}`} />
                      <div className="mcq-recommended-body">
                        <div className="mcq-recommended-tag">{relatedCourse.title}</div>
                        {/* <h4 className="mcq-recommended-title">{relatedCourse.title}</h4> */}
                        <p className="mcq-recommended-desc">{relatedCourse.description}</p>
                        <div className="mcq-recommended-meta">
                          <span>{relatedCourse.duration}</span>
                          <span>{relatedCourse.level}</span>
                          <span>₹{relatedCourse.price?.toLocaleString()}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mcq-recommended-btn"
                        onClick={() => navigate(`/courses/${relatedCourse.id}`)}
                      >
                        View Course
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </StudentShell>
  );
}
