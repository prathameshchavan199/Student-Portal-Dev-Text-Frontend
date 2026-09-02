import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiStar, FiX, FiSearch } from 'react-icons/fi';

/* Shared, scoped CSS for every Peer to Peer page — mirrors the same tokens and
 * conventions used elsewhere in the app (Dashboard's .db-card/.db-section-label,
 * the Courses page's badges/buttons) rather than inventing a new visual style. */
export const peerStyles = `
  .pp-input, .pp-select, .pp-textarea {
    width: 100%; padding: 10px 12px; border-radius: 10px;
    border: 1px solid var(--border-color); background: var(--input-bg);
    font-size: 14px; color: var(--text-heading); font-family: inherit;
    box-sizing: border-box;
  }
  .pp-input:focus, .pp-select:focus, .pp-textarea:focus {
    outline: none; border-color: var(--brand-blue); background: #fff;
  }
  .pp-textarea { resize: vertical; min-height: 70px; }
  .pp-label {
    display: block; font-size: 12px; font-weight: 600; color: var(--text-subtle);
    margin-bottom: 6px;
  }

  /* Buttons — same radius/weight/min-height as .course-booking-action's primary CTA. */
  .pp-btn-primary {
    padding: 12px 20px; min-height: 44px; border-radius: 8px; border: none; cursor: pointer;
    font-weight: 800; font-size: 13px; color: #fff; background: var(--grad-btn);
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  }
  .pp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .pp-btn-ghost {
    padding: 12px 20px; min-height: 44px; border-radius: 8px; cursor: pointer; font-weight: 700;
    font-size: 13px; color: var(--text-body); background: var(--card-bg);
    border: 1px solid var(--border-color);
  }
  .pp-btn-danger {
    padding: 8px 14px; border-radius: 8px; cursor: pointer; font-weight: 700;
    font-size: 12px; color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);
  }
  .pp-btn-accept {
    padding: 8px 14px; border-radius: 8px; cursor: pointer; font-weight: 700;
    font-size: 12px; color: #fff; background: #16a34a; border: none;
  }

  /* Card — same radius/border/padding as .db-card. */
  .pp-card {
    background: var(--card-bg); border: 1px solid var(--border-color);
    border-radius: 18px; padding: 18px;
  }

  /* Small rounded icon chip — same look as .course-booking-icon / .session-icon. */
  .pp-icon-chip {
    width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
    background: rgba(76, 111, 255, 0.12); color: var(--brand-blue);
    display: inline-flex; align-items: center; justify-content: center;
  }
  .pp-icon-chip.orange { background: rgba(255, 107, 0, 0.12); color: var(--brand-orange); }
  .pp-icon-chip.green { background: rgba(21, 128, 61, 0.12); color: #15803d; }

  .pp-tab {
    padding: 9px 16px; border-radius: 10px; font-size: 13px; font-weight: 700;
    cursor: pointer; border: 1px solid var(--border-color); background: var(--card-bg);
    color: var(--text-subtle); white-space: nowrap;
  }
  .pp-tab.active { background: var(--grad-btn); color: #fff; border-color: transparent; }
`;

/* Page shell used by every Peer to Peer page — reuses the exact same
 * .course-shell / .course-phone-panel / .course-phone-topbar structure and
 * h1/p styling as the Courses page, so it looks like part of the same app
 * rather than a bolted-on section. showBack renders the same back button
 * used on the Course Details page header. */
export function PeerPanel({ icon: Icon, topbarLabel = 'Peer to Peer', title, subtitle, showBack = false, children }) {
  const navigate = useNavigate();
  return (
    <main className="course-shell">
      <section className="course-phone-panel">
        <div className="course-phone-topbar">
          {showBack && (
            <button type="button" className="mcq-topbar-back" aria-label="Go back" onClick={() => navigate(-1)}>
              <FiArrowLeft />
            </button>
          )}
          {Icon && <Icon />}
          <span>{topbarLabel}</span>
        </div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </section>
    </main>
  );
}

