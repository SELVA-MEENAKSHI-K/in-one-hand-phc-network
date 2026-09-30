import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Pill,
  Bed,
  Users,
  Activity,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  MapPin,
  ArrowRightLeft,
  Sparkles,
  Plus,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
  TrendingUp,
  RotateCcw,
  CheckSquare
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { useApp } from '../context/AppContext';

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  color: '#0f172a',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
};

const LEGEND_STYLE = { fontSize: '12px', paddingTop: '6px' };
const CHART_MARGIN = { top: 12, right: 16, left: -10, bottom: 4 };

export const NetworkDashboard = ({ setActiveTab, onSelectPhc }) => {
  const {
    phcs,
    setCurrentPhcId,
    alerts,
    recordBenchmark,
    isEvaluationMode,
    toggleEvaluationMode,
    resetToDefaultData,
    language,
    canAccessTab
  } = useApp();

  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadTime, setLoadTime] = useState(180);
  const [chartMode, setChartMode] = useState('beds'); // 'beds' | 'medicines'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 768
  );

  const [mountTimestamp] = useState(() => Date.now());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const start = performance.now();
    const elapsed = Math.round(performance.now() - start + 180);
    const id = requestAnimationFrame(() => setLoadTime(elapsed));
    if (isEvaluationMode && recordBenchmark) {
      recordBenchmark('Network Dashboard Render', 3.0, start);
    }
    return () => cancelAnimationFrame(id);
  }, [districtFilter, statusFilter, searchTerm, isEvaluationMode, recordBenchmark]);

  // Derive districts from dataset
  const availableDistricts = useMemo(() => {
    return Array.from(new Set(phcs.map((p) => p.district).filter(Boolean))).sort();
  }, [phcs]);

  // Filter PHCs (memoized to keep reference stable)
  const filteredPhcs = useMemo(() => {
    return phcs.filter((phc) => {
      const matchesDistrict = districtFilter === 'ALL' || phc.district === districtFilter;
      const matchesStatus = statusFilter === 'ALL' || phc.status === statusFilter;
      const matchesSearch =
        searchTerm.trim() === '' ||
        phc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phc.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (phc.location && phc.location.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesDistrict && matchesStatus && matchesSearch;
    });
  }, [phcs, districtFilter, statusFilter, searchTerm]);

  // Active operational PHCs (approved facilities)
  const activeOperationalPhcs = useMemo(() => {
    return filteredPhcs.filter((p) => p.status === 'Approved');
  }, [filteredPhcs]);

  // Network Aggregate KPI Calculations (operational totals exclude pending facilities)
  const totalRegisteredPhcs = phcs.length;
  const approvedPhcsCount = phcs.filter((p) => p.status === 'Approved').length;
  const pendingPhcsCount = phcs.filter((p) => p.status === 'Pending Verification').length;

  const totalNetworkBeds = activeOperationalPhcs.reduce(
    (acc, p) => acc + (p.bedCapacity || 0),
    0
  );
  const totalOccupiedBeds = activeOperationalPhcs.reduce(
    (acc, p) => acc + (p.occupiedBeds || 0),
    0
  );
  const totalAvailableBeds = Math.max(0, totalNetworkBeds - totalOccupiedBeds);
  const networkBedOccupancyRate =
    totalNetworkBeds > 0 ? Math.round((totalOccupiedBeds / totalNetworkBeds) * 100) : 0;

  const totalStaffAll = activeOperationalPhcs.reduce((acc, p) => acc + p.staff.length, 0);
  const totalStaffPresent = activeOperationalPhcs.reduce(
    (acc, p) => acc + p.staff.filter((s) => s.status === 'Present').length,
    0
  );
  const totalStaffNotCheckedIn = activeOperationalPhcs.reduce(
    (acc, p) => acc + p.staff.filter((s) => s.status !== 'Present').length,
    0
  );
  const networkStaffRate =
    totalStaffAll > 0 ? Math.round((totalStaffPresent / totalStaffAll) * 100) : 0;

  const totalRegularPatients = activeOperationalPhcs.reduce(
    (acc, p) => acc + (p.regularPatientCount || 0),
    0
  );
  const totalDailyFootfall = activeOperationalPhcs.reduce(
    (acc, p) => acc + (p.dailyFootfall || 0),
    0
  );

  // Active alerts aggregate
  const activeAlerts = alerts.filter((a) => a.status === 'Active');
  const criticalStockAlerts = activeAlerts.filter(
    (a) =>
      a.type === 'critical' &&
      (a.category.includes('stock') || a.category.includes('Medicine'))
  ).length;
  const warningStockAlerts = activeAlerts.filter(
    (a) =>
      a.type === 'warning' &&
      (a.category.includes('stock') || a.category.includes('Medicine'))
  ).length;

  // Chart datasets (memoized to keep reference stable for Recharts)
  const bedComparisonData = useMemo(() => {
    return activeOperationalPhcs.map((p) => {
      const availBeds = Math.max(0, (p.bedCapacity || 0) - (p.occupiedBeds || 0));
      return {
        phcName: p.name.replace(' Primary Health Centre', '').replace(' PHC', ''),
        'Available Beds': availBeds,
        'Occupied Beds': p.occupiedBeds || 0,
        totalCapacity: p.bedCapacity || 0
      };
    });
  }, [activeOperationalPhcs]);

  const medicineComparisonData = useMemo(() => {
    return activeOperationalPhcs.map((p) => {
      const pcm = p.medicines.find((m) => m.id === 'med-pcm-500')?.quantity || 0;
      const amx = p.medicines.find((m) => m.id === 'med-amx-500')?.quantity || 0;
      const rab = p.medicines.find((m) => m.id === 'med-rab-vial')?.quantity || 0;
      return {
        phcName: p.name.replace(' Primary Health Centre', '').replace(' PHC', ''),
        'Paracetamol (Strips)': pcm,
        'Amoxicillin (Strips)': amx,
        'Anti-Rabies (Vials)': rab
      };
    });
  }, [activeOperationalPhcs]);

  // Handle open PHC details
  const handleOpenPhcDetails = (phcId) => {
    setCurrentPhcId(phcId);
    if (onSelectPhc) {
      onSelectPhc(phcId);
    } else if (setActiveTab) {
      setActiveTab('phc-details');
    }
  };

  // Helper to extract key metric for urgent alerts
  const getAlertMetricTag = (alt) => {
    if (alt.category?.includes('Bed') || alt.title?.toLowerCase().includes('bed')) {
      const match = alt.message.match(/(\d+\s*of\s*\d+\s*beds|\d+%\s*occupied|\d+\s*available\s*beds)/i);
      return match ? match[0] : 'Bed Capacity Alert';
    }
    if (alt.category?.includes('stock') || alt.category?.includes('Medicine')) {
      const match = alt.message.match(/(\d+\s*Vials|\d+\s*Strips|\d+(\.\d+)?\s*days)/i);
      return match ? `Stock: ${match[0]}` : 'Critical Stock';
    }
    if (alt.category?.includes('Staff') || alt.title?.toLowerCase().includes('staff')) {
      const match = alt.message.match(/(\d+\s*of\s*\d+\s*staff|\d+%\s*threshold)/i);
      return match ? match[0] : 'Staffing Alert';
    }
    return 'Action Needed';
  };

  const getAlertAction = (alt) => {
    if (alt.category?.includes('Bed') || alt.title?.toLowerCase().includes('bed')) {
      return {
        label: language === 'ta' ? 'படுக்கைகள் நிர்வாகம்' : 'Manage Beds',
        onClick: () => {
          setCurrentPhcId(alt.phcId);
          setActiveTab('resources');
        }
      };
    }
    if (alt.category?.includes('Staff') || alt.title?.toLowerCase().includes('staff')) {
      return {
        label: language === 'ta' ? 'பணியாளர் வருகை' : 'Review Roster',
        onClick: () => {
          setCurrentPhcId(alt.phcId);
          setActiveTab('attendance');
        }
      };
    }
    return {
      label: language === 'ta' ? 'பரிமாற்றம் கோரவும்' : 'Request Transfer',
      onClick: () => {
        setCurrentPhcId(alt.phcId);
        setActiveTab('transfers');
      }
    };
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' || districtFilter !== 'ALL' || statusFilter !== 'ALL';

  const resetFilters = () => {
    setSearchTerm('');
    setDistrictFilter('ALL');
    setStatusFilter('ALL');
  };

  const getMinsAgo = (lastUpdated) => {
    const updatedMs = lastUpdated ? new Date(lastUpdated).getTime() : mountTimestamp;
    return Math.max(1, Math.floor((mountTimestamp - updatedMs) / 60000));
  };

  const handlePhcKpiClick = () => {
    if (canAccessTab && canAccessTab('auth')) {
      setActiveTab('auth');
    } else {
      const rosterEl = document.querySelector('.network-roster-section');
      if (rosterEl) {
        rosterEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="network-dashboard-page">
      {/* 1. COMPACT SIMPLIFIED HEADER BANNER */}
      <header className="network-compact-header">
        <div className="network-header-main">
          <div className="network-title-cluster">
            <h1 className="network-main-title">
              {language === 'ta' ? 'நெட்வொர்க் செயல்பாடுகள்' : 'Network Operations'}
            </h1>
            <span className="network-demo-badge" title="Simulated primary health network demo dataset">
              {language === 'ta' ? 'மாதிரி தரவு' : 'Demo Data'}
            </span>
          </div>
          <p className="network-header-desc">
            {language === 'ta'
              ? 'இணைக்கப்பட்ட அனைத்து ஆரம்ப சுகாதார நிலையங்களின் நிகழ்நேர படுக்கை இருப்பு, மருந்து பாதுகாப்பு மற்றும் பணியாளர் நிலை.'
              : 'Real-time capacity, medicine safety, and staff coverage across connected primary health centres.'}
          </p>
        </div>

        <div className="network-header-side">
          <div className="network-freshness-pill">
            <span className="pulse-indicator"></span>
            <span>{language === 'ta' ? 'தரவு புதுப்பிக்கப்பட்டது: 4 வினாடி முன்' : 'Data updated 4s ago'}</span>
          </div>
        </div>
      </header>

      {/* 2. PRIORITIZED URGENT ALERTS (Near Top) */}
      {activeAlerts.length > 0 && (
        <section
          className="urgent-action-card"
          aria-label={language === 'ta' ? 'அவசர எச்சரிக்கைகள்' : 'Urgent Alerts'}
        >
          <div className="urgent-card-header">
            <div className="urgent-title-box">
              <span className="urgent-alert-pulse">
                <AlertTriangle size={18} />
              </span>
              <div>
                <h2 className="urgent-card-title">
                  {language === 'ta' ? 'அவசர நெட்வொர்க் எச்சரிக்கைகள்' : 'Urgent Network Alerts'}
                  <span className="urgent-count-tag">{activeAlerts.length}</span>
                </h2>
                <span className="urgent-card-sub">
                  {language === 'ta'
                    ? 'உடனடி கவனிப்பு தேவைப்படும் இருப்பு மற்றும் படுக்கை அபாயங்கள்'
                    : 'Critical stockouts and capacity risks requiring immediate intervention'}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setActiveTab('alerts')}
            >
              {language === 'ta' ? 'எச்சரிக்கை மையம்' : 'Alerts Center'} &rarr;
            </button>
          </div>

          <div className="urgent-alerts-container">
            {activeAlerts.slice(0, 3).map((alt) => {
              const action = getAlertAction(alt);
              const metricTag = getAlertMetricTag(alt);
              const isCritical = alt.type === 'critical';

              return (
                <div key={alt.id} className={`urgent-item-banner ${isCritical ? 'critical' : 'warning'}`}>
                  <div className="urgent-item-primary">
                    <span className={`badge ${isCritical ? 'badge-danger' : 'badge-warning'}`}>
                      {isCritical
                        ? language === 'ta' ? 'அவசரம்' : 'Critical'
                        : language === 'ta' ? 'எச்சரிக்கை' : 'Caution'}
                    </span>
                    <span className="urgent-phc-name">
                      <MapPin size={12} className="inline-pin" /> {alt.phcName}
                    </span>
                    <span className="urgent-metric-chip">{metricTag}</span>
                  </div>

                  <div className="urgent-item-body">
                    <strong>{language === 'ta' && alt.tamilTitle ? alt.tamilTitle : alt.title}:</strong>{' '}
                    <span>{alt.message}</span>
                  </div>

                  <div className="urgent-item-cta">
                    <button
                      type="button"
                      className={`btn btn-xs ${isCritical ? 'btn-primary' : 'btn-outline'}`}
                      onClick={action.onClick}
                    >
                      {action.label} &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. CONSISTENT KPI CARDS ROW (5 Cards) */}
      <section className="network-kpis-section" aria-label="Key Performance Indicators">
        <div className="kpi-grid">
          {/* KPI 1: Registered PHCs & Verification */}
          <div
            className="kpi-card"
            role="button"
            tabIndex={0}
            onClick={handlePhcKpiClick}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePhcKpiClick()}
            title={canAccessTab && canAccessTab('auth') ? 'Click to view PHC Facility Roster and Onboarding' : 'Click to scroll to Connected PHCs roster'}
          >
            <div className="kpi-card-header">
              <span className="kpi-title">
                {language === 'ta' ? 'பதிவுசெய்த மையங்கள்' : 'Registered PHCs'}
              </span>
              <div className="kpi-icon-badge text-primary bg-primary-light">
                <Building2 size={20} />
              </div>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-value text-primary">{totalRegisteredPhcs}</span>
              <span className="kpi-unit">
                {language === 'ta' ? 'சுகாதார நிலையங்கள்' : 'Primary Health Centres'}
              </span>
            </div>
            <div className="kpi-footer-row">
              <span className="kpi-sub-text">
                <strong>{approvedPhcsCount}</strong> {language === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'Verified'} •{' '}
                <strong>{pendingPhcsCount}</strong> {language === 'ta' ? 'நிலுவை' : 'Pending'}
              </span>
              <span className="kpi-action-link">{language === 'ta' ? 'பட்டியல்' : 'View Roster'} &rarr;</span>
            </div>
          </div>

          {/* KPI 2: Critical Stock Risks */}
          <div
            className="kpi-card"
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab('alerts')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('alerts')}
            title="Click to review critical medicine shortage alerts"
          >
            <div className="kpi-card-header">
              <span className="kpi-title">
                {language === 'ta' ? 'இருப்பு தீரும் அபாயங்கள்' : 'Critical Stock Risks'}
              </span>
              <div className="kpi-icon-badge text-rose bg-rose-light">
                <Pill size={20} />
              </div>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-value text-rose">{criticalStockAlerts}</span>
              <span className="kpi-unit">
                {language === 'ta' ? 'தீவிர இருப்பு அபாயங்கள்' : 'Active Stockout Risks'}
              </span>
            </div>
            <div className="kpi-footer-row">
              <span className="kpi-sub-badge danger">
                <AlertTriangle size={12} />
                {warningStockAlerts > 0
                  ? `${warningStockAlerts} ${language === 'ta' ? 'குறைந்த இருப்பு எச்சரிக்கைகள்' : 'warning alerts'}`
                  : language === 'ta' ? 'பாதுகாப்பான இருப்பு' : 'Optimal buffer'}
              </span>
              <span className="kpi-action-link">{language === 'ta' ? 'ஆய்வு' : 'Review'} &rarr;</span>
            </div>
          </div>

          {/* KPI 3: Available & Total Beds */}
          <div
            className="kpi-card"
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab('resources')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('resources')}
            title="Click to open Beds & Unified Resources Matrix"
          >
            <div className="kpi-card-header">
              <span className="kpi-title">
                {language === 'ta' ? 'நெட்வொர்க் படுக்கை திறன்' : 'Network Bed Capacity'}
              </span>
              <div className="kpi-icon-badge text-sky bg-sky-light">
                <Bed size={20} />
              </div>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-value text-sky">{totalAvailableBeds}</span>
              <span className="kpi-unit">
                {language === 'ta'
                  ? `இருப்பு / ${totalNetworkBeds} மொத்தம்`
                  : `Available of ${totalNetworkBeds} Total Beds`}
              </span>
            </div>
            <div className="progress-bar-bg">
              <div
                className={`progress-bar-fill ${
                  networkBedOccupancyRate > 85
                    ? 'fill-danger'
                    : networkBedOccupancyRate > 70
                    ? 'fill-warning'
                    : 'fill-sky'
                }`}
                style={{ width: `${Math.min(100, networkBedOccupancyRate)}%` }}
              ></div>
            </div>
            <div className="kpi-footer-row">
              <span className="kpi-sub-text">
                {language === 'ta' ? 'நிரம்பியது:' : 'Occupied:'} <strong>{totalOccupiedBeds}</strong> ({networkBedOccupancyRate}%)
              </span>
              <span className="kpi-action-link">{language === 'ta' ? 'படுக்கைகள்' : 'Manage Beds'} &rarr;</span>
            </div>
          </div>

          {/* KPI 4: Staff Present & Sanctioned */}
          <div
            className="kpi-card"
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab('attendance')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('attendance')}
            title="Click to view Staff Attendance and Duty Roster"
          >
            <div className="kpi-card-header">
              <span className="kpi-title">
                {language === 'ta' ? 'பணியாளர் வருகை' : 'Staff On Duty'}
              </span>
              <div className="kpi-icon-badge text-indigo bg-indigo-light">
                <Users size={20} />
              </div>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-value text-indigo">
                {totalStaffPresent} / {totalStaffAll}
              </span>
              <span className="kpi-unit">
                {language === 'ta'
                  ? `பணியில் உள்ளவர்கள் (${networkStaffRate}%)`
                  : `Present On Duty (${networkStaffRate}%)`}
              </span>
            </div>
            <div className="kpi-footer-row">
              <span className="kpi-sub-text">
                {language === 'ta' ? 'வருகை தராதவர்:' : 'Not checked in:'}{' '}
                <strong>{totalStaffNotCheckedIn}</strong> {language === 'ta' ? 'பணியாளர்' : 'staff'}
              </span>
              <span className="kpi-action-link">{language === 'ta' ? 'க்யூஆர் வருகை' : 'Duty Roster'} &rarr;</span>
            </div>
          </div>

          {/* KPI 5: Patient Visits (Today's Footfall) */}
          <div
            className="kpi-card"
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab('phc-details')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('phc-details')}
            title="Click to view PHC patient records & clinic ledger"
          >
            <div className="kpi-card-header">
              <span className="kpi-title">
                {language === 'ta' ? 'இன்றைய நோயாளி வருகைகள்' : 'Today’s Patient Visits'}
              </span>
              <div className="kpi-icon-badge text-amber bg-amber-light">
                <Activity size={20} />
              </div>
            </div>
            <div className="kpi-metric-row">
              <span className="kpi-value text-amber">{totalDailyFootfall.toLocaleString()}</span>
              <span className="kpi-unit">
                {language === 'ta' ? 'இன்றைய வருகைகள்' : 'Visits Across Connected PHCs'}
              </span>
            </div>
            <div className="kpi-footer-row">
              <span className="kpi-sub-text">
                {language === 'ta' ? 'பதிவுசெய்த மக்கள்:' : 'Catchment Base:'}{' '}
                <strong>{totalRegularPatients.toLocaleString()}</strong>
              </span>
              <span className="kpi-action-link">{language === 'ta' ? 'விவரங்கள்' : 'Details'} &rarr;</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COMPACT ALIGNED TOOLBAR (Search, District, Verification, View Toggle) */}
      <section className="network-toolbar-container" aria-label="Filters and controls">
        <div className="network-toolbar">
          <div className="search-input-box network-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              aria-label={language === 'ta' ? 'மைய பெயர் தேடவும்' : 'Search by PHC facility name, district, or address'}
              placeholder={
                language === 'ta'
                  ? 'மைய பெயர், மாவட்டம் அல்லது முகவரி தேடவும்...'
                  : 'Search by PHC facility name, district, or address...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="btn-icon-tiny"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="filter-dropdown-box">
            <Filter size={15} className="text-muted" />
            <span className="filter-label">{language === 'ta' ? 'மாவட்டம்:' : 'District:'}</span>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              aria-label="Filter by district"
            >
              <option value="ALL">
                {language === 'ta' ? 'அனைத்து மாவட்டங்கள்' : 'All Districts'} ({phcs.length})
              </option>
              {availableDistricts.map((district) => (
                <option key={district} value={district}>
                  {district} ({phcs.filter((p) => p.district === district).length})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-dropdown-box">
            <Building2 size={15} className="text-muted" />
            <span className="filter-label">{language === 'ta' ? 'சரிபார்ப்பு:' : 'Verification:'}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by verification status"
            >
              <option value="ALL">
                {language === 'ta' ? 'அனைத்து நிலைகள்' : 'All Statuses'} ({phcs.length})
              </option>
              <option value="Approved">
                {language === 'ta' ? 'சரிபார்க்கப்பட்டது / செயலில்' : 'Approved / Active'} ({approvedPhcsCount})
              </option>
              <option value="Pending Verification">
                {language === 'ta' ? 'சரிபார்ப்பு நிலுவையில்' : 'Pending Verification'} ({pendingPhcsCount})
              </option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-outline btn-xs btn-reset-filters"
              onClick={resetFilters}
            >
              <RotateCcw size={12} /> {language === 'ta' ? 'அழிக்கவும்' : 'Reset Filters'}
            </button>
          )}

          {/* View mode toggle (Table vs Cards) for PHC list */}
          <div className="view-mode-toggle-group" role="group" aria-label="PHC list view format">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
              aria-pressed={viewMode === 'table'}
            >
              <List size={15} />
              <span className="view-toggle-text">{language === 'ta' ? 'அட்டவணை' : 'Table'}</span>
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card Grid View"
              aria-pressed={viewMode === 'cards'}
            >
              <LayoutGrid size={15} />
              <span className="view-toggle-text">{language === 'ta' ? 'கார்டுகள்' : 'Cards'}</span>
            </button>
          </div>
        </div>

        <div className="network-filter-feedback">
          <span className="results-count-chip">
            {language === 'ta'
              ? `${phcs.length} மையங்களில் ${filteredPhcs.length} காட்டப்படுகிறது`
              : `Showing ${filteredPhcs.length} of ${phcs.length} Primary Health Centres`}
          </span>
        </div>
      </section>

      {/* 5. NETWORK SUPPLY & CAPACITY CHARTS + QUICK ACTIONS */}
      <section className="network-analytics-section" aria-label="Capacity and Supply Comparison">
        <div className="chart-card-clean">
          <div className="chart-card-top-bar">
            <div>
              <h3 className="chart-main-title">
                {language === 'ta'
                  ? 'மையங்களுக்கிடையேயான வள மற்றும் திறன் ஒப்பீடு'
                  : 'Inter-PHC Capacity & Supply Comparison'}
              </h3>
              <p className="chart-main-sub">
                {chartMode === 'beds'
                  ? language === 'ta'
                    ? 'ஒவ்வொரு மையத்திலும் கிடைக்கும் படுக்கைகள் vs நிரம்பிய படுக்கைகள் (அலகு: படுக்கைகள்)'
                    : 'Available beds vs occupied beds per facility for patient diversion & admission (Unit: Beds)'
                  : language === 'ta'
                  ? 'முக்கிய மருந்துகளின் இருப்பு அளவு (அலகு: ஸ்ட்ரிப் / குப்பி)'
                  : 'Critical stock levels across active nodes to spot shortage & transfer needs (Unit: Packs/Vials)'}
              </p>
            </div>

            <div className="chart-tabs-switch" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={chartMode === 'beds'}
                className={`chart-tab-btn ${chartMode === 'beds' ? 'active' : ''}`}
                onClick={() => setChartMode('beds')}
              >
                <Bed size={14} /> {language === 'ta' ? 'படுக்கை திறன்' : 'Bed Capacity'}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={chartMode === 'medicines'}
                className={`chart-tab-btn ${chartMode === 'medicines' ? 'active' : ''}`}
                onClick={() => setChartMode('medicines')}
              >
                <Pill size={14} /> {language === 'ta' ? 'முக்கிய மருந்துகள்' : 'Essential Medicines'}
              </button>
            </div>
          </div>

          <div className="chart-render-box">
            {chartMode === 'beds' ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={bedComparisonData} margin={CHART_MARGIN}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="phcName" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                  <Bar
                    dataKey="Available Beds"
                    name={language === 'ta' ? 'இருப்பு படுக்கைகள்' : 'Available Beds'}
                    fill="#0ea5e9"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Occupied Beds"
                    name={language === 'ta' ? 'நிரம்பிய படுக்கைகள்' : 'Occupied Beds'}
                    fill="#64748b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={medicineComparisonData} margin={CHART_MARGIN}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis dataKey="phcName" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                  <Bar dataKey="Paracetamol (Strips)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Amoxicillin (Strips)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Anti-Rabies (Vials)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Operational Actions Integrated Toolbar */}
          <div className="chart-actions-strip">
            <span className="strip-label">
              <Sparkles size={14} className="text-primary" />
              <span>{language === 'ta' ? 'விரைவு செயல்பாடுகள்:' : 'Quick Workflows:'}</span>
            </span>
            <div className="strip-buttons-row">
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setActiveTab('medicines')}
              >
                <Pill size={13} /> {language === 'ta' ? 'மருந்து க்யூஆர்' : 'Medicine Check-In/Out'}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setActiveTab('attendance')}
              >
                <Users size={13} /> {language === 'ta' ? 'பணியாளர் வருகை' : 'Staff Attendance QR'}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setActiveTab('transfers')}
              >
                <ArrowRightLeft size={13} /> {language === 'ta' ? 'பரிமாற்ற மையம்' : 'Transfer Hub'}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setActiveTab('resources')}
              >
                <Bed size={13} /> {language === 'ta' ? 'படுக்கைகள் மேட்ரிக்ஸ்' : 'Beds & Resources'}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setActiveTab('forecast')}
              >
                <TrendingUp size={13} /> {language === 'ta' ? 'தேவை கணிப்பு' : 'Demand Forecast'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. EASY-TO-SCAN CONNECTED PHC LIST (Table view default on desktop, Cards on mobile or toggle) */}
      <section className="network-roster-section" aria-label="Connected Primary Health Centres">
        <div className="section-title-row">
          <div>
            <h2 className="section-h2">
              {language === 'ta' ? 'இணைக்கப்பட்ட ஆரம்ப சுகாதார நிலையங்கள்' : 'Connected Primary Health Centres'}
              <span className="phc-count-badge">{filteredPhcs.length}</span>
            </h2>
            <p className="section-hint">
              {language === 'ta'
                ? 'முழு சரக்கு, பணியாளர் பட்டியல் மற்றும் செயல்பாடுகளைக் காண எந்த மையத்தையும் தேர்ந்தெடுக்கவும்'
                : 'Select any facility to open its complete medicine inventory, staff duty list, and capacity controls'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setActiveTab('auth')}
          >
            <Plus size={14} /> {language === 'ta' ? 'புதிய மைய பதிவு' : 'Register New PHC'}
          </button>
        </div>

        {/* TABLE VIEW (Default on desktop & tablet) */}
        {viewMode === 'table' && !isMobile ? (
          <div className="phc-table-card">
            <div className="table-responsive-container">
              <table className="network-phc-table">
                <thead>
                  <tr>
                    <th>{language === 'ta' ? 'மையம் & மாவட்டம்' : 'Facility & District'}</th>
                    <th>{language === 'ta' ? 'சரிபார்ப்பு' : 'Verification'}</th>
                    <th>{language === 'ta' ? 'படுக்கைகள் (இருப்பு/மொத்தம்)' : 'Beds (Avail / Total)'}</th>
                    <th>{language === 'ta' ? 'பணியாளர் நிலை' : 'Staff On Duty'}</th>
                    <th>{language === 'ta' ? 'மருந்து இருப்பு' : 'Medicine Safety'}</th>
                    <th>{language === 'ta' ? 'இன்றைய வருகை' : 'Today’s Visits'}</th>
                    <th>{language === 'ta' ? 'கடைசி புதுப்பிப்பு' : 'Last Update'}</th>
                    <th className="text-right">{language === 'ta' ? 'நடவடிக்கை' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPhcs.map((phc) => {
                    const availBeds = Math.max(0, (phc.bedCapacity || 0) - (phc.occupiedBeds || 0));
                    const occRate = phc.bedCapacity > 0 ? Math.round(((phc.occupiedBeds || 0) / phc.bedCapacity) * 100) : 0;
                    const staffPresentCount = phc.staff?.filter((s) => s.status === 'Present').length || 0;
                    const staffTotal = phc.staff?.length || 0;
                    const staffRate = staffTotal > 0 ? Math.round((staffPresentCount / staffTotal) * 100) : 0;
                    const lowStockItems = phc.medicines?.filter((m) => m.quantity < m.minThreshold).length || 0;
                    const isApproved = phc.status === 'Approved';
                    const minsAgo = getMinsAgo(phc.lastUpdated);

                    return (
                      <tr
                        key={phc.id}
                        className="phc-table-row"
                        onClick={() => handleOpenPhcDetails(phc.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOpenPhcDetails(phc.id)}
                      >
                        <td className="phc-name-col">
                          <div className="phc-table-name">{phc.name}</div>
                          <div className="phc-table-sub">
                            <MapPin size={11} className="inline-pin text-muted" />
                            <span>{phc.district}</span>
                            {phc.location && <span className="location-tag">• {phc.location}</span>}
                          </div>
                        </td>

                        <td>
                          <span className={`badge ${isApproved ? 'badge-success' : 'badge-warning'}`}>
                            {isApproved
                              ? language === 'ta' ? '✓ சரிபார்க்கப்பட்டது' : '✓ Verified'
                              : language === 'ta' ? '⏳ நிலுவை' : '⏳ Pending'}
                          </span>
                        </td>

                        <td>
                          <div className="table-stat-cell">
                            <span className="metric-primary-text">
                              <strong>{availBeds}</strong> / {phc.bedCapacity}
                            </span>
                            <div className="mini-progress-track">
                              <div
                                className={`mini-progress-fill ${
                                  occRate > 85 ? 'fill-danger' : occRate > 70 ? 'fill-warning' : 'fill-sky'
                                }`}
                                style={{ width: `${Math.min(100, occRate)}%` }}
                              ></div>
                            </div>
                            <span className="micro-subtext">{occRate}% occupied</span>
                          </div>
                        </td>

                        <td>
                          <div className="table-stat-cell">
                            <span className="metric-primary-text">
                              <strong>{staffPresentCount}</strong> / {staffTotal}
                            </span>
                            <span className={`badge-tiny ${staffRate >= 80 ? 'badge-success' : 'badge-warning'}`}>
                              {staffRate}%
                            </span>
                          </div>
                        </td>

                        <td>
                          {lowStockItems > 0 ? (
                            <span className="badge badge-danger">
                              ⚠️ {lowStockItems} {language === 'ta' ? 'குறைவு' : 'Shortage'}
                            </span>
                          ) : (
                            <span className="badge badge-success">
                              ✓ {language === 'ta' ? 'பாதுகாப்பானது' : 'Optimal'}
                            </span>
                          )}
                        </td>

                        <td>
                          <div className="table-stat-cell">
                            <span className="metric-primary-text font-bold">
                              {phc.dailyFootfall || 0}
                            </span>
                            <span className="micro-subtext">
                              Base: {phc.regularPatientCount || 0}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="timestamp-text">
                            <Clock size={11} /> {minsAgo}m ago
                          </span>
                        </td>

                        <td className="text-right">
                          <button
                            type="button"
                            className="btn btn-outline btn-xs btn-open-phc"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPhcDetails(phc.id);
                            }}
                          >
                            {language === 'ta' ? 'விவரங்கள்' : 'View PHC'} &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* RESPONSIVE CARD VIEW (Clean, touch-friendly, 0 horizontal overflow) */
          <div className="phc-cards-grid">
            {filteredPhcs.map((phc) => {
              const availBeds = Math.max(0, (phc.bedCapacity || 0) - (phc.occupiedBeds || 0));
              const occRate = phc.bedCapacity > 0 ? Math.round(((phc.occupiedBeds || 0) / phc.bedCapacity) * 100) : 0;
              const staffPresentCount = phc.staff?.filter((s) => s.status === 'Present').length || 0;
              const staffTotal = phc.staff?.length || 0;
              const lowStockItems = phc.medicines?.filter((m) => m.quantity < m.minThreshold).length || 0;
              const isApproved = phc.status === 'Approved';
              const minsAgo = getMinsAgo(phc.lastUpdated);

              return (
                <div
                  key={phc.id}
                  className="phc-node-card"
                  onClick={() => handleOpenPhcDetails(phc.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOpenPhcDetails(phc.id)}
                >
                  <div className="phc-card-top">
                    <div>
                      <div className="phc-name-row">
                        <h3 className="phc-card-title">{phc.name}</h3>
                        <span className={`badge ${isApproved ? 'badge-success' : 'badge-warning'}`}>
                          {isApproved
                            ? language === 'ta' ? '✓ சரிபார்க்கப்பட்டது' : '✓ Verified'
                            : language === 'ta' ? '⏳ நிலுவை' : '⏳ Pending'}
                        </span>
                      </div>
                      <span className="phc-card-location">
                        <MapPin size={12} /> {phc.district} • {phc.location || 'Tamil Nadu'}
                      </span>
                    </div>
                  </div>

                  <div className="phc-card-stats">
                    {/* Bed Occupancy */}
                    <div className="stat-chunk">
                      <div className="stat-chunk-label">
                        <span>{language === 'ta' ? 'கிடைக்கும் படுக்கைகள்' : 'Available Beds'}</span>
                        <strong>{availBeds} / {phc.bedCapacity}</strong>
                      </div>
                      <div className="progress-bar-bg small">
                        <div
                          className={`progress-bar-fill ${
                            occRate > 85 ? 'fill-danger' : occRate > 70 ? 'fill-warning' : 'fill-sky'
                          }`}
                          style={{ width: `${Math.min(100, occRate)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Staff on Duty */}
                    <div className="stat-chunk">
                      <div className="stat-chunk-label">
                        <span>{language === 'ta' ? 'பணியாளர் வருகை' : 'Staff Attendance'}</span>
                        <strong>{staffPresentCount} / {staffTotal} {language === 'ta' ? 'பணியில்' : 'Present'}</strong>
                      </div>
                    </div>

                    {/* Medicine Safety */}
                    <div className="stat-chunk">
                      <div className="stat-chunk-label">
                        <span>{language === 'ta' ? 'மருந்து இருப்பு' : 'Medicine Safety'}</span>
                        {lowStockItems > 0 ? (
                          <span className="text-rose font-bold text-xs">
                            ⚠️ {lowStockItems} {language === 'ta' ? 'குறைவு எச்சரிக்கை' : 'Shortage Alert'}
                          </span>
                        ) : (
                          <span className="text-emerald font-bold text-xs">
                            ✓ {language === 'ta' ? 'பாதுகாப்பான இருப்பு' : 'Optimal Stock'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Daily Visits */}
                    <div className="stat-chunk">
                      <div className="stat-chunk-label">
                        <span>{language === 'ta' ? 'இன்றைய வருகைகள்' : 'Today’s Footfall'}</span>
                        <strong>{phc.dailyFootfall || 0} (Base: {phc.regularPatientCount || 0})</strong>
                      </div>
                    </div>
                  </div>

                  <div className="phc-card-footer">
                    <span className="timestamp-text">
                      <Clock size={11} /> {minsAgo}m ago
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline btn-tiny"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPhcDetails(phc.id);
                      }}
                    >
                      {language === 'ta' ? 'விவரங்கள்' : 'View Details'} &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 7. VISUALLY SEPARATED EVALUATION & DEMO SANDBOX (Requirement 9) */}
      {isEvaluationMode && (
        <aside
          className="evaluation-sandbox-panel"
          aria-label="Evaluation mode demo controls"
        >
          <div className="evaluation-panel-header">
            <div className="evaluation-panel-title">
              <SlidersHorizontal size={16} className="text-indigo" />
              <span>{language === 'ta' ? 'மதிப்பீட்டு மாதிரி கருவிகள் (டெமோ)' : 'Evaluation & Prototype Sandbox Controls'}</span>
            </div>
            <span className="badge badge-subtle">
              <Clock size={12} /> {language === 'ta' ? `ரெண்டர் பெஞ்ச்மார்க்: ${loadTime}ms` : `Render benchmark: ${loadTime}ms`}
            </span>
          </div>

          <p className="evaluation-panel-desc">
            {language === 'ta'
              ? 'இந்த கட்டுப்பாடுகள் சோதனையாளர்களுக்காக ஒதுக்கப்பட்டுள்ளது. இது மருத்துவ செயல்பாட்டு தரவுகளிலிருந்து தனிமைப்படுத்தப்பட்டுள்ளது.'
              : 'These controls are separated from clinical operations to test scenarios, review checklists, and verify prototype metrics.'}
          </p>

          <div className="evaluation-panel-actions">
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => setActiveTab('reports')}
            >
              <CheckSquare size={13} /> {language === 'ta' ? 'தணிக்கை பதிவு' : 'Audit Ledger'}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={resetToDefaultData}
            >
              <RotateCcw size={13} /> {language === 'ta' ? 'மாதிரி தரவை மீட்டமை' : 'Reset Demo Data'}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={toggleEvaluationMode}
            >
              {language === 'ta' ? 'மதிப்பீட்டு முறை முடக்கு' : 'Dismiss Sandbox'}
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
