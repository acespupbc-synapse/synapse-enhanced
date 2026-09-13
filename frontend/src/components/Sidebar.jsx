import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  isOpenMobile,
  setIsOpenMobile,
  onLogout,
  onOpenRegistration
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'dashboard',     path: '/dashboard',     label: 'Dashboard',         icon: House },
    { id: 'registrations', path: '/registrations', label: 'Registrations',     icon: Users },
    { id: 'programs',      path: '/programs',      label: 'Academic Programs', icon: GraduationCap },
    { id: 'recycle',       path: '/recycle-bin',   label: 'Recycle Bin',       icon: Trash },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    if (setIsOpenMobile) {
      setIsOpenMobile(false);
    }
  };

  const isItemActive = (item) => {
    if (item.path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(item.path);
  };

  const isSettingsActive = location.pathname.startsWith('/settings');

  return (
    <>
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div className="mobile-header-brand">
          <img src="/img/logo/synapse-banner.png" alt="ACES Synapse" className="mobile-banner-img" />
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
          <img
            src="/img/logo/synapse-banner.png"
            alt="ACES Synapse"
            className="sidebar-brand-banner"
          />
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-nav" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-item-icon">
                  <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                </span>
                <span className="nav-item-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="sidebar-actions">
          <button
            className="btn-sidebar-primary"
            onClick={onOpenRegistration || (() => navigate('/register'))}
            title="Open Student Registration Portal"
          >
            <UserPlus size={20} />
            <span>Student Registration</span>
          </button>
          
          <button className="btn-sidebar-danger" onClick={onLogout || (() => { localStorage.removeItem('synapse_auth_token'); navigate('/login'); })}>
            <SignOut size={20} />
            <span>Logout</span>
          </button>
        </div>

        <div className="sidebar-spacer" />

        {/* Settings Footer */}
        <div className="sidebar-footer">
          <button
            className={`nav-item ${isSettingsActive ? 'active' : ''}`}
            onClick={() => handleNavClick('/settings')}
          >
            <span className="nav-item-icon">
              <Gear size={20} weight={isSettingsActive ? 'fill' : 'regular'} />
            </span>
            <span className="nav-item-label">Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
