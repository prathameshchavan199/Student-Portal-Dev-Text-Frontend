import { useContext, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, color } from 'framer-motion';
import axios from 'axios';
import Stepper from '../components/Stepper.jsx';
import TagInput from '../components/TagInput.jsx';
import { DarkInput, PasswordField, GradientButton, FiMail, FiUser, FiPhone } from '../components/UI.jsx';
import { FiCamera, FiBriefcase, FiEdit2, FiFolder, FiUserCheck, FiCheckCircle, FiAlertCircle, FiFileText, FiChevronDown } from 'react-icons/fi';
import StudentShell, { registrationNavItems } from '../components/StudentShell.jsx';
import { AuthContext } from '../context/AuthContext.jsx';


const STEPS = ['Details', 'Projects', 'Preview'];
const DEGREE_OPTIONS = [
    'B.Tech',
  'B.Com',
  'BBA',
  'BA',
  'B.Sc',
  'BCA',
  'B.Ed',
  'BSW',
  'Other',
];

const DIPLOMA_BRANCH_OPTIONS = [
  'Computer Engineering',
  'Information Technology',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Electronics Engineering',
  'Electronics & Telecommunication Engineering',
  'Automobile Engineering',
  'Chemical Engineering',
  'Production Engineering',
  'Instrumentation Engineering',
  'Mechatronics Engineering',
  'Robotics Engineering',
  'Aeronautical Engineering',
  'Agricultural Engineering',
  'Mining Engineering',
  'Petroleum Engineering',
  'Architecture Assistantship',
  'Interior Design',
  'Fashion Design',
  'Graphic Design',
  'Hotel Management',
  'Pharmacy',
  'Medical Laboratory Technology',
  'Other',
];

const Btech_Branch_OPTIONS = [
  'Computer Science Engineering (CSE)',
  'Information Technology (IT)',
  'Artificial Intelligence & Machine Learning (AI/ML)',
  'Artificial Intelligence & Data Science (AI/DS)',
  'Electronics & Communication Engineering (ECE)',
  'Electrical Engineering (EE)',
  'Electrical & Electronics Engineering (EEE)',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Aeronautical Engineering',
  'Automobile Engineering',
  'Biomedical Engineering',
  'Biotechnology Engineering',
  'Industrial Engineering',
  'Instrumentation Engineering',
  'Mechatronics Engineering',
  'Mining Engineering',
  'Petroleum Engineering',
  'Robotics Engineering',
  'Environmental Engineering',
  'Agricultural Engineering',
  'Marine Engineering',
  'Metallurgical Engineering',
  'Production Engineering',
  'Textile Engineering',
  'Food Technology',
  'Other',
];

const TECH_STACK_OPTIONS = ['Full Stack', 'Front-end Only', 'Back-end Only', 'Mobile App', 'Data Science / ML', 'DevOps / Cloud', 'Embedded Systems', 'Other'];
const FRONTEND_OPTIONS = ['React.js', 'Vue.js', 'Angular', 'Next.js', 'HTML / CSS / JS', 'Flutter', 'React Native', 'Android (Kotlin)', 'iOS (Swift)', 'Other'];
const BACKEND_OPTIONS = ['Node.js (Express)', 'Python (Django)', 'Python (Flask)', 'Python (FastAPI)', 'Java (Spring Boot)', 'PHP (Laravel)', 'Ruby on Rails', '.NET (C#)', 'Go', 'Other'];
const DATABASE_OPTIONS = ['MySQL', 'PostgreSQL', 'MongoDB', 'Firebase', 'SQLite', 'Redis', 'Oracle', 'Microsoft SQL Server', 'Supabase', 'Other'];

const createEmptyProject = () => ({
  projectType: '',
  isTechnical: null,
  collegeName: '',
  role: '',
  duration: '',
  title: '',
  techStack: '',
  frontEnd: '',
  backEnd: '',
  database: '',
  description: '',
});

const createEmptyPosition = () => ({
  companyName: '',
  role: '',
  duration: '',
});

const DRAFT_KEY = 'student-portal-registration-draft';
const API_BASE_URL = 'https://13.235.67.169';

const createEmptyDraft = () => ({
  profileImage: null,
  fullName: '',
  email: '',
  phone: '',
  country: '+1',
  hasProjects: true,
  projects: [createEmptyProject()],
  hasWorkExperience: true,
  positions: [createEmptyPosition()],
  resumeFile: null,
  has12th: false,
  hasdiploma: false,
  hasPostGraduation: null,
  hasUndergraduate: null,
  projectTitle: '',
  description: '',
  tags: ['Python', 'React Native'],
  gpa: '',
  yearOfPassing: String(new Date().getFullYear()),
  experience: '',
  stream: '',
  undergraduateDegree: '',
  undergraduateOtherDegree: '',
  undergraduateUniversity: '',
  postGraduationDegree: '',
  postGraduationOtherDegree: '',
  postGraduationUniversity: '',
  marksheetFile: null,
  intermediateMarksheetFile: null,
  diplomaMarksheetFile: null,
  postGraduationMarksheetFile: null,
  undergraduateMarksheetFile: null,
  qualificationAfter10th: '',
});

const dataUrlToFile = (dataUrl, name, type, lastModified) => {
  const [header, base64] = dataUrl.split(',');
  const mime = type || header.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], name, {
    type: mime,
    lastModified: lastModified || Date.now(),
  });
};

const hydrateDraftFile = (draftFile) => {
  if (!draftFile) {
    return null;
  }

  if (draftFile instanceof File) {
    return draftFile;
  }

  if (typeof draftFile === 'string') {
    return null;
  }

  if (draftFile.dataUrl) {
    return dataUrlToFile(
      draftFile.dataUrl,
      draftFile.name,
      draftFile.type,
      draftFile.lastModified,
    );
  }

  return null;
};

const hydrateDraftData = (draftData = {}) => {
  const normalized = {
    ...createEmptyDraft(),
    ...draftData,
    tags: Array.isArray(draftData.tags) ? draftData.tags : ['Python', 'React Native'],
  };

  normalized.marksheetFile = hydrateDraftFile(draftData.marksheetFile);
  normalized.intermediateMarksheetFile = hydrateDraftFile(draftData.intermediateMarksheetFile);
  normalized.diplomaMarksheetFile = hydrateDraftFile(draftData.diplomaMarksheetFile);
  normalized.postGraduationMarksheetFile = hydrateDraftFile(draftData.postGraduationMarksheetFile);
  normalized.undergraduateMarksheetFile = hydrateDraftFile(draftData.undergraduateMarksheetFile);
  normalized.resumeFile = hydrateDraftFile(draftData.resumeFile);

  return normalized;
};

const fileToDraftPayload = (file) => new Promise((resolve) => {
  if (!file) {
    resolve(null);
    return;
  }

  if (typeof file === 'object' && file?.dataUrl) {
    resolve(file);
    return;
  }

  if (!(file instanceof File)) {
    resolve(null);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    resolve({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      dataUrl: reader.result,
    });
  };
  reader.readAsDataURL(file);
});

const buildJsonFields = (d, email) => ({
  fullName: d.fullName,
  email: email ?? d.email,
  phone: d.phone,
  country: d.country,
  address: d.address,
  school: d.school,
  gpa: d.gpa,
  yearOfPassing: d.yearOfPassing,
  qualificationAfter10th: d.qualificationAfter10th,
  stream: d.stream,
  gratudatecollege: d.gratudatecollege,
  intermediateGpa: d.intermediateGpa,
  intermediateYearOfPassing: d.intermediateYearOfPassing,
  diplomaBranch: d.diplomaBranch,
  diplomacollege: d.diplomacollege,
  diplomaGpa: d.diplomaGpa,
  diplomaYearOfPassing: d.diplomaYearOfPassing,
  hasUndergraduate: d.hasUndergraduate,
  undergraduateDegree: d.undergraduateDegree,
  undergraduateOtherDegree: d.undergraduateOtherDegree,
  btechDegree: d.btechDegree,
  undergraduateUniversity: d.undergraduateUniversity,
  hasPostGraduation: d.hasPostGraduation,
  postGraduationDegree: d.postGraduationDegree,
  postGraduationOtherDegree: d.postGraduationOtherDegree,
  postGraduationUniversity: d.postGraduationUniversity,
  hasProjects: d.hasProjects,
  projects: d.projects,
  hasWorkExperience: d.hasWorkExperience,
  positions: d.positions,
  wantsAiProfile: d.wantsAiProfile,
});

const appendFiles = (fd, d) => {
  if (d.marksheetFile instanceof File)               fd.append('marksheetFile',               d.marksheetFile);
  if (d.intermediateMarksheetFile instanceof File)   fd.append('intermediateMarksheetFile',   d.intermediateMarksheetFile);
  if (d.diplomaMarksheetFile instanceof File)        fd.append('diplomaMarksheetFile',        d.diplomaMarksheetFile);
  if (d.undergraduateMarksheetFile instanceof File)  fd.append('undergraduateMarksheetFile',  d.undergraduateMarksheetFile);
  if (d.postGraduationMarksheetFile instanceof File) fd.append('postGraduationMarksheetFile', d.postGraduationMarksheetFile);
  if (d.resumeFile instanceof File)                  fd.append('resumeFile',                  d.resumeFile);
};

