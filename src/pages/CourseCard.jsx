import {
  FiArrowRight,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiMonitor,
} from 'react-icons/fi';



export default function CourseCard({
  title,
  instructor,
  description,
  imageUrl,
  date,
  time,
  platform,
  startsIn,
  category,
  price,
  showPrice = true,
  isRecommended = false,
  actionLabel = 'Reserve Seat',
  onAction,
}) {
  const isOnDemand = category === 'onDemand';
  const PlatformIcon = isOnDemand ? FiMonitor : FiMapPin;
  const originalPrice = price ? Math.round(price * 1.35) : null;
  const formatPrice = (value) => `${value.toLocaleString()}`;

  return (
    <div className={`course-booking-card course-booking-card-horizontal ${isOnDemand ? 'with-media' : ''}`}>
      <div className="course-booking-media">
        {imageUrl ? (
          <img src={imageUrl} alt={title} />
        ) : (
          <div className="course-booking-media-fallback">
            <PlatformIcon />
          </div>
        )}
      </div>

      <div className="course-booking-main">
        <div className="course-booking-heading">
          <div className="course-booking-icon">
            <PlatformIcon />
          </div>
          <div>
           
            <div className="course-booking-title">
              <span>{title}</span>
              {isRecommended && (
                <span className="course-recommended-badge">Recommended</span>
              )}
            </div>
            <div className="course-booking-instructor">
              Instructor: {instructor || 'Student Platform Faculty'}
            </div>
          </div>
        </div>

        <p className="course-booking-description">{description}</p>
      </div>

      <div className="course-booking-meta">
        {startsIn && <span className="course-start-pill">{startsIn}</span>}
        {date && (
          <span>
            <FiCalendar /> {date}
          </span>
        )}
        {time && (
          <span>
            <FiClock /> {time}
          </span>
        )}
        {platform && (
          <span>
            <PlatformIcon /> {platform}
          </span>
        )}
      </div>
        
      <div className="course-booking-cta">
        {showPrice && price && (
          <div className="course-booking-price">
          <span> <span style={{ color: 'var(--orange)', fontWeight: '500', 'marginRight': '1px','fontSize': '23px' }}>₹</span>{formatPrice(price)}</span>
            <del>₹{formatPrice(originalPrice)}</del>
          </div>
        )}
        <button
          type="button"
          className="course-booking-action"
          onClick={onAction}
        >
          {actionLabel} <FiArrowRight />
        </button>
      </div>
    </div>
  );
}
