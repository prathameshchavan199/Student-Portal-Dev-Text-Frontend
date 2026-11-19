
// import { useEffect, useMemo, useRef, useState } from 'react';
// import { Navigate, useNavigate, useParams } from 'react-router-dom';
// import axios from 'axios';
// import {
//   FiArrowLeft,
//   FiAward,
//   FiCheck,
//   FiCheckCircle,
//   FiChevronDown,
//   FiChevronLeft,
//   FiChevronRight,
//   FiFileText,
//   FiHelpCircle,
//   FiLock,
//   FiPlayCircle,
//   FiX,
// } from 'react-icons/fi';
// import StudentShell from '../components/StudentShell.jsx';
// import { useCourses } from '../context/CourseContext.jsx';
// import { API_BASE_URL } from '../api/axiosSetup.js';

// const lessonKey = (moduleIndex, lessonIndex) => `${moduleIndex}-${lessonIndex}`;


// function normalizeLesson(raw) {
//   if (typeof raw === 'string') {
//     return { title: raw, duration: null, hasVideo: false, hasPdf: false, hasDoc: false, hasMcq: false, isPreview: false };
//   }
//   return {
//     title: raw?.title ?? 'Untitled lesson',
//     duration: raw?.duration ?? null,
//     hasVideo: Boolean(raw?.videoUrl || raw?.videoKey),
//     hasPdf: Boolean(raw?.pdfUrl || raw?.pdfKey),
//     hasDoc: Boolean(raw?.docUrl || raw?.docKey),
//     hasMcq: Boolean(raw?.mcq?.length),
//     isPreview: Boolean(raw?.isPreview),
//   };
// }


// function officeViewerUrl(docUrl) {
//   return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(docUrl)}`;
// }


// function KnowledgeCheckSlider({ questions, onFinish }) {
//   const [index, setIndex] = useState(0);
//   const [answers, setAnswers] = useState({});
//   const [submitted, setSubmitted] = useState(false);

//   useEffect(() => {
//     setIndex(0);
//     setAnswers({});
//     setSubmitted(false);
//   }, [questions]);

//   if (!questions || questions.length === 0) return null;

//   const total = questions.length;
//   const isLast = index === total - 1;
//   const q = questions[index];
//   const picked = answers[index];
//   const answeredCount = Object.keys(answers).length;
//   const score = questions.reduce((sum, qq, i) => (answers[i] === qq.correct ? sum + 1 : sum), 0);

//   const pick = (optionIdx) => {
//     if (submitted) return;
//     setAnswers((prev) => ({ ...prev, [index]: optionIdx }));
//   };

//   const handleFinish = () => {
//     setSubmitted(true);
//     onFinish?.(score, total);
//   };

//   if (submitted) {
//     const pct = Math.round((score / total) * 100);
//     return (
//       <div className="mcq-slider mcq-slider-result">
//         <div className="mcq-result-score">{pct}%</div>
//         <strong>{score} of {total} correct</strong>
//         <span>Nice work — you can review your answers below or move on to the next lesson.</span>
//         <button type="button" className="mcq-slider-retake" onClick={() => { setSubmitted(false); setIndex(0); }}>
//           Review answers
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="mcq-slider">
//       <div className="mcq-slider-progress">
//         <span>Question {index + 1} of {total}</span>
//         <div className="mcq-slider-dots">
//           {questions.map((_, i) => (
//             <button
//               type="button"
//               key={i}
//               className={`mcq-slider-dot ${i === index ? 'active' : ''} ${answers[i] !== undefined ? 'answered' : ''}`}
//               onClick={() => setIndex(i)}
//               aria-label={`Question ${i + 1}`}
//             />
//           ))}
//         </div>
//       </div>

//       <div className="mcq-slider-question">{q.text}</div>

//       <div className="mcq-slider-options">
//         {q.options.map((opt, oi) => {
//           const isPicked = picked === oi;
//           const isCorrect = picked !== undefined && oi === q.correct;
//           const isWrong = isPicked && oi !== q.correct;
//           return (
//             <button
//               type="button"
//               key={oi}
//               className={`mcq-slider-option ${isPicked ? 'picked' : ''} ${isCorrect && picked !== undefined ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
//               onClick={() => pick(oi)}
//               disabled={picked !== undefined}
//             >
//               <span>{opt}</span>
//               {isCorrect && picked !== undefined && <FiCheck />}
//               {isWrong && <FiX />}
//             </button>
//           );
//         })}
//       </div>

//       <div className="mcq-slider-nav">
//         <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
//           <FiChevronLeft /> Previous
//         </button>
//         {isLast ? (
//           <button type="button" className="mcq-slider-finish" onClick={handleFinish} disabled={answeredCount < total}>
//             Finish
//           </button>
//         ) : (
//           <button type="button" onClick={() => setIndex((i) => Math.min(total - 1, i + 1))} disabled={picked === undefined}>
//             Next <FiChevronRight />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }

// export default function CourseLearn({ onSignOut }) {
//   const { courseId } = useParams();
//   const navigate = useNavigate();
//   const { getCourseById, loading: coursesLoading } = useCourses();
//   const course = getCourseById(courseId);

//   const [progress, setProgress] = useState(null); // { status, progressPct, completedLessons }
//   const [progressLoading, setProgressLoading] = useState(true);
//   const [progressError, setProgressError] = useState('');
//   const [activeModuleIdx, setActiveModuleIdx] = useState(0);
//   const [activeLessonIdx, setActiveLessonIdx] = useState(0);
//   const [openModule, setOpenModule] = useState(0);
//   const [videoSrc, setVideoSrc] = useState('');
//   const [pdfSrc, setPdfSrc] = useState('');
//   const [docViewerSrc, setDocViewerSrc] = useState('');
//   const [mcqQuestions, setMcqQuestions] = useState(null);
//   const [contentLoading, setContentLoading] = useState(false);
//   const [contentError, setContentError] = useState('');
//   // true when the backend says this lesson's file isn't there yet (404) —
//   // shown as a friendly "available soon" note rather than an error.
//   const [contentUnavailable, setContentUnavailable] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const videoRef = useRef(null);

//   const modules = useMemo(
//     () =>
//       (course?.curriculum || []).map((m) => ({
//         title: m.title,
//         lessons: (m.lessons || []).map(normalizeLesson),
//       })),
//     [course],
//   );

//   const totalLessons = useMemo(
//     () => modules.reduce((sum, m) => sum + m.lessons.length, 0),
//     [modules],
//   );

//   const completedSet = useMemo(
//     () => new Set(progress?.completedLessons || []),
//     [progress],
//   );

//   // Load this course's saved progress (registers a REGISTERED->IN_PROGRESS
//   // transition server-side the first time a lesson is opened).
//   const fetchProgress = () => {
//     setProgressLoading(true);
//     axios
//       .get(`${API_BASE_URL}/api/course-progress/${courseId}`)
//       .then((res) => {
//         if (res.data?.success) setProgress(res.data.data);
//       })
//       .catch((err) => {
//         console.error('Course progress fetch error:', err);
//         setProgressError('Could not load your progress for this course.');
//       })
//       .finally(() => setProgressLoading(false));
//   };

