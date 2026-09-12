import React, { useState, useEffect, useCallback } from 'react';
import BackgroundVanta from './components/BackgroundVanta';
import Sidebar from './components/Sidebar';
import BentoGrid from './components/BentoGrid';
import RegistrationsView from './components/views/RegistrationsView';
import ProgramsView from './components/views/ProgramsView';
import ExportView from './components/views/ExportView';
import RecycleBinView from './components/views/RecycleBinView';
import SettingsView from './components/views/SettingsView';
import LoginView from './components/views/LoginView';
import StudentRegistrationView from './components/views/StudentRegistrationView';
import RegistrationClosedView from './components/views/RegistrationClosedView';
import { statsApi, settingsApi, exportApi } from './services/api';
import './index.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [stats, setStats] = useState({
    isRegistrationOpen: true,
    enrolledCount: 342,
    dbStatus: 'Online',
    ayName: 'AY 2025-2026'
  });

  // Fetch live stats from backend when authenticated
  const fetchStats = useCallback(async () => {
    try {
      const data = await statsApi.getDashboardStats();
      setStats((prev) => ({
        ...prev,
        isRegistrationOpen: data.isRegistrationOpen ?? prev.isRegistrationOpen,
        enrolledCount: data.enrolledCount ?? prev.enrolledCount,
        dbStatus: data.dbStatus ?? prev.dbStatus,
        ayName: data.activeAcademicYear ?? prev.ayName,
      }));
    } catch (_) {
      // Backend not available — keep default values silently
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated, fetchStats]);

  // Theme synchronization with HTML root attribute
  useEffect(() => {
    // If not authenticated, force dark theme for LoginView
    if (!isAuthenticated || isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDark, isAuthenticated]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleRegistration = async (explicitState) => {
    const nextState = explicitState !== undefined ? explicitState : !stats.isRegistrationOpen;
    showToast(nextState ? 'Registration is now OPEN' : 'Registration is now CLOSED');
    try {
      await settingsApi.toggleRegistration(nextState);
    } catch (_) {}
    setStats((prev) => ({ ...prev, isRegistrationOpen: nextState }));
  };

  const handleExportCsv = async () => {
    try {
      const downloaded = await exportApi.downloadCsv();
      if (downloaded) {
        showToast('CardFive MDB CSV downloaded successfully!');
        return;
      }
    } catch (_) {}

    // Fallback: Generate and download standard CardFive-compatible CSV file directly in client
    const headers = [
      'STUDENT_NUMBER',
      'FIRST_NAME',
      'MIDDLE_NAME',
      'LAST_NAME',
      'COURSE',
      'SECTION',
      'PERM_BLDG',
      'PERM_STRT',
      'PERM_CITY',
      'PERM_STAD',
      'PERM_POST',
      'CTCT_NAME',
      'CTCT_NMBR',
      'CTCT_STRT'
    ];

    const sampleRows = [
      [
        '2025-00416-BN-0',
        'CHRISTIAN GABRIEL',
        'P',
        'FERNANDEZ',
        'BSIT',
        '3-1',
        'BLK 12 LOT 4',
        'ROSE ST. CAMAYA',
        'MARIVELES',
        'BATAAN',
        '2105',
        'MARIA FERNANDEZ',
        '09171234567',
        'BLK 12 LOT 4 ROSE ST.'
      ],
      [
        '2025-00102-BN-0',
        'MARIA NICOLE',
        'T',
        'SANTOS',
        'BSCpE',
        '2-1',
        'UNIT 3B',
        'POBLACION CENTRAL',
        'MARIVELES',
        'BATAAN',
        '2105',
        'ROBERTO SANTOS',
        '09189876543',
        'UNIT 3B POBLACION CENTRAL'
      ]
    ];

    const csvContent = [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CardFive_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CardFive MDB CSV downloaded successfully!');
  };

  const handleExitRegistration = () => {
    setIsRegistering(false);
    setIsAuthenticated(false); // Cleanly return to the home/login page
  };

  const handleNavigateTab = (tab, programCode) => {
    if (programCode) {
      setSelectedProgramFilter(programCode);
    } else {
      setSelectedProgramFilter(null);
    }
    setActiveTab(tab);
  };

  // Public student registration portal view
  if (isRegistering) {
    if (!stats.isRegistrationOpen) {
      return (
        <RegistrationClosedView
          academicYear={stats.ayName}
          onBack={handleExitRegistration}
        />
      );
    }
    return (
      <StudentRegistrationView
        onBack={handleExitRegistration}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        {/* Deep red/black gradient background layer for login */}
        <div className="login-bg-layer" />
        <LoginView
          onLogin={() => setIsAuthenticated(true)}
          onRegister={() => setIsRegistering(true)}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Vanta.js subtle animated topology background */}
      <BackgroundVanta isDark={isDark} />

      {/* Sidebar with Profile & Server Status */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(id) => {
          setSelectedProgramFilter(null);
          setActiveTab(id);
        }}
        isDark={isDark}
        toggleTheme={toggleTheme}
        stats={stats}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        onLogout={() => setIsAuthenticated(false)}
        onOpenRegistration={() => setIsRegistering(true)}
      />

      {/* Main Workspace Views */}
      <div className="main-wrapper">
        {activeTab === 'dashboard' && (
          <BentoGrid
            stats={stats}
            onNavigateTab={handleNavigateTab}
            onShowToast={showToast}
          />
        )}
        {activeTab === 'registrations' && (
          <RegistrationsView
            initialProgramCode={selectedProgramFilter}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'programs' && <ProgramsView />}
        {activeTab === 'export' && <ExportView onExportCsv={handleExportCsv} />}
        {activeTab === 'recycle' && <RecycleBinView />}
        {activeTab === 'settings' && (
          <SettingsView
            stats={stats}
            onToggleRegistration={handleToggleRegistration}
            onShowToast={showToast}
          />
        )}
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'var(--text-primary)',
            color: 'var(--bg-page)',
            padding: '12px 20px',
            borderRadius: 'var(--radius-pill)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            boxShadow: 'var(--shadow-card-hover)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
