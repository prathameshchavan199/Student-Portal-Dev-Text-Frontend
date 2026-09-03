import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiArrowLeft, FiBell, FiBriefcase, FiChevronRight, FiCompass,
  FiEdit2, FiExternalLink, FiFileText, FiLogOut, FiMail, FiMapPin, FiPhone, FiShield,
} from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext.jsx';
import StudentShell from '../components/StudentShell.jsx';
import { API_BASE_URL } from '../api/axiosSetup.js';
import { clearAuthStorage } from '../utils/auth.js';
import { TOUR_OPEN_EVENT } from '../components/WelcomeTour.jsx';

const val = (v) => (v && v !== 'Other' && String(v).trim() ? v : null);

export default function Profile({ onSignOut }) {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  const [reg, setReg]                         = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [loading, setLoading]                 = useState(true);

  /* ── Fetch registration on every visit ── */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/registration/me`);
        if (cancelled) return;

        if (res.data.success && res.data.data) {
          const data = res.data.data;
          setReg(data);

          if (data.hasProfileImage && data.id) {
            try {
              const imgRes = await axios.get(
                `${API_BASE_URL}/api/registration/file/${data.id}/profileImage`,
              );
              if (!cancelled && imgRes.data.success) {
                setProfileImageUrl(imgRes.data.url);
                return; // S3 URL found — skip localStorage fallback
              }
            } catch { /* fall through to localStorage */ }
          }

          // Backward-compat: image may still be in localStorage for existing users
          if (!cancelled) {
            const local = localStorage.getItem('profileImage');
            if (local) setProfileImageUrl(local);
          }
        } else {
          // No registration — still try localStorage for the avatar
          if (!cancelled) {
            const local = localStorage.getItem('profileImage');
            if (local) setProfileImageUrl(local);
          }
        }
      } catch {
        // Network error — try localStorage
        if (!cancelled) {
          const local = localStorage.getItem('profileImage');
          if (local) setProfileImageUrl(local);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  /* ── Open a submitted document in a new tab at a clean URL ── */
  const DOC_FILENAMES = {
    tenthCertificate:          'ssc-certificate.pdf',
    intermediateCertificate:   'intermediate-certificate.pdf',
    diplomaCertificate:        'diploma-certificate.pdf',
    undergraduateCertificate:  'undergraduate-certificate.pdf',
    postGraduationCertificate: 'postgraduate-certificate.pdf',
    resume:                    'resume.pdf',
  };

  const viewDocument = (type) => {
    const filename = DOC_FILENAMES[type] || `${type}.pdf`;
    window.open(`/profile/${filename}`, '_blank', 'noopener,noreferrer');
  };

  const handleLogout = async () => {
    if (onSignOut) { onSignOut(); return; }
    try {
      await axios.post(`${API_BASE_URL}/api/users/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
      clearAuthStorage();
      window.location.replace('/login');
    }
  };

  /* ── Derived display values ── */
  const fullName = (() => {
    if (user?.name && String(user.name).trim()) return String(user.name).trim();
    const nameRaw = localStorage.getItem('name');
    if (nameRaw && nameRaw !== 'null' && nameRaw !== 'undefined' && nameRaw.trim())
      return nameRaw.trim();
    if (reg?.fullName?.trim()) return reg.fullName.trim();
    return 'Student';
  })();

  const parts    = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : (parts[0]?.[0] ?? 'S').toUpperCase();

  /* ── Education rows ── */
  const educationRows = [];

  if (reg?.hasPostGraduation && reg.postGraduationDegree) {
    const degree = reg.postGraduationDegree === 'Other'
      ? (reg.postGraduationOtherDegree || 'Post Graduation')
      : reg.postGraduationDegree;
    educationRows.push({
      abbr: 'M', color: '#7C3AED',
      title: degree,
      details: [
        val(reg.postGraduationUniversity)    && `University: ${reg.postGraduationUniversity}`,
        val(reg.postGraduationYearOfPassing) && `Year: ${reg.postGraduationYearOfPassing}`,
        val(reg.postGraduationGpa)           && `Score: ${reg.postGraduationGpa}%`,
      ].filter(Boolean),
    });
  }

  if (reg?.hasUndergraduate && reg.undergraduateDegree) {
    const degree = reg.undergraduateDegree === 'Other'
      ? (reg.undergraduateOtherDegree || 'Under Graduation')
      : reg.undergraduateDegree;
    const branch = reg.undergraduateDegree === 'B.Tech' && reg.btechBranch ? reg.btechBranch : null;
    educationRows.push({
      abbr: 'U', color: '#2563EB',
      title: branch ? `${degree} — ${branch}` : degree,
      details: [
        val(reg.undergraduateUniversity)    && `University: ${reg.undergraduateUniversity}`,
        val(reg.undergraduateYearOfPassing) && `Year: ${reg.undergraduateYearOfPassing}`,
        val(reg.undergraduateGpa)           && `Score: ${reg.undergraduateGpa}%`,
      ].filter(Boolean),
    });
  }

  if (reg?.qualificationAfter10th === 'intermediate') {
    educationRows.push({
      abbr: 'I', color: '#0891B2',
      title: `Intermediate${reg.stream ? ` (${reg.stream})` : ''}`,
      details: [
        val(reg.intermediateCollege)       && `College: ${reg.intermediateCollege}`,
        val(reg.intermediateYearOfPassing) && `Year: ${reg.intermediateYearOfPassing}`,
        val(reg.intermediateGpa)           && `Score: ${reg.intermediateGpa}%`,
      ].filter(Boolean),
    });
  } else if (reg?.qualificationAfter10th === 'diploma') {
    educationRows.push({
      abbr: 'D', color: '#0891B2',
      title: `Diploma${reg.diplomaBranch ? ` — ${reg.diplomaBranch}` : ''}`,
      details: [
        val(reg.diplomaCollege)       && `College: ${reg.diplomaCollege}`,
        val(reg.diplomaYearOfPassing) && `Year: ${reg.diplomaYearOfPassing}`,
        val(reg.diplomaGpa)           && `Score: ${reg.diplomaGpa}%`,
      ].filter(Boolean),
    });
  }

  educationRows.push({
    abbr: '10', color: '#6B7280',
    title: 'Secondary Education (SSC)',
    details: [
      val(reg?.school)              && `School: ${reg.school}`,
      val(reg?.tenthYearOfPassing)  && `Year: ${reg.tenthYearOfPassing}`,
      val(reg?.tenthGpa)            && `Score: ${reg.tenthGpa}%`,
    ].filter(Boolean),
  });

  /* ── Document links ── */
  const docItems = !reg ? [] : [
    reg.hasTenthCertificate         && { label: 'SSC Certificate',            type: 'tenthCertificate',          filename: reg.tenthCertificateFileName },
    reg.hasIntermediateCertificate  && { label: 'Intermediate Certificate',   type: 'intermediateCertificate',   filename: reg.intermediateCertificateFileName },
    reg.hasDiplomaCertificate       && { label: 'Diploma Certificate',        type: 'diplomaCertificate',        filename: reg.diplomaCertificateFileName },
    reg.hasUndergraduateCertificate && { label: 'Undergraduate Certificate',  type: 'undergraduateCertificate',  filename: reg.undergraduateCertificateFileName },
    reg.hasPostGraduationCertificate&& { label: 'Post Graduation Certificate',type: 'postGraduationCertificate', filename: reg.postGraduationCertificateFileName },
    reg.hasResume                   && { label: 'Resume',                     type: 'resume',                    filename: reg.resumeFileName },
  ].filter(Boolean);

  const projects  = (reg?.projects  ?? []).filter((p) => p.title);
  const positions = (reg?.positions ?? []).filter((p) => p.companyName);

  /* ── Render ── */
  return (
    <StudentShell onSignOut={onSignOut}>
      <main className="profile-shell">
        <section className="course-phone-panel">

          {/* ── Sticky topbar ── */}
          <div className="profile-topbar">
            <div className="profile-topbar-left">
              <button type="button" className="profile-topbar-back" onClick={() => navigate(-1)}>
                <FiArrowLeft />
              </button>
              <span style={{ color: 'white', fontSize: '27px' }}>Profile</span>
            </div>
            <button type="button" className="profile-topbar-edit" onClick={() => navigate('/register')}>
              <FiEdit2 size={17} />
            </button>
          </div>

          {/* ── Identity card ── */}
          <div className="profile-identity-card">
            <div className="profile-avatar-wrap">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={fullName} className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-fallback">{initials}</div>
              )}
              <button
                type="button"
                className="profile-avatar-edit-btn"
                onClick={() => navigate('/register')}
              >
                <FiEdit2 size={11} />
              </button>
            </div>
            <h2 className="profile-fullname">{fullName}</h2>
            <div className="profile-uid">
              {`#STU-${String(user?.id ?? 0).padStart(6, '0')}`}
            </div>
          </div>

          {/* ── Loading state ── */}
          {loading && (
            <div style={{
              textAlign: 'center', padding: '32px 0',
              color: 'var(--text-subtle)', fontSize: 14,
            }}>
              Loading profile…
            </div>
          )}

          {/* ── No registration yet ── */}
          {!loading && !reg && (
            <div style={{
              margin: '16px 0', padding: '20px 18px',
              background: 'var(--card-bg)', borderRadius: 14,
              border: '1px solid var(--border-color)',
              textAlign: 'center', color: 'var(--text-subtle)', fontSize: 14,
            }}>
              Registration not submitted yet.{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--brand-blue)', fontWeight: 600, fontSize: 14,
                }}
              >
                Complete registration →
              </button>
            </div>
          )}

          {/* ── Profile sections ── */}
          {!loading && reg && (
            <>
              {/* Personal Information */}
              <ProfileSection title="Personal Information">
                <InfoField icon={<FiMail />}   label="Email Address" value={reg.email || '—'} />
                <InfoField icon={<FiPhone />}  label="Phone Number"  value={reg.phone ? `${reg.country || ''} ${reg.phone}`.trim() : '—'} />
                <InfoField icon={<FiMapPin />} label="Address"       value={reg.address || '—'} last />
              </ProfileSection>

              {/* Education */}
              {educationRows.length > 0 && (
                <ProfileSection title="Education Summary">
                  {educationRows.map((row, i) => (
                    <EduRow
                      key={i}
                      {...row}
                      last={i === educationRows.length - 1}
                      onEdit={() => navigate('/register')}
                    />
                  ))}
                </ProfileSection>
              )}

              {/* Documents */}
              {docItems.length > 0 && (
                <ProfileSection title="Documents">
                  {docItems.map((doc, i) => (
                    <DocRow
                      key={doc.type}
                      label={doc.label}
                      filename={doc.filename}
                      last={i === docItems.length - 1}
                      onView={() => viewDocument(doc.type)}
                    />
                  ))}
                </ProfileSection>
              )}

              {/* Projects */}
              {reg.hasProjects && projects.length > 0 && (
                <ProfileSection title="Academic Projects">
                  <div className="profile-sub-label">College Projects</div>
                  {projects.map((p, i) => (
                    <div key={i} className="profile-project-card">
                      <div className="profile-project-header">
                        <div className="profile-project-title">{p.title}</div>
                        <div className="profile-project-badges">
                          {p.projectType && (
                            <span className="profile-badge-type">
                              {p.projectType === 'in-house' ? 'In-house' : 'External'}
                            </span>
                          )}
                          {p.isTechnical && <span className="profile-badge-tech">Technical</span>}
                        </div>
                      </div>
                      {p.projectType === 'external' && val(p.collegeName) && (
                        <div className="profile-project-detail">
                          <span className="profile-project-detail-label">Company / College</span>
                          <span className="profile-project-detail-value">{p.collegeName}</span>
                        </div>
                      )}
                      {val(p.role) && (
                        <div className="profile-project-detail">
                          <span className="profile-project-detail-label">Role</span>
                          <span className="profile-project-detail-value">{p.role}</span>
                        </div>
                      )}
                      {val(p.duration) && (
                        <div className="profile-project-detail">
                          <span className="profile-project-detail-label">Duration</span>
                          <span className="profile-project-detail-value">{p.duration}</span>
                        </div>
                      )}
                      {p.isTechnical && val(p.techStack) && (
                        <div className="profile-project-detail">
                          <span className="profile-project-detail-label">Tech Stack</span>
                          <span className="profile-project-detail-value">{p.techStack}</span>
                        </div>
                      )}
                      {val(p.description) && (
                        <p className="profile-project-desc">{p.description}</p>
                      )}
                      {p.isTechnical && (val(p.frontEnd) || val(p.backEnd) || val(p.database)) && (
                        <div className="profile-project-tags">
                          {val(p.frontEnd)  && <span>{p.frontEnd}</span>}
                          {val(p.backEnd)   && <span>{p.backEnd}</span>}
                          {val(p.database)  && <span>{p.database}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </ProfileSection>
              )}

              {/* Work Experience */}
              {reg.hasWorkExperience && positions.length > 0 && (
                <ProfileSection title="Professional Experience">
                  {positions.map((pos, i) => (
                    <div key={i} className={`profile-exp-row${i < positions.length - 1 ? ' bordered' : ''}`}>
                      <div className="profile-exp-icon"><FiBriefcase size={16} /></div>
                      <div className="profile-exp-body">
                        <div className="profile-exp-role">{pos.role || '—'}</div>
                        <div className="profile-exp-company">{pos.companyName}</div>
                        {val(pos.duration) && (
                          <div className="profile-exp-duration">{pos.duration}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </ProfileSection>
              )}

              {/* Resume / Profile */}
              {reg.wantsAiProfile != null && (
                <ProfileSection title="Profile">
                  <InfoField
                    icon={<FiFileText />}
                    label="AI Generated Profile"
                    value={reg.wantsAiProfile
                      ? 'Yes — AI profile requested'
                      : 'No — Manual resume uploaded'}
                    last
                  />
                </ProfileSection>
              )}
            </>
          )}

          {/* ── Account Settings (always visible) ── */}
          <ProfileSection title="Account Settings">
            <SettingsRow icon={<FiBell size={16} />}    label="Notifications" onClick={() => {}} />
            <SettingsRow icon={<FiShield size={16} />}  label="Privacy"       onClick={() => {}} />
            <SettingsRow icon={<FiCompass size={16} />} label="Take a Tour"   onClick={() => window.dispatchEvent(new Event(TOUR_OPEN_EVENT))} />
            <SettingsRow icon={<FiLogOut size={16} />}  label="Log Out"       onClick={handleLogout} danger last />
          </ProfileSection>

        </section>
      </main>
    </StudentShell>
  );
}

/* ─── sub-components ─────────────────────────────────────────── */

function ProfileSection({ title, children }) {
  return (
    <div className="profile-section">
      <div className="profile-section-title">{title}</div>
      <div className="profile-section-body">{children}</div>
    </div>
  );
}

function InfoField({ icon, label, value, last }) {
  return (
    <div className={`profile-info-field${last ? '' : ' mb'}`}>
      <div className="profile-info-label">{label}</div>
      <div className="profile-info-value">
        <span>{value}</span>
        <span className="profile-info-icon">{icon}</span>
      </div>
    </div>
  );
}

function EduRow({ abbr, color, title, details, last, onEdit }) {
  return (
    <div className={`profile-edu-row${last ? '' : ' bordered'}`}>
      <div className="profile-edu-icon" style={{ background: color }}>{abbr}</div>
      <div className="profile-edu-body">
        <div className="profile-edu-title">{title}</div>
        {details.map((d, i) => <div key={i} className="profile-edu-sub">{d}</div>)}
      </div>
      <button type="button" className="profile-edu-edit" onClick={onEdit}>
        <FiEdit2 size={13} />
      </button>
    </div>
  );
}

function DocRow({ label, filename, onView, last }) {
  return (
    <div className={`profile-doc-row${last ? '' : ' bordered'}`}>
      <div className="profile-doc-icon"><FiFileText size={16} /></div>
      <div className="profile-doc-body">
        <div className="profile-doc-label">{label}</div>
        {filename && <div className="profile-doc-filename">{filename}</div>}
      </div>
      <button type="button" className="profile-doc-view" onClick={onView}>
        <FiExternalLink size={13} />
        View
      </button>
    </div>
  );
}

function SettingsRow({ icon, label, onClick, danger, last }) {
  return (
    <button
      type="button"
      className={`profile-settings-row${danger ? ' danger' : ''}${last ? '' : ' bordered'}`}
      onClick={onClick}
    >
      <span className="profile-settings-icon">{icon}</span>
      <span className="profile-settings-label">{label}</span>
      {!danger && <FiChevronRight size={15} className="profile-settings-chevron" />}
    </button>
  );
}
