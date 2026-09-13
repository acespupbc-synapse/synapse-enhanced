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
  FileCsv,
  FileText,
  FilePdf,
} from '@phosphor-icons/react';
import { studentApi, statsApi, exportApi } from '../../services/api';
import { CameraModal, CropperModal, SignatureModal } from '../common/MediaModals';
import './RegistrationsView.css';

// ── Data ───────────────────────────────────────────────────────────────────

const ORGS = [
  {
    code: 'ACES',
    logo: '/img/orgs/aces.png',
    header: '/img/orgs/aces_header.png',
    programs: [
      { code: 'BSCpE', name: 'Bachelor of Science in Computer Engineering', count: 0 },
      { code: 'DCpET', name: 'Diploma in Computer Engineering Technology', count: 0 },
    ],
  },
  {
    code: 'HRSS',
    logo: '/img/orgs/hrss.png',
    header: '/img/orgs/hrss_header.png',
    programs: [
      { code: 'BSBA-HRM', name: 'BS in Business Administration — Human Resource Management', count: 0 },
    ],
  },
  {
    code: 'IBITS',
    logo: '/img/orgs/ibits.png',
    header: '/img/orgs/ibits_header.png',
    programs: [
      { code: 'BSIT', name: 'Bachelor of Science in Information Technology', count: 0 },
      { code: 'DIT', name: 'Diploma in Information Technology', count: 0 },
    ],
  },
  {
    code: 'PIIE',
    logo: '/img/orgs/piie.png',
    header: '/img/orgs/piie_header.png',
    programs: [
      { code: 'BSIE', name: 'Bachelor of Science in Industrial Engineering', count: 0 },
    ],
  },
  {
    code: 'SMS',
    logo: '/img/orgs/sms.png',
    header: '/img/orgs/sms_header.png',
    programs: [
      { code: 'BSPSY', name: 'Bachelor of Science in Psychology', count: 0 },
    ],
  },
  {
    code: 'YES',
    logo: '/img/orgs/yes.png',
    header: '/img/orgs/yes_header.png',
    programs: [
      { code: 'BSED-ENG', name: 'Bachelor of Secondary Education — English', count: 0 },
      { code: 'BSED-SS', name: 'Bachelor of Secondary Education — Social Studies', count: 0 },
      { code: 'BEED', name: 'Bachelor of Elementary Education', count: 0 },
    ],
  },
];

