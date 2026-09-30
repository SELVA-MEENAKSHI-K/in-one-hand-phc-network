import React, { useState } from 'react';
import {
  Pill,
  Bed,
  Users,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  ArrowRightLeft,
  QrCode,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { useApp } from '../context/AppContext';
import {
  TIME_SERIES_STOCK_HISTORY,
  TIME_SERIES_BED_HISTORY,
  TIME_SERIES_FOOTFALL_HISTORY
} from '../data/mockData';

export const PHCDetails = ({ setActiveTab }) => {
  const {
    currentPhc,
    setCurrentPhcId,
    phcs,
    alerts,
    auditLogs,
    updateFootfall
  } = useApp();

  const [now] = useState(() => Date.now());

  if (!currentPhc) {
    return (
      <div className="p-8 text-center">
        <h3>No PHC Selected</h3>
        <p>Please select a Primary Health Centre from the Network Dashboard.</p>
        <button
          type="button"
          className="btn btn-primary mt-4"
          onClick={() => setActiveTab('dashboard')}
        >
          &larr; Back to Network Dashboard
        </button>
      </div>
    );
  }

  const totalBeds = currentPhc.bedCapacity;
  const occupiedBeds = currentPhc.occupiedBeds;
  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const occupancyPercentage = Math.round((occupiedBeds / totalBeds) * 100);

  const totalStaff = currentPhc.staff.length;
  const presentStaff = currentPhc.staff.filter((s) => s.status === 'Present');
  const staffRate = totalStaff > 0 ? Math.round((presentStaff.length / totalStaff) * 100) : 0;

  const lowStockItems = currentPhc.medicines.filter((m) => m.quantity < m.minThreshold);

  const phcAlerts = alerts.filter((a) => a.phcId === currentPhc.id);
  const phcLogs = auditLogs.filter((l) => l.phcName.includes(currentPhc.name.split(' ')[0]));

  const lastUpdatedDate = new Date(currentPhc.lastUpdated || now);
  const minutesAgo = Math.max(1, Math.floor((now - lastUpdatedDate.getTime()) / 60000));

  return (
    <div className="phc-details-page">
      {/* Back and Breadcrumbs */}
      <div className="details-top-bar">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setActiveTab('dashboard')}
        >
          <ArrowLeft size={15} /> Back to PHC Network Dashboard
        </button>
        <div className="phc-selector-quick">
          <span className="selector-label">Switch Centre:</span>
          <select
            value={currentPhc.id}
            onChange={(e) => setCurrentPhcId(e.target.value)}
            className="select-phc-sm"
          >
            {phcs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Screen 3: Facility Header Banner */}
      <div className="phc-hero-banner">
        <div className="phc-hero-info">
          <div className="phc-title-line">
            <h2 className="phc-primary-name">{currentPhc.name}</h2>
            {currentPhc.tamilName && (
              <span className="phc-tamil-name">{currentPhc.tamilName}</span>
            )}
            <span
              className={`badge ${
                currentPhc.status === 'Approved' ? 'badge-success' : 'badge-warning'
              }`}
            >
              {currentPhc.status === 'Approved' ? '✓ Verified PHC Node' : '⏳ Pending Verification'}
            </span>
          </div>

          <div className="phc-meta-row">
            <span className="meta-item">
              <MapPin size={14} className="text-muted" />
              <strong>{currentPhc.district}</strong> • {currentPhc.location || 'Location verified'}
            </span>
            <span className="meta-separator">•</span>
            <span className="meta-item">
              <Phone size={14} className="text-muted" />
              Contact: <strong>{currentPhc.contactPerson}</strong> ({currentPhc.phone})
            </span>
          </div>
        </div>

        <div className="phc-hero-telemetry">
          <div className="telemetry-pill">
            <Clock size={13} className="text-primary" />
            <span>
              Last Updated: <strong>{minutesAgo} minutes ago</strong> ({lastUpdatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </span>
          </div>
          <div className="freshness-indicator live">
            <span className="pulse-indicator"></span>
            <span>Operational Node Active (Demo Data)</span>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="kpi-grid">
        {/* Available Beds */}
        <div className="kpi-card highlight">
          <div className="kpi-card-header">
            <span className="kpi-title">Available Beds</span>
            <div className="kpi-icon-badge text-sky bg-sky-light">
              <Bed size={20} />
            </div>
          </div>
          <div className="kpi-metric-row">
            <span className="kpi-value text-sky">{availableBeds}</span>
            <span className="kpi-unit">of {totalBeds} Total Beds</span>
          </div>
          <div className="progress-bar-bg">
            <div
              className={`progress-bar-fill ${
                occupancyPercentage > 85 ? 'fill-danger' : occupancyPercentage > 70 ? 'fill-warning' : 'fill-sky'
              }`}
              style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
            ></div>
          </div>
          <div className="kpi-footer-row">
            <span className="kpi-sub-text">
              Occupied: <strong>{occupiedBeds}</strong> ({occupancyPercentage}%)
            </span>
            <span className="kpi-sub-badge success">Formula: Total − Occupied</span>
          </div>
        </div>

        {/* Medicine Inventory */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Medicine Catalog</span>
            <div className="kpi-icon-badge text-emerald bg-emerald-light">
              <Pill size={20} />
            </div>
          </div>
          <div className="kpi-metric-row">
            <span className="kpi-value text-emerald">{currentPhc.medicines.length}</span>
            <span className="kpi-unit">Tracked Essential SKUs</span>
          </div>
          <div className="kpi-footer-row">
            {lowStockItems.length > 0 ? (
              <span className="kpi-sub-badge danger">
                <AlertTriangle size={12} /> {lowStockItems.length} Low / Stock-out Risk
              </span>
            ) : (
              <span className="kpi-sub-badge success">
                <CheckCircle2 size={12} /> Stock Optimal
              </span>
            )}
            <span className="kpi-action-link" onClick={() => setActiveTab('medicines')}>
              Check-In / Out &rarr;
            </span>
          </div>
        </div>

        {/* Staff Attendance */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Duty Staff Coverage</span>
            <div className="kpi-icon-badge text-indigo bg-indigo-light">
              <Users size={20} />
            </div>
          </div>
          <div className="kpi-metric-row">
            <span className="kpi-value text-indigo">{presentStaff.length} / {totalStaff}</span>
            <span className="kpi-unit">Present ({staffRate}%)</span>
          </div>
          <div className="kpi-footer-row">
            {staffRate < currentPhc.staffingThreshold ? (
              <span className="kpi-sub-badge warning">
                <AlertTriangle size={12} /> Below {currentPhc.staffingThreshold}% Gap
              </span>
            ) : (
              <span className="kpi-sub-badge success">
                <CheckCircle2 size={12} /> Coverage Normal
              </span>
            )}
            <span className="kpi-action-link" onClick={() => setActiveTab('attendance')}>
              Scan QR &rarr;
            </span>
          </div>
        </div>

        {/* Patient Footfall */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Patient Visits &amp; Load</span>
            <div className="kpi-icon-badge text-amber bg-amber-light">
              <Activity size={20} />
            </div>
          </div>
          <div className="kpi-metric-row">
            <span className="kpi-value text-amber">{currentPhc.dailyFootfall}</span>
            <span className="kpi-unit">Today's Aggregate Visits</span>
          </div>
          <div className="kpi-footer-row">
            <span className="kpi-sub-text">
              Baseline: <strong>{currentPhc.regularPatientCount}</strong> Patients
            </span>
            <div className="quick-btn-group" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="btn-tiny"
                onClick={() => updateFootfall(currentPhc.id, 1)}
                title="Add 1 patient visit"
              >
                +1
              </button>
              <button
                type="button"
                className="btn-tiny"
                onClick={() => updateFootfall(currentPhc.id, 5)}
                title="Add 5 patient visits"
              >
                +5
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: MEDICINE NAMES, QUANTITIES, MINIMUM LEVELS & EXPIRY WARNINGS */}
      <div className="details-section-card">
        <div className="section-title-row">
          <div>
            <h3>Medicine Inventory, Thresholds &amp; Expiry Warnings</h3>
            <p className="section-hint">
              Live stock levels with minimum safety thresholds, daily usage burn rates, and cold-chain status
            </p>
          </div>
          <div className="section-action-btns">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveTab('medicines')}
            >
              <Pill size={14} /> Medicine Check-In / Check-Out
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setActiveTab('transfers')}
            >
              <ArrowRightLeft size={14} /> Request Transfer
            </button>
          </div>
        </div>

        <div className="table-responsive-card">
          <table className="data-table mobile-cards">
            <thead>
              <tr>
                <th>Medicine Name &amp; Category</th>
                <th>Current Stock</th>
                <th>Min. Threshold Level</th>
                <th>Safety Status</th>
                <th>Batch &amp; Expiry Warning</th>
                <th>Daily Burn Rate</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPhc.medicines.map((med) => {
                const isCritical = med.quantity < med.minThreshold * 0.5;
                const isLow = med.quantity < med.minThreshold;
                const daysRemaining = med.dailyUsageRate > 0 ? (med.quantity / med.dailyUsageRate).toFixed(1) : '∞';

                // Check expiry warning (< 90 days)
                const expiryDateObj = new Date(med.expiryDate);
                const daysUntilExpiry = Math.round((expiryDateObj.getTime() - now) / (1000 * 60 * 60 * 24));
                const isExpiringSoon = daysUntilExpiry <= 90;

                return (
                  <tr key={med.id} className={isCritical ? 'row-critical' : isLow ? 'row-warning' : ''}>
                    <td data-label="Medicine SKU">
                      <div className="med-name-cell">
                        <strong className="med-name">{med.name}</strong>
                        {med.tamilName && <span className="med-tamil-name">{med.tamilName}</span>}
                        <span className="badge badge-subtle">{med.category}</span>
                      </div>
                    </td>
                    <td data-label="Current Stock">
                      <div className="med-qty-cell">
                        <span
                          className={`qty-number ${
                            isCritical ? 'text-rose' : isLow ? 'text-amber' : 'text-emerald'
                          }`}
                        >
                          {med.quantity}
                        </span>
                        <span className="qty-unit">{med.unit}</span>
                      </div>
                    </td>
                    <td data-label="Min. Threshold">
                      <span className="threshold-val">
                        {med.minThreshold} {med.unit}
                      </span>
                    </td>
                    <td data-label="Status">
                      {isCritical ? (
                        <span className="badge badge-danger">
                          <ShieldAlert size={12} /> Critical Shortage
                        </span>
                      ) : isLow ? (
                        <span className="badge badge-warning">
                          <AlertTriangle size={12} /> Below Minimum
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Optimal Stock
                        </span>
                      )}
                    </td>
                    <td data-label="Batch / Expiry">
                      <div className="batch-cell">
                        <code>{med.batchNumber}</code>
                        <span className="expiry-date">Exp: {med.expiryDate}</span>
                        {isExpiringSoon && (
                          <span className="badge badge-warning text-xs">
                            ⏳ Expiring in {daysUntilExpiry} days
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label="Burn Rate">
                      <div className="burn-rate-cell">
                        <span>~{med.dailyUsageRate} {med.unit}/day</span>
                        <small className={Number(daysRemaining) < 4 ? 'text-rose font-bold' : 'text-muted'}>
                          {daysRemaining} days remaining
                        </small>
                      </div>
                    </td>
                    <td data-label="Actions">
                      <div className="action-buttons-cell">
                        <button
                          type="button"
                          className="btn-tiny btn-action-in"
                          onClick={() => setActiveTab('medicines')}
                        >
                          + In
                        </button>
                        <button
                          type="button"
                          className="btn-tiny btn-action-out"
                          onClick={() => setActiveTab('medicines')}
                        >
                          - Out
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: BEDS AVAILABILITY & STAFF ATTENDANCE IN 2 COLUMNS */}
      <div className="two-column-grid">
        {/* Column 1: Bed Capacity & Occupancy Status Summary */}
        <div className="details-section-card">
          <div className="section-title-row">
            <div>
              <h3>Bed Capacity &amp; Occupancy Status</h3>
              <p className="section-hint">Available Beds = Total ({totalBeds}) − Occupied ({occupiedBeds})</p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => setActiveTab('resources')}
            >
              <Bed size={13} /> Update Beds &rarr;
            </button>
          </div>

          <div className="bed-formula-display">
            <div className="formula-box">
              <span className="formula-label">Total Beds</span>
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

          <div className="occupancy-gauge-box">
            <div className="gauge-label-row">
              <span>Occupancy Rate: <strong>{occupancyPercentage}%</strong></span>
              <span>{availableBeds === 0 ? 'FULL: Divert referrals' : `${availableBeds} beds vacant`}</span>
            </div>
            <div className="progress-bar-bg large">
              <div
                className={`progress-bar-fill ${
                  occupancyPercentage > 85 ? 'fill-danger' : occupancyPercentage > 70 ? 'fill-warning' : 'fill-sky'
                }`}
                style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
              ></div>
            </div>
          </div>

          <div className="bed-summary-footer-note">
            <span className="text-muted text-xs">
              To admit or discharge patients or update bed status, use the <strong>Beds &amp; Unified Resources</strong> controls.
            </span>
          </div>
        </div>

        {/* Column 2: Staff Attendance Status Roster */}
        <div className="details-section-card">
          <div className="section-title-row">
            <div>
              <h3>Staff Duty Roster &amp; Attendance</h3>
              <p className="section-hint">Unique QR passport check-in and active presence tracking</p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setActiveTab('attendance')}
            >
              <QrCode size={14} /> Scan Staff QR
            </button>
          </div>

          <div className="staff-roster-list">
            {currentPhc.staff.map((stf) => {
              const isPresent = stf.status === 'Present';
              const isCheckedOut = stf.status === 'Checked Out';

              return (
                <div key={stf.id} className="staff-roster-item">
                  <div className="staff-avatar-initials">
                    {stf.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="staff-info-block">
                    <strong className="staff-name">{stf.name}</strong>
                    <span className="staff-role">{stf.role}</span>
                  </div>
                  <div className="staff-status-block">
                    <span
                      className={`badge ${
                        isPresent ? 'badge-success' : isCheckedOut ? 'badge-subtle' : 'badge-warning'
                      }`}
                    >
                      {isPresent ? '✓ Present' : isCheckedOut ? 'Checked Out' : 'Not Checked In'}
                    </span>
                    {stf.checkInTime && (
                      <span className="checkin-time-text">In: {stf.checkInTime}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: GRAPHS FOR MEDICINE, BED & PATIENT FOOTFALL TRENDS */}
      <div className="charts-grid">
        {/* Medicine Trajectory */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">{currentPhc.name} — Medicine Consumption Trajectory</h3>
              <p className="chart-subtitle">Historical 7-day depletion trajectory</p>
            </div>
            <span className="badge badge-subtle">7-Day Trajectory</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={TIME_SERIES_STOCK_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Area type="monotone" dataKey="Paracetamol 500mg" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                <Area type="monotone" dataKey="Amoxicillin 500mg" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                <Area type="monotone" dataKey="Anti-Rabies ARV" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bed Trajectory */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Bed Occupancy vs Available Beds</h3>
              <p className="chart-subtitle">Capacity: {totalBeds} Total Sanctioned Beds</p>
            </div>
            <span className="badge badge-subtle">Capacity: {totalBeds} Beds</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={TIME_SERIES_BED_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, totalBeds]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Area type="monotone" dataKey="occupied" name="Occupied Beds" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
                <Area type="monotone" dataKey="available" name="Available Beds" stroke="#0284c7" fill="#0284c7" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient Footfall Trajectory */}
        <div className="chart-card full-width">
          <div className="chart-card-header">
            <div>
              <h3 className="chart-title">Aggregate Patient Daily Footfall Trajectory</h3>
              <p className="chart-subtitle">
                Weekly visit volume compared to baseline regular registered patient count ({currentPhc.regularPatientCount})
              </p>
            </div>
            <span className="badge badge-primary">Aggregate Visit Counts (Demo Data)</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={TIME_SERIES_FOOTFALL_HISTORY} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                <Bar dataKey="footfall" name="Today's Patient Visits" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 4: RECENT ALERTS AND ACTIVITY FOR THIS PHC */}
      <div className="details-section-card">
        <div className="section-title-row">
          <div>
            <h3>Recent Incidents &amp; Activity Log ({currentPhc.name})</h3>
            <p className="section-hint">Forensic operational trail of transactions and alert dispatches</p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setActiveTab('reports')}
          >
            Full Audit Logs &rarr;
          </button>
        </div>

        <div className="alerts-and-logs-grid">
          {/* PHC Active Alerts */}
          <div className="phc-sub-card">
            <h4 className="sub-card-title">Facility Alerts &amp; Thresholds</h4>
            {phcAlerts.length === 0 ? (
              <div className="empty-sub-card">
                <CheckCircle2 size={24} className="text-emerald" />
                <span>No active alerts for this facility.</span>
              </div>
            ) : (
              phcAlerts.map((alt) => (
                <div key={alt.id} className={`mini-alert-pill ${alt.type}`}>
                  {alt.type === 'critical' ? (
                    <AlertCircle size={16} className="text-rose" />
                  ) : (
                    <AlertTriangle size={16} className="text-amber" />
                  )}
                  <div className="mini-alert-content">
                    <span className="mini-alert-title">{alt.title}</span>
                    <p className="mini-alert-desc">{alt.message}</p>
                  </div>
                  <span className={`badge ${alt.status === 'Active' ? 'badge-danger' : 'badge-success'}`}>
                    {alt.status}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* PHC Recent Audit Logs */}
          <div className="phc-sub-card">
            <h4 className="sub-card-title">Recent Transactions &amp; Updates</h4>
            {phcLogs.length === 0 ? (
              <div className="empty-sub-card">
                <span>No recent transactions logged yet.</span>
              </div>
            ) : (
              phcLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="mini-log-pill">
                  <Clock size={14} className="text-muted" />
                  <div className="mini-log-content">
                    <strong>{log.action}</strong>
                    <p>{log.details}</p>
                    <small>By {log.user} ({log.role})</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
