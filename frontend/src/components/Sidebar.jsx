import React from 'react';
import {
  Activity,
  Layers,
  Building2,
  Bed,
  Pill,
  Users,
  Bell,
  ArrowRightLeft,
  Cpu,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  UserCheck,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ROLE_HOME } from '../context/roleConfig';

export const Sidebar = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const {
    currentPhc,
    currentRole,
    setCurrentRole,
    alerts,
    phcs,
    currentPhcId,
    setCurrentPhcId,
    getUserNameForRole,
    getRoleTitle,
    isOffline,
    isEvaluationMode,
    canAccessTab,
    signOut
  } = useApp();

  const activeAlertsCount = alerts.filter((a) => a.status === 'Active').length;
  const pendingPhcCount = phcs.filter((p) => p.status === 'Pending Verification').length;

  const handleNavClick = (tabKey) => {
    setActiveTab(tabKey);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const allGroups = [
    {
      groupTitle: '1 · Setup',
      items: [
        {
          key: 'auth',
          label: 'Onboarding & Verification',
          tamilLabel: 'மைய பதிவு & ஒப்புதல்',
          icon: Building2,
          badge: pendingPhcCount > 0 ? { count: pendingPhcCount, type: 'warning' } : null
        }
      ]
    },
    {
      groupTitle: '2 · Overview',
      items: [
        { key: 'dashboard', label: 'Network Operations', tamilLabel: 'பி.எச்.சி வரைபடம்', icon: Layers, badge: null },
        { key: 'phc-details', label: 'PHC Facility Details', tamilLabel: 'மைய விவரங்கள்', icon: Building2, badge: null }
      ]
    },
    {
      groupTitle: '3 · Daily Work',
      items: [
        { key: 'attendance', label: 'Staff Duty & Attendance', tamilLabel: 'பணியாளர் வருகை', icon: Users, badge: null },
        { key: 'medicines', label: 'Medicine Check-In/Out', tamilLabel: 'மருந்து சரிபார்ப்பு', icon: Pill, badge: null },
        { key: 'resources', label: 'Beds & Resources', tamilLabel: 'படுக்கைகள் & இருப்பு', icon: Bed, badge: null }
      ]
    },
    {
      groupTitle: '4 · Insights',
      items: [
        {
          key: 'alerts',
          label: 'Notifications & Alerts',
          tamilLabel: 'எச்சரிக்கைகள்',
          icon: Bell,
          badge: activeAlertsCount > 0 ? { count: activeAlertsCount, type: 'danger' } : null
        },
        { key: 'forecast', label: 'Demand Forecast', tamilLabel: 'தேவை கணிப்பு', icon: Sparkles, badge: null }
      ]
    },
    {
      groupTitle: '5 · Action',
      items: [
        { key: 'transfers', label: 'Resource Transfers Hub', tamilLabel: 'பரிமாற்ற கோரிக்கைகள்', icon: ArrowRightLeft, badge: null }
      ]
    },
    {
      groupTitle: '6 · Records',
      items: [
        { key: 'reports', label: 'Activity History & Audit', tamilLabel: 'அறிக்கைகள் & தணிக்கை', icon: FileText, badge: null },
        { key: 'federated', label: 'Federated Learning (Demo)', tamilLabel: 'கூட்டு நுண்ணறிவு', icon: Cpu, badge: null }
      ]
    }
  ];

  // Only show what this role can open; hide empty groups
  const navGroups = allGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => canAccessTab(i.key)) }))
    .filter((g) => g.items.length > 0);

  const isRailCollapsed = isCollapsed && !isMobileOpen;

  return (
    <aside
      className={`app-sidebar ${isRailCollapsed ? 'collapsed' : 'expanded'} ${
        isMobileOpen ? 'mobile-open' : ''
      }`}
      aria-label="Application Module Navigation"
    >
      {/* Sidebar Header: Brand Logo & Title */}
      <div className="sidebar-header">
        <div className="sidebar-brand-lockup" onClick={() => handleNavClick(ROLE_HOME[currentRole] || 'dashboard')} role="button" tabIndex={0}>
          <div className="sidebar-brand-icon">
            <Activity size={22} className="text-primary-glow" />
          </div>
          {!isRailCollapsed && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">In One Hand</span>
              <span className="sidebar-brand-tamil">ஒரு கையில்</span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Button */}
        {!isMobileOpen && (
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}

        {/* Mobile / Drawer Close Button */}
        {isMobileOpen && (
          <button
            type="button"
            className="sidebar-mobile-close-btn"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close Sidebar"
            title="Close Navigation Menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Active Node Card (when expanded) */}
      {!isRailCollapsed && (
        <div className="sidebar-node-card">
          <div className="node-card-top">
            <div className="node-indicator-dot online"></div>
            <span className="node-district-label">{currentPhc?.district || 'Chengalpattu'}</span>
            <span className={`node-status-pill ${currentPhc?.status === 'Pending Verification' ? 'pending' : 'active'}`}>
              {currentPhc?.status === 'Pending Verification' ? 'Pending' : 'Active Node'}
            </span>
          </div>
          <div className="node-facility-name" title={currentPhc?.name}>
            {currentPhc?.name || 'Medavakkam Community PHC'}
          </div>
          <select
            className="sidebar-node-select"
            value={currentPhcId}
            onChange={(e) => setCurrentPhcId(e.target.value)}
            title="Switch Active PHC Node"
          >
            {phcs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.status === 'Pending Verification' ? '(Pending)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation Group Items */}
      <nav className="sidebar-nav-container">
        {navGroups.map((group) => (
          <div key={group.groupTitle} className="sidebar-nav-group">
            {!isRailCollapsed && (
              <div className="sidebar-nav-group-title">{group.groupTitle}</div>
            )}
            <div className="sidebar-nav-group-items">
              {group.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.key;

                return (
                  <button
                    key={item.key}
                    data-tab={item.key}
                    type="button"
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.key)}
                    title={isRailCollapsed ? `${item.label} (${item.tamilLabel})` : undefined}
                  >
                    <div className="sidebar-item-icon-wrap">
                      <IconComponent size={18} />
                      {isRailCollapsed && item.badge && (
                        <span className={`sidebar-collapsed-dot ${item.badge.type}`} />
                      )}
                    </div>

                    {!isRailCollapsed && (
                      <div className="sidebar-item-content">
                        <span className="sidebar-item-label">{item.label}</span>
                        <span className="sidebar-item-sublabel">{item.tamilLabel}</span>
                      </div>
                    )}

                    {!isRailCollapsed && item.badge && (
                      <span className={`sidebar-item-badge ${item.badge.type}`}>
                        {item.badge.count}
                      </span>
                    )}

                    {isActive && <div className="sidebar-active-indicator" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer: Current User / Persona Profile */}
      <div className="sidebar-footer">
        {!isRailCollapsed && isEvaluationMode && (
          <div className="demo-role-switcher-header">
            <span className="demo-role-badge">DEMO ROLE SWITCHER (For Evaluation)</span>
          </div>
        )}
        <div className="sidebar-user-card" title={`Logged in as ${getUserNameForRole(currentRole)} (${getRoleTitle(currentRole)})`}>
          <div className="sidebar-user-avatar">
            <UserCheck size={16} />
            <span className={`sidebar-user-status-dot ${isOffline ? 'offline' : 'online'}`} />
          </div>
          {!isRailCollapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{getUserNameForRole(currentRole)}</span>
              {isEvaluationMode ? (
                <select
                  className="sidebar-role-select"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  title="Switch User Role (Demo Evaluation)"
                >
                  <option value="phc_staff">PHC Staff (Clinical &amp; Bed Ops)</option>
                  <option value="phc_admin">PHC Administrator (Own Centre)</option>
                  <option value="district_officer">District Health Officer (Transfers)</option>
                  <option value="platform_admin">Platform Administrator (Global / Onboarding)</option>
                </select>
              ) : (
                <span className="sidebar-user-role-badge">{getRoleTitle(currentRole)}</span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="sidebar-nav-item sidebar-signout-btn"
          onClick={signOut}
          title="Sign out"
        >
          <div className="sidebar-item-icon-wrap"><LogOut size={18} /></div>
          {!isRailCollapsed && (
            <div className="sidebar-item-content">
              <span className="sidebar-item-label">Sign Out</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
