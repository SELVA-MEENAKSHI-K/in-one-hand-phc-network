import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  ArrowRight,
  X,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DemoChecklistModal = ({
  isOpen,
  onClose,
  setActiveTab,
  onOpenOnboarding,
  onOpenTransferModal
}) => {
  const { isOffline, toggleOfflineMode } = useApp();

  const [checkedItems, setCheckedItems] = useState(() => {
    const saved = localStorage.getItem('inonehand_demo_checklist');
    return saved ? JSON.parse(saved) : {};
  });

  if (!isOpen) return null;

  const toggleCheck = (id) => {
    setCheckedItems((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem('inonehand_demo_checklist', JSON.stringify(updated));
      return updated;
    });
  };

  const resetChecklist = () => {
    setCheckedItems({});
    localStorage.removeItem('inonehand_demo_checklist');
  };

  const checklistItems = [
    {
      id: 1,
      title: '1. Register and verify at least two sample PHCs',
      desc: 'Verify onboarding workflow. Tambaram Rural PHC is pre-seeded in Pending Verification queue ready for 1-click approval.',
      actionLabel: 'Open Verification Queue',
      action: () => {
        onClose();
        onOpenOnboarding();
      }
    },
    {
      id: 2,
      title: '2. Capture regular patient count, opening stock, and bed capacity',
      desc: 'Observed during Module 1 registration and displayed in the Unified Resources and Dashboard cards.',
      actionLabel: 'View Onboarding Baselines',
      action: () => {
        onClose();
        setActiveTab('resources');
      }
    },
    {
      id: 3,
      title: '3. Scan medicine check-in and show stock increasing',
      desc: 'Scan incoming medicine QR code or pick preset; stock increases instantly and logs to audit history.',
      actionLabel: 'Go to Medicine Check-In',
      action: () => {
        onClose();
        setActiveTab('medicines');
      }
    },
    {
      id: 4,
      title: '4. Scan medicine check-out and show stock decreasing',
      desc: 'Scan outgoing QR code, issue stock. Validates available stock & strictly prevents negative values.',
      actionLabel: 'Go to Medicine Check-Out',
      action: () => {
        onClose();
        setActiveTab('medicines');
      }
    },
    {
      id: 5,
      title: '5. Show the medicine graph and a low-stock alert update',
      desc: 'Recharts Area Chart updates dynamically. Dropping below minimum threshold fires real-time incident alert.',
      actionLabel: 'View Dashboard & Alerts',
      action: () => {
        onClose();
        setActiveTab('dashboard');
      }
    },
    {
      id: 6,
      title: '6. Update occupied beds and show available beds and bed graph change',
      desc: 'Available beds = Total − Occupied. Use +/- or slider controls in Beds & Resources module.',
      actionLabel: 'Adjust Beds Now',
      action: () => {
        onClose();
        setActiveTab('resources');
      }
    },
    {
      id: 7,
      title: '7. Scan staff QR codes for check-in/check-out and show availability change',
      desc: 'View printable official QR pass for Dr. Priya Raman or Nurse Deepa, verify arrival/departure, watch roster update.',
      actionLabel: 'Open QR Attendance',
      action: () => {
        onClose();
        setActiveTab('attendance');
      }
    },
    {
      id: 8,
      title: '8. Show the forecast identifying a possible medicine shortage',
      desc: 'Predictive burn rate calculator highlights Anti-Rabies Vaccine and Amoxicillin approaching stockout within < 3 days.',
      actionLabel: 'Inspect Demand Forecast',
      action: () => {
        onClose();
        setActiveTab('forecast');
      }
    },
    {
      id: 9,
      title: '9. Create, approve, dispatch, and confirm a PHC transfer',
      desc: 'Follow the 4-stage pipeline: Request &rarr; DHO Approval &rarr; Dispatch &rarr; Receipt Confirmation with double-entry stock update.',
      actionLabel: 'Open Transfers Hub',
      action: () => {
        onClose();
        if (onOpenTransferModal) {
          onOpenTransferModal();
        } else {
          setActiveTab('transfers');
        }
      }
    },
    {
      id: 10,
      title: '10. Show both PHCs’ updated stock, notifications, and activity history',
      desc: 'Audit logs timestamp operator, state changes, and latency benchmarks. Both sending and receiving centres reflect updated quantities.',
      actionLabel: 'Review Audit Logs',
      action: () => {
        onClose();
        setActiveTab('reports');
      }
    },
    {
      id: 11,
      title: '11. Demonstrate offline queue status and reconnection sync',
      desc: 'Toggle the OFFLINE switch in the top header, perform transactions to queue locally, then reconnect to sync with cloud.',
      actionLabel: isOffline ? 'Switch Online to Sync' : 'Simulate Offline Mode',
      action: () => {
        toggleOfflineMode();
        onClose();
      }
    }
  ];

  const completedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card checklist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge bg-primary-light text-primary">
              <CheckSquare size={22} />
            </div>
            <div>
              <h3>Demo Success Checklist (Section 7)</h3>
              <p className="modal-subtitle">
                Interactive guide for hackathon jury and evaluator demonstrations ({completedCount} / 11 Complete)
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="checklist-progress-bar-container">
          <div
            className="checklist-progress-bar-fill"
            style={{ width: `${(completedCount / 11) * 100}%` }}
          ></div>
        </div>

        <div className="modal-body checklist-items-list">
          {checklistItems.map((item) => {
            const isDone = !!checkedItems[item.id];

            return (
              <div key={item.id} className={`checklist-item-row ${isDone ? 'checked' : ''}`}>
                <button
                  type="button"
                  className="btn-checkbox"
                  onClick={() => toggleCheck(item.id)}
                  title="Toggle status"
                >
                  {isDone ? (
                    <CheckCircle2 size={22} className="text-emerald" />
                  ) : (
                    <Square size={22} className="text-muted" />
                  )}
                </button>

                <div className="checklist-item-content">
                  <h4 className="checklist-item-title">{item.title}</h4>
                  <p className="checklist-item-desc">{item.desc}</p>
                </div>

                <button
                  type="button"
                  className="btn btn-outline btn-sm checklist-action-btn"
                  onClick={item.action}
                >
                  <span>{item.actionLabel}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline btn-sm" onClick={resetChecklist}>
            <RotateCcw size={14} /> Reset Checkmarks
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close &amp; Continue Demo
          </button>
        </div>
      </div>
    </div>
  );
};
