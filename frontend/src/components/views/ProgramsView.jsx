import React, { useState, useEffect, useRef } from 'react';
import { Plus, PencilSimple, Trash, CaretDown, X } from '@phosphor-icons/react';
import { programsApi } from '../../services/api';
import Footer from '../common/Footer';
import './ProgramsView.css';


// ── Program data (realistic placeholder, ready for backend) ────────────────

const ORG_OPTIONS = ['ACES', 'HRSS', 'IBITS', 'PIIE', 'SMS', 'YES'];

const ORG_LOGOS = {
  ACES:  '/img/orgs/aces.png',
  HRSS:  '/img/orgs/hrss.png',
  IBITS: '/img/orgs/ibits.png',
  PIIE:  '/img/orgs/piie.png',
  SMS:   '/img/orgs/sms.png',
  YES:   '/img/orgs/yes.png',
};

// ── Edit / Add Program Modal ───────────────────────────────────────────────

function ProgramModal({ program, onClose, onSave }) {
  const isNew = !program?.id;

  const [formOrg,  setFormOrg]  = useState(program?.org  ?? '');
  const [formCode, setFormCode] = useState(program?.code ?? '');
  const [formName, setFormName] = useState(program?.name ?? '');

  const handleSave = () => {
    if (!formOrg || !formCode.trim() || !formName.trim()) return;
    onSave({
      id:   program?.id ?? String(Date.now()),
      org:  formOrg,
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
    });
    onClose();
  };

  return (
    <div className="prog-modal-overlay" role="dialog" aria-modal="true" aria-label={isNew ? 'Add Program' : 'Edit Program'}>
      <div className="prog-modal-box">
        {/* Header */}
        <div className="prog-modal-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PencilSimple size={20} weight="bold" />
            <h2 className="prog-modal-title">{isNew ? 'Add Program' : 'Edit Program'}</h2>
          </div>
          <button
            type="button"
            className="prog-modal-close-icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Form */}
        <div className="prog-modal-body">
          <div className="prog-modal-field">
            <label>Organization</label>
            <select value={formOrg} onChange={e => setFormOrg(e.target.value)}>
              <option value="" disabled>Select org…</option>
              {ORG_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div className="prog-modal-field">
            <label>Program Code</label>
            <input
              type="text"
              value={formCode}
              onChange={e => setFormCode(e.target.value)}
              placeholder="e.g. BSCpE"
              maxLength={20}
            />
          </div>

          <div className="prog-modal-field">
            <label>Program Name</label>
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="Full program name…"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="prog-modal-footer">
          <button className="prog-modal-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="prog-modal-btn-save"
            onClick={handleSave}
            disabled={!formOrg || !formCode.trim() || !formName.trim()}
          >
            {isNew ? 'Add Program' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Section Modal ─────────────────────────────────────────────────────

function EditSectionModal({ sectionData, programs, onClose, onUpdated, onDeleted }) {
  const { section, program } = sectionData;
  const [courseCode, setCourseCode] = useState(program?.code || programs[0]?.code || 'BSCpE');

  const yearOptions = [
    { label: '1ST YEAR', value: 1 },
    { label: '2ND YEAR', value: 2 },
    { label: '3RD YEAR', value: 3 },
    { label: '4TH YEAR', value: 4 },
    { label: '5TH YEAR', value: 5 },
  ];

  const initialYear = Number(section?.year_level) || (parseInt(section?.name?.[0]) || 1);
  const [yearLevel, setYearLevel] = useState(initialYear);
  const [sectionName, setSectionName] = useState(section?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async () => {
    if (!sectionName.trim()) {
      setErrorMsg('Please enter a section name.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      if (section?.id) {
        await programsApi.updateSection(section.id, {
          program_code: courseCode,
          year_level: Number(yearLevel),
          name: sectionName.trim(),
        });
      }
      onUpdated();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update section.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setErrorMsg('');
    setIsDeleting(true);
    try {
      if (!section?.id) {
        throw new Error('Cannot delete section: Section ID is missing. Please refresh.');
      }
      await programsApi.deleteSection(section.id);
      onDeleted();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete section.');
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="prog-modal-overlay" role="dialog" aria-modal="true" aria-label="Edit Section">
      <div className="prog-modal-box">
        {/* Header matching user reference */}
        <div className="prog-modal-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PencilSimple size={20} weight="bold" />
            <h2 className="prog-modal-title">Edit Section</h2>
          </div>
          <button
            type="button"
            className="prog-modal-close-icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(220, 38, 38, 0.2)', border: '1px solid #DC2626', color: '#FCA5A5', padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem', marginBottom: 14 }}>
            {errorMsg}
          </div>
        )}

        <div className="prog-modal-body">
          {/* Field 1: Course */}
          <div className="prog-modal-field">
            <label>Course</label>
            <select value={courseCode} onChange={e => setCourseCode(e.target.value)}>
              {programs.map(p => (
                <option key={p.code} value={p.code}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Field 2: Year Level */}
          <div className="prog-modal-field">
            <label>Year Level</label>
            <select value={yearLevel} onChange={e => setYearLevel(Number(e.target.value))}>
              {yearOptions.map(y => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>

          {/* Field 3: Section Name */}
          <div className="prog-modal-field">
            <label>Section Name</label>
            <input
              type="text"
              value={sectionName}
              onChange={e => {
                setSectionName(e.target.value);
                if (confirmDelete) setConfirmDelete(false);
              }}
              placeholder="e.g. 1-1"
              maxLength={15}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="prog-modal-footer edit-sec-footer">
          <button
            type="button"
            className="prog-modal-btn-delete"
            onClick={handleDelete}
            disabled={isDeleting || isSubmitting}
          >
            {isDeleting ? 'Deleting...' : confirmDelete ? 'Confirm Delete?' : 'Delete'}
          </button>
          <div className="edit-sec-footer-right">
            <button
              type="button"
              className="prog-modal-btn-cancel"
              onClick={onClose}
              disabled={isSubmitting || isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="prog-modal-btn-save"
              onClick={handleSave}
              disabled={isSubmitting || isDeleting || !sectionName.trim()}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Section Modal (Bug 11) ───────────────────────────────────────────

function AddSectionModal({ programs, onClose, onSectionCreated }) {
  const [progCode, setProgCode] = useState(programs[0]?.code || 'BSCpE');
  const [yearLevel, setYearLevel] = useState('1st Year');
  const [sectionName, setSectionName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const yearMapping = {
    '1st Year': 1,
    '2nd Year': 2,
    '3rd Year': 3,
    '4th Year': 4,
  };

  const handleCreate = async () => {
    if (!sectionName.trim()) {
      setErrorMsg('Please enter a section name (e.g. 1-2, 2-1).');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await programsApi.createSection({
        program_code: progCode,
        year_level: yearMapping[yearLevel] || 1,
        name: sectionName.trim(),
      });
      onSectionCreated(progCode, sectionName.trim());
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add section.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="prog-modal-overlay" role="dialog" aria-modal="true" aria-label="Add Section">
      <div className="prog-modal-box">
        <div className="prog-modal-header">
          <Plus size={20} weight="bold" />
          <h2 className="prog-modal-title">Add Section</h2>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(220, 38, 38, 0.2)', border: '1px solid #DC2626', color: '#FCA5A5', padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem', marginBottom: 14 }}>
            {errorMsg}
          </div>
        )}

        <div className="prog-modal-body">
          <div className="prog-modal-field">
            <label>Program</label>
            <select value={progCode} onChange={e => setProgCode(e.target.value)}>
              {programs.map(p => (
                <option key={p.code} value={p.code}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="prog-modal-field">
            <label>Year Level</label>
            <select value={yearLevel} onChange={e => setYearLevel(e.target.value)}>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          <div className="prog-modal-field">
            <label>Section Name</label>
            <input
              type="text"
              value={sectionName}
              onChange={e => setSectionName(e.target.value)}
              placeholder="e.g. 1-2, 2-1"
              maxLength={15}
            />
          </div>
        </div>

        <div className="prog-modal-footer">
          <button className="prog-modal-btn-cancel" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="prog-modal-btn-save" onClick={handleCreate} disabled={isSubmitting || !sectionName.trim()}>
            {isSubmitting ? 'Adding...' : 'Add Section'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete confirmation ───────────────────────────────────────────────────

function DeleteConfirmModal({ program, onClose, onConfirm }) {
  return (
    <div className="prog-modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete">
      <div className="prog-modal-box" style={{ maxWidth: 420 }}>
        <div className="prog-modal-header">
          <Trash size={20} weight="fill" color="#EF4444" />
          <h2 className="prog-modal-title">Delete Program?</h2>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 8 }}>
          Are you sure you want to delete <strong style={{ color: '#F4F4F5' }}>{program.code}</strong>?
          This cannot be undone.
        </p>
        <div className="prog-modal-footer">
          <button className="prog-modal-btn-cancel" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFFFFF' }} onClick={onClose}>
            Cancel
          </button>
          <button className="prog-modal-btn-save" style={{ background: '#7B0000' }} onClick={() => { onConfirm(); onClose(); }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────────────────

export default function ProgramsView() {
  const [programs, setPrograms]       = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [filterOrg, setFilterOrg]     = useState('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [editTarget, setEditTarget]   = useState(null);  // null | program | 'new'
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [editSectionTarget, setEditSectionTarget] = useState(null); // null | { section, program }

  const filterRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPrograms = () => {
    setIsLoading(true);
    programsApi.getAll().then(data => {
      if (Array.isArray(data)) {
        setPrograms(data);
      }
    }).catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const displayed = filterOrg === 'ALL'
    ? programs
    : programs.filter(p => p.org === filterOrg);

  const handleSave = async (updated) => {
    const isEdit = programs.some(p => p.id === updated.id);
    try {
      if (isEdit) {
        await programsApi.update(updated.id, updated);
      } else {
        await programsApi.create(updated);
      }
      fetchPrograms();
    } catch (err) {
      console.error('Failed to save program:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await programsApi.delete(id);
      fetchPrograms();
    } catch (err) {
      console.error('Failed to delete program:', err);
    }
  };

  return (
    <div className="programs-page">
      <h1 className="programs-page-title">Programs</h1>

      <div className="programs-card">
        {/* Toolbar */}
        <div className="programs-toolbar">
          <div className="programs-toolbar-left">
            <span className="programs-filter-label">Filter by Org:</span>
            <div className="programs-custom-dropdown-wrap" ref={filterRef}>
              <button
                type="button"
                className="programs-custom-dropdown-btn"
                onClick={() => setIsFilterDropdownOpen(prev => !prev)}
                aria-expanded={isFilterDropdownOpen}
              >
                <span>{filterOrg === 'ALL' ? 'All Organizations' : filterOrg}</span>
                <CaretDown size={13} className={`dropdown-caret ${isFilterDropdownOpen ? 'rotated' : ''}`} />
              </button>

              {isFilterDropdownOpen && (
                <div className="programs-custom-dropdown-menu">
                  <button
                    type="button"
                    className={`dropdown-item ${filterOrg === 'ALL' ? 'active' : ''}`}
                    onClick={() => {
                      setFilterOrg('ALL');
                      setIsFilterDropdownOpen(false);
                    }}
                  >
                    All Organizations
                  </button>
                  {ORG_OPTIONS.map(orgCode => (
                    <button
                      key={orgCode}
                      type="button"
                      className={`dropdown-item ${filterOrg === orgCode ? 'active' : ''}`}
                      onClick={() => {
                        setFilterOrg(orgCode);
                        setIsFilterDropdownOpen(false);
                      }}
                    >
                      {orgCode}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="programs-add-btn programs-add-sec-btn" onClick={() => setIsAddSectionOpen(true)}>
              <Plus size={15} weight="bold" />
              Add Section
            </button>
            <button className="programs-add-btn" onClick={() => setEditTarget('new')}>
              <Plus size={15} weight="bold" />
              Add Program
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="programs-table-scroll">
          <table className="programs-table">
            <thead>
              <tr>
                <th style={{ width: 56 }}>Org</th>
                <th style={{ width: 130 }}>Program Code</th>
                <th>Full Program Name</th>
                <th style={{ width: 220 }}>Sections</th>
                <th style={{ width: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                    Loading academic programs and sections...
                  </td>
                </tr>
              )}
              {!isLoading && displayed.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                    No programs found.
                  </td>
                </tr>
              )}
              {!isLoading && displayed.map(prog => (
                <tr key={prog.id}>
                  <td>
                    <img
                      src={ORG_LOGOS[prog.org] ?? '/img/orgs/aces.png'}
                      alt={prog.org}
                      className="prog-table-org-logo"
                    />
                  </td>
                  <td>
                    <span className="prog-table-code">{prog.code}</span>
                  </td>
                  <td>
                    <span className="prog-table-name">{prog.name}</span>
                  </td>
                  <td>
                    <div className="prog-sections-badge-group">
                      {(() => {
                        const secList = (prog.sections_detail && prog.sections_detail.length > 0)
                          ? prog.sections_detail
                          : (prog.sections && prog.sections.length > 0)
                            ? prog.sections.map(s => ({
                                id: null,
                                name: typeof s === 'string' ? s : s.name,
                                year_level: typeof s === 'object' && s.year_level ? s.year_level : (parseInt((typeof s === 'string' ? s : s.name)[0]) || 1),
                              }))
                            : [];
                        if (secList.length === 0) {
                          return (
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', fontStyle: 'italic' }}>
                              No sections
                            </span>
                          );
                        }
                        return secList.map(secItem => (
                          <button
                            key={secItem.id || secItem.name}
                            type="button"
                            className="prog-sec-badge-pill clickable"
                            title={`Click to edit section ${secItem.name}`}
                            onClick={() => setEditSectionTarget({ section: secItem, program: prog })}
                          >
                            {secItem.name}
                          </button>
                        ));
                      })()}
                    </div>
                  </td>
                  <td>
                    <div className="prog-table-actions">
                      <button
                        className="prog-table-btn edit"
                        aria-label={`Edit ${prog.code}`}
                        onClick={() => setEditTarget(prog)}
                      >
                        <PencilSimple size={15} weight="bold" color="#FFFFFF" />
                      </button>
                      <button
                        className="prog-table-btn delete"
                        aria-label={`Delete ${prog.code}`}
                        onClick={() => setDeleteTarget(prog)}
                      >
                        <Trash size={15} weight="fill" color="#FFFFFF" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Add Section modal */}
      {isAddSectionOpen && (
        <AddSectionModal
          programs={programs}
          onClose={() => setIsAddSectionOpen(false)}
          onSectionCreated={() => {
            fetchPrograms();
          }}
        />
      )}

      {/* Edit Section modal (Bug 11 extension) */}
      {editSectionTarget && (
        <EditSectionModal
          sectionData={editSectionTarget}
          programs={programs}
          onClose={() => setEditSectionTarget(null)}
          onUpdated={fetchPrograms}
          onDeleted={fetchPrograms}
        />
      )}

      {/* Edit / Add modal */}
      {editTarget && (
        <ProgramModal
          program={editTarget === 'new' ? null : editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          program={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.id)}
        />
      )}
    </div>
  );
}
