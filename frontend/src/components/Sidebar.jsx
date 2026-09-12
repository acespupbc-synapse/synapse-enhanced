import React from 'react';
import {
  House,
  Users,
  GraduationCap,
  Trash,
  Gear,
  UserPlus,
  SignOut,
  List,
  X
} from '@phosphor-icons/react';
import './Sidebar.css';

export default function Sidebar({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
  onLogout,
  onOpenRegistration
}) {
  const navItems = [
    { id: 'dashboard',     label: 'Dashboard',        icon: House },
    { id: 'registrations', label: 'Registrations',    icon: Users },
    { id: 'programs',      label: 'Academic Programs', icon: GraduationCap },
    { id: 'recycle',       label: 'Recycle Bin',       icon: Trash },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setIsOpenMobile) {
      setIsOpenMobile(false);
    }
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div className="mobile-header-brand">
          <img src="/img/orgs/aces.png" alt="ACES Logo" className="mobile-logo" />
          <span className="mobile-title">ACES Synapse</span>
        </div>
        <button
          className="mobile-hamburger"
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          aria-label={isOpenMobile ? 'Close menu' : 'Open menu'}
        >
          {isOpenMobile ? <X size={26} /> : <List size={26} />}
        </button>
      </header>

      {/* Backdrop for Mobile Drawer */}
      <div
        className={`sidebar-backdrop ${isOpenMobile ? 'active' : ''}`}
        onClick={() => setIsOpenMobile(false)}
        aria-hidden="true"
      />

      {/* Sidebar Container */}
      <aside className={`sidebar-container ${isOpenMobile ? 'open' : ''}`}>
        
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <img src="/img/orgs/aces.png" alt="ACES Logo" className="sidebar-brand-logo" />
          <h2 className="sidebar-brand-title">
            <span className="brand-white">ACES</span> <span className="brand-amber">Synapse</span>
          </h2>
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-nav" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-item-icon">
                  <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="sidebar-actions">
          <button
            className="btn-sidebar-primary"
            onClick={onOpenRegistration}
            title="Open Student Registration Portal"
          >
            <UserPlus size={20} />
            <span>Student Registration</span>
          </button>
          
          <button className="btn-sidebar-danger" onClick={onLogout}>
            <SignOut size={20} />
            <span>Logout</span>
          </button>
        </div>

        <div className="sidebar-spacer" />

        {/* Settings Footer */}
        <div className="sidebar-footer">
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
          >
            <span className="nav-item-icon">
              <Gear size={20} weight={activeTab === 'settings' ? 'fill' : 'regular'} />
            </span>
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
