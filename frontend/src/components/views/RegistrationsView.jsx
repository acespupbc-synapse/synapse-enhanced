import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MagnifyingGlass,
  Users,
  Folder,
  CaretLeft,
  PencilSimple,
  Trash,
  SortAscending,
  Camera,
  Signature,
  Crop,
  CaretDown,
  WarningCircle,
  CheckCircle,
  X,
  GraduationCap,
  Faders,
  DownloadSimple,
} from '@phosphor-icons/react';
import { studentApi, statsApi, exportApi, programsApi } from '../../services/api';
import { CameraModal, CropperModal, SignatureModal } from '../common/MediaModals';
import Footer from '../common/Footer';
import './RegistrationsView.css';

// ── Data ───────────────────────────────────────────────────────────────────

const ORGS = [
  {
    code: 'ACES',
    name: 'Association of Computer Engineering Students',
    logo: '/img/orgs/aces.png',
    headerImg: '/img/orgs/aces_header.png',
    header: '/img/orgs/aces_header.png',
    color: '#800000',
    programs: [
      { code: 'BSCpE', name: 'Bachelor of Science in Computer Engineering' },
      { code: 'DCpET', name: 'Diploma in Computer Engineering Technology' },
    ],
  },
  {
    code: 'HRSS',
    name: 'Human Resource Students Society',
    logo: '/img/orgs/hrss.png',
    headerImg: '/img/orgs/hrss_header.png',
    header: '/img/orgs/hrss_header.png',
    color: '#c0392b',
    programs: [
      { code: 'BSBA-HRM', name: 'Bachelor of Science in Business Administration Major in Human Resource Management' },
    ],
  },
  {
    code: 'IBITS',
    name: 'Institute of Bachelors in Information Technology Studies',
    logo: '/img/orgs/ibits.png',
    headerImg: '/img/orgs/ibits_header.png',
    header: '/img/orgs/ibits_header.png',
    color: '#058EA3',
    programs: [
      { code: 'BSIT', name: 'Bachelor of Science in Information Technology' },
      { code: 'DIT', name: 'Diploma in Information Technology' },
    ],
  },
  {
    code: 'PIIE',
    name: 'Philippine Institute of Industrial Engineers',
    logo: '/img/orgs/piie.png',
    headerImg: '/img/orgs/piie_header.png',
    header: '/img/orgs/piie_header.png',
    color: '#16AB68',
    programs: [
      { code: 'BSIE', name: 'Bachelor of Science in Industrial Engineering' },
    ],
  },
  {
    code: 'SMS',
    name: 'Samahan ng mga Mag-aaral ng Sikolohiya',
    logo: '/img/orgs/sms.png',
    headerImg: '/img/orgs/sms_header.png',
    header: '/img/orgs/sms_header.png',
    color: '#4F0580',
    programs: [
      { code: 'BSPSY', name: 'Bachelor of Science in Psychology' },
    ],
  },
  {
    code: 'YES',
    name: "Young Educators' Society",
    logo: '/img/orgs/yes.png',
    headerImg: '/img/orgs/yes_header.png',
    header: '/img/orgs/yes_header.png',
    color: '#090979',
    programs: [
      { code: 'BSED-ENG', name: 'Bachelor of Secondary Education Major in English' },
      { code: 'BSED-SS', name: 'Bachelor of Secondary Education Major in Social Studies' },
      { code: 'BEED', name: 'Bachelor of Elementary Education' },
    ],
  },
];

