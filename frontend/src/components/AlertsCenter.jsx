import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  Building2,
  ShieldAlert,
  Search,
  ArrowRightLeft,
  Bed,
  Users,
  Pill,
  FileQuestion
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AlertsCenter = ({ setActiveTab, onOpenTransferModal, onPreFillTransfer }) => {
  const { alerts, acknowledgeAlert, resolveAlert, setCurrentPhcId, isEvaluationMode, MASTER_MEDICINE_CATALOG } = useApp();
  const [now] = useState(() => Date.now());

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Active' | 'Acknowledged' | 'Resolved'
  const [priorityFilter, setPriorityFilter] = useState('ALL'); // 'ALL' | 'critical' | 'warning'
  const [searchTerm, setSearchTerm] = useState('');

  // 6 Required Categories from Prompt Screen 6
  const CATEGORIES = [
    { key: 'ALL', label: 'All Incidents' },
    { key: 'Low medicine stock', label: 'Low medicine stock', icon: Pill },
    { key: 'Predicted stock-out risk', label: 'Predicted stock-out risk', icon: ShieldAlert },
    { key: 'Low bed availability', label: 'Low bed availability', icon: Bed },
    { key: 'Staff availability gap', label: 'Staff availability gap', icon: Users },
    { key: 'Transfer request updates', label: 'Transfer request updates', icon: ArrowRightLeft },
    { key: 'PHC data that needs updating', label: 'PHC data that needs updating', icon: FileQuestion }
  ];

  const filteredAlerts = alerts.filter((alert) => {
    const matchesCategory =
      categoryFilter === 'ALL' || alert.category.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || alert.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || alert.type === priorityFilter;
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.phcName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesStatus && matchesPriority && matchesSearch;
  });

  const activeCount = alerts.filter((a) => a.status === 'Active').length;
  const criticalCount = alerts.filter((a) => a.type === 'critical' && a.status === 'Active').length;
  const warningCount = alerts.filter((a) => a.type === 'warning' && a.status === 'Active').length;

  return (
    <div className="alerts-page">
      {/* Banner */}
      <div className="section-header-banner">
        <div>
          <div className="badge-demo-tag">Operational Alerts &amp; Incidents</div>
          <h2>Notifications &amp; Operational Alerts</h2>
          <p>
            Central incident triage for threshold violations, predicted stock-outs, bed capacity
            surges, staffing attendance gaps, and inter-PHC logistics.
          </p>
        </div>
        {isEvaluationMode && (
          <div className="benchmark-pill pass">
            <Clock size={14} /> Simulated triage target &lt; 2.5s
          </div>
        )}
      </div>

      {/* KPI Stat Cards */}
      <div className="alerts-stats-row">
        <div className="alert-stat-card red">
          <div className="stat-icon-wrapper bg-rose-light text-rose">
            <ShieldAlert size={22} />
          </div>
          <div>
            <span className="stat-val">{criticalCount}</span>
            <span className="stat-desc">Critical Incidents (Immediate Action)</span>
          </div>
        </div>

        <div className="alert-stat-card amber">
          <div className="stat-icon-wrapper bg-amber-light text-amber">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="stat-val">{warningCount}</span>
            <span className="stat-desc">Threshold Warnings</span>
          </div>
        </div>

        <div className="alert-stat-card green">
          <div className="stat-icon-wrapper bg-emerald-light text-emerald">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="stat-val">{alerts.filter((a) => a.status === 'Resolved').length}</span>
            <span className="stat-desc">Resolved Incidents</span>
          </div>
        </div>
      </div>

      {/* 6 Required Category Filter Chips (Screen 6) */}
      <div className="category-filter-chips-container">
        <span className="chips-title">Filter by Category:</span>
        <div className="filter-chips-scroll">
          {CATEGORIES.map((cat) => {
            const isSelected = categoryFilter === cat.key;
            const Icon = cat.icon;
            const count =
              cat.key === 'ALL'
                ? alerts.length
                : alerts.filter((a) => a.category.toLowerCase().includes(cat.key.toLowerCase())).length;

            return (
              <button
                key={cat.key}
                type="button"
                className={`category-chip ${isSelected ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat.key)}
              >
                {Icon && <Icon size={14} />}
                <span>{cat.label}</span>
                <span className="chip-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Filter Toolbar */}
      <div className="alerts-toolbar">
        <div className="search-input-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search alerts by medicine, facility, keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={15} className="text-muted" />
          <span className="filter-label">Status:</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses ({alerts.length})</option>
            <option value="Active">Active ({activeCount})</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">Priority:</span>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="ALL">All Priorities</option>
            <option value="critical">Critical Only</option>
            <option value="warning">Warning / Caution</option>
            <option value="info">Informational</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="empty-state-card">
            <CheckCircle2 size={48} className="text-emerald" />
            <h3>No Incidents Found</h3>
            <p>All monitored clinical supply and resource thresholds are operating within safety parameters.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.type === 'critical';
            const isActive = alert.status === 'Active';
            const isAcknowledged = alert.status === 'Acknowledged';
            const isResolved = alert.status === 'Resolved';

            const alertDate = new Date(alert.timestamp);
            const minsAgo = Math.max(1, Math.floor((now - alertDate.getTime()) / 60000));

            return (
              <div
                key={alert.id}
                className={`alert-item-card ${isCritical ? 'border-critical' : 'border-warning'} ${
                  isResolved ? 'resolved' : ''
                }`}
              >
                <div className="alert-item-header">
                  <div className="alert-icon-title">
                    {isCritical ? (
                      <AlertCircle size={24} className="text-rose" />
                    ) : (
                      <AlertTriangle size={24} className="text-amber" />
                    )}
                    <div>
                      <div className="alert-title-row">
                        <h4 className="alert-title">{alert.title}</h4>
                        {alert.tamilTitle && (
                          <span className="alert-tamil-title">{alert.tamilTitle}</span>
                        )}
                        <span
                          className={`badge ${
                            isCritical ? 'badge-danger' : alert.type === 'warning' ? 'badge-warning' : 'badge-subtle'
                          }`}
                        >
                          {alert.category}
                        </span>
                      </div>

                      <div className="alert-meta-row">
                        <span className="meta-block">
                          <Building2 size={13} className="text-muted" />
                          <strong>Affected PHC:</strong> {alert.phcName}
                        </span>
                        <span className="meta-dot">•</span>
                        <span className="meta-block">
                          <Clock size={13} className="text-muted" />
                          <span>{minsAgo}m ago ({alertDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                        </span>
                        <span className="meta-dot">•</span>
                        <span className="meta-block">
                          <strong>Priority:</strong> {isCritical ? 'CRITICAL' : 'WARNING'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="alert-status-badge-col">
                    <span
                      className={`badge ${
                        isActive
                          ? 'badge-danger'
                          : isAcknowledged
                          ? 'badge-warning'
                          : 'badge-success'
                      }`}
                    >
                      {alert.status}
                    </span>
                  </div>
                </div>

                <p className="alert-message-text">{alert.message}</p>

                {alert.acknowledgedBy && (
                  <div className="alert-ack-note">
                    <Check size={13} /> Acknowledged by: <strong>{alert.acknowledgedBy}</strong>
                  </div>
                )}

                {/* Actions row: Acknowledge, Open Details, Mark Resolved */}
                <div className="alert-item-footer">
                  <div className="alert-quick-links">
                    {alert.category.includes('stock') || alert.category.includes('Medicine') ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          if (alert.phcId) setCurrentPhcId(alert.phcId);
                          // Prefill the transfer form with the medicine named in this alert
                          const med = MASTER_MEDICINE_CATALOG.find((m) =>
                            alert.title.toLowerCase().includes(m.name.split(' ')[0].toLowerCase())
                          );
                          if (med && onPreFillTransfer) {
                            onPreFillTransfer({
                              requestingPhcId: alert.phcId,
                              requestingPhcName: alert.phcName,
                              sourcePhcId: '',
                              medicineId: med.id,
                              medicineName: med.name,
                              quantity: '100',
                              unit: med.unit,
                              urgency: alert.type === 'critical' ? 'Emergency' : 'Urgent',
                              reason: alert.title
                            });
                          }
                          if (onOpenTransferModal) {
                            onOpenTransferModal();
                          } else {
                            setActiveTab('transfers');
                          }
                        }}
                      >
                        <ArrowRightLeft size={13} /> Request Transfer for This &rarr;
                      </button>
                    ) : alert.category.includes('bed') ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          if (alert.phcId) setCurrentPhcId(alert.phcId);
                          setActiveTab('phc-details');
                        }}
                      >
                        <Bed size={13} /> Open Bed Allocation Details &rarr;
                      </button>
                    ) : alert.category.includes('Staff') ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          if (alert.phcId) setCurrentPhcId(alert.phcId);
                          setActiveTab('attendance');
                        }}
                      >
                        <Users size={13} /> Open Staff Attendance &rarr;
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          if (alert.phcId) setCurrentPhcId(alert.phcId);
                          setActiveTab('phc-details');
                        }}
                      >
                        Open PHC Details &rarr;
                      </button>
                    )}
                  </div>

                  <div className="alert-action-buttons">
                    {isActive && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </button>
                    )}
                    {!isResolved && (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        <Check size={14} /> Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
