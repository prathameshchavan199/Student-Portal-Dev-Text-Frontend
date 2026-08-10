import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FiArrowLeft,
  FiArrowRight,
  FiBook,
  FiClipboard,
  FiFolder,
  FiGrid,
  FiTrendingUp,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { GradientButton } from './UI.jsx';

const NEW_USER_KEY = 'sp-new-signup';
const TOUR_SEEN_KEY = 'sp-tour-seen';
export const TOUR_OPEN_EVENT = 'sp:open-tour';

const MOBILE_BREAKPOINT = 740;

const STEPS = [
  {
    selector: '[data-tour="nav-registration"]',
    icon: FiFolder,
    title: 'Complete your Registration',
    body: 'Fill in your details across three steps — Details, Projects & Experience, and Preview. "Save as Draft" lets you pick up later, even from another device.',
  },
  {
    selector: '[data-tour="reg-progress-card"]',
    icon: FiGrid,
    title: 'Track your progress',
    body: 'This card shows how much of your registration is complete, and flips to "Verification in Progress" once you submit.',
  },
  {
    selector: '[data-tour="nav-courses"]',
    icon: FiBook,
    title: 'Browse Courses',
    body: 'Filter by course type and category. "Reserve Seat" books a live session; "View Course" opens on-demand content.',
  },
  {
    selector: '[data-tour="nav-course-progress"]',
    icon: FiTrendingUp,
    title: 'Course Progress',
    body: "Keep an eye on how far you've gotten in each course you're enrolled in.",
  },
  {
    selector: '[data-tour="nav-assessment"]',
    icon: FiClipboard,
    title: 'Assessments',
    body: 'Take skill assessments here to measure and showcase your progress.',
  },
  {
    selector: '[data-tour="profile-chip"]',
    icon: FiUser,
    title: 'Your Profile',
    body: 'View your submitted details and documents anytime. Replay this tour from Account Settings whenever you like.',
  },
];

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

function isOnScreen(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth;
}

function closeMobileNavIfOpen() {
  if (document.querySelector('.sidebar')?.classList.contains('open')) {
    document.querySelector('.mobile-nav-close')?.click();
  }
}

export default function WelcomeTour() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    const isNewUser = localStorage.getItem(NEW_USER_KEY) === 'true';
    const tourSeen = localStorage.getItem(TOUR_SEEN_KEY) === 'true';
    if (isNewUser && !tourSeen && location.pathname === '/dashboard') {
      setStepIndex(0);
      setOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleManualOpen = () => {
      setStepIndex(0);
      setOpen(true);
    };
    window.addEventListener(TOUR_OPEN_EVENT, handleManualOpen);
    return () => window.removeEventListener(TOUR_OPEN_EVENT, handleManualOpen);
  }, []);

  const finishTour = () => {
    localStorage.setItem(TOUR_SEEN_KEY, 'true');
    localStorage.removeItem(NEW_USER_KEY);
    closeMobileNavIfOpen();
    setOpen(false);
    setRect(null);
    setTooltipPos(null);
  };

  // Locate + measure the current step's target, opening/closing the mobile
  // nav drawer as needed since nav-item targets only exist on-screen there.
  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;

    const run = async () => {
      const step = STEPS[stepIndex];
      const needsMobileNav = step.selector.includes('"nav-');
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

      if (isMobile) {
        const navOpen = document.querySelector('.sidebar')?.classList.contains('open');
        if (needsMobileNav && !navOpen) {
          document.querySelector('.mobile-nav-toggle')?.click();
          await wait(280);
        } else if (!needsMobileNav && navOpen) {
          document.querySelector('.mobile-nav-close')?.click();
          await wait(280);
        }
      }

      if (cancelled) return;

      const el = document.querySelector(step.selector);
      if (!isOnScreen(el)) {
        setStepIndex((i) => (i < STEPS.length - 1 ? i + 1 : i));
        return;
      }

      el.scrollIntoView({ block: 'center' });
      await wait(60);
      if (!cancelled) setRect(el.getBoundingClientRect());
    };

    run();
    window.addEventListener('resize', run);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', run);
    };
  }, [open, stepIndex]);

  // Position the tooltip once both the target rect and tooltip size are known.
  useLayoutEffect(() => {
    if (!rect || !tooltipRef.current) return;
    const tip = tooltipRef.current.getBoundingClientRect();
    const margin = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = rect.bottom + margin;
    if (top + tip.height > vh - 12) top = rect.top - tip.height - margin;

    let left = rect.left + rect.width / 2 - tip.width / 2;
    left = Math.max(12, Math.min(left, vw - tip.width - 12));
    top = Math.max(12, Math.min(top, vh - tip.height - 12));

    setTooltipPos({ top, left });
  }, [rect, stepIndex]);

  if (!open || !rect) return null;

  const step = STEPS[stepIndex];
  const Icon = step.icon;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;
  const ringPadding = 8;

  return (
    <div className="tour-overlay" role="presentation">
      <div
        className="tour-highlight-ring"
        style={{
          top: rect.top - ringPadding,
          left: rect.left - ringPadding,
          width: rect.width + ringPadding * 2,
          height: rect.height + ringPadding * 2,
        }}
      />
      <div
        ref={tooltipRef}
        className="tour-tooltip"
        role="dialog"
        aria-modal="true"
        aria-label="App walkthrough"
        style={tooltipPos
          ? { top: tooltipPos.top, left: tooltipPos.left, opacity: 1 }
          : { top: rect.bottom, left: rect.left, opacity: 0 }}
      >
        <button type="button" className="tour-close" aria-label="Skip tour" onClick={finishTour}>
          <FiX />
        </button>
        <div className="tour-tip-icon">
          <Icon />
        </div>
        <h4>{step.title}</h4>
        <p>{step.body}</p>

        <div className="tour-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`tour-dot${i === stepIndex ? ' active' : ''}`} />
          ))}
        </div>

        <div className="tour-nav">
          {isFirst ? (
            <button type="button" className="reg-btn reg-btn-sm" onClick={finishTour}>
              Skip
            </button>
          ) : (
            <button type="button" className="reg-btn reg-btn-sm" onClick={() => setStepIndex((i) => i - 1)}>
              <FiArrowLeft /> Back
            </button>
          )}
          <GradientButton
            style={{ maxWidth: 150, padding: '5px 16px', fontSize: 14 }}
            onClick={() => (isLast ? finishTour() : setStepIndex((i) => i + 1))}
          >
            {isLast ? 'Done' : (<>Next <FiArrowRight /></>)}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