/* Pill-style multi-value input: type + press Enter/comma to add, click x to remove. */
export function TagInput({ values, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const list = values || [];

  const commit = () => {
    const v = draft.trim();
    if (v && !list.includes(v)) onChange([...list, v]);
    setDraft('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && !draft && list.length) {
      onChange(list.slice(0, -1));
    }
  };

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
      padding: '8px 10px', borderRadius: 10, border: '1px solid var(--border-color)',
      background: 'var(--input-bg)',
    }}>
      {list.map((tag) => (
        <span key={tag} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px',
          borderRadius: 999, background: '#fff', border: '1px solid var(--border-color)',
          fontSize: 12, fontWeight: 600, color: 'var(--text-body)',
        }}>
          {tag}
          <FiX size={12} style={{ cursor: 'pointer', color: 'var(--text-subtle)' }}
            onClick={() => onChange(list.filter((t) => t !== tag))} />
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={list.length ? '' : (placeholder || 'Type and press Enter')}
        style={{
          flex: 1, minWidth: 100, border: 'none', outline: 'none', background: 'transparent',
          fontSize: 13, padding: '4px 2px',
        }}
      />
    </div>
  );
}

/* Type-ahead tag input: suggests matching options from a dummy list as you type
 * (same dropdown look as the course search bar), and shows picked values as
 * removable chips below — same look as the Courses page's active-filter chips.
 * Falls back to adding whatever's typed if it doesn't match a suggestion. */
export function SuggestTagInput({ values, onChange, options, placeholder }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const list = values || [];

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (options || [])
      .filter((opt) => !list.includes(opt))
      .filter((opt) => !q || opt.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, options, list]);

  const addValue = (val) => {
    const v = (val || '').trim();
    if (v && !list.includes(v)) onChange([...list, v]);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addValue(suggestions.length > 0 ? suggestions[0] : query);
    } else if (e.key === 'Backspace' && !query && list.length) {
      onChange(list.slice(0, -1));
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <label className="course-search-field">
        <FiSearch size={14} />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Start typing…'}
        />
      </label>

      {open && query.trim() && (
        <div className="dashboard-course-results">
          {suggestions.length > 0 ? (
            suggestions.map((opt) => (
              <button type="button" key={opt} onMouseDown={(e) => e.preventDefault()} onClick={() => addValue(opt)}>
                <span><strong>{opt}</strong></span>
              </button>
            ))
          ) : (
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addValue(query)}>
              <span><strong>Add "{query.trim()}"</strong></span>
            </button>
          )}
        </div>
      )}

      {list.length > 0 && (
        <div className="course-active-filters" style={{ marginTop: 10 }}>
          {list.map((tag) => (
            <button type="button" key={tag} onClick={() => onChange(list.filter((t) => t !== tag))}>
              {tag}
              <FiX />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const STATUS_STYLE = {
  PENDING:   { bg: 'rgba(255, 107, 0, 0.12)', border: 'rgba(255, 107, 0, 0.3)', color: '#c2410c', label: 'Pending' },
  ACCEPTED:  { bg: 'rgba(76, 111, 255, 0.12)', border: 'rgba(76, 111, 255, 0.3)', color: '#1d4ed8', label: 'Accepted' },
  REJECTED:  { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', label: 'Rejected' },
  CANCELLED: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', color: '#ef4444', label: 'Cancelled' },
  COMPLETED: { bg: 'rgba(21, 128, 61, 0.12)', border: 'rgba(21, 128, 61, 0.3)', color: '#15803d', label: 'Completed' },
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: 'var(--bg-7)', border: 'var(--border-color)', color: 'var(--text-subtle)', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

/* Read-only stars (for cards) or an interactive picker (for the review form).
 * Uses the app's brand-orange accent, same as the star icon on course pages. */
export function StarRating({ value = 0, onChange, size = 15 }) {
  const interactive = typeof onChange === 'function';
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <FiStar
          key={n}
          size={size}
          onClick={interactive ? () => onChange(n) : undefined}
          style={{
            cursor: interactive ? 'pointer' : 'default',
            fill: n <= Math.round(value) ? 'var(--brand-orange)' : 'none',
            color: n <= Math.round(value) ? 'var(--brand-orange)' : 'var(--border-color)',
          }}
        />
      ))}
    </span>
  );
}