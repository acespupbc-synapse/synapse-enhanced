import React, { useState, useEffect } from 'react';
import {
  Cpu,
  ShieldCheck,
  User,
  CalendarBlank,
  Users,
  Trash,
  Database,
  Gear,
  IdentificationCard
} from '@phosphor-icons/react';
import { EditStudentModal } from './views/RegistrationsView';
import { statsApi, studentApi, settingsApi } from '../services/api';
import Footer from './common/Footer';
import './BentoGrid.css';

// ── Utility: format time and date ──────────────────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Person placeholder or photo avatar ─────────────────────────────────────
function PersonAvatar({ size = 50, photoUrl }) {
  if (photoUrl) {
    return (
      <div
        className="feed-avatar-placeholder"
        style={{ width: size, height: size, overflow: 'hidden', borderRadius: '50%', padding: 0 }}
        aria-hidden="true"
      >
        <img
          src={photoUrl}
          alt="Avatar"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }
  return (
    <div
      className="feed-avatar-placeholder"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <IdentificationCard size={size * 0.55} weight="duotone" />
    </div>
  );
}

export default function BentoGrid({ stats, capacity: propCapacity, feed: propFeed, onNavigateTab, onShowToast }) {
  // ── Live Clock ────────────────────────────────────────────────────────────
  const [now, setNow] = useState(new Date());
  const [editingStudent, setEditingStudent] = useState(null);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const time = formatTime(now);
  const date = formatDate(now);

  // ── Dashboard Data (Live from Backend / Supabase) ────────────────────────
  const [internalFeed, setInternalFeed] = useState([]);
  const [internalCapacity, setInternalCapacity] = useState({
    usedRecords: stats?.enrolledCount || 0,
    maxRecords: 500,
    percentage: 2.10,
    storageUsedMb: 10.52,
    storageMaxMb: 500,
  });

  useEffect(() => {
    if (!propFeed) {
      statsApi.getLiveFeed().then((data) => {
        if (Array.isArray(data)) {
          setInternalFeed(
            data.map((item) => ({
              id: item.id,
              name: item.name,
              course: item.course,
              section: `${item.course || ''} ${item.section || ''}`.trim() || '—',
              studentNumber: item.student_number || '',
              photoUrl: item.photo_url || null,
              time: item.time
                ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Recently',
            }))
          );
        }
      }).catch(() => {});
    }

    if (!propCapacity) {
      statsApi.getCapacityMetrics().then((data) => {
        if (data) setInternalCapacity(data);
      }).catch(() => {});
    }
  }, [stats?.enrolledCount, propFeed, propCapacity]);

  const capacity = propCapacity || internalCapacity;
  const liveFeed = propFeed || internalFeed;

  const cpu = stats?.cpuPercent != null ? `${stats.cpuPercent}%` : '0%';
  const apiHealth = stats?.latencyMs != null ? `${stats.latencyMs} ms` : '—';
  const liveUsers = stats?.liveUsers != null ? stats.liveUsers : 0;
  const academicYear = stats?.ayName?.replace(/^AY\s*/i, '') ?? '2026-2027';
  const registrationOpen = stats?.isRegistrationOpen ?? true;

  const handleToggleRegistration = async () => {
    const nextState = !registrationOpen;
    try {
      await settingsApi.toggleRegistration(nextState);
      if (onShowToast) {
        onShowToast(nextState ? 'Registration is now OPEN.' : 'Registration is now CLOSED.');
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(`Failed to toggle registration: ${err.message}`);
      }
    }
  };

  const totalRegistered = stats?.enrolledCount ?? 0;
  const recycleBinCount = String(stats?.recycleBinCount ?? 0).padStart(2, '0');

  const progCounts = stats?.programCounts || {};
  const topPrograms = Object.entries(progCounts).length > 0
    ? Object.entries(progCounts)
        .map(([name, count]) => ({ name, count, max: Math.max(10, count * 2) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
    : [];

  const handleOpenFeedStudent = async (item, idx) => {
    if (item.id && !item.id.startsWith('feed-')) {
      try {
        const fullStudent = await studentApi.getById(item.id);
        if (fullStudent) {
          setEditingStudent({
            id: fullStudent.id,
            name: `${fullStudent.last_name}, ${fullStudent.first_name} ${fullStudent.middle_name || ''}`.trim(),
            firstName: fullStudent.first_name,
            middleName: fullStudent.middle_name || '',
            lastName: fullStudent.last_name,
            studentNumber: fullStudent.student_number,
            email: fullStudent.email,
            course: fullStudent.course_code || item.course || 'BSCpE',
            program: fullStudent.course_code || item.course || 'BSCpE',
            section: fullStudent.section_name || '1-1',
            yearLevel: fullStudent.year_level ? `${fullStudent.year_level}${fullStudent.year_level === 1 ? 'st' : fullStudent.year_level === 2 ? 'nd' : fullStudent.year_level === 3 ? 'rd' : 'th'} Year` : '1st Year',
            org: fullStudent.organization || 'ACES',
            birthdate: fullStudent.birth_date || '',
            residentialAddress: fullStudent.perm_strt || '',
            emergencyContactName: fullStudent.contact_person_name || '',
            emergencyContactNumber: fullStudent.contact_person_number || '',
            emergencyAddress: fullStudent.contact_strt || fullStudent.perm_strt || '',
            photoUrl: fullStudent.photo_url || item.photoUrl || null,
            signatureUrl: fullStudent.signature_url || null,
          });
          return;
        }
      } catch (_) {}
    }

    const parts = (item.section || '').split('|').map((s) => s.trim());
    const sec = parts[0] || '1-1';
    const sNum = item.studentNumber || (parts[1] || '');
    const courseCode = item.course || sec.split(' ')[0] || 'BSIT';

    setEditingStudent({
      id: item.id || 'feed-' + (idx + 1),
      name: item.name,
      studentNumber: sNum,
      course: courseCode,
      program: courseCode,
      section: sec,
      yearLevel: '1st Year',
      org: courseCode === 'BSCpE' || courseCode === 'DCpET' ? 'ACES' : (courseCode === 'BSIT' || courseCode === 'DIT' ? 'IBITS' : 'ACES'),
      birthdate: '2004-05-15',
      residentialAddress: '',
      emergencyContactName: '',
      emergencyContactNumber: '',
      emergencyAddress: '',
      photoUrl: item.photoUrl || null,
      signatureUrl: null
    });
  };

  const programRegistrations = [
    {
      code: 'ACES',
      logo: '/img/orgs/aces.png',
      header: '/img/orgs/aces_header.png',
      sections: [
        { name: 'BSCpE', count: progCounts['BSCpE'] || 0 },
        { name: 'DCpET', count: progCounts['DCpET'] || 0 },
      ],
    },
    {
      code: 'IBITS',
      logo: '/img/orgs/ibits.png',
      header: '/img/orgs/ibits_header.png',
      sections: [
        { name: 'BSIT', count: progCounts['BSIT'] || 0 },
        { name: 'DIT', count: progCounts['DIT'] || 0 },
      ],
    },
    {
      code: 'PIIE',
      logo: '/img/orgs/piie.png',
      header: '/img/orgs/piie_header.png',
      sections: [
        { name: 'BSIE', count: progCounts['BSIE'] || 0 },
      ],
    },
    {
      code: 'HRSS',
      logo: '/img/orgs/hrss.png',
      header: '/img/orgs/hrss_header.png',
      sections: [
        { name: 'BSBA-HRM', count: progCounts['BSBA-HRM'] || 0 },
      ],
    },
    {
      code: 'SMS',
      logo: '/img/orgs/sms.png',
      header: '/img/orgs/sms_header.png',
      sections: [
        { name: 'BSPSY', count: progCounts['BSPSY'] || 0 },
      ],
    },
    {
      code: 'YES',
      logo: '/img/orgs/yes.png',
      header: '/img/orgs/yes_header.png',
      sections: [
        { name: 'BSED-ENG', count: progCounts['BSED-ENG'] || 0 },
        { name: 'BSED-SS', count: progCounts['BSED-SS'] || 0 },
        { name: 'BEED', count: progCounts['BEED'] || 0 },
      ],
    },
  ];

  return (
    <main className="dashboard-main" role="main">
      <h1 className="dashboard-page-title">Dashboard</h1>

      {/* ── Header Metric Row ──────────────────────────────────────────────── */}
      <div className="dashboard-header-row">

        {/* Clock & System Card */}
        <div className="metric-card clock-system-card">
          <div className="clock-section">
            <h2 className="clock-time">{time}</h2>
            <p className="clock-date">{date}</p>
          </div>
          <div className="clock-divider" />
          <div className="system-section">
            <div className="sys-stat">
              <Cpu size={15} weight="fill" />
              <span>CPU:</span>
              <strong>{cpu}</strong>
            </div>
            <div className="sys-stat">
              <ShieldCheck size={15} weight="fill" />
              <span>API Health:</span>
              <strong>{apiHealth}</strong>
            </div>
          </div>
        </div>

        {/* Live Users Card */}
        <div className="metric-card small-metric-card">
          <span className="metric-label">Live Users:</span>
          <div className="metric-value-row">
            <User size={26} weight="fill" />
            <span className="metric-big-num">{liveUsers}</span>
          </div>
        </div>

        {/* Academic Year Card */}
        <div className="metric-card small-metric-card">
          <span className="metric-label">Academic Year:</span>
          <div className="metric-value-row">
            <CalendarBlank size={26} weight="fill" />
            <span className="metric-big-num">{academicYear}</span>
          </div>
        </div>

        {/* Registration Status Indicator Card — display only, not toggleable (Bug 6) */}
        <div className="metric-card toggle-metric-card">
          <span className="metric-label">Registration:</span>
          <div className="status-badge-container">
            <div
              className={`custom-toggle ${registrationOpen ? 'open' : 'closed'}`}
              title={registrationOpen ? 'Registration is OPEN' : 'Registration is CLOSED'}
              aria-label={`Registration is currently ${registrationOpen ? 'open' : 'closed'}`}
            >
              <span className="toggle-text">{registrationOpen ? 'OPEN' : 'CLOSED'}</span>
              <span className="toggle-knob" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────────────── */}
      <div className="dashboard-grid">

        {/* LEFT COLUMN */}
        <div className="grid-col grid-col-left">

          {/* Total Registered */}
          <div className="panel-card total-registered-card">
            <div className="total-reg-content">
              <div className="total-reg-icon">
                <Users size={30} weight="fill" />
              </div>
              <div className="total-reg-text">
                <span className="panel-label">Total registered:</span>
                <span className="total-reg-num">{totalRegistered}</span>
              </div>
            </div>
            <button
              className="recycle-bin-row action-btn-hover"
              onClick={() => onNavigateTab && onNavigateTab('recycle')}
              title="Open Recycle Bin"
            >
              <div className="recycle-left">
                <Trash size={14} weight="fill" />
                <span>Recycle Bin:</span>
              </div>
              <span className="recycle-count">{recycleBinCount}</span>
            </button>
          </div>

          {/* Top 4 Programs */}
          <div className="panel-card top-programs-card">
            <h3 className="panel-title">Top Programs:</h3>
            <div className="programs-bar-list">
              {topPrograms.length > 0 ? (
                topPrograms.map((prog) => (
                  <div className="prog-bar-item" key={prog.name}>
                    <span className="prog-name">{prog.name}</span>
                    <div className="prog-bar-track">
                      <div
                        className="prog-bar-fill"
                        style={{ width: `${Math.min(100, (prog.count / (prog.max || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="prog-count">{prog.count}</span>
                  </div>
                ))
              ) : (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', padding: '16px 0', textAlign: 'center' }}>
                  No program enrollments yet
                </div>
              )}
            </div>
          </div>

          {/* Database Capacity */}
          <div className="panel-card supabase-card">
            <span className="panel-label">Database Capacity:</span>
            <div className="supabase-content">
              <div className="supa-icon-group">
                <Database size={44} weight="fill" color="#FFFFFF" />
                <Gear size={18} weight="fill" className="supa-gear" />
              </div>
              <div className="supa-stats">
                <span className="supa-percent">{Number(capacity.percentage || 0).toFixed(2)}%</span>
                <div className="supa-bar-discrete">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className={`discrete-line ${i < Math.max(1, Math.round(((capacity.percentage || 0.2) / 100) * 20)) ? 'active' : ''}`} />
                  ))}
                </div>
                <span className="supa-volume">{Number(capacity.storageUsedMb || 0).toFixed(2)} MB / {capacity.storageMaxMb || 500} MB</span>
              </div>
            </div>
          </div>

        </div>

        {/* CENTER COLUMN */}
        <div className="grid-col grid-col-center">
          <div className="panel-card feed-card">
            <h3 className="panel-title">Live Registration Feed:</h3>
            <div className="feed-list-scroll">
              <div className="feed-list">
                {liveFeed.length > 0 ? (
                  liveFeed.map((item, idx) => (
                    <div
                      className="feed-item"
                      key={item.id || idx}
                      onClick={() => handleOpenFeedStudent(item, idx)}
                      style={{ cursor: 'pointer' }}
                    >
                      <PersonAvatar size={48} photoUrl={item.photoUrl} />
                      <div className="feed-info">
                        <h4 className="feed-name">{item.name}</h4>
                        <p className="feed-section">{item.section}</p>
                        <p className="feed-time">Registered <strong>{item.time}</strong></p>
                        <button
                          className="btn-view-edit"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFeedStudent(item, idx);
                          }}
                        >
                          View / Edit
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    <Users size={36} weight="thin" style={{ opacity: 0.5, marginBottom: 8 }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>No live registrations yet</p>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 4 }}>New student registrations will appear here in real-time.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="grid-col grid-col-right">
          <div className="panel-card program-regs-card">
            <h3 className="panel-title">Total Registrations By Program:</h3>
            <div className="program-cards-list-scroll">
              <div className="program-cards-list">
                {programRegistrations.map((prog) => (
                  <div
                    className="prog-banner-card action-btn-hover"
                    key={prog.code}
                    style={{ backgroundImage: `url(${prog.header})`, cursor: 'pointer' }}
                    onClick={() => onNavigateTab && onNavigateTab('registrations', prog.sections[0]?.name)}
                    title={`View ${prog.code} Registrations`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onNavigateTab && onNavigateTab('registrations', prog.sections[0]?.name);
                      }
                    }}
                  >
                    <div className="prog-banner-overlay" />
                    <img src={prog.logo} alt={prog.code} className="prog-banner-logo" />
                    <div className="prog-sections-wrap">
                      <div className="prog-sections-row">
                        {prog.sections.slice(0, 2).map((sec, idx) => (
                          <div
                            className="prog-section-pill"
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateTab && onNavigateTab('registrations', sec.name);
                            }}
                            title={`View ${sec.name} Registrations`}
                          >
                            <span className="sec-name">{sec.name}</span>
                            <span className="sec-count-box">
                              <Users size={11} weight="fill" /> {sec.count}
                            </span>
                          </div>
                        ))}
                      </div>
                      {prog.sections.length > 2 && (
                        <div className="prog-sections-row">
                          {prog.sections.slice(2, 4).map((sec, idx) => (
                            <div
                              className="prog-section-pill"
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateTab && onNavigateTab('registrations', sec.name);
                              }}
                              title={`View ${sec.name} Registrations`}
                            >
                              <span className="sec-name">{sec.name}</span>
                              <span className="sec-count-box">
                                <Users size={11} weight="fill" /> {sec.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Dashboard Footer Bar ────────────────────────────────────────────── */}
      <Footer />

      {/* Edit Student Record Modal when clicked from Live Feed */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={(updated) => {
            if (onShowToast) {
              onShowToast(`Student record for ${updated.name} successfully updated!`);
            }
            setEditingStudent(null);
            statsApi.getLiveFeed().then((data) => {
              if (Array.isArray(data)) {
                setLiveFeed(
                  data.map((item) => ({
                    id: item.id,
                    name: item.name,
                    course: item.course,
                    section: `${item.course || ''} ${item.section || ''}`.trim() || '—',
                    studentNumber: item.student_number || '',
                    photoUrl: item.photo_url || null,
                    time: item.time
                      ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Recently',
                  }))
                );
              }
            }).catch(() => {});
          }}
          onShowToast={onShowToast}
        />
      )}
    </main>
  );
}
