import { useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiArrowLeft, FiBell, FiBriefcase, FiChevronRight,
  FiEdit2, FiFileText, FiLogOut, FiMail, FiMapPin, FiPhone, FiShield,
} from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext.jsx';
import StudentShell from '../components/StudentShell.jsx';

const DRAFT_KEY = 'student-portal-registration-draft';

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function deriveUid(name) {
  const n = Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  return `#STU-${String(n).padStart(6, '0').slice(0, 6)}`;
}

const val = (v) => (v && v !== 'Other' && String(v).trim() ? v : null);

export default function Profile({ onSignOut }) {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  const handleLogout = async () => {
    if (onSignOut) { onSignOut(); return; }
    try {
      await axios.post('https://13.126.254.96:8081/api/users/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser({});
      localStorage.removeItem('user');
      localStorage.removeItem('email');
      // navigate("/login", { replace: true });
      // Force full reload to clear state. Browser will handle the redirect to login page after logout.After the back Button Navigation, the user will be redirected to the login page, Not the previous page.
      window.location.replace("/login"); 
    }
  };
  const draft = useMemo(() => loadDraft(), []);

  const profileImage = localStorage.getItem('profileImage');

  // Resolve name from multiple sources in priority order
  const fullName = (() => {
    // 1. AuthContext user object (already parsed, most reliable)
    if (user?.name && String(user.name).trim()) return String(user.name).trim();
    // 2. localStorage 'name' plain string (set by login API)
    const nameRaw = localStorage.getItem('name');
    if (nameRaw && nameRaw !== 'null' && nameRaw !== 'undefined' && nameRaw.trim()) {
      return nameRaw.trim();
    }
    // 3. Registration draft
    if (draft.fullName?.trim()) return draft.fullName.trim();
    return 'Student';
  })();

  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : (parts[0]?.[0] ?? 'S').toUpperCase();

  const role = (draft.hasWorkExperience && draft.positions?.[0]?.role)
    ? draft.positions[0].role
    : draft.undergraduateDegree
      ? `${draft.undergraduateDegree} Student`
      : 'Student';

  // ── Build education rows ────────────────────────────────────────
  const educationRows = [];

  if (draft.hasPostGraduation && draft.postGraduationDegree) {
    const degree = draft.postGraduationDegree === 'Other'
      ? draft.postGraduationOtherDegree || 'Post Graduation'
      : draft.postGraduationDegree;
    educationRows.push({
      abbr: 'M', color: '#7C3AED',
      title: degree,
      details: [
        val(draft.postGraduationUniversity) && `University: ${draft.postGraduationUniversity}`,
        val(draft.yearOfPassing) && `Year: ${draft.yearOfPassing}`,
        val(draft.gpa) && `GPA / %: ${draft.gpa}`,
      ].filter(Boolean),
    });
  }

  if (draft.hasUndergraduate && draft.undergraduateDegree) {
    const degree = draft.undergraduateDegree === 'Other'
      ? draft.undergraduateOtherDegree || 'Under Graduation'
      : draft.undergraduateDegree;
    const branch = draft.undergraduateDegree === 'B.Tech' && draft.btechDegree
      ? draft.btechDegree
      : null;
    educationRows.push({
      abbr: 'A', color: '#2563EB',
      title: branch ? `${degree} — ${branch}` : degree,
      details: [
        val(draft.undergraduateUniversity) && `University: ${draft.undergraduateUniversity}`,
        val(draft.yearOfPassing) && `Year: ${draft.yearOfPassing}`,
        val(draft.gpa) && `GPA / %: ${draft.gpa}`,
      ].filter(Boolean),
    });
  }

  if (draft.qualificationAfter10th === 'intermediate') {
    educationRows.push({
      abbr: 'I', color: '#0891B2',
      title: `Intermediate${draft.stream ? ` (${draft.stream})` : ''}`,
      details: [
        val(draft.gratudatecollege) && `College: ${draft.gratudatecollege}`,
        val(draft.intermediateYearOfPassing) && `Year: ${draft.intermediateYearOfPassing}`,
        val(draft.intermediateGpa) && `Score: ${draft.intermediateGpa}%`,
      ].filter(Boolean),
    });
  } else if (draft.qualificationAfter10th === 'diploma') {
    educationRows.push({
      abbr: 'D', color: '#0891B2',
      title: `Diploma${draft.diplomaBranch ? ` — ${draft.diplomaBranch}` : ''}`,
      details: [
        val(draft.diplomacollege) && `College: ${draft.diplomacollege}`,
        val(draft.diplomaYearOfPassing) && `Year: ${draft.diplomaYearOfPassing}`,
        val(draft.diplomaGpa) && `Score: ${draft.diplomaGpa}%`,
      ].filter(Boolean),
    });
  }

  educationRows.push({
    abbr: '10', color: '#6B7280',
    title: `10th Standard (SSC)${draft.school ? ` — ${draft.school}` : ''}`,
    details: [
      val(draft.yearOfPassing) && `Year: ${draft.yearOfPassing}`,
      val(draft.gpa) && `Score: ${draft.gpa}%`,
    ].filter(Boolean),
  });

  const projects = (draft.projects ?? []).filter(p => p.title);
  const positions = (draft.positions ?? []).filter(p => p.companyName);
  const resumeFileName = draft.resumeFile?.name || null;

  return (
    <StudentShell onSignOut={onSignOut}>
      <main className="profile-shell">
        <section className='course-phone-panel'>
        {/* ── Sticky topbar ── */}
        <div className="profile-topbar">
          <div className="profile-topbar-left">
            <button type="button" className="profile-topbar-back" onClick={() => navigate(-1)}>
              <FiArrowLeft />
            </button>
            <span style={{color:'white', fontSize:'27px'}}>Profile</span>
          </div>
          <button type="button" className="profile-topbar-edit" onClick={() => navigate('/register')}>
            <FiEdit2 size={17} />
          </button>
        </div>

        {/* ── Identity card ── */}
        <div className="profile-identity-card">
          <div className="profile-avatar-wrap">
            {profileImage ? (
              <img src={profileImage} alt={fullName} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-fallback">{initials}</div>
            )}
            <button type="button" className="profile-avatar-edit-btn" onClick={() => navigate('/register')}>
              <FiEdit2 size={11} />
            </button>
          </div>
          <h2 className="profile-fullname">{fullName}</h2>
          <div className="profile-role-tag">{role}</div>
          <div className="profile-uid">{deriveUid(fullName)}</div>
        </div>

        {/* ── Personal Information ── */}
        <ProfileSection title="Personal Information">
          <InfoField icon={<FiMail />}  label="Email Address"  value={draft.email || '—'} />
          <InfoField icon={<FiPhone />} label="Phone Number"   value={draft.phone ? `${draft.country || ''} ${draft.phone}`.trim() : '—'} />
          <InfoField icon={<FiMapPin />} label="Address"       value={draft.address || '—'} last />
        </ProfileSection>

        {/* ── Education ── */}
        {educationRows.length > 0 && (
          <ProfileSection title="Education Summary">
            {educationRows.map((row, i) => (
              <EduRow key={i} {...row} last={i === educationRows.length - 1} onEdit={() => navigate('/register')} />
            ))}
          </ProfileSection>
        )}

        {/* ── Projects ── */}
        {draft.hasProjects && projects.length > 0 && (
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
                {val(p.description) && <p className="profile-project-desc">{p.description}</p>}
                {p.isTechnical && (val(p.frontEnd) || val(p.backEnd) || val(p.database)) && (
                  <div className="profile-project-tags">
                    {val(p.frontEnd) && <span>{p.frontEnd}</span>}
                    {val(p.backEnd) && <span>{p.backEnd}</span>}
                    {val(p.database) && <span>{p.database}</span>}
                  </div>
                )}
              </div>
            ))}
          </ProfileSection>
        )}

        {/* ── Experience ── */}
        {draft.hasWorkExperience && positions.length > 0 && (
          <ProfileSection title="Professional Experience">
            {positions.map((pos, i) => (
              <div key={i} className={`profile-exp-row${i < positions.length - 1 ? ' bordered' : ''}`}>
                <div className="profile-exp-icon"><FiBriefcase size={16} /></div>
                <div className="profile-exp-body">
                  <div className="profile-exp-role">{pos.role || '—'}</div>
                  <div className="profile-exp-company">{pos.companyName}</div>
                  {val(pos.duration) && <div className="profile-exp-duration">{pos.duration}</div>}
                </div>
              </div>
            ))}
          </ProfileSection>
        )}

        {/* ── Resume / Profile ── */}
        {(draft.wantsAiProfile != null || resumeFileName) && (
          <ProfileSection title="Profile">
            {draft.wantsAiProfile != null && (
              <InfoField
                icon={<FiFileText />}
                label="AI Generated Profile"
                value={draft.wantsAiProfile ? 'Yes — AI profile requested' : 'No — Manual resume uploaded'}
              />
            )}
            {resumeFileName && (
              <InfoField icon={<FiFileText />} label="Resume File" value={resumeFileName} last />
            )}
          </ProfileSection>
        )}

        {/* ── Account Settings ── */}
        <ProfileSection title="Account Settings">
          <SettingsRow icon={<FiBell size={16} />}   label="Notifications" onClick={() => {}} />
          <SettingsRow icon={<FiShield size={16} />} label="Privacy"       onClick={() => {}} />
          <SettingsRow icon={<FiLogOut size={16} />} label="Log Out"       onClick={handleLogout} danger last />
        </ProfileSection>
        </section>
      </main>
    </StudentShell>
  );
}

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
