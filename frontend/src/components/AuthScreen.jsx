import React, { useState } from 'react';
import {
  Building2,
  CheckCircle,
  Clock,
  MapPin,
  Pill,
  Bed,
  Users,
  FileCheck,
  Sparkles,
  Search,
  UserCheck,
  PlusCircle,
  Check,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthScreen = ({ setActiveTab: _setActiveTab }) => {
  const {
    phcs,
    currentRole,
    setCurrentRole,
    currentPhcId,
    setCurrentPhcId,
    registerNewPHC,
    verifyPHC,
    getRoleTitle,
    showToast,
    isEvaluationMode
  } = useApp();

  const pendingPhcs = phcs.filter((p) => p.status === 'Pending Verification');
  const activePhcs = phcs.filter((p) => p.status !== 'Pending Verification');

  // Default to verification queue if items are pending, otherwise to onboarding/directory
  const [activeView, setActiveView] = useState(pendingPhcs.length > 0 ? 'queue' : 'directory');
  const [searchQuery, setSearchQuery] = useState('');

  // Sign-up form state
  const [signupForm, setSignupForm] = useState({
    name: '',
    tamilName: '',
    district: 'Chengalpattu',
    location: '',
    contactPerson: '',
    contactRole: 'Chief Medical Officer',
    phone: '',
    email: '',
    regularPatientCount: '450',
    bedCapacity: '20',
    initialParacetamolQty: '600',
    initialParacetamolMin: '250',
    initialAmoxicillinQty: '400',
    initialAmoxicillinMin: '200',
    initialMetforminQty: '450',
    initialMetforminMin: '200',
    initialORSQty: '700',
    initialORSMin: '300',
    initialRabiesQty: '30',
    initialRabiesMin: '20',
    initialInsulinQty: '50',
    initialInsulinMin: '35'
  });

  // Pre-fill demo data for rapid evaluation
  const handleAutoFillDemo = () => {
    setSignupForm({
      name: 'Pallavaram Cantonment Primary Health Centre',
      tamilName: 'பல்லாவரம் பாசறை ஆரம்ப சுகாதார நிலையம்',
      district: 'Chengalpattu',
      location: 'Old Trunk Road, Pallavaram, Chennai 600043',
      contactPerson: 'Dr. R. Sudhakar',
      contactRole: 'Chief Medical Officer',
      phone: '+91 98401 56789',
      email: 'pallavaram.cmo@tnhealth.gov.in',
      regularPatientCount: '580',
      bedCapacity: '24',
      initialParacetamolQty: '750',
      initialParacetamolMin: '300',
      initialAmoxicillinQty: '500',
      initialAmoxicillinMin: '250',
      initialMetforminQty: '450',
      initialMetforminMin: '200',
      initialORSQty: '850',
      initialORSMin: '400',
      initialRabiesQty: '40',
      initialRabiesMin: '25',
      initialInsulinQty: '60',
      initialInsulinMin: '40'
    });
    showToast('Auto-filled facility details with sample health centre specification (all 6 tracked medicines)', 'info');
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    if (!signupForm.name || !signupForm.contactPerson || !signupForm.location) {
      showToast('Please fill in all required fields marked with *', 'error');
      return;
    }

    const newPhc = registerNewPHC({
      name: signupForm.name,
      tamilName: signupForm.tamilName,
      district: signupForm.district,
      location: signupForm.location,
      contactPerson: `${signupForm.contactPerson} (${signupForm.contactRole})`,
      phone: signupForm.phone,
      email: signupForm.email,
      regularPatientCount: Number(signupForm.regularPatientCount) || 400,
      bedCapacity: Number(signupForm.bedCapacity) || 20,
      medicines: [
        {
          id: 'med-pcm-500',
          name: 'Paracetamol 500mg',
          tamilName: 'பாராசிட்டமால் 500மி.கி',
          category: 'Analgesic / Antipyretic',
          quantity: Number(signupForm.initialParacetamolQty) || 600,
          minThreshold: Number(signupForm.initialParacetamolMin) || 250,
          unit: 'Strips',
          batchNumber: `INIT-PCM-${Date.now().toString().slice(-4)}`,
          expiryDate: '2027-12-31',
          source: 'Initial Facility Onboarding',
          dailyUsageRate: 40,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'med-amx-500',
          name: 'Amoxicillin 500mg',
          tamilName: 'அமாக்ஸிசிலின் 500மி.கி',
          category: 'Antibiotic',
          quantity: Number(signupForm.initialAmoxicillinQty) || 400,
          minThreshold: Number(signupForm.initialAmoxicillinMin) || 200,
          unit: 'Strips',
          batchNumber: `INIT-AMX-${Date.now().toString().slice(-4)}`,
          expiryDate: '2027-08-31',
          source: 'Initial Facility Onboarding',
          dailyUsageRate: 30,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'med-met-500',
          name: 'Metformin 500mg',
          tamilName: 'மெட்ஃபோர்மின் 500மி.கி',
          category: 'Antidiabetic',
          quantity: Number(signupForm.initialMetforminQty) || 450,
          minThreshold: Number(signupForm.initialMetforminMin) || 200,
          unit: 'Strips',
          batchNumber: `INIT-MET-${Date.now().toString().slice(-4)}`,
          expiryDate: '2028-02-28',
          source: 'Initial Facility Onboarding',
          dailyUsageRate: 25,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'med-ors-sachet',
          name: 'Oral Rehydration Salts (ORS)',
          tamilName: 'ஓ.ஆர்.எஸ் உப்பு கரைசல்',
          category: 'Electrolytes',
          quantity: Number(signupForm.initialORSQty) || 700,
          minThreshold: Number(signupForm.initialORSMin) || 300,
          unit: 'Sachets',
          batchNumber: `INIT-ORS-${Date.now().toString().slice(-4)}`,
          expiryDate: '2027-10-31',
          source: 'Initial Facility Onboarding',
          dailyUsageRate: 35,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'med-rab-vial',
          name: 'Anti-Rabies Vaccine (ARV)',
          tamilName: 'வெறிநாய்க்கடி தடுப்பூசி (ARV)',
          category: 'Emergency Vaccine',
          quantity: Number(signupForm.initialRabiesQty) || 30,
          minThreshold: Number(signupForm.initialRabiesMin) || 20,
          unit: 'Vials',
          batchNumber: `INIT-RAB-${Date.now().toString().slice(-4)}`,
          expiryDate: '2026-11-30',
          source: 'Cold Chain Initial Depot',
          dailyUsageRate: 4,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'med-ins-glar',
          name: 'Insulin Glargine',
          tamilName: 'இன்சுலின் கிளார்கின்',
          category: 'Cold Chain Hormone',
          quantity: Number(signupForm.initialInsulinQty) || 50,
          minThreshold: Number(signupForm.initialInsulinMin) || 35,
          unit: 'Cartridges',
          batchNumber: `INIT-INS-${Date.now().toString().slice(-4)}`,
          expiryDate: '2027-04-30',
          source: 'Cold Chain Initial Depot',
          dailyUsageRate: 6,
          lastUpdated: new Date().toISOString()
        }
      ]
    });

    showToast(`PHC "${newPhc.name}" registered and sent to Verification Queue!`, 'success');
    setActiveView('queue');
  };

  const PERSONAS = [
    {
      role: 'phc_staff',
      title: 'PHC Staff',
      name: 'Senthil Kumar',
      designation: 'Pharmacist (Medavakkam PHC)',
      description: 'Records medicine check-in/out, logs bed availability, and scans staff attendance QR codes.',
      color: 'sky'
    },
    {
      role: 'phc_admin',
      title: 'PHC Administrator',
      name: 'Dr. K. Ramesh',
      designation: 'Chief Medical Officer',
      description: 'Registers facility profile, manages medical rosters, opening stock, and internal inventory.',
      color: 'emerald'
    },
    {
      role: 'district_officer',
      title: 'District Health Officer',
      name: 'Dr. V. Sundaram',
      designation: 'District Health Officer (Chengalpattu)',
      description: 'Monitors district-wide metrics, approves inter-PHC transfers, and validates new facility nodes.',
      color: 'indigo'
    },
    {
      role: 'platform_admin',
      title: 'Platform Administrator',
      name: 'Central State Ops Admin',
      designation: 'State Health Grid Operations',
      description: 'Verifies onboarding queues, oversees security governance, and ensures system resilience.',
      color: 'amber'
    }
  ];

  const filteredPhcs = phcs.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      (p.location && p.location.toLowerCase().includes(q))
    );
  });

  return (
    <div className="facility-mgmt-page">
      {/* Top Hero & KPI Overview */}
      <div className="facility-hero-card">
        <div className="facility-hero-main">
          <div className="hero-icon-box">
            <Building2 size={26} className="text-primary-glow" />
          </div>
          <div>
            <div className="hero-title-row">
              <h2>PHC Facility Onboarding &amp; Verification</h2>
              <span className="hero-badge">Network Administration</span>
            </div>
            <p className="hero-subtitle">
              Onboard new Primary Health Centres, review pending node activations, and manage operational permissions.
            </p>
          </div>
        </div>

        {/* Quick KPI Stat Chips */}
        <div className="facility-stats-strip">
          <div className="facility-stat-pill" onClick={() => setActiveView('directory')}>
            <span className="stat-pill-label">Total Facilities:</span>
            <strong className="stat-pill-val">{phcs.length} Centres</strong>
          </div>
          <div className="facility-stat-pill success" onClick={() => setActiveView('directory')}>
            <span className="stat-pill-label">Active Nodes:</span>
            <strong className="stat-pill-val text-emerald">{activePhcs.length} Online</strong>
          </div>
          <div
            className={`facility-stat-pill ${pendingPhcs.length > 0 ? 'warning animate-pulse' : ''}`}
            onClick={() => setActiveView('queue')}
          >
            <span className="stat-pill-label">Verification Queue:</span>
            <strong className="stat-pill-val text-amber">{pendingPhcs.length} Pending</strong>
          </div>
          <div className="facility-stat-pill role-pill-chip" onClick={() => setActiveView('roles')}>
            <span className="stat-pill-label">Active Session:</span>
            <strong className="stat-pill-val text-sky">{getRoleTitle(currentRole)}</strong>
          </div>
        </div>
      </div>

      {/* Modern Navigation Segmented Controls */}
      <div className="facility-view-switcher">
        <button
          type="button"
          className={`view-tab-btn ${activeView === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveView('queue')}
        >
          <FileCheck size={16} />
          <span>Verification Queue</span>
          {pendingPhcs.length > 0 && (
            <span className="tab-pill-badge warning">{pendingPhcs.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`view-tab-btn ${activeView === 'onboarding' ? 'active' : ''}`}
          onClick={() => setActiveView('onboarding')}
        >
          <PlusCircle size={16} />
          <span>Onboard New PHC</span>
        </button>

        <button
          type="button"
          className={`view-tab-btn ${activeView === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveView('directory')}
        >
          <Building2 size={16} />
          <span>Registered Centres Directory</span>
          <span className="tab-pill-badge muted">{phcs.length}</span>
        </button>

        <button
          type="button"
          className={`view-tab-btn ${activeView === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveView('roles')}
        >
          <UserCheck size={16} />
          <span>Roles &amp; Access Matrix</span>
        </button>
      </div>

      {/* ========================================================
          VIEW 1: VERIFICATION QUEUE (Fast Approval & Node Activation)
          ======================================================== */}
      {activeView === 'queue' && (
        <div className="queue-view-content">
          <div className="section-toolbar-row">
            <div>
              <h3>Pending Facility Approval Queue</h3>
              <p className="text-muted text-sm">
                Nodes awaiting District Health Officer or Platform Administrator activation. Upon verification, facilities immediately join the real-time resource grid.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveView('onboarding')}
            >
              <PlusCircle size={15} /> Onboard Another Facility
            </button>
          </div>

          {pendingPhcs.length === 0 ? (
            <div className="empty-queue-card">
              <div className="empty-queue-icon">
                <CheckCircle size={44} className="text-emerald" />
              </div>
              <h4>All Facility Nodes are Verified &amp; Active</h4>
              <p>There are no pending Primary Health Centres in the queue.</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveView('onboarding')}
              >
                + Register New PHC Node
              </button>
            </div>
          ) : (
            <div className="pending-nodes-list">
              {pendingPhcs.map((phc) => (
                <div key={phc.id} className="pending-node-card">
                  <div className="pending-node-head">
                    <div className="node-head-left">
                      <div className="node-type-icon">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <div className="node-title-row">
                          <h4 className="node-title">{phc.name}</h4>
                          <span className="badge badge-warning">
                            <Clock size={12} /> Awaiting Verification
                          </span>
                        </div>
                        <span className="node-subtitle">
                          <MapPin size={13} /> {phc.location || phc.district} • District: {phc.district}
                        </span>
                      </div>
                    </div>

                    <div className="node-head-right">
                      {currentRole === 'platform_admin' ? (
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={() => {
                            verifyPHC(phc.id);
                          }}
                        >
                          <Check size={16} /> Approve &amp; Activate Node (&lt; 5s)
                        </button>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ opacity: 0.65, cursor: 'not-allowed', color: '#64748b' }}
                            disabled
                            title="Only Platform Administrators can verify and activate PHCs"
                          >
                            <Lock size={15} /> Platform Admin Required to Activate
                          </button>
                          <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 500 }}>
                            Current role: {getRoleTitle(currentRole)}. Switch to Platform Admin in Demo Switcher.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Node Intake Specs Grid */}
                  <div className="node-specs-grid">
                    <div className="spec-card">
                      <span className="spec-label">Sanctioned Bed Capacity</span>
                      <strong className="spec-value">{phc.bedCapacity} Inpatient Beds</strong>
                      <span className="spec-sub text-muted">Ready for allocation</span>
                    </div>

                    <div className="spec-card">
                      <span className="spec-label">Patient Catchment Load</span>
                      <strong className="spec-value">{phc.regularPatientCount} Patients</strong>
                      <span className="spec-sub text-muted">Baseline community population</span>
                    </div>

                    <div className="spec-card">
                      <span className="spec-label">Essential Medicine SKUs</span>
                      <strong className="spec-value">{phc.medicines.length} Tracked Drugs</strong>
                      <span className="spec-sub text-emerald">Opening stock configured</span>
                    </div>

                    <div className="spec-card">
                      <span className="spec-label">Authorised Facility In-Charge</span>
                      <strong className="spec-value">{phc.contactPerson}</strong>
                      <span className="spec-sub text-muted">{phc.phone || '+91 98400 00000'}</span>
                    </div>
                  </div>

                  {/* Opening Medicine Stock Pill Stack */}
                  <div className="opening-stock-preview">
                    <span className="preview-heading">Opening Medicine Stock Allocation:</span>
                    <div className="stock-chips-row">
                      {phc.medicines.map((m) => (
                        <div key={m.id} className="stock-preview-chip">
                          <Pill size={13} className="text-primary" />
                          <span className="chip-name">{m.name}:</span>
                          <strong className="chip-qty">{m.quantity} {m.unit}</strong>
                          <span className="chip-min">(Min: {m.minThreshold})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          VIEW 2: ONBOARD NEW PHC (Streamlined & Frictionless)
          ======================================================== */}
      {activeView === 'onboarding' && (
        <div className="onboarding-view-content">
          <div className="form-card-container">
            <div className="form-card-header">
              <div>
                <h3>Register &amp; Onboard Primary Health Centre</h3>
                <p className="form-subtitle">
                  Configure facility coordinates, baseline bed capacity, patient load, and opening medicine allocations.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAutoFillDemo}
                title={isEvaluationMode ? "Fill form with sample health centre data for fast evaluation" : "Fill form with sample template data"}
              >
                <Sparkles size={14} className="text-amber" /> {isEvaluationMode ? 'Fill Sample Demo Data' : 'Fill Sample Template'}
              </button>
            </div>

            <form onSubmit={handleSignUpSubmit} className="phc-onboarding-form">
              {/* Step 1: Centre Identity & District */}
              <div className="form-section-card">
                <div className="section-card-title">
                  <span className="step-badge">1</span>
                  <span>Facility Identity &amp; Location</span>
                </div>

                <div className="form-grid-2col">
                  <div className="form-group full-width">
                    <label>Primary Health Centre (PHC) Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tambaram Rural Primary Health Centre"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Tamil Translation (தமிழ் பெயர்)</label>
                    <input
                      type="text"
                      placeholder="e.g. தாம்பரம் கிராமப்புற ஆரம்ப சுகாதார நிலையம்"
                      value={signupForm.tamilName}
                      onChange={(e) => setSignupForm({ ...signupForm, tamilName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>District *</label>
                    <select
                      value={signupForm.district}
                      onChange={(e) => setSignupForm({ ...signupForm, district: e.target.value })}
                    >
                      <option value="Chengalpattu">Chengalpattu</option>
                      <option value="Chennai">Chennai</option>
                      <option value="Kanchipuram">Kanchipuram</option>
                      <option value="Tiruvallur">Tiruvallur</option>
                      <option value="Vellore">Vellore</option>
                      <option value="Coimbatore">Coimbatore</option>
                      <option value="Madurai">Madurai</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Physical Address / Coordinates *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 104, Gandhi Road, Tambaram East, Chennai 600059"
                      value={signupForm.location}
                      onChange={(e) => setSignupForm({ ...signupForm, location: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: In-Charge Officer & Capacity */}
              <div className="form-section-card">
                <div className="section-card-title">
                  <span className="step-badge">2</span>
                  <span>Medical Officer &amp; Bed Capacity</span>
                </div>

                <div className="form-grid-2col">
                  <div className="form-group">
                    <label>Authorised Contact Person *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. M. Kavitha"
                      value={signupForm.contactPerson}
                      onChange={(e) => setSignupForm({ ...signupForm, contactPerson: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Designation *</label>
                    <select
                      value={signupForm.contactRole}
                      onChange={(e) => setSignupForm({ ...signupForm, contactRole: e.target.value })}
                    >
                      <option value="Chief Medical Officer">Chief Medical Officer (CMO)</option>
                      <option value="Medical Officer">Medical Officer</option>
                      <option value="Block Medical Officer">Block Medical Officer (BMO)</option>
                      <option value="Facility In-Charge">Facility In-Charge</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Contact Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98400 12345"
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Total Sanctioned Beds *</label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="100"
                      value={signupForm.bedCapacity}
                      onChange={(e) => setSignupForm({ ...signupForm, bedCapacity: e.target.value })}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Catchment Community Regular Patient Baseline *</label>
                    <input
                      type="number"
                      required
                      min="50"
                      value={signupForm.regularPatientCount}
                      onChange={(e) => setSignupForm({ ...signupForm, regularPatientCount: e.target.value })}
                    />
                    <span className="form-hint">Aggregate demographic patient baseline for demand forecasting algorithms</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Opening Drug Stocks */}
              <div className="form-section-card">
                <div className="section-card-title">
                  <span className="step-badge">3</span>
                  <span>Initial Essential Drug Stock &amp; Safety Thresholds</span>
                </div>

                <div className="stock-allocation-grid">
                  <div className="stock-input-row">
                    <div className="stock-info-col">
                      <strong>Paracetamol 500mg (Strips)</strong>
                      <span className="text-muted text-xs">Analgesic / Antipyretic</span>
                    </div>
                    <div className="stock-inputs-col">
                      <div>
                        <label>Opening Stock</label>
                        <input
                          type="number"
                          value={signupForm.initialParacetamolQty}
                          onChange={(e) => setSignupForm({ ...signupForm, initialParacetamolQty: e.target.value })}
                        />
                      </div>
                      <div>
                        <label>Min. Threshold</label>
                        <input
                          type="number"
                          value={signupForm.initialParacetamolMin}
                          onChange={(e) => setSignupForm({ ...signupForm, initialParacetamolMin: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="stock-input-row">
                    <div className="stock-info-col">
                      <strong>Amoxicillin 500mg (Strips)</strong>
                      <span className="text-muted text-xs">Broad-Spectrum Antibiotic</span>
                    </div>
                    <div className="stock-inputs-col">
                      <div>
                        <label>Opening Stock</label>
                        <input
                          type="number"
                          value={signupForm.initialAmoxicillinQty}
                          onChange={(e) => setSignupForm({ ...signupForm, initialAmoxicillinQty: e.target.value })}
                        />
                      </div>
                      <div>
                        <label>Min. Threshold</label>
                        <input
                          type="number"
                          value={signupForm.initialAmoxicillinMin}
                          onChange={(e) => setSignupForm({ ...signupForm, initialAmoxicillinMin: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="stock-input-row">
                    <div className="stock-info-col">
                      <strong>Anti-Rabies Vaccine (ARV Vials)</strong>
                      <span className="text-muted text-xs">Cold Chain Emergency Antidote</span>
                    </div>
                    <div className="stock-inputs-col">
                      <div>
                        <label>Opening Stock</label>
                        <input
                          type="number"
                          value={signupForm.initialRabiesQty}
                          onChange={(e) => setSignupForm({ ...signupForm, initialRabiesQty: e.target.value })}
                        />
                      </div>
                      <div>
                        <label>Min. Threshold</label>
                        <input
                          type="number"
                          value={signupForm.initialRabiesMin}
                          onChange={(e) => setSignupForm({ ...signupForm, initialRabiesMin: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="stock-input-row">
                    <div className="stock-info-col">
                      <strong>Oral Rehydration Salts (ORS Sachets)</strong>
                      <span className="text-muted text-xs">Essential Electrolytes</span>
                    </div>
                    <div className="stock-inputs-col">
                      <div>
                        <label>Opening Stock</label>
                        <input
                          type="number"
                          value={signupForm.initialORSQty}
                          onChange={(e) => setSignupForm({ ...signupForm, initialORSQty: e.target.value })}
                        />
                      </div>
                      <div>
                        <label>Min. Threshold</label>
                        <input
                          type="number"
                          value={signupForm.initialORSMin}
                          onChange={(e) => setSignupForm({ ...signupForm, initialORSMin: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="stock-input-row">
                    <div className="stock-info-col">
                      <strong>Metformin 500mg (Strips)</strong>
                      <span className="text-muted text-xs">Essential Antidiabetic</span>
                    </div>
                    <div className="stock-inputs-col">
                      <div>
                        <label>Opening Stock</label>
                        <input
                          type="number"
                          value={signupForm.initialMetforminQty}
                          onChange={(e) => setSignupForm({ ...signupForm, initialMetforminQty: e.target.value })}
                        />
                      </div>
                      <div>
                        <label>Min. Threshold</label>
                        <input
                          type="number"
                          value={signupForm.initialMetforminMin}
                          onChange={(e) => setSignupForm({ ...signupForm, initialMetforminMin: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="stock-input-row">
                    <div className="stock-info-col">
                      <strong>Insulin Glargine (Cartridges)</strong>
                      <span className="text-muted text-xs">Cold Chain Hormone</span>
                    </div>
                    <div className="stock-inputs-col">
                      <div>
                        <label>Opening Stock</label>
                        <input
                          type="number"
                          value={signupForm.initialInsulinQty}
                          onChange={(e) => setSignupForm({ ...signupForm, initialInsulinQty: e.target.value })}
                        />
                      </div>
                      <div>
                        <label>Min. Threshold</label>
                        <input
                          type="number"
                          value={signupForm.initialInsulinMin}
                          onChange={(e) => setSignupForm({ ...signupForm, initialInsulinMin: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Row */}
              <div className="onboarding-submit-bar">
                <button type="submit" className="btn btn-primary btn-lg">
                  <CheckCircle size={18} /> Submit PHC for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          VIEW 3: REGISTERED CENTRES DIRECTORY
          ======================================================== */}
      {activeView === 'directory' && (
        <div className="directory-view-content">
          <div className="directory-toolbar">
            <div className="search-box-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search PHCs by name, district, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="toolbar-stats">
              <span>Showing <strong>{filteredPhcs.length}</strong> of {phcs.length} Centres</span>
            </div>
          </div>

          <div className="facilities-cards-grid">
            {filteredPhcs.map((phc) => {
              const isSelected = phc.id === currentPhcId;
              const isPending = phc.status === 'Pending Verification';

              return (
                <div
                  key={phc.id}
                  className={`facility-card ${isSelected ? 'active-node' : ''} ${isPending ? 'pending-card' : ''}`}
                >
                  <div className="facility-card-header">
                    <div className="facility-card-title-group">
                      <div className="facility-avatar">
                        <Building2 size={18} />
                      </div>
                      <div>
                        <h4 className="facility-name">{phc.name}</h4>
                        <span className="facility-dist"><MapPin size={12} /> {phc.district}</span>
                      </div>
                    </div>

                    <span className={`status-tag ${isPending ? 'pending' : 'verified'}`}>
                      {isPending ? '⏳ Pending Approval' : '✓ Verified Node'}
                    </span>
                  </div>

                  <p className="facility-address">{phc.location || 'Primary Health Centre Campus'}</p>

                  <div className="facility-metrics-row">
                    <div className="mini-metric">
                      <Bed size={14} className="text-primary" />
                      <span>{phc.bedCapacity} Beds</span>
                    </div>
                    <div className="mini-metric">
                      <Users size={14} className="text-emerald" />
                      <span>{phc.regularPatientCount} Catchment</span>
                    </div>
                    <div className="mini-metric">
                      <Pill size={14} className="text-amber" />
                      <span>{phc.medicines.length} SKUs</span>
                    </div>
                  </div>

                  <div className="facility-card-footer">
                    <span className="contact-badge">{phc.contactPerson}</span>
                    <button
                      type="button"
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => {
                        setCurrentPhcId(phc.id);
                        showToast(`Switched active node to ${phc.name}`, 'info');
                      }}
                    >
                      {isSelected ? '✓ Active Node' : 'Select Node'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          VIEW 4: ROLES & ACCESS MATRIX
          ======================================================== */}
      {activeView === 'roles' && (
        <div className="roles-view-content">
          <div className="section-toolbar-row">
            <div>
              {isEvaluationMode ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  <ShieldAlert size={13} /> DEMO ROLE SWITCHER (For Evaluation)
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  <UserCheck size={13} /> Role-Based Access Control Architecture
                </div>
              )}
              <h3>Role-Based Access Control (RBAC) &amp; Session Management</h3>
              <p className="text-muted text-sm">
                Operational roles enforce strict separation of duties across clinical staff, facility administrators, district officers, and platform grid ops.{isEvaluationMode ? ' Use the personas below to evaluate role-based boundaries.' : ' Review role definitions and permissions below.'}
              </p>
            </div>
          </div>

          {/* 4-Column Persona Cards */}
          <div className="persona-grid-row">
            {PERSONAS.map((p) => {
              const isSelected = currentRole === p.role;
              return (
                <div
                  key={p.role}
                  className={`persona-card-modern ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (isEvaluationMode) {
                      setCurrentRole(p.role);
                      showToast(`Active operator switched to ${p.title} (${p.name})`, 'success');
                    }
                  }}
                  style={{ cursor: isEvaluationMode ? 'pointer' : 'default' }}
                >
                  <div className="persona-modern-head">
                    <div className={`persona-avatar-chip ${p.color}`}>
                      {p.title.split(' ').map((w) => w[0]).join('')}
                    </div>
                    <div>
                      <h4 className="persona-title">{p.title}</h4>
                      <span className="persona-subname">{p.name}</span>
                    </div>
                  </div>

                  <p className="persona-desc">{p.description}</p>

                  {isEvaluationMode ? (
                    <button
                      type="button"
                      className={`btn btn-sm btn-block ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                    >
                      {isSelected ? '✓ Active Operator' : `Switch to ${p.title}`}
                    </button>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '0.4rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600, background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)', color: isSelected ? '#10b981' : 'var(--text-muted)' }}>
                      {isSelected ? '✓ Your Current Assigned Role' : `Role Scope: ${p.title}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Clean RBAC Matrix Table */}
          <div className="rbac-table-card">
            <h4 className="rbac-title">Network Capabilities &amp; Permissions Matrix</h4>
            <div className="table-wrapper">
              <table className="rbac-table">
                <thead>
                  <tr>
                    <th>Operational Workflow</th>
                    <th>PHC Staff</th>
                    <th>PHC Administrator</th>
                    <th>District Health Officer</th>
                    <th>Platform Administrator</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Medicine QR Check-In / Out</td>
                    <td><span className="badge badge-success">✓ Authorised</span></td>
                    <td><span className="badge badge-success">✓ Authorised</span></td>
                    <td><span className="badge badge-subtle">View Only</span></td>
                    <td><span className="badge badge-success">✓ Full Access</span></td>
                  </tr>
                  <tr>
                    <td>Live Bed Occupancy &amp; Footfall</td>
                    <td><span className="badge badge-success">✓ Authorised</span></td>
                    <td><span className="badge badge-success">✓ Authorised</span></td>
                    <td><span className="badge badge-subtle">View Only</span></td>
                    <td><span className="badge badge-success">✓ Full Access</span></td>
                  </tr>
                  <tr>
                    <td>Staff Attendance QR Badging</td>
                    <td><span className="badge badge-success">✓ Clock In/Out</span></td>
                    <td><span className="badge badge-success">✓ Manage Roster</span></td>
                    <td><span className="badge badge-subtle">Audit View</span></td>
                    <td><span className="badge badge-success">✓ Full Access</span></td>
                  </tr>
                  <tr>
                    <td>Onboard New PHC Node</td>
                    <td><span className="badge badge-danger">✕ Restricted</span></td>
                    <td><span className="badge badge-success">✓ Authorised</span></td>
                    <td><span className="badge badge-success">✓ Authorised</span></td>
                    <td><span className="badge badge-success">✓ Full Access</span></td>
                  </tr>
                  <tr>
                    <td>Verify &amp; Activate PHC in Grid</td>
                    <td><span className="badge badge-danger">✕ Restricted</span></td>
                    <td><span className="badge badge-danger">✕ Restricted</span></td>
                    <td><span className="badge badge-danger">✕ Restricted (Platform Admin Required)</span></td>
                    <td><span className="badge badge-success">✓ Full Authorization</span></td>
                  </tr>
                  <tr>
                    <td>Inter-PHC Transfer Approvals</td>
                    <td><span className="badge badge-danger">✕ Restricted</span></td>
                    <td><span className="badge badge-subtle">Request Only</span></td>
                    <td><span className="badge badge-success">✓ Sign-Off DHO</span></td>
                    <td><span className="badge badge-success">✓ Emergency Override</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