//   useEffect(() => {
//     fetchProgress();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [courseId]);

//   // Once progress + curriculum are both ready, jump to the last-opened
//   // lesson (resume), or the first lesson with a video.
//   useEffect(() => {
//     if (!modules.length || progressLoading) return;

//     let mIdx = 0;
//     let lIdx = 0;

//     if (progress?.lastLessonKey) {
//       const [m, l] = progress.lastLessonKey.split('-').map(Number);
//       if (modules[m]?.lessons[l]) {
//         mIdx = m;
//         lIdx = l;
//       }
//     } else {
//       // fall back to the first playable lesson (video, PDF, doc, or knowledge check)
//       outer: for (let m = 0; m < modules.length; m++) {
//         for (let l = 0; l < modules[m].lessons.length; l++) {
//           const ls = modules[m].lessons[l];
//           if (ls.hasVideo || ls.hasPdf || ls.hasDoc || ls.hasMcq) {
//             mIdx = m;
//             lIdx = l;
//             break outer;
//           }
//         }
//       }
//     }

//     setActiveModuleIdx(mIdx);
//     setActiveLessonIdx(lIdx);
//     setOpenModule(mIdx);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [modules.length, progressLoading]);

//   const activeLesson = modules[activeModuleIdx]?.lessons[activeLessonIdx];
//   const activeKey = lessonKey(activeModuleIdx, activeLessonIdx);

//   // Resolve the viewable content for the active lesson.
//   // A <video src> / <iframe src> is a plain browser request and can't carry the
//   // Authorization header, so pointing it straight at an /api endpoint gets a 401.
//   // So video, PDF and doc lessons all resolve their URL up front through axios
//   // (which does attach the token) and only then hand that URL to the element.
//   // The resolved URL is an S3 presigned link (or a static asset), which needs
//   // no further auth to load.
//   useEffect(() => {
//     setVideoSrc('');
//     setPdfSrc('');
//     setDocViewerSrc('');
//     setMcqQuestions(null);
//     setContentError('');
//     setContentUnavailable(false);

//     if (!activeLesson?.hasVideo && !activeLesson?.hasPdf && !activeLesson?.hasDoc && !activeLesson?.hasMcq) {
//       return;
//     }

//     // Guards against a slow response for a lesson the user has already left
//     // overwriting the newly selected lesson's content.
//     let cancelled = false;
//     const lessonBase = `${API_BASE_URL}/api/courses/${courseId}/lessons/${activeModuleIdx}/${activeLessonIdx}`;

//     const fetchUrl = (endpoint, onUrl, errorMessage) => {
//       setContentLoading(true);
//       axios
//         .get(`${lessonBase}/${endpoint}`)
//         .then((res) => {
//           if (cancelled) return;
//           if (res.data?.success && res.data.data?.url) {
//             onUrl(res.data.data.url);
//           } else {
//             setContentError(errorMessage);
//           }
//         })
//         .catch((err) => {
//           if (cancelled) return;
//           if (err.response?.status === 404) {
//             // The lesson points at a file that hasn't been uploaded yet.
//             setContentUnavailable(true);
//             return;
//           }
//           console.error(`Lesson ${endpoint} fetch error:`, err);
//           setContentError(errorMessage);
//         })
//         .finally(() => {
//           if (!cancelled) setContentLoading(false);
//         });
//     };

//     if (activeLesson.hasVideo) {
//       fetchUrl('video-url', setVideoSrc, 'Could not load this video.');
//     } else if (activeLesson.hasPdf) {
//       fetchUrl('pdf-url', setPdfSrc, 'Could not load this document.');
//     } else if (activeLesson.hasDoc) {
//       fetchUrl('doc', (url) => setDocViewerSrc(officeViewerUrl(url)), 'Could not load this document.');
//     } else {
//       setContentLoading(true);
//       axios
//         .get(`${lessonBase}/mcq`)
//         .then((res) => {
//           if (cancelled) return;
//           if (res.data?.success && res.data.data?.questions?.length) {
//             setMcqQuestions(res.data.data.questions);
//           } else {
//             setContentError('Could not load this knowledge check.');
//           }
//         })
//         .catch((err) => {
//           if (cancelled) return;
//           console.error('Lesson mcq fetch error:', err);
//           setContentError('Could not load this knowledge check.');
//         })
//         .finally(() => {
//           if (!cancelled) setContentLoading(false);
//         });
//     }

//     // record that this lesson was opened, for "resume" next time
//     axios
//       .post(`${API_BASE_URL}/api/course-progress/${courseId}/lesson/${activeKey}/open`)
//       .catch(() => {});

//     return () => {
//       cancelled = true;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [activeModuleIdx, activeLessonIdx, courseId]);

//   const goToLesson = (mIdx, lIdx) => {
//     setActiveModuleIdx(mIdx);
//     setActiveLessonIdx(lIdx);
//     setOpenModule(mIdx);
//     setSidebarOpen(false);
//   };

//   const markComplete = () => {
//     axios
//       .post(`${API_BASE_URL}/api/course-progress/${courseId}/lesson/${activeKey}/complete`)
//       .then((res) => {
//         if (res.data?.success) {
//           setProgress((prev) => ({ ...prev, ...res.data.data }));
//         }
//       })
//       .catch((err) => console.error('Mark lesson complete error:', err));
//   };

//   const findAdjacentLesson = (direction) => {
//     const flat = [];
//     modules.forEach((m, mi) => m.lessons.forEach((l, li) => flat.push([mi, li])));
//     const idx = flat.findIndex(([mi, li]) => mi === activeModuleIdx && li === activeLessonIdx);
//     const targetIdx = idx + direction;
//     return flat[targetIdx] || null;
//   };

//   const goNext = () => {
//     const next = findAdjacentLesson(1);
//     if (next) goToLesson(next[0], next[1]);
//   };

//   const goPrev = () => {
//     const prev = findAdjacentLesson(-1);
//     if (prev) goToLesson(prev[0], prev[1]);
//   };

//   const handleVideoEnded = () => {
//     if (!completedSet.has(activeKey)) markComplete();
//     const next = findAdjacentLesson(1);
//     if (next) {
//       const nextLesson = modules[next[0]].lessons[next[1]];
//       if (nextLesson.hasVideo || nextLesson.hasPdf || nextLesson.hasDoc || nextLesson.hasMcq) {
//         goToLesson(next[0], next[1]);
//       }
//     }
//   };

//   // Finishing a knowledge check marks the lesson complete regardless of
//   // score — it's a check for understanding, not a gate. The student can
//   // still see how many they got right and review their answers.
//   const handleMcqFinish = () => {
//     if (!completedSet.has(activeKey)) markComplete();
//   };

//   if (coursesLoading || progressLoading) {
//     return (
//       <StudentShell onSignOut={onSignOut}>
//         <main className="course-shell">
//           <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
//             Loading your course…
//           </div>
//         </main>
//       </StudentShell>
//     );
//   }

//   if (!course) return <Navigate to="/courses" replace />;