const buildDraftPayload = async (draftData = {}) => ({
  ...createEmptyDraft(),
  ...draftData,
  tags: Array.isArray(draftData.tags) ? draftData.tags : ['Python', 'React Native'],
  marksheetFile: await fileToDraftPayload(draftData.marksheetFile),
  intermediateMarksheetFile: await fileToDraftPayload(draftData.intermediateMarksheetFile),
  diplomaMarksheetFile: await fileToDraftPayload(draftData.diplomaMarksheetFile),
  postGraduationMarksheetFile: await fileToDraftPayload(draftData.postGraduationMarksheetFile),
  undergraduateMarksheetFile: await fileToDraftPayload(draftData.undergraduateMarksheetFile),
  resumeFile: await fileToDraftPayload(draftData.resumeFile),
});

const saveDraft = async (draftData = {}) => {
  const payload = await buildDraftPayload(draftData);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  }

  const email = draftData.email || (typeof window !== 'undefined' ? window.localStorage.getItem('email') : null);

  if (email) {
    try {
      const fd = new FormData();
      fd.append('data', JSON.stringify(buildJsonFields(draftData, email)));
      appendFiles(fd, draftData);
      await axios.post(
        `${API_BASE_URL}/api/registration/draft`,
        fd,
        { withCredentials: true },
      );
    } catch (error) {
      console.error('Error saving draft:', error);
      console.error('Error response data:', error.response?.data);
    }
  }

  return payload;
};

// Maps backend sanitize() field names → frontend form field names
const mapServerDraftToForm = (s) => ({
  ...createEmptyDraft(),
  fullName:                  s.fullName                  || '',
  email:                     s.email                     || '',
  phone:                     s.phone                     || '',
  country:                   s.country                   || '+91',
  address:                   s.address                   || '',
  school:                    s.school                    || '',
  // Backend stores as tenthGpa / tenthYearOfPassing; form uses gpa / yearOfPassing
  gpa:                       s.tenthGpa                  || '',
  yearOfPassing:             s.tenthYearOfPassing        || String(new Date().getFullYear()),
  qualificationAfter10th:    s.qualificationAfter10th    || '',
  has12th:                   s.qualificationAfter10th === 'intermediate',
  hasdiploma:                s.qualificationAfter10th === 'diploma',
  stream:                    s.stream                    || '',
  // Backend: intermediateCollege → form: gratudatecollege (existing typo kept as-is)
  gratudatecollege:          s.intermediateCollege       || '',
  intermediateGpa:           s.intermediateGpa           || '',
  intermediateYearOfPassing: s.intermediateYearOfPassing || '',
  diplomaBranch:             s.diplomaBranch             || '',
  // Backend: diplomaCollege → form: diplomacollege
  diplomacollege:            s.diplomaCollege            || '',
  diplomaGpa:                s.diplomaGpa                || '',
  diplomaYearOfPassing:      s.diplomaYearOfPassing      || '',
  hasUndergraduate:          s.hasUndergraduate          ?? null,
  undergraduateDegree:       s.undergraduateDegree       || '',
  undergraduateOtherDegree:  s.undergraduateOtherDegree  || '',
  // Backend: btechBranch → form: btechDegree
  btechDegree:               s.btechBranch               || '',
  undergraduateUniversity:   s.undergraduateUniversity   || '',
  hasPostGraduation:         s.hasPostGraduation         ?? null,
  postGraduationDegree:      s.postGraduationDegree      || '',
  postGraduationOtherDegree: s.postGraduationOtherDegree || '',
  postGraduationUniversity:  s.postGraduationUniversity  || '',
  hasProjects:               s.hasProjects               ?? true,
  projects:   Array.isArray(s.projects)  && s.projects.length  > 0 ? s.projects  : [createEmptyProject()],
  hasWorkExperience:         s.hasWorkExperience         ?? true,
  positions:  Array.isArray(s.positions) && s.positions.length > 0 ? s.positions : [createEmptyPosition()],
  wantsAiProfile:            s.wantsAiProfile            ?? null,
  // Files are never returned by the backend list endpoint — always start null
  marksheetFile: null, intermediateMarksheetFile: null, diplomaMarksheetFile: null,
  undergraduateMarksheetFile: null, postGraduationMarksheetFile: null, resumeFile: null,
});

export default function Register({ onSignOut }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(createEmptyDraft);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [draftLoading, setDraftLoading] = useState(true);
  const { setRegistered } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInEmail = localStorage.getItem('email') || '';
    const loggedInName  = localStorage.getItem('name')  || '';
    axios.get(`${API_BASE_URL}/api/registration/draft/me`, { withCredentials: true })
      .then(res => {
        if (res.data.success && res.data.data) {
          const mapped = mapServerDraftToForm(res.data.data);
          setData({ ...mapped, email: loggedInEmail || mapped.email, fullName: loggedInName || mapped.fullName });
        } else {
          setData({ ...createEmptyDraft(), email: loggedInEmail, fullName: loggedInName });
        }
      })
      .catch(() => {
        setData({ ...createEmptyDraft(), email: loggedInEmail, fullName: loggedInName });
      })
      .finally(() => setDraftLoading(false));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);


  return (
    <StudentShell
      navItems={registrationNavItems}
      showCourseSearch={true}
      onSignOut={onSignOut}
    >
      <div className="dash-content">
          <div className="grad-header " style={{ borderRadius: 14,  }}
          >
            Registration
          </div>
          <div className="glass-card registration-panel mt-3 reg-div" style={{  margin: '0 auto', padding: '24px 28px', }}>

            {draftLoading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-subtle)' }}>
                Loading your registration data…
              </div>
            ) : (<>
            <Stepper steps={STEPS} current={step} />
            {/* <ProfileImagePicker
          value={data.profileImage}
          onChange={(dataUrl) => setData(prev => ({ ...prev, profileImage: dataUrl }))}
        /> */}
            <AnimatePresence mode="wait">
              <motion.div key={step}
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}>
                {step === 0 && <StepDetails data={data} setData={setData} onNext={() => setStep(1)} />}
                {step === 1 && <StepProjects data={data} setData={setData} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
                {step === 2 && (
                  <StepPreview
                    data={data}
                    onBack={() => setStep(1)}
                    onSubmitSuccess={() => {
                      if (data.profileImage) {
                        localStorage.setItem('profileImage', data.profileImage);
                      }
                      setRegistered(true);
                      const storedUser = localStorage.getItem('user');
                      if (storedUser) {
                        const parsed = JSON.parse(storedUser);
                        localStorage.setItem('user', JSON.stringify({ ...parsed, registered: true }));
                      }
                      setShowSuccessModal(true);
                    }}
                    setStep={setStep}
                  />
                )}
              </motion.div>
            </AnimatePresence>
            </>)}
          </div>
        </div>

      {showSuccessModal && (
        <div className="otp-modal-backdrop" role="presentation">
          <div className="otp-modal">
            <div className="otp-icon verified ">
              <FiCheckCircle />
            </div>
            <h3>Thank you for submitting your information.</h3>
            <p>
            
              <strong>Verification is in progress.</strong>
            </p>
            <GradientButton
              className="otp-submit"
              onClick={() => navigate('/dashboard')}
            >
              Continue
            </GradientButton>
          </div>
        </div>
      )}

    </StudentShell>
  );
}

const EduIcon = (props) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="12 2 22 8 12 14 2 8"/>
    <path d="M6 10.5v5a6 6 0 0 0 12 0v-5"/>
    <line x1="22" y1="8" x2="22" y2="14"/>
  </svg>
);

const WorkIcon = (props) => (
  <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="8" width="18" height="13" rx="2"/>
    <path d="M9 8V5.5a3 3 0 0 1 6 0V8"/>
  </svg>
);

function SectionHeader({ icon: Icon, children, className = '', style }) {
  return (
    <div
      className={`d-flex align-items-center gap-2 mb-3 ${className}`}
      style={{ color: 'var(--text-heading)', fontWeight: 700, ...style }}
    >
      {Icon && <Icon style={{ color: 'var(--brand-orange)', flexShrink: 0 }} />}
      {children}
    </div>
  );
}

function ProfileImagePicker({ value, onChange }) {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="profile-img-picker">
      <div className="profile-img-circle" onClick={() => inputRef.current?.click()}>
        <div className="profile-img-circle-inner">
          {value ? (
            <img src={value} alt="Profile preview" />
          ) : (
            <FiUser />
          )}
        </div>
        <div className="profile-img-badge">
          <FiCamera />
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      <span className="profile-img-label">
        {value ? 'Change photo' : 'Add profile photo'}
      </span>
    </div>
  );
}

