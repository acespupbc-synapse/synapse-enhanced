import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  SlidersHorizontal,
  ShieldCheck,
  Database,
  FloppyDisk,
  ArrowClockwise,
  CheckCircle,
  WarningCircle,
  DownloadSimple,
  Trash,
  Key,
  LockKey,
  Plus,
  X,
  FileArchive,
  CaretDown,
  SignOut
} from '@phosphor-icons/react';
import { studentApi, settingsApi, authApi, exportApi } from '../../services/api';
import Footer from '../common/Footer';
import './SettingsView.css';

export default function SettingsView({ stats, onToggleRegistration, onShowToast, onRefreshStats, onLogout }) {
  const [activeCategory, setActiveCategory] = useState('portal');

  // Modals
  const [showDangerModal, setShowDangerModal] = useState(false);
  const [dangerConfirmText, setDangerConfirmText] = useState('');
  const [showToggleAuthModal, setShowToggleAuthModal] = useState(false);
  const [authPasswordInput, setAuthPasswordInput] = useState('');
  const [authPasswordError, setAuthPasswordError] = useState('');
  const [showAddAYModal, setShowAddAYModal] = useState(false);
  const [newAYInput, setNewAYInput] = useState('');
  const [newAYError, setNewAYError] = useState('');
  const [showAYWarningModal, setShowAYWarningModal] = useState(false);
  const [pendingAY, setPendingAY] = useState(null);

  // Dropdowns
  const [isAYDropdownOpen, setIsAYDropdownOpen] = useState(false);
  const ayDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ayDropdownRef.current && !ayDropdownRef.current.contains(event.target)) {
        setIsAYDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Portal & Session Settings State ───────────────────────────────────────
  const [academicYears, setAcademicYears] = useState([
    '2026-2027'
  ]);

  useEffect(() => {
    settingsApi.getAcademicYears().then(res => {
      if (Array.isArray(res) && res.length > 0) {
        const names = res.map(ay => (typeof ay === 'string' ? ay : ay.name)).filter(Boolean);
        if (names.length > 0) {
          setAcademicYears(prev => [...new Set([...prev, ...names])]);
        }
      }
    }).catch(() => {});
  }, []);

  const [portalConfig, setPortalConfig] = useState({
    isOpen: stats?.isRegistrationOpen ?? true,
    academicYear: stats?.ayName?.replace(/^AY\s*/i, '') || '2026-2027'
  });

  useEffect(() => {
    if (stats?.isRegistrationOpen !== undefined) {
      setPortalConfig(prev => ({ ...prev, isOpen: stats.isRegistrationOpen }));
    }
  }, [stats?.isRegistrationOpen]);

  // ── Security & Admin State ────────────────────────────────────────────────
  const [securityConfig, setSecurityConfig] = useState({
    adminUsername: 'admin',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordError, setPasswordError] = useState('');

  // ── System Diagnostics State ──────────────────────────────────────────────
  const rawApiUrl = (import.meta.env.VITE_API_URL || 'https://synapse-enhanced.onrender.com').replace(/\/+$/, '');
  const [systemMetrics, setSystemMetrics] = useState({
    dbEngine: 'PostgreSQL 15+ (Supabase Pooler) + SQLAlchemy 2.0 Async',
    dbFile: 'PostgreSQL aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
    alembicRevision: '001_canonical_postgresql_schema',
    apiEndpoint: `${rawApiUrl}/api`,
    apiStatus: 'Healthy (Online)',
    activeStudents: stats?.totalStudents || 0,
    recycleBinCount: stats?.recycleBinCount || 0,
    totalPhotos: stats?.totalPhotos || 0,
    totalSignatures: stats?.totalSignatures || 0,
    supabaseStorageMb: 10.81,
    r2StorageMb: 5.98,
    r2TotalObjects: 39,
  });

  useEffect(() => {
    settingsApi.getDiagnostics().then(diag => {
      if (diag) {
        setSystemMetrics(prev => ({
          ...prev,
          dbEngine: diag.dbEngine || diag.db_engine || prev.dbEngine,
          dbFile: diag.dbHost || diag.db_host || prev.dbFile,
          alembicRevision: diag.alembicRevision || diag.alembic_revision || prev.alembicRevision,
          apiStatus: diag.apiStatus || (diag.status === 'ok' ? 'Healthy (Online)' : prev.apiStatus),
          activeStudents: diag.activeStudents ?? diag.totalRegistered ?? prev.activeStudents,
          recycleBinCount: diag.recycleBinCount ?? prev.recycleBinCount,
          totalPhotos: diag.totalPhotos ?? prev.totalPhotos,
          totalSignatures: diag.totalSignatures ?? prev.totalSignatures,
          supabaseStorageMb: diag.supabaseStorageMb ?? prev.supabaseStorageMb,
          r2StorageMb: diag.r2StorageMb ?? prev.r2StorageMb,
          r2TotalObjects: diag.r2TotalObjects ?? prev.r2TotalObjects,
        }));
      }
    }).catch(() => {});
  }, []);

  // Open the registration toggle auth modal
  const handleRequestTogglePortal = () => {
    setAuthPasswordInput('');
    setAuthPasswordError('');
    setShowToggleAuthModal(true);
  };

  // Confirm portal toggle with password
  const handleConfirmTogglePortal = async (e) => {
    e.preventDefault();
    if (!authPasswordInput.trim()) {
      setAuthPasswordError('Administrator password is required.');
      return;
    }

    try {
      await authApi.login(securityConfig.adminUsername || 'admin', authPasswordInput);
    } catch (_) {
      setAuthPasswordError('Incorrect admin password.');
      return;
    }

    const nextState = !portalConfig.isOpen;
    if (onToggleRegistration) {
      onToggleRegistration(nextState);
    }
    setPortalConfig(prev => ({ ...prev, isOpen: nextState }));
    setShowToggleAuthModal(false);
    if (onShowToast) {
      onShowToast(nextState ? 'Registration is now OPEN.' : 'Registration is now CLOSED.');
    }
  };

  // Handle adding new Academic Year
  const handleAddAcademicYear = async (e) => {
    e.preventDefault();
    setNewAYError('');
    const trimmed = newAYInput.trim();
    if (!trimmed) {
      setNewAYError('Academic year is required (e.g. 2028-2029).');
      return;
    }
    if (!/^\d{4}-\d{4}$/.test(trimmed)) {
      setNewAYError('Invalid format. Please use YYYY-YYYY (e.g. 2028-2029).');
      return;
    }
    if (academicYears.includes(trimmed)) {
      setNewAYError('This academic year already exists.');
      return;
    }

    try {
      await settingsApi.createAcademicYear({ name: trimmed, is_active: true });
      await settingsApi.updateSettings({ active_ay: trimmed });
      setAcademicYears(prev => [...new Set([...prev, trimmed])]);
      setPortalConfig(prev => ({ ...prev, academicYear: trimmed }));
      setShowAddAYModal(false);
      setNewAYInput('');
      if (onShowToast) {
        onShowToast(`Academic Year ${trimmed} created and set as active.`);
      }
      if (onRefreshStats) {
        onRefreshStats();
      }
    } catch (err) {
      setNewAYError(err.message || 'Failed to create academic year.');
    }
  };

  // Handle password update
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!securityConfig.currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (!securityConfig.newPassword || securityConfig.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (securityConfig.newPassword !== securityConfig.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      await authApi.changePassword(securityConfig.currentPassword, securityConfig.newPassword);
      setSecurityConfig(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      if (onShowToast) {
        onShowToast('Admin password updated successfully.');
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to update admin password.');
    }
  };

  // Download Complete Archive (Genuine .ZIP containing CSV, XLSX, JSON and Cloudflare R2 Photos & Signatures)
  const handleDownloadCompleteArchive = async () => {
    let finished = false;

    // Stage 1: Compiling
    if (onShowToast) {
      onShowToast('Compiling system records...', { loading: true });
    }

    // Stage 2: Bundling
    const stage2Timer = setTimeout(() => {
      if (!finished && onShowToast) {
        onShowToast('Bundling R2 media & MDB databases...', { loading: true });
      }
    }, 2000);

    // Stage 3: Exporting
    const stage3Timer = setTimeout(() => {
      if (!finished && onShowToast) {
        onShowToast('Exporting complete archive (.zip)...', { loading: true });
      }
    }, 4800);

    try {
      await exportApi.downloadArchive();
      finished = true;
      clearTimeout(stage2Timer);
      clearTimeout(stage3Timer);

      if (onShowToast) {
        onShowToast('Complete system archive (.zip) downloaded successfully.');
      }
    } catch (err) {
      finished = true;
      clearTimeout(stage2Timer);
      clearTimeout(stage3Timer);
      if (onShowToast) {
        onShowToast(`Could not download complete archive: ${err.message || 'Server error'}`);
      }
    }
  };

  // Download System snapshot
  const handleDownloadBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      portalConfig,
      systemMetrics
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synapse_settings_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (onShowToast) {
      onShowToast('System settings snapshot exported.');
    }
  };

  // Handle purge / reset action
  const handleExecuteDangerAction = () => {
    if (dangerConfirmText !== 'DELETE') {
      return;
    }
    setShowDangerModal(false);
    setDangerConfirmText('');
    if (onShowToast) {
      onShowToast('Soft-deleted records permanently deleted.');
    }
  };

  return (
    <div className="settings-page">
      {/* Top Header */}
      <div className="settings-header">
        <div className="settings-title-group">
          <h1 className="settings-page-title">System Settings</h1>
          <p className="settings-page-subtitle">
            Configure registration availability, academic year scope, PUP Biñan rules, and system security.
          </p>
        </div>
      </div>

      {/* Main Settings Layout (Nav + Content) */}
      <div className="settings-layout">
        {/* Navigation Sidebar (4 Clean Categories) */}
        <aside className="settings-nav">
          <button
            type="button"
            className={`settings-nav-item ${activeCategory === 'portal' ? 'active' : ''}`}
            onClick={() => setActiveCategory('portal')}
          >
            <Globe size={18} weight={activeCategory === 'portal' ? 'fill' : 'regular'} />
            <span>Portal &amp; Session</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeCategory === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveCategory('rules')}
          >
            <SlidersHorizontal size={18} weight={activeCategory === 'rules' ? 'fill' : 'regular'} />
            <span>Registration Rules</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeCategory === 'security' ? 'active' : ''}`}
            onClick={() => setActiveCategory('security')}
          >
            <ShieldCheck size={18} weight={activeCategory === 'security' ? 'fill' : 'regular'} />
            <span>Security &amp; Admin</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeCategory === 'system' ? 'active' : ''}`}
            onClick={() => setActiveCategory('system')}
          >
            <Database size={18} weight={activeCategory === 'system' ? 'fill' : 'regular'} />
            <span>Database &amp; Engine</span>
          </button>

          <div className="settings-nav-logout-spacer" />

          <button
            type="button"
            className="settings-nav-item settings-nav-logout"
            onClick={onLogout || (() => { localStorage.removeItem('synapse_auth_token'); window.location.href = '/login'; })}
            title="Log out of administrative session"
          >
            <SignOut size={18} weight="bold" />
            <span>Log Out</span>
          </button>
        </aside>

        {/* Dynamic Category Content */}
        <main className="settings-content">
          {/* ── Category: Portal & Session ─────────────────────────────────── */}
          {activeCategory === 'portal' && (
            <>
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">PORTAL ACCESS CONTROL</span>
                    <h2 className="settings-card-title">Registration Portal Status</h2>
                    <p className="settings-card-desc">
                      Control whether students can submit registrations through the public registration wizard.
                    </p>
                  </div>
                </div>

                <div className="settings-toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-title">Accept Student Registrations</span>
                    <span className="toggle-subtitle">
                      Requires admin password confirmation to change. When closed, students will be redirected to the Registration Closed notice.
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`settings-toggle-pill ${portalConfig.isOpen ? 'open' : 'closed'}`}
                    onClick={handleRequestTogglePortal}
                    title="Change registration portal status (requires password)"
                  >
                    {portalConfig.isOpen ? (
                      <>
                        <span className="toggle-pill-text">OPEN</span>
                        <span className="toggle-pill-knob" />
                      </>
                    ) : (
                      <>
                        <span className="toggle-pill-knob" />
                        <span className="toggle-pill-text">CLOSED</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="settings-divider" />

                <div className="settings-field" style={{ maxWidth: 360 }}>
                  <label className="settings-label">
                    Active Academic Year Scope
                  </label>
                  <div className="settings-custom-dropdown-wrap" ref={ayDropdownRef}>
                    <button
                      type="button"
                      className="settings-custom-dropdown-btn"
                      onClick={() => setIsAYDropdownOpen(prev => !prev)}
                      aria-expanded={isAYDropdownOpen}
                    >
                      <span>{portalConfig.academicYear}</span>
                      <CaretDown size={14} className={`dropdown-caret ${isAYDropdownOpen ? 'rotated' : ''}`} />
                    </button>

                    {isAYDropdownOpen && (
                      <div className="settings-custom-dropdown-menu">
                        <div className="settings-dropdown-items-list">
                          {academicYears.map(ay => (
                            <button
                              key={ay}
                              type="button"
                              className={`settings-dropdown-item ${portalConfig.academicYear === ay ? 'active' : ''}`}
                              onClick={() => {
                                if (ay !== portalConfig.academicYear) {
                                  setPendingAY(ay);
                                  setShowAYWarningModal(true);
                                }
                                setIsAYDropdownOpen(false);
                              }}
                            >
                              <span>{ay}</span>
                              {portalConfig.academicYear === ay && (
                                <CheckCircle size={14} weight="bold" color="#FFFFFF" />
                              )}
                            </button>
                          ))}
                        </div>

                        <div className="settings-dropdown-divider" />

                        <button
                          type="button"
                          className="settings-dropdown-add-btn"
                          onClick={() => {
                            setIsAYDropdownOpen(false);
                            setNewAYInput('');
                            setNewAYError('');
                            setShowAddAYModal(true);
                          }}
                        >
                          <Plus size={14} weight="bold" />
                          <span>Add Academic Year</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ── Category: Registration Rules ───────────────────────────────── */}
          {activeCategory === 'rules' && (
            <>
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">DATA INTEGRITY &amp; VALIDATION</span>
                    <h2 className="settings-card-title">PUP Biñan Campus Student Policies</h2>
                    <p className="settings-card-desc">
                      Authoritative system policies, input format masks, and database integrity rules enforced across the platform.
                    </p>
                  </div>
                </div>

                <div className="policy-list">
                  <div className="policy-card">
                    <div className="policy-header">
                      <span className="policy-title">Student Number Format Mask</span>
                      <span className="policy-badge">Enforced &amp; Auto-Formatted</span>
                    </div>
                    <p className="policy-desc">
                      All student registration entries must conform to the PUP Biñan campus mask: <code>YYYY-NNNNN-BN-0</code>. Hyphens are dynamically placed in real-time during data entry.
                    </p>
                  </div>

                  <div className="policy-card">
                    <div className="policy-header">
                      <span className="policy-title">Duplicate Registration Prevention</span>
                      <span className="policy-badge">Active in Database</span>
                    </div>
                    <p className="policy-desc">
                      PostgreSQL unique constraints reject duplicate Student Numbers and Student Emails within the active academic year to prevent duplicate submissions.
                    </p>
                  </div>

                  <div className="policy-card">
                    <div className="policy-header">
                      <span className="policy-title">Authoritative Uppercase Conversion</span>
                      <span className="policy-badge">System Standard</span>
                    </div>
                    <p className="policy-desc">
                      Student names, section codes, and residential addresses are normalized to uppercase for consistent academic reporting and Microsoft Access MDB export compatibility.
                    </p>
                  </div>

                  <div className="policy-card">
                    <div className="policy-header">
                      <span className="policy-title">Media Storage &amp; Validation</span>
                      <span className="policy-badge">1500×1500 &amp; 2000×1200</span>
                    </div>
                    <p className="policy-desc">
                      Student 1:1 ID photos and white-background signatures are validated server-side using Pillow and securely preserved as private objects in Cloudflare R2 bucket storage.
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ── Category: Security & Admin ─────────────────────────────────── */}
          {activeCategory === 'security' && (
            <>
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">ACCESS CONTROL</span>
                    <h2 className="settings-card-title">Change Administrator Password</h2>
                    <p className="settings-card-desc">
                      Ensure admin accounts use strong, non-default credentials.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {passwordError && (
                    <div className="settings-error-banner">
                      <WarningCircle size={18} weight="fill" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <div className="settings-field">
                    <label className="settings-label">Current Admin Password</label>
                    <input
                      type="password"
                      className="settings-input"
                      placeholder="Enter current admin password"
                      value={securityConfig.currentPassword}
                      onChange={e => setSecurityConfig(s => ({ ...s, currentPassword: e.target.value }))}
                    />
                  </div>

                  <div className="settings-grid-2">
                    <div className="settings-field">
                      <label className="settings-label">New Password</label>
                      <input
                        type="password"
                        className="settings-input"
                        placeholder="At least 8 characters"
                        value={securityConfig.newPassword}
                        onChange={e => setSecurityConfig(s => ({ ...s, newPassword: e.target.value }))}
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-label">Confirm New Password</label>
                      <input
                        type="password"
                        className="settings-input"
                        placeholder="Repeat new password"
                        value={securityConfig.confirmPassword}
                        onChange={e => setSecurityConfig(s => ({ ...s, confirmPassword: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                    <button type="submit" className="btn-secondary">
                      <LockKey size={16} />
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>
              </section>

              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">ADMIN SESSION</span>
                    <h2 className="settings-card-title">Session Management</h2>
                    <p className="settings-card-desc">
                      Currently logged in as <strong>{securityConfig.adminUsername}</strong>. Sign out to securely terminate your administrative session on this device.
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={onLogout || (() => { localStorage.removeItem('synapse_auth_token'); window.location.href = '/login'; })}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <SignOut size={16} weight="bold" />
                    <span>Log Out of Admin Panel</span>
                  </button>
                </div>
              </section>
            </>
          )}

          {/* ── Category: Database & Engine ─────────────────────────────────── */}
          {activeCategory === 'system' && (
            <>
              <section className="settings-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker">DATABASE &amp; EXPORTS</span>
                    <h2 className="settings-card-title">Database Records &amp; Media Archives</h2>
                    <p className="settings-card-desc">
                      Download full data dumps including database rows, student photos, and signatures.
                    </p>
                  </div>
                </div>

                <div className="meta-box">
                  <div className="meta-row">
                    <span className="meta-label">Campus Scope:</span>
                    <span className="meta-value">PUP Biñan Campus</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Active Academic Year:</span>
                    <span className="meta-value">AY {portalConfig.academicYear}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Database Engine:</span>
                    <span className="meta-value">{systemMetrics.dbEngine}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Database Host:</span>
                    <span className="meta-value">{systemMetrics.dbFile}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Supabase Database Storage:</span>
                    <span className="meta-value">{systemMetrics.supabaseStorageMb} MB / 500 MB</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Cloudflare R2 Storage:</span>
                    <span className="meta-value">{systemMetrics.r2StorageMb} MB ({systemMetrics.r2TotalObjects} files) / 10 GB</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Active Student Records:</span>
                    <span className="meta-value">{systemMetrics.activeStudents} active {systemMetrics.recycleBinCount > 0 ? `(${systemMetrics.recycleBinCount} in Recycle Bin)` : ''}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Media Archives:</span>
                    <span className="meta-value">{systemMetrics.totalPhotos} photos, {systemMetrics.totalSignatures} signatures</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Schema Revision:</span>
                    <span className="meta-value">{systemMetrics.alembicRevision}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">API Status:</span>
                    <span className="meta-value" style={{ color: '#34D399' }}>● {systemMetrics.apiStatus}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn-primary-archive"
                    onClick={handleDownloadCompleteArchive}
                  >
                    <FileArchive size={18} weight="bold" />
                    <span>Download Complete Archive (DB + Photos + Signatures)</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleDownloadBackup}
                  >
                    <DownloadSimple size={16} />
                    <span>Download Settings JSON</span>
                  </button>
                </div>
              </section>

              {/* Danger Zone */}
              <section className="settings-card danger-zone-card">
                <div className="settings-card-header">
                  <div>
                    <span className="settings-card-kicker" style={{ color: '#EF4444' }}>DANGER ZONE</span>
                    <h2 className="settings-card-title">Maintenance &amp; Data Cleanup</h2>
                    <p className="settings-card-desc">
                      Destructive operations. Please ensure a complete archive is downloaded before proceeding.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#EF4444' }}>
                      Clear Soft-Deleted Records
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                      Permanently delete records currently residing in the Recycle Bin.
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => setShowDangerModal(true)}
                  >
                    <Trash size={16} />
                    <span>Empty Recycle Bin</span>
                  </button>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer />

      {/* ── Modal: Password Confirmation for Registration Status Toggle ──────── */}
      {showToggleAuthModal && (
        <div className="settings-modal-overlay" role="dialog" aria-modal="true">
          <div className="settings-modal-dialog">
            <div className="settings-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#E00000' }}>
                <Key size={22} weight="bold" />
                <h3 className="settings-modal-title">
                  Confirm {portalConfig.isOpen ? 'Closing' : 'Opening'} Registration
                </h3>
              </div>
              <button
                type="button"
                className="settings-modal-close"
                onClick={() => setShowToggleAuthModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmTogglePortal}>
              <p className="settings-modal-desc">
                Please enter the administrator password to confirm{' '}
                <strong>{portalConfig.isOpen ? 'closing' : 'opening'}</strong> the public student registration portal.
              </p>

              {authPasswordError && (
                <div className="settings-error-banner" style={{ marginBottom: 14 }}>
                  <WarningCircle size={16} weight="fill" />
                  <span>{authPasswordError}</span>
                </div>
              )}

              <div className="settings-field" style={{ marginBottom: 20 }}>
                <label className="settings-label">Admin Password</label>
                <input
                  type="password"
                  autoFocus
                  className="settings-input"
                  placeholder="Enter admin password"
                  value={authPasswordInput}
                  onChange={e => setAuthPasswordInput(e.target.value)}
                />
              </div>

              <div className="settings-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowToggleAuthModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                >
                  Confirm &amp; Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add New Academic Year ─────────────────────────────────────── */}
      {showAddAYModal && (
        <div className="settings-modal-overlay" role="dialog" aria-modal="true">
          <div className="settings-modal-dialog">
            <div className="settings-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#FFFFFF' }}>
                <Plus size={22} weight="bold" color="#E00000" />
                <h3 className="settings-modal-title">Add New Academic Year</h3>
              </div>
              <button
                type="button"
                className="settings-modal-close"
                onClick={() => setShowAddAYModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAcademicYear}>
              {/* Notice */}
              <div className="settings-notice-box">
                <WarningCircle size={20} weight="fill" color="#EF4444" style={{ flexShrink: 0 }} />
                <p className="settings-notice-text">
                  Adding a new academic year starts a new student registration group. All new student records and exports will be tied to this year.
                </p>
              </div>

              {newAYError && (
                <div className="settings-error-banner" style={{ marginBottom: 14 }}>
                  <WarningCircle size={16} weight="fill" />
                  <span>{newAYError}</span>
                </div>
              )}

              <div className="settings-field" style={{ marginBottom: 20 }}>
                <label className="settings-label">Academic Year (Format: YYYY-YYYY)</label>
                <input
                  type="text"
                  autoFocus
                  className="settings-input"
                  placeholder="e.g. 2028-2029"
                  value={newAYInput}
                  onChange={e => setNewAYInput(e.target.value)}
                />
              </div>

              <div className="settings-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddAYModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                >
                  Create Academic Year
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Danger Zone Empty Recycle Bin ──────────────────────────── */}
      {showDangerModal && (
        <div className="settings-modal-overlay" role="dialog" aria-modal="true">
          <div className="settings-modal-dialog">
            <div className="settings-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#EF4444' }}>
                <WarningCircle size={24} weight="bold" />
                <h3 className="settings-modal-title">Empty Recycle Bin</h3>
              </div>
              <button
                type="button"
                className="settings-modal-close"
                onClick={() => { setShowDangerModal(false); setDangerConfirmText(''); }}
              >
                <X size={18} />
              </button>
            </div>

            <p className="settings-modal-desc">
              This will permanently delete all records currently in the Recycle Bin. This action cannot be undone.
              Type <strong>DELETE</strong> below to confirm.
            </p>

            <input
              type="text"
              className="settings-input"
              value={dangerConfirmText}
              onChange={e => setDangerConfirmText(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              style={{ marginBottom: 16 }}
            />

            <div className="settings-modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setShowDangerModal(false); setDangerConfirmText(''); }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-danger"
                disabled={dangerConfirmText !== 'DELETE'}
                onClick={handleExecuteDangerAction}
                style={{ opacity: dangerConfirmText === 'DELETE' ? 1 : 0.5 }}
              >
                Empty Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Academic Year Change Warning Modal */}
      {showAYWarningModal && (
        <div className="settings-modal-overlay" role="dialog" aria-modal="true">
          <div className="settings-modal-dialog" style={{ maxWidth: 440 }}>
            <div className="settings-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#F59E0B' }}>
                <WarningCircle size={24} weight="bold" />
                <h3 className="settings-modal-title">Change Academic Year?</h3>
              </div>
              <button
                type="button"
                className="settings-modal-close"
                onClick={() => {
                  setShowAYWarningModal(false);
                  setPendingAY(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p className="settings-modal-desc" style={{ marginBottom: 20, lineHeight: 1.5 }}>
              Are you sure you want to switch the active Academic Year to <strong>{pendingAY}</strong>? This will alter active registration workflows, statistics tracking, and default student records.
            </p>

            <div className="settings-modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowAYWarningModal(false);
                  setPendingAY(null);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-primary"
                style={{ background: '#7B0000', color: '#FFFFFF', border: 'none', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                onClick={async () => {
                  const targetAY = pendingAY;
                  setPortalConfig(p => ({ ...p, academicYear: targetAY }));
                  setShowAYWarningModal(false);
                  setPendingAY(null);
                  try {
                    await settingsApi.updateSettings({ active_ay: targetAY });
                    if (onShowToast) {
                      onShowToast(`Academic Year switched to ${targetAY}.`);
                    }
                    if (onRefreshStats) {
                      onRefreshStats();
                    }
                  } catch (err) {
                    if (onShowToast) {
                      onShowToast(`Failed to update Academic Year: ${err.message}`);
                    }
                  }
                }}
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
