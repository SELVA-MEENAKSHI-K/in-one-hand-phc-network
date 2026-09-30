import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AuthScreen } from './components/AuthScreen';
import { SignInScreen } from './components/SignInScreen';
import { NetworkDashboard } from './components/NetworkDashboard';
import { PHCDetails } from './components/PHCDetails';
import { MedicineManagement } from './components/MedicineManagement';
import { UnifiedResources } from './components/UnifiedResources';
import { StaffAttendance } from './components/StaffAttendance';
import { DemandForecast } from './components/DemandForecast';
import { TransfersHub } from './components/TransfersHub';
import { AlertsCenter } from './components/AlertsCenter';
import { ReportsAudit } from './components/ReportsAudit';
import { FederatedLearningView } from './components/FederatedLearningView';
import { OnboardingModal } from './components/OnboardingModal';
import { DemoChecklistModal } from './components/DemoChecklistModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  AlertCircle,
  CheckCircle,
  Info,
  X,
  QrCode,
  Bell,
  Layers,
  Pill,
  ArrowRightLeft,
  Users
} from 'lucide-react';

function MainApp() {
  const {
    toast,
    viewportMode,
    activeTab,
    setActiveTab,
    alerts,
    isSignedIn,
    canAccessTab
  } = useApp();

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [transferPreFill, setTransferPreFill] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isScanChooserOpen, setIsScanChooserOpen] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 640
  );

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeAlertsCount = alerts.filter((a) => a.status === 'Active').length;

  // Step 1 of the flow: nobody sees the app shell before signing in
  if (!isSignedIn) {
    return (
      <>
        <SignInScreen />
        {toast && (
          <div className={`floating-toast ${toast.type}`}>
            <span className="toast-text">{toast.message}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="app-viewport-shell fluid">
      {/* Mobile drawer backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} ${isMobileSidebarOpen ? 'mobile-menu-open' : ''}`}>
        {/* Modern Side Navigation Bar containing ALL modules */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />

        {/* Main Content Area (Header + Module View) */}
        <div className="app-main-wrapper">
          {/* Top Header & Context Utilities */}
          <Header
            onOpenChecklist={() => setIsChecklistOpen(true)}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onOpenAlerts={() => setIsAlertsModalOpen(true)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isSidebarCollapsed={isSidebarCollapsed}
          />

          {/* Main Tab Content — All Modules protected by ErrorBoundary */}
          <main className="app-main-content">
            <ErrorBoundary key={activeTab} moduleTitle={`Tab: ${activeTab.toUpperCase()}`}>
              {/* Setup: PHC Onboarding & Verification (admin roles only; role guard redirects others) */}
              {activeTab === 'auth' && canAccessTab('auth') && (
                <AuthScreen setActiveTab={setActiveTab} />
              )}

              {/* Screen 2: PHC Network Dashboard */}
              {activeTab === 'dashboard' && (
                <NetworkDashboard
                  setActiveTab={setActiveTab}
                  onSelectPhc={() => {
                    setActiveTab('phc-details');
                  }}
                />
              )}

              {/* Screen 3: PHC Details and Resource Availability */}
              {activeTab === 'phc-details' && (
                <PHCDetails setActiveTab={setActiveTab} />
              )}

              {/* Screen 4: Medicine QR Check-In and Check-Out */}
              {activeTab === 'medicines' && <MedicineManagement />}

              {/* Screen 5: Staff Attendance QR */}
              {activeTab === 'attendance' && <StaffAttendance />}

              {/* Screen 6: Notifications and Alerts */}
              {activeTab === 'alerts' && (
                <AlertsCenter
                  setActiveTab={setActiveTab}
                  onOpenTransferModal={() => setActiveTab('transfers')}
                  onPreFillTransfer={(data) => setTransferPreFill(data)}
                />
              )}

              {/* PHC Network Communication and Transfer Requests */}
              {activeTab === 'transfers' && (
                <TransfersHub
                  preFillData={transferPreFill}
                  clearPreFillData={() => setTransferPreFill(null)}
                  setActiveTab={setActiveTab}
                />
              )}

              {/* Screen 8: Reports and Activity History */}
              {activeTab === 'reports' && <ReportsAudit />}

              {/* Supplementary: Beds & Unified Resources Matrix */}
              {activeTab === 'resources' && <UnifiedResources setActiveTab={setActiveTab} />}

              {/* Supplementary: Demand Forecast */}
              {activeTab === 'forecast' && (
                <DemandForecast
                  setActiveTab={setActiveTab}
                  onPreFillTransfer={(data) => {
                    setTransferPreFill(data);
                    setActiveTab('transfers');
                  }}
                />
              )}

              {/* Supplementary: Privacy-Preserving Federated Learning */}
              {activeTab === 'federated' && <FederatedLearningView />}
            </ErrorBoundary>
          </main>

          {/* MOBILE ONE-HANDED BOTTOM NAVIGATION THUMB BAR */}
          {(viewportMode === 'mobile' || isMobileScreen) && (
            <nav className="mobile-bottom-thumb-nav">
              <button
                type="button"
                className={`thumb-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <Layers size={18} />
                <span>Network</span>
              </button>
              <button
                type="button"
                className={`thumb-btn ${activeTab === 'medicines' ? 'active' : ''}`}
                onClick={() => setActiveTab('medicines')}
              >
                <Pill size={18} />
                <span>Medicine</span>
              </button>
              <button
                type="button"
                className={`thumb-btn highlight-scan ${activeTab === 'attendance' ? 'active' : ''}`}
                onClick={() => setIsScanChooserOpen(true)}
                title="One-Handed Staff & Medicine QR Scan"
              >
                <div className="thumb-scan-bubble">
                  <QrCode size={22} />
                </div>
                <span>Scan QR</span>
              </button>
              <button
                type="button"
                className={`thumb-btn ${activeTab === 'alerts' ? 'active' : ''}`}
                onClick={() => setActiveTab('alerts')}
              >
                <div className="icon-with-badge">
                  <Bell size={18} />
                  {activeAlertsCount > 0 && <span className="mini-badge">{activeAlertsCount}</span>}
                </div>
                <span>Alerts</span>
              </button>
              <button
                type="button"
                className={`thumb-btn ${activeTab === 'transfers' ? 'active' : ''}`}
                onClick={() => setActiveTab('transfers')}
              >
                <ArrowRightLeft size={18} />
                <span>Transfers</span>
              </button>
            </nav>
          )}
        </div>

        {/* Mobile Scan QR chooser: medicine or attendance */}
        {isScanChooserOpen && (
          <div className="modal-backdrop" onClick={() => setIsScanChooserOpen(false)}>
            <div className="modal-card scan-chooser-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>What do you want to scan?</h3>
                <button className="btn-icon" onClick={() => setIsScanChooserOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body scan-chooser-options">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => { setIsScanChooserOpen(false); setActiveTab('medicines'); }}
                >
                  <Pill size={16} /> Medicine (Check-In / Out)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setIsScanChooserOpen(false); setActiveTab('attendance'); }}
                >
                  <Users size={16} /> Staff Attendance
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification Banner */}
        {toast && (
          <div className={`floating-toast ${toast.type}`}>
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            {toast.type === 'warning' && <AlertCircle size={18} />}
            <span className="toast-text">{toast.message}</span>
          </div>
        )}

        {/* Onboarding & Verification Modal */}
        <OnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
        />

        {/* Demo Success Checklist Modal */}
        <DemoChecklistModal
          isOpen={isChecklistOpen}
          onClose={() => setIsChecklistOpen(false)}
          setActiveTab={setActiveTab}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
        />

        {/* Quick Alerts Modal if opened from bell */}
        {isAlertsModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsAlertsModalOpen(false)}>
            <div className="modal-card alerts-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Active Incident Notifications</h3>
                <button className="btn-icon" onClick={() => setIsAlertsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body p-0">
                <AlertsCenter
                  setActiveTab={(tab) => {
                    setIsAlertsModalOpen(false);
                    setActiveTab(tab);
                  }}
                  onPreFillTransfer={(data) => setTransferPreFill(data)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary moduleTitle="In One Hand PHC Application">
      <AppProvider>
        <MainApp />
      </AppProvider>
    </ErrorBoundary>
  );
}
