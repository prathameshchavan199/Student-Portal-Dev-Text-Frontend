import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  FiSearch, FiX, FiCheck, FiUser, FiClock, FiUsers, FiFileText,
  FiCheckCircle, FiXCircle, FiMoreVertical, FiCalendar, FiTag,
  FiBarChart2, FiAward,
} from 'react-icons/fi';
import TpoShell from '../../components/TpoShell.jsx';
import TpoPagination from '../../components/TpoPagination.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

const PAGE_SIZE = 8;

const ALL = 'ALL';

/* The three buckets the stat cards / status filter work in. */
const BUCKET = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

function bucketOf(status) {
  if (status === 'PENDING_TPO_APPROVAL') return BUCKET.PENDING;
  if (status === 'REJECTED_BY_TPO' || status === 'REJECTED' || status === 'CANCELLED') return BUCKET.REJECTED;
  return BUCKET.APPROVED;
}

function statusBadge(status) {
  if (status === 'PENDING_TPO_APPROVAL') return { cls: 'tone-amber', label: 'Pending', Icon: FiClock };
  if (status === 'PENDING') return { cls: 'tone-blue', label: 'Tchr. Pending', Icon: FiClock };
  if (status === 'ACCEPTED') return { cls: 'tone-blue', label: 'Accepted', Icon: FiCheckCircle };
  if (status === 'COMPLETED') return { cls: 'tone-green', label: 'Completed', Icon: FiCheckCircle };
  if (status === 'REJECTED_BY_TPO') return { cls: 'tone-red', label: 'Rejected', Icon: FiXCircle };
  if (status === 'REJECTED') return { cls: 'tone-red', label: 'Rejected', Icon: FiXCircle };
  if (status === 'CANCELLED') return { cls: 'tone-red', label: 'Cancelled', Icon: FiXCircle };
  return { cls: 'tone-gray', label: status || '—', Icon: FiClock };
}

function levelTone(level) {
  const l = (level || '').toLowerCase();
  if (l === 'beginner') return 'tone-green';
  if (l === 'intermediate') return 'tone-blue';
  if (l === 'advanced') return 'tone-purple';
  return 'tone-gray';
}