//   if (progressError && !progress) {
//     return (
//       <StudentShell onSignOut={onSignOut}>
//         <main className="course-shell">
//           <div className="course-empty-state">
//             {progressError} You may need to purchase this course first.
//           </div>
//         </main>
//       </StudentShell>
//     );
//   }

//   const isCertified = progress?.status === 'CERTIFIED';
//   const isCompleted = progress?.status === 'COMPLETED' || isCertified;

//   return (
//     <StudentShell onSignOut={onSignOut}>
//       <main className="course-shell">
//         <section className={`learn-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
//           <div className="learn-topbar">
//             <button type="button" className="mcq-topbar-back" aria-label="Go back" onClick={() => navigate('/course-progress')}>
//               <FiArrowLeft />
//             </button>
//             <div className="learn-topbar-title">
//               <strong>{course.title}</strong>
//               <span>{progress?.progressPct ?? 0}% complete</span>
//             </div>
//             <button type="button" className="learn-curriculum-toggle" onClick={() => setSidebarOpen((v) => !v)}>
//               Curriculum <FiChevronDown />
//             </button>
//           </div>

//           <div className="learn-progress-track">
//             <div className="learn-progress-fill" style={{ width: `${progress?.progressPct ?? 0}%` }} />
//           </div>

//           <div className="learn-body">
//             <div className="learn-player-col">
//               {activeLesson?.hasMcq ? (
//                 <div className="learn-video-wrap is-mcq">
//                   {contentError ? (
//                     <div className="learn-video-placeholder">
//                       <FiHelpCircle />
//                       <strong>{contentError}</strong>
//                       <span>Try refreshing the page.</span>
//                     </div>
//                   ) : mcqQuestions ? (
//                     <KnowledgeCheckSlider questions={mcqQuestions} onFinish={handleMcqFinish} />
//                   ) : null}
//                   {contentLoading && <div className="learn-video-loading">Loading…</div>}
//                 </div>
//               ) : (
//                 <div className={`learn-video-wrap ${(activeLesson?.hasPdf || activeLesson?.hasDoc) ? 'is-document' : ''}`}>
//                   {contentUnavailable && (activeLesson?.hasVideo || activeLesson?.hasPdf || activeLesson?.hasDoc) ? (
//                     <div className="learn-video-placeholder">
//                       {activeLesson?.hasVideo ? <FiPlayCircle /> : <FiFileText />}
//                       <strong>
//                         {activeLesson?.hasVideo
//                           ? 'The video for this lesson will be available soon'
//                           : 'The study material for this lesson will be available soon'}
//                       </strong>
//                       <span>Check back shortly — we're adding new content regularly.</span>
//                     </div>
//                   ) : contentError && (activeLesson?.hasVideo || activeLesson?.hasPdf || activeLesson?.hasDoc) ? (
//                     <div className="learn-video-placeholder">
//                       {activeLesson?.hasVideo ? <FiPlayCircle /> : <FiFileText />}
//                       <strong>{contentError}</strong>
//                       <span>Try refreshing the page.</span>
//                     </div>
//                   ) : activeLesson?.hasVideo ? (
//                     videoSrc && (
//                       <video
//                         key={videoSrc}
//                         ref={videoRef}
//                         className="learn-video"
//                         src={videoSrc}
//                         controls
//                         controlsList="nodownload"
//                         onEnded={handleVideoEnded}
//                       />
//                     )
//                   ) : activeLesson?.hasPdf ? (
//                     pdfSrc && (
//                       <iframe
//                         key={pdfSrc}
//                         className="learn-pdf-frame"
//                         src={pdfSrc}
//                         title={activeLesson?.title || 'Lesson document'}
//                       />
//                     )
//                   ) : activeLesson?.hasDoc ? (
//                     docViewerSrc && (
//                       <iframe
//                         key={docViewerSrc}
//                         className="learn-pdf-frame"
//                         src={docViewerSrc}
//                         title={activeLesson?.title || 'Lesson document'}
//                       />
//                     )
//                   ) : (
//                     <div className="learn-video-placeholder">
//                       <FiLock />
//                       <strong>This lesson isn't available yet</strong>
//                       <span>Check back soon — new lessons are added regularly.</span>
//                     </div>
//                   )}
//                   {contentLoading && <div className="learn-video-loading">Loading…</div>}
//                 </div>
//               )}

//               <div className="learn-lesson-header">
//                 <div>
//                   <span className="learn-lesson-eyebrow">
//                     Module {activeModuleIdx + 1} · Lesson {activeLessonIdx + 1}
//                     {activeLesson?.hasMcq && <span className="learn-lesson-eyebrow-tag">Knowledge Check</span>}
//                   </span>
//                   <h1>{activeLesson?.title || 'Select a lesson'}</h1>
//                 </div>
//                 {(activeLesson?.hasVideo || activeLesson?.hasPdf || activeLesson?.hasDoc) && (
//                   <button
//                     type="button"
//                     className={`learn-complete-btn ${completedSet.has(activeKey) ? 'done' : ''}`}
//                     onClick={markComplete}
//                     disabled={completedSet.has(activeKey)}
//                   >
//                     <FiCheckCircle />
//                     {completedSet.has(activeKey) ? 'Completed' : 'Mark as complete'}
//                   </button>
//                 )}
//                 {activeLesson?.hasMcq && completedSet.has(activeKey) && (
//                   <span className="learn-complete-btn done">
//                     <FiCheckCircle /> Completed
//                   </span>
//                 )}
//               </div>

//               <div className="learn-nav-buttons">
//                 <button type="button" onClick={goPrev} disabled={!findAdjacentLesson(-1)}>
//                   <FiChevronLeft /> Previous
//                 </button>
//                 <button type="button" onClick={goNext} disabled={!findAdjacentLesson(1)}>
//                   Next <FiChevronRight />
//                 </button>
//               </div>

//               {isCompleted && (
//                 <div className="learn-certificate-banner">
//                   <FiAward />
//                   <div>
//                     <strong>{isCertified ? 'Certified' : "You've completed this course!"}</strong>
//                     <span>
//                       {isCertified
//                         ? 'Your certificate has been issued for this course.'
//                         : 'Great work — a certificate will be available soon.'}
//                     </span>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <aside className="learn-sidebar">
//               <div className="learn-sidebar-header">
//                 <strong>Course content</strong>
//                 <span>{completedSet.size}/{totalLessons} lessons</span>
//               </div>
//               <div className="learn-module-list">
//                 {modules.map((module, mIdx) => {
//                   const moduleDoneCount = module.lessons.filter((_, lIdx) =>
//                     completedSet.has(lessonKey(mIdx, lIdx)),
//                   ).length;
//                   return (
//                     <div key={module.title} className={`learn-module ${openModule === mIdx ? 'open' : ''}`}>
//                       <button
//                         type="button"
//                         className="learn-module-header"
//                         onClick={() => setOpenModule((cur) => (cur === mIdx ? -1 : mIdx))}
//                       >
//                         <span>{module.title}</span>
//                         <small>{moduleDoneCount}/{module.lessons.length} <FiChevronDown /></small>
//                       </button>
//                       {openModule === mIdx && (
//                         <div className="learn-lesson-list">
//                           {module.lessons.map((lesson, lIdx) => {
//                             const key = lessonKey(mIdx, lIdx);
//                             const isActive = mIdx === activeModuleIdx && lIdx === activeLessonIdx;
//                             const isDone = completedSet.has(key);
//                             return (
//                               <button
//                                 type="button"
//                                 key={key}
//                                 className={`learn-lesson-row ${isActive ? 'active' : ''} ${!(lesson.hasVideo || lesson.hasPdf || lesson.hasDoc || lesson.hasMcq) ? 'locked' : ''}`}
//                                 onClick={() => goToLesson(mIdx, lIdx)}
//                               >
//                                 <span className="learn-lesson-icon">
//                                   {isDone ? <FiCheck /> : lesson.hasVideo ? <FiPlayCircle /> : (lesson.hasPdf || lesson.hasDoc) ? <FiFileText /> : lesson.hasMcq ? <FiHelpCircle /> : <FiLock />}
//                                 </span>
//                                 <span className="learn-lesson-title">{lesson.title}</span>
//                                 {lesson.duration && <span className="learn-lesson-duration">{lesson.duration}</span>}
//                               </button>
//                             );
//                           })}
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div>
//             </aside>
//           </div>
//         </section>
//       </main>
//     </StudentShell>
//   );
// }




