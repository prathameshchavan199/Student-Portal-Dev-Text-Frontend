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
  FiLock,
  FiPlayCircle,
} from 'react-icons/fi';
import StudentShell from '../components/StudentShell.jsx';
import { useCourses } from '../context/CourseContext.jsx';
import { API_BASE_URL } from '../api/axiosSetup.js';

const lessonKey = (moduleIndex, lessonIndex) => `${moduleIndex}-${lessonIndex}`;

// Normalizes a curriculum lesson entry — supports both the legacy plain-string
// format ("Lesson name") and the newer object format ({ title, duration, videoUrl }).
function normalizeLesson(raw) {
  if (typeof raw === 'string') {
    return { title: raw, duration: null, hasVideo: false, isPreview: false };
  }
  return {
    title: raw?.title ?? 'Untitled lesson',
    duration: raw?.duration ?? null,
    hasVideo: Boolean(raw?.videoUrl || raw?.videoKey),
    isPreview: Boolean(raw?.isPreview),
  };
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
  const [videoLoading, setVideoLoading] = useState(false);
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
      // fall back to the first playable lesson
      outer: for (let m = 0; m < modules.length; m++) {
        for (let l = 0; l < modules[m].lessons.length; l++) {
          if (modules[m].lessons[l].hasVideo) {
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

  // Resolve the playable video URL for the active lesson via the backend
  // redirect endpoint (handles both static demo assets and S3-presigned URLs).
  useEffect(() => {
    if (!activeLesson?.hasVideo) {
      setVideoSrc('');
      return;
    }
    setVideoLoading(true);
    setVideoSrc(
      `${API_BASE_URL}/api/courses/${courseId}/lessons/${activeModuleIdx}/${activeLessonIdx}/video`,
    );
    setVideoLoading(false);

    // record that this lesson was opened, for "resume" next time
    axios
      .post(`${API_BASE_URL}/api/course-progress/${courseId}/lesson/${activeKey}/open`)
      .catch(() => {});
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
    if (next && modules[next[0]].lessons[next[1]].hasVideo) {
      goToLesson(next[0], next[1]);
    }
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
              <div className="learn-video-wrap">
                {activeLesson?.hasVideo ? (
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
                ) : (
                  <div className="learn-video-placeholder">
                    <FiLock />
                    <strong>This lesson isn't available yet</strong>
                    <span>Check back soon — new lessons are added regularly.</span>
                  </div>
                )}
                {videoLoading && <div className="learn-video-loading">Loading video…</div>}
              </div>

              <div className="learn-lesson-header">
                <div>
                  <span className="learn-lesson-eyebrow">
                    Module {activeModuleIdx + 1} · Lesson {activeLessonIdx + 1}
                  </span>
                  <h1>{activeLesson?.title || 'Select a lesson'}</h1>
                </div>
                {activeLesson?.hasVideo && (
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
                                className={`learn-lesson-row ${isActive ? 'active' : ''} ${!lesson.hasVideo ? 'locked' : ''}`}
                                onClick={() => goToLesson(mIdx, lIdx)}
                              >
                                <span className="learn-lesson-icon">
                                  {isDone ? <FiCheck /> : lesson.hasVideo ? <FiPlayCircle /> : <FiLock />}
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
