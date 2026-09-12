import React, { useState, useRef } from 'react';
import {
  MagnifyingGlass,
  Users,
  Folder,
  CaretLeft,
  PencilSimple,
  Trash,
  SortAscending,
  Faders,
  Camera,
  Signature,
  CaretDown,
  WarningCircle,
  CheckCircle,
  X
} from '@phosphor-icons/react';
import { studentApi } from '../../services/api';
import './RegistrationsView.css';

// ── Data ───────────────────────────────────────────────────────────────────

const ORGS = [
  {
    code: 'ACES',
    logo: '/img/orgs/aces.png',
    header: '/img/orgs/aces_header.png',
    programs: [
      { code: 'BSCpE', name: 'Bachelor of Science in Computer Engineering', count: 134 },
      { code: 'DCpET', name: 'Diploma in Computer Engineering Technology', count: 62 },
    ],
  },
  {
    code: 'HRSS',
    logo: '/img/orgs/hrss.png',
    header: '/img/orgs/hrss_header.png',
    programs: [
      { code: 'BSBA-HRM', name: 'BS in Business Administration — Human Resource Management', count: 123 },
    ],
  },
  {
    code: 'IBITS',
    logo: '/img/orgs/ibits.png',
    header: '/img/orgs/ibits_header.png',
    programs: [
      { code: 'BSIT', name: 'Bachelor of Science in Information Technology', count: 156 },
      { code: 'DIT', name: 'Diploma in Information Technology', count: 48 },
    ],
  },
  {
    code: 'PIIE',
    logo: '/img/orgs/piie.png',
    header: '/img/orgs/piie_header.png',
    programs: [
      { code: 'BSIE', name: 'Bachelor of Science in Industrial Engineering', count: 95 },
    ],
  },
  {
    code: 'SMS',
    logo: '/img/orgs/sms.png',
    header: '/img/orgs/sms_header.png',
    programs: [
      { code: 'BSPSY', name: 'Bachelor of Science in Psychology', count: 110 },
    ],
  },
  {
    code: 'YES',
    logo: '/img/orgs/yes.png',
    header: '/img/orgs/yes_header.png',
    programs: [
      { code: 'BSED-ENG', name: 'Bachelor of Secondary Education — English', count: 85 },
      { code: 'BSED-SS', name: 'Bachelor of Secondary Education — Social Studies', count: 76 },
      { code: 'BEED', name: 'Bachelor of Elementary Education', count: 92 },
    ],
  },
];

// Sections per year level for the nav panel
function buildSections(progCode) {
  const base = {
    'BSCpE':    { '1st Year': [{ sec: '1-1', count: 43 }, { sec: '1-2', count: 56 }], '2nd Year': [{ sec: '2-1', count: 38 }], '3rd Year': [{ sec: '3-1', count: 35 }] },
    'DCpET':    { '1st Year': [{ sec: '1-1', count: 32 }, { sec: '1-2', count: 30 }] },
    'BSBA-HRM': { '1st Year': [{ sec: '1-1', count: 40 }, { sec: '1-2', count: 38 }], '2nd Year': [{ sec: '2-1', count: 45 }] },
    'BSIT':     { '1st Year': [{ sec: '1-1', count: 42 }, { sec: '1-2', count: 40 }], '2nd Year': [{ sec: '2-1', count: 38 }, { sec: '2-2', count: 36 }] },
    'DIT':      { '1st Year': [{ sec: '1-1', count: 28 }, { sec: '1-2', count: 20 }] },
    'BSIE':     { '1st Year': [{ sec: '1-1', count: 35 }], '2nd Year': [{ sec: '2-1', count: 30 }], '3rd Year': [{ sec: '3-1', count: 30 }] },
    'BSPSY':    { '1st Year': [{ sec: '1-1', count: 38 }, { sec: '1-2', count: 36 }], '2nd Year': [{ sec: '2-1', count: 36 }] },
    'BSED-ENG': { '1st Year': [{ sec: '1-1', count: 28 }, { sec: '1-2', count: 30 }], '2nd Year': [{ sec: '2-1', count: 27 }] },
    'BSED-SS':  { '1st Year': [{ sec: '1-1', count: 25 }, { sec: '1-2', count: 28 }], '2nd Year': [{ sec: '2-1', count: 23 }] },
    'BEED':     { '1st Year': [{ sec: '1-1', count: 32 }, { sec: '1-2', count: 30 }], '2nd Year': [{ sec: '2-1', count: 30 }] },
  };
  return base[progCode] ?? { '1st Year': [{ sec: '1-1', count: 30 }] };
}

