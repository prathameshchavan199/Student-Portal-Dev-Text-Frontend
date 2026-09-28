
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

// // Normalizes a curriculum lesson entry — supports both the legacy plain-string
// // format ("Lesson name") and the newer object format ({ title, duration, videoUrl }).
// // A lesson can carry a video (videoUrl/videoKey), a PDF (pdfUrl/pdfKey), a
// // Word document (docUrl/docKey), or a module-end knowledge check (mcq — an
// // array of questions); when none are present it shows as locked/coming-soon.
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

// // Wraps a document URL for inline preview via Microsoft's Office Online
// // viewer. That service fetches the document itself, so the URL it's given
// // must be publicly reachable (a presigned S3 URL, or a static asset URL) —
// // this is why the /doc endpoint returns the URL as JSON instead of
// // redirecting like /video and /pdf do.
// function officeViewerUrl(docUrl) {
//   return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(docUrl)}`;
// }

// // The module-end knowledge check — one question per slide, with dot
// // navigation and a Prev/Next stepper. Selecting an option locks that slide's
// // answer in (shown correct/incorrect immediately); "Finish" on the last
// // slide reveals a score summary. Fully self-contained: all answer state
// // lives here and resets whenever `questions` changes (i.e. a new lesson).
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
//                   {contentError && (activeLesson?.hasVideo || activeLesson?.hasPdf || activeLesson?.hasDoc) ? (
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


// 
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

const lessonKey = (moduleIndex, lessonIndex) => `${moduleIndex}-${lessonIndex}`;

// Normalizes a curriculum lesson entry — supports both the legacy plain-string
// format ("Lesson name") and the newer object format ({ title, duration, videoUrl }).
// A lesson can carry a video (videoUrl/videoKey), a PDF (pdfUrl/pdfKey), a
// Word document (docUrl/docKey), or a module-end knowledge check (mcq — an
// array of questions); when none are present it shows as locked/coming-soon.
function normalizeLesson(raw) {
  if (typeof raw === 'string') {
    return { title: raw, duration: null, hasVideo: false, hasPdf: false, hasDoc: false, hasMcq: false, isPreview: false };
  }
  return {
    title: raw?.title ?? 'Untitled lesson',
    duration: raw?.duration ?? null,
    hasVideo: Boolean(raw?.videoUrl || raw?.videoKey),
    hasPdf: Boolean(raw?.pdfUrl || raw?.pdfKey),
    hasDoc: Boolean(raw?.docUrl || raw?.docKey),
    hasMcq: Boolean(raw?.mcq?.length),
    isPreview: Boolean(raw?.isPreview),
  };
}

// Wraps a document URL for inline preview via Microsoft's Office Online
// viewer. That service fetches the document itself, so the URL it's given
// must be publicly reachable (a presigned S3 URL, or a static asset URL) —
// this is why the /doc endpoint returns the URL as JSON instead of
// redirecting like /video and /pdf do.
function officeViewerUrl(docUrl) {
  return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(docUrl)}`;
}

// The module-end knowledge check — one question per slide, with dot
// navigation and a Prev/Next stepper. Selecting an option locks that slide's
// answer in (shown correct/incorrect immediately); "Finish" on the last
// slide reveals a score summary. Fully self-contained: all answer state
// lives here and resets whenever `questions` changes (i.e. a new lesson).
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
  const score = questions.reduce((sum, qq, i) => (answers[i] === qq.correct ? sum + 1 : sum), 0);

  const pick = (optionIdx) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [index]: optionIdx }));
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
        <span>Nice work — you can review your answers below or move on to the next lesson.</span>
        <button type="button" className="mcq-slider-retake" onClick={() => { setSubmitted(false); setIndex(0); }}>
          Review answers
        </button>
      </div>
    );
  }

  return (
    <div className="mcq-slider">
      <div className="mcq-slider-progress">
        <span>Question {index + 1} of {total}</span>
        <div className="mcq-slider-dots">
          {questions.map((_, i) => (
            <button
              type="button"
              key={i}
              className={`mcq-slider-dot ${i === index ? 'active' : ''} ${answers[i] !== undefined ? 'answered' : ''}`}
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
          const isCorrect = picked !== undefined && oi === q.correct;
          const isWrong = isPicked && oi !== q.correct;
          return (
            <button
              type="button"
              key={oi}
              className={`mcq-slider-option ${isPicked ? 'picked' : ''} ${isCorrect && picked !== undefined ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
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
        <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          <FiChevronLeft /> Previous
        </button>
        {isLast ? (
          <button type="button" className="mcq-slider-finish" onClick={handleFinish} disabled={answeredCount < total}>
            Finish
          </button>
        ) : (
          <button type="button" onClick={() => setIndex((i) => Math.min(total - 1, i + 1))} disabled={picked === undefined}>
            Next <FiChevronRight />
          </button>
        )}
      </div>
    </div>
  );
}

