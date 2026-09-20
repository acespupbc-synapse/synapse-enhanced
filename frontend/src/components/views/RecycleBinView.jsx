import React, { useState } from 'react';
import {
  MagnifyingGlass,
  Trash,
  ArrowCounterClockwise,
  Warning,
  Users
} from '@phosphor-icons/react';
import { studentApi } from '../../services/api';
import Footer from '../common/Footer';
import './RecycleBinView.css';

function relativeTime(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} hr ago`;
  return `${Math.round(diff / 86400)} days ago`;
}

export default function RecycleBinView() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [purgeTarget, setPurgeTarget] = useState(null);
  const [emptyAll, setEmptyAll] = useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    studentApi.getAll({ deleted: true })
      .then((data) => {
        if (Array.isArray(data)) {
          setRecords(data.map(s => ({
            id: s.id,
            name: `${s.last_name}, ${s.first_name} ${s.middle_name || ''}`.trim(),
            studentNumber: s.student_number,
            program: s.course_code || '',
            section: s.section_name || '',
            org: s.organization || 'ACES',
            deletedAt: s.deleted_at ? new Date(s.deleted_at) : new Date(),
          })));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = records.filter(r =>
    (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.studentNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.program || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleRestore = async (id) => {
    try {
      await studentApi.restore(id);
    } catch (_) {}
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handlePurge = async (id) => {
    try {
      await studentApi.purge(id);
    } catch (_) {}
    setRecords(prev => prev.filter(r => r.id !== id));
    setPurgeTarget(null);
  };

  const handleEmptyAll = async () => {
    try {
      await studentApi.emptyRecycleBin();
    } catch (_) {}
    setRecords([]);
    setEmptyAll(false);
  };

  return (
    <div className="recycle-page">
      <h1 className="recycle-page-title">Recycle Bin</h1>

      <div className="recycle-card">
        {/* Toolbar */}
        <div className="recycle-toolbar">
          <div className="recycle-toolbar-left">
            <div className="recycle-search-box">
              <MagnifyingGlass size={15} weight="bold" color="rgba(255,255,255,0.3)" />
              <input
                type="text"
                placeholder="Search deleted records..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="recycle-count-badge">
              <span>Deleted records:</span>
              <span className="recycle-count-num">{records.length}</span>
            </div>
          </div>

          {records.length > 0 && (
            <button
              className="recycle-empty-all-btn"
              onClick={() => setEmptyAll(true)}
            >
              <Trash size={14} weight="fill" />
              Empty Recycle Bin
            </button>
          )}
        </div>

        {/* Empty state */}
        {records.length === 0 && (
          <div className="recycle-empty-state">
            <div className="recycle-empty-icon">
              <Trash size={30} weight="duotone" color="rgba(200,80,80,0.85)" />
            </div>
            <p className="recycle-empty-title">Recycle Bin is Empty</p>
            <p className="recycle-empty-sub">
              No deleted registrations. Records removed from the student registry will appear here and can be restored or permanently purged.
            </p>
          </div>
        )}

        {/* Table */}
        {records.length > 0 && (
          <>
            <div className="recycle-table-scroll">
              <table className="recycle-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Student Number</th>
                    <th>Program / Section</th>
                    <th>Deleted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                        No matching deleted records.
                      </td>
                    </tr>
                  )}
                  {filtered.map(record => (
                    <tr key={record.id}>
                      <td>
                        <div className="recycle-student-cell">
                          <div className="recycle-avatar">
                            <Users size={16} weight="duotone" />
                          </div>
                          <div>
                            <div className="recycle-student-name">{record.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="recycle-student-id">{record.studentNumber}</span>
                      </td>
                      <td>
                        <span className="recycle-prog-badge">
                          {record.org} · {record.program} {record.section}
                        </span>
                      </td>
                      <td>
                        <div className="recycle-deleted-at">{record.deletedAt.toLocaleDateString()}</div>
                        <div className="recycle-deleted-ago">{relativeTime(record.deletedAt)}</div>
                      </td>
                      <td>
                        <div className="recycle-actions">
                          <button
                            className="recycle-btn restore"
                            onClick={() => handleRestore(record.id)}
                          >
                            <ArrowCounterClockwise size={13} weight="bold" />
                            Restore
                          </button>
                          <button
                            className="recycle-btn purge"
                            onClick={() => setPurgeTarget(record)}
                          >
                            <Trash size={13} weight="fill" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Info strip */}
            <div className="recycle-info-strip">
              <Warning size={14} weight="fill" />
              Deleted records are permanently deleted and cannot be recovered. Restore records to reinstate them in the active student registry.
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* Purge confirmation modal */}
      {purgeTarget && (
        <div className="prog-modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm purge">
          <div className="prog-modal-box" style={{ maxWidth: 440 }}>
            <div className="prog-modal-header">
              <Trash size={20} weight="fill" color="#EF4444" />
              <h2 className="prog-modal-title">Permanently Delete?</h2>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 4 }}>
              This will <strong style={{ color: '#FCA5A5' }}>permanently delete</strong> the record for{' '}
              <strong style={{ color: '#F4F4F5' }}>{purgeTarget.name}</strong>{' '}
              ({purgeTarget.studentNumber}). This action cannot be undone.
            </p>
            <div className="prog-modal-footer">
              <button
                className="prog-modal-btn-cancel"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFFFFF' }}
                onClick={() => setPurgeTarget(null)}
              >
                Cancel
              </button>
              <button
                className="prog-modal-btn-save"
                style={{ background: '#7B0000' }}
                onClick={() => handlePurge(purgeTarget.id)}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty all confirmation modal */}
      {emptyAll && (
        <div className="prog-modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm empty recycle bin">
          <div className="prog-modal-box" style={{ maxWidth: 440 }}>
            <div className="prog-modal-header">
              <Warning size={20} weight="fill" color="#EF4444" />
              <h2 className="prog-modal-title">Empty Recycle Bin?</h2>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 4 }}>
              This will <strong style={{ color: '#FCA5A5' }}>permanently delete all {records.length} record{records.length !== 1 ? 's' : ''}</strong> in the recycle bin. This action cannot be undone.
            </p>
            <div className="prog-modal-footer">
              <button
                className="prog-modal-btn-cancel"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFFFFF' }}
                onClick={() => setEmptyAll(false)}
              >
                Cancel
              </button>
              <button
                className="prog-modal-btn-save"
                style={{ background: '#7B0000' }}
                onClick={handleEmptyAll}
              >
                Empty All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