// Enriched sample student list matching canonical model
const INITIAL_STUDENTS = [
  {
    id: '1',
    name: 'Hernandez, John Benedict G.',
    firstName: 'John Benedict',
    middleName: 'G.',
    lastName: 'Hernandez',
    studentNumber: '2022-00218-BN-0',
    email: 'jbhernandez@pup.edu.ph',
    course: 'BSCpE',
    program: 'BSCpE',
    yearLevel: '1st Year',
    section: '1-2',
    org: 'ACES',
    birthdate: '2004-05-15',
    residentialAddress: 'Blk 12 Lot 4 Rose St. Camaya, Mariveles, Bataan',
    emergencyContactName: 'Maria Hernandez',
    emergencyContactNumber: '09171234567',
    emergencyAddress: 'Blk 12 Lot 4 Rose St. Camaya, Mariveles, Bataan',
    time: '1 min ago'
  },
  {
    id: '2',
    name: 'Santos, Maria Nicole T.',
    firstName: 'Maria Nicole',
    middleName: 'T.',
    lastName: 'Santos',
    studentNumber: '2023-00102-BN-0',
    email: 'mnsantos@pup.edu.ph',
    course: 'BSCpE',
    program: 'BSCpE',
    yearLevel: '1st Year',
    section: '1-2',
    org: 'ACES',
    birthdate: '2005-02-20',
    residentialAddress: 'Unit 3B Poblacion Central, Mariveles, Bataan',
    emergencyContactName: 'Roberto Santos',
    emergencyContactNumber: '09189876543',
    emergencyAddress: 'Unit 3B Poblacion Central, Mariveles, Bataan',
    time: '3 min ago'
  },
  {
    id: '3',
    name: 'Fernandez, Christian Gabriel P.',
    firstName: 'Christian Gabriel',
    middleName: 'P.',
    lastName: 'Fernandez',
    studentNumber: '2024-00416-BN-0',
    email: 'cgfernandez@pup.edu.ph',
    course: 'BSCpE',
    program: 'BSCpE',
    yearLevel: '1st Year',
    section: '1-2',
    org: 'ACES',
    birthdate: '2004-11-08',
    residentialAddress: 'Bgy. Baseco Country, Mariveles, Bataan',
    emergencyContactName: 'Gabriel Fernandez',
    emergencyContactNumber: '09201234567',
    emergencyAddress: 'Bgy. Baseco Country, Mariveles, Bataan',
    time: '4 min ago'
  },
  {
    id: '4',
    name: 'Dela Cruz, Rica Joy B.',
    firstName: 'Rica Joy',
    middleName: 'B.',
    lastName: 'Dela Cruz',
    studentNumber: '2022-00055-BN-0',
    email: 'rjdela_cruz@pup.edu.ph',
    course: 'BSCpE',
    program: 'BSCpE',
    yearLevel: '1st Year',
    section: '1-2',
    org: 'ACES',
    birthdate: '2004-08-14',
    residentialAddress: 'Alas-asin, Mariveles, Bataan',
    emergencyContactName: 'Elena Dela Cruz',
    emergencyContactNumber: '09194567890',
    emergencyAddress: 'Alas-asin, Mariveles, Bataan',
    time: '5 min ago'
  },
  {
    id: '5',
    name: 'Reyes, Mark Andrei P.',
    firstName: 'Mark Andrei',
    middleName: 'P.',
    lastName: 'Reyes',
    studentNumber: '2023-00310-BN-0',
    email: 'mareyes@pup.edu.ph',
    course: 'BSCpE',
    program: 'BSCpE',
    yearLevel: '1st Year',
    section: '1-2',
    org: 'ACES',
    birthdate: '2005-01-30',
    residentialAddress: 'Balon Anito, Mariveles, Bataan',
    emergencyContactName: 'Andrei Reyes Sr.',
    emergencyContactNumber: '09228765432',
    emergencyAddress: 'Balon Anito, Mariveles, Bataan',
    time: '7 min ago'
  },
  {
    id: '6',
    name: 'Villanueva, Althea Grace D.',
    firstName: 'Althea Grace',
    middleName: 'D.',
    lastName: 'Villanueva',
    studentNumber: '2024-00331-BN-0',
    email: 'agvillanueva@pup.edu.ph',
    course: 'BSCpE',
    program: 'BSCpE',
    yearLevel: '1st Year',
    section: '1-2',
    org: 'ACES',
    birthdate: '2005-09-12',
    residentialAddress: 'Lucanin, Mariveles, Bataan',
    emergencyContactName: 'Grace Villanueva',
    emergencyContactNumber: '09176543210',
    emergencyAddress: 'Lucanin, Mariveles, Bataan',
    time: '12 min ago'
  },
];

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

