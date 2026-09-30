import React from 'react';
import {
  Bell,
  CheckSquare,
  Building2,
  Languages,
  RotateCcw,
  Layers,
  Pill,
  Bed,
  Users,
  ArrowRightLeft,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Cpu,
  Menu,
  SlidersHorizontal
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header = ({
  onOpenChecklist,
  _onOpenOnboarding,
  _onOpenAlerts,
  activeTab,
  setActiveTab,
  onToggleMobileSidebar,
  onToggleCollapse,
  isSidebarCollapsed
}) => {
  const {
    phcs,
    currentPhcId,
    setCurrentPhcId,
    currentPhc,
    language,
    setLanguage,
    alerts,
    resetToDefaultData,
    isEvaluationMode,
    toggleEvaluationMode
  } = useApp();

  const activeAlertsCount = alerts.filter((a) => a.status === 'Active').length;

  const getTabInfo = (tab) => {
    switch (tab) {
      case 'dashboard':
        return { label: 'Network Operations', icon: Layers, tamil: 'நெட்வொர்க் செயல்பாடுகள்' };
      case 'phc-details':
        return { label: 'PHC Facility Details & Inventory', icon: Building2, tamil: 'மைய விவரங்கள்' };
      case 'resources':
        return { label: 'Beds & Unified Resources', icon: Bed, tamil: 'படுக்கைகள் & இருப்பு' };
      case 'medicines':
        return { label: 'Medicine Check-In / Out', icon: Pill, tamil: 'மருந்து க்யூஆர் சரிபார்ப்பு' };
      case 'attendance':
        return { label: 'Staff Duty Roster & QR Attendance', icon: Users, tamil: 'பணியாளர் வருகை க்யூஆர்' };
      case 'alerts':
        return { label: 'Notifications & Action Queue', icon: Bell, tamil: 'எச்சரிக்கைகள்' };
      case 'transfers':
        return { label: 'Resource Transfers Hub', icon: ArrowRightLeft, tamil: 'பரிமாற்ற கோரிக்கைகள்' };
      case 'forecast':
        return { label: 'Demand Forecast & Stock Resilience', icon: Sparkles, tamil: 'தேவை கணிப்பு' };
      case 'federated':
        return { label: 'Federated Learning AI (Architecture Showcase)', icon: Cpu, tamil: 'கூட்டு செயற்கை நுண்ணறிவு' };
      case 'reports':
        return { label: 'Activity History & Audit Ledger', icon: FileText, tamil: 'அறிக்கைகள் & தணிக்கை' };
      case 'auth':
        return { label: 'PHC Facility Onboarding & Verification', icon: Building2, tamil: 'மைய பதிவு & ஒப்புதல்' };
      default:
        return { label: 'Network Operations Console', icon: Layers, tamil: 'பி.எச்.சி வரைபடம்' };
    }
  };

  const currentTabInfo = getTabInfo(activeTab);
  const ActiveIcon = currentTabInfo.icon;

  return (
    <header className="app-header">
      {/* Top Utility & Navigation Status Bar */}
      <div className="header-top">
        <div className="header-left-cluster">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            type="button"
            className="btn-icon-subtle btn-sidebar-mobile-toggle"
            onClick={onToggleMobileSidebar}
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu size={18} />
          </button>

          {/* Desktop Sidebar Rail Toggle */}
          <button
            type="button"
            className="btn-icon-subtle btn-sidebar-collapse-toggle"
            onClick={onToggleCollapse}
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Active Module Breadcrumb / Header Title */}
          <div className="header-breadcrumb-lockup">
            <div className="header-active-icon-pill">
              <ActiveIcon size={16} />
            </div>
            <div>
              <div className="header-active-title-row">
                <h2 className="header-active-title">{currentTabInfo.label}</h2>
              </div>
              <p className="header-active-subtitle">
                {language === 'ta'
                  ? currentTabInfo.tamil
                  : activeTab === 'dashboard'
                  ? 'Multi-centre capacity & resource monitoring'
                  : 'Primary Health Centre Network Operations (Demo Data)'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Utilities */}
        <div className="header-actions">
          {/* Demo Data Indicator */}
          <span className="demo-data-badge" title="Evaluation prototype with simulated clinical and operational demo data. Not connected to live PHC hardware or government systems.">
            Demo Data
          </span>

          {/* Active PHC Selector */}
          <div className="phc-selector-group">
            <Building2 size={14} className="text-muted" />
            <select
              className="select-phc"
              value={currentPhcId}
              onChange={(e) => setCurrentPhcId(e.target.value)}
              title="Active Primary Health Centre"
            >
              {phcs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.district}) {p.status === 'Pending Verification' ? '⏳ PENDING' : '✓'}
                </option>
              ))}
            </select>
            {currentPhc?.status === 'Pending Verification' && (
              <span className="badge badge-warning">Pending</span>
            )}
          </div>

          {/* Language Toggle */}
          <button
            type="button"
            className="btn-pill"
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            title="Toggle Language"
          >
            <Languages size={14} />
            <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            className="btn-icon-relative"
            onClick={() => setActiveTab('alerts')}
            title="View Active Notifications and Alerts"
          >
            <Bell size={17} />
            {activeAlertsCount > 0 && (
              <span className="badge-notification-count">{activeAlertsCount}</span>
            )}
          </button>

          {/* Explicit Demo / Evaluation Mode Toggle */}
          <button
            type="button"
            className={`btn-eval-mode-toggle ${isEvaluationMode ? 'active' : ''}`}
            onClick={toggleEvaluationMode}
            title={
              isEvaluationMode
                ? 'Evaluation Mode is active. Click to switch to Normal User Mode.'
                : 'Normal User Mode. Click to enable Evaluation Mode (reveals role switcher, checklist, sample reset).'
            }
          >
            <SlidersHorizontal size={13} />
            <span>{isEvaluationMode ? 'Evaluation: ON' : 'Evaluation: OFF'}</span>
          </button>

          {/* Demo Success Checklist Launcher (Evaluation Mode Only) */}
          {isEvaluationMode && (
            <button
              type="button"
              className="btn btn-checklist btn-sm"
              onClick={onOpenChecklist}
              title="Open Demo Success Checklist (Evaluation Mode)"
            >
              <CheckSquare size={14} />
              <span>Checklist</span>
            </button>
          )}

          {/* Reset Demo Data (Evaluation Mode Only) */}
          {isEvaluationMode && (
            <button
              type="button"
              className="btn-icon-subtle"
              onClick={resetToDefaultData}
              title="Reset to clean prototype sample data (Evaluation Mode)"
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
