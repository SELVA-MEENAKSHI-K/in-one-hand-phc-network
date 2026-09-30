import React from 'react';
import {
  Bed,
  Users,
  Activity,
  Plus,
  Minus,
  Clock,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  UserX
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const UnifiedResources = ({ setActiveTab }) => {
  const { currentPhc, updateBeds, updateFootfall, isEvaluationMode } = useApp();

  if (!currentPhc) return <div>Loading Resources...</div>;

  const totalBeds = Math.max(0, Number(currentPhc.bedCapacity) || 0);
  const occupiedBeds = Math.max(0, Math.min(Number(currentPhc.occupiedBeds) || 0, totalBeds));
  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const occupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const totalStaff = currentPhc.staff.length;
  const presentStaff = currentPhc.staff.filter((s) => s.status === 'Present');
  const checkedOutStaff = currentPhc.staff.filter((s) => s.status === 'Checked Out');
  const notCheckedInStaff = currentPhc.staff.filter((s) => s.status === 'Not Checked In');
  const attendanceRate = totalStaff > 0 ? Math.round((presentStaff.length / totalStaff) * 100) : 0;

  const handleBedSliderChange = (newVal) => {
    const clamped = Math.max(0, Math.min(Number(newVal) || 0, totalBeds));
    updateBeds(currentPhc.id, clamped);
  };

  return (
    <div className="resources-page">
      {/* Overview Intro Banner */}
      <div className="section-header-banner">
        <div>
          <h2>Beds &amp; Unified Resource Controls</h2>
          <p>
            Current availability and operational adjustment controls across Beds, Staff, Medicine, and Patient Footfall (Demo data).
            `Available Beds = Total ({totalBeds}) − Occupied ({occupiedBeds})`.
          </p>
        </div>
        {isEvaluationMode && (
          <div className="benchmark-pill pass">
            <Clock size={14} /> Update target: &lt; 3.0 seconds
          </div>
        )}
      </div>

      <div className="resources-matrix-grid">
        {/* RESOURCE SECTION 1: BED AVAILABILITY CONTROLLER */}
        <div className="resource-matrix-card">
          <div className="resource-card-header">
            <div className="resource-icon-badge bg-sky-light text-sky">
              <Bed size={22} />
            </div>
            <div>
              <h3>Bed Capacity &amp; Occupancy Controls</h3>
              <p>Inpatient, Emergency, and Observation Bed Status</p>
            </div>
          </div>

          <div className="resource-metric-showcase">
            <div className="bed-formula-display">
              <div className="formula-box">
                <span className="formula-label">Total Capacity</span>
                <span className="formula-val text-dark">{totalBeds}</span>
              </div>
              <span className="formula-operator">−</span>
              <div className="formula-box">
                <span className="formula-label">Occupied</span>
                <span className="formula-val text-amber">{occupiedBeds}</span>
              </div>
              <span className="formula-operator">=</span>
              <div className="formula-box highlight">
                <span className="formula-label">Available Beds</span>
                <span className="formula-val text-sky font-bold">{availableBeds}</span>
              </div>
            </div>

            {/* Occupancy gauge / progress */}
            <div className="occupancy-gauge-box">
              <div className="gauge-label-row">
                <span>Occupancy Rate: <strong>{occupancyPercentage}%</strong></span>
                <span>{availableBeds === 0 ? 'CRITICAL: FULL' : `${availableBeds} beds ready`}</span>
              </div>
              <div className="progress-bar-bg large">
                <div
                  className={`progress-bar-fill ${occupancyPercentage >= 85 ? 'fill-danger' : occupancyPercentage >= 70 ? 'fill-warning' : 'fill-sky'}`}
                  style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
                ></div>
              </div>
            </div>

            {/* Interactive Live Controls */}
            <div className="bed-controls-section">
              <span className="control-label">Live Occupancy Adjustment (Staff / Nurse Duty):</span>
              <div className="btn-counter-row">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => updateBeds(currentPhc.id, Math.max(0, occupiedBeds - 1))}
                  disabled={occupiedBeds <= 0}
                >
                  <Minus size={16} /> Discharge Patient (-1)
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => updateBeds(currentPhc.id, Math.min(totalBeds, occupiedBeds + 1))}
                  disabled={occupiedBeds >= totalBeds}
                >
                  <Plus size={16} /> Admit Patient (+1)
                </button>
              </div>

              {/* Slider for bulk adjustment */}
              <div className="slider-container">
                <input
                  type="range"
                  min="0"
                  max={totalBeds}
                  value={occupiedBeds}
                  onChange={(e) => handleBedSliderChange(Number(e.target.value))}
                  className="bed-range-slider"
                />
                <div className="slider-ticks">
                  <span>0 (Empty)</span>
                  <span>{Math.round(totalBeds / 2)} (Half)</span>
                  <span>{totalBeds} (Max)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RESOURCE SECTION 2: STAFF DUTY & ATTENDANCE */}
        <div className="resource-matrix-card">
          <div className="resource-card-header">
            <div className="resource-icon-badge bg-indigo-light text-indigo">
              <Users size={22} />
            </div>
            <div>
              <h3>Staff Duty Roster &amp; Availability</h3>
              <p>Updated via Duty Roster &amp; QR Attendance ({attendanceRate}% on duty)</p>
            </div>
          </div>

          <div className="staff-stats-grid">
            <div className="staff-stat-box green">
              <UserCheck size={20} className="text-emerald" />
              <div>
                <span className="stat-count">{presentStaff.length}</span>
                <span className="stat-name">On Duty (Present)</span>
              </div>
            </div>
            <div className="staff-stat-box gray">
              <UserX size={20} className="text-muted" />
              <div>
                <span className="stat-count">{checkedOutStaff.length}</span>
                <span className="stat-name">Checked Out</span>
              </div>
            </div>
            <div className="staff-stat-box amber">
              <Clock size={20} className="text-amber" />
              <div>
                <span className="stat-count">{notCheckedInStaff.length}</span>
                <span className="stat-name">Not Checked In</span>
              </div>
            </div>
          </div>

          {/* Roster preview list */}
          <div className="roster-preview-list">
            {currentPhc.staff.map((stf) => (
              <div key={stf.id} className="roster-preview-item">
                <div className="roster-info">
                  <strong>{stf.name}</strong>
                  <span className="roster-role">{stf.role}</span>
                </div>
                <div className="roster-status-col">
                  <span
                    className={`badge ${
                      stf.status === 'Present'
                        ? 'badge-success'
                        : stf.status === 'Checked Out'
                        ? 'badge-subtle'
                        : 'badge-warning'
                    }`}
                  >
                    {stf.status}
                  </span>
                  <small className="text-muted">
                    {stf.status === 'Present'
                      ? `In @ ${stf.checkInTime}`
                      : stf.status === 'Checked Out'
                      ? `Out @ ${stf.checkOutTime}`
                      : 'Pending Arrival'}
                  </small>
                </div>
              </div>
            ))}
          </div>

          <div className="card-footer-action">
            <button
              type="button"
              className="btn btn-outline full-width"
              onClick={() => setActiveTab('attendance')}
            >
              Open Staff Attendance &amp; QR Badges &rarr;
            </button>
          </div>
        </div>

        {/* RESOURCE SECTION 3: AGGREGATE PATIENT FOOTFALL */}
        <div className="resource-matrix-card">
          <div className="resource-card-header">
            <div className="resource-icon-badge bg-amber-light text-amber">
              <Activity size={22} />
            </div>
            <div>
              <h3>Aggregate Patient Counts (Demo Data)</h3>
              <p>Baseline catchment population &amp; daily OP footfall</p>
            </div>
          </div>

          <div className="patient-count-layout">
            <div className="footfall-metric-hero">
              <span className="footfall-label">Today's Aggregate Footfall</span>
              <span className="footfall-number text-amber">{currentPhc.dailyFootfall}</span>
              <span className="footfall-sub">
                Baseline Registered Patients: <strong>{currentPhc.regularPatientCount}</strong>
              </span>
            </div>

            <div className="footfall-actions-block">
              <span className="sub-label">Fast Add Patient Arrivals:</span>
              <div className="btn-group-row">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => updateFootfall(currentPhc.id, 1)}
                >
                  +1 Patient
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => updateFootfall(currentPhc.id, 5)}
                >
                  +5 Patients
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => updateFootfall(currentPhc.id, 10)}
                >
                  +10 Batch
                </button>
              </div>
            </div>

            <div className="privacy-guarantee-note">
              <ShieldAlert size={16} className="text-primary" />
              <span>
                <strong>Privacy &amp; Data Notice:</strong> The prototype records aggregate numerical footfall counts only. No patient personal identifiable information (names, Aadhaar, or medical records) is collected or stored.
              </span>
            </div>
          </div>
        </div>

        {/* RESOURCE SECTION 4: MEDICINE OVERVIEW SHORTCUT */}
        <div className="resource-matrix-card">
          <div className="resource-card-header">
            <div className="resource-icon-badge bg-emerald-light text-emerald">
              <TrendingUp size={22} />
            </div>
            <div>
              <h3>Essential Medicine Availability</h3>
              <p>Tracked essential medicine SKUs at {currentPhc.name} (Demo data)</p>
            </div>
          </div>

          <div className="medicine-chips-grid">
            {currentPhc.medicines.map((m) => {
              const isLow = m.quantity < m.minThreshold;
              return (
                <div key={m.id} className={`med-chip ${isLow ? 'chip-low' : 'chip-ok'}`}>
                  <div className="chip-info">
                    <strong>{m.name}</strong>
                    <span className="chip-threshold">Min: {m.minThreshold}</span>
                  </div>
                  <div className="chip-stock">
                    <span className={`chip-qty ${isLow ? 'text-rose' : 'text-emerald'}`}>
                      {m.quantity}
                    </span>
                    <span className="chip-unit">{m.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card-footer-action">
            <button
              type="button"
              className="btn btn-primary full-width"
              onClick={() => setActiveTab('medicines')}
            >
              Manage Medicine Transactions &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