import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  FiArrowLeft,
  FiAward,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiHelpCircle,
  FiLock,
  FiPlayCircle,
  FiX,
} from 'react-icons/fi';

import StudentShell from '../components/StudentShell.jsx';
import { useCourses } from '../context/CourseContext.jsx';
import { API_BASE_URL } from '../api/axiosSetup.js';

const lessonKey = (moduleIndex, lessonIndex) =>
  `${moduleIndex}-${lessonIndex}`;

function normalizeLesson(raw) {
  if (typeof raw === 'string') {
    return {
      title: raw,
      duration: null,
      hasVideo: false,
      hasPdf: false,
      hasDoc: false,
      hasMcq: false,
      hasProject: false,
      isPreview: false,
    };
  }

  return {
    title: raw?.title ?? 'Untitled lesson',
    duration: raw?.duration ?? null,
    hasVideo: Boolean(raw?.videoUrl || raw?.videoKey),
    hasPdf: Boolean(raw?.pdfUrl || raw?.pdfKey),
    hasDoc: Boolean(raw?.docUrl || raw?.docKey),
    hasMcq: Boolean(raw?.mcq?.length),
    hasProject: Boolean(
      (Array.isArray(raw?.projects) && raw.projects.length > 0) ||
      (Array.isArray(raw?.projectQuestions) && raw.projectQuestions.length > 0) ||
      (typeof raw?.projectQuestion === 'string' &&
        raw.projectQuestion.trim())
    ),
    isPreview: Boolean(raw?.isPreview),
  };
}

function officeViewerUrl(docUrl) {
  return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(docUrl)}`;
}

// ======================================================
// KNOWLEDGE CHECK
// ======================================================

function KnowledgeCheckSlider({ questions, onFinish }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setIndex(0);
    setAnswers({});
    setSubmitted(false);
  }, [questions]);

  if (!questions || questions.length === 0) return null;

  const total = questions.length;
  const isLast = index === total - 1;
  const q = questions[index];
  const picked = answers[index];

  const answeredCount = Object.keys(answers).length;

  const score = questions.reduce(
    (sum, qq, i) =>
      answers[i] === qq.correct ? sum + 1 : sum,
    0
  );

  const pick = (optionIdx) => {
    if (submitted) return;

    setAnswers((prev) => ({
      ...prev,
      [index]: optionIdx,
    }));
  };

  const handleFinish = () => {
    setSubmitted(true);
    onFinish?.(score, total);
  };

  if (submitted) {
    const pct = Math.round((score / total) * 100);

    return (
      <div className="mcq-slider mcq-slider-result">
        <div className="mcq-result-score">{pct}%</div>

        <strong>{score} of {total} correct</strong>

        <span>
          Nice work — you can review your answers below or move on to
          the next lesson.
        </span>

        <button
          type="button"
          className="mcq-slider-retake"
          onClick={() => {
            setSubmitted(false);
            setIndex(0);
          }}
        >
          Review answers
        </button>
      </div>
    );
  }

  return (
    <div className="mcq-slider">
      <div className="mcq-slider-progress">
        <span>
          Question {index + 1} of {total}
        </span>

        <div className="mcq-slider-dots">
          {questions.map((_, i) => (
            <button
              type="button"
              key={i}
              className={`mcq-slider-dot ${
                i === index ? 'active' : ''
              } ${answers[i] !== undefined ? 'answered' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Question ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="mcq-slider-question">{q.text}</div>

      <div className="mcq-slider-options">
        {q.options.map((opt, oi) => {
          const isPicked = picked === oi;
          const isCorrect =
            picked !== undefined && oi === q.correct;
          const isWrong = isPicked && oi !== q.correct;

          return (
            <button
              type="button"
              key={oi}
              className={`mcq-slider-option ${
                isPicked ? 'picked' : ''
              } ${
                isCorrect && picked !== undefined ? 'correct' : ''
              } ${isWrong ? 'wrong' : ''}`}
              onClick={() => pick(oi)}
              disabled={picked !== undefined}
            >
              <span>{opt}</span>

              {isCorrect && picked !== undefined && <FiCheck />}
              {isWrong && <FiX />}
            </button>
          );
        })}
      </div>

      <div className="mcq-slider-nav">
        <button
          type="button"
          onClick={() =>
            setIndex((i) => Math.max(0, i - 1))
          }
          disabled={index === 0}
        >
          <FiChevronLeft /> Previous
        </button>

        {isLast ? (
          <button
            type="button"
            className="mcq-slider-finish"
            onClick={handleFinish}
            disabled={answeredCount < total}
          >
            Finish
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              setIndex((i) => Math.min(total - 1, i + 1))
            }
            disabled={picked === undefined}
          >
            Next <FiChevronRight />
          </button>
        )}
      </div>
    </div>
  );
}

// ======================================================
// COURSE PROJECT MODULE
// ======================================================

