import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBook,
  FiCalendar,
  FiChevronDown,
  FiFilter,
  FiGrid,
  FiSliders,
  FiX,
} from 'react-icons/fi';
import CourseCard from './CourseCard.jsx';
import { courseType, courses } from './courseData.js';
import StudentShell from '../components/StudentShell.jsx';

const emptyFilters = {
  level: '',
  courseArea: '',
  topic: '',
  date: '',
  price: '',
  location: '',
};

const courseAreaOptions = ['Cloud','Devops','Excel Workshop','Data Science','AI/ML','SQL','Java','Web Development'];

const priceFilterLabels = {
  'under-500': 'Under $500',
  '500-1000': '$500 - $1,000',
  'above-1000': 'Above $1,000',
};

const DATE_FILTER_OPTIONS = ['This Week', 'Next Week', 'This Month', 'Next Month'];

function matchesPrice(course, price) {
  if (!price) return true;
  if (price === 'under-500') return course.price < 500;
  if (price === '500-1000') return course.price >= 500 && course.price <= 1000;
  return course.price > 1000;
}

function parseCourseStartDate(dateStr) {
  if (!dateStr || dateStr === 'Available Now') return null;
  const startPart = dateStr.split(' - ')[0].trim();
  const parsed = new Date(`${startPart} ${new Date().getFullYear()}`);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function getWeekBounds(offsetWeeks) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function getMonthBounds(offsetMonths) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function matchesDate(course, dateFilter) {
  if (!dateFilter) return true;
  const courseDate = parseCourseStartDate(course.date);
  if (!courseDate) return false;
  let bounds;
  if (dateFilter === 'This Week')  bounds = getWeekBounds(0);
  if (dateFilter === 'Next Week')  bounds = getWeekBounds(1);
  if (dateFilter === 'This Month') bounds = getMonthBounds(0);
  if (dateFilter === 'Next Month') bounds = getMonthBounds(1);
  if (!bounds) return true;
  return courseDate >= bounds.start && courseDate <= bounds.end;
}

const WEB_FRONTENDS = ['React.js', 'Vue.js', 'Angular', 'Next.js', 'HTML / CSS / JS'];

function getRecommendedTopics() {
  try {
    const raw = localStorage.getItem('student-portal-registration-draft');
    if (!raw) return new Set();
    const draft = JSON.parse(raw);
    const topics = new Set();
    for (const p of (draft.projects ?? [])) {
      if (!p.isTechnical) continue;
      if (WEB_FRONTENDS.some(f => p.frontEnd === f)) topics.add('Frontend');
      if (p.backEnd && p.backEnd !== '' && p.backEnd !== 'Other') topics.add('Fullstack');
      if (p.techStack === 'Full Stack')          { topics.add('Fullstack'); topics.add('Frontend'); }
      if (p.techStack === 'Front-end Only')        topics.add('Frontend');
      if (p.techStack === 'Back-end Only')         topics.add('Fullstack');
      if (p.techStack === 'Data Science / ML')     topics.add('Data');
      if (p.techStack === 'DevOps / Cloud')        topics.add('Cloud');
    }
    return topics;
  } catch { return new Set(); }
}

export default function Course({ onSignOut }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [courseMode, setCourseMode] = useState('onlineProgram');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const navigate = useNavigate();

  const recommendedTopics = useMemo(() => getRecommendedTopics(), []);

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const updateCourseMode = (value) => {
    setCourseMode(value);
    setFilters(emptyFilters);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setQuery('');
  };

  const activeCategory = courseType.find((category) => category.id === courseMode);
  const categoryCourses = courses.filter((course) => course.category === courseMode);
  const activeFilterChips = [
    query.trim()
      ? { key: 'query', label: `Search: ${query.trim()}`, onRemove: () => setQuery('') }
      : null,
    // courseMode !== 'onlineProgram'
    //   ? {
    //       key: 'category',
    //       label: activeCategory?.label,
    //       onRemove: () => updateCourseMode('onlineProgram'),
    //     }
    //   : null,
    filters.price
      ? {
          key: 'price',
          label: priceFilterLabels[filters.price],
          onRemove: () => updateFilter('price', ''),
        }
      : null,
    filters.level
      ? { key: 'level', label: `Level: ${filters.level}`, onRemove: () => updateFilter('level', '') }
      : null,
    filters.courseArea
      ? {
          key: 'courseArea',
          label: filters.courseArea,
          onRemove: () => updateFilter('courseArea', ''),
        }
      : null,
    filters.topic
      ? { key: 'topic', label: `Topic: ${filters.topic}`, onRemove: () => updateFilter('topic', '') }
      : null,
    filters.date
      ? { key: 'date', label: `Date: ${filters.date}`, onRemove: () => updateFilter('date', '') }
      : null,
    courseMode === 'offlineProgram' && filters.location
      ? {
          key: 'location',
          label: `Location: ${filters.location}`,
          onRemove: () => updateFilter('location', ''),
        }
      : null,
  ].filter(Boolean);

  const filterOptions = useMemo(
    () => ({
      level: [...new Set(categoryCourses.map((course) => course.level))],
      topic: [...new Set(categoryCourses.map((course) => course.topic))],
      date: [...new Set(categoryCourses.map((course) => course.date))],
      location: [...new Set(categoryCourses.map((course) => course.location).filter(Boolean))],
    }),
    [categoryCourses],
  );

  const visibleCourses = categoryCourses.filter((course) => {
    const haystack = [
      course.title,
      course.instructor,
      course.description,
      course.level,
      course.courseArea,
      course.topic,
      course.format,
      course.platform,
      course.location,
    ]
      .join(' ')
      .toLowerCase();

    return (
      haystack.includes(query.trim().toLowerCase()) &&
      (!filters.level || course.level === filters.level) &&
      (!filters.courseArea || course.courseArea === filters.courseArea) &&
      (!filters.topic || course.topic === filters.topic) &&
      matchesDate(course, filters.date) &&
      (courseMode !== 'offlineProgram' || !filters.location || course.location === filters.location) &&
      matchesPrice(course, filters.price)
    );
  });

  return (
    <StudentShell
      onSignOut={onSignOut}
      profileClassName="course-topnav-profile d-flex align-items-start gap-2"
    >
        <main className="course-shell">
          <section className="course-phone-panel">
            <div className="course-phone-topbar">
               {/* <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> */}
              <span>Courses</span>
             
              
            </div>
           
            <h1>{activeCategory?.label}</h1>
            <p>Enhance your skills with flexible, expert-led learning paths.</p>

            <div className="course-mode-tabs" aria-label="Course categories">
              {courseType.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  className={courseMode === category.id ? 'active' : ''}
                  onClick={() => updateCourseMode(category.id)}
                >
                  {category.shortLabel}
                </button>
              ))}
              <button
                type="button"
                className="course-filter-trigger"
                aria-label="Open filters"
                onClick={() => setFiltersOpen(true)}
              >
                <FiSliders />
              </button>
            </div>

            {/* <div className="course-search-row">
              <label className="course-search-field">
                <FiSearch />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search courses, skills, or topics..."
                />
              </label>
            </div> */}

            {activeFilterChips.length > 0 && (
              <div className="course-active-filters" aria-label="Active filters">
                {activeFilterChips.map((chip) => (
                  <button type="button" key={chip.key} onClick={chip.onRemove}>
                    {chip.label}
                    <FiX />
                  </button>
                ))}
              </div>
            )}

            <div className="course-results-count">
              {visibleCourses.length} course{visibleCourses.length === 1 ? '' : 's'} found
            </div>

            <div className="course-booking-list">
              {visibleCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  {...course}
                  isRecommended={recommendedTopics.has(course.topic)}
                  actionLabel={course.category === 'onDemand' ? 'View Course' : 'Reserve Seat'}
                  onAction={() => navigate(`/courses/${course.id}`)}
                />
              ))}
              {visibleCourses.length === 0 && (
                <div className="course-empty-state">
                  No courses match this search. Try clearing a filter.
                </div>
              )}
            </div>
          </section>
        </main>

      <div className={`course-filter-overlay ${filtersOpen ? 'open' : ''}`}>
        <aside className="course-filter-panel" aria-label="Course filters">
          <div className="filter-panel-header">
            <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)}>
              <FiX />
            </button>
              <strong style={{ fontSize: 20, fontWeight: 600 }}>Filters</strong>
            {/* <button type="button" onClick={resetFilters} style={{ fontSize: 12, fontWeight: 600 }}>
              Clear All
            </button> */}
          </div>

          <FilterSelect
            icon={<FiGrid />}
            label="Course Type"
            value={courseMode}
            onChange={updateCourseMode}
            options={courseType.map((category) => ({
              value: category.id,
              label: category.label,
            }))}
          />
          <FilterSelect
            icon={<FiCalendar />}
            label="Date"
            value={filters.date}
            onChange={(value) => updateFilter('date', value)}
            options={[{ value: '', label: 'Any date' }, ...DATE_FILTER_OPTIONS.map((v) => ({ value: v, label: v }))]}
          />
          
          <FilterSelect
            icon={<FiGrid />}
            label="Course Category"
            value={filters.courseArea}
            onChange={(value) => updateFilter('courseArea', value)}
            options={[{ value: '', label: 'Any category' }, ...courseAreaOptions.map((value) => ({ value, label: value }))]}
          />
          
          <FilterSelect
            icon={<FiBook />}
            label="Price"
            value={filters.price}
            onChange={(value) => updateFilter('price', value)}
            options={[
              { value: '', label: 'Any price' },
              { value: 'under-1000', label: 'Under ₹1,000' },
              { value: '1,000-3,000', label: '₹1,000 - ₹3,000' },
              { value: '3,000-6,000', label: '₹3,000 - ₹6,000' },
              { value: 'above-6000', label: 'Above ₹6,000' },
            ]}
          />
          <FilterSelect
            icon={<FiFilter />}
            label="Level"
            value={filters.level}
            onChange={(value) => updateFilter('level', value)}
            options={[{ value: '', label: 'Any level' }, ...filterOptions.level.map((value) => ({ value, label: value }))]}
          />

          {courseMode === 'offlineProgram' && (
            <FilterSelect
              icon={<FiGrid />}
              label="Location"
              value={filters.location}
              onChange={(value) => updateFilter('location', value)}
              options={[
                { value: '', label: 'Any location' },
                ...filterOptions.location.map((value) => ({ value, label: value })),
              ]}
            />
          )}
          
          {/* <FilterSelect
            icon={<FiBook />}
            label="Popular Topic"
            value={filters.topic}
            onChange={(value) => updateFilter('topic', value)}
            options={[{ value: '', label: 'Any topic' }, ...filterOptions.topic.map((value) => ({ value, label: value }))]}
          /> */}
          

          <div className="filter-panel-actions">
            <button type="button" onClick={resetFilters}>
              Reset
            </button>
            <button type="button" onClick={() => setFiltersOpen(false)}>
              Apply Filters
            </button>
            {/* <button type="button" onClick={() => setFiltersOpen(false)}>
              Close Filter
            </button> */}
          </div>
        </aside>
      </div>
    </StudentShell>
  );
}

function FilterSelect({ icon, label, value, options, onChange }) {
  return (
    <label className="course-filter-select">
      <span>
        {icon}
        {label}
      </span>
      <div>
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={`${label}-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <FiChevronDown />
      </div>
    </label>
  );
}
