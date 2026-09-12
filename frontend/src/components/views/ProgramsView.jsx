import React, { useState, useEffect } from 'react';
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import { programsApi } from '../../services/api';
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

const INITIAL_PROGRAMS = [
  { id: '1',  org: 'YES',   code: 'BEED',     name: 'Bachelor of Elementary Education' },
  { id: '2',  org: 'HRSS',  code: 'BSBA-HRM', name: 'Bachelor of Science in Business Administration Major in Human Resource Management' },
  { id: '3',  org: 'ACES',  code: 'BSCpE',    name: 'Bachelor of Science in Computer Engineering' },
  { id: '4',  org: 'YES',   code: 'BSED-ENG', name: 'Bachelor of Secondary Education Major in English' },
  { id: '5',  org: 'YES',   code: 'BSED-SS',  name: 'Bachelor of Secondary Education Major in Social Studies' },
  { id: '6',  org: 'PIIE',  code: 'BSIE',     name: 'Bachelor of Science in Industrial Engineering' },
  { id: '7',  org: 'IBITS', code: 'BSIT',     name: 'Bachelor of Science in Information Technology' },
  { id: '8',  org: 'SMS',   code: 'BSPSY',    name: 'Bachelor of Science in Psychology' },
  { id: '9',  org: 'ACES',  code: 'DCpET',    name: 'Diploma in Computer Engineering Technology' },
  { id: '10', org: 'IBITS', code: 'DIT',      name: 'Diploma in Information Technology' },
];

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
        <div className="prog-modal-header">
          <PencilSimple size={20} weight="bold" />
          <h2 className="prog-modal-title">{isNew ? 'Add Program' : 'Edit Program'}</h2>
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
  const [programs, setPrograms]       = useState(INITIAL_PROGRAMS);
  const [filterOrg, setFilterOrg]     = useState('ALL');
  const [editTarget, setEditTarget]   = useState(null);  // null | program | 'new'
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    programsApi.getAll().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setPrograms(data);
      }
    }).catch(() => {});
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
    } catch (_) {}

    setPrograms(prev => {
      const idx = prev.findIndex(p => p.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
  };

  const handleDelete = async (id) => {
    try {
      await programsApi.delete(id);
    } catch (_) {}
    setPrograms(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="programs-page">
      <h1 className="programs-page-title">Programs</h1>

      <div className="programs-card">
        {/* Toolbar */}
        <div className="programs-toolbar">
          <div className="programs-toolbar-left">
            <span className="programs-filter-label">Filter by Org:</span>
            <select
              className="programs-filter-select"
              value={filterOrg}
              onChange={e => setFilterOrg(e.target.value)}
            >
              <option value="ALL">All Organizations</option>
              {ORG_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <button className="programs-add-btn" onClick={() => setEditTarget('new')}>
            <Plus size={15} weight="bold" />
            Add Program
          </button>
        </div>

        {/* Table */}
        <div className="programs-table-scroll">
          <table className="programs-table">
            <thead>
              <tr>
                <th style={{ width: 56 }}>Org</th>
                <th>Program Code</th>
                <th>Full Program Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                    No programs found.
                  </td>
                </tr>
              )}
              {displayed.map(prog => (
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
      <footer className="page-footer">
        <div className="page-footer-left">
          <span className="page-footer-brand">© 2026 ACES-PUPBC Synapse</span>
          <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4, fontSize: '0.6rem', color: '#A1A1AA', fontFamily: 'monospace' }}>v2.1.2</span>
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
