import React, { useState } from 'react';
import {
  Pill,
  QrCode,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Layers,
  ShieldAlert,
  AlertTriangle,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QRScannerModal } from './QRScannerModal';

export const MedicineManagement = () => {
  const { currentPhc, updateMedicineStock, showToast } = useApp();

  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'checkin' | 'checkout'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState('checkin'); // 'checkin' | 'checkout'

  // Form states for Medicine Check-In
  const [inMedicineId, setInMedicineId] = useState('');
  const [inQuantity, setInQuantity] = useState('');
  const [inBatch, setInBatch] = useState('');
  const [inExpiry, setInExpiry] = useState('');
  const [inSource, setInSource] = useState('TNMSC Central Warehouse');

  // Form states for Medicine Check-Out
  const [outMedicineId, setOutMedicineId] = useState('');
  const [outQuantity, setOutQuantity] = useState('');
  const [outRecipient, setOutRecipient] = useState('Outpatient Pharmacy Counter');
  const [outNotes, setOutNotes] = useState('');

  // Confirmation dialog for checkout
  const [isCheckoutConfirmOpen, setIsCheckoutConfirmOpen] = useState(false);

  // Success result modal
  const [successReceipt, setSuccessReceipt] = useState(null);

  if (!currentPhc) return <div>Loading Medicine Inventory...</div>;

  // Handle QR scan decoded text
  // Format: "MED:med-pcm-500:PCM-2026-A1:2027-08-15:Paracetamol 500mg"
  const handleScanSuccess = (decodedText) => {
    if (!decodedText || typeof decodedText !== 'string') {
      showToast?.('Invalid QR payload', 'error');
      return;
    }

    let medId = '';
    let batch = '';
    let expiry = '';

    if (decodedText.startsWith('MED:')) {
      const parts = decodedText.split(':');
      medId = parts[1] || '';
      batch = parts[2] || '';
      expiry = parts[3] || '';
    } else {
      medId = decodedText.trim();
    }

    if (!medId) {
      showToast?.('Unable to parse medicine ID from scanned code', 'warning');
      return;
    }

    const matchedMed = currentPhc.medicines.find((m) => m.id === medId);
    if (!matchedMed) {
      showToast?.(`Medicine ID "${medId}" not found in current inventory`, 'warning');
    }

    if (scannerMode === 'checkin') {
      setInMedicineId(medId);
      if (batch) setInBatch(batch);
      if (expiry) setInExpiry(expiry);
      setActiveTab('checkin');
    } else {
      setOutMedicineId(medId);
      setActiveTab('checkout');
    }
  };

  // Submit Medicine Check-In
  const handleCheckInSubmit = (e) => {
    e.preventDefault();
    if (!inMedicineId) {
      showToast?.('Please select a medicine for check-in', 'warning');
      return;
    }

    const addQty = parseInt(inQuantity, 10);
    if (isNaN(addQty) || addQty <= 0) {
      showToast?.('Please enter a valid check-in quantity greater than 0', 'warning');
      return;
    }

    const med = currentPhc.medicines.find((m) => m.id === inMedicineId);
    const prevQty = med ? med.quantity : 0;

    const res = updateMedicineStock(currentPhc.id, inMedicineId, addQty, {
      batchNumber: (inBatch || '').trim() || med?.batchNumber || 'BATCH-STD',
      expiryDate: (inExpiry || '').trim() || med?.expiryDate || '2027-12-31',
      source: inSource
    });

    if (res?.success) {
      setSuccessReceipt({
        type: 'Medicine Check-In',
        medicineName: med?.name || 'Medicine',
        unit: med?.unit || 'Units',
        quantityAdded: addQty,
        previousStock: prevQty,
        updatedStock: prevQty + addQty,
        batchNumber: (inBatch || '').trim() || med?.batchNumber || 'BATCH-STD',
        source: inSource,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });

      // Reset fields
      setInQuantity('');
      setInBatch('');
      setInExpiry('');
    }
  };

  // Open Check-Out Confirmation Modal
  const handleCheckOutPreSubmit = (e) => {
    e.preventDefault();
    if (!outMedicineId) {
      showToast?.('Please select a medicine for dispensing', 'warning');
      return;
    }

    const deductQty = parseInt(outQuantity, 10);
    if (isNaN(deductQty) || deductQty <= 0) {
      showToast?.('Please enter a valid dispensing quantity greater than 0', 'warning');
      return;
    }

    const med = currentPhc.medicines.find((m) => m.id === outMedicineId);
    if (!med) {
      showToast?.('Selected medicine was not found in inventory', 'error');
      return;
    }

    // Strict negative stock check
    if (deductQty > med.quantity) {
      showToast?.(`Cannot dispense ${deductQty} units. Only ${med.quantity} available in current stock.`, 'warning');
      return; // blocked in UI
    }

    setIsCheckoutConfirmOpen(true);
  };

  // Confirm Check-Out
  const handleConfirmCheckOut = () => {
    const med = currentPhc.medicines.find((m) => m.id === outMedicineId);
    if (!med) return;

    const prevQty = med.quantity;
    const deductQty = parseInt(outQuantity, 10);
    if (isNaN(deductQty) || deductQty <= 0) return;

    const res = updateMedicineStock(currentPhc.id, outMedicineId, -deductQty, {
      recipient: (outRecipient || '').trim() || 'Outpatient Pharmacy Counter',
      notes: (outNotes || '').trim()
    });

    setIsCheckoutConfirmOpen(false);

    if (res.success) {
      setSuccessReceipt({
        type: 'Medicine Check-Out',
        medicineName: med.name,
        unit: med.unit,
        quantityDeducted: deductQty,
        previousStock: prevQty,
        updatedStock: prevQty - deductQty,
        recipient: outRecipient,
        notes: outNotes || 'Standard OP Dispense',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });

      setOutQuantity('');
      setOutNotes('');
    }
  };

  // Filtered medicines for catalog table
  const filteredMeds = currentPhc.medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.tamilName && m.tamilName.includes(searchTerm));
    const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const selectedInMed = currentPhc.medicines.find((m) => m.id === inMedicineId);
  const selectedOutMed = currentPhc.medicines.find((m) => m.id === outMedicineId);

  return (
    <div className="medicines-page">
      {/* Sub Navigation Bar */}
      <div className="sub-nav-bar">
        <div className="sub-nav-tabs">
          <button
            type="button"
            className={`sub-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <Layers size={16} /> Inventory Catalog ({currentPhc.medicines.length})
          </button>
          <button
            type="button"
            className={`sub-tab ${activeTab === 'checkin' ? 'active' : ''}`}
            onClick={() => setActiveTab('checkin')}
          >
            <PlusCircle size={16} className="text-emerald" /> Medicine Check-In
          </button>
          <button
            type="button"
            className={`sub-tab ${activeTab === 'checkout' ? 'active' : ''}`}
            onClick={() => setActiveTab('checkout')}
          >
            <MinusCircle size={16} className="text-rose" /> Medicine Check-Out
          </button>
        </div>

        <div className="sub-nav-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm btn-sub-scan"
            onClick={() => {
              setScannerMode('checkin');
              setIsScannerOpen(true);
            }}
          >
            <QrCode size={15} /> Scan for Medicine Check-In
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm btn-sub-scan"
            onClick={() => {
              setScannerMode('checkout');
              setIsScannerOpen(true);
            }}
          >
            <QrCode size={15} /> Scan for Medicine Check-Out
          </button>
        </div>
      </div>

      {/* TAB 1: INVENTORY CATALOG */}
      {activeTab === 'inventory' && (
        <div className="inventory-view">
          {/* Filters Bar */}
          <div className="filter-controls-row">
            <div className="search-input-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search medicine by name, category, or Tamil..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-dropdown-box">
              <Filter size={16} className="text-muted" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="Analgesic / Antipyretic">Analgesic / Antipyretic</option>
                <option value="Antibiotic">Antibiotic</option>
                <option value="Antidiabetic">Antidiabetic</option>
                <option value="Electrolytes">Electrolytes</option>
                <option value="Emergency Vaccine">Emergency Vaccine</option>
                <option value="Cold Chain Hormone">Cold Chain Hormone</option>
              </select>
            </div>
          </div>

          {/* Medicines Grid / Table */}
          <div className="table-responsive-card">
            <table className="data-table mobile-cards inventory-table">
              <thead>
                <tr>
                  <th>Medicine Name &amp; Category</th>
                  <th>Current Stock</th>
                  <th>Min. Threshold</th>
                  <th>Safety Status</th>
                  <th>Batch / Expiry</th>
                  <th>Daily Burn Rate</th>
                  <th>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeds.map((med) => {
                  const isCritical = med.quantity < med.minThreshold * 0.5;
                  const isLow = med.quantity < med.minThreshold;
                  const daysLeft =
                    med.dailyUsageRate > 0 ? (med.quantity / med.dailyUsageRate).toFixed(1) : '∞';

                  return (
                    <tr key={med.id} className={isCritical ? 'row-critical' : isLow ? 'row-warning' : ''}>
                      <td data-label="Medicine Name & Category">
                        <div className="med-name-cell">
                          <strong className="med-name">{med.name}</strong>
                          {med.tamilName && <span className="med-tamil-name">{med.tamilName}</span>}
                          <span className="badge badge-subtle">{med.category}</span>
                        </div>
                      </td>
                      <td data-label="Current Stock">
                        <div className="med-qty-cell">
                          <span className={`qty-number ${isCritical ? 'text-rose' : isLow ? 'text-amber' : 'text-emerald'}`}>
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
                      <td data-label="Safety Status">
                        {isCritical ? (
                          <span className="badge badge-danger">
                            <ShieldAlert size={12} /> Critical Shortage
                          </span>
                        ) : isLow ? (
                          <span className="badge badge-warning">
                            <AlertCircle size={12} /> Below Minimum
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            <CheckCircle size={12} /> Optimal Stock
                          </span>
                        )}
                      </td>
                      <td data-label="Batch / Expiry">
                        <div className="batch-cell">
                          <code>{med.batchNumber}</code>
                          <span className="expiry-date">Exp: {med.expiryDate}</span>
                        </div>
                      </td>
                      <td data-label="Daily Burn Rate">
                        <div className="forecast-mini-cell">
                          <span>~{med.dailyUsageRate} {med.unit}/day</span>
                          <small className={Number(daysLeft) < 3 ? 'text-rose font-bold' : 'text-muted'}>
                            {daysLeft} days remaining
                          </small>
                        </div>
                      </td>
                      <td data-label="Quick Actions">
                        <div className="action-buttons-cell">
                          <button
                            type="button"
                            className="btn-tiny btn-action-in"
                            onClick={() => {
                              setInMedicineId(med.id);
                              setActiveTab('checkin');
                            }}
                            title="Medicine Check-In (Receive Stock)"
                          >
                            + In
                          </button>
                          <button
                            type="button"
                            className="btn-tiny btn-action-out"
                            onClick={() => {
                              setOutMedicineId(med.id);
                              setActiveTab('checkout');
                            }}
                            title="Medicine Check-Out (Dispense)"
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
      )}

      {/* TAB 2: MEDICINE CHECK-IN */}
      {activeTab === 'checkin' && (
        <div className="transaction-form-card">
          <div className="form-card-header">
            <div>
              <div className="badge-demo-tag text-emerald">Inbound Consignment Receipt</div>
              <h3>Medicine Check-In</h3>
              <p className="form-subtitle">
                Record received medicine consignments. Increases current stock in local simulation (target &lt; 3.0s).
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-scan-launcher"
              onClick={() => {
                setScannerMode('checkin');
                setIsScannerOpen(true);
              }}
            >
              <QrCode size={18} /> Launch QR Camera Scanner
            </button>
          </div>

          {/* Identified Medicine Card (if selected or scanned) */}
          {selectedInMed && (
            <div className="identified-med-card animate-fade-in">
              <div className="med-icon-badge bg-emerald-light text-emerald">
                <Pill size={24} />
              </div>
              <div className="identified-info">
                <span className="tag-identified">IDENTIFIED MEDICINE SKU</span>
                <h4>{selectedInMed.name}</h4>
                <p>
                  Category: <strong>{selectedInMed.category}</strong> • Current Stock:{' '}
                  <strong>{selectedInMed.quantity} {selectedInMed.unit}</strong> • Minimum Threshold:{' '}
                  <strong>{selectedInMed.minThreshold} {selectedInMed.unit}</strong>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleCheckInSubmit} className="transaction-form">
            <div className="form-grid">
              <div className="form-group">
                <label>
                  Select Medicine SKU <span className="req-star" title="Required field">*</span>
                </label>
                <select
                  required
                  value={inMedicineId}
                  onChange={(e) => setInMedicineId(e.target.value)}
                >
                  <option value="">-- Choose Medicine --</option>
                  {currentPhc.medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Current: {m.quantity} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Received Quantity to Add <span className="req-star" title="Required field">*</span>
                </label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 100"
                    value={inQuantity}
                    onChange={(e) => setInQuantity(e.target.value)}
                  />
                  <span className="input-unit-label">
                    {selectedInMed ? selectedInMed.unit : 'Units'}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Batch Number</label>
                <input
                  type="text"
                  placeholder="e.g. PCM-2026-B2"
                  value={inBatch}
                  onChange={(e) => setInBatch(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={inExpiry}
                  onChange={(e) => setInExpiry(e.target.value)}
                />
              </div>

              <div className="form-group full-width">
                <label>Delivery Source / Supplier</label>
                <input
                  type="text"
                  placeholder="e.g. TNMSC Central Warehouse / District Logistics"
                  value={inSource}
                  onChange={(e) => setInSource(e.target.value)}
                />
              </div>
            </div>

            {selectedInMed && inQuantity && (
              <div className="preview-stat-card">
                <span>Stock Impact Preview:</span>
                <strong>
                  {selectedInMed.name}: {selectedInMed.quantity} &rarr;{' '}
                  <span className="text-emerald font-bold">
                    {selectedInMed.quantity + (Number(inQuantity) || 0)} {selectedInMed.unit}
                  </span>
                </strong>
                <span className="badge badge-success">Processed in &lt; 3s target</span>
              </div>
            )}

            <div className="form-actions-row">
              <button type="submit" className="btn btn-primary">
                <PlusCircle size={18} /> Confirm Medicine Check-In
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setActiveTab('inventory')}
              >
                Back to Catalog
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: MEDICINE CHECK-OUT */}
      {activeTab === 'checkout' && (
        <div className="transaction-form-card">
          <div className="form-card-header">
            <div>
              <div className="badge-demo-tag text-rose">Outbound Dispensation</div>
              <h3>Medicine Check-Out</h3>
              <p className="form-subtitle">
                Dispense medicine to clinical wards or outpatient pharmacy. Prevents negative stock and
                warns if balance falls below minimum threshold.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-scan-launcher"
              onClick={() => {
                setScannerMode('checkout');
                setIsScannerOpen(true);
              }}
            >
              <QrCode size={18} /> Launch QR Camera Scanner
            </button>
          </div>

          {/* Identified Medicine Card (if selected or scanned) */}
          {selectedOutMed && (
            <div className="identified-med-card checkout animate-fade-in">
              <div className="med-icon-badge bg-rose-light text-rose">
                <Pill size={24} />
              </div>
              <div className="identified-info">
                <span className="tag-identified">IDENTIFIED MEDICINE SKU</span>
                <h4>{selectedOutMed.name}</h4>
                <p>
                  Available for Dispensation:{' '}
                  <strong>{selectedOutMed.quantity} {selectedOutMed.unit}</strong> • Minimum Safety Level:{' '}
                  <strong>{selectedOutMed.minThreshold} {selectedOutMed.unit}</strong>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleCheckOutPreSubmit} className="transaction-form">
            <div className="form-grid">
              <div className="form-group">
                <label>
                  Select Medicine SKU <span className="req-star" title="Required field">*</span>
                </label>
                <select
                  required
                  value={outMedicineId}
                  onChange={(e) => setOutMedicineId(e.target.value)}
                >
                  <option value="">-- Choose Medicine --</option>
                  {currentPhc.medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Available: {m.quantity} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Quantity to Dispense <span className="req-star" title="Required field">*</span>
                </label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 10"
                    value={outQuantity}
                    onChange={(e) => setOutQuantity(e.target.value)}
                  />
                  <span className="input-unit-label">
                    {selectedOutMed ? selectedOutMed.unit : 'Units'}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Dispensing Destination / Ward</label>
                <select
                  value={outRecipient}
                  onChange={(e) => setOutRecipient(e.target.value)}
                >
                  <option value="Outpatient Pharmacy Counter">Outpatient Pharmacy Counter</option>
                  <option value="Emergency Treatment Room">Emergency Treatment Room</option>
                  <option value="Inpatient Observation Ward">Inpatient Observation Ward</option>
                  <option value="Maternity & Child Health">Maternity &amp; Child Health</option>
                  <option value="Immunization Clinic">Immunization Clinic</option>
                </select>
              </div>

              <div className="form-group">
                <label>Prescription / Dispensing Notes</label>
                <input
                  type="text"
                  placeholder="e.g. OP Token #44-52 or Ward Indent"
                  value={outNotes}
                  onChange={(e) => setOutNotes(e.target.value)}
                />
              </div>
            </div>

            {selectedOutMed && outQuantity && (
              <div className="preview-stat-card checkout-preview">
                {selectedOutMed.quantity < Number(outQuantity) ? (
                  <div className="alert-banner critical">
                    <ShieldAlert size={18} />
                    <span>
                      ERROR: Requested {outQuantity} {selectedOutMed.unit} exceeds available stock of{' '}
                      {selectedOutMed.quantity} {selectedOutMed.unit}! Negative stock strictly prohibited.
                    </span>
                  </div>
                ) : (
                  <>
                    <span>Stock Impact Preview:</span>
                    <strong>
                      {selectedOutMed.name}: {selectedOutMed.quantity} &rarr;{' '}
                      <span className="text-amber font-bold">
                        {selectedOutMed.quantity - (Number(outQuantity) || 0)} {selectedOutMed.unit}
                      </span>
                    </strong>
                    {selectedOutMed.quantity - (Number(outQuantity) || 0) < selectedOutMed.minThreshold && (
                      <span className="badge badge-warning">
                        ⚠️ WARNING: Stock will drop below safety threshold ({selectedOutMed.minThreshold} {selectedOutMed.unit})
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="form-actions-row">
              <button
                type="submit"
                className="btn btn-danger"
                disabled={!selectedOutMed || selectedOutMed.quantity < Number(outQuantity) || !outQuantity}
              >
                <MinusCircle size={18} /> Review &amp; Confirm Check-Out
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setActiveTab('inventory')}
              >
                Back to Catalog
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR CHECK-OUT */}
      {isCheckoutConfirmOpen && selectedOutMed && (
        <div className="modal-backdrop" onClick={() => setIsCheckoutConfirmOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge bg-rose-light text-rose">
                  <MinusCircle size={22} />
                </div>
                <div>
                  <h3>Confirm Medicine Check-Out</h3>
                  <p className="modal-subtitle">Verify details before committing stock deduction</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setIsCheckoutConfirmOpen(false)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="confirmation-summary-box">
                <div className="summary-row">
                  <span>Medicine Name:</span>
                  <strong>{selectedOutMed.name}</strong>
                </div>
                <div className="summary-row">
                  <span>Dispense Quantity:</span>
                  <strong className="text-rose font-bold">
                    {outQuantity} {selectedOutMed.unit}
                  </strong>
                </div>
                <div className="summary-row">
                  <span>Destination:</span>
                  <strong>{outRecipient}</strong>
                </div>
                <div className="summary-row">
                  <span>Current Stock:</span>
                  <span>{selectedOutMed.quantity} {selectedOutMed.unit}</span>
                </div>
                <div className="summary-row highlight">
                  <span>New Stock Remaining:</span>
                  <strong className="text-emerald">
                    {selectedOutMed.quantity - Number(outQuantity)} {selectedOutMed.unit}
                  </strong>
                </div>
              </div>

              {selectedOutMed.quantity - Number(outQuantity) < selectedOutMed.minThreshold && (
                <div className="alert-banner warning">
                  <AlertTriangle size={18} />
                  <span>
                    Warning: Stock balance ({selectedOutMed.quantity - Number(outQuantity)} {selectedOutMed.unit})
                    will trigger a Low Stock Alert.
                  </span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsCheckoutConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmCheckOut}
              >
                <Check size={16} /> Confirm &amp; Save Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS RECEIPT MODAL */}
      {successReceipt && (
        <div className="modal-backdrop" onClick={() => setSuccessReceipt(null)}>
          <div className="modal-card receipt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge bg-emerald-light text-emerald">
                  <CheckCircle size={22} />
                </div>
                <div>
                  <h3>Transaction Successful</h3>
                  <p className="modal-subtitle">Updated stock recorded across network telemetry</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSuccessReceipt(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="receipt-box">
                <div className="receipt-header">
                  <h4>{successReceipt.type} Receipt</h4>
                  <span className="timestamp-badge">{successReceipt.timestamp}</span>
                </div>

                <div className="receipt-content">
                  <div className="receipt-line">
                    <span>Medicine:</span>
                    <strong>{successReceipt.medicineName}</strong>
                  </div>
                  {successReceipt.quantityAdded && (
                    <div className="receipt-line">
                      <span>Quantity Received:</span>
                      <strong className="text-emerald">+{successReceipt.quantityAdded} {successReceipt.unit}</strong>
                    </div>
                  )}
                  {successReceipt.quantityDeducted && (
                    <div className="receipt-line">
                      <span>Quantity Dispensed:</span>
                      <strong className="text-rose">-{successReceipt.quantityDeducted} {successReceipt.unit}</strong>
                    </div>
                  )}
                  <div className="receipt-line highlight">
                    <span>Updated Stock Balance:</span>
                    <strong className="text-primary font-bold">
                      {successReceipt.updatedStock} {successReceipt.unit}
                    </strong>
                  </div>
                  {successReceipt.batchNumber && (
                    <div className="receipt-line">
                      <span>Batch #:</span>
                      <code>{successReceipt.batchNumber}</code>
                    </div>
                  )}
                  {successReceipt.recipient && (
                    <div className="receipt-line">
                      <span>Recipient Ward:</span>
                      <span>{successReceipt.recipient}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSuccessReceipt(null)}
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
        title={scannerMode === 'checkin' ? 'Scan Incoming Medicine QR' : 'Scan Outgoing Medicine QR'}
        scanType="medicine"
      />
    </div>
  );
};