function EditStudentModal({ student, onClose, onSave }) {
  const orgs = ['ACES', 'HRSS', 'IBITS', 'PIIE', 'SMS', 'YES'];
  const programs = ['BSCpE', 'BSIT', 'BSBA-HRM', 'BSIE', 'BSPSY', 'BSED-ENG', 'BSED-SS', 'BEED', 'DCpET', 'DIT'];
  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const sections = ['1-1', '1-2', '2-1', '2-2', '3-1', '4-1'];

  const photoInputRef = useRef(null);
  const sigInputRef = useRef(null);

  const [formOrg, setFormOrg] = useState(student.org || 'ACES');
  const [formProg, setFormProg] = useState(student.program || student.course || 'BSCpE');
  const [formYear, setFormYear] = useState(student.yearLevel || '1st Year');
  const [formSection, setFormSection] = useState(student.section?.replace(/^[A-Za-z-]+\s*/, '') || '1-2');

  const [formFirstName, setFormFirstName] = useState(student.firstName || '');
  const [formMiddleName, setFormMiddleName] = useState(student.middleName || '');
  const [formLastName, setFormLastName] = useState(student.lastName || '');
  const [formStudentNumber, setFormStudentNumber] = useState(student.studentNumber || '');
  const [formEmail, setFormEmail] = useState(student.email || '');
  const [formBirthdate, setFormBirthdate] = useState(student.birthdate || '2005-01-01');
  const [formAddress, setFormAddress] = useState(student.residentialAddress || '');

  const [formContactName, setFormContactName] = useState(student.emergencyContactName || '');
  const [formContactNumber, setFormContactNumber] = useState(student.emergencyContactNumber || '');
  const [formContactAddress, setFormContactAddress] = useState(student.emergencyAddress || '');

  const [photoUrl, setPhotoUrl] = useState(student.photoUrl || null);
  const [sigUrl, setSigUrl] = useState(student.signatureUrl || null);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => setPhotoUrl(evt.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSigSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => setSigUrl(evt.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
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
      birthdate: formBirthdate,
      residentialAddress: formAddress,
      emergencyContactName: formContactName,
      emergencyContactNumber: formContactNumber,
      emergencyAddress: formContactAddress,
      photoUrl,
      signatureUrl: sigUrl
    };
    onSave(updated);
    onClose();
  };

  return (
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
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png"
                style={{ display: 'none' }}
                onChange={handlePhotoSelect}
              />
              <button
                type="button"
                className="modal-retake-btn"
                style={{ marginTop: 8 }}
                onClick={() => photoInputRef.current?.click()}
              >
                <Camera size={14} />
                {photoUrl ? 'Replace Photo' : 'Upload Photo'}
              </button>
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
              <input
                ref={sigInputRef}
                type="file"
                accept="image/jpeg,image/png"
                style={{ display: 'none' }}
                onChange={handleSigSelect}
              />
              <button
                type="button"
                className="modal-retake-btn"
                style={{ marginTop: 8 }}
                onClick={() => sigInputRef.current?.click()}
              >
                <Signature size={14} />
                {sigUrl ? 'Replace Signature' : 'Upload Signature'}
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
                    placeholder="202X-XXXXX-BN-X"
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
                  <input
                    type="date"
                    value={formBirthdate}
                    onChange={e => setFormBirthdate(e.target.value)}
                  />
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
              <p className="modal-info-section-title">Emergency Contact Information (Separate Entity)</p>
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
      </div>
    </div>
  );
}

// ── Drilldown View ─────────────────────────────────────────────────────────

