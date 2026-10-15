import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiAward, FiClock, FiZap } from 'react-icons/fi';

/* Answer-option tones. Built from the app's own brand palette (blue,
 * orange, purple, green, plus amber/sky for 5th/6th options) instead of
 * a separate "game" palette, so Kahoot reads as part of the same product.
 * Each option also carries a letter badge, so color is never the only
 * thing telling options apart. */
export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
export const toneClass = (i) => `kh-tone-${i % 6}`;

/* Same page shell every other student page uses (.course-shell >
 * .course-phone-panel > .course-phone-topbar), so the gradient top bar,
 * dotted background and orange serif heading all match. */
export function KahootPanel({ title, subtitle, backTo, children }) {
  const navigate = useNavigate();
  return (
    <main className="course-shell kh-shell">
      <section className="course-phone-panel kh-panel">
        <div className="course-phone-topbar">
          {backTo && (
            <button type="button" className="mcq-topbar-back" aria-label="Go back" onClick={() => navigate(backTo)}>
              <FiArrowLeft />
            </button>
          )}
          <FiZap />
          <span>Kahoot Learning</span>
        </div>
        {title && <h1>{title}</h1>}
        {subtitle && <p>{subtitle}</p>}
        <div className="kh-body">{children}</div>
      </section>
    </main>
  );
}

/* Countdown as a bar that drains, with the number alongside. Turns red
 * for the last 5 seconds so urgency is visible at a glance. */
export function KahootTimer({ seconds, total }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (seconds / total) * 100)) : 0;
  return (
    <div className={`kh-timer-wrap ${seconds <= 5 ? 'urgent' : ''}`}>
      <span className="kh-timer"><FiClock /> {seconds}s</span>
      <div className="kh-timer-track">
        <div className="kh-timer-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* Ranked list. `youRank` (1-based, from the server) highlights the
 * caller's own row. `offset` lets a list that starts at 4th place (under
 * the podium) still show correct rank numbers. */
export function Leaderboard({ rows, youRank, title = 'Leaderboard', offset = 0 }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="kh-leaderboard">
      {title && <div className="kh-leaderboard-head"><FiAward /> {title}</div>}
      {rows.map((p, i) => {
        const rank = i + 1 + offset;
        return (
          <div key={rank} className={`kh-leaderboard-row ${youRank === rank ? 'is-you' : ''}`}>
            <span className="kh-leaderboard-rank">{rank}</span>
            <span className="kh-leaderboard-name">
              {p.nickname}
              {youRank === rank && <em>You</em>}
            </span>
            <span className="kh-leaderboard-score">{p.score.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Top-3 podium (2nd | 1st | 3rd) for the final screen. Falls back to a
 * plain list rendering for however many players there actually are. */
export function Podium({ rows, youRank }) {
  const top = (rows || []).slice(0, 3);
  if (top.length === 0) return null;
  const order = [1, 0, 2].filter((i) => top[i]);
  return (
    <div className="kh-podium">
      {order.map((i) => (
        <div key={i} className={`kh-podium-col place-${i + 1}`}>
          <div className="kh-podium-name">
            {top[i].nickname}
            {youRank === i + 1 && <em>You</em>}
          </div>
          <div className="kh-podium-score">{top[i].score.toLocaleString()}</div>
          <div className="kh-podium-block">{i + 1}</div>
        </div>
      ))}
    </div>
  );
}
