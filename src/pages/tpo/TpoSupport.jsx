import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  FiSearch, FiPlus, FiChevronRight, FiChevronDown, FiFileText,
  FiCalendar, FiArrowLeft, FiX, FiCheck, FiAlertCircle,
} from 'react-icons/fi';
import TpoShell from '../../components/TpoShell.jsx';
import { API_BASE_URL } from '../../api/axiosSetup.js';

const PRIORITIES = [
  { value: 'LOW', label: 'Low', desc: 'Minor inconvenience, no urgent impact', color: '#22c55e' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Affects some functionality, workaround available', color: '#f97316' },
  { value: 'HIGH', label: 'High', desc: 'Urgent issue affecting critical operations', color: '#dc2626' },
];

const STATUS_LABELS = { OPEN: 'Open', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved' };

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

function priorityMeta(value) {
  return PRIORITIES.find((p) => p.value === (value || '').toUpperCase());
}

function PrioritySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = priorityMeta(value);

  return (
    <div className="tpo-priority-select">
      <button type="button" className="tpo-priority-trigger" onClick={() => setOpen((o) => !o)}>
        {selected ? (
          <>
            <span className="dot" style={{ background: selected.color }} />
            <span className="label">{selected.label}</span>
            <span className="desc">- {selected.desc}</span>
          </>
        ) : (
          <span className="desc">Select Priority</span>
        )}
        <FiChevronDown className="chev" />
      </button>
      {open && (
        <div className="tpo-priority-menu">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              className="tpo-priority-option"
              onClick={() => {
                onChange(p.value);
                setOpen(false);
              }}
            >
              <span className="dot" style={{ background: p.color }} />
              <span className="label">{p.label}</span>
              <span className="desc">- {p.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TpoSupport() {
  const [view, setView] = useState('list'); // 'list' | 'new'
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [priority, setPriority] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]); // [{ file, previewUrl }]
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const loadTickets = () => {
    axios
      .get(`${API_BASE_URL}/api/tpo/support/tickets`)
      .then((res) => {
        if (res.data?.success) setTickets(res.data.data);
      })
      .catch((err) => {
        console.error('TPO support tickets fetch error:', err);
        setError('Could not load your submitted issues.');
      });
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const resetForm = () => {
    setPriority('');
    setDescription('');
    files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setFormError('');
  };

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    const next = [...files];
    for (const file of incoming) {
      if (next.length >= MAX_FILES) {
        setFormError(`You can attach at most ${MAX_FILES} screenshots.`);
        break;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFormError('Screenshots must be PNG, JPG, or JPEG images.');
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        setFormError('Each screenshot must be 10MB or smaller.');
        continue;
      }
      next.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setFiles(next);
  };

  const removeFile = (idx) => {
    setFiles((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(idx, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return copy;
    });
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!priority) {
      setFormError('Please select a priority.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please describe the issue.');
      return;
    }

    const fd = new FormData();
    fd.append('priority', priority);
    fd.append('description', description.trim());
    files.forEach((f) => fd.append('screenshots', f.file));

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/api/tpo/support/tickets`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowSuccess(true);
    } catch (err) {
      console.error('TPO support ticket submit error:', err);
      setFormError(err.response?.data?.message || 'Could not submit your issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccess(false);
    resetForm();
    setView('list');
    loadTickets();
  };

  const filteredTickets = (tickets || []).filter((t) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return t.ticketNumber.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });

  return (
    <TpoShell title={view === 'new' ? undefined : 'Support'}>
      {view === 'new' && (
        <div className="tpo-page-title-bar with-back">
          <button type="button" className="tpo-back-btn" onClick={() => setView('list')} aria-label="Back">
            <FiArrowLeft />
          </button>
          <h1>Support</h1>
        </div>
      )}

      <div className="tpo-page">
        {view === 'list' && (
          <>
            <label className="tpo-search-field">
              <FiSearch />
              <input
                placeholder="Search issues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <button type="button" className="tpo-support-new-card" onClick={() => setView('new')}>
              <div className="tpo-support-new-icon"><FiPlus /></div>
              <div>
                <div className="tpo-support-new-title">Send a New Issue</div>
                <div className="tpo-support-new-sub">Facing a problem? Let us know and we'll help you solve it.</div>
              </div>
              <FiChevronRight className="tpo-support-new-arrow" />
            </button>

            <div className="tpo-support-section-title">Previous Issues Submitted</div>

            {error && <div className="tpo-empty-state">{error}</div>}
            {!tickets && !error && <div className="tpo-empty-state">Loading your issues…</div>}

            {tickets && filteredTickets.length === 0 && (
              <div className="tpo-empty-state">
                {tickets.length === 0 ? "You haven't submitted any issues yet." : 'No issues match your search.'}
              </div>
            )}

            {tickets && filteredTickets.length > 0 && (
              <div className="tpo-ticket-list">
                {filteredTickets.map((t) => {
                  const meta = priorityMeta(t.priority);
                  const statusKey = (t.status || 'OPEN').toLowerCase();
                  return (
                    <div key={t.id} className="tpo-ticket-card">
                      <div className="tpo-ticket-icon" style={{ background: `${meta?.color}1f`, color: meta?.color }}>
                        <FiAlertCircle />
                      </div>
                      <div className="tpo-ticket-body">
                        <div className="tpo-ticket-number">{t.ticketNumber}</div>
                        <div className="tpo-ticket-desc">{t.description}</div>
                        <div className="tpo-ticket-date">
                          <FiCalendar /> {t.createdAt}
                        </div>
                      </div>
                      <div className="tpo-ticket-meta">
                        <span className={`tpo-badge ${meta?.value === 'HIGH' ? 'tpo-badge-red' : meta?.value === 'MEDIUM' ? 'tpo-badge-blue' : 'tpo-badge-green'}`}>
                          {meta?.label || t.priority}
                        </span>
                        <span className={`tpo-ticket-status status-${statusKey}`}>
                          {STATUS_LABELS[t.status] || t.status} <FiChevronRight />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {view === 'new' && (
          <div className="tpo-support-form">
            <div>
              <div className="tpo-form-label">Priority<span className="req">*</span></div>
              <PrioritySelect value={priority} onChange={setPriority} />
            </div>

            <div>
              <div className="tpo-form-label">Description<span className="req">*</span></div>
              <textarea
                className="tpo-support-textarea"
                placeholder="Please describe the issue in detail..."
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="tpo-char-count">{description.length} / 1000</div>
            </div>

            <div>
              <div className="tpo-form-label">Screenshots</div>
              <div
                className={`tpo-dropzone ${dragOver ? 'drag-over' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  addFiles(e.dataTransfer.files);
                }}
              >
                <div className="tpo-dropzone-icon"><FiFileText /></div>
                <div className="tpo-dropzone-title">
                  Attach the reference of the issue here or <button type="button">click to browse</button>
                </div>
                <div className="tpo-dropzone-hint">PNG, JPG, JPEG up to 10MB each (Max {MAX_FILES} files)</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  hidden
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>

              {files.length > 0 && (
                <div className="tpo-thumb-grid">
                  {files.map((f, idx) => (
                    <div key={idx} className="tpo-thumb">
                      <img src={f.previewUrl} alt={f.file.name} />
                      <button type="button" className="tpo-thumb-remove" onClick={() => removeFile(idx)} aria-label="Remove">
                        <FiX />
                      </button>
                    </div>
                  ))}
                  {files.length < MAX_FILES && (
                    <button type="button" className="tpo-thumb-add" onClick={() => fileInputRef.current?.click()} aria-label="Add screenshot">
                      <FiPlus />
                    </button>
                  )}
                </div>
              )}
            </div>

            {formError && <div className="text-danger small">{formError}</div>}

            <div className="tpo-form-actions">
              <button type="button" className="tpo-btn-reset" onClick={resetForm}>Reset</button>
              <button type="button" className="tpo-btn-submit" disabled={submitting} onClick={handleSubmit}>
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showSuccess && (
        <div className="tpo-modal-overlay">
          <div className="tpo-modal-card">
            <div className="tpo-modal-icon"><FiCheck /></div>
            <div className="tpo-modal-message">Your issue has been submitted successfully</div>
            <button type="button" className="tpo-modal-ok" onClick={closeSuccessModal}>OK</button>
          </div>
        </div>
      )}
    </TpoShell>
  );
}
