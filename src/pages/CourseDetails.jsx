import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiAward,
  FiBookOpen,
  FiBookmark,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiLayers,
  FiMapPin,
  FiMonitor,
  FiStar,
  FiTrendingUp,
  FiUser,
} from 'react-icons/fi';
import StudentShell from '../components/StudentShell.jsx';
import CourseCard from './CourseCard.jsx';
import { courses, getCourseById } from './courseData.js';

const detailTabs = ['Overview', 'Curriculum', 'Instructor', 'Reviews'];

const learningPoints = [
  'Build practical concepts from basics to advanced patterns',
  'Work through applied exercises and real-world examples',
  'Understand tools, workflows, and professional best practices',
  'Complete guided projects that strengthen your portfolio',
];

const curriculumModules = [
  {
    title: 'Module 1: Foundations',
    lessons: 3,
    details: ['Course introduction', 'Core concepts', 'Environment setup'],
  },
  {
    title: 'Module 2: Applied Workflows',
    lessons: 5,
    details: ['Hands-on workflow', 'Guided practice', 'Common mistakes', 'Case study', 'Knowledge check'],
  },
  {
    title: 'Module 3: Visualization and Tools',
    lessons: 4,
    details: ['Tool overview', 'Data interpretation', 'Visual examples', 'Practice task'],
  },
  {
    title: 'Module 4: Advanced Practice',
    lessons: 4,
    details: ['Advanced patterns', 'Problem solving', 'Optimization', 'Review exercise'],
  },
  {
    title: 'Module 5: Real-world Projects',
    lessons: 2,
    details: ['Project brief', 'Final implementation'],
  },
];

const reviewList = [
  {
    name: 'Aman Verma',
    rating: 5,
    text: 'The sessions were clear, practical, and easy to follow. The project examples helped me understand the workflow quickly.',
  },
  {
    name: 'Priya Nair',
    rating: 4,
    text: 'Great balance of concepts and hands-on practice. The instructor explained difficult topics in a very approachable way.',
  },
  {
    name: 'Rahul Mehta',
    rating: 5,
    text: 'Loved the structure of the course. The curriculum felt focused and the final project was useful for my portfolio.',
  },
];

export default function CourseDetails({ onSignOut }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const course = getCourseById(courseId);
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
              {course.imageUrl ? (
                <img src={course.imageUrl} alt={course.title} />
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
                onClick={() => navigate(`/courses/${course.id}/payment?session=${selectedSession}`)}>
                Continue 
                {/* <FiLayers /> */}
              </button>
            </aside>
          </div>

          <div className="course-detail-stats">
            <DetailStat icon={FiTrendingUp} label="Level" value={course.level} />
            <DetailStat icon={FiClock} label="Duration" value={course.duration} />
            <DetailStat icon={FiBookOpen} label="Lessons" value={isOnDemand ? '18' : sessions.length} />
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
              <CourseTabContent activeTab={activeTab} course={course} />
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

function CourseTabContent({ activeTab, course }) {
  if (activeTab === 'Curriculum') {
    return <CourseCurriculum modules={curriculumModules} />;
  }

  if (activeTab === 'Instructor') {
    return <CourseInstructor course={course} />;
  }

  if (activeTab === 'Reviews') {
    return <CourseReviews reviews={reviewList} />;
  }

  return (
    <>
      <h2>About this Course</h2>
      <p>
        Learn {course.topic.toLowerCase()} through a structured path designed for practical skill building,
        guided sessions, and project-focused outcomes.
      </p>

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
  );
}

function CourseCurriculum({ modules }) {
  const [openModule, setOpenModule] = useState(modules[0]?.title);
  const totalLessons = modules.reduce((total, module) => total + module.lessons, 0);

  return (
    <div className="course-curriculum">
      <div className="course-curriculum-header">
        <h2>Curriculum</h2>
        <span>{totalLessons} Lessons</span>
      </div>
      <div className="course-curriculum-list">
        {modules.map((module) => (
          <div key={module.title} className={`course-curriculum-item ${openModule === module.title ? 'open' : ''}`}>
            <button
              type="button"
              className="course-curriculum-module"
              onClick={() => setOpenModule((current) => (current === module.title ? '' : module.title))}
              aria-expanded={openModule === module.title}
            >
              <strong>{module.title}</strong>
              <span>{module.lessons} Lessons</span>
              <FiChevronDown />
            </button>
            {openModule === module.title && (
              <div className="course-curriculum-details">
                {module.details.map((detail, index) => (
                  <div key={detail}>
                    <FiCheckCircle />
                    <span>Lesson {index + 1}</span>
                    <strong>{detail}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
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
  return (
    <div className="course-reviews">
      <div className="course-reviews-header">
        <h2>Student Reviews</h2>
        <span>4.8 average rating</span>
      </div>
      <div className="course-review-list">
        {reviews.map((review) => (
          <article key={review.name} className="course-review-card">
            <div>
              <strong>{review.name}</strong>
              <span>
                {Array.from({ length: review.rating }).map((_, index) => (
                  <FiStar key={`${review.name}-${index}`} />
                ))}
              </span>
            </div>
            <p>{review.text}</p>
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