// Sections per year level with dynamic counts from registered students
function buildSections(progCode, studentList = []) {
  const baseSections = {
    'BSCpE':    { '1st Year': ['1-1', '1-2'], '2nd Year': ['2-1'], '3rd Year': ['3-1'] },
    'DCpET':    { '1st Year': ['1-1', '1-2'] },
    'BSBA-HRM': { '1st Year': ['1-1', '1-2'], '2nd Year': ['2-1'] },
    'BSIT':     { '1st Year': ['1-1', '1-2'], '2nd Year': ['2-1', '2-2'] },
    'DIT':      { '1st Year': ['1-1', '1-2'] },
    'BSIE':     { '1st Year': ['1-1'], '2nd Year': ['2-1'], '3rd Year': ['3-1'] },
    'BSPSY':    { '1st Year': ['1-1', '1-2'], '2nd Year': ['2-1'] },
    'BSED-ENG': { '1st Year': ['1-1', '1-2'], '2nd Year': ['2-1'] },
    'BSED-SS':  { '1st Year': ['1-1', '1-2'], '2nd Year': ['2-1'] },
    'BEED':     { '1st Year': ['1-1', '1-2'], '2nd Year': ['2-1'] },
  };

  const template = baseSections[progCode] ?? { '1st Year': ['1-1'] };
  const result = {};

  for (const [year, secs] of Object.entries(template)) {
    result[year] = secs.map(sec => ({
      sec,
      count: studentList.filter(s => {
        const sSec = s.section || '';
        return sSec === sec || sSec.endsWith(sec) || sSec === `${progCode} ${sec}`;
      }).length
    }));
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

  // Calculate days in month
  const daysInMonth = new Date(parseInt(dobYear, 10) || 2005, parseInt(dobMonth, 10) || 1, 0).getDate();

  const handleSave = () => {
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
    setSavedRecord(updated);
    setIsConfirmPromptOpen(true);
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
            <button className="modal-btn-cancel" onClick={onClose}>Cancel</button>
            <button className="modal-btn-save" onClick={handleSave}>Save Changes</button>
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
                      onSave(savedRecord);
                      if (onShowToast) {
                        onShowToast(`Student record for ${savedRecord?.name} successfully updated!`);
                      }
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

function DrilldownView({ org, program, onBack, onShowToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editStudent, setEditStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeSection, setActiveSection] = useState({ sec: 'All', count: 0 });

  const sections = buildSections(program.code, students);
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
            status: s.status || 'PENDING',
            createdAt: s.created_at || null,
            time: s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recently'
          }));
          setStudents(mapped);
          setActiveSection({ sec: 'All', count: mapped.length });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [program.code, org?.code]);

  // Sorting state (strictly 4 options)
  const [sortBy, setSortBy] = useState('name-asc');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortLabels = {
    'name-asc': 'Name (A to Z)',
    'name-desc': 'Name (Z to A)',
    'recent': 'Recent First',
    'oldest': 'Oldest First'
  };

  const handleSectionExport = async (format) => {
    const secParam = activeSection?.sec !== 'All' ? activeSection.sec : undefined;
    const filter = { program: program.code, section: secParam };
    const label = secParam ? `${program.code} (${secParam})` : program.code;

    if (onShowToast) {
      onShowToast(`Generating ${format.toUpperCase()} export for ${label}...`);
    }

    try {
      let ok = false;
      if (format === 'csv') ok = await exportApi.downloadCsv(filter);
      else if (format === 'xlsx') ok = await exportApi.downloadXlsx(filter);
      else if (format === 'pdf') ok = await exportApi.downloadPdf(filter);

      if (ok && onShowToast) {
        onShowToast(`${format.toUpperCase()} export downloaded for ${label}.`);
      } else if (!ok && onShowToast) {
        onShowToast(`No records found or export failed for ${label}.`);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(`Export error: ${err.message}`);
      }
    }
  };

  const filtered = students.filter(s => {
    const matchesSearch =
      (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection =
      !activeSection ||
      activeSection.sec === 'All' ||
      s.section === activeSection.sec ||
      s.section?.endsWith(activeSection.sec);
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

  return (
    <div className="regs-drilldown-page">
      {/* Top breadcrumb navigation */}
      <div className="regs-drilldown-header">
        <button
          type="button"
          className="regs-back-btn"
          onClick={onBack}
          title="Back to Organizations"
        >
          <CaretLeft size={16} weight="bold" />
          <span>Organizations</span>
        </button>
        <span className="regs-drilldown-sep">/</span>
        <span className="regs-drilldown-org">{org?.code || 'PUPBC'}</span>
        <span className="regs-drilldown-sep">/</span>
        <h2 className="regs-drilldown-title">
          {program.code} <span>— {program.name}</span>
        </h2>
      </div>

      <div className="regs-drilldown-body">
        {/* Left: Section navigation */}
        <nav className="regs-nav-panel" aria-label="Section Navigation">
          <div className="regs-nav-panel-title">Sections</div>

          {/* All sections button */}
          <button
            className={`regs-section-btn ${activeSection?.sec === 'All' ? 'active' : ''}`}
            onClick={() => setActiveSection({ sec: 'All', count: students.length })}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Folder size={14} weight="fill" />
              All Sections
            </div>
            <span className="regs-section-count">
              <Users size={11} weight="fill" />
              {students.length}
            </span>
          </button>

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
            style={{ backgroundImage: org?.header ? `url(${org.header})` : 'none' }}
          >
            <div className="regs-panel-header-left">
              <GraduationCap size={40} weight="fill" color="#FFFFFF" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="regs-program-code-pill">{program.code}</span>
                  <span className="regs-program-org-pill">{org?.code || 'PUPBC'}</span>
                </div>
                <div className="regs-panel-program-name">{program.name}</div>
                <div className="regs-panel-section-label">
                  Section: <strong>{activeSection?.sec === 'All' ? 'All Sections' : activeSection?.sec}</strong> ({sorted.length} enrolled)
                </div>
              </div>
            </div>
            <div className="regs-panel-header-right">
              {org?.logo && <img src={org.logo} alt={org.code} className="regs-panel-header-logo-badge" />}
            </div>
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

            {/* Section Export Action Buttons */}
            <div className="regs-export-group">
              <button
                type="button"
                className="btn-regs-export btn-export-csv"
                title={`Export ${activeSection?.sec !== 'All' ? activeSection?.sec : 'All'} as CardFive MDB CSV`}
                onClick={() => handleSectionExport('csv')}
              >
                <FileCsv size={15} weight="bold" />
                <span>MDB CSV</span>
              </button>
              <button
                type="button"
                className="btn-regs-export btn-export-xlsx"
                title={`Export ${activeSection?.sec !== 'All' ? activeSection?.sec : 'All'} as Excel XLSX`}
                onClick={() => handleSectionExport('xlsx')}
              >
                <FileText size={15} weight="bold" />
                <span>Excel</span>
              </button>
              <button
                type="button"
                className="btn-regs-export btn-export-pdf"
                title={`Export ${activeSection?.sec !== 'All' ? activeSection?.sec : 'All'} as PDF Report`}
                onClick={() => handleSectionExport('pdf')}
              >
                <FilePdf size={15} weight="bold" />
                <span>PDF</span>
              </button>
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
      <footer className="page-footer">
        <div className="page-footer-left">
          <span className="page-footer-brand">© 2026 ACES-PUPBC Synapse</span>
          <span className="version-badge-sm" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: '0.6rem', color: '#A1A1AA', fontFamily: 'monospace' }}>v2.1.2</span>
          <span className="page-footer-sub">For campus use only. Compliant with Data Privacy Act of 2012 (RA 10173).</span>
        </div>
        <div className="page-footer-right">
          <a href="#" className="page-footer-link">Developed by JB Hernandez</a>
          <span className="page-footer-divider">|</span>
          <a href="#" className="page-footer-link">Support</a>
          <span className="page-footer-divider">|</span>
          <a href="#" className="page-footer-link">Facebook</a>
        </div>
      </footer>

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
                onClick={handleConfirmDelete}
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
  const [liveStats, setLiveStats] = useState(stats || null);

  useEffect(() => {
    statsApi.getDashboardStats().then(data => {
      if (data) setLiveStats(data);
    }).catch(() => {});
  }, []);

  const progCounts = liveStats?.programCounts || stats?.programCounts || {};

  const dynamicOrgs = ORGS.map(org => ({
    ...org,
    programs: org.programs.map(prog => ({
      ...prog,
      count: progCounts[prog.code] ?? progCounts[prog.code.toUpperCase()] ?? 0
    }))
  }));

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
                style={{ backgroundImage: `url(${org.header})` }}
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
      <footer className="page-footer">
        <div className="page-footer-left">
          <span className="page-footer-brand">© 2026 ACES-PUPBC Synapse</span>
          <span className="version-badge-sm" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: '0.6rem', color: '#A1A1AA', fontFamily: 'monospace' }}>v2.1.2</span>
          <span className="page-footer-sub">For campus use only. Compliant with Data Privacy Act of 2012 (RA 10173).</span>
        </div>
        <div className="page-footer-right">
          <a href="#" className="page-footer-link">Developed by JB Hernandez</a>
          <span className="page-footer-divider">|</span>
          <a href="#" className="page-footer-link">Support</a>
          <span className="page-footer-divider">|</span>
          <a href="#" className="page-footer-link">Facebook</a>
        </div>
      </footer>
    </div>
  );
}
