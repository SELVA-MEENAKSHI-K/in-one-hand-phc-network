import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  INITIAL_PHCS,
  INITIAL_TRANSFERS,
  INITIAL_ALERTS,
  INITIAL_AUDIT_LOGS,
  MASTER_MEDICINE_CATALOG
} from '../data/mockData';

const AppContext = createContext();

const STORAGE_KEYS = {
  PHCS: 'inonehand_phcs_v2',
  TRANSFERS: 'inonehand_transfers_v2',
  ALERTS: 'inonehand_alerts_v2',
  LOGS: 'inonehand_logs_v2',
  OFFLINE_QUEUE: 'inonehand_offline_queue_v2',
  LANGUAGE: 'inonehand_lang_v2',
  ROLE: 'inonehand_role_v2',
  ACTIVE_PHC: 'inonehand_active_phc_v2',
  THEME: 'inonehand_theme_v2',
  EVALUATION_MODE: 'inonehand_evaluation_mode_v2',
  SIGNED_IN: 'inonehand_signed_in_v2'
};

import { VALID_TABS, ROLE_HOME, ROLE_TABS, getUserNameForRole, getRoleTitle } from './roleConfig';
import { safeStorageGet, safeStorageSet, safeStorageClear } from '../utils/storage';

const readHashTab = () => {
  if (typeof window === 'undefined') return null;
  const t = window.location.hash.replace(/^#\/?/, '');
  return VALID_TABS.includes(t) ? t : null;
};

export const AppProvider = ({ children }) => {
  // Theme state: default 'light' per prompt design guidelines
  const [theme, setTheme] = useState(() => {
    return safeStorageGet(STORAGE_KEYS.THEME, 'light', false);
  });

  // Responsive Viewport Preview Mode: 'fluid' | 'desktop' (1440px) | 'tablet' (768px) | 'mobile' (390px)
  const [viewportMode, setViewportMode] = useState('fluid');

  // Active top-level screen tab
  const [isSignedIn, setIsSignedIn] = useState(() => safeStorageGet(STORAGE_KEYS.SIGNED_IN, 'false', false) === 'true');
  const [activeTab, setActiveTab] = useState(() => readHashTab() || 'dashboard');

  // Load initial state with safe storage fallback
  const [phcs, setPhcs] = useState(() => {
    return safeStorageGet(STORAGE_KEYS.PHCS, INITIAL_PHCS);
  });

  const [transfers, setTransfers] = useState(() => {
    return safeStorageGet(STORAGE_KEYS.TRANSFERS, INITIAL_TRANSFERS);
  });

  const [alerts, setAlerts] = useState(() => {
    return safeStorageGet(STORAGE_KEYS.ALERTS, INITIAL_ALERTS);
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const parsed = safeStorageGet(STORAGE_KEYS.LOGS, null);
    if (!parsed) return INITIAL_AUDIT_LOGS;
    // Upgrade from previous 5-item log cache to the rich multi-period 16-item mock logs
    if (Array.isArray(parsed) && parsed.length >= INITIAL_AUDIT_LOGS.length && parsed[0]?.district) {
      return parsed;
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [offlineQueue, setOfflineQueue] = useState(() => {
    return safeStorageGet(STORAGE_KEYS.OFFLINE_QUEUE, []);
  });

  const [language, setLanguage] = useState(() => {
    return safeStorageGet(STORAGE_KEYS.LANGUAGE, 'en', false);
  });

  // Current Role: 'phc_staff' | 'phc_admin' | 'district_officer' | 'platform_admin'
  const [currentRole, setCurrentRole] = useState(() => {
    return safeStorageGet(STORAGE_KEYS.ROLE, 'phc_staff', false);
  });

  // Active PHC ID for staff / PHC admin view
  const [currentPhcId, setCurrentPhcId] = useState(() => {
    return safeStorageGet(STORAGE_KEYS.ACTIVE_PHC, 'phc-medavakkam', false);
  });

  // Apply theme to html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    safeStorageSet(STORAGE_KEYS.THEME, theme, false);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Simulated Offline Network Mode
  const [isOffline, setIsOffline] = useState(false);

  // Explicit Demo / Evaluation Mode: controls visibility of role switcher, checklist, sample data reset, and debug copy
  const [isEvaluationMode, setIsEvaluationMode] = useState(() => {
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === '1' || params.get('evaluation') === '1' || params.get('eval') === '1' || params.get('eval') === 'true') {
        return true;
      }
    }
    return safeStorageGet(STORAGE_KEYS.EVALUATION_MODE, 'false', false) === 'true';
  });

  const toggleEvaluationMode = () => {
    setIsEvaluationMode((prev) => {
      const next = !prev;
      safeStorageSet(STORAGE_KEYS.EVALUATION_MODE, String(next), false);
      if (next) {
        showToast('Evaluation Mode enabled: Demo Role Switcher, Checklist, and Data Reset are available.', 'info');
      } else {
        showToast('Normal User Mode active: Evaluation controls and debug copy hidden.', 'info');
      }
      return next;
    });
  };

  // Active Toast Notification
  const [toast, setToast] = useState(null);

  // Last action latency measurement for demo benchmark badge
  const [lastBenchmark, setLastBenchmark] = useState({
    action: 'System Ready',
    targetSec: 3.0,
    actualMs: 140,
    status: 'pass'
  });

  // Sync to safe storage
  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.PHCS, phcs);
  }, [phcs]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.TRANSFERS, transfers);
  }, [transfers]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.ALERTS, alerts);
  }, [alerts]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.LOGS, auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.OFFLINE_QUEUE, offlineQueue);
  }, [offlineQueue]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.LANGUAGE, language, false);
  }, [language]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.ROLE, currentRole, false);
  }, [currentRole]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.ACTIVE_PHC, currentPhcId, false);
  }, [currentPhcId]);

  // Derived active (operational) & pending PHCs
  const approvedPhcs = phcs.filter((p) => p.status === 'Approved');
  const pendingPhcs = phcs.filter((p) => p.status === 'Pending Verification');

  // Derived current PHC (prefer active approved node)
  const currentPhc = phcs.find((p) => p.id === currentPhcId) || approvedPhcs[0] || phcs[0] || null;

  // Show Toast Helper
  const showToast = (message, type = 'info', duration = 3500) => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((prev) => (prev?.id ? null : prev));
    }, duration);
  };

  // Record benchmark
  const recordBenchmark = useCallback((actionName, targetSeconds, startTime) => {
    const elapsed = Math.round(performance.now() - startTime);
    const pass = elapsed <= targetSeconds * 1000;
    setLastBenchmark({
      action: actionName,
      targetSec: targetSeconds,
      actualMs: elapsed,
      status: pass ? 'pass' : 'warn'
    });
  }, [setLastBenchmark]);

  // Add an audit log entry
  const addAuditLog = useCallback((entry) => {
    const logPhc = phcs.find((p) => p.name === entry.phcName || p.id === entry.phcId) || currentPhc;
    const determinedResource = entry.resource || (
      entry.action?.includes('Medicine') || entry.action?.includes('Stock') ? 'Medicine' :
      entry.action?.includes('Bed') ? 'Bed' :
      entry.action?.includes('Staff') || entry.action?.includes('Attendance') ? 'Staff' :
      entry.action?.includes('Footfall') || entry.action?.includes('Patient') ? 'Footfall' :
      entry.action?.includes('Transfer') ? 'Transfer' : 'General'
    );
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      phcId: entry.phcId || logPhc?.id || 'phc-medavakkam',
      phcName: entry.phcName || logPhc?.name || 'Network',
      district: entry.district || logPhc?.district || 'Chengalpattu',
      resource: determinedResource,
      user: entry.user || getUserNameForRole(currentRole),
      role: getRoleTitle(currentRole),
      action: entry.action,
      details: entry.details,
      processingTimeMs: entry.processingTimeMs || Math.floor(Math.random() * 200 + 150)
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  }, [phcs, currentPhc, currentRole]);

  // Module 3: Medicine Check-In / Check-Out
  const updateMedicineStock = (phcId, medicineId, deltaQty, metadata = {}) => {
    const startTime = performance.now();
    const isCheckIn = deltaQty > 0;
    const targetSec = 3.0; // Requirement: Stock transaction and graph update within 3 seconds

    // If offline, queue it!
    if (isOffline) {
      const queueItem = {
        id: `q-${Date.now()}`,
        type: 'STOCK_UPDATE',
        phcId,
        medicineId,
        deltaQty,
        metadata,
        timestamp: new Date().toISOString()
      };
      setOfflineQueue((prev) => [...prev, queueItem]);
      showToast(`Offline mode: Transaction queued locally (${deltaQty > 0 ? '+' : ''}${deltaQty})`, 'warning');
      recordBenchmark('Offline Stock Queue', targetSec, startTime);
      return { success: true, offline: true };
    }

    let errorOccurred = null;
    let targetPhcName = '';
    let medName = '';
    let newQty = 0;
    let minThresh = 0;

    setPhcs((prevPhcs) =>
      prevPhcs.map((phc) => {
        if (phc.id !== phcId) return phc;
        targetPhcName = phc.name;

        const updatedMeds = phc.medicines.map((med) => {
          if (med.id !== medicineId) return med;
          medName = med.name;
          minThresh = med.minThreshold;
          const calculated = med.quantity + deltaQty;

          // Non-functional requirement: Prevent negative stock
          if (calculated < 0) {
            errorOccurred = `Insufficient stock! Current available is ${med.quantity} ${med.unit}, cannot check out ${Math.abs(deltaQty)} ${med.unit}.`;
            return med;
          }

          newQty = calculated;
          return {
            ...med,
            quantity: calculated,
            batchNumber: metadata.batchNumber || med.batchNumber,
            expiryDate: metadata.expiryDate || med.expiryDate,
            source: metadata.source || med.source,
            lastUpdated: new Date().toISOString()
          };
        });

        return {
          ...phc,
          medicines: updatedMeds,
          lastUpdated: new Date().toISOString()
        };
      })
    );

    if (errorOccurred) {
      showToast(errorOccurred, 'error');
      return { success: false, error: errorOccurred };
    }

    // Check alert conditions
    if (newQty < minThresh) {
      const alertId = `alt-${Date.now()}`;
      const newAlert = {
        id: alertId,
        phcId,
        phcName: targetPhcName,
        type: newQty < minThresh * 0.4 ? 'critical' : 'warning',
        category: 'Medicine Shortage',
        title: `${medName} Below Minimum Stock`,
        tamilTitle: `${medName} குறைந்த இருப்பு எச்சரிக்கை`,
        message: `Quantity dropped to ${newQty} (min threshold: ${minThresh}). Consider requesting inter-PHC transfer.`,
        timestamp: new Date().toISOString(),
        status: 'Active',
        acknowledgedBy: null
      };
      setAlerts((prev) => [newAlert, ...prev]);
    } else {
      // Auto-resolve any existing shortage alert for this medicine if stock is back up
      setAlerts((prev) =>
        prev.map((a) => {
          if (a.phcId === phcId && a.title.includes(medName) && a.status === 'Active') {
            return { ...a, status: 'Resolved' };
          }
          return a;
        })
      );
    }

    // Add Audit Log
    addAuditLog({
      phcName: targetPhcName,
      action: isCheckIn ? 'Medicine Check-In' : 'Medicine Check-Out',
      details: `${isCheckIn ? 'Received' : 'Dispensed'} ${Math.abs(deltaQty)} units of ${medName}. Stock updated to ${newQty}. Batch: ${metadata.batchNumber || 'Standard'}. Source/Recipient: ${metadata.source || metadata.recipient || 'Standard'}.`,
      processingTimeMs: Math.round(performance.now() - startTime)
    });

    recordBenchmark(isCheckIn ? 'Medicine Check-In' : 'Medicine Check-Out', targetSec, startTime);
    showToast(
      `${isCheckIn ? 'Checked in' : 'Checked out'} ${Math.abs(deltaQty)} units of ${medName} successfully! Stock: ${newQty}`,
      'success'
    );
    return { success: true, newQty };
  };

  // Module 4: Bed Occupancy Update
  const updateBeds = (phcId, newOccupied) => {
    const startTime = performance.now();
    const targetSec = 3.0; // Requirement: Bed updates appear within 3 seconds

    const targetPhc = phcs.find((p) => p.id === phcId);
    if (!targetPhc) return;

    // Guard: PHC Staff and Admin can only update beds for their assigned centre
    if ((currentRole === 'phc_staff' || currentRole === 'phc_admin') && currentPhcId && currentPhcId !== phcId) {
      showToast('Unauthorized: Facility staff can only update bed status for their own registered centre.', 'error');
      return;
    }

    const totalCap = Math.max(0, Number(targetPhc.bedCapacity) || 0);
    // Prevent occupied beds from going below 0 or above total capacity
    const validOccupied = Math.max(0, Math.min(Number(newOccupied) || 0, totalCap));
    // Calculation everywhere: available beds = total beds - occupied beds
    const available = Math.max(0, totalCap - validOccupied);
    const occupancyRate = totalCap > 0 ? (validOccupied / totalCap) * 100 : 0;
    const phcName = targetPhc.name;

    if (isOffline) {
      setOfflineQueue((prev) => [
        ...prev,
        {
          id: `q-${Date.now()}`,
          type: 'BED_UPDATE',
          phcId,
          newOccupied: validOccupied,
          timestamp: new Date().toISOString()
        }
      ]);
      showToast('Offline mode: Bed update queued locally', 'warning');
      recordBenchmark('Offline Bed Update', targetSec, startTime);
      return;
    }

    setPhcs((prev) =>
      prev.map((phc) => {
        if (phc.id !== phcId) return phc;
        return {
          ...phc,
          occupiedBeds: validOccupied,
          lastUpdated: new Date().toISOString()
        };
      })
    );

    // Trigger alert if occupancy >= 85%
    if (occupancyRate >= 85) {
      const alertId = `alt-${Date.now()}`;
      setAlerts((prev) => [
        {
          id: alertId,
          phcId,
          phcName,
          type: 'critical',
          category: 'Bed Availability',
          title: `Critical Bed Shortage (${occupancyRate.toFixed(0)}% Occupied)`,
          tamilTitle: 'படுக்கை நிரம்பல் எச்சரிக்கை',
          message: `Only ${available} of ${totalCap} beds remaining. Coordinate patient diversion if required.`,
          timestamp: new Date().toISOString(),
          status: 'Active',
          acknowledgedBy: null
        },
        ...prev
      ]);
    }

    addAuditLog({
      phcName,
      action: 'Bed Occupancy Update',
      details: `Occupied beds updated to ${validOccupied} / ${totalCap}. Available beds: ${available}. Occupancy: ${occupancyRate.toFixed(1)}%.`,
      processingTimeMs: Math.round(performance.now() - startTime)
    });

    recordBenchmark('Bed Availability Update', targetSec, startTime);
    showToast(`Bed status updated: ${available} beds available (${validOccupied} occupied out of ${totalCap})`, 'success');
  };

  // Module 4: Patient Footfall Tracker
  const updateFootfall = (phcId, delta) => {
    const startTime = performance.now();
    setPhcs((prev) =>
      prev.map((phc) => {
        if (phc.id !== phcId) return phc;
        const newFootfall = Math.max(0, phc.dailyFootfall + delta);
        return {
          ...phc,
          dailyFootfall: newFootfall,
          lastUpdated: new Date().toISOString()
        };
      })
    );
    recordBenchmark('Patient Footfall Update', 3.0, startTime);
  };

  // Module 5: Staff Attendance Check-In / Check-Out via QR
  const recordStaffAttendance = (phcId, staffId, action) => {
    const startTime = performance.now();
    const targetSec = 2.0; // Requirement: QR attendance record within 2 seconds
    let staffName = '';
    let phcName = '';
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isOffline) {
      setOfflineQueue((prev) => [
        ...prev,
        {
          id: `q-${Date.now()}`,
          type: 'ATTENDANCE_UPDATE',
          phcId,
          staffId,
          action,
          timestamp: new Date().toISOString()
        }
      ]);
      showToast('Offline mode: QR attendance queued locally', 'warning');
      recordBenchmark('Offline Staff Attendance', targetSec, startTime);
      return;
    }

    setPhcs((prev) =>
      prev.map((phc) => {
        if (phc.id !== phcId) return phc;
        phcName = phc.name;

        const updatedStaff = phc.staff.map((stf) => {
          if (stf.id !== staffId) return stf;
          staffName = stf.name;
          return {
            ...stf,
            status: action === 'Check In' ? 'Present' : 'Checked Out',
            checkInTime: action === 'Check In' ? nowTimeStr : stf.checkInTime,
            checkOutTime: action === 'Check Out' ? nowTimeStr : stf.checkOutTime
          };
        });

        // Check staffing gap threshold
        const presentCount = updatedStaff.filter((s) => s.status === 'Present').length;
        const totalStaff = updatedStaff.length;
        const attendanceRate = totalStaff > 0 ? (presentCount / totalStaff) * 100 : 100;

        if (attendanceRate < phc.staffingThreshold) {
          const alertId = `alt-${Date.now()}`;
          setAlerts((prevAlerts) => [
            {
              id: alertId,
              phcId,
              phcName,
              type: 'warning',
              category: 'Staff Availability',
              title: `Staff Attendance Gap (${attendanceRate.toFixed(0)}%)`,
              tamilTitle: 'பணியாளர் பற்றாக்குறை எச்சரிக்கை',
              message: `Only ${presentCount} of ${totalStaff} staff currently present (Threshold: ${phc.staffingThreshold}%).`,
              timestamp: new Date().toISOString(),
              status: 'Active',
              acknowledgedBy: null
            },
            ...prevAlerts
          ]);
        }

        return {
          ...phc,
          staff: updatedStaff,
          lastUpdated: new Date().toISOString()
        };
      })
    );

    addAuditLog({
      phcName,
      action: `Staff QR ${action}`,
      details: `${staffName} scanned QR for ${action} at ${nowTimeStr}.`,
      processingTimeMs: Math.round(performance.now() - startTime)
    });

    recordBenchmark(`Staff QR ${action}`, targetSec, startTime);
    showToast(`Staff Attendance: ${staffName} successfully ${action === 'Check In' ? 'Checked In' : 'Checked Out'}!`, 'success');
  };

  // Module 1: PHC Onboarding & Registration
  const registerNewPHC = (phcData) => {
    const startTime = performance.now();
    const targetSec = 2.0; // Requirement: Form validation under 2 seconds

    const newId = `phc-${phcData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
    const newPhc = {
      id: newId,
      name: phcData.name,
      tamilName: phcData.tamilName || phcData.name,
      district: phcData.district,
      location: phcData.location,
      contactPerson: phcData.contactPerson,
      phone: phcData.phone,
      email: phcData.email,
      status: 'Pending Verification',
      verifiedAt: null,
      verifiedBy: null,
      regularPatientCount: Number(phcData.regularPatientCount) || 300,
      dailyFootfall: 0,
      bedCapacity: Number(phcData.bedCapacity) || 15,
      occupiedBeds: 0,
      staffingThreshold: 60,
      lastUpdated: new Date().toISOString(),
      medicines: (phcData.medicines && phcData.medicines.length > 0)
        ? phcData.medicines
        : MASTER_MEDICINE_CATALOG.map((m) => ({
            id: m.id,
            name: m.name,
            tamilName: m.tamilName,
            category: m.category,
            quantity: Number(phcData[`initial_${m.id}`]) || m.defaultQty,
            minThreshold: Number(phcData[`min_${m.id}`]) || m.defaultMinThreshold,
            unit: m.unit,
            batchNumber: `INIT-${m.id.replace('med-', '').toUpperCase()}-${Date.now().toString().slice(-4)}`,
            expiryDate: '2027-12-31',
            source: 'Initial Facility Onboarding',
            dailyUsageRate: m.dailyUsageRate,
            lastUpdated: new Date().toISOString()
          })),
      staff: [
        {
          id: `stf-${newId}-01`,
          name: phcData.contactPerson,
          role: 'Medical Officer',
          phone: phcData.phone,
          qrCode: `STAFF:${newId}:stf-${newId}-01:${phcData.contactPerson}`,
          status: 'Present',
          checkInTime: '09:00 AM',
          checkOutTime: null
        }
      ]
    };

    setPhcs((prev) => [...prev, newPhc]);

    addAuditLog({
      phcName: newPhc.name,
      action: 'PHC Registration Submitted',
      details: `New centre registered in ${newPhc.district}. Bed capacity: ${newPhc.bedCapacity}, Baseline patients: ${newPhc.regularPatientCount}. Status: Pending Verification.`,
      processingTimeMs: Math.round(performance.now() - startTime)
    });

    recordBenchmark('PHC Form Validation', targetSec, startTime);
    showToast(`PHC "${newPhc.name}" registered! Awaiting Platform Administrator approval.`, 'info');
    return newPhc;
  };

  // Module 1: Verification by Platform Administrator
  const verifyPHC = (phcId) => {
    // Action guard: Platform Administrators can verify and activate PHCs
    if (currentRole !== 'platform_admin') {
      showToast('Unauthorized: Only Platform Administrators can verify and activate PHC nodes.', 'error');
      return { success: false, error: 'Unauthorized' };
    }

    const startTime = performance.now();
    const targetSec = 5.0; // Requirement: PHC appears in network within 5 seconds of approval
    const adminUser = getUserNameForRole(currentRole);

    let verifiedPhcName = '';

    setPhcs((prev) =>
      prev.map((phc) => {
        if (phc.id !== phcId) return phc;
        verifiedPhcName = phc.name;
        return {
          ...phc,
          status: 'Approved',
          verifiedAt: new Date().toISOString(),
          verifiedBy: adminUser,
          lastUpdated: new Date().toISOString()
        };
      })
    );

    // Confetti celebration for network onboarding!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    addAuditLog({
      phcName: verifiedPhcName,
      action: 'PHC Verification Approved',
      details: `${verifiedPhcName} verified and integrated into the real-time operational network by ${adminUser}.`,
      processingTimeMs: Math.round(performance.now() - startTime)
    });

    recordBenchmark('PHC Network Activation', targetSec, startTime);
    showToast(`✓ "${verifiedPhcName}" is now APPROVED and live in the operational network!`, 'success');
    return { success: true };
  };

  // Module 1: Add staff member to a PHC
  const addStaffMember = (phcId, staffData) => {
    const startTime = performance.now();
    const newStaffId = `stf-${Date.now().toString().slice(-4)}`;
    const qrString = `STAFF:${phcId}:${newStaffId}:${staffData.name}`;

    setPhcs((prev) =>
      prev.map((phc) => {
        if (phc.id !== phcId) return phc;
        return {
          ...phc,
          staff: [
            ...phc.staff,
            {
              id: newStaffId,
              name: staffData.name,
              role: staffData.role,
              phone: staffData.phone,
              qrCode: qrString,
              status: 'Not Checked In',
              checkInTime: null,
              checkOutTime: null
            }
          ]
        };
      })
    );

    addAuditLog({
      phcName: currentPhc?.name || 'PHC',
      action: 'Staff Account Created',
      details: `Created account and unique QR badge for ${staffData.name} (${staffData.role}).`,
      processingTimeMs: Math.round(performance.now() - startTime)
    });

    showToast(`Staff member ${staffData.name} added with QR pass!`, 'success');
  };

  // Module 8: Create Resource Transfer Request
  const createTransferRequest = (data) => {
    const startTime = performance.now();
    const targetSec = 5.0; // Target recommendation & request creation within 5 seconds

    const newTransfer = {
      id: `trf-${Date.now().toString().slice(-4)}`,
      requestingPhcId: data.requestingPhcId,
      requestingPhcName: data.requestingPhcName,
      sourcePhcId: data.sourcePhcId,
      sourcePhcName: data.sourcePhcName,
      medicineId: data.medicineId,
      medicineName: data.medicineName,
      quantity: Number(data.quantity),
      unit: data.unit || 'Strips',
      urgency: data.urgency || 'Urgent',
      status: 'Pending DHO Approval',
      reason: data.reason || 'Critical stock deficit forecast',
      requestedBy: getUserNameForRole(currentRole),
      requestedAt: new Date().toISOString(),
      dhoApprovedBy: null,
      dhoApprovedAt: null,
      dispatchedBy: null,
      dispatchedAt: null,
      receivedBy: null,
      receivedAt: null,
      dispatchNotes: ''
    };

    setTransfers((prev) => [newTransfer, ...prev]);

    // Create notification alert for District Health Officer
    setAlerts((prev) => [
      {
        id: `alt-${Date.now()}`,
        phcId: data.requestingPhcId,
        phcName: data.requestingPhcName,
        type: data.urgency === 'Emergency' ? 'critical' : 'warning',
        category: 'Transfer Request',
        title: `Inter-PHC Transfer Requested: ${data.medicineName}`,
        tamilTitle: `மருந்து பரிமாற்ற கோரிக்கை: ${data.medicineName}`,
        message: `${data.requestingPhcName} requested ${data.quantity} ${data.unit} from ${data.sourcePhcName}. Needs DHO Approval.`,
        timestamp: new Date().toISOString(),
        status: 'Active',
        acknowledgedBy: null
      },
      ...prev
    ]);

    addAuditLog({
      phcName: data.requestingPhcName,
      action: 'Transfer Request Initiated',
      details: `Requested ${data.quantity} ${data.unit} of ${data.medicineName} from ${data.sourcePhcName}. Urgency: ${data.urgency}.`,
      processingTimeMs: Math.round(performance.now() - startTime)
    });

    recordBenchmark('Transfer Request Created', targetSec, startTime);
    showToast(`Transfer request for ${data.quantity} units submitted to District Health Officer!`, 'info');
  };

  // Module 8: Approve / Reject / Edit Transfer by DHO
  // Module 8: Approve / Reject / Edit Transfer by DHO
  const reviewTransfer = (transferId, action, notes = '', newQuantity = null) => {
    // Action guard: Only District Health Officers (and Platform Administrators) can review transfers
    if (currentRole !== 'district_officer' && currentRole !== 'platform_admin') {
      showToast('Unauthorized: Only District Health Officers can review and approve/reject transfers.', 'error');
      return { success: false, error: 'Unauthorized' };
    }

    const startTime = performance.now();
    const dhoName = getUserNameForRole(currentRole);

    setTransfers((prev) =>
      prev.map((t) => {
        if (t.id !== transferId) return t;
        const validQty = newQuantity !== null && Number(newQuantity) > 0 ? Number(newQuantity) : t.quantity;
        return {
          ...t,
          quantity: validQty,
          status: action === 'reject' ? 'Rejected' : 'Approved',
          dhoApprovedBy: dhoName,
          dhoApprovedAt: new Date().toISOString(),
          dhoNotes: notes || '',
          rejectionReason: action === 'reject' ? notes : null
        };
      })
    );

    addAuditLog({
      phcName: 'District Health Office',
      action: `Transfer ${action === 'approve' ? 'Approved' : action === 'edit' ? 'Edited & Approved' : 'Rejected'}`,
      details: `Transfer #${transferId} ${action === 'reject' ? 'rejected' : action === 'edit' ? `quantity adjusted to ${newQuantity} and approved` : 'approved'} by DHO ${dhoName}. Note: ${notes || 'Standard protocol'}.`,
      processingTimeMs: Math.round(performance.now() - startTime)
    });

    recordBenchmark(`Transfer ${action}`, 3.0, startTime);
    showToast(
      `Transfer #${transferId} ${action === 'reject' ? 'Rejected' : action === 'edit' ? 'Quantity Updated & Approved' : 'Approved for Dispatch'}`,
      action === 'reject' ? 'warning' : 'success'
    );
    return { success: true };
  };

  // Role Permissions Helper
  const canPerformAction = (action) => {
    switch (action) {
      case 'scan_medicine':
      case 'update_beds':
      case 'scan_attendance':
      case 'view_alerts':
        return true;
      case 'access_onboarding':
        return currentRole !== 'phc_staff'; // PHC Staff must not access global onboarding/verification
      case 'register_phc':
      case 'manage_staff':
      case 'edit_capacity':
        return currentRole === 'phc_admin' || currentRole === 'platform_admin';
      case 'approve_transfer':
      case 'reject_transfer':
      case 'edit_transfer':
        return currentRole === 'district_officer' || currentRole === 'platform_admin';
      case 'verify_phc':
        return currentRole === 'platform_admin'; // ONLY Platform Administrator can verify/activate PHCs
      case 'manage_users':
        return currentRole === 'platform_admin';
      default:
        return true;
    }
  };

  // Module 8: Dispatch transfer by Sending PHC
  const dispatchTransfer = (transferId, dispatchNotes = '') => {
    const startTime = performance.now();
    const targetSec = 3.0;
    const targetTransfer = transfers.find((t) => t.id === transferId);
    if (!targetTransfer) return;

    // Deduct stock from source PHC
    updateMedicineStock(targetTransfer.sourcePhcId, targetTransfer.medicineId, -targetTransfer.quantity, {
      source: `Dispatched to ${targetTransfer.requestingPhcName} (Transfer #${transferId})`
    });

    setTransfers((prev) =>
      prev.map((t) => {
        if (t.id !== transferId) return t;
        return {
          ...t,
          status: 'Dispatched',
          dispatchedBy: getUserNameForRole(currentRole),
          dispatchedAt: new Date().toISOString(),
          dispatchNotes: dispatchNotes || 'Dispatched via District Health Courier'
        };
      })
    );

    addAuditLog({
      phcName: targetTransfer.sourcePhcName,
      action: 'Transfer Dispatched',
      details: `Dispatched ${targetTransfer.quantity} ${targetTransfer.unit} of ${targetTransfer.medicineName} to ${targetTransfer.requestingPhcName}.`,
      processingTimeMs: Math.round(performance.now() - startTime)
    });

    recordBenchmark('Transfer Dispatched', targetSec, startTime);
    showToast(`Medicine consignment marked as DISPATCHED in transit!`, 'info');
  };

  // Module 8: Confirm receipt by Receiving PHC
  const confirmReceiptTransfer = (transferId) => {
    const startTime = performance.now();
    const targetSec = 3.0;
    const targetTransfer = transfers.find((t) => t.id === transferId);
    if (!targetTransfer) return;

    // Add stock to receiving PHC
    updateMedicineStock(targetTransfer.requestingPhcId, targetTransfer.medicineId, targetTransfer.quantity, {
      source: `Received from ${targetTransfer.sourcePhcName} (Transfer #${transferId})`
    });

    setTransfers((prev) =>
      prev.map((t) => {
        if (t.id !== transferId) return t;
        return {
          ...t,
          status: 'Completed',
          receivedBy: getUserNameForRole(currentRole),
          receivedAt: new Date().toISOString()
        };
      })
    );

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.5 }
    });

    addAuditLog({
      phcName: targetTransfer.requestingPhcName,
      action: 'Transfer Confirmed Received',
      details: `Received & verified ${targetTransfer.quantity} ${targetTransfer.unit} of ${targetTransfer.medicineName}. Stock replenished.`,
      processingTimeMs: Math.round(performance.now() - startTime)
    });

    recordBenchmark('Transfer Confirmed', targetSec, startTime);
    showToast(`🎉 Transfer #${transferId} completed! Stock replenished at ${targetTransfer.requestingPhcName}.`, 'success');
  };

  // Module 6: Alerts Acknowledge & Resolve
  const acknowledgeAlert = (alertId) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'Acknowledged', acknowledgedBy: getUserNameForRole(currentRole) } : a))
    );
    showToast('Alert acknowledged', 'info');
  };

  const resolveAlert = (alertId) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'Resolved' } : a))
    );
    showToast('Alert marked as resolved', 'success');
  };

  // Offline / Online Sync Engine
  const toggleOfflineMode = () => {
    if (isOffline) {
      // Reconnecting to online! Drain queue
      setIsOffline(false);
      if (offlineQueue.length > 0) {
        showToast(`Reconnected! Synchronizing ${offlineQueue.length} offline updates to cloud...`, 'info');
        setTimeout(() => {
          setOfflineQueue([]);
          showToast(`✓ All pending offline updates synchronized successfully!`, 'success');
          addAuditLog({
            phcName: 'Network Engine',
            action: 'Offline Queue Synchronized',
            details: `Successfully flushed and synced ${offlineQueue.length} queued transactions to national platform.`,
            processingTimeMs: 420
          });
        }, 1200);
      } else {
        showToast('Online connection restored', 'success');
      }
    } else {
      setIsOffline(true);
      showToast('Switched to OFFLINE mode (Transactions will be queued locally)', 'warning');
    }
  };

  // Reset to default seed data
  const resetToDefaultData = () => {
    const wasEval = isEvaluationMode;
    safeStorageClear();
    setPhcs(INITIAL_PHCS);
    setTransfers(INITIAL_TRANSFERS);
    setAlerts(INITIAL_ALERTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setOfflineQueue([]);
    if (wasEval) {
      safeStorageSet(STORAGE_KEYS.EVALUATION_MODE, 'true', false);
    }
    showToast('System reset to default clean sample data', 'info');
  };

  // ---- Sign-in / routing flow ----
  const canAccessTab = (tab) => (ROLE_TABS[currentRole] || VALID_TABS).includes(tab);

  const signIn = (role, phcId) => {
    setCurrentRole(role);
    if (phcId) setCurrentPhcId(phcId);
    safeStorageSet(STORAGE_KEYS.SIGNED_IN, 'true', false);
    setIsSignedIn(true);
    setActiveTab(ROLE_HOME[role] || 'dashboard');
  };

  const signOut = () => {
    safeStorageSet(STORAGE_KEYS.SIGNED_IN, 'false', false);
    setIsSignedIn(false);
    window.location.hash = '';
  };

  // Keep URL hash <-> activeTab in sync (refresh + back button work)
  useEffect(() => {
    if (!isSignedIn) return;
    const target = '#/' + activeTab;
    if (window.location.hash !== target) window.location.hash = target;
  }, [activeTab, isSignedIn]);

  useEffect(() => {
    const onHash = () => {
      const t = readHashTab();
      if (t) setActiveTab(t);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Role can't open a tab it isn't allowed to -> send to its home
  useEffect(() => {
    if (isSignedIn && !(ROLE_TABS[currentRole] || VALID_TABS).includes(activeTab)) {
      const id = requestAnimationFrame(() => {
        setActiveTab(ROLE_HOME[currentRole] || 'dashboard');
      });
      return () => cancelAnimationFrame(id);
    }
  }, [currentRole, activeTab, isSignedIn]);

  return (
    <AppContext.Provider
      value={{
        phcs,
        approvedPhcs,
        pendingPhcs,
        MASTER_MEDICINE_CATALOG,
        currentPhcId,
        setCurrentPhcId,
        currentPhc,
        currentRole,
        setCurrentRole,
        language,
        setLanguage,
        theme,
        toggleTheme,
        viewportMode,
        setViewportMode,
        activeTab,
        setActiveTab,
        isSignedIn,
        signIn,
        signOut,
        canAccessTab,
        canPerformAction,
        isOffline,
        toggleOfflineMode,
        offlineQueue,
        transfers,
        alerts,
        auditLogs,
        toast,
        showToast,
        lastBenchmark,
        recordBenchmark,
        updateMedicineStock,
        updateBeds,
        updateFootfall,
        recordStaffAttendance,
        registerNewPHC,
        verifyPHC,
        addStaffMember,
        createTransferRequest,
        reviewTransfer,
        dispatchTransfer,
        confirmReceiptTransfer,
        acknowledgeAlert,
        resolveAlert,
        resetToDefaultData,
        getUserNameForRole,
        getRoleTitle,
        isEvaluationMode,
        setIsEvaluationMode,
        toggleEvaluationMode
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// oxlint-disable-next-line react/only-export-components
export const useApp = () => useContext(AppContext);
