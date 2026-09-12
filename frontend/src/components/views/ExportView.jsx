import React, { useState } from 'react';
import {
  FileCsv,
  DownloadSimple,
  CheckCircle,
  Database,
  WarningCircle,
  Cards,
  Info
} from '@phosphor-icons/react';

export default function ExportView({ onExportCsv }) {
  const [exporting, setExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExportClick = () => {
    setExporting(true);
    setTimeout(() => {
      onExportCsv();
      setExporting(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 600);
  };

  const exportColumns = [
    { field: 'STUDENT_NUMBER', canonical: 'student.student_number', note: 'Exact MDB primary key column' },
    { field: 'FIRST_NAME', canonical: 'student.first_name', note: 'Student given name' },
    { field: 'MIDDLE_NAME', canonical: 'student.middle_name', note: 'Optional middle name' },
    { field: 'LAST_NAME', canonical: 'student.last_name', note: 'Student surname' },
    { field: 'COURSE', canonical: 'course.code', note: 'e.g. BSIT, BSCpE' },
    { field: 'SECTION', canonical: 'section.name', note: 'e.g. 1-1, 3-2' },
    { field: 'PERM_BLDG', canonical: 'student.perm_bldg', note: 'Personal address building/lot' },
    { field: 'PERM_STRT', canonical: 'student.perm_strt', note: 'Personal street address' },
    { field: 'PERM_CITY', canonical: 'student.perm_city', note: 'Personal city / municipality' },
    { field: 'PERM_STAD', canonical: 'student.perm_stad', note: 'Province / State' },
    { field: 'PERM_POST', canonical: 'student.perm_post', note: 'Postal zip code' },
    { field: 'CTCT_NAME', canonical: 'student.contact_person_name', note: 'Emergency guardian full name' },
    { field: 'CTCT_NMBR', canonical: 'student.contact_person_number', note: 'Primary emergency contact mobile' },
    { field: 'CTCT_STRT', canonical: 'student.contact_strt', note: 'Guardian distinct street address' },
    { field: 'PHOTO', canonical: 'student.photo_url', note: 'CardFive manual OLE Long Binary attachment' }
  ];

  return (
    <div className="main-workspace">
      <header className="dashboard-header">
        <div className="header-kicker">
          <span>COMPATIBILITY ENGINE</span>
        </div>
        <h1 className="header-title">CardFive &amp; Microsoft Access MDB Sync</h1>
        <p className="header-subtitle">
          Export registered student batches to CSV with 100% field parity matching <code>sample.mdb</code>.
        </p>
      </header>

      <div className="bento-grid" style={{ marginBottom: 24 }}>
        {/* Status Card */}
        <div className="bento-card col-span-8">
          <div className="card-header-area">
            <div className="card-title-group">
              <span className="card-kicker">EXPORT CONTRACT</span>
              <h2 className="card-title">1:1 Schema Compliance Verified</h2>
              <p className="card-desc">
                The canonical SQLite database fields strictly map to the legacy Microsoft Access MDB table. Personal and emergency contact addresses are strictly kept as distinct data fields.
              </p>
            </div>
            <span className="card-badge-pill" style={{ background: 'var(--color-green-light)', color: 'var(--color-green)' }}>
              <CheckCircle size={14} weight="bold" />
              Contract Ready
            </span>
          </div>

          <div className="nested-preview-box" style={{ background: 'rgba(0,0,0,0.02)', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--text-xs)' }}>
              <Info size={18} color="var(--color-blue)" weight="bold" />
              <span>
                <strong>CardFive Photo Workflow</strong>: In accordance with project rules, photos are attached manually via CardFive using the MDB file. The CSV export prepares the exact metadata records for CardFive to bind.
              </span>
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button
              onClick={handleExportClick}
              disabled={exporting}
              className="control-pill"
              style={{
                padding: '12px 24px',
                background: 'var(--color-blue)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                cursor: exporting ? 'wait' : 'pointer'
              }}
            >
              <DownloadSimple size={18} weight="bold" />
              {exporting ? 'Generating CSV...' : 'Download CardFive CSV (sample.mdb format)'}
            </button>
            {downloadSuccess && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-green)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                <CheckCircle size={18} weight="bold" /> CSV Generated Successfully!
              </span>
            )}
          </div>
        </div>

        {/* Quick Info Card */}
        <div className="bento-card col-span-4">
          <div className="card-header-area">
            <div className="card-title-group">
              <span className="card-kicker">REFERENCE MDB</span>
              <h3 className="card-title">sample.mdb Specs</h3>
            </div>
          </div>
          <div className="nested-preview-box" style={{ fontSize: 'var(--text-xs)', gap: 8 }}>
            <div><strong>Access File:</strong> <code>reference/mdb/sample.mdb</code></div>
            <div><strong>Encoding:</strong> UTF-8 / Windows-1252 compatible</div>
            <div><strong>Binary Photos:</strong> OLE Long Binary Data</div>
            <div><strong>Split Addresses:</strong> Preserved &amp; Separated</div>
          </div>
        </div>
      </div>

      {/* Field Mapping Table Card */}
      <div className="bento-card col-span-12" style={{ padding: 0 }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>Data Field Transformation Matrix</h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Each internal canonical column maps precisely to an MDB column.
          </p>
        </div>

        <table className="student-mini-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: 22 }}>MDB Column (CSV Header)</th>
              <th>Canonical Entity Source</th>
              <th>Transformation &amp; CardFive Note</th>
            </tr>
          </thead>
          <tbody>
            {exportColumns.map((col) => (
              <tr key={col.field}>
                <td style={{ paddingLeft: 22, fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-blue)' }}>
                  {col.field}
                </td>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {col.canonical}
                </td>
                <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {col.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