function DrilldownView({ org, program, onBack }) {
  const sections = buildSections(program.code);
  const yearLevels = Object.keys(sections);
  const firstSection = sections[yearLevels[0]]?.[0] ?? null;

  const [activeSection, setActiveSection] = useState(firstSection);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [editStudent, setEditStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveStudent = async (updatedRecord) => {
    try {
      await studentApi.update(updatedRecord.id, updatedRecord);
    } catch (_) {}
    setStudents(prev => prev.map(s => s.id === updatedRecord.id ? updatedRecord : s));
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await studentApi.softDelete(studentToDelete.id);
    } catch (_) {}
    setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
    setIsDeleting(false);
    setStudentToDelete(null);
  };

  return (
    <div className="regs-drilldown">
      {/* Breadcrumb title */}
      <h1 className="regs-drilldown-title">
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '2rem', fontWeight: 700, padding: 0, verticalAlign: 'baseline' }}
          aria-label="Back to registrations"
        >
          Registrations
        </button>
        {' '}
        <span>/ {org.code} – {program.code}</span>
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
          {/* Panel header — program info */}
          <div className="regs-student-panel-header">
            <div className="regs-panel-header-left">
              <img src={org.logo} alt={org.code} className="regs-panel-header-logo" />
              <div>
                <div className="regs-panel-program-name">{program.name}</div>
                <div className="regs-panel-section-label">Section: {activeSection?.sec ?? '—'}</div>
              </div>
            </div>
            <img src={org.logo} alt="" style={{ width: 44, height: 44, objectFit: 'contain', opacity: 0.7 }} />
          </div>

          {/* Toolbar */}
          <div className="regs-toolbar">
            <span className="regs-toolbar-title">Registrations ({filtered.length})</span>
            <div className="regs-search-box">
              <MagnifyingGlass size={15} weight="bold" color="rgba(255,255,255,0.3)" />
              <input
                type="text"
                placeholder="Search name or student number..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="regs-sort-btn">
              <SortAscending size={15} />
              Sort by
              <CaretDown size={11} />
            </button>
            <button className="regs-filter-icon-btn" aria-label="Filter options">
              <Faders size={15} />
            </button>
          </div>

          {/* Student list */}
          <div className="regs-student-list">
            {filtered.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: '#A1A1AA', fontSize: '0.85rem' }}>
                No registered students match your search criteria.
              </div>
            ) : (
              filtered.map(student => (
                <div className="regs-student-row" key={student.id}>
                  <AvatarPlaceholder size={52} photoUrl={student.photoUrl} />
                  <div className="regs-student-info">
                    <div className="regs-student-name">{student.name}</div>
                    <div className="regs-student-meta">
                      {student.studentNumber} · {activeSection?.sec ? `${program.code} ${activeSection.sec}` : student.section}
                    </div>
                  </div>
                  <span className="regs-student-time">{student.time}</span>
                  <div className="regs-student-actions">
                    <button
                      className="regs-action-btn edit"
                      aria-label="Edit student"
                      onClick={() => setEditStudent(student)}
                    >
                      <PencilSimple size={14} weight="bold" color="#FFFFFF" />
                    </button>
                    <button
                      className="regs-action-btn delete"
                      aria-label="Delete student"
                      onClick={() => setStudentToDelete(student)}
                    >
                      <Trash size={14} weight="fill" color="#FFFFFF" />
                    </button>
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

      {/* Edit modal */}
      {editStudent && (
        <EditStudentModal
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSave={handleSaveStudent}
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

// ── Top-level: Org Grid ────────────────────────────────────────────────────

export default function RegistrationsView() {
  const [drilldown, setDrilldown] = useState(null); // { org, program }

  if (drilldown) {
    return (
      <DrilldownView
        org={drilldown.org}
        program={drilldown.program}
        onBack={() => setDrilldown(null)}
      />
    );
  }

  return (
    <div className="regs-page">
      <h1 className="regs-page-title">Registrations</h1>

      <div className="regs-org-grid">
        {ORGS.map(org => {
          const totalStudents = org.programs.reduce((acc, p) => acc + p.count, 0);

          return (
            <div
              className="org-card"
              key={org.code}
              onClick={() => setDrilldown({ org, program: org.programs[0] })}
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
                      setDrilldown({ org, program: prog });
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