// Sections per year level with dynamic counts from registered students and program database config
function buildSections(progCode, studentList = [], programData = null) {
  const result = {};

  // 1. If programData has sections_detail from the database, group them by year level
  if (programData?.sections_detail && programData.sections_detail.length > 0) {
    for (const secItem of programData.sections_detail) {
      const yearLabel = `${secItem.year_level}${secItem.year_level === 1 ? 'st' : secItem.year_level === 2 ? 'nd' : secItem.year_level === 3 ? 'rd' : 'th'} Year`;
      if (!result[yearLabel]) result[yearLabel] = [];
      if (!result[yearLabel].some(s => s.sec === secItem.name)) {
        result[yearLabel].push({
          sec: secItem.name,
          count: studentList.filter(s => {
            const sSec = s.section || '';
            return sSec === secItem.name || sSec.endsWith(secItem.name) || sSec === `${progCode} ${secItem.name}`;
          }).length
        });
      }
    }
  } else if (programData?.sections && programData.sections.length > 0) {
    for (const secName of programData.sections) {
      const yearNum = parseInt(secName[0], 10) || 1;
      const yearLabel = `${yearNum}${yearNum === 1 ? 'st' : yearNum === 2 ? 'nd' : yearNum === 3 ? 'rd' : 'th'} Year`;
      if (!result[yearLabel]) result[yearLabel] = [];
      if (!result[yearLabel].some(s => s.sec === secName)) {
        result[yearLabel].push({
          sec: secName,
          count: studentList.filter(s => {
            const sSec = s.section || '';
            return sSec === secName || sSec.endsWith(secName) || sSec === `${progCode} ${secName}`;
          }).length
        });
      }
    }
  }

  // 2. Also include any sections found in registered students
  for (const s of studentList) {
    const sSec = (s.section || '').replace(/^[A-Za-z-]+\s*/, '').trim();
    if (!sSec) continue;
    const yearLabel = s.yearLevel || `${sSec[0] || '1'}${sSec[0] === '1' ? 'st' : sSec[0] === '2' ? 'nd' : sSec[0] === '3' ? 'rd' : 'th'} Year`;
    if (!result[yearLabel]) result[yearLabel] = [];
    if (!result[yearLabel].some(item => item.sec === sSec)) {
      result[yearLabel].push({
        sec: sSec,
        count: studentList.filter(st => {
          const stSec = (st.section || '').replace(/^[A-Za-z-]+\s*/, '').trim();
          return stSec === sSec;
        }).length
      });
    }
  }

  // 3. Fallback if still empty
  if (Object.keys(result).length === 0) {
    result['1st Year'] = [{
      sec: '1-1',
      count: studentList.filter(s => (s.section || '').includes('1-1')).length
    }];
  }

  // Sort sections inside each year
  for (const year of Object.keys(result)) {
    result[year].sort((a, b) => a.sec.localeCompare(b.sec, undefined, { numeric: true }));
  }

  return result;
}

// ── Student Avatar placeholder ─────────────────────────────────────────────

