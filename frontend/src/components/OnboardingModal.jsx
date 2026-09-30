import React, { useState } from 'react';
import {
  Building2,
  CheckCircle,
  ShieldCheck,
  X,
  PlusCircle,
  FileCheck,
  User,
  Pill,
  Bed,
  Users,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const OnboardingModal = ({ isOpen, onClose }) => {
  const { phcs, registerNewPHC, verifyPHC, currentRole } = useApp();

  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'pending'
  const [formData, setFormData] = useState({
    name: '',
    tamilName: '',
    district: 'Chengalpattu',
    location: '',
    contactPerson: '',
    phone: '',
    email: '',
    regularPatientCount: '350',
    bedCapacity: '20',
    initialParacetamol: '600',
    initialAmoxicillin: '400',
    initialMetformin: '450',
    initialORS: '700',
    initialRabies: '30',
    initialInsulin: '50'
  });

  if (!isOpen) return null;

  const pendingPhcs = phcs.filter((p) => p.status === 'Pending Verification');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contactPerson) return;

    registerNewPHC({
      ...formData,
      medicines: [
        {
          id: 'med-pcm-500',
          name: 'Paracetamol 500mg',
          tamilName: 'பாராசிட்டமால் 500மி.கி',
          category: 'Analgesic / Antipyretic',
          quantity: Number(formData.initialParacetamol) || 600,
          minThreshold: 250,
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
          quantity: Number(formData.initialAmoxicillin) || 400,
          minThreshold: 200,
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
          quantity: Number(formData.initialMetformin) || 450,
          minThreshold: 200,
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
          quantity: Number(formData.initialORS) || 700,
          minThreshold: 300,
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
          quantity: Number(formData.initialRabies) || 30,
          minThreshold: 20,
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
          quantity: Number(formData.initialInsulin) || 50,
          minThreshold: 35,
          unit: 'Cartridges',
          batchNumber: `INIT-INS-${Date.now().toString().slice(-4)}`,
          expiryDate: '2027-04-30',
          source: 'Cold Chain Initial Depot',
          dailyUsageRate: 6,
          lastUpdated: new Date().toISOString()
        }
      ]
    });
    setActiveTab('pending');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card onboarding-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge bg-primary-light text-primary">
              <Building2 size={22} />
            </div>
            <div>
              <h3>PHC Registration &amp; Network Verification</h3>
              <p className="modal-subtitle">
                Register new PHC centres or verify pending applications (Demo Mode)
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            <PlusCircle size={15} /> 1. Register New PHC
          </button>
          <button
            type="button"
            className={`modal-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <FileCheck size={15} /> 2. Administrator Verification Queue ({pendingPhcs.length})
          </button>
        </div>

        <div className="modal-body">
          {/* TAB 1: REGISTRATION FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleSubmit} className="onboarding-form">
              <div className="form-section-title">
                <span>Facility Identity &amp; Authorized Contact</span>
              </div>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Primary Health Centre (PHC) Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alandur Urban Primary Health Centre"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Tamil Translation / பெயர் (தமிழ்)</label>
                  <input
                    type="text"
                    placeholder="e.g. ஆலந்தூர் ஆரம்ப சுகாதார நிலையம்"
                    value={formData.tamilName}
                    onChange={(e) => setFormData({ ...formData, tamilName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>District *</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  >
                    <option value="Chengalpattu">Chengalpattu</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Kanchipuram">Kanchipuram</option>
                    <option value="Tiruvallur">Tiruvallur</option>
                    <option value="Vellore">Vellore</option>
                    <option value="Coimbatore">Coimbatore</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Physical Address / Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="Street, Landmark, Pincode"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Authorized Contact Person (Medical Officer) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. M. Kavitha"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Official Contact Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98400 00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-section-title">
                <span>Baseline Capacity &amp; Resource Opening Stock</span>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Overall Regular Patient Baseline Count *</label>
                  <input
                    type="number"
                    min="50"
                    required
                    value={formData.regularPatientCount}
                    onChange={(e) => setFormData({ ...formData, regularPatientCount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Total Bed Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.bedCapacity}
                    onChange={(e) => setFormData({ ...formData, bedCapacity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Opening Paracetamol 500mg (Strips)</label>
                  <input
                    type="number"
                    value={formData.initialParacetamol}
                    onChange={(e) => setFormData({ ...formData, initialParacetamol: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Opening Amoxicillin 500mg (Strips)</label>
                  <input
                    type="number"
                    value={formData.initialAmoxicillin}
                    onChange={(e) => setFormData({ ...formData, initialAmoxicillin: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Opening Metformin 500mg (Strips)</label>
                  <input
                    type="number"
                    value={formData.initialMetformin}
                    onChange={(e) => setFormData({ ...formData, initialMetformin: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Opening Oral Rehydration Salts (ORS Sachets)</label>
                  <input
                    type="number"
                    value={formData.initialORS}
                    onChange={(e) => setFormData({ ...formData, initialORS: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Opening Anti-Rabies Vaccine (Vials)</label>
                  <input
                    type="number"
                    value={formData.initialRabies}
                    onChange={(e) => setFormData({ ...formData, initialRabies: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Opening Insulin Glargine (Cartridges)</label>
                  <input
                    type="number"
                    value={formData.initialInsulin}
                    onChange={(e) => setFormData({ ...formData, initialInsulin: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions-row">
                <button type="submit" className="btn btn-primary">
                  <CheckCircle size={16} /> Submit PHC for Verification
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: VERIFICATION QUEUE */}
          {activeTab === 'pending' && (
            <div className="pending-verification-view">
              <div className="verification-notice-banner">
                <ShieldCheck size={20} className="text-primary" />
                <div>
                  <strong>Role Authorized: Platform Administrator</strong>
                  <p>
                    Review facility credentials. Upon clicking "Approve PHC", node joins the live
                    operational network within 5 seconds.
                  </p>
                </div>
              </div>

              {pendingPhcs.length === 0 ? (
                <div className="empty-state-card">
                  <CheckCircle size={36} className="text-emerald" />
                  <p>All submitted PHCs have been verified and are active in the network!</p>
                </div>
              ) : (
                <div className="pending-phc-cards">
                  {pendingPhcs.map((phc) => (
                    <div key={phc.id} className="pending-phc-card">
                      <div className="phc-card-top-row">
                        <div>
                          <h4 className="pending-name">{phc.name}</h4>
                          <span className="pending-district">
                            {phc.district} • {phc.location || 'Location details verified'}
                          </span>
                        </div>
                        <span className="badge badge-warning">Awaiting Approval</span>
                      </div>

                      <div className="pending-specs-grid">
                        <div className="spec-pill">
                          <Bed size={14} /> Total Beds: <strong>{phc.bedCapacity}</strong>
                        </div>
                        <div className="spec-pill">
                          <Users size={14} /> Baseline Patients: <strong>{phc.regularPatientCount}</strong>
                        </div>
                        <div className="spec-pill">
                          <Pill size={14} /> Tracked SKUs: <strong>{phc.medicines.length}</strong>
                        </div>
                        <div className="spec-pill">
                          <User size={14} /> Officer: <strong>{phc.contactPerson}</strong>
                        </div>
                      </div>

                      <div className="pending-card-actions">
                        {currentRole === 'platform_admin' ? (
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => {
                              verifyPHC(phc.id);
                            }}
                          >
                            <CheckCircle size={16} /> Approve PHC &amp; Activate Node (&lt; 5s)
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-outline"
                            disabled
                            style={{ opacity: 0.6, cursor: 'not-allowed' }}
                            title="Only Platform Administrators can verify and activate PHCs"
                          >
                            <Lock size={14} /> Platform Admin Required to Activate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
