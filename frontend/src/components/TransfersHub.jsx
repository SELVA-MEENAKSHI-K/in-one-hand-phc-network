import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Clock,
  CheckCircle,
  Truck,
  CheckCheck,
  Send,
  PlusCircle,
  XCircle,
  Bed,
  Edit3,
  Check,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TransfersHub = ({ preFillData, clearPreFillData, setActiveTab: setAppTab }) => {
  const {
    phcs,
    currentPhc,
    currentRole,
    transfers,
    createTransferRequest,
    reviewTransfer,
    dispatchTransfer,
    confirmReceiptTransfer,
    getRoleTitle,
    isEvaluationMode,
    showToast
  } = useApp();

  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Pending Approval' | 'In Transit' | 'Delivered'
  const [isModalOpen, setIsModalOpen] = useState(!!preFillData);

  // Transfer Request Flow States (Screen 7 requirements)
  const [targetMedId, setTargetMedId] = useState(preFillData?.medicineId || 'med-amx-500');
  const [targetQty, setTargetQty] = useState(preFillData?.quantity || '100');
  const [targetSourceId, setTargetSourceId] = useState(preFillData?.sourcePhcId || '');
  const [urgency, setUrgency] = useState(preFillData?.urgency || 'Urgent');
  const [reason, setReason] = useState(preFillData?.reason || 'Current stock below minimum threshold');

  // Edit Transfer modal state (for DHO)
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Dispatch notes state
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [dispatchingId, setDispatchingId] = useState(null);

  React.useEffect(() => {
    if (preFillData) {
      const id = requestAnimationFrame(() => {
        setTargetMedId(preFillData.medicineId || 'med-amx-500');
        setTargetQty(preFillData.quantity || '100');
        setTargetSourceId(preFillData.sourcePhcId || '');
        setUrgency(preFillData.urgency || 'Urgent');
        setReason(preFillData.reason || '');
        setIsModalOpen(true);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [preFillData]);

  if (!currentPhc) return <div>Loading Transfers...</div>;

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!targetMedId || !targetQty || !targetSourceId) {
      showToast?.('Please fill all required transfer fields', 'warning');
      return;
    }

    if (targetSourceId === currentPhc.id) {
      showToast?.('Source PHC cannot be the same as the requesting health centre', 'warning');
      return;
    }

    const parsedQty = parseInt(targetQty, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      showToast?.('Please enter a valid transfer quantity greater than 0', 'warning');
      return;
    }

    const sourcePhc = phcs.find((p) => p.id === targetSourceId);
    const medObj = currentPhc.medicines.find((m) => m.id === targetMedId);

    createTransferRequest({
      requestingPhcId: currentPhc.id,
      requestingPhcName: currentPhc.name,
      sourcePhcId: targetSourceId,
      sourcePhcName: sourcePhc?.name || 'Neighbouring PHC',
      medicineId: targetMedId,
      medicineName: medObj?.name || 'Medicine',
      quantity: parsedQty,
      unit: medObj?.unit || 'Strips',
      urgency,
      reason: (reason || '').trim() || 'Urgent inter-PHC stock redistribution'
    });

    setIsModalOpen(false);
    if (clearPreFillData) clearPreFillData();
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const parsedEditQty = parseInt(editQty, 10);
    if (!editingTransfer || isNaN(parsedEditQty) || parsedEditQty <= 0) {
      showToast?.('Please enter a valid transfer quantity greater than 0', 'warning');
      return;
    }
    reviewTransfer(editingTransfer.id, 'edit', editNotes, parsedEditQty);
    setEditingTransfer(null);
  };

  const selectedMed = currentPhc.medicines.find((m) => m.id === targetMedId);

  // Find nearby PHCs with potentially available stock (Requirement 7.2 & 7.3)
  const nearbyPhcsWithStock = phcs
    .filter((p) => p.id !== currentPhc.id && p.status === 'Approved')
    .map((p) => {
      const matchingMed = p.medicines.find((m) => m.id === targetMedId);
      const stock = matchingMed ? matchingMed.quantity : 0;
      const threshold = matchingMed ? matchingMed.minThreshold : 0;
      const surplus = stock - threshold;
      const remainingAfterProposed = stock - (Number(targetQty) || 0);
      const isSurplusSafe = remainingAfterProposed >= threshold;

      return {
        phc: p,
        stock,
        threshold,
        surplus,
        remainingAfterProposed,
        isSurplusSafe,
        unit: matchingMed?.unit || 'Strips'
      };
    })
    .sort((a, b) => b.surplus - a.surplus);

  // Suggest best source PHC
  const suggestedSource = nearbyPhcsWithStock.find((item) => item.isSurplusSafe) || nearbyPhcsWithStock[0];

  const filteredTransfers = transfers.filter((trf) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'Pending Approval') return trf.status === 'Pending DHO Approval';
    if (statusFilter === 'In Transit') return trf.status === 'Approved' || trf.status === 'Dispatched';
    if (statusFilter === 'Completed') return trf.status === 'Completed';
    return true;
  });

  return (
    <div className="transfers-page">
      {/* Banner */}
      <div className="section-header-banner">
        <div>
          <div className="badge-demo-tag">Demo Simulation • Inter-PHC Logistics</div>
          <h2>Resource Transfers Hub</h2>
          <p>
            4-Stage Inter-PHC Stock Balancing: <strong>Request</strong> &rarr; <strong>DHO Authorization</strong> &rarr;{' '}
            <strong>Dispatch</strong> &rarr; <strong>Confirmed Receipt</strong> with double-entry stock update.
          </p>
        </div>

        <div className="transfers-banner-actions">
          {isEvaluationMode && (
            <div className="benchmark-pill pass">
              <Clock size={14} /> Simulated dispatch target: &lt; 3.0s
            </div>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (suggestedSource && !targetSourceId) {
                setTargetSourceId(suggestedSource.phc.id);
              }
              setIsModalOpen(true);
            }}
          >
            <PlusCircle size={16} /> + New Transfer Request
          </button>
        </div>
      </div>

      {/* Advisory Legal Disclaimer */}
      <div className="disclaimer-callout-card">
        <Info size={18} className="text-primary" />
        <div>
          <strong>Operational Protocol Disclaimer:</strong>
          <p>
            The app recommends and records transfers; it does not automatically move medicine. Physical
            consignment transport is executed via official District Health logistics couriers upon DHO approval.
          </p>
        </div>
      </div>

      {/* Status Filter Sub-Nav Bar */}
      <div className="sub-nav-bar">
        <div className="sub-nav-tabs">
          <button
            type="button"
            className={`sub-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            <ArrowRightLeft size={16} /> All Consignments ({transfers.length})
          </button>
          <button
            type="button"
            className={`sub-tab ${statusFilter === 'Pending Approval' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Pending Approval')}
          >
            <Clock size={16} /> Pending Approval ({transfers.filter((t) => t.status === 'Pending DHO Approval').length})
          </button>
          <button
            type="button"
            className={`sub-tab ${statusFilter === 'In Transit' ? 'active' : ''}`}
            onClick={() => setStatusFilter('In Transit')}
          >
            <Truck size={16} /> In Transit / Dispatched ({transfers.filter((t) => t.status === 'Approved' || t.status === 'Dispatched').length})
          </button>
          <button
            type="button"
            className={`sub-tab ${statusFilter === 'Completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('Completed')}
          >
            <CheckCircle2 size={16} /> Completed ({transfers.filter((t) => t.status === 'Completed').length})
          </button>
        </div>
      </div>

      {/* 4-Stage Visual Workflow Indicator */}
      <div className="workflow-steps-indicator">
        <div className="step-item">
          <div className="step-circle active">1</div>
          <div className="step-desc">
            <strong>1. Transfer Request</strong>
            <span>Select medicine &amp; proposed source</span>
          </div>
        </div>
        <div className="step-arrow">&rarr;</div>
        <div className="step-item">
          <div className="step-circle active">2</div>
          <div className="step-desc">
            <strong>2. DHO Authorization</strong>
            <span>District officer approves / edits / rejects</span>
          </div>
        </div>
        <div className="step-arrow">&rarr;</div>
        <div className="step-item">
          <div className="step-circle active">3</div>
          <div className="step-desc">
            <strong>3. Consignment Dispatch</strong>
            <span>Source PHC logs courier transport</span>
          </div>
        </div>
        <div className="step-arrow">&rarr;</div>
        <div className="step-item">
          <div className="step-circle active">4</div>
          <div className="step-desc">
            <strong>4. Confirmed Receipt</strong>
            <span>Receiver confirms &amp; stock restocks</span>
          </div>
        </div>
      </div>

      {/* TRANSFER REQUESTS LIST */}
      <div className="transfers-list-container">
        <div className="section-title-row">
          <div>
            <h3>
              Transfer Pipeline Status{' '}
              {statusFilter === 'ALL'
                ? `(${transfers.length})`
                : `(${filteredTransfers.length} of ${transfers.length})`}
            </h3>
            <p className="section-hint">Double-entry stock balancing updates both sending and receiving PHCs upon receipt</p>
          </div>
        </div>

        {filteredTransfers.length === 0 ? (
          <div className="empty-state-card">
            <ArrowRightLeft size={48} className="text-muted" />
            <h3>No Transfer Requests in Current Filter</h3>
            <p>Try switching filter tabs or click "+ New Transfer Request" to initiate a replenishment request.</p>
          </div>
        ) : (
          <div className="transfers-grid">
            {filteredTransfers.map((trf) => {
                const isPendingDho = trf.status === 'Pending DHO Approval';
                const isApproved = trf.status === 'Approved';
                const isDispatched = trf.status === 'Dispatched';
                const isCompleted = trf.status === 'Completed';
                const isRejected = trf.status === 'Rejected';

                const isReceiver = currentPhc.id === trf.requestingPhcId;
                const isSender = currentPhc.id === trf.sourcePhcId;
                const isDHO = currentRole === 'district_officer' || currentRole === 'platform_admin';

                return (
                  <div key={trf.id} className="transfer-card">
                    <div className="transfer-card-header">
                      <div className="transfer-id-group">
                        <span className="transfer-id-tag">#{trf.id}</span>
                        <span
                          className={`badge ${
                            trf.urgency === 'Emergency'
                              ? 'badge-danger'
                              : trf.urgency === 'Urgent'
                              ? 'badge-warning'
                              : 'badge-subtle'
                          }`}
                        >
                          {trf.urgency} Priority
                        </span>
                      </div>

                      <span
                        className={`badge ${
                          isCompleted
                            ? 'badge-success'
                            : isDispatched
                            ? 'badge-info'
                            : isApproved
                            ? 'badge-warning'
                            : isRejected
                            ? 'badge-danger'
                            : 'badge-danger'
                        }`}
                      >
                        {trf.status}
                      </span>
                    </div>

                    <div className="transfer-details-row">
                      <div className="node-transfer-pill from">
                        <span className="node-role-label">Source PHC (Sender):</span>
                        <strong>{trf.sourcePhcName}</strong>
                      </div>

                      <div className="transfer-arrow-middle">
                        <ArrowRightLeft size={20} className="text-primary" />
                        <strong className="transfer-qty-tag">
                          {trf.quantity} {trf.unit}
                        </strong>
                        <span className="transfer-med-label">{trf.medicineName}</span>
                      </div>

                      <div className="node-transfer-pill to">
                        <span className="node-role-label">Destination PHC (Receiver):</span>
                        <strong>{trf.requestingPhcName}</strong>
                      </div>
                    </div>

                    <div className="transfer-meta-block">
                      <p className="transfer-reason">
                        <strong>Reason:</strong> {trf.reason}
                      </p>
                      <div className="transfer-timeline-meta">
                        <span>Requested: {new Date(trf.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {trf.dhoApprovedAt && (
                          <span>• DHO Authorized: {trf.dhoApprovedBy} {trf.dhoNotes ? `("${trf.dhoNotes}")` : ''}</span>
                        )}
                        {trf.dispatchedAt && (
                          <span>• Dispatched: {trf.dispatchNotes || 'In Transit'}</span>
                        )}
                        {trf.receivedAt && (
                          <span>• Confirmed Received: Both PHCs Restocked</span>
                        )}
                        {trf.rejectionReason && (
                          <span className="text-rose font-bold">• Rejected: {trf.rejectionReason}</span>
                        )}
                      </div>
                    </div>

                    {/* Action Controls for each stage */}
                    <div className="transfer-action-footer">
                      {/* Stage 2: DHO Authorization (Approve / Edit / Reject) */}
                      {isPendingDho && (
                        <div className="dho-approval-actions">
                          {isDHO ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() => reviewTransfer(trf.id, 'approve')}
                              >
                                <CheckCircle size={15} /> Approve Transfer (DHO)
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                  setEditingTransfer(trf);
                                  setEditQty(String(trf.quantity));
                                  setEditNotes('');
                                }}
                              >
                                <Edit3 size={14} /> Edit Quantity
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => reviewTransfer(trf.id, 'reject', 'Source surplus insufficient')}
                              >
                                <XCircle size={15} /> Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-amber flex items-center gap-1">
                              <Clock size={13} /> Awaiting District Health Officer Authorization (Approval restricted for {getRoleTitle ? getRoleTitle(currentRole) : currentRole})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stage 3: Source Dispatch */}
                      {isApproved && (
                        <div className="source-dispatch-actions">
                          {isSender || isDHO ? (
                            dispatchingId === trf.id ? (
                              <div className="dispatch-input-row">
                                <input
                                  type="text"
                                  placeholder="Van / Courier logistics details..."
                                  value={dispatchNotes}
                                  onChange={(e) => setDispatchNotes(e.target.value)}
                                />
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => {
                                    dispatchTransfer(trf.id, dispatchNotes);
                                    setDispatchingId(null);
                                    setDispatchNotes('');
                                  }}
                                >
                                  Confirm Dispatch
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => setDispatchingId(trf.id)}
                              >
                                <Truck size={15} /> Dispatch Consignment
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-muted">
                              Authorized by DHO. Awaiting parcel dispatch by {trf.sourcePhcName}.
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stage 4: Confirmed Receipt */}
                      {isDispatched && (
                        <div className="receipt-confirmation-actions">
                          {isReceiver || isDHO ? (
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => confirmReceiptTransfer(trf.id)}
                            >
                              <CheckCheck size={16} /> Confirm Receipt &amp; Restock
                            </button>
                          ) : (
                            <span className="text-xs text-muted">
                              Consignment in transit. Awaiting receipt confirmation by {trf.requestingPhcName}.
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stage 5: Completed */}
                      {isCompleted && (
                        <div className="completed-badge-row">
                          <CheckCircle size={16} className="text-emerald" />
                          <span>Double-Entry Stock Confirmed: Balanced at both PHCs</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* SUMMARY LINK CARD: BEDS & STAFF COORDINATION */}
      <div className="transfers-summary-link-card">
        <div className="summary-card-icon-col">
          <div className="summary-card-icon-badge bg-sky-light text-sky">
            <Bed size={22} />
          </div>
        </div>
        <div className="summary-card-body-col">
          <h4>Looking for District-Wide Bed Vacancies or Staff Rosters?</h4>
          <p>
            Bed availability controls, staff duty check-ins, and aggregate patient footfall counters are managed in the dedicated <strong>Beds &amp; Unified Resources</strong> operations page.
          </p>
        </div>
        <div className="summary-card-action-col">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setAppTab && setAppTab('resources')}
          >
            Open Beds &amp; Unified Resources &rarr;
          </button>
        </div>
      </div>

      {/* NEW TRANSFER REQUEST MODAL (Screen 7.1, 7.2, 7.3) */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card transfer-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge bg-primary-light text-primary">
                  <ArrowRightLeft size={22} />
                </div>
                <div>
                  <h3>Create Transfer Request</h3>
                  <p className="modal-subtitle">
                    Step 1–3: Select needed resource and review suggested nearby source PHCs
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleRequestSubmit}>
              <div className="modal-body">
                {/* Step 1: Select Medicine and Quantity */}
                <div className="form-group">
                  <label>1. Select Medicine SKU Needed *</label>
                  <select
                    required
                    value={targetMedId}
                    onChange={(e) => setTargetMedId(e.target.value)}
                  >
                    {currentPhc.medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Current Stock: {m.quantity} {m.unit} • Threshold: {m.minThreshold})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantity Required *</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 100"
                      value={targetQty}
                      onChange={(e) => setTargetQty(e.target.value)}
                    />
                    <span className="input-unit-label">
                      {selectedMed ? selectedMed.unit : 'Units'}
                    </span>
                  </div>
                </div>

                {/* Step 2 & 3: Nearby PHCs with Available Stock & Suggested Source */}
                <div className="form-group">
                  <label>2. Suggested Nearby PHCs with Available Stock *</label>
                  <div className="nearby-phc-cards-stack">
                    {nearbyPhcsWithStock.map((item) => {
                      const isSelected = targetSourceId === item.phc.id;
                      const isBest = suggestedSource?.phc.id === item.phc.id;

                      return (
                        <div
                          key={item.phc.id}
                          className={`nearby-phc-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => setTargetSourceId(item.phc.id)}
                        >
                          <div className="option-top">
                            <div className="option-title">
                              <strong>{item.phc.name}</strong>
                              <span className="district-tag">{item.phc.district}</span>
                              {isBest && (
                                <span className="badge badge-success">
                                  ✓ Best Recommended Source
                                </span>
                              )}
                            </div>
                            <span className="stock-number">
                              {item.stock} {item.unit} available
                            </span>
                          </div>

                          <div className="stock-impact-box">
                            <span>
                              After proposed transfer (-{targetQty || 0} {item.unit}):{' '}
                              <strong className={item.isSurplusSafe ? 'text-emerald' : 'text-amber'}>
                                {item.remainingAfterProposed} {item.unit} remaining
                              </strong>{' '}
                              (Min: {item.threshold})
                            </span>
                            {item.isSurplusSafe ? (
                              <span className="badge badge-success text-xs">Safe Surplus</span>
                            ) : (
                              <span className="badge badge-warning text-xs">Borderline Stock</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label>Urgency Priority</label>
                  <select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                    <option value="Urgent">Urgent (Stock below threshold)</option>
                    <option value="Emergency">Emergency (Immediate stock-out risk)</option>
                    <option value="Routine">Routine (Seasonal restocking)</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Reason / Clinical Justification</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Critical stock deficit forecast; clinical surge in OP visits..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Send size={16} /> Submit Transfer Request for DHO Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TRANSFER MODAL (FOR DHO) */}
      {editingTransfer && (
        <div className="modal-backdrop" onClick={() => setEditingTransfer(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>DHO Edit Transfer Quantity (#{editingTransfer.id})</h3>
              <button className="btn-icon" onClick={() => setEditingTransfer(null)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Medicine</label>
                  <input type="text" disabled value={editingTransfer.medicineName} />
                </div>

                <div className="form-group">
                  <label>Modified Authorized Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <label>DHO Officer Authorization Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Approved 80 units to maintain sending PHC safety buffer"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingTransfer(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  <Check size={16} /> Save &amp; Authorize Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
