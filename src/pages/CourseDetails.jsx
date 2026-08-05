import { useMemo, useState, useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  FiArrowLeft,
  FiAward,
  FiBookOpen,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiMapPin,
  FiMonitor,
  FiStar,
  FiTrendingUp,
  FiUser,
} from 'react-icons/fi';
import StudentShell from '../components/StudentShell.jsx';
import CourseCard from './CourseCard.jsx';
import { useCourses } from '../context/CourseContext.jsx';
import { API_BASE_URL } from '../api/axiosSetup.js';

const courseImageSrc = (course) =>
  course?.imageKey ? `${API_BASE_URL}/api/courses/${course.id}/image` : course?.imageUrl;

const detailTabs = ['Overview', 'Curriculum', 'Instructor', 'Reviews'];

export default function CourseDetails({ onSignOut }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [reviews, setReviews] = useState([]);
  const { courses, getCourseById, loading } = useCourses();
  const course = getCourseById(courseId);

  useEffect(() => {
    if (!courseId) return;
    axios.get(`${API_BASE_URL}/api/courses/${courseId}/reviews`)
      .then(res => { if (res.data?.success) setReviews(res.data.data); })
      .catch(() => {});
  }, [courseId]);
  const sessions = useMemo(
    () =>
      course?.sessions || [
        {
          id: 'default',
          title: course?.category === 'onDemand' ? 'Instant Access' : 'Primary Batch',
          date: course?.date,
          time: course?.time,
        },
      ],
    [course],
  );
  const [selectedSession, setSelectedSession] = useState(sessions[0]?.id);

  const relatedCourses = useMemo(
    () =>
      courses
        .filter((c) => c.id !== courseId && (c.category === course?.category || c.topic === course?.topic))
        .slice(0, 3),
    [courseId, course],
  );

  if (loading) {
    return (
      <StudentShell onSignOut={onSignOut}>
        <main className="course-shell">
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading…
          </div>
        </main>
      </StudentShell>
    );
  }

  if (!course) return <Navigate to="/courses" replace />;

  const isOnDemand = course.category === 'onDemand';
  const FormatIcon = isOnDemand ? FiMonitor : FiMapPin;
  const progress = isOnDemand ? 75 : 42;
  const originalPrice = Math.round(course.price * 1.35);

  return (
    <StudentShell onSignOut={onSignOut}>
      <main className="course-shell">
        <section className="course-detail-shell">
          <div className="course-phone-topbar course-detail-header">
            <button type="button" className="mcq-topbar-back" aria-label="Go back" onClick={() => navigate(-1)}>
              <FiArrowLeft />
            </button>
            <span>Course Details</span>
            {/* <button type="button" aria-label="Save course">
              <FiBookmark />
            </button> */}
          </div>

          <div className="course-detail-hero">
            <div className="course-detail-media">
              {courseImageSrc(course) ? (
                <img src={courseImageSrc(course)} alt={course.title} />
              ) : (
                <div className="course-detail-media-fallback">
                  <FormatIcon />
                  <span>{course.topic}</span>
                </div>
              )}
            </div>

            <div className="course-detail-summary">
              <span className="course-detail-level">{course.level}</span>
              <h1>{course.title}</h1>
              <div className="course-detail-rating">
                <FiStar />
                <strong>4.8</strong>
                <span>({course.seatsLeft || 24} ratings)</span>
                <span>{isOnDemand ? '18 lessons' : course.duration}</span>
              </div>
              <p>{course.description}</p>

              {/* <div className="course-detail-progress">
                <div>
                  <span style={{ width: `${progress}%` }} />
                </div>
                <strong>{progress}% Complete</strong>
              </div> */}
            </div>

            <aside className="course-detail-enroll">
              <span>Program Fee</span>
              <strong><span >₹</span>{course.price.toLocaleString()}</strong>
              <del><span st>₹</span>{originalPrice.toLocaleString()}</del>
              <button
                type="button"
                className="course-booking-action"
onClick={() => {
  console.log("course:", course);
  console.log("course.id:", course.id);
  console.log("URL:", `/courses/${course.id}/payment?session=${selectedSession}`);

  navigate(`/courses/${course.id}/payment?session=${selectedSession}`);
}}>                Continue 
                {/* <FiLayers /> */}
              </button>
            </aside>
          </div>

          <div className="course-detail-stats">
            <DetailStat icon={FiTrendingUp} label="Level" value={course.level} />
            <DetailStat icon={FiClock} label="Duration" value={course.duration} />
            <DetailStat icon={FiBookOpen} label="Lessons" value={
              (course.curriculum || []).reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) || sessions.length
            } />
            <DetailStat icon={FiAward} label="Certificate" value="Yes" />
          </div>

          <div className="course-detail-tabs">
            {detailTabs.map((tab) => (
              <button
                type="button"
                key={tab}
                className={activeTab === tab ? 'active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="course-detail-content">
            <section className="course-detail-copy">
              <CourseTabContent activeTab={activeTab} course={course} reviews={reviews} />
            </section>

            <aside className="course-detail-sessions">
              <h3>Available Sessions</h3>
              {sessions.map((session) => (
                <button
                  type="button"
                  key={session.id}
                  className={selectedSession === session.id ? 'selected' : ''}
                  onClick={() => setSelectedSession(session.id)}
                >
                  <span>
                    <strong>{session.title}</strong>
                    {session.date}
                    <small>{session.time}</small>
                  </span>
                  <FiCheckCircle />
                </button>
              ))}
            </aside>
          </div>

          {relatedCourses.length > 0 && (
            <div className=''>
            <div className="course-detail-related ">
              <h2 className="course-detail-related-title">Related Courses</h2>
              <div className="course-booking-list">
                {relatedCourses.map((c) => (
                  <CourseCard
                    key={c.id}
                    {...c}
                    actionLabel={c.category === 'onDemand' ? 'View Course' : 'Reserve Seat'}
                    onAction={() => { navigate(`/courses/${c.id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  />
                ))}
              </div>
            </div>
            </div>
          )}
        </section>
      </main>
    </StudentShell>
  );
}

function CourseTabContent({ activeTab, course, reviews }) {
  if (activeTab === 'Curriculum') {
    return <CourseCurriculum modules={course.curriculum || []} />;
  }

  if (activeTab === 'Instructor') {
    return <CourseInstructor course={course} />;
  }

  if (activeTab === 'Reviews') {
    return <CourseReviews reviews={reviews} />;
  }

  // Overview tab
  const learningPoints = course.youWillLearn || [];
  return (
    <>
      <h2>About this Course</h2>
      <p>
        {course.aboutCourse ||
          `Learn ${(course.topic || 'this subject').toLowerCase()} through a structured path designed for practical skill building, guided sessions, and project-focused outcomes.`}
      </p>

      {learningPoints.length > 0 && (
        <>
          <h3>You will learn</h3>
          <ul>
            {learningPoints.map((point) => (
              <li key={point}>
                <FiCheckCircle />
                {point}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function CourseCurriculum({ modules }) {
  const [openModule, setOpenModule] = useState(modules[0]?.title ?? '');
  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);

  if (modules.length === 0) {
    return (
      <div className="course-curriculum">
        <div className="course-curriculum-header"><h2>Curriculum</h2></div>
        <p style={{ color: 'var(--text-subtle)', padding: '1rem 0' }}>No curriculum added yet.</p>
      </div>
    );
  }

  return (
    <div className="course-curriculum">
      <div className="course-curriculum-header">
        <h2>Curriculum</h2>
        <span>{totalLessons} Lesson{totalLessons !== 1 ? 's' : ''}</span>
      </div>
      <div className="course-curriculum-list">
        {modules.map((module) => {
          const lessonList = module.lessons ?? [];
          return (
            <div key={module.title} className={`course-curriculum-item ${openModule === module.title ? 'open' : ''}`}>
              <button
                type="button"
                className="course-curriculum-module"
                onClick={() => setOpenModule((cur) => (cur === module.title ? '' : module.title))}
                aria-expanded={openModule === module.title}
              >
                <strong>{module.title}</strong>
                <span>{lessonList.length} Lesson{lessonList.length !== 1 ? 's' : ''}</span>
                <FiChevronDown />
              </button>
              {openModule === module.title && (
                <div className="course-curriculum-details">
                  {lessonList.map((lessonName, index) => (
                    <div key={`${module.title}-${index}`}>
                      <FiCheckCircle />
                      <span>Lesson {index + 1}</span>
                      <strong>{lessonName}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CourseInstructor({ course }) {
  return (
    <div className="course-instructor-card">
      <div className="course-instructor-avatar">
        <FiUser />
      </div>
      <div className="course-instructor-main">
        <span>Instructor</span>
        <h2>{course.instructor}</h2>
        <p>
          {course.instructor} is a senior mentor with 8+ years of experience in {course.topic.toLowerCase()},
          applied projects, and student-focused training programs.
        </p>
        <div className="course-instructor-meta">
          <span>4.8 Rating</span>
          <span>1,240 Students</span>
          <span>12 Courses</span>
        </div>
      </div>
    </div>
  );
}

function CourseReviews({ reviews }) {
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <div className="course-reviews">
      <div className="course-reviews-header">
        <h2>Student Reviews</h2>
        <span>{avgRating} average rating</span>
      </div>
      <div className="course-review-list">
        {reviews.length === 0 && (
          <p style={{ color: 'var(--text-subtle)', padding: '1rem 0' }}>No reviews yet.</p>
        )}
        {reviews.map((review) => (
          <article key={review.id ?? review.reviewerName} className="course-review-card">
            <div>
              <strong>{review.reviewerName}</strong>
              <span>
                {Array.from({ length: review.rating }).map((_, index) => (
                  <FiStar key={`${review.reviewerName}-${index}`} />
                ))}
              </span>
            </div>
            <p>{review.reviewText}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function DetailStat({ icon: Icon, label, value }) {
  return (
    <div className="course-detail-stat">
      <Icon />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