function initialOf(name, fallback) {
  return name?.trim()?.[0]?.toUpperCase() || fallback;
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export default function TpoSessionRequests() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState(ALL);
  const [levelFilter, setLevelFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);

  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const menuRef = useRef(null);

  const load = useCallback(() => {
    setError('');
    setLoading(true);
    const get = (path) =>
      axios
        .get(`${API_BASE_URL}/api/tpo/peer-sessions/${path}`)
        .then((res) => (res.data?.success ? res.data.data || [] : []))
        .catch(() => null);

    Promise.all([get('pending'), get('approved'), get('rejected')])
      .then(([pending, approved, rejected]) => {
        if (pending === null && approved === null && rejected === null) {
          setError('Could not load session requests.');
          setItems([]);
          return;
        }
        const merged = [...(pending || []), ...(approved || []), ...(rejected || [])];
        const seen = new Set();
        setItems(merged.filter((r) => (seen.has(r.id) ? false : seen.add(r.id))));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* Close the row kebab menu on any outside click. */
  useEffect(() => {
    if (menuOpenId === null) return undefined;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpenId(null);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpenId]);

  const departments = useMemo(() => {
    const set = new Set();
    (items || []).forEach((r) => {
      if (r.teacher?.degree && r.teacher.degree !== 'Unspecified') set.add(r.teacher.degree);
    });
    return Array.from(set).sort();
  }, [items]);

  const levels = useMemo(() => {
    const set = new Set();
    (items || []).forEach((r) => {
      if (r.topic?.level) set.add(r.topic.level);
    });
    return Array.from(set).sort();
  }, [items]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, total: 0 };
    (items || []).forEach((r) => {
      const b = bucketOf(r.status);
      if (b === BUCKET.PENDING) c.pending += 1;
      else if (b === BUCKET.REJECTED) c.rejected += 1;
      else c.approved += 1;
      c.total += 1;
    });
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      if (statusFilter !== ALL && bucketOf(r.status) !== statusFilter) return false;
      if (deptFilter !== ALL && r.teacher?.degree !== deptFilter) return false;
      if (levelFilter !== ALL && r.topic?.level !== levelFilter) return false;
      if (!q) return true;
      const tags = (r.topic?.tags || []).join(' ');
      return [
        r.topicTitle, r.teacher?.name, r.teacher?.email,
        r.learner?.name, r.learner?.email, tags,
      ].some((v) => v?.toLowerCase().includes(q));
    });
  }, [items, search, statusFilter, deptFilter, levelFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  /* Keep a row selected so the details panel is visible by default. Falls back to
   * the first row of the current result set whenever the selection drops out of it. */
  useEffect(() => {
    if (loading || filtered.length === 0) return;
    if (selected && filtered.some((r) => r.id === selected.id)) return;
    setSelected(filtered[0]);
  }, [loading, filtered, selected]);

  const filtersDirty =
    search !== '' || deptFilter !== ALL || levelFilter !== ALL || statusFilter !== ALL;

  const resetFilters = () => {
    setSearch('');
    setDeptFilter(ALL);
    setLevelFilter(ALL);
    setStatusFilter(ALL);
    setPage(0);
  };

  const respond = (id, approve) => {
    setActingId(id);
    setMenuOpenId(null);
    axios
      .post(`${API_BASE_URL}/api/tpo/peer-sessions/${id}/respond`, { approve })
      .then((res) => {
        if (res.data?.success) {
          const updated = res.data.data;
          setItems((prev) => (prev || []).map((it) => (it.id === id ? { ...it, ...updated } : it)));
          setSelected((prev) => (prev && prev.id === id ? { ...prev, ...updated } : prev));
        }
      })
      .catch((err) => {
        console.error('TPO peer session respond error:', err);
        window.alert(err.response?.data?.message || 'Could not update this request.');
      })
      .finally(() => setActingId(null));
  };

  const toggleStatCard = (bucket) => {
    setPage(0);
    setStatusFilter((prev) => (prev === bucket ? ALL : bucket));
  };

  const selBadge = selected ? statusBadge(selected.status) : null;
  const selPending = selected ? bucketOf(selected.status) === BUCKET.PENDING : false;

  return (
    <TpoShell title="Session Requests">
      <div className="tpo-page">
        <div className="tpo-section-header">
          <div className="tpo-section-header-icon"><FiFileText /></div>
          <div>
            <h2>Session Requests</h2>
            <p>Review and manage peer-to-peer session requests</p>
          </div>
        </div>

        {/* Stat cards — tinted, icon on the left, also act as status filters */}
        <div className="tpo-stats-row tpo-stats-row-tinted">
          <button
            type="button"
            className={`tpo-stat-tile tone-amber ${statusFilter === BUCKET.PENDING ? 'active' : ''}`}
            onClick={() => toggleStatCard(BUCKET.PENDING)}
          >
            <span className="tpo-stat-tile-icon"><FiFileText /></span>
            <span className="tpo-stat-tile-text">
              <strong>{loading ? '—' : counts.pending}</strong>
              <em>Pending Approval</em>
            </span>
          </button>

          <button
            type="button"
            className={`tpo-stat-tile tone-green ${statusFilter === BUCKET.APPROVED ? 'active' : ''}`}
            onClick={() => toggleStatCard(BUCKET.APPROVED)}
          >
            <span className="tpo-stat-tile-icon"><FiCheckCircle /></span>
            <span className="tpo-stat-tile-text">
              <strong>{loading ? '—' : counts.approved}</strong>
              <em>Approved Sessions</em>
            </span>
          </button>

          <button
            type="button"
            className={`tpo-stat-tile tone-red ${statusFilter === BUCKET.REJECTED ? 'active' : ''}`}
            onClick={() => toggleStatCard(BUCKET.REJECTED)}
          >
            <span className="tpo-stat-tile-icon"><FiXCircle /></span>
            <span className="tpo-stat-tile-text">
              <strong>{loading ? '—' : counts.rejected}</strong>
              <em>Rejected Sessions</em>
            </span>
          </button>

          <div className="tpo-stat-tile tone-blue static">
            <span className="tpo-stat-tile-icon"><FiUsers /></span>
            <span className="tpo-stat-tile-text">
              <strong>{loading ? '—' : counts.total}</strong>
              <em>Total Requests</em>
            </span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="tpo-toolbar">
          <label className="tpo-search-field">
            <FiSearch />
            <input
              placeholder="Search by topic title, student name or tags..."
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
            />
          </label>

          <select
            value={deptFilter}
            onChange={(e) => { setPage(0); setDeptFilter(e.target.value); }}
          >
            <option value={ALL}>All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={levelFilter}
            onChange={(e) => { setPage(0); setLevelFilter(e.target.value); }}
          >
            <option value={ALL}>All Levels</option>
            {levels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setPage(0); setStatusFilter(e.target.value); }}
          >
            <option value={ALL}>All Status</option>
            <option value={BUCKET.PENDING}>Pending</option>
            <option value={BUCKET.APPROVED}>Approved</option>
            <option value={BUCKET.REJECTED}>Rejected</option>
          </select>

          <button
            type="button"
            className="tpo-reset-btn"
            onClick={resetFilters}
            disabled={!filtersDirty}
          >
            Reset
          </button>
        </div>

        {error && <div className="tpo-empty-state">{error}</div>}

        {loading && !error && <div className="tpo-empty-state">Loading session requests…</div>}

        {!loading && !error && items && (
          <div className="tpo-split-layout">
            <div className="tpo-table-wrap tpo-split-main">
              <table className="tpo-table tpo-table-approvals">
                <thead>
                  <tr>
                    <th></th>
                    <th>Topic Title</th>
                    <th>Teaching Student</th>
                    <th>Learning Student</th>
                    <th>Department</th>
                    <th>Requested On</th>
                    <th>Status</th>
                    {/* <th>Actions</th> */}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="tpo-table-empty">
                        No session requests match these filters.
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((r, idx) => {
                      const badge = statusBadge(r.status);
                      const tags = r.topic?.tags || [];
                      const isPending = bucketOf(r.status) === BUCKET.PENDING;
                      return (
                        <tr
                          key={r.id}
                          className={selected?.id === r.id ? 'tpo-row-selected' : ''}
                          onClick={() => setSelected(r)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{safePage * PAGE_SIZE + idx + 1}</td>

                          <td>
                            <div className="tpo-topic-cell">
                              <span className="tpo-topic-name">{r.topicTitle}</span>
                              {tags.length > 0 && (
                                <span className="tpo-chip-row">
                                  {tags.slice(0, 3).map((t) => (
                                    <span key={t} className="tpo-chip">{t}</span>
                                  ))}
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            <div className="tpo-table-person">
                              <span className="tpo-table-avatar">{initialOf(r.teacher?.name, 'T')}</span>
                              <div>
                                <div>{r.teacher?.name || '—'}</div>
                                <div className="tpo-table-subtext">{r.teacher?.email}</div>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="tpo-table-person">
                              <span className="tpo-table-avatar">{initialOf(r.learner?.name, 'L')}</span>
                              <div>
                                <div>{r.learner?.name || '—'}</div>
                                <div className="tpo-table-subtext">{r.learner?.email}</div>
                              </div>
                            </div>
                          </td>

                          <td>{r.teacher?.degree || '—'}</td>

                          <td>{formatDate(r.createdAt || r.requestedDate)}</td>

                          <td>
                            <span className={`tpo-pill tpo-pill-status ${badge.cls}`}>
                              <badge.Icon /> {badge.label}
                            </span>
                          </td>

                          {/* <td>
                            <div className="tpo-actions-cell" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="tpo-view-btn"
                                onClick={() => setSelected(r)}
                              >
                                View
                              </button>

                              <div
                                className="tpo-kebab-wrap"
                                ref={menuOpenId === r.id ? menuRef : null}
                              >
                                <button
                                  type="button"
                                  className="tpo-kebab-btn"
                                  aria-label="More actions"
                                  onClick={() => setMenuOpenId(menuOpenId === r.id ? null : r.id)}
                                >
                                  <FiMoreVertical />
                                </button>

                                {menuOpenId === r.id && (
                                  <div className="tpo-kebab-menu">
                                    <button
                                      type="button"
                                      onClick={() => { setSelected(r); setMenuOpenId(null); }}
                                    >
                                      <FiFileText /> View details
                                    </button>
                                    {isPending && (
                                      <>
                                        <button
                                          type="button"
                                          className="ok"
                                          disabled={actingId === r.id}
                                          onClick={() => respond(r.id, true)}
                                        >
                                          <FiCheck /> Approve
                                        </button>
                                        <button
                                          type="button"
                                          className="danger"
                                          disabled={actingId === r.id}
                                          onClick={() => respond(r.id, false)}
                                        >
                                          <FiXCircle /> Reject
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td> */}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              <TpoPagination
                page={safePage}
                totalPages={totalPages}
                total={filtered.length}
                shownFrom={filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1}
                shownTo={Math.min((safePage + 1) * PAGE_SIZE, filtered.length)}
                onPageChange={setPage}
              />
            </div>

            {/* {selected && (
              <div className="tpo-panel tpo-split-side tpo-details-panel">
                <div className="tpo-panel-header tpo-details-head">
                  <h3>Session Details</h3>
                  <button
                    type="button"
                    className="tpo-icon-btn"
                    onClick={() => setSelected(null)}
                    aria-label="Close"
                  >
                    <FiX />
                  </button>
                </div>

                <div className="tpo-details-title-row">
                  <strong>{selected.topicTitle}</strong>
                  <span className={`tpo-pill tpo-pill-status ${selBadge.cls}`}>
                    <selBadge.Icon /> {selBadge.label}
                  </span>
                </div>

                {selected.topic?.description && (
                  <p className="tpo-details-desc">{selected.topic.description}</p>
                )}

                <div className="tpo-detail-rows">
                  <div className="tpo-detail-row">
                    <span className="tpo-detail-row-icon"><FiUser /></span>
                    <div>
                      <span className="tpo-detail-row-label">Teaching Student</span>
                      <span className="tpo-detail-row-value">{selected.teacher?.name || '—'}</span>
                      <span className="tpo-detail-row-link">{selected.teacher?.email}</span>
                    </div>
                  </div>

                  <div className="tpo-detail-row">
                    <span className="tpo-detail-row-icon"><FiUsers /></span>
                    <div>
                      <span className="tpo-detail-row-label">Learning Student</span>
                      <span className="tpo-detail-row-value">{selected.learner?.name || '—'}</span>
                      <span className="tpo-detail-row-link">{selected.learner?.email}</span>
                    </div>
                  </div>

                  <div className="tpo-detail-row">
                    <span className="tpo-detail-row-icon"><FiAward /></span>
                    <div>
                      <span className="tpo-detail-row-label">Department</span>
                      <span className="tpo-detail-row-value">{selected.teacher?.degree || '—'}</span>
                    </div>
                  </div>

                  <div className="tpo-detail-row">
                    <span className="tpo-detail-row-icon"><FiBarChart2 /></span>
                    <div>
                      <span className="tpo-detail-row-label">Topic Level</span>
                      {selected.topic?.level
                        ? <span className={`tpo-pill ${levelTone(selected.topic.level)}`} style={{ marginTop: 2 }}>
                            {selected.topic.level}
                          </span>
                        : <span className="tpo-detail-row-value">—</span>}
                    </div>
                  </div>

                  <div className="tpo-detail-row">
                    <span className="tpo-detail-row-icon"><FiClock /></span>
                    <div>
                      <span className="tpo-detail-row-label">Session Duration</span>
                      <span className="tpo-detail-row-value">{selected.topic?.sessionDuration || '—'}</span>
                    </div>
                  </div>

                  <div className="tpo-detail-row">
                    <span className="tpo-detail-row-icon"><FiCalendar /></span>
                    <div>
                      <span className="tpo-detail-row-label">Requested Date</span>
                      <span className="tpo-detail-row-value">{selected.requestedDate || '—'}</span>
                    </div>
                  </div>

                  <div className="tpo-detail-row">
                    <span className="tpo-detail-row-icon"><FiClock /></span>
                    <div>
                      <span className="tpo-detail-row-label">Time Slot</span>
                      <span className="tpo-detail-row-value">
                        {selected.requestedTimeSlot || selected.topic?.timeSlot || '—'}
                      </span>
                    </div>
                  </div>

                  {(selected.topic?.availableDays?.length > 0) && (
                    <div className="tpo-detail-row">
                      <span className="tpo-detail-row-icon"><FiCalendar /></span>
                      <div>
                        <span className="tpo-detail-row-label">Available Days</span>
                        <span className="tpo-detail-row-value">
                          {selected.topic.availableDays.join(', ')}
                        </span>
                      </div>
                    </div>
                  )}

                  {(selected.topic?.tags?.length > 0) && (
                    <div className="tpo-detail-row">
                      <span className="tpo-detail-row-icon"><FiTag /></span>
                      <div>
                        <span className="tpo-detail-row-label">Tags</span>
                        <span className="tpo-chip-row">
                          {selected.topic.tags.map((t) => (
                            <span key={t} className="tpo-chip">{t}</span>
                          ))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {selected.message && (
                  <div className="tpo-notes-block">
                    <div className="tpo-notes-head"><FiFileText /> Additional Notes</div>
                    <div className="tpo-notes-body">{selected.message}</div>
                  </div>
                )}

                {selPending && (
                  <div className="tpo-details-actions">
                    <button
                      type="button"
                      className="tpo-action-reject"
                      disabled={actingId === selected.id}
                      onClick={() => respond(selected.id, false)}
                    >
                      <FiXCircle /> Reject
                    </button>
                    <button
                      type="button"
                      className="tpo-action-approve"
                      disabled={actingId === selected.id}
                      onClick={() => respond(selected.id, true)}
                    >
                      <FiCheckCircle /> Approve
                    </button>
                  </div>
                )}
              </div>
            )} */}
          </div>
        )}
      </div>
    </TpoShell>
  );
}