export default function CourseLearn({ onSignOut }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { getCourseById, loading: coursesLoading } = useCourses();
  const course = getCourseById(courseId);

  const [progress, setProgress] = useState(null); // { status, progressPct, completedLessons }
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
  // true when the backend says this lesson's file isn't there yet (404) —
  // shown as a friendly "available soon" note rather than an error.
  const [contentUnavailable, setContentUnavailable] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const videoRef = useRef(null);

  const modules = useMemo(
    () =>
      (course?.curriculum || []).map((m) => ({
        title: m.title,
        lessons: (m.lessons || []).map(normalizeLesson),
      })),
    [course],
  );

  const totalLessons = useMemo(
    () => modules.reduce((sum, m) => sum + m.lessons.length, 0),
    [modules],
  );

  const completedSet = useMemo(
    () => new Set(progress?.completedLessons || []),
    [progress],
  );

  // Load this course's saved progress (registers a REGISTERED->IN_PROGRESS
  // transition server-side the first time a lesson is opened).
  const fetchProgress = () => {
    setProgressLoading(true);
    axios
      .get(`${API_BASE_URL}/api/course-progress/${courseId}`)
      .then((res) => {
        if (res.data?.success) setProgress(res.data.data);
      })
      .catch((err) => {
        console.error('Course progress fetch error:', err);
        setProgressError('Could not load your progress for this course.');
      })
      .finally(() => setProgressLoading(false));
  };

  useEffect(() => {
    fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Once progress + curriculum are both ready, jump to the last-opened
  // lesson (resume), or the first lesson with a video.
  useEffect(() => {
    if (!modules.length || progressLoading) return;

    let mIdx = 0;
    let lIdx = 0;

    if (progress?.lastLessonKey) {
      const [m, l] = progress.lastLessonKey.split('-').map(Number);
      if (modules[m]?.lessons[l]) {
        mIdx = m;
        lIdx = l;
      }
    } else {
      // fall back to the first playable lesson (video, PDF, doc, or knowledge check)
      outer: for (let m = 0; m < modules.length; m++) {
        for (let l = 0; l < modules[m].lessons.length; l++) {
          const ls = modules[m].lessons[l];
          if (ls.hasVideo || ls.hasPdf || ls.hasDoc || ls.hasMcq) {
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

  const activeLesson = modules[activeModuleIdx]?.lessons[activeLessonIdx];
  const activeKey = lessonKey(activeModuleIdx, activeLessonIdx);

  // Resolve the viewable content for the active lesson.
  // A <video src> / <iframe src> is a plain browser request and can't carry the
  // Authorization header, so pointing it straight at an /api endpoint gets a 401.
  // So video, PDF and doc lessons all resolve their URL up front through axios
  // (which does attach the token) and only then hand that URL to the element.
  // The resolved URL is an S3 presigned link (or a static asset), which needs
  // no further auth to load.
  useEffect(() => {
    setVideoSrc('');
    setPdfSrc('');
    setDocViewerSrc('');
    setMcqQuestions(null);
    setContentError('');
    setContentUnavailable(false);

    if (!activeLesson?.hasVideo && !activeLesson?.hasPdf && !activeLesson?.hasDoc && !activeLesson?.hasMcq) {
      return;
    }

    // Guards against a slow response for a lesson the user has already left
    // overwriting the newly selected lesson's content.
    let cancelled = false;
    const lessonBase = `${API_BASE_URL}/api/courses/${courseId}/lessons/${activeModuleIdx}/${activeLessonIdx}`;

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
            // The lesson points at a file that hasn't been uploaded yet.
            setContentUnavailable(true);
            return;
          }
          console.error(`Lesson ${endpoint} fetch error:`, err);
          setContentError(errorMessage);
        })
        .finally(() => {
          if (!cancelled) setContentLoading(false);
        });
    };

    if (activeLesson.hasVideo) {
      fetchUrl('video-url', setVideoSrc, 'Could not load this video.');
    } else if (activeLesson.hasPdf) {
      fetchUrl('pdf-url', setPdfSrc, 'Could not load this document.');
    } else if (activeLesson.hasDoc) {
      fetchUrl('doc', (url) => setDocViewerSrc(officeViewerUrl(url)), 'Could not load this document.');
    } else {
      setContentLoading(true);
      axios
        .get(`${lessonBase}/mcq`)
        .then((res) => {
          if (cancelled) return;
          if (res.data?.success && res.data.data?.questions?.length) {
            setMcqQuestions(res.data.data.questions);
          } else {
            setContentError('Could not load this knowledge check.');
          }
        })
        .catch((err) => {
          if (cancelled) return;
          console.error('Lesson mcq fetch error:', err);
          setContentError('Could not load this knowledge check.');
        })
        .finally(() => {
          if (!cancelled) setContentLoading(false);
        });
    }

    // record that this lesson was opened, for "resume" next time
    axios
      .post(`${API_BASE_URL}/api/course-progress/${courseId}/lesson/${activeKey}/open`)
      .catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModuleIdx, activeLessonIdx, courseId]);

  const goToLesson = (mIdx, lIdx) => {
    setActiveModuleIdx(mIdx);
    setActiveLessonIdx(lIdx);
    setOpenModule(mIdx);
    setSidebarOpen(false);
  };

  const markComplete = () => {
    axios
      .post(`${API_BASE_URL}/api/course-progress/${courseId}/lesson/${activeKey}/complete`)
      .then((res) => {
        if (res.data?.success) {
          setProgress((prev) => ({ ...prev, ...res.data.data }));
        }
      })
      .catch((err) => console.error('Mark lesson complete error:', err));
  };

  const findAdjacentLesson = (direction) => {
    const flat = [];
    modules.forEach((m, mi) => m.lessons.forEach((l, li) => flat.push([mi, li])));
    const idx = flat.findIndex(([mi, li]) => mi === activeModuleIdx && li === activeLessonIdx);
    const targetIdx = idx + direction;
    return flat[targetIdx] || null;
  };

  const goNext = () => {
    const next = findAdjacentLesson(1);
    if (next) goToLesson(next[0], next[1]);
  };

  const goPrev = () => {
    const prev = findAdjacentLesson(-1);
    if (prev) goToLesson(prev[0], prev[1]);
  };

  const handleVideoEnded = () => {
    if (!completedSet.has(activeKey)) markComplete();
    const next = findAdjacentLesson(1);
    if (next) {
      const nextLesson = modules[next[0]].lessons[next[1]];
      if (nextLesson.hasVideo || nextLesson.hasPdf || nextLesson.hasDoc || nextLesson.hasMcq) {
        goToLesson(next[0], next[1]);
      }
    }
  };

  // Finishing a knowledge check marks the lesson complete regardless of
  // score — it's a check for understanding, not a gate. The student can
  // still see how many they got right and review their answers.
  const handleMcqFinish = () => {
    if (!completedSet.has(activeKey)) markComplete();
  };

  if (coursesLoading || progressLoading) {
    return (
      <StudentShell onSignOut={onSignOut}>
        <main className="course-shell">
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading your course…
          </div>
        </main>
      </StudentShell>
    );
  }

  if (!course) return <Navigate to="/courses" replace />;

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
  const isCompleted = progress?.status === 'COMPLETED' || isCertified;

  return (
    <StudentShell onSignOut={onSignOut}>
      <main className="course-shell">
        <section className={`learn-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="learn-topbar">
            <button type="button" className="mcq-topbar-back" aria-label="Go back" onClick={() => navigate('/course-progress')}>
              <FiArrowLeft />
            </button>
            <div className="learn-topbar-title">
              <strong>{course.title}</strong>
              <span>{progress?.progressPct ?? 0}% complete</span>
            </div>
            <button type="button" className="learn-curriculum-toggle" onClick={() => setSidebarOpen((v) => !v)}>
              Curriculum <FiChevronDown />
            </button>
          </div>

          <div className="learn-progress-track">
            <div className="learn-progress-fill" style={{ width: `${progress?.progressPct ?? 0}%` }} />
          </div>

          <div className="learn-body">
            <div className="learn-player-col">
              {activeLesson?.hasMcq ? (
                <div className="learn-video-wrap is-mcq">
                  {contentError ? (
                    <div className="learn-video-placeholder">
                      <FiHelpCircle />
                      <strong>{contentError}</strong>
                      <span>Try refreshing the page.</span>
                    </div>
                  ) : mcqQuestions ? (
                    <KnowledgeCheckSlider questions={mcqQuestions} onFinish={handleMcqFinish} />
                  ) : null}
                  {contentLoading && <div className="learn-video-loading">Loading…</div>}
                </div>
              ) : (
                <div className={`learn-video-wrap ${(activeLesson?.hasPdf || activeLesson?.hasDoc) ? 'is-document' : ''}`}>
                  {contentUnavailable && (activeLesson?.hasVideo || activeLesson?.hasPdf || activeLesson?.hasDoc) ? (
                    <div className="learn-video-placeholder">
                      {activeLesson?.hasVideo ? <FiPlayCircle /> : <FiFileText />}
                      <strong>
                        {activeLesson?.hasVideo
                          ? 'The video for this lesson will be available soon'
                          : 'The study material for this lesson will be available soon'}
                      </strong>
                      <span>Check back shortly — we're adding new content regularly.</span>
                    </div>
                  ) : contentError && (activeLesson?.hasVideo || activeLesson?.hasPdf || activeLesson?.hasDoc) ? (
                    <div className="learn-video-placeholder">
                      {activeLesson?.hasVideo ? <FiPlayCircle /> : <FiFileText />}
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
                        title={activeLesson?.title || 'Lesson document'}
                      />
                    )
                  ) : activeLesson?.hasDoc ? (
                    docViewerSrc && (
                      <iframe
                        key={docViewerSrc}
                        className="learn-pdf-frame"
                        src={docViewerSrc}
                        title={activeLesson?.title || 'Lesson document'}
                      />
                    )
                  ) : (
                    <div className="learn-video-placeholder">
                      <FiLock />
                      <strong>This lesson isn't available yet</strong>
                      <span>Check back soon — new lessons are added regularly.</span>
                    </div>
                  )}
                  {contentLoading && <div className="learn-video-loading">Loading…</div>}
                </div>
              )}

              <div className="learn-lesson-header">
                <div>
                  <span className="learn-lesson-eyebrow">
                    Module {activeModuleIdx + 1} · Lesson {activeLessonIdx + 1}
                    {activeLesson?.hasMcq && <span className="learn-lesson-eyebrow-tag">Knowledge Check</span>}
                  </span>
                  <h1>{activeLesson?.title || 'Select a lesson'}</h1>
                </div>
                {(activeLesson?.hasVideo || activeLesson?.hasPdf || activeLesson?.hasDoc) && (
                  <button
                    type="button"
                    className={`learn-complete-btn ${completedSet.has(activeKey) ? 'done' : ''}`}
                    onClick={markComplete}
                    disabled={completedSet.has(activeKey)}
                  >
                    <FiCheckCircle />
                    {completedSet.has(activeKey) ? 'Completed' : 'Mark as complete'}
                  </button>
                )}
                {activeLesson?.hasMcq && completedSet.has(activeKey) && (
                  <span className="learn-complete-btn done">
                    <FiCheckCircle /> Completed
                  </span>
                )}
              </div>

              <div className="learn-nav-buttons">
                <button type="button" onClick={goPrev} disabled={!findAdjacentLesson(-1)}>
                  <FiChevronLeft /> Previous
                </button>
                <button type="button" onClick={goNext} disabled={!findAdjacentLesson(1)}>
                  Next <FiChevronRight />
                </button>
              </div>

              {isCompleted && (
                <div className="learn-certificate-banner">
                  <FiAward />
                  <div>
                    <strong>{isCertified ? 'Certified' : "You've completed this course!"}</strong>
                    <span>
                      {isCertified
                        ? 'Your certificate has been issued for this course.'
                        : 'Great work — a certificate will be available soon.'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <aside className="learn-sidebar">
              <div className="learn-sidebar-header">
                <strong>Course content</strong>
                <span>{completedSet.size}/{totalLessons} lessons</span>
              </div>
              <div className="learn-module-list">
                {modules.map((module, mIdx) => {
                  const moduleDoneCount = module.lessons.filter((_, lIdx) =>
                    completedSet.has(lessonKey(mIdx, lIdx)),
                  ).length;
                  return (
                    <div key={module.title} className={`learn-module ${openModule === mIdx ? 'open' : ''}`}>
                      <button
                        type="button"
                        className="learn-module-header"
                        onClick={() => setOpenModule((cur) => (cur === mIdx ? -1 : mIdx))}
                      >
                        <span>{module.title}</span>
                        <small>{moduleDoneCount}/{module.lessons.length} <FiChevronDown /></small>
                      </button>
                      {openModule === mIdx && (
                        <div className="learn-lesson-list">
                          {module.lessons.map((lesson, lIdx) => {
                            const key = lessonKey(mIdx, lIdx);
                            const isActive = mIdx === activeModuleIdx && lIdx === activeLessonIdx;
                            const isDone = completedSet.has(key);
                            return (
                              <button
                                type="button"
                                key={key}
                                className={`learn-lesson-row ${isActive ? 'active' : ''} ${!(lesson.hasVideo || lesson.hasPdf || lesson.hasDoc || lesson.hasMcq) ? 'locked' : ''}`}
                                onClick={() => goToLesson(mIdx, lIdx)}
                              >
                                <span className="learn-lesson-icon">
                                  {isDone ? <FiCheck /> : lesson.hasVideo ? <FiPlayCircle /> : (lesson.hasPdf || lesson.hasDoc) ? <FiFileText /> : lesson.hasMcq ? <FiHelpCircle /> : <FiLock />}
                                </span>
                                <span className="learn-lesson-title">{lesson.title}</span>
                                {lesson.duration && <span className="learn-lesson-duration">{lesson.duration}</span>}
                              </button>
                            );
                          })}
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