function StepDetails({ data, setData, onNext }) {
  const qualRef = useRef(null);
  const ugRef = useRef(null);
  const pgRef = useRef(null);
  const [toggleErrors, setToggleErrors] = useState({});

  const { register, handleSubmit, watch, setValue, clearErrors, getValues, reset, formState: { errors } } = useForm({
    defaultValues: {
      ...data,
      qualificationAfter10th: data.qualificationAfter10th || '',
      hasPostGraduation: data.hasPostGraduation === true ? 'true' : data.hasPostGraduation === false ? 'false' : '',
      hasUndergraduate: data.hasUndergraduate === true ? 'true' : data.hasUndergraduate === false ? 'false' : ''
    }
  });

  useEffect(() => {
    reset({
      ...data,
      qualificationAfter10th: data.qualificationAfter10th || '',
      hasPostGraduation: data.hasPostGraduation === true ? 'true' : data.hasPostGraduation === false ? 'false' : '',
      hasUndergraduate: data.hasUndergraduate === true ? 'true' : data.hasUndergraduate === false ? 'false' : ''
    });
  }, [data, reset]);

  const selectedFile = watch('marksheetFile')?.[0] ?? data.marksheetFile;
  const intermediateSelectedFile = watch('intermediateMarksheetFile')?.[0] ?? data.intermediateMarksheetFile;
  const diplomaSelectedFile = watch('diplomaMarksheetFile')?.[0] ?? data.diplomaMarksheetFile;
  const postGraduationSelectedFile = watch('postGraduationMarksheetFile')?.[0] ?? data.postGraduationMarksheetFile;
  const undergraduateSelectedFile = watch('undergraduateMarksheetFile')?.[0] ?? data.undergraduateMarksheetFile;
  const qualificationAfter10th = watch('qualificationAfter10th') ?? '';
  const hasPostGraduation = watch('hasPostGraduation') ?? '';
  const hasUndergraduate = watch('hasUndergraduate') ?? '';
  const undergraduateDegree = watch('undergraduateDegree');

  useEffect(() => {
    if (qualificationAfter10th) setToggleErrors(e => ({ ...e, qualificationAfter10th: false }));
  }, [qualificationAfter10th]);
  useEffect(() => {
    if (hasUndergraduate) setToggleErrors(e => ({ ...e, hasUndergraduate: false }));
  }, [hasUndergraduate]);
  useEffect(() => {
    if (hasPostGraduation) setToggleErrors(e => ({ ...e, hasPostGraduation: false }));
  }, [hasPostGraduation]);
  const postGraduationDegree = watch('postGraduationDegree');
  const filePreviewUrl = selectedFile ? URL.createObjectURL(selectedFile) : '';
  const intermediatePreviewUrl = intermediateSelectedFile ? URL.createObjectURL(intermediateSelectedFile) : '';
  const diplomaPreviewUrl = diplomaSelectedFile ? URL.createObjectURL(diplomaSelectedFile) : '';
  const postGraduationPreviewUrl = postGraduationSelectedFile ? URL.createObjectURL(postGraduationSelectedFile) : '';
  const undergraduatePreviewUrl = undergraduateSelectedFile ? URL.createObjectURL(undergraduateSelectedFile) : '';

  const buildDetailsData = (v) => ({
    ...data,
    ...v,
    marksheetFile: v.marksheetFile?.[0] ?? data.marksheetFile ?? null,
    intermediateMarksheetFile: v.intermediateMarksheetFile?.[0] ?? data.intermediateMarksheetFile ?? null,
    diplomaMarksheetFile: v.diplomaMarksheetFile?.[0] ?? data.diplomaMarksheetFile ?? null,
    postGraduationMarksheetFile: v.postGraduationMarksheetFile?.[0] ?? data.postGraduationMarksheetFile ?? null,
    undergraduateMarksheetFile: v.undergraduateMarksheetFile?.[0] ?? data.undergraduateMarksheetFile ?? null,
    qualificationAfter10th: v.qualificationAfter10th ?? 'intermediate',
    has12th: v.qualificationAfter10th === 'intermediate',
    hasdiploma: v.qualificationAfter10th === 'diploma',
    hasPostGraduation: v.hasPostGraduation === 'true',
    hasUndergraduate: v.hasUndergraduate === 'true',
  });

  const submit = async (v) => {
    const errs = {};
    if (!v.qualificationAfter10th) errs.qualificationAfter10th = true;
    if (!v.hasUndergraduate) errs.hasUndergraduate = true;
    if (!v.hasPostGraduation) errs.hasPostGraduation = true;

    if (Object.keys(errs).length > 0) {
      setToggleErrors(errs);
      const firstRef = errs.qualificationAfter10th ? qualRef : errs.hasUndergraduate ? ugRef : pgRef;
      firstRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setToggleErrors({});
    const nextData = buildDetailsData(v);
    setData(nextData);
    await saveDraft(nextData);
    onNext();
  };

  const saveDraftNow = async () => {
    const nextData = buildDetailsData(getValues());
    setData(nextData);
    await saveDraft(nextData);
  };

  const deleteAttachment = () => {
    setValue('marksheetFile', []);
    clearErrors('marksheetFile');
    setData((current) => ({ ...current, marksheetFile: null }));
  };
  const deleteIntermediateAttachment = () => {
    setValue('intermediateMarksheetFile', null);
    clearErrors('intermediateMarksheetFile');
    setData((current) => ({ ...current, intermediateMarksheetFile: null }));
  };
  const deleteDiplomaAttachment = () => {
    setValue('diplomaMarksheetFile', null);
    clearErrors('diplomaMarksheetFile');
    setData((current) => ({ ...current, diplomaMarksheetFile: null }));
  };
  const deletePostGraduationAttachment = () => {
    setValue('postGraduationMarksheetFile', null);
    clearErrors('postGraduationMarksheetFile');
    setData((current) => ({ ...current, postGraduationMarksheetFile: null }));
  };
  const deleteUndergraduateAttachment = () => {
    setValue('undergraduateMarksheetFile', null);
    clearErrors('undergraduateMarksheetFile');
    setData((current) => ({ ...current, undergraduateMarksheetFile: null }));
  };
  return (
    <form className="registration-form" onSubmit={handleSubmit(submit)}>
      {/* basic details */}
      <div className="glass-card mt-3 p-3" style={{ borderRadius: 12}}>
        <ProfileImagePicker
          value={data.profileImage}
          onChange={(dataUrl) => setData(prev => ({ ...prev, profileImage: dataUrl }))}
        />
        <SectionHeader icon={FiUser}>Personal Information</SectionHeader>
        
        <div className="row g-3">
          <div className="col-md-6">
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="label-sm">Full Name</div>
                <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>auto-filled from login</span>
              </div>
              <div className="input-icon-wrap">
                <span className="icon-left"><FiUser /></span>
                <input
                  className="form-control dark-input"
                  placeholder="John Doe"
                  readOnly
                  style={{ cursor: 'not-allowed', opacity: 0.7 }}
                  {...register('fullName', { required: 'Required' })}
                />
              </div>
            </div>

               {/* <DarkInput label="Full Name" placeholder="John Doe"
              error={errors.fullName?.message} register={register('fullName', { required: 'Required' })} /> */}
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="label-sm">Email Address</div>
                <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>auto-filled from login</span>
              </div>
              <div className="input-icon-wrap">
                <span className="icon-left"><FiMail /></span>
                <input
                  className="form-control dark-input"
                  placeholder="john.doe@university.edu"
                  readOnly
                  style={{ cursor: 'not-allowed', opacity: 0.7 }}
                  {...register('email', { required: 'Required', pattern: { value: /^\S+@\S+$/, message: 'Invalid' } })}
                />
              </div>
            </div>
          </div>
          <div className="col-12">
            <div className="d-flex gap-2 align-items-start">
              <div style={{ width: 88, flexShrink: 0 }}>
                <div className="mb-3">
                  <div className="label-sm">Country</div>
                  <div className="select-field-wrap">
                    <select className="form-select dark-input select-with-icon" {...register('country')}>
                      <option>+1</option><option>+44</option><option>+91</option><option>+61</option>
                    </select>
                    <span className="select-field-icon"><FiChevronDown /></span>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <DarkInput icon={FiPhone} label="Phone Number" placeholder="123 456 7890"
                  error={errors.phone?.message} register={register('phone', { required: 'Required' })} />
              </div>
            </div>
          </div>
           <div className="col-md-12">
            <DarkInput label="Address" placeholder=""
              error={errors.address?.message} register={register('address', { required: 'Required' })} />
          </div>
        </div>
      </div>

      {/* Education block1 */}
      <div className="glass-card mt-3 p-3" style={{ borderRadius: 12 }}>
        <SectionHeader icon={EduIcon}>Education Qualifications</SectionHeader>

        <div className="glass-card edu-card" style={{ borderRadius: 14, }}>
          <SectionHeader  className="mb-2" style={{ fontSize: 16 }}>
            Secondary Education (10th)
          </SectionHeader>
          <div className="row g-3">
             <div className="col-md-12">
                <DarkInput
                  label="School"
                  placeholder="School Name"
                  error={errors.undergraduateUniversity?.message}
                  register={register('school', { required: 'Required' })}
                />
              </div>
            <div className="col-6">
              <DarkInput  label="GPA/Percentage" placeholder="9.0 or 90%"
                error={errors.gpa?.message}
                register={register('gpa', {
                  required: 'Required',
                  validate: value => {
                    const normalized = value.trim().replace('%', '');
                    const score = parseFloat(normalized);
                    return (!Number.isNaN(score) && score >= 0 && score <= 100) || 'Enter a valid GPA or percentage';
                  }
                })} />
            </div>
            <div className="col-6">
              <div className="mb-3">
                <div className="label-sm">Year of Passing</div>
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
                  return (
                    <div className="select-field-wrap">
                      <select className="form-select dark-input select-with-icon" defaultValue={String(currentYear)} {...register('yearOfPassing', { required: 'Required' })}>
                        {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                      </select>
                      <span className="select-field-icon"><FiChevronDown /></span>
                    </div>
                  );
                })()}
                {errors.yearOfPassing && <div className="text-danger small mt-1">{errors.yearOfPassing.message}</div>}
              </div>
            </div>
            <div className="col-12">
              <div className="mb-0">
                <label htmlFor="marksheetFile" className="upload-area w-100 d-flex flex-column align-items-center justify-content-center">
                  <span className="upload-icon mb-2" style={{ fontSize: 28, color: '#f5b94b' }}>
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 16V4m0 0-4 4m4-4 4 4" stroke="#f5b94b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="16" width="16" height="4" rx="2" fill="none" stroke="#f5b94b" strokeWidth="2"/></svg>
                  </span>
                  <span className="upload-label">Upload Secondary (10th) Certificate</span>
                  <input
                    id="marksheetFile"
                    type="file"
                    accept=".pdf,application/pdf"
                    className="upload-input"
                    style={{ display: 'none' }}
                    {...register('marksheetFile', {
  validate: value => {
    const existingFile = data.marksheetFile;

    if ((!value || value.length === 0) && !existingFile) {
      return 'Required';
    }

    const file = value?.[0] || existingFile;

    if (!file) return 'Required';

    return (
      file?.type === 'application/pdf' ||
      file?.name?.toLowerCase()?.endsWith('.pdf') ||
      'Only PDF files are allowed'
    );
  }
})}
                  />
                </label>
                {errors.marksheetFile && <div className="text-danger small mt-1">{errors.marksheetFile.message}</div>}

                {selectedFile && (
                  <div className="attached-doc mt-3">
                    <div className="attached-doc-icon"><FiFileText /></div>
                    <div className="attached-doc-content">
                      <div className="attached-doc-name">{selectedFile.name}</div>
                      <div className="attached-doc-meta">{Math.round(selectedFile.size / 1024)} KB </div>
                    </div>
                    <div className="d-flex gap-2 ms-auto">
                      <a href={filePreviewUrl} target="_blank" rel="noreferrer" className="reg-btn reg-btn-sm">
                        Preview
                      </a>
                      <button
                        type="button"
                        className="reg-btn reg-btn-sm"
                        onClick={deleteAttachment}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      

      {/* Qualification after 10th — combined Intermediate / Diploma toggle */}

      <div ref={qualRef} className="glass-card mt-3 p-3" style={{ borderRadius: 12, outline: toggleErrors.qualificationAfter10th ? '2px solid var(--brand-orange)' : 'none' }}>
        <SectionHeader>Qualification after 10th</SectionHeader>
        {toggleErrors.qualificationAfter10th && <div style={{ color: 'var(--brand-orange)', fontSize: 12, marginBottom: 8 }}>Please select Intermediate or Diploma to continue.</div>}
        <div className="yesno" style={{ maxWidth: 340 }}>
          <label className={qualificationAfter10th === 'intermediate' ? 'active' : ''}>
            <input type="radio" value="intermediate" {...register('qualificationAfter10th')} />
            Intermediate
          </label>
          <label className={qualificationAfter10th === 'diploma' ? 'active' : ''}>
            <input type="radio" value="diploma" {...register('qualificationAfter10th')} />
            Diploma
          </label>
        </div>
        {/* Intermediate / 12th fields */}
      {qualificationAfter10th === 'intermediate' && (
        <div className=" mt-3 " style={{ borderRadius: 12 }}>
          <SectionHeader className="mb-2" style={{ fontSize: 16 }}>Intermediate / 12th</SectionHeader>
          <div className="row g-3">
            
            <div className="col-md-12">
              <div className="mb-3">
                <div className="label-sm">Stream</div>
                <div className="select-field-wrap">
                  <select className="form-select dark-input select-with-icon" {...register('stream', { required: 'Required' })}>
                    <option value="">Select</option>
                    <option value="MPC">MPC</option>
                    <option value="BiPC">BiPC</option>
                    <option value="CEC">CEC</option>
                    <option value="HEC">HEC</option>
                    <option value="Science">Science</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Arts">Arts</option>
                  </select>
                  <span className="select-field-icon"><FiChevronDown /></span>
                </div>
                {errors.stream && <div className="text-danger small mt-1">{errors.stream.message}</div>}
              </div>
            </div>
            <div className="col-md-12">
                <DarkInput
                  label="College/University Name"
                  placeholder=""
                  error={errors.undergraduateUniversity?.message}
                  register={register('gratudatecollege', { required: 'Required' })}
                />
              </div>
            <div className="col-6">
              <DarkInput label="GPA/Percentage" placeholder="9.0 or 90%"
                error={errors.intermediateGpa?.message}
                register={register('intermediateGpa', {
                  required: 'Required',
                  validate: value => {
                    const normalized = value.trim().replace('%', '');
                    const score = parseFloat(normalized);
                    return (!Number.isNaN(score) && score >= 0 && score <= 100) || 'Enter a valid GPA or percentage';
                  }
                })} />
            </div>
            <div className="col-6">
              <div className="mb-3">
                <div className="label-sm">Passing Year</div>
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
                  return (
                    <div className="select-field-wrap">
                      <select className="form-select dark-input select-with-icon" defaultValue={String(currentYear)} {...register('intermediateYearOfPassing', { required: 'Required' })}>
                        {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                      </select>
                      <span className="select-field-icon"><FiChevronDown /></span>
                    </div>
                  );
                })()}
                {errors.intermediateYearOfPassing && <div className="text-danger small mt-1">{errors.intermediateYearOfPassing.message}</div>}
              </div>
            </div>
            <div className="col-12">
              <div className="mb-0">
                <label htmlFor="intermediateMarksheetFile" className="upload-area w-100 d-flex flex-column align-items-center justify-content-center">
                  <span className="upload-icon mb-2" style={{ fontSize: 28, color: '#f5b94b' }}>
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 16V4m0 0-4 4m4-4 4 4" stroke="#f5b94b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="16" width="16" height="4" rx="2" fill="none" stroke="#f5b94b" strokeWidth="2"/></svg>
                  </span>
                  <span className="upload-label">Upload Intermediate/12th Certificate</span>
                  <span className="upload-hint">PDF, JPG, below 1 MB</span>
                  <input id="intermediateMarksheetFile" type="file" accept=".pdf,application/pdf"
                    className="upload-input" style={{ display: 'none' }}
                    {...register('intermediateMarksheetFile', {
                      validate: value => {
                        const existingFile = data.intermediateMarksheetFile;
                        if ((!value || value.length === 0) && !existingFile) return 'Required';
                        const file = value?.[0] || existingFile;
                        if (!file) return 'Required';
                        return file?.type === 'application/pdf' || file?.name?.toLowerCase()?.endsWith('.pdf') || 'Only PDF files are allowed';
                      }
                    })} />
                </label>
                {errors.intermediateMarksheetFile && <div className="text-danger small mt-1">{errors.intermediateMarksheetFile.message}</div>}
                {intermediateSelectedFile && (
                  <div className="attached-doc mt-3">
                    <div className="attached-doc-icon"><FiFileText /></div>
                    <div className="attached-doc-content">
                      <div className="attached-doc-name">{intermediateSelectedFile.name}</div>
                      <div className="attached-doc-meta">{Math.round(intermediateSelectedFile.size / 1024)} KB</div>
                    </div>
                    <div className="d-flex gap-2 ms-auto">
                      <a href={intermediatePreviewUrl} target="_blank" rel="noreferrer" className="reg-btn reg-btn-sm">Preview</a>
                      <button type="button" className="reg-btn reg-btn-sm" onClick={deleteIntermediateAttachment}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diploma fields */}
      {qualificationAfter10th === 'diploma' && (
        <div className=" mt-3 " style={{ borderRadius: 12 }}>
          <SectionHeader className="mb-2" style={{ fontSize: 16 }}>Diploma</SectionHeader>
          <div className="row g-3">
            
            <div className="col-md-12">
              <div className="mb-3">
                <div className="label-sm">Branch</div>
                <div className="select-field-wrap">
                  <select className="form-select dark-input select-with-icon" {...register('diplomaBranch', { required: 'Required' })}>
                   <option value="">Select Branch</option>
                      {DIPLOMA_BRANCH_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                  </select>
                  <span className="select-field-icon"><FiChevronDown /></span>
                </div>
                {errors.stream && <div className="text-danger small mt-1">{errors.stream.message}</div>}
              </div>
            </div>
            <div className="col-md-12">
                <DarkInput
                  label="College/University Name"
                  placeholder=""
                  error={errors.undergraduateUniversity?.message}
                  register={register('diplomacollege', { required: 'Required' })}
                />
              </div>
            <div className="col-6">
              <DarkInput label="GPA/Percentage" placeholder="9.0 or 90%"
                error={errors.diplomaGpa?.message}
                register={register('diplomaGpa', {
                  required: 'Required',
                  validate: value => {
                    const normalized = value.trim().replace('%', '');
                    const score = parseFloat(normalized);
                    return (!Number.isNaN(score) && score >= 0 && score <= 100) || 'Enter a valid GPA or percentage';
                  }
                })} />
            </div>
            <div className="col-6">
              <div className="mb-3">
                <div className="label-sm">Passing Year</div>
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
                  return (
                    <div className="select-field-wrap">
                      <select className="form-select dark-input select-with-icon" defaultValue={String(currentYear)} {...register('diplomaYearOfPassing', { required: 'Required' })}>
                        {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                      </select>
                      <span className="select-field-icon"><FiChevronDown /></span>
                    </div>
                  );
                })()}
                {errors.diplomaYearOfPassing && <div className="text-danger small mt-1">{errors.diplomaYearOfPassing.message}</div>}
              </div>
            </div>
            <div className="col-12">
              <div className="mb-0">
                <label htmlFor="diplomaMarksheetFile" className="upload-area w-100 d-flex flex-column align-items-center justify-content-center">
                  <span className="upload-icon mb-2" style={{ fontSize: 28, color: '#f5b94b' }}>
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 16V4m0 0-4 4m4-4 4 4" stroke="#f5b94b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="16" width="16" height="4" rx="2" fill="none" stroke="#f5b94b" strokeWidth="2"/></svg>
                  </span>
                  <span className="upload-label">Upload Diploma Certificate</span>
                  <span className="upload-hint">PDF, JPG, below 1 MB</span>
                  <input id="diplomaMarksheetFile" type="file" accept=".pdf,application/pdf"
                    className="upload-input" style={{ display: 'none' }}
                    {...register('diplomaMarksheetFile', {
                      validate: value => {
                        const existingFile = data.diplomaMarksheetFile;
                        if ((!value || value.length === 0) && !existingFile) return 'Required';
                        const file = value?.[0] || existingFile;
                        if (!file) return 'Required';
                        return file?.type === 'application/pdf' || file?.name?.toLowerCase()?.endsWith('.pdf') || 'Only PDF files are allowed';
                      }
                    })} />
                </label>
                {errors.diplomaMarksheetFile && <div className="text-danger small mt-1">{errors.diplomaMarksheetFile.message}</div>}
                {diplomaSelectedFile && (
                  <div className="attached-doc mt-3">
                    <div className="attached-doc-icon"><FiFileText /></div>
                    <div className="attached-doc-content">
                      <div className="attached-doc-name">{diplomaSelectedFile.name}</div>
                      <div className="attached-doc-meta">{Math.round(diplomaSelectedFile.size / 1024)} KB</div>
                    </div>
                    <div className="d-flex gap-2 ms-auto">
                      <a href={diplomaPreviewUrl} target="_blank" rel="noreferrer" className="reg-btn reg-btn-sm">Preview</a>
                      <button type="button" className="reg-btn reg-btn-sm" onClick={deleteDiplomaAttachment}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      

      <div ref={ugRef} className="glass-card mt-3 p-3" style={{ borderRadius: 12, outline: toggleErrors.hasUndergraduate ? '2px solid var(--brand-orange)' : 'none' }}>
        <SectionHeader style={{ color: 'white', fontWeight: 500 }}>
          Do you have Undergraduate degree?
        </SectionHeader>
        {toggleErrors.hasUndergraduate && <div style={{ color: 'var(--brand-orange)', fontSize: 12, marginBottom: 8 }}>Please select Yes or No to continue.</div>}
        <div className="mb-3">
          <div className="yesno" style={{ maxWidth: 340 }}>
            <label className={hasUndergraduate === 'true' ? 'active' : ''}>
              <input type="radio" value="true" {...register('hasUndergraduate')} />
              Yes
            </label>
            <label className={hasUndergraduate === 'false' ? 'active' : ''}>
              <input type="radio" value="false" {...register('hasUndergraduate')} />
              No
            </label>
          </div>
        </div>
        {hasUndergraduate === 'true' && (
        <div className="mt-3" style={{ borderRadius: 12 }}>
          <div className="card-dark" >
            <SectionHeader className="mb-2" style={{ fontSize: 16 }}>
              Undergraduate Degree
            </SectionHeader>
            <div className="row g-3">

              <div className="col-md-12">
                <div className="mb-3">
                  <div className="label-sm">Degree</div>
                  <div className="select-field-wrap">
                    <select className="form-select dark-input select-with-icon" {...register('undergraduateDegree', {
                      validate: v => hasUndergraduate === 'true' ? (!!v || 'Required') : true
                    })}>
                      <option value="">Select Degree</option>
                      {DEGREE_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <span className="select-field-icon"><FiChevronDown /></span>
                  </div>
                  {errors.undergraduateDegree && <div className="text-danger small mt-1">{errors.undergraduateDegree.message}</div>}
                </div>
              </div>

              {undergraduateDegree === 'Other' && (
                <div className="col-md-12">
                  <DarkInput
                    label="Other Degree"
                    placeholder="Enter your degree"
                    error={errors.undergraduateOtherDegree?.message}
                    register={register('undergraduateOtherDegree', {
                      validate: value => (hasUndergraduate === 'true' && undergraduateDegree === 'Other') ? !!value?.trim() || 'Required' : true,
                    })}
                  />
                </div>
              )}

            

              {undergraduateDegree === 'B.Tech' && (
                <div className="col-md-12">
                <div className="mb-3">
                  <div className="label-sm">Degree</div>
                  <div className="select-field-wrap">
                    <select className="form-select dark-input select-with-icon" {...register('btechDegree', {
                      validate: v => (hasUndergraduate === 'true' && undergraduateDegree === 'B.Tech') ? (!!v || 'Required') : true
                    })}>
                      <option value="">Select Degree</option>
                      {Btech_Branch_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <span className="select-field-icon"><FiChevronDown /></span>
                  </div>
                  {errors.undergraduateDegree && <div className="text-danger small mt-1">{errors.undergraduateDegree.message}</div>}
                </div>
              </div>
              )}

              <div className="col-md-12">
                <DarkInput
                  label="University/College"
                  placeholder="University/College Name"
                  error={errors.undergraduateUniversity?.message}
                  register={register('undergraduateUniversity', {
                    validate: v => hasUndergraduate === 'true' ? (!!v?.trim() || 'Required') : true
                  })}
                />
              </div>

              <div className="col-6">
                <DarkInput  label="GPA/Percentage" placeholder="9.0 or 90%"
                  error={errors.gpa?.message}
                  register={register('gpa', {
                    required: 'Required',
                    validate: value => {
                      const normalized = value.trim().replace('%', '');
                      const score = parseFloat(normalized);
                      return (!Number.isNaN(score) && score >= 0 && score <= 100) || 'Enter a valid GPA or percentage';
                    }
                  })} />
              </div>
              <div className="col-6">
                <div className="mb-3">
                  <div className="label-sm">Year of Passing</div>
                  {(() => {
                    const currentYear = new Date().getFullYear();
                    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
                    return (
                      <div className="select-field-wrap">
                        <select className="form-select dark-input select-with-icon" defaultValue={String(currentYear)} {...register('yearOfPassing', { required: 'Required' })}>
                          {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                        </select>
                        <span className="select-field-icon"><FiChevronDown /></span>
                      </div>
                    );
                  })()}
                  {errors.yearOfPassing && <div className="text-danger small mt-1">{errors.yearOfPassing.message}</div>}
                </div>
              </div>
              <div className="col-12">
                <div className="mb-0">
                  <label htmlFor="undergraduateMarksheetFile" className="upload-area w-100 d-flex flex-column align-items-center justify-content-center">
                    <span className="upload-icon mb-2" style={{ fontSize: 28, color: '#f5b94b' }}>
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 16V4m0 0-4 4m4-4 4 4" stroke="#f5b94b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="16" width="16" height="4" rx="2" fill="none" stroke="#f5b94b" strokeWidth="2"/></svg>
                    </span>
                    <span className="upload-label">Upload Undergraduate Certificate</span>
                    <input
                      id="undergraduateMarksheetFile"
                      type="file"
                      accept=".pdf,application/pdf"
                      className="upload-input"
                      style={{ display: 'none' }}
                      {...register('undergraduateMarksheetFile', {
  validate: value => {
    if (hasUndergraduate !== 'true') return true;
    const existingFile = data.undergraduateMarksheetFile;
    if ((!value || value.length === 0) && !existingFile) return 'Required';
    const file = value?.[0] || existingFile;
    if (!file) return 'Required';
    return file?.type === 'application/pdf' || file?.name?.toLowerCase()?.endsWith('.pdf') || 'Only PDF files are allowed';
  }
})}
                    />
                  </label>
                  {errors.undergraduateMarksheetFile && <div className="text-danger small mt-1">{errors.undergraduateMarksheetFile.message}</div>}

                  {undergraduateSelectedFile && (
                    <div className="attached-doc mt-3">
                      <div className="attached-doc-icon"><FiFileText /></div>
                      <div className="attached-doc-content">
                        <div className="attached-doc-name">{undergraduateSelectedFile.name}</div>
                        <div className="attached-doc-meta">{Math.round(undergraduateSelectedFile.size / 1024)} KB </div>
                      </div>
                      <div className="d-flex gap-2 ms-auto">
                        <a href={undergraduatePreviewUrl} target="_blank" rel="noreferrer" className="reg-btn reg-btn-sm">
                          Preview
                        </a>
                        <button
                          type="button"
                          className="reg-btn reg-btn-sm"
                          onClick={deleteUndergraduateAttachment}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      

      <div ref={pgRef} className="glass-card mt-3 p-3" style={{ borderRadius: 12, outline: toggleErrors.hasPostGraduation ? '2px solid var(--brand-orange)' : 'none' }}>
        <SectionHeader style={{ color: 'white', fontWeight: 500 }}>
          Do you have Postgraduate degree?
        </SectionHeader>
        {toggleErrors.hasPostGraduation && <div style={{ color: 'var(--brand-orange)', fontSize: 12, marginBottom: 8 }}>Please select Yes or No to continue.</div>}
        <div className="mb-3">
          <div className="yesno" style={{ maxWidth: 340 }}>
            <label className={hasPostGraduation === 'true' ? 'active' : ''}>
              <input type="radio" value="true" {...register('hasPostGraduation')} />
              Yes
            </label>
            <label className={hasPostGraduation === 'false' ? 'active' : ''}>
              <input type="radio" value="false" {...register('hasPostGraduation')} />
              No
            </label>
          </div>
        </div>
         {hasPostGraduation === 'true' && (
        <div className="mt-3" style={{ borderRadius: 12 }}>
          <div className="card-dark" >
            <SectionHeader className="mb-2" style={{ fontSize: 16 }}>
              Post Graduation Degree
            </SectionHeader>
            <div className="row g-3">
              <div className="col-md-12">
                <div className="mb-3">
                  <div className="label-sm">Degree</div>
                  <div className="select-field-wrap">
                    <select className="form-select dark-input select-with-icon" {...register('postGraduationDegree', {
                      validate: v => hasPostGraduation === 'true' ? (!!v || 'Required') : true
                    })}>
                      <option value="">Select Degree</option>
                      {DEGREE_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <span className="select-field-icon"><FiChevronDown /></span>
                  </div>
                  {errors.postGraduationDegree && <div className="text-danger small mt-1">{errors.postGraduationDegree.message}</div>}
                </div>
              </div>

              {postGraduationDegree === 'Other' && (
                <div className="col-md-12">
                  <DarkInput
                    label="Other Degree"
                    placeholder="Enter your degree"
                    error={errors.postGraduationOtherDegree?.message}
                    register={register('postGraduationOtherDegree', {
                      validate: value => (hasPostGraduation === 'true' && postGraduationDegree === 'Other') ? !!value?.trim() || 'Required' : true,
                    })}
                  />
                </div>
              )}

              <div className="col-md-12">
                <DarkInput label="University/College" placeholder="University/College Name"
                  error={errors.postGraduationUniversity?.message}
                  register={register('postGraduationUniversity', {
                    validate: v => hasPostGraduation === 'true' ? (!!v?.trim() || 'Required') : true
                  })} />
              </div>
              <div className="col-6">
                <DarkInput  label="GPA/Percentage" placeholder="9.0 or 90%"
                  error={errors.gpa?.message}
                  register={register('gpa', {
                    required: 'Required',
                    validate: value => {
                      const normalized = value.trim().replace('%', '');
                      const score = parseFloat(normalized);
                      return (!Number.isNaN(score) && score >= 0 && score <= 100) || 'Enter a valid GPA or percentage';
                    }
                  })} />
              </div>
              <div className="col-6">
                <div className="mb-3">
                  <div className="label-sm">Year of Passing</div>
                  {(() => {
                    const currentYear = new Date().getFullYear();
                    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
                    return (
                      <div className="select-field-wrap">
                        <select className="form-select dark-input select-with-icon" defaultValue={String(currentYear)} {...register('yearOfPassing', { required: 'Required' })}>
                          {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                        </select>
                        <span className="select-field-icon"><FiChevronDown /></span>
                      </div>
                    );
                  })()}
                  {errors.yearOfPassing && <div className="text-danger small mt-1">{errors.yearOfPassing.message}</div>}
                </div>
              </div>
              <div className="col-12">
                <div className="mb-0">
                  <label htmlFor="postGraduationMarksheetFile" className="upload-area w-100 d-flex flex-column align-items-center justify-content-center">
                    <span className="upload-icon mb-2" style={{ fontSize: 28, color: '#f5b94b' }}>
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 16V4m0 0-4 4m4-4 4 4" stroke="#f5b94b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="16" width="16" height="4" rx="2" fill="none" stroke="#f5b94b" strokeWidth="2"/></svg>
                    </span>
                    <span className="upload-label">Upload Post Graduation Certificate</span>
                    <input
                      id="postGraduationMarksheetFile"
                      type="file"
                      accept=".pdf,application/pdf"
                      className="upload-input"
                      style={{ display: 'none' }}
                      {...register('postGraduationMarksheetFile', {
  validate: value => {
    if (hasPostGraduation !== 'true') return true;
    const existingFile = data.postGraduationMarksheetFile;
    if ((!value || value.length === 0) && !existingFile) return 'Required';
    const file = value?.[0] || existingFile;
    if (!file) return 'Required';
    return file?.type === 'application/pdf' || file?.name?.toLowerCase()?.endsWith('.pdf') || 'Only PDF files are allowed';
  }
})}
                    />
                  </label>
                  {errors.postGraduationMarksheetFile && <div className="text-danger small mt-1">{errors.postGraduationMarksheetFile.message}</div>}

                  {postGraduationSelectedFile && (
                    <div className="attached-doc mt-3">
                      <div className="attached-doc-icon"><FiFileText /></div>
                      <div className="attached-doc-content">
                        <div className="attached-doc-name">{postGraduationSelectedFile.name}</div>
                        <div className="attached-doc-meta">{Math.round(postGraduationSelectedFile.size / 1024)} KB </div>
                      </div>
                      <div className="d-flex gap-2 ms-auto">
                        <a href={postGraduationPreviewUrl} target="_blank" rel="noreferrer" className="reg-btn reg-btn-sm">
                          Preview
                        </a>
                        <button
                          type="button"
                          className="reg-btn reg-btn-sm"
                          onClick={deletePostGraduationAttachment}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

     

        </div>

      <div className="first-part-buttons">
        <button
          type="button"
          className="reg-btn"
          onClick={saveDraftNow}
        >
          Save as Draft
        </button>
        <GradientButton className='gradient-btn' type="submit" style={{ maxWidth: 265   }}>Next: Project and Experience →</GradientButton>
      </div>
    </form>
  );
}

function ProjectEntry({ project, index, onChange, onRemove }) {
  return (
    <div className=" mt-3 mb-3 " style={{ borderRadius: 12 }}>
      {onRemove && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-heading)' }}>Project {index + 1}</span>
          <button type="button" className="reg-btn reg-btn-sm" onClick={onRemove}>Remove</button>
        </div>
      )}

      {/* Project Type */}
      <div className="mb-3">
        <div className="label-sm">Project Type</div>
        <div className="project-type-toggle">
          {[['in-house', 'In-house'], ['external', 'External']].map(([val, label]) => (
            <label key={val} className={`project-type-option ${project.projectType === val ? 'active' : ''}`}>
              <input type="radio" name={`projectType-${index}`} value={val} checked={project.projectType === val}
                onChange={() => onChange(index, 'projectType', val)} />
              <span className="project-type-dot" />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <div className="label-sm mb-2">Is this a Technical Project?</div>
        <div className="yesno" style={{ maxWidth: 340 }}>
          <button type="button" className={project.isTechnical === true ? 'active' : ''} onClick={() => onChange(index, 'isTechnical', true)}>Yes</button>
          <button type="button" className={project.isTechnical === false ? 'active' : ''} onClick={() => onChange(index, 'isTechnical', false)}>No</button>
        </div>
      </div>

      {/* College Name / Company — only for external projects */}
      {project.projectType === 'external' && (
        <div className="mb-3">
          <div className="label-sm">College Name / Company</div>
          <input className="form-control dark-input" placeholder="e.g. Google"
            value={project.collegeName} onChange={(e) => onChange(index, 'collegeName', e.target.value)} />
        </div>
      )}

      {/* Role + Duration */}
      <div className="row g-3 mb-3">
        <div className="col-6">
          <div className="label-sm">Role</div>
          <input className="form-control dark-input" placeholder="Intern"
            value={project.role} onChange={(e) => onChange(index, 'role', e.target.value)} />
        </div>
        <div className="col-6">
          <div className="label-sm">Duration</div>
          <select className="form-select dark-input"
            value={project.duration} onChange={(e) => onChange(index, 'duration', e.target.value)}>
            <option value="">Select duration</option>
            <option value="1 Month">1 Month</option>
            <option value="2 Months">2 Months</option>
            <option value="3 Months">3 Months</option>
            <option value="6 Months">6 Months</option>
            <option value="1 Year">1 Year</option>
            <option value="1.5 Years">1.5 Years</option>
            <option value="2 Years">2 Years</option>
            <option value="2+ Years">2+ Years</option>
          </select>
        </div>
      </div>

      {/* Project Title */}
      <div className="mb-3">
        <div className="label-sm">Project Title</div>
        <input className="form-control dark-input" placeholder="AI-Powered Lab Assistant"
          value={project.title} onChange={(e) => onChange(index, 'title', e.target.value)} />
      </div>

      {/* Is this a Technical Project? */}
      

      {/* Tech fields — only when Technical */}
      {project.isTechnical === true && (
        <>
          {/* Tech Stack */}
          <div className="mb-3">
            <div className="label-sm">Tech Stack</div>
            <div className="select-field-wrap">
              <select className="form-select dark-input select-with-icon" value={project.techStack}
                onChange={(e) => onChange(index, 'techStack', e.target.value)}>
                <option value="">Select Tech Stack</option>
                {TECH_STACK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <span className="select-field-icon"><FiChevronDown /></span>
            </div>
          </div>

          {/* Front-end */}
          <div className="mb-3">
            <div className="label-sm">Front-end</div>
            <div className="select-field-wrap">
              <select className="form-select dark-input select-with-icon" value={project.frontEnd}
                onChange={(e) => onChange(index, 'frontEnd', e.target.value)}>
                <option value="">Select front-end tech</option>
                {FRONTEND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <span className="select-field-icon"><FiChevronDown /></span>
            </div>
          </div>

          {/* Back-end */}
          <div className="mb-3">
            <div className="label-sm">Back-end</div>
            <div className="select-field-wrap">
              <select className="form-select dark-input select-with-icon" value={project.backEnd}
                onChange={(e) => onChange(index, 'backEnd', e.target.value)}>
                <option value="">Select back-end tech</option>
                {BACKEND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <span className="select-field-icon"><FiChevronDown /></span>
            </div>
          </div>

          {/* DB */}
          <div className="mb-3">
            <div className="label-sm">DB</div>
            <div className="select-field-wrap">
              <select className="form-select dark-input select-with-icon" value={project.database}
                onChange={(e) => onChange(index, 'database', e.target.value)}>
                <option value="">Select database</option>
                {DATABASE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <span className="select-field-icon"><FiChevronDown /></span>
            </div>
          </div>

          {/* Description */}
          
        </>
        
      )}
  <div className="mb-0">
            <div className="label-sm">Project Description</div>
            <textarea rows={4} className="form-control dark-input"
              placeholder="Developed an automated inventory tracking system for the university lab using computer vision."
              value={project.description} onChange={(e) => onChange(index, 'description', e.target.value)} />
          </div>
    </div>
  );
}

function StepProjects({ data, setData, onNext, onBack }) {
  const resumeInputRef = useRef(null);

  const [hasProjects, setHasProjects] = useState(data.hasProjects ?? true);
  const [projects, setProjects] = useState(
    Array.isArray(data.projects) && data.projects.length > 0
      ? data.projects : [createEmptyProject()]
  );
  const [hasWorkExperience, setHasWorkExperience] = useState(data.hasWorkExperience ?? true);
  const [positions, setPositions] = useState(
    Array.isArray(data.positions) && data.positions.length > 0
      ? data.positions : [createEmptyPosition()]
  );
  const [resumeFile, setResumeFile] = useState(data.resumeFile ?? null);
  const [wantsAiProfile, setWantsAiProfile] = useState(data.wantsAiProfile ?? null);

  const updateProject = (index, field, value) =>
    setProjects(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  const addProject = () => setProjects(prev => [...prev, createEmptyProject()]);
  const removeProject = (index) => setProjects(prev => prev.filter((_, i) => i !== index));

  const updatePosition = (index, field, value) =>
    setPositions(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  const addPosition = () => setPositions(prev => [...prev, createEmptyPosition()]);
  const removePosition = (index) => setPositions(prev => prev.filter((_, i) => i !== index));

  const handleResumeChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setResumeFile(file);
  };

  const buildData = () => ({ ...data, hasProjects, projects, hasWorkExperience, positions, resumeFile, wantsAiProfile });

  const saveDraftNow = async () => {
    const next = buildData();
    setData(next);
    await saveDraft(next);
  };

  const submit = (e) => {
    e.preventDefault();
    const next = buildData();
    setData(next);
    onNext();
  };

  return (
    <form onSubmit={submit}>
      <div className="alert-info-dark mb-3 d-flex gap-2 align-items-start">
        <FiAlertCircle className="mt-1" />
        <div>
          <strong>Email Confirmation</strong>
          <div>A summary will be sent to your student email upon submission.</div>
        </div>
      </div>

      {/* ── College Projects ── */}
     
      <div className="glass-card mb-3 p-3" style={{ borderRadius: 12 }}>
         <SectionHeader icon={FiFolder}>College Projects</SectionHeader>
        <div className="label-sm mb-2">Do you have any College Projects?</div>
        {/* <div className="yesno" style={{ maxWidth: 340 }}>
          <button type="button" className={hasProjects ? 'active' : ''} onClick={() => setHasProjects(true)}>Yes</button>
          <button type="button" className={!hasProjects ? 'active' : ''} onClick={() => setHasProjects(false)}>No</button>
        </div> */}
        {hasProjects && (
        <>
          {projects.map((project, index) => (
            <ProjectEntry key={index} project={project} index={index} onChange={updateProject}
              onRemove={projects.length > 1 ? () => removeProject(index) : null} />
          ))}
          <button type="button" className="add-project-btn mb-4" onClick={addProject}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Project
          </button>
        </>
      )}
      </div>

      

      {/* ── Work Experience ── */}
      
      <div className="glass-card mb-3 p-3" style={{ borderRadius: 12 }}>
        <SectionHeader icon={WorkIcon}>Work Experience</SectionHeader>
        <div className="label-sm mb-2">Do you have professional Work Experience?</div>
        <div className="yesno" style={{ maxWidth: 340 }}>
          <button type="button" className={hasWorkExperience ? 'active' : ''} onClick={() => setHasWorkExperience(true)}>Yes</button>
          <button type="button" className={!hasWorkExperience ? 'active' : ''} onClick={() => setHasWorkExperience(false)}>No</button>
        </div>
        {hasWorkExperience && (
        <>
          {positions.map((pos, index) => (
            <div key={index} className=" mb-3 mt-3" style={{ borderRadius: 12 }}>
              {positions.length > 1 && (
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-heading)' }}>Position {index + 1}</span>
                  <button type="button" className="reg-btn reg-btn-sm" onClick={() => removePosition(index)}>Remove</button>
                </div>
              )}
              <div className="mb-3">
                <div className="label-sm">Company Name</div>
                <input className="form-control dark-input" placeholder="TechCorp Inc."
                  value={pos.companyName} onChange={(e) => updatePosition(index, 'companyName', e.target.value)} />
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <div className="label-sm">Role</div>
                  <input className="form-control dark-input" placeholder="Software Intern"
                    value={pos.role} onChange={(e) => updatePosition(index, 'role', e.target.value)} />
                </div>
                <div className="col-6">
                  <div className="label-sm">Duration</div>
                  <select className="form-select dark-input"
                    value={pos.duration} onChange={(e) => updatePosition(index, 'duration', e.target.value)}>
                    <option value="">Select </option>
                    <option value="1 Month">1 Month</option>
                    <option value="2 Months">2 Months</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                    <option value="1.5 Years">1.5 Years</option>
                    <option value="2 Years">2 Years</option>
                    <option value="2+ Years">2+ Years</option>
                  </select>
                </div>
              </div>
              <button type="button" className="add-project-btn mt-4 mb-4" onClick={addPosition}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Position
          </button>
            </div>
          ))}
          
        </>
      )}
      </div>

      

      {/* ── Resume ── */}
     
      <div className="glass-card mb-3 p-3" style={{ borderRadius: 12 }}>
        <SectionHeader icon={FiFileText}>Profile</SectionHeader>
        <div className="label-sm mb-2">Do you want an AI-generated profile?</div>
        <div className="yesno" style={{ maxWidth: 340 }}>
          <button type="button" className={wantsAiProfile === true ? 'active' : ''} onClick={() => setWantsAiProfile(true)}>Yes</button>
          <button type="button" className={wantsAiProfile === false ? 'active' : ''} onClick={() => setWantsAiProfile(false)}>No</button>
        </div>

        {wantsAiProfile === false && (
          <div className="mt-3">
            {resumeFile ? (
              <div className="attached-doc">
                <div className="attached-doc-icon"><FiFileText /></div>
                <div className="attached-doc-content">
                  <div className="attached-doc-name">{resumeFile.name}</div>
                  <div className="attached-doc-meta">{Math.round(resumeFile.size / 1024)} KB</div>
                </div>
                <div className="d-flex gap-2 ms-auto">
                  <a href={URL.createObjectURL(resumeFile)} target="_blank" rel="noreferrer" className="reg-btn reg-btn-sm">
                    Preview
                  </a>
                  <button type="button" className="reg-btn reg-btn-sm" onClick={() => { setResumeFile(null); if (resumeInputRef.current) resumeInputRef.current.value = ''; }}>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="upload-area w-100 d-flex flex-column align-items-center justify-content-center"
                style={{ cursor: 'pointer', minHeight: 120 }} onClick={() => resumeInputRef.current?.click()}>
                <span className="mb-2" style={{ fontSize: 32, color: 'var(--text-subtle)' }}>
                  <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
                    <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M12 2v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 6l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </span>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-body)' }}>Click to upload your Profile</span>
                <span style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 4 }}>(PDF, Max 5MB)</span>
              </label>
            )}
          </div>
        )}
        <input ref={resumeInputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={handleResumeChange} />
      </div>

      <div className="d-flex justify-content-between mt-2 gap-2">
        <button type="button" className="reg-btn" onClick={onBack}> Back</button>
        <div className="d-flex gap-2">
          <button type="button" className="reg-btn" onClick={saveDraftNow}>Save as Draft</button>
          <GradientButton type="submit" style={{ maxWidth: 220 }}>Continue →</GradientButton>
        </div>
      </div>
    </form>
  );
}

function StepPreview({ data, onBack, onSubmitSuccess, setStep }) {
  const formatYesNo = value => (value ? 'Yes' : 'No');
  const formatFile = file => file?.name || '—';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await saveDraft(data);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const email = data.email || (typeof window !== 'undefined' ? window.localStorage.getItem('email') : null);
      const fd = new FormData();
      fd.append('data', JSON.stringify(buildJsonFields(data, email)));
      appendFiles(fd, data);
      await axios.post(
        `${API_BASE_URL}/api/registration/submit`,
        fd,
        { withCredentials: true },
      );
      onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting registration:', error);
      console.error('Error response data:', error.response?.data);
      setSubmitError(error.response?.data?.message || error.message || 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-3 glass-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ position: 'relative', width: 110, height: 110, background: '#e8edf5', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="66" height="58" viewBox="0 0 66 58" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Back folder */}
              <path d="M4 15C4 12.8 5.8 11 8 11H21L26 16H54C56.2 16 58 17.8 58 20V41C58 43.2 56.2 45 54 45H8C5.8 45 4 43.2 4 41V15Z" fill="#7aaad8" opacity="0.8"/>
              {/* Front folder */}
              <path d="M10 22C10 19.8 11.8 18 14 18H27L32 23H60C62.2 23 64 24.8 64 27V48C64 50.2 62.2 52 60 52H14C11.8 52 10 50.2 10 48V22Z" fill="#4a7cc7"/>
            </svg>
            <div style={{ position: 'absolute', bottom: 9, right: 9, width: 29, height: 29, background: 'var(--brand-orange)', borderRadius: '50%', border: '2.5px solid #12152a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                <path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
        <h3 style={{ color: '#4A7CC7', fontWeight: 800 }}>Almost there!</h3>
        <p className="text-muted-2">Please review your information carefully before submitting. This action will finalize your academic profile for the upcoming semester.</p>
      </div>
      <div className="alert-info-dark mb-3">
        <strong>Confirmation:</strong> A comprehensive summary of your registration will be sent to your student email address immediately upon submission.
      </div>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <strong>Registration Preview</strong>
        <button className="reg-btn reg-btn-sm d-inline-flex align-items-center gap-1" onClick={() => setStep(0)}>
          <FiEdit2 /> Edit Details
        </button>
      </div>

      {/* ── Step 1: Basic Details ── */}
      <PreviewSection title="Personal Information" icon={FiUser} rows={[
        ['Full Name', data.fullName || '—'],
        ['Email', data.email || '—'],
        ['Phone Number', `${data.country || ''} ${data.phone || ''}`.trim() || '—'],
        ['Address', data.address || '—'],
      ]} />

      {/* ── Secondary Education (10th) ── */}
      <PreviewSection style={{borderBottom:"10px"}} title="Secondary Education (10th)" icon={EduIcon} rows={[
        ['School', data.school || '—'],
        ['GPA/Percentage', data.gpa || '—'],
        ['Year of Passing', data.yearOfPassing || '—'],
        ['Certificate', formatFile(data.marksheetFile)],
      ]} />

      {/* ── Qualification after 10th ── */}
      <PreviewSection title="Qualification after 10th" icon={EduIcon} rows={[
        ['Mode', data.qualificationAfter10th === 'diploma' ? 'Diploma' : data.qualificationAfter10th === 'intermediate' ? 'Intermediate' : '—'],
        ...(data.qualificationAfter10th === 'intermediate' ? [
          ['Stream', data.stream || '—'],
          ['College / University', data.gratudatecollege || '—'],
          ['GPA/Percentage', data.intermediateGpa || '—'],
          ['Year of Passing', data.intermediateYearOfPassing || '—'],
          ['Certificate', formatFile(data.intermediateMarksheetFile)],
        ] : data.qualificationAfter10th === 'diploma' ? [
          ['Branch', data.diplomaBranch || '—'],
          ['College / University', data.diplomacollege || '—'],
          ['GPA/Percentage', data.diplomaGpa || '—'],
          ['Year of Passing', data.diplomaYearOfPassing || '—'],
          ['Certificate', formatFile(data.diplomaMarksheetFile)],
        ] : []),
      ]} />

      {/* ── Undergraduate ── */}
      <PreviewSection title="Undergraduate" icon={EduIcon} rows={[
        ['Has Undergraduate', formatYesNo(data.hasUndergraduate)],
        ...(data.hasUndergraduate ? [
          ['Degree', data.undergraduateDegree || '—'],
          ...(data.undergraduateDegree === 'B.Tech' ? [['Branch', data.btechDegree || '—']] : []),
          ...(data.undergraduateDegree === 'Other' ? [['Other Degree', data.undergraduateOtherDegree || '—']] : []),
          ['University', data.undergraduateUniversity || '—'],
          ['GPA/Percentage', data.gpa || '—'],
          ['Year of Passing', data.yearOfPassing || '—'],
          ['Certificate', formatFile(data.undergraduateMarksheetFile)],
        ] : []),
      ]} />

      {/* ── Postgraduate ── */}
      <PreviewSection title="Postgraduate" icon={EduIcon} rows={[
        ['Has Postgraduate', formatYesNo(data.hasPostGraduation)],
        ...(data.hasPostGraduation ? [
          ['Degree', data.postGraduationDegree || '—'],
          ...(data.postGraduationDegree === 'Other' ? [['Other Degree', data.postGraduationOtherDegree || '—']] : []),
          ['University', data.postGraduationUniversity || '—'],
          ['GPA/Percentage', data.gpa || '—'],
          ['Year of Passing', data.yearOfPassing || '—'],
          ['Certificate', formatFile(data.postGraduationMarksheetFile)],
        ] : []),
      ]} />

      {/* ── Step 2: College Projects ── */}
      <div className="preview card-dark mb-2" style={{ padding: 16 }}>
        <div style={{ color: 'var(--orange)', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><FiFolder style={{ color: 'var(--brand-orange)', flexShrink: 0 }} />College Projects</div>
        <div className="preview-row py-1" style={{ borderBottom: '1px dashed var(--border-color)' }}>
          <span className="text-muted-2 small">Has Projects</span>
          <span className="small text-end">{data.hasProjects ? 'Yes' : 'No'}</span>
        </div>
        {data.hasProjects && (data.projects || []).map((p, i) => (
          <div key={i} style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-subtle)', marginBottom: 4 }}>Project {i + 1}</div>
            {[
              ['Type', p.projectType === 'in-house' ? 'In-house' : 'External'],
              ['Technical Project', p.isTechnical === true ? 'Yes' : p.isTechnical === false ? 'No' : '—'],
              ['College / Company', p.collegeName || '—'],
              ['Role', p.role || '—'],
              ['Duration', p.duration || '—'],
              ['Title', p.title || '—'],
              ...(p.isTechnical === true ? [
                ['Tech Stack', p.techStack || '—'],
                ['Front-end', p.frontEnd || '—'],
                ['Back-end', p.backEnd || '—'],
                ['Database', p.database || '—'],
                ['Description', p.description || '—'],
              ] : []),
            ].map(([k, v]) => (
              <div key={k} className="preview-row py-1" style={{ borderBottom: '1px dashed var(--border-color)' }}>
                <span className="text-muted-2 small">{k}</span>
                <span className="small text-end">{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Work Experience ── */}
      <div className=" preview card-dark mb-2" style={{ padding: 16 }}>
        <div style={{ color: 'var(--orange)', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><WorkIcon style={{ color: 'var(--brand-orange)', flexShrink: 0 }} />Work Experience</div>
        <div className="preview-row py-1" style={{ borderBottom: '1px dashed var(--border-color)' }}>
          <span className="text-muted-2 small">Has Work Experience</span>
          <span className="small text-end">{data.hasWorkExperience ? 'Yes' : 'No'}</span>
        </div>
        {data.hasWorkExperience && (data.positions || []).map((pos, i) => (
          <div key={i} style={{ marginTop: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-subtle)', marginBottom: 4 }}>Position {i + 1}</div>
            {[
              ['Company', pos.companyName || '—'],
              ['Role', pos.role || '—'],
              ['Duration', pos.duration || '—'],
            ].map(([k, v]) => (
              <div key={k} className="preview-row py-1" style={{ borderBottom: '1px dashed var(--border-color)' }}>
                <span className="text-muted-2 small">{k}</span>
                <span className="small text-end">{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Resume ── */}
      <PreviewSection title="Profile" icon={FiFileText} rows={[
        ['File', formatFile(data.resumeFile)],
      ]} />

      {submitError && (
        <div className="alert-info-dark mb-3" style={{ color: 'var(--danger, #e5484d)' }}>
          {submitError}
        </div>
      )}

      <div className="d-flex justify-content-between mt-3 gap-2">

        <button type="button" className="reg-btn" onClick={onBack} disabled={isSubmitting}>← Back</button>

        <div className="d-flex gap-2">
          <button type="button" className="reg-btn" onClick={handleSaveDraft} disabled={isSavingDraft || isSubmitting}>
            {isSavingDraft ? 'Saving…' : 'Save as Draft'}
          </button>
          <GradientButton onClick={handleSubmit} style={{ maxWidth: 220 }} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit→'}
          </GradientButton>
        </div>


      </div>
    </div>
  );
}

function PreviewSection({ title, rows, icon: Icon }) {
  return (
    <div className="preview card-dark mb-2" style={{ padding: 16 }}>
      <div style={{ color: 'var(--orange)', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && <Icon style={{ color: 'var(--brand-orange)', flexShrink: 0 }} />}
        {title}
      </div>
      {rows.map(([k, v]) => (
        <div key={k} className="preview-row py-1" style={{ borderBottom: '1px dashed var(--border-color)' }}>
          <span className="text-muted-2 small">{k}</span>
          <span className="small text-end">{v}</span>
        </div>
      ))}
    </div>
  );
}


