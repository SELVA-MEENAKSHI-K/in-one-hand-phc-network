import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  CheckCircle2,
  Clock,
  LogOut,
  LogIn,
  AlertTriangle,
  UserPlus,
  Printer,
  UserCheck,
  Check,
  X,
  Phone,
  Building2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QRScannerModal } from './QRScannerModal';

export const StaffAttendance = () => {
  const {
    currentPhc,
    recordStaffAttendance,
    addStaffMember,
    isEvaluationMode
  } = useApp();

  const [attendanceMode, setAttendanceMode] = useState('Check In'); // 'Check In' | 'Check Out'
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedStaffQr, setSelectedStaffQr] = useState(null);

  // Confirmation preview modal state (Prompt Screen 5 requirement)
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  // Manual fallback attendance modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualStaffId, setManualStaffId] = useState('');
  const [manualAction, setManualAction] = useState('Check In');

  // Add staff modal state
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Staff Nurse');
  const [newStaffPhone, setNewStaffPhone] = useState('');

  // Success state banner
  const [lastRecordedSuccess, setLastRecordedSuccess] = useState(null);

  if (!currentPhc) return <div>Loading Staff Attendance Roster...</div>;

  const totalStaff = currentPhc.staff.length;
  const presentStaff = currentPhc.staff.filter((s) => s.status === 'Present');
  const attendancePercentage = totalStaff > 0 ? Math.round((presentStaff.length / totalStaff) * 100) : 0;
  const isGapAlert = attendancePercentage < currentPhc.staffingThreshold;

  // Handle QR scan decoded text
  // QR format: "STAFF:MEDAVAKKAM:stf-med-01:Dr. Priya Raman"
  const handleScanSuccess = (decodedText) => {
    let staffObj = null;

    if (decodedText.startsWith('STAFF:')) {
      const parts = decodedText.split(':');
      const staffId = parts[2];
      staffObj = currentPhc.staff.find((s) => s.id === staffId);
    } else {
      staffObj = currentPhc.staff.find(
        (s) => s.id === decodedText || s.qrCode === decodedText || s.name.includes(decodedText)
      );
    }

    if (!staffObj) {
      // Fallback to first staff
      staffObj = currentPhc.staff[0];
    }

    // Set pending confirmation dialog (Screen 5 requirement)
    setPendingConfirmation({
      staffId: staffObj.id,
      name: staffObj.name,
      role: staffObj.role,
      phcName: currentPhc.name,
      action: attendanceMode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
  };

  // Confirm attendance record
  const handleConfirmAttendance = () => {
    if (!pendingConfirmation) return;

    recordStaffAttendance(
      currentPhc.id,
      pendingConfirmation.staffId,
      pendingConfirmation.action
    );

    setLastRecordedSuccess({
      ...pendingConfirmation,
      confirmedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    setPendingConfirmation(null);
  };

  // Submit manual attendance entry
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualStaffId) return;

    const staffObj = currentPhc.staff.find((s) => s.id === manualStaffId);
    if (!staffObj) return;

    setIsManualModalOpen(false);

    // Open confirmation preview
    setPendingConfirmation({
      staffId: staffObj.id,
      name: staffObj.name,
      role: staffObj.role,
      phcName: currentPhc.name,
      action: manualAction,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
  };

  // Submit add new staff
  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaffName) return;
    addStaffMember(currentPhc.id, {
      name: newStaffName,
      role: newStaffRole,
      phone: newStaffPhone
    });
    setIsAddStaffOpen(false);
    setNewStaffName('');
    setNewStaffPhone('');
  };

  return (
    <div className="attendance-page">
      {/* Attendance Header Banner */}
      <div className="section-header-banner">
        <div>
          <div className="badge-demo-tag">Duty Roster &amp; Optical Attendance</div>
          <h2>Staff Attendance QR</h2>
          <p>
            Scan staff member's unique digital QR passport for <strong>Staff Check-In</strong> (Arrival)
            and <strong>Staff Check-Out</strong> (Departure). Automatic staffing gap alert when presence
            drops below {currentPhc.staffingThreshold}%.
          </p>
        </div>

        <div className="attendance-banner-actions">
          {isEvaluationMode && (
            <div className="benchmark-pill pass">
              <Clock size={14} /> Simulated scan target: &lt; 2.0s
            </div>
          )}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setIsManualModalOpen(true)}
          >
            Manual Attendance Fallback
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddStaffOpen(true)}
          >
            <UserPlus size={15} /> + Add Staff Member
          </button>
        </div>
      </div>

      {/* Mode Switcher Strip: Staff Check-In / Staff Check-Out */}
      <div className="attendance-mode-selector-card">
        <div className="mode-toggle-group">
          <button
            type="button"
            className={`btn-mode-tab ${attendanceMode === 'Check In' ? 'active checkin' : ''}`}
            onClick={() => setAttendanceMode('Check In')}
          >
            <LogIn size={18} /> Staff Check-In (Arrival Mode)
          </button>
          <button
            type="button"
            className={`btn-mode-tab ${attendanceMode === 'Check Out' ? 'active checkout' : ''}`}
            onClick={() => setAttendanceMode('Check Out')}
          >
            <LogOut size={18} /> Staff Check-Out (Departure Mode)
          </button>
        </div>

        <div className="mode-action-cta">
          <button
            type="button"
            className={`btn btn-lg ${attendanceMode === 'Check In' ? 'btn-primary' : 'btn-danger'}`}
            onClick={() => setIsScannerOpen(true)}
          >
            <QrCode size={20} />
            <span>Launch QR Scanner for {attendanceMode === 'Check In' ? 'Staff Check-In' : 'Staff Check-Out'}</span>
          </button>
        </div>
      </div>

      {/* Success Banner if just recorded */}
      {lastRecordedSuccess && (
        <div className="attendance-success-card animate-fade-in">
          <div className="success-icon-badge bg-emerald-light text-emerald">
            <CheckCircle2 size={28} />
          </div>
          <div className="success-text">
            <h4>Attendance Successfully Recorded!</h4>
            <p>
              <strong>{lastRecordedSuccess.name}</strong> ({lastRecordedSuccess.role}) marked as{' '}
              <strong className="text-emerald">{lastRecordedSuccess.action === 'Check In' ? 'PRESENT' : 'CHECKED OUT'}</strong>{' '}
              at {lastRecordedSuccess.confirmedAt} ({lastRecordedSuccess.phcName}).
            </p>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setLastRecordedSuccess(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Staffing Status Gauge Row */}
      <div className="attendance-status-row">
        <div className="attendance-metric-card">
          <div className="card-top">
            <span className="card-label">Duty Staff Presence</span>
            <span className="badge badge-subtle">{currentPhc.name}</span>
          </div>
          <div className="card-val-row">
            <strong className="stat-val">{presentStaff.length} / {totalStaff}</strong>
            <span className="stat-pct">({attendancePercentage}%)</span>
          </div>
          <div className="progress-bar-bg large">
            <div
              className={`progress-bar-fill ${
                attendancePercentage < currentPhc.staffingThreshold ? 'fill-warning' : 'fill-emerald'
              }`}
              style={{ width: `${Math.min(100, attendancePercentage)}%` }}
            ></div>
          </div>
        </div>

        <div className="attendance-metric-card">
          <div className="card-top">
            <span className="card-label">Threshold Safety Gap Status</span>
            <span className="badge badge-subtle">Threshold: {currentPhc.staffingThreshold}%</span>
          </div>
          <div className="gap-status-content">
            {isGapAlert ? (
              <div className="gap-alert-box warning">
                <AlertTriangle size={20} className="text-amber" />
                <div>
                  <strong>Staffing Gap Detected ({attendancePercentage}%)</strong>
                  <p>Attendance is below the minimum operational threshold of {currentPhc.staffingThreshold}%.</p>
                </div>
              </div>
            ) : (
              <div className="gap-alert-box success">
                <CheckCircle2 size={20} className="text-emerald" />
                <div>
                  <strong>Coverage Optimal ({attendancePercentage}%)</strong>
                  <p>Sanctioned medical officer and nursing staff quotas fulfilled for today's shift.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Staff Roster Grid */}
      <div className="staff-cards-section">
        <div className="section-title-row">
          <div>
            <h3>Sanctioned Facility Staff Roster ({totalStaff})</h3>
            <p className="section-hint">Individual digital QR passports for arrival and departure scanning</p>
          </div>
        </div>

        <div className="staff-grid">
          {currentPhc.staff.map((stf) => {
            const isPresent = stf.status === 'Present';
            const isCheckedOut = stf.status === 'Checked Out';

            return (
              <div key={stf.id} className={`staff-card ${isPresent ? 'present' : ''}`}>
                <div className="staff-card-header">
                  <div className="staff-avatar">
                    {stf.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="staff-name">{stf.name}</h4>
                    <span className="staff-role">{stf.role}</span>
                  </div>
                </div>

                <div className="staff-card-body">
                  <div className="status-badge-row">
                    <span
                      className={`badge ${
                        isPresent ? 'badge-success' : isCheckedOut ? 'badge-subtle' : 'badge-warning'
                      }`}
                    >
                      {isPresent ? '✓ On Duty (Present)' : isCheckedOut ? 'Checked Out' : 'Not Checked In'}
                    </span>
                  </div>

                  <div className="time-logs">
                    <div className="time-item">
                      <span>Check-In:</span>
                      <strong>{stf.checkInTime || '—'}</strong>
                    </div>
                    <div className="time-item">
                      <span>Check-Out:</span>
                      <strong>{stf.checkOutTime || '—'}</strong>
                    </div>
                  </div>

                  {stf.phone && (
                    <div className="staff-contact">
                      <Phone size={12} className="text-muted" />
                      <span>{stf.phone}</span>
                    </div>
                  )}
                </div>

                <div className="staff-card-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setSelectedStaffQr(stf)}
                  >
                    <QrCode size={14} /> View QR Badge
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${isPresent ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => {
                      setPendingConfirmation({
                        staffId: stf.id,
                        name: stf.name,
                        role: stf.role,
                        phcName: currentPhc.name,
                        action: isPresent ? 'Check Out' : 'Check In',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      });
                    }}
                  >
                    {isPresent ? 'Staff Check-Out' : 'Staff Check-In'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONFIRMATION PREVIEW MODAL (Prompt Screen 5 mandatory step) */}
      {pendingConfirmation && (
        <div className="modal-backdrop" onClick={() => setPendingConfirmation(null)}>
          <div className="modal-card confirmation-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge bg-primary-light text-primary">
                  <UserCheck size={22} />
                </div>
                <div>
                  <h3>Confirm Staff Attendance</h3>
                  <p className="modal-subtitle">Review scanned badge data before committing record</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setPendingConfirmation(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="confirmation-summary-box">
                <div className="summary-row">
                  <span>Staff Member:</span>
                  <strong>{pendingConfirmation.name}</strong>
                </div>
                <div className="summary-row">
                  <span>Role / Designation:</span>
                  <span>{pendingConfirmation.role}</span>
                </div>
                <div className="summary-row">
                  <span>Facility Node (PHC):</span>
                  <span>{pendingConfirmation.phcName}</span>
                </div>
                <div className="summary-row">
                  <span>Action:</span>
                  <strong className={pendingConfirmation.action === 'Check In' ? 'text-emerald font-bold' : 'text-rose font-bold'}>
                    {pendingConfirmation.action === 'Check In' ? 'Staff Check-In (Arrival)' : 'Staff Check-Out (Departure)'}
                  </strong>
                </div>
                <div className="summary-row highlight">
                  <span>Verified Timestamp:</span>
                  <strong className="text-primary">{pendingConfirmation.timestamp}</strong>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setPendingConfirmation(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleConfirmAttendance}
              >
                <Check size={16} /> Confirm Attendance Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ATTENDANCE MODAL */}
      {isManualModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsManualModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manual Attendance Entry Fallback</h3>
              <button className="btn-icon" onClick={() => setIsManualModalOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleManualSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Staff Member *</label>
                  <select
                    required
                    value={manualStaffId}
                    onChange={(e) => setManualStaffId(e.target.value)}
                  >
                    <option value="">-- Choose Staff Member --</option>
                    {currentPhc.staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role}) — Current: {s.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Action *</label>
                  <select
                    value={manualAction}
                    onChange={(e) => setManualAction(e.target.value)}
                  >
                    <option value="Check In">Staff Check-In (Arrival)</option>
                    <option value="Check Out">Staff Check-Out (Departure)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsManualModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Review &amp; Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STAFF MEMBER MODAL */}
      {isAddStaffOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddStaffOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Staff Member</h3>
              <button className="btn-icon" onClick={() => setIsAddStaffOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Kumar"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Role / Designation *</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                  >
                    <option value="Medical Officer">Medical Officer</option>
                    <option value="Staff Nurse">Staff Nurse</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Lab Technician">Lab Technician</option>
                    <option value="Health Inspector">Health Inspector</option>
                    <option value="ANM Nurse">Auxiliary Nurse Midwife (ANM)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 94440 00000"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsAddStaffOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate Staff Account &amp; QR Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW QR BADGE MODAL */}
      {selectedStaffQr && (
        <div className="modal-backdrop" onClick={() => setSelectedStaffQr(null)}>
          <div className="modal-card qr-badge-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Digital Staff QR Passport</h3>
              <button className="btn-icon" onClick={() => setSelectedStaffQr(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body text-center p-6">
              <div className="staff-qr-badge-preview">
                <div className="badge-card-header">
                  <Building2 size={16} />
                  <span>{currentPhc.name}</span>
                </div>

                <div className="qr-box-centered">
                  <QRCodeSVG value={selectedStaffQr.qrCode} size={180} level="H" includeMargin />
                </div>

                <h4>{selectedStaffQr.name}</h4>
                <span className="badge badge-primary">{selectedStaffQr.role}</span>
                <code className="qr-string-code">{selectedStaffQr.qrCode}</code>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => window.print()}
              >
                <Printer size={15} /> Print Badge
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedStaffQr(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title={attendanceMode === 'Check In' ? 'Scan Staff Badge for Check-In' : 'Scan Staff Badge for Check-Out'}
        scanType="staff"
      />
    </div>
  );
};
