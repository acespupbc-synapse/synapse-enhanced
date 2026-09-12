import React, { useState } from 'react';
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
  CaretDown
} from '@phosphor-icons/react';
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

// Sample student list (placeholder — ready for backend)
const SAMPLE_STUDENTS = [
  { id: '1', name: 'Hernandez, John Benedict G.', studentNumber: '2022-00218-BN-0', section: 'BSCpE 1-2', time: '1 min ago' },
  { id: '2', name: 'Santos, Maria Nicole T.', studentNumber: '2023-00102-BN-0', section: 'BSCpE 1-2', time: '3 min ago' },
  { id: '3', name: 'Fernandez, Christian Gabriel P.', studentNumber: '2024-00416-BN-0', section: 'BSCpE 1-2', time: '4 min ago' },
  { id: '4', name: 'Dela Cruz, Rica Joy B.', studentNumber: '2022-00055-BN-0', section: 'BSCpE 1-2', time: '5 min ago' },
  { id: '5', name: 'Reyes, Mark Andrei P.', studentNumber: '2023-00310-BN-0', section: 'BSCpE 1-2', time: '7 min ago' },
  { id: '6', name: 'Villanueva, Althea Grace D.', studentNumber: '2024-00331-BN-0', section: 'BSCpE 1-2', time: '12 min ago' },
];

// ── Student Avatar placeholder ─────────────────────────────────────────────

function AvatarPlaceholder({ size = 52 }) {
  return (
    <div className="regs-student-avatar" style={{ width: size, height: size }}>
      <Users size={size * 0.42} weight="duotone" />
    </div>
  );
}

// ── Edit Student Modal ────────────────────────────────────────────────────

function EditStudentModal({ student, onClose }) {
  const orgs = ['ACES', 'HRSS', 'IBITS', 'PIIE', 'SMS', 'YES'];
  const programs = ['BSCpE', 'BSIT', 'BSBA-HRM', 'BSIE', 'BSPSY', 'BSED-ENG', 'BSED-SS', 'BEED', 'DCpET', 'DIT'];
  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const sections = ['1-1', '1-2', '2-1', '2-2', '3-1', '4-1'];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Edit Student">
      <div className="modal-box">
        <div className="modal-header">
          <PencilSimple size={22} weight="bold" />
          <h2 className="modal-title">Edit Student</h2>
        </div>

        <div className="modal-body">
          {/* Left: Picture & Signature */}
          <div className="modal-left">
            <div>
              <p className="modal-section-label">Picture</p>
              <div className="modal-photo-box">
                <Users size={48} weight="duotone" />
              </div>
              <button className="modal-retake-btn" style={{ marginTop: 8 }}>
                <Camera size={14} />
                Retake Photo
              </button>
            </div>

            <div>
              <p className="modal-section-label">Signature</p>
              <div className="modal-sig-box">
                <span style={{ fontFamily: 'cursive', fontSize: '1.4rem', color: '#333', padding: 8 }}>
                  — — —
                </span>
              </div>
              <button className="modal-retake-btn" style={{ marginTop: 8 }}>
                <Signature size={14} />
                Retake Signature
              </button>
            </div>
          </div>

          {/* Right: Form fields */}
          <div className="modal-right">
            {/* Student Information */}
            <div>
              <p className="modal-info-section-title">Student Information</p>

              {/* Row 1: dropdowns */}
              <div className="modal-field-group cols-4" style={{ marginBottom: 14 }}>
                <div className="modal-field">
                  <label>Organization</label>
                  <select defaultValue="">
                    <option value="" disabled></option>
                    {orgs.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="modal-field">
                  <label>Program</label>
                  <select defaultValue="">
                    <option value="" disabled></option>
                    {programs.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="modal-field">
                  <label>Year Level</label>
                  <select defaultValue="">
                    <option value="" disabled></option>
                    {yearLevels.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div className="modal-field">
                  <label>Section</label>
                  <select defaultValue="">
                    <option value="" disabled></option>
                    {sections.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: name fields */}
              <div className="modal-field-group cols-3" style={{ marginBottom: 14 }}>
                <div className="modal-field">
                  <label>First Name</label>
                  <input type="text" placeholder="" />
                </div>
                <div className="modal-field">
                  <label>Middle Name</label>
                  <input type="text" placeholder="" />
                </div>
                <div className="modal-field">
                  <label>Last Name</label>
                  <input type="text" placeholder="" />
                </div>
              </div>

              {/* Row 3: ID, email, birthdate */}
              <div className="modal-field-group cols-3" style={{ marginBottom: 14 }}>
                <div className="modal-field">
                  <label>Student Number</label>
                  <input type="text" placeholder="" />
                </div>
                <div className="modal-field">
                  <label>Email Address</label>
                  <input type="email" placeholder="" />
                </div>
                <div className="modal-field">
                  <label>Birthdate</label>
                  <input type="date" />
                </div>
              </div>

              {/* Row 4: address */}
              <div className="modal-field-group cols-1">
                <div className="modal-field">
                  <label>Residential Address</label>
                  <input type="text" placeholder="" />
                </div>
              </div>
            </div>

            <div className="modal-divider" />

            {/* Emergency Contact */}
            <div>
              <p className="modal-info-section-title">Emergency Contact Information</p>
              <div className="modal-field-group cols-2" style={{ marginBottom: 14 }}>
                <div className="modal-field">
                  <label>Contact Person</label>
                  <input type="text" placeholder="" />
                </div>
                <div className="modal-field">
                  <label>Contact Person's Number</label>
                  <input type="tel" placeholder="" />
                </div>
              </div>
              <div className="modal-field-group cols-1">
                <div className="modal-field">
                  <label>Contact Person's Address</label>
                  <input type="text" placeholder="" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="modal-btn-save">Save Changes</button>
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
  const [editStudent, setEditStudent] = useState(null);

  const filtered = SAMPLE_STUDENTS.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <span className="regs-toolbar-title">Registrations</span>
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
            {filtered.map(student => (
              <div className="regs-student-row" key={student.id}>
                <AvatarPlaceholder size={52} />
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
                  <button className="regs-action-btn delete" aria-label="Delete student">
                    <Trash size={14} weight="fill" color="#FFFFFF" />
                  </button>
                </div>
              </div>
            ))}
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
        <EditStudentModal student={editStudent} onClose={() => setEditStudent(null)} />
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
        {ORGS.map(org => (
          <div key={org.code} className="org-card">
            {/* Banner */}
            <div
              className="org-card-banner"
              style={{ backgroundImage: `url(${org.header})` }}
            >
              <div className="org-card-banner-overlay" />
              <span className="org-card-banner-name">{org.code}</span>
              <img src={org.logo} alt={org.code} className="org-card-banner-logo" />
            </div>

            {/* Program list */}
            <div className="org-card-body">
              <div className="org-card-label">Available Programs:</div>
              {org.programs.map(prog => (
                <button
                  key={prog.code}
                  className="org-prog-row"
                  onClick={() => setDrilldown({ org, program: prog })}
                >
                  <div className="org-prog-row-left">
                    <Folder size={16} weight="fill" color="rgba(255,255,255,0.5)" />
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
        ))}
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