function AvatarPlaceholder({ size = 52, photoUrl }) {
  if (photoUrl) {
    return (
      <div className="regs-student-avatar" style={{ width: size, height: size, overflow: 'hidden', borderRadius: '50%' }}>
        <img src={photoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  return (
    <div className="regs-student-avatar" style={{ width: size, height: size }}>
      <Users size={size * 0.42} weight="duotone" />
    </div>
  );
}

// ── Edit Student Modal ────────────────────────────────────────────────────

export function EditStudentModal({ student, onClose, onSave, onShowToast }) {
  const orgs = ['ACES', 'HRSS', 'IBITS', 'PIIE', 'SMS', 'YES'];
  const programs = ['BSCpE', 'BSIT', 'BSBA-HRM', 'BSIE', 'BSPSY', 'BSED-ENG', 'BSED-SS', 'BEED', 'DCpET', 'DIT'];
  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const sections = ['1-1', '1-2', '2-1', '2-2', '3-1', '4-1'];

  const [formOrg, setFormOrg] = useState(student.org || 'ACES');
  const [formProg, setFormProg] = useState(student.program || student.course || 'BSCpE');
  const [formYear, setFormYear] = useState(student.yearLevel || '1st Year');
  const [formSection, setFormSection] = useState(student.section?.replace(/^[A-Za-z-]+\s*/, '') || '1-2');

  const [formFirstName, setFormFirstName] = useState(() => {
    if (student.firstName) return student.firstName;
    if (student.name) {
      if (student.name.includes(',')) {
        return student.name.split(',')[1]?.trim().split(' ')[0] || '';
      }
      return student.name.split(' ')[0] || '';
    }
    return '';
  });
  const [formMiddleName, setFormMiddleName] = useState(() => {
    if (student.middleName) return student.middleName;
    if (student.name) {
      const parts = student.name.replace(/,/g, '').trim().split(/\s+/);
      if (parts.length > 2) return parts[parts.length - 1];
    }
    return '';
  });
  const [formLastName, setFormLastName] = useState(() => {
    if (student.lastName) return student.lastName;
    if (student.name) {
      if (student.name.includes(',')) {
        return student.name.split(',')[0]?.trim() || '';
      }
      const parts = student.name.trim().split(/\s+/);
      return parts[parts.length - 1] || '';
    }
    return '';
  });
  const [formStudentNumber, setFormStudentNumber] = useState(student.studentNumber || '');
  const [formEmail, setFormEmail] = useState(student.email || '');
  const [formAddress, setFormAddress] = useState(student.residentialAddress || '');

  // Separate Month, Day, Year for Birthdate
  const [dobMonth, setDobMonth] = useState(() => {
    if (student.birthdate && student.birthdate.includes('-')) {
      return student.birthdate.split('-')[1] || '01';
    }
    return '01';
  });
  const [dobDay, setDobDay] = useState(() => {
    if (student.birthdate && student.birthdate.includes('-')) {
      return student.birthdate.split('-')[2] || '01';
    }
    return '01';
  });
  const [dobYear, setDobYear] = useState(() => {
    if (student.birthdate && student.birthdate.includes('-')) {
      return student.birthdate.split('-')[0] || '2005';
    }
    return '2005';
  });

  const [formContactName, setFormContactName] = useState(student.emergencyContactName || '');
  const [formContactNumber, setFormContactNumber] = useState(student.emergencyContactNumber || '');
  const [formContactAddress, setFormContactAddress] = useState(student.emergencyAddress || '');

  const [photoUrl, setPhotoUrl] = useState(student.photoUrl || null);
  const [sigUrl, setSigUrl] = useState(student.signatureUrl || null);

  // Modal triggers for Camera, Crop, and Signature
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);

  // Save confirmation prompt state
  const [isConfirmPromptOpen, setIsConfirmPromptOpen] = useState(false);
  const [savedRecord, setSavedRecord] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate days in month
  const daysInMonth = new Date(parseInt(dobYear, 10) || 2005, parseInt(dobMonth, 10) || 1, 0).getDate();

  const handleSave = async () => {
    setIsSaving(true);
    const formattedDob = `${dobYear}-${String(dobMonth).padStart(2, '0')}-${String(dobDay).padStart(2, '0')}`;
    const updated = {
      ...student,
      org: formOrg,
      course: formProg,
      program: formProg,
      yearLevel: formYear,
      section: `${formProg} ${formSection}`,
      firstName: formFirstName.toUpperCase(),
      middleName: formMiddleName.toUpperCase(),
      lastName: formLastName.toUpperCase(),
      name: `${formLastName.toUpperCase()}, ${formFirstName.toUpperCase()} ${formMiddleName ? formMiddleName.toUpperCase() : ''}`.trim(),
      studentNumber: formStudentNumber.toUpperCase(),
      email: formEmail,
      birthdate: formattedDob,
      residentialAddress: formAddress,
      emergencyContactName: formContactName,
      emergencyContactNumber: formContactNumber,
      emergencyAddress: formContactAddress,
      photoUrl,
      signatureUrl: sigUrl
    };

    try {
      if (onSave) {
        await onSave(updated);
      }
      setSavedRecord(updated);
      setIsConfirmPromptOpen(true);
    } catch (err) {
      if (onShowToast) {
        onShowToast(`Failed to save changes: ${err.message || err}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Edit Student">
        <div className="modal-box">
          <div className="modal-header">
            <PencilSimple size={22} weight="bold" />
            <h2 className="modal-title">Edit Student Record</h2>
          </div>

          <div className="modal-body">
            {/* Left: Picture & Signature */}
            <div className="modal-left">
              <div>
                <p className="modal-section-label">Picture</p>
                <div className="modal-photo-box" style={{ overflow: 'hidden' }}>
                  {photoUrl ? (
                    <img src={photoUrl} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Users size={48} weight="duotone" />
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                  <button
                    type="button"
                    className="modal-retake-btn"
                    onClick={() => setIsCameraModalOpen(true)}
                    title="Retake photo using webcam"
                  >
                    <Camera size={14} />
                    Retake
                  </button>
                  <button
                    type="button"
                    className="modal-retake-btn"
                    onClick={() => setIsCropModalOpen(true)}
                    disabled={!photoUrl}
                    title="Crop photo"
                  >
                    <Crop size={14} />
                    Crop Photo
                  </button>
                </div>
              </div>

              <div>
                <p className="modal-section-label">Signature</p>
                <div className="modal-sig-box" style={{ overflow: 'hidden' }}>
                  {sigUrl ? (
                    <img src={sigUrl} alt="Signature" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontFamily: 'cursive', fontSize: '1.4rem', color: '#666', padding: 8 }}>
                      — No Signature —
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="modal-retake-btn"
                  style={{ marginTop: 8 }}
                  onClick={() => setIsSigModalOpen(true)}
                  title="Draw or retake signature"
                >
                  <Signature size={14} />
                  {sigUrl ? 'Retake Signature' : 'Sign Signature'}
                </button>
              </div>
            </div>

            {/* Right: Form fields */}
            <div className="modal-right">
              {/* Student Information */}
              <div>
                <p className="modal-info-section-title">Academic &amp; Personal Information</p>

                {/* Row 1: dropdowns */}
                <div className="modal-field-group cols-4" style={{ marginBottom: 14 }}>
                  <div className="modal-field">
                    <label>Organization</label>
                    <select value={formOrg} onChange={e => setFormOrg(e.target.value)}>
                      {orgs.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="modal-field">
                    <label>Program</label>
                    <select value={formProg} onChange={e => setFormProg(e.target.value)}>
                      {programs.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="modal-field">
                    <label>Year Level</label>
                    <select value={formYear} onChange={e => setFormYear(e.target.value)}>
                      {yearLevels.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="modal-field">
                    <label>Section</label>
                    <select value={formSection} onChange={e => setFormSection(e.target.value)}>
                      {sections.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 2: name fields */}
                <div className="modal-field-group cols-3" style={{ marginBottom: 14 }}>
                  <div className="modal-field">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={formFirstName}
                      onChange={e => setFormFirstName(e.target.value)}
                      placeholder="Given name"
                    />
                  </div>
                  <div className="modal-field">
                    <label>Middle Name</label>
                    <input
                      type="text"
                      value={formMiddleName}
                      onChange={e => setFormMiddleName(e.target.value)}
                      placeholder="Middle name"
                    />
                  </div>
                  <div className="modal-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={formLastName}
                      onChange={e => setFormLastName(e.target.value)}
                      placeholder="Surname"
                    />
                  </div>
                </div>

                {/* Row 3: ID, email, birthdate */}
                <div className="modal-field-group cols-3" style={{ marginBottom: 14 }}>
                  <div className="modal-field">
                    <label>Student Number</label>
                    <input
                      type="text"
                      value={formStudentNumber}
                      onChange={e => setFormStudentNumber(e.target.value)}
                      placeholder="202X-XXXXX-BN-0"
                    />
                  </div>
                  <div className="modal-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      placeholder="student@pup.edu.ph"
                    />
                  </div>
                  <div className="modal-field">
                    <label>Birthdate</label>
                    <div className="modal-bday-grid">
                      <select className="modal-bday-select" value={dobMonth} onChange={e => setDobMonth(e.target.value)}>
                        {[
                          { v: '01', l: 'Jan' }, { v: '02', l: 'Feb' }, { v: '03', l: 'Mar' },
                          { v: '04', l: 'Apr' }, { v: '05', l: 'May' }, { v: '06', l: 'Jun' },
                          { v: '07', l: 'Jul' }, { v: '08', l: 'Aug' }, { v: '09', l: 'Sep' },
                          { v: '10', l: 'Oct' }, { v: '11', l: 'Nov' }, { v: '12', l: 'Dec' }
                        ].map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                      </select>
                      <select className="modal-bday-select" value={dobDay} onChange={e => setDobDay(e.target.value)}>
                        {Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <select className="modal-bday-select" value={dobYear} onChange={e => setDobYear(e.target.value)}>
                        {Array.from({ length: 45 }, (_, i) => String(2015 - i)).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Row 4: address */}
                <div className="modal-field-group cols-1">
                  <div className="modal-field">
                    <label>Residential Address (Maps to PERMSTRT)</label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={e => setFormAddress(e.target.value)}
                      placeholder="Full residential street, brgy, municipality"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-divider" />

              {/* Emergency Contact */}
              <div>
                <p className="modal-info-section-title">Emergency Contact Information</p>
                <div className="modal-field-group cols-2" style={{ marginBottom: 14 }}>
                  <div className="modal-field">
                    <label>Contact Person (CTCTPRSN)</label>
                    <input
                      type="text"
                      value={formContactName}
                      onChange={e => setFormContactName(e.target.value)}
                      placeholder="Guardian / Emergency contact name"
                    />
                  </div>
                  <div className="modal-field">
                    <label>Contact Number (CTCTNMBR)</label>
                    <input
                      type="tel"
                      value={formContactNumber}
                      onChange={e => setFormContactNumber(e.target.value)}
                      placeholder="09XXXXXXXXX"
                    />
                  </div>
                </div>
                <div className="modal-field-group cols-1">
                  <div className="modal-field">
                    <label>Contact Address (CTCTSTRT)</label>
                    <input
                      type="text"
                      value={formContactAddress}
                      onChange={e => setFormContactAddress(e.target.value)}
                      placeholder="Full guardian address"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn-cancel" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button className="modal-btn-save" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {/* Confirmation Prompt Modal */}
          {isConfirmPromptOpen && (
            <div className="modal-prompt-backdrop">
              <div className="modal-prompt-box">
                <div className="modal-prompt-icon">
                  <CheckCircle size={36} weight="fill" color="#10B981" />
                </div>
                <h3 className="modal-prompt-title">Changes Saved Successfully</h3>
                <p className="modal-prompt-desc">
                  Successfully changed and updated record for <strong>{savedRecord?.name}</strong>.
                </p>
                <div className="modal-prompt-actions">
                  <button
                    type="button"
                    className="modal-prompt-ok-btn"
                    onClick={() => {
                      setIsConfirmPromptOpen(false);
                      onClose();
                    }}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shared Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(url) => setPhotoUrl(url)}
      />

      {/* Shared Cropper Modal */}
      <CropperModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={photoUrl}
        onApplyCrop={(url) => setPhotoUrl(url)}
      />

      {/* Shared Signature Drawing Modal */}
      <SignatureModal
        isOpen={isSigModalOpen}
        onClose={() => setIsSigModalOpen(false)}
        onApplySignature={(url) => setSigUrl(url)}
      />
    </>
  );
}

// ── Drilldown View ─────────────────────────────────────────────────────────

function DrilldownView({ org, program, onBack, onShowToast, stats }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editStudent, setEditStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeSection, setActiveSection] = useState({ sec: 'All', count: 0 });

  const sections = buildSections(program.code, students, program);
  const yearLevels = Object.keys(sections);

  useEffect(() => {
    setIsLoading(true);
    studentApi.getAll({ program: program.code })
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((s) => ({
            id: s.id,
            name: `${s.last_name}, ${s.first_name} ${s.middle_name || ''}`.trim(),
            firstName: s.first_name,
            middleName: s.middle_name || '',
            lastName: s.last_name,
            studentNumber: s.student_number,
            email: s.email,
            course: s.course_code || program.code,
            program: s.course_code || program.code,
            yearLevel: s.year_level ? `${s.year_level}${s.year_level === 1 ? 'st' : s.year_level === 2 ? 'nd' : s.year_level === 3 ? 'rd' : 'th'} Year` : '1st Year',
            section: s.section_name || '1-1',
            org: s.organization || org?.code || 'ACES',
            gender: s.gender || 'Male',
            birthdate: s.birth_date || '',
            residentialAddress: s.perm_strt || '',
            emergencyContactName: s.contact_person_name || '',
            emergencyContactNumber: s.contact_person_number || '',
            emergencyAddress: s.perm_strt || '',
            photoUrl: s.photo_url || null,
            signatureUrl: s.signature_url || null,
            createdAt: s.created_at || null,
            time: s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recently'
          }));
          setStudents(mapped);
          const computedSections = buildSections(program.code, mapped, program);
          const firstYr = Object.keys(computedSections)[0];
          const initialSec = computedSections[firstYr]?.[0] || { sec: '1-1', count: 0 };
          setActiveSection(initialSec);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [program.code, org?.code]);

  // Sorting state (strictly 4 options)
  const [sortBy, setSortBy] = useState('name-asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const sortLabels = {
    'name-asc': 'Name (A to Z)',
    'name-desc': 'Name (Z to A)',
    'recent': 'Recent First',
    'oldest': 'Oldest First'
  };

  const handleSectionExport = async (format) => {
    const secParam = activeSection?.sec !== 'All' ? activeSection.sec : undefined;
    const ayStr = stats?.ayName?.replace(/^AY\s*/i, '').trim() || '2026-2027';
    const filter = { program: program.code, section: secParam, academicYear: ayStr };
    const label = secParam ? `${program.code} (${secParam})` : program.code;

    let finished = false;

    // Stage 1: Compiling
    if (onShowToast) {
      onShowToast(`Compiling ${format.toUpperCase()} for ${label}...`, { loading: true });
    }

    // Stage 2: Exporting (if operation takes > 700ms)
    const stageTimer = setTimeout(() => {
      if (!finished && onShowToast) {
        onShowToast(`Exporting ${format.toUpperCase()} for ${label}...`, { loading: true });
      }
    }, 700);

    try {
      if (format === 'csv') await exportApi.downloadCsv(filter);
      else if (format === 'xlsx') await exportApi.downloadXlsx(filter);
      else if (format === 'pdf') await exportApi.downloadPdf(filter);
      else if (format === 'mdb') await exportApi.downloadMdb(filter);

      finished = true;
      clearTimeout(stageTimer);

      if (onShowToast) {
        onShowToast(`${format.toUpperCase()} export downloaded for ${label}.`);
      }
    } catch (err) {
      finished = true;
      clearTimeout(stageTimer);
      if (onShowToast) {
        onShowToast(`Export error: ${err.message || 'Export failed'}`);
      }
    }
  };

  const filtered = students.filter(s => {
    const matchesSearch =
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection =
      !activeSection ||
      s.section === activeSection.sec ||
      s.section?.endsWith(activeSection.sec) ||
      s.section === `${program.code} ${activeSection.sec}`;
    return matchesSearch && matchesSection;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
    if (sortBy === 'recent') {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    }
    if (sortBy === 'oldest') {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    }
    return 0;
  });

  const handleSaveStudent = async (updatedRecord) => {
    try {
      await studentApi.update(updatedRecord.id, updatedRecord);
    } catch (_) {}
    setStudents(prev => prev.map(s => s.id === updatedRecord.id ? updatedRecord : s));
    if (onShowToast) {
      onShowToast(`Student record for ${updatedRecord.name} updated successfully.`);
    }
    setEditStudent(null);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await studentApi.softDelete(studentToDelete.id);
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      if (onShowToast) {
        onShowToast(`Student ${studentToDelete.name} moved to Recycle Bin.`);
      }
    } catch (_) {}
    setIsDeleting(false);
    setStudentToDelete(null);
  };
  const handleConfirmDelete = handleDeleteConfirm;

  return (
    <div className="regs-drilldown">
      {/* Breadcrumb title */}
      <h1 className="regs-drilldown-title">
        <button
          type="button"
          onClick={onBack}
          className="regs-breadcrumb-back"
          aria-label="Back to registrations"
        >
          Registrations
        </button>
        {' '}
        <span className="regs-breadcrumb-current">
          / {org?.code || 'ACES'} - {program.code}
        </span>
      </h1>

      <div className="regs-drilldown-body">
        {/* Left: Navigation Panel */}
        <nav className="regs-nav-panel" aria-label="Section navigation">
          <div className="regs-nav-panel-title">Navigation Panel</div>
          {yearLevels.map(year => (
            <React.Fragment key={year}>
              <div className="regs-nav-year-label">{year}</div>
              {sections[year].map(sec => (
                <button
                  key={sec.sec}
                  className={`regs-section-btn ${activeSection?.sec === sec.sec ? 'active' : ''}`}
                  onClick={() => setActiveSection(sec)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Folder size={14} weight="fill" />
                    {sec.sec}
                  </div>
                  <span className="regs-section-count">
                    <Users size={11} weight="fill" />
                    {sec.count}
                  </span>
                </button>
              ))}
            </React.Fragment>
          ))}
        </nav>

        {/* Right: Student list */}
        <div className="regs-student-panel">
          {/* Panel header — program info with dynamic org header */}
          <div
            className="regs-student-panel-header"
            style={{ backgroundImage: (org?.header || org?.headerImg) ? `url(${org.header || org.headerImg})` : 'none' }}
          >
            <div className="regs-panel-header-left">
              <GraduationCap size={36} weight="fill" color="#FFFFFF" style={{ flexShrink: 0 }} />
              <div>
                <div className="regs-panel-program-name">{program.name}</div>
                <div className="regs-panel-section-label">Section: {activeSection?.sec ?? '1-1'}</div>
              </div>
            </div>
            {org?.logo && (
              <div className="regs-panel-header-right">
                <img src={org.logo} alt={org.code} className="regs-panel-header-logo-badge" />
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="regs-toolbar">
            <span className="regs-toolbar-title">Registrations ({sorted.length})</span>
            <div className="regs-search-box">
              <MagnifyingGlass size={15} weight="bold" color="rgba(255,255,255,0.3)" />
              <input
                type="text"
                placeholder="Search name or student number..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Sort by custom dropdown (strictly 4 options) */}
            <div className="regs-sort-wrapper" style={{ position: 'relative' }}>
              <button
                type="button"
                className="regs-sort-btn"
                onClick={() => setShowSortMenu(prev => !prev)}
                aria-expanded={showSortMenu}
              >
                <SortAscending size={15} />
                <span>Sort: {sortLabels[sortBy] || 'Name (A to Z)'}</span>
                <CaretDown size={11} />
              </button>

              {showSortMenu && (
                <div className="regs-sort-dropdown-menu">
                  {Object.entries(sortLabels).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={`regs-sort-menu-item ${sortBy === key ? 'active' : ''}`}
                      onClick={() => {
                        setSortBy(key);
                        setShowSortMenu(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export dropdown */}
            <div className="regs-export-wrapper" style={{ position: 'relative' }}>
              <button
                type="button"
                className="regs-export-btn"
                onClick={() => setShowExportMenu(prev => !prev)}
                aria-expanded={showExportMenu}
                title="Export this section's student records"
              >
                <DownloadSimple size={15} />
                <span>Export</span>
                <CaretDown size={11} />
              </button>

              {showExportMenu && (
                <div className="regs-export-dropdown-menu">
                  <button
                    type="button"
                    className="regs-export-menu-item"
                    onClick={() => {
                      handleSectionExport('csv');
                      setShowExportMenu(false);
                    }}
                  >
                    Export as CSV
                  </button>
                  <button
                    type="button"
                    className="regs-export-menu-item"
                    onClick={() => {
                      handleSectionExport('mdb');
                      setShowExportMenu(false);
                    }}
                  >
                    Export as MDB
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Student list */}
          <div className="regs-student-list">
            {sorted.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: '#A1A1AA', fontSize: '0.85rem' }}>
                No student registrations found matching your query.
              </div>
            ) : (
              sorted.map(student => (
                <div className="regs-student-row" key={student.id}>
                  <AvatarPlaceholder size={44} photoUrl={student.photoUrl} />

                  <div className="regs-student-info">
                    <div className="regs-student-name">{student.name}</div>
                    <div className="regs-student-meta-item">{student.studentNumber}</div>
                    <div className="regs-student-meta-item">
                      {(student.program || program.code).toUpperCase()} {student.section}
                    </div>
                  </div>

                  <div className="regs-student-right-col">
                    <div className="regs-student-time">{student.time || '1 min ago'}</div>
                    <div className="regs-student-actions">
                      <button
                        type="button"
                        className="regs-action-btn edit"
                        onClick={() => setEditStudent(student)}
                        title="Edit student record"
                      >
                        <PencilSimple size={15} weight="bold" color="#FFFFFF" />
                      </button>
                      <button
                        type="button"
                        className="regs-action-btn delete"
                        onClick={() => setStudentToDelete(student)}
                        title="Move to recycle bin"
                      >
                        <Trash size={15} weight="bold" color="#FFFFFF" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Edit Student Modal */}
      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSave={handleSaveStudent}
          onShowToast={onShowToast}
        />
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div style={{
            background: '#140A0A',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 14,
            padding: 24,
            maxWidth: 420,
            width: '90%',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#EF4444' }}>
              <WarningCircle size={24} weight="bold" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>Move Record to Recycle Bin?</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#D1D5DB', lineHeight: 1.5 }}>
              Are you sure you want to soft-delete <strong>{studentToDelete.name}</strong> ({studentToDelete.studentNumber})? This record can be restored from the Recycle Bin later.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setStudentToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  background: '#EF4444',
                  color: '#FFFFFF',
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
              >
                {isDeleting ? 'Moving…' : 'Move to Recycle Bin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegistrationsView({ initialProgramCode, onShowToast, stats }) {
  const navigate = useNavigate();
  const params = useParams();
  // Pin the last known-good stats to avoid parent re-renders with stale empty data
  // blanking the program counts (Bug 18 fix)
  const [liveStats, setLiveStats] = useState(stats || null);
  const [dbPrograms, setDbPrograms] = useState([]);
  const pinnedCountsRef = React.useRef({});

  useEffect(() => {
    statsApi.getDashboardStats().then(data => {
      if (data) {
        setLiveStats(data);
        if (Object.keys(data.programCounts ?? {}).length > 0) {
          pinnedCountsRef.current = data.programCounts;
        }
      }
    }).catch(() => {});

    programsApi.getAll().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setDbPrograms(data);
      }
    }).catch(() => {});
  }, []);

  // Use liveStats if available, fall back to prop — but always keep last non-empty programCounts
  const rawProgCounts = (liveStats ?? stats)?.programCounts ?? {};
  if (Object.keys(rawProgCounts).length > 0) {
    pinnedCountsRef.current = rawProgCounts;
  }
  const progCounts = pinnedCountsRef.current;

  const dynamicOrgs = ORGS.map(org => {
    const orgDbProgs = dbPrograms.filter(p => p.org.toUpperCase() === org.code.toUpperCase());
    const baseProgs = orgDbProgs.length > 0
      ? orgDbProgs.map(p => ({
          code: p.code,
          name: p.name,
          sections: p.sections || [],
          sections_detail: p.sections_detail || [],
        }))
      : org.programs;

    return {
      ...org,
      programs: baseProgs.map(prog => ({
        ...prog,
        count: progCounts[prog.code] ?? progCounts[prog.code.toUpperCase()] ?? 0
      }))
    };
  });

  const targetProgramCode = params.programCode || initialProgramCode;
  const targetOrgCode = params.orgCode;

  let drilldown = null;
  if (targetProgramCode) {
    const codeUpper = targetProgramCode.toUpperCase();
    for (const org of dynamicOrgs) {
      if (targetOrgCode && org.code.toUpperCase() !== targetOrgCode.toUpperCase()) {
        continue;
      }
      const found = org.programs.find(p => p.code.toUpperCase() === codeUpper);
      if (found) {
        drilldown = { org, program: found };
        break;
      }
    }
    if (!drilldown) {
      for (const org of dynamicOrgs) {
        const found = org.programs.find(p => p.code.toUpperCase() === codeUpper);
        if (found) {
          drilldown = { org, program: found };
          break;
        }
      }
    }
  }

  if (drilldown) {
    return (
      <DrilldownView
        org={drilldown.org}
        program={drilldown.program}
        onBack={() => navigate('/registrations')}
        onShowToast={onShowToast}
        stats={liveStats ?? stats}
      />
    );
  }

  return (
    <div className="regs-page">
      <h1 className="regs-page-title">Registrations</h1>

      <div className="regs-org-grid">
        {dynamicOrgs.map(org => {
          const totalStudents = org.programs.reduce((acc, p) => acc + p.count, 0);

          return (
            <div
              className="org-card"
              key={org.code}
              onClick={() => navigate(`/registrations/${org.code}/${org.programs[0]?.code || 'ALL'}`)}
            >
              {/* Org Header Banner */}
              <div
                className="org-card-banner"
                style={{ backgroundImage: `url(${org.header || org.headerImg})` }}
              >
                <div className="org-card-banner-overlay" />
                <span className="org-card-banner-name">{org.code}</span>
                <img
                  src={org.logo}
                  alt={`${org.code} logo`}
                  className="org-card-banner-logo"
                />
              </div>

              {/* Org Body */}
              <div className="org-card-body">
                <div className="org-card-label">ACADEMIC PROGRAMS</div>
                {org.programs.map(prog => (
                  <button
                    key={prog.code}
                    type="button"
                    className="org-prog-row"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/registrations/${org.code}/${prog.code}`);
                    }}
                  >
                    <div className="org-prog-row-left">
                      <span className="org-prog-code">{prog.code}</span>
                    </div>
                    <span className="org-prog-count">
                      <Users size={12} weight="fill" />
                      {prog.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