function CourseProjectModule({ projects = [], onSubmit }) {
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [projectLink, setProjectLink] = useState('');
  const [projectError, setProjectError] = useState('');
  const [projectSubmitted, setProjectSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeProject = projects[activeProjectIndex] || {};

  const question = activeProject.question || '';

  const submittedLink =
    activeProject.submissionLink ||
    activeProject.submission?.link ||
    '';

  const backendProjectIndex =
    activeProject.index ?? activeProjectIndex;

  useEffect(() => {
    setProjectLink(submittedLink);
    setProjectSubmitted(Boolean(submittedLink));
    setProjectError('');
  }, [submittedLink, activeProjectIndex]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    const link = projectLink.trim();

    if (!link) {
      setProjectError(
        'Please enter your GitHub repository or project link.'
      );
      return;
    }

    let normalizedLink = link;

    try {
      if (!/^https?:\/\//i.test(normalizedLink)) {
        normalizedLink = `https://${normalizedLink}`;
      }

      const parsedUrl = new URL(normalizedLink);

      if (
        !['http:', 'https:'].includes(parsedUrl.protocol) ||
        !parsedUrl.hostname.includes('.')
      ) {
        throw new Error('Invalid URL');
      }
    } catch {
      setProjectError(
        'Please enter a valid URL starting with http:// or https://.'
      );
      return;
    }

    setProjectError('');
    setSubmitting(true);

    try {
      const saved = await onSubmit(
        normalizedLink,
        backendProjectIndex
      );

      setProjectLink(saved?.link || normalizedLink);
      setProjectSubmitted(true);
    } catch (err) {
      setProjectError(
        err.message ||
        'Could not submit your project. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="learn-video-wrap is-mcq project-module-wrap">

      <style>{`
        .project-module-wrap {
          width: 100%;
          height: 100%;
          min-height: 0;
          aspect-ratio: auto;
          overflow: visible;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 28px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .project-module-card {
          width: 100%;
          max-width: 100%;
          height: 100%;
          max-height: 100%;
          margin: 0;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: 0;
          box-shadow: none;
          box-sizing: border-box;
        }

        .project-module-banner {
          display: flex;
          align-items: center;
          gap: 17px;
          padding: 10px;
          margin-bottom: 14px;
          border: 1px solid rgba(99, 102, 241, 0.18);
          border-radius: 16px;
          background: linear-gradient(
            115deg,
            rgba(99, 102, 241, 0.13),
            rgba(14, 165, 233, 0.08)
          );
        }

        .project-module-icon {
          flex-shrink: 0;
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          color: #ffffff;
          background: linear-gradient(135deg, #6366f1, #0ea5e9);
          box-shadow: 0 7px 18px rgba(79, 70, 229, 0.22);
        }

        .project-module-kicker {
          display: block;
          margin-bottom: 6px;
          color: #6366f1;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        .project-module-title {
          margin: 0;
          color: var(--text-primary, inherit);
          font-size: clamp(16px, 3vw, 29px);
          font-weight: 750;
          line-height: 1.3;
        }

        .project-module-description {
          margin: 0 0 15px;
          color: var(--text-muted, #64748b);
          font-size: 14px;
          line-height: 1.8;
        }

        .project-task-tabs {
          display: flex;
          gap: 13px;
          overflow-x: auto;
          padding: 4px 2px 12px;
          // margin: 0 0 8px;
          scrollbar-width: thin;
        }

        .project-task-tab {
          flex: 0 0 auto;
          border: 1px solid var(--border-color, #d8deea);
          border-radius: 10px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #344054);
          padding: 6px 10px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .project-task-tab.active {
          color: #fff;
          border-color: #5546d7;
          background: #5546d7;
        }

        .project-task-count {
          margin: 0 0 8px;
          color: var(--text-muted, #667085);
          font-size: 13px;
          text-align: right;
        }

        .project-question-card {
          padding: 10px;
          margin-bottom: 16px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-left: 4px solid #6366f1;
          border-radius: 12px;
          background: var(--input-bg, rgba(148, 163, 184, 0.06));
        }

        .project-question-label {
          display: block;
          margin-bottom: 11px;
          color: #6366f1;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .project-question-text {
          margin: 0;
          color: var(--text-primary, inherit);
          font-size: 12px;
          font-weight: 600;
          line-height: 1.8;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .project-form-label {
          display: block;
          margin-bottom: 10px;
          color: var(--text-primary, inherit);
          font-size: 14px;
          font-weight: 700;
        }

        .project-link-input {
          display: block;
          width: 100%;
          min-height: 46px;
          max-height: 54px;
          box-sizing: border-box;
          padding: 12px 15px;
          border: 1px solid var(--border-color, #d1d5db);
          border-radius: 12px;
          background: var(--input-bg, transparent);
          color: var(--text-primary, inherit);
          font: inherit;
          font-size: 14px;
          line-height: 1.5;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .project-link-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.14);
        }

        .project-input-hint {
          display: block;
          margin-top: 8px;
          color: var(--text-muted, #64748b);
          font-size: 12px;
          line-height: 1.6;
        }

        .project-form-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 14px;
        }

        .project-submit-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 46px;
          padding: 11px 24px;
          border: 0;
          border-radius: 10px;
          color: #ffffff;
          background: linear-gradient(135deg, #6366f1, #0ea5e9);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        }

        .project-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 7px 18px rgba(79, 70, 229, 0.22);
        }

        .project-submit-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .project-feedback {
          margin: 12px 0 0;
          font-size: 13px;
          line-height: 1.5;
        }

        .project-success {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          margin-top: 16px;
          border: 1px solid rgba(22, 163, 74, 0.2);
          border-radius: 10px;
          color: #15803d;
          background: rgba(22, 163, 74, 0.07);
          font-size: 13px;
          font-weight: 600;
        }

        @media (max-width: 600px) {
          .project-module-wrap {
            padding: 10px;
          }

          .project-module-card {
            padding: 10px;
          }

          .project-module-banner {
            padding: 16px;
          }

          .project-form-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .project-submit-btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="project-module-card">

        <div
          className="project-task-tabs"
          role="tablist"
          aria-label="Project tasks"
        >
          {projects.map((project, index) => (
            <button
              key={project.index ?? index}
              type="button"
              role="tab"
              aria-selected={activeProjectIndex === index}
              className={`project-task-tab ${
                activeProjectIndex === index ? 'active' : ''
              }`}
              onClick={() => setActiveProjectIndex(index)}
            >
              {project.title || `Project ${index + 1}`}
            </button>
          ))}
        </div>

        <div className="project-task-count">
          {activeProjectIndex + 1} of {projects.length}
        </div>

        <div className="project-question-card">
          <span className="project-question-label">
            <FiHelpCircle
              style={{ marginRight: 6, verticalAlign: 'middle' }}
            />
            Your Project Task
          </span>

          <p className="project-question-text">
            {question}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor={`course-project-link-${activeProjectIndex}`}
            className="project-form-label"
          >
            GitHub Repository or Project URL
          </label>

          <input
            type="url"
            id={`course-project-link-${activeProjectIndex}`}
            className="project-link-input"
            value={projectLink}
            onChange={(event) => {
              setProjectLink(event.target.value);
              setProjectError('');
              setProjectSubmitted(false);
            }}
            placeholder="https://github.com/username/project-name"
          />

          <span className="project-input-hint">
            Paste your GitHub repository URL or the link to your
            deployed application. Make sure the link is accessible.
          </span>

          {projectError && (
            <p
              className="project-feedback"
              role="alert"
              style={{ color: '#dc2626' }}
            >
              {projectError}
            </p>
          )}

          {projectSubmitted && (
            <div className="project-success" role="status">
              <FiCheckCircle />
              Project link submitted successfully!
            </div>
          )}

          <div className="project-form-footer">
            <span className="project-input-hint">
              You can update your submission by entering another link.
            </span>

            <button
              type="submit"
              className="project-submit-btn"
              disabled={!projectLink.trim() || submitting}
            >
              {submitting
                ? 'Submitting…'
                : projectSubmitted
                  ? 'Update Submission'
                  : 'Submit Project'}

              <FiCheckCircle />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ======================================================
// MAIN COURSE LEARN COMPONENT
// ======================================================

export default function CourseLearn({ onSignOut }) {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const {
    getCourseById,
    loading: coursesLoading,
  } = useCourses();

  const course = getCourseById(courseId);

  const [progress, setProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState('');

  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [openModule, setOpenModule] = useState(0);

  const [videoSrc, setVideoSrc] = useState('');
  const [pdfSrc, setPdfSrc] = useState('');
  const [docViewerSrc, setDocViewerSrc] = useState('');

  const [mcqQuestions, setMcqQuestions] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState('');
  const [contentUnavailable, setContentUnavailable] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projectData, setProjectData] = useState(null);

  const videoRef = useRef(null);

  // Curriculum

  const modules = useMemo(() => {
    return (course?.curriculum || []).map((module, sourceIndex) => ({
      title: module.title,
      sourceIndex,
      lessons: (module.lessons || []).map(normalizeLesson),
    }));
  }, [course]);

  const totalLessons = useMemo(
    () =>
      modules.reduce(
        (sum, module) => sum + module.lessons.length,
        0
      ),
    [modules]
  );

  const completedSet = useMemo(
    () => new Set(progress?.completedLessons || []),
    [progress]
  );

  // Fetch progress

  const fetchProgress = () => {
    setProgressLoading(true);

    axios
      .get(`${API_BASE_URL}/api/course-progress/${courseId}`)
      .then((res) => {
        if (res.data?.success) {
          setProgress(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Course progress fetch error:', err);
        setProgressError(
          'Could not load your progress for this course.'
        );
      })
      .finally(() => setProgressLoading(false));
  };

  useEffect(() => {
    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Restore last lesson

  useEffect(() => {
    if (!modules.length || progressLoading) return;

    let mIdx = 0;
    let lIdx = 0;

    if (progress?.lastLessonKey) {
      const [sourceModuleIndex, lessonIndex] =
        progress.lastLessonKey.split('-').map(Number);

      const displayModuleIndex = modules.findIndex(
        (module) => module.sourceIndex === sourceModuleIndex
      );

      if (
        displayModuleIndex >= 0 &&
        modules[displayModuleIndex]?.lessons[lessonIndex]
      ) {
        mIdx = displayModuleIndex;
        lIdx = lessonIndex;
      }
    } else {
      outer: for (let m = 0; m < modules.length; m++) {
        for (let l = 0; l < modules[m].lessons.length; l++) {
          const lesson = modules[m].lessons[l];

          if (
            lesson.hasVideo ||
            lesson.hasPdf ||
            lesson.hasDoc ||
            lesson.hasMcq ||
            lesson.hasProject
          ) {
            mIdx = m;
            lIdx = l;
            break outer;
          }
        }
      }
    }

    setActiveModuleIdx(mIdx);
    setActiveLessonIdx(lIdx);
    setOpenModule(mIdx);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules.length, progressLoading]);

  const activeLesson =
    modules[activeModuleIdx]?.lessons[activeLessonIdx];

  const activeModule = modules[activeModuleIdx];

  const activeKey = lessonKey(
    activeModule?.sourceIndex ?? activeModuleIdx,
    activeLessonIdx
  );

  // Fetch lesson content

  useEffect(() => {
    setVideoSrc('');
    setPdfSrc('');
    setDocViewerSrc('');
    setMcqQuestions(null);
    setProjectData(null);
    setContentError('');
    setContentUnavailable(false);
    setContentLoading(false);

    if (
      !activeLesson?.hasVideo &&
      !activeLesson?.hasPdf &&
      !activeLesson?.hasDoc &&
      !activeLesson?.hasMcq &&
      !activeLesson?.hasProject
    ) {
      return;
    }

    let cancelled = false;

    const sourceModuleIndex =
      activeModule?.sourceIndex ?? activeModuleIdx;

    const lessonBase =
      `${API_BASE_URL}/api/courses/${courseId}/lessons/` +
      `${sourceModuleIndex}/${activeLessonIdx}`;

    const fetchUrl = (endpoint, onUrl, errorMessage) => {
      setContentLoading(true);

      axios
        .get(`${lessonBase}/${endpoint}`)
        .then((res) => {
          if (cancelled) return;

          if (res.data?.success && res.data.data?.url) {
            onUrl(res.data.data.url);
          } else {
            setContentError(errorMessage);
          }
        })
        .catch((err) => {
          if (cancelled) return;

          if (err.response?.status === 404) {
            setContentUnavailable(true);
            return;
          }

          console.error(
            `Lesson ${endpoint} fetch error:`,
            err
          );

          setContentError(errorMessage);
        })
        .finally(() => {
          if (!cancelled) {
            setContentLoading(false);
          }
        });
    };

    if (activeLesson.hasVideo) {
      fetchUrl(
        'video-url',
        setVideoSrc,
        'Could not load this video.'
      );
    } else if (activeLesson.hasPdf) {
      fetchUrl(
        'pdf-url',
        setPdfSrc,
        'Could not load this document.'
      );
    } else if (activeLesson.hasDoc) {
      fetchUrl(
        'doc',
        (url) => setDocViewerSrc(officeViewerUrl(url)),
        'Could not load this document.'
      );
    } else if (activeLesson.hasMcq) {
      setContentLoading(true);

      axios
        .get(`${lessonBase}/mcq`)
        .then((res) => {
          if (cancelled) return;

          if (
            res.data?.success &&
            res.data.data?.questions?.length
          ) {
            setMcqQuestions(res.data.data.questions);
          } else {
            setContentError(
              'Could not load this knowledge check.'
            );
          }
        })
        .catch((err) => {
          if (cancelled) return;

          console.error('Lesson mcq fetch error:', err);

          setContentError(
            'Could not load this knowledge check.'
          );
        })
        .finally(() => {
          if (!cancelled) {
            setContentLoading(false);
          }
        });
    } else if (activeLesson.hasProject) {
      setContentLoading(true);

      axios
        .get(`${lessonBase}/project`)
        .then((res) => {
          if (cancelled) return;

          const projects = res.data?.data?.projects;

          if (
            res.data?.success &&
            Array.isArray(projects) &&
            projects.length > 0
          ) {
            setProjectData(res.data.data);
          } else {
            setContentError('Could not load this project.');
          }
        })
        .catch((err) => {
          if (cancelled) return;

          console.error('Lesson project fetch error:', err);

          setContentError(
            err.response?.data?.message ||
            'Could not load this project.'
          );
        })
        .finally(() => {
          if (!cancelled) {
            setContentLoading(false);
          }
        });
    }

    axios
      .post(
        `${API_BASE_URL}/api/course-progress/${courseId}/lesson/${activeKey}/open`
      )
      .catch(() => {});

    return () => {
      cancelled = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModuleIdx, activeLessonIdx, courseId]);

  // Navigation

  const goToLesson = (moduleIndex, lessonIndex) => {
    setActiveModuleIdx(moduleIndex);
    setActiveLessonIdx(lessonIndex);
    setOpenModule(moduleIndex);
    setSidebarOpen(false);
  };

  const markComplete = () => {
    if (activeLesson?.hasProject) return;

    axios
      .post(
        `${API_BASE_URL}/api/course-progress/${courseId}/lesson/${activeKey}/complete`
      )
      .then((res) => {
        if (res.data?.success) {
          setProgress((prev) => ({
            ...prev,
            ...res.data.data,
          }));
        }
      })
      .catch((err) =>
        console.error('Mark lesson complete error:', err)
      );
  };

  const findAdjacentLesson = (direction) => {
    const flat = [];

    modules.forEach((module, moduleIndex) => {
      module.lessons.forEach((_, lessonIndex) => {
        flat.push([moduleIndex, lessonIndex]);
      });
    });

    const currentIndex = flat.findIndex(
      ([moduleIndex, lessonIndex]) =>
        moduleIndex === activeModuleIdx &&
        lessonIndex === activeLessonIdx
    );

    return flat[currentIndex + direction] || null;
  };

  const goNext = () => {
    const next = findAdjacentLesson(1);

    if (next) {
      goToLesson(next[0], next[1]);
    }
  };

  const goPrev = () => {
    const previous = findAdjacentLesson(-1);

    if (previous) {
      goToLesson(previous[0], previous[1]);
    }
  };

  // Video completion

  const handleVideoEnded = () => {
    if (!completedSet.has(activeKey)) {
      markComplete();
    }

    const next = findAdjacentLesson(1);

    if (next) {
      const nextLesson = modules[next[0]].lessons[next[1]];

      if (
        nextLesson.hasVideo ||
        nextLesson.hasPdf ||
        nextLesson.hasDoc ||
        nextLesson.hasMcq ||
        nextLesson.hasProject
      ) {
        goToLesson(next[0], next[1]);
      }
    }
  };

  const handleMcqFinish = () => {
    if (!completedSet.has(activeKey)) {
      markComplete();
    }
  };

  // ======================================================
  // PROJECT SUBMISSION
  // ======================================================

  const handleProjectSubmit = async (
    link,
    projectIndex = 0
  ) => {
    const sourceModuleIndex =
      activeModule?.sourceIndex ?? activeModuleIdx;

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/courses/${courseId}/lessons/${sourceModuleIndex}/${activeLessonIdx}/project/submit`,
        { projectIndex, link },
        { withCredentials: true } // Ensures your authentication cookie is sent
      );

      if (!res.data?.success) {
        throw new Error(
          res.data?.message ||
          'Could not submit your project.'
        );
      }

      const {
        submission,
        progress: newProgress,
      } = res.data.data;

      if (newProgress) {
        setProgress((prev) => ({
          ...prev,
          ...newProgress,
        }));
      }

      setProjectData((prev) => {
        if (!prev) return prev;

        const updatedProjects = (prev.projects || []).map(
          (project) => {
            const currentIndex =
              project.index ?? prev.projects.indexOf(project);

            if (currentIndex === projectIndex) {
              return {
                ...project,
                submission,
                submissionLink: submission?.link || link,
              };
            }

            return project;
          }
        );

        return {
          ...prev,
          projects: updatedProjects,
        };
      });

      return submission;

    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
        err.message ||
        'Could not submit your project.'
      );
    }
  };

  // ======================================================
  // LOADING AND ERROR STATES
  // ======================================================

  if (coursesLoading || progressLoading) {
    return (
      <StudentShell onSignOut={onSignOut}>
        <main className="course-shell">
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            Loading your course…
          </div>
        </main>
      </StudentShell>
    );
  }

  if (!course) {
    return <Navigate to="/courses" replace />;
  }

  if (progressError && !progress) {
    return (
      <StudentShell onSignOut={onSignOut}>
        <main className="course-shell">
          <div className="course-empty-state">
            {progressError} You may need to purchase this course first.
          </div>
        </main>
      </StudentShell>
    );
  }

  const isCertified = progress?.status === 'CERTIFIED';

  const isCompleted =
    progress?.status === 'COMPLETED' || isCertified;

  // ======================================================
  // MAIN UI
  // ======================================================

  return (
    <StudentShell onSignOut={onSignOut}>
      <main className="course-shell">
        <section
          className={`learn-shell ${
            sidebarOpen ? 'sidebar-open' : ''
          }`}
        >
          <div className="learn-topbar">
            <button
              type="button"
              className="mcq-topbar-back"
              aria-label="Go back"
              onClick={() => navigate('/course-progress')}
            >
              <FiArrowLeft />
            </button>

            <div className="learn-topbar-title">
              <strong>{course.title}</strong>
              <span>
                {progress?.progressPct ?? 0}% complete
              </span>
            </div>

            <button
              type="button"
              className="learn-curriculum-toggle"
              onClick={() =>
                setSidebarOpen((value) => !value)
              }
            >
              Curriculum <FiChevronDown />
            </button>
          </div>

          <div className="learn-progress-track">
            <div
              className="learn-progress-fill"
              style={{
                width: `${progress?.progressPct ?? 0}%`,
              }}
            />
          </div>

          <div className="learn-body">
            <div className="learn-player-col">

              {/* PROJECT MODULE */}

              {activeLesson?.hasProject ? (
                projectData ? (
                  <CourseProjectModule
                    key={activeKey}
                    projects={projectData.projects || []}
                    onSubmit={handleProjectSubmit}
                  />
                ) : (
                  <div className="learn-video-wrap is-mcq">
                    {contentError && (
                      <div className="learn-video-placeholder">
                        <FiFileText />
                        <strong>{contentError}</strong>
                        <span>Try refreshing the page.</span>
                      </div>
                    )}

                    {contentLoading && (
                      <div className="learn-video-loading">
                        Loading…
                      </div>
                    )}
                  </div>
                )

              ) : activeLesson?.hasMcq ? (

                /* MCQ MODULE */

                <div className="learn-video-wrap is-mcq">
                  {contentError ? (
                    <div className="learn-video-placeholder">
                      <FiHelpCircle />
                      <strong>{contentError}</strong>
                      <span>Try refreshing the page.</span>
                    </div>
                  ) : mcqQuestions ? (
                    <KnowledgeCheckSlider
                      questions={mcqQuestions}
                      onFinish={handleMcqFinish}
                    />
                  ) : null}

                  {contentLoading && (
                    <div className="learn-video-loading">
                      Loading…
                    </div>
                  )}
                </div>

              ) : (

                /* VIDEO / DOCUMENT MODULE */

                <div
                  className={`learn-video-wrap ${
                    activeLesson?.hasPdf || activeLesson?.hasDoc
                      ? 'is-document'
                      : ''
                  }`}
                >
                  {contentUnavailable &&
                  (activeLesson?.hasVideo ||
                    activeLesson?.hasPdf ||
                    activeLesson?.hasDoc) ? (
                    <div className="learn-video-placeholder">
                      {activeLesson?.hasVideo ? (
                        <FiPlayCircle />
                      ) : (
                        <FiFileText />
                      )}

                      <strong>
                        {activeLesson?.hasVideo
                          ? 'The video for this lesson will be available soon'
                          : 'The study material for this lesson will be available soon'}
                      </strong>

                      <span>
                        Check back shortly — we're adding new content
                        regularly.
                      </span>
                    </div>
                  ) : contentError &&
                    (activeLesson?.hasVideo ||
                      activeLesson?.hasPdf ||
                      activeLesson?.hasDoc) ? (
                    <div className="learn-video-placeholder">
                      {activeLesson?.hasVideo ? (
                        <FiPlayCircle />
                      ) : (
                        <FiFileText />
                      )}

                      <strong>{contentError}</strong>
                      <span>Try refreshing the page.</span>
                    </div>
                  ) : activeLesson?.hasVideo ? (
                    videoSrc && (
                      <video
                        key={videoSrc}
                        ref={videoRef}
                        className="learn-video"
                        src={videoSrc}
                        controls
                        controlsList="nodownload"
                        onEnded={handleVideoEnded}
                      />
                    )
                  ) : activeLesson?.hasPdf ? (
                    pdfSrc && (
                      <iframe
                        key={pdfSrc}
                        className="learn-pdf-frame"
                        src={pdfSrc}
                        title={
                          activeLesson?.title || 'Lesson document'
                        }
                      />
                    )
                  ) : activeLesson?.hasDoc ? (
                    docViewerSrc && (
                      <iframe
                        key={docViewerSrc}
                        className="learn-pdf-frame"
                        src={docViewerSrc}
                        title={
                          activeLesson?.title || 'Lesson document'
                        }
                      />
                    )
                  ) : (
                    <div className="learn-video-placeholder">
                      <FiLock />
                      <strong>
                        This lesson isn't available yet
                      </strong>
                      <span>
                        Check back soon — new lessons are added
                        regularly.
                      </span>
                    </div>
                  )}

                  {contentLoading && (
                    <div className="learn-video-loading">
                      Loading…
                    </div>
                  )}
                </div>
              )}

              {/* LESSON HEADER */}

              <div className="learn-lesson-header">
                <div>
                  <span className="learn-lesson-eyebrow">
                    Module {activeModuleIdx + 1} · Lesson{' '}
                    {activeLessonIdx + 1}

                    {activeLesson?.hasMcq && (
                      <span className="learn-lesson-eyebrow-tag">
                        Knowledge Check
                      </span>
                    )}

                    {activeLesson?.hasProject && (
                      <span className="learn-lesson-eyebrow-tag">
                        Course Project
                      </span>
                    )}
                  </span>

                  <h1>
                    {activeLesson?.title || 'Select a lesson'}
                  </h1>
                </div>

                {(activeLesson?.hasVideo ||
                  activeLesson?.hasPdf ||
                  activeLesson?.hasDoc) && (
                  <button
                    type="button"
                    className={`learn-complete-btn ${
                      completedSet.has(activeKey) ? 'done' : ''
                    }`}
                    onClick={markComplete}
                    disabled={completedSet.has(activeKey)}
                  >
                    <FiCheckCircle />

                    {completedSet.has(activeKey)
                      ? 'Completed'
                      : 'Mark as complete'}
                  </button>
                )}

                {(activeLesson?.hasMcq ||
                  activeLesson?.hasProject) &&
                  completedSet.has(activeKey) && (
                    <span className="learn-complete-btn done">
                      <FiCheckCircle /> Completed
                    </span>
                  )}
              </div>

              {/* LESSON NAVIGATION */}

              <div className="learn-nav-buttons">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={!findAdjacentLesson(-1)}
                >
                  <FiChevronLeft /> Previous
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={!findAdjacentLesson(1)}
                >
                  Next <FiChevronRight />
                </button>
              </div>

              {/* CERTIFICATE */}

              {isCompleted && (
                <div className="learn-certificate-banner">
                  <FiAward />

                  <div>
                    <strong>
                      {isCertified
                        ? 'Certified'
                        : "You've completed this course!"}
                    </strong>

                    <span>
                      {isCertified
                        ? 'Your certificate has been issued for this course.'
                        : 'Great work — a certificate will be available soon.'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* CURRICULUM SIDEBAR */}

            <aside className="learn-sidebar">
              <div className="learn-sidebar-header">
                <strong>Course content</strong>

                <span>
                  {completedSet.size}/{totalLessons} lessons
                </span>
              </div>

              <div className="learn-module-list">
                {modules.map((module, moduleIndex) => {
                  const moduleDoneCount =
                    module.lessons.filter(
                      (_, lessonIndex) =>
                        completedSet.has(
                          lessonKey(
                            module.sourceIndex,
                            lessonIndex
                          )
                        )
                    ).length;

                  return (
                    <div
                      key={`${module.title}-${moduleIndex}`}
                      className={`learn-module ${
                        openModule === moduleIndex ? 'open' : ''
                      }`}
                    >
                      <button
                        type="button"
                        className="learn-module-header"
                        onClick={() =>
                          setOpenModule((current) =>
                            current === moduleIndex
                              ? -1
                              : moduleIndex
                          )
                        }
                      >
                        <span>{module.title}</span>

                        <small>
                          {moduleDoneCount}/
                          {module.lessons.length}
                          {' '}
                          <FiChevronDown />
                        </small>
                      </button>

                      {openModule === moduleIndex && (
                        <div className="learn-lesson-list">
                          {module.lessons.map(
                            (lesson, lessonIndex) => {
                              const key =
                                `${moduleIndex}-${lessonIndex}`;

                              const isActive =
                                moduleIndex === activeModuleIdx &&
                                lessonIndex === activeLessonIdx;

                              const isDone = completedSet.has(
                                lessonKey(
                                  module.sourceIndex,
                                  lessonIndex
                                )
                              );

                              const isPlayable =
                                lesson.hasVideo ||
                                lesson.hasPdf ||
                                lesson.hasDoc ||
                                lesson.hasMcq ||
                                lesson.hasProject;

                              return (
                                <button
                                  type="button"
                                  key={key}
                                  className={`learn-lesson-row ${
                                    isActive ? 'active' : ''
                                  } ${
                                    !isPlayable ? 'locked' : ''
                                  }`}
                                  onClick={() =>
                                    goToLesson(
                                      moduleIndex,
                                      lessonIndex
                                    )
                                  }
                                >
                                  <span className="learn-lesson-icon">
                                    {isDone ? (
                                      <FiCheck />
                                    ) : lesson.hasProject ? (
                                      <FiFileText />
                                    ) : lesson.hasVideo ? (
                                      <FiPlayCircle />
                                    ) : lesson.hasPdf ||
                                      lesson.hasDoc ? (
                                      <FiFileText />
                                    ) : lesson.hasMcq ? (
                                      <FiHelpCircle />
                                    ) : (
                                      <FiLock />
                                    )}
                                  </span>

                                  <span className="learn-lesson-title">
                                    {lesson.title}
                                  </span>

                                  {lesson.duration && (
                                    <span className="learn-lesson-duration">
                                      {lesson.duration}
                                    </span>
                                  )}
                                </button>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>
        </section>
      </main>
    </StudentShell>
  );
}
