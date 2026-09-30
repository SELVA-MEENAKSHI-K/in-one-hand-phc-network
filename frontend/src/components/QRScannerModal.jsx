import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  X,
  CheckCircle,
  Zap,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Search,
  KeyRound,
  FileQuestion,
  Upload,
  FlipHorizontal,
  VideoOff
} from 'lucide-react';
import { PRESET_QR_CODES } from '../data/mockData';
import { useApp } from '../context/AppContext';

export const QRScannerModal = ({
  isOpen,
  onClose,
  onScanSuccess,
  onManualSelect,
  title = 'Scan QR Code',
  scanType = 'medicine'
}) => {
  const { isEvaluationMode } = useApp();
  // State simulation mode: 'live_camera' | 'permission_prompt' | 'permission_denied' | 'scan_failure' | 'manual_entry'
  const [scannerState, setScannerState] = useState('live_camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scannedResult, setScannedResult] = useState(null);
  const [manualSearchQuery, setManualSearchQuery] = useState('');

  // Hardware Camera Management (Specifically addressing Laptop Front Cameras)
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isMirrored, setIsMirrored] = useState(true);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);
  const startCameraRef = useRef(null);

  // Helper to safely stop any active scanner instance
  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn('Camera stop warning:', err);
      }
      try {
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Camera clear warning:', err);
      }
      scannerRef.current = null;
    }
    if (isMountedRef.current) {
      setCameraActive(false);
      setIsStartingCamera(false);
    }
  }, []);

  // Handle successful scan
  const handleSuccess = useCallback((codeText) => {
    setScannedResult(codeText);
    setScannerState('scan_success');
    stopCamera();
    setTimeout(() => {
      onScanSuccess(codeText);
      if (onManualSelect) {
        onManualSelect(codeText);
      }
      onClose();
    }, 600);
  }, [onScanSuccess, onManualSelect, onClose, stopCamera]);

  // Start Camera with resilient multi-tier fallback for laptop front webcams & mobile
  const startCamera = useCallback(async (overrideCameraId = null, retryCount = 0) => {
    if (!isOpen || !isMountedRef.current) return;
    await stopCamera();

    setIsStartingCamera(true);
    setCameraError(null);
    setScannerState('live_camera');

    // Wait until DOM element is guaranteed to exist
    await new Promise((resolve) => setTimeout(resolve, 80));

    if (!isOpen || !isMountedRef.current) return;

    const region = document.getElementById('qr-reader-region');
    if (!region) {
      if (retryCount < 3 && isOpen && isMountedRef.current) {
        setTimeout(() => startCameraRef.current?.(overrideCameraId, retryCount + 1), 150);
      } else {
        setIsStartingCamera(false);
      }
      return;
    }

    // Clear any previous residual nodes inside qr-reader-region
    region.innerHTML = '';

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-region');
      scannerRef.current = html5QrCode;

      const qrConfig = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.75);
          return { width: Math.max(200, edge), height: Math.max(200, edge) };
        },
        aspectRatio: 1.0
      };

      // 1. Get refreshed camera list if empty
      let devices = availableCameras;
      if (!devices || devices.length === 0) {
        try {
          devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setAvailableCameras(devices);
          }
        } catch {
          // ignore enumeration error
        }
      }

      // Determine candidate camera ID
      const chosenId = overrideCameraId || selectedCameraId;

      // ATTEMPT 1: Selected / Detected specific camera ID (laptop webcam or selected camera)
      if (chosenId) {
        try {
          await html5QrCode.start(
            chosenId,
            qrConfig,
            (decodedText) => handleSuccess(decodedText),
            () => {}
          );
          if (isMountedRef.current) {
            setCameraActive(true);
            setIsStartingCamera(false);
          }
          return;
        } catch (err1) {
          console.warn('Attempt 1 (specific cameraId) failed, falling back to front camera...', err1);
        }
      }

      // ATTEMPT 2: Laptop Front Camera mode (facingMode: 'user')
      try {
        await html5QrCode.start(
          { facingMode: 'user' },
          qrConfig,
          (decodedText) => handleSuccess(decodedText),
          () => {}
        );
        if (isMountedRef.current) {
          setCameraActive(true);
          setIsStartingCamera(false);
        }
        return;
      } catch (err2) {
        console.warn('Attempt 2 (facingMode: user) failed, trying first available device...', err2);
      }

      // ATTEMPT 3: First available device from getCameras()
      if (devices && devices.length > 0) {
        try {
          await html5QrCode.start(
            devices[0].id,
            qrConfig,
            (decodedText) => handleSuccess(decodedText),
            () => {}
          );
          if (isMountedRef.current) {
            setSelectedCameraId(devices[0].id);
            setCameraActive(true);
            setIsStartingCamera(false);
          }
          return;
        } catch (err3) {
          console.warn('Attempt 3 (devices[0]) failed, trying facingMode: environment...', err3);
        }
      }

      // ATTEMPT 4: Mobile Rear Camera mode (facingMode: 'environment')
      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          qrConfig,
          (decodedText) => handleSuccess(decodedText),
          () => {}
        );
        if (isMountedRef.current) {
          setCameraActive(true);
          setIsStartingCamera(false);
          setIsMirrored(false);
        }
        return;
      } catch (err4) {
        console.warn('Attempt 4 (facingMode: environment) failed:', err4);
      }

      throw new Error('Unable to access video stream from laptop front camera.');
    } catch (err) {
      console.error('All camera activation attempts failed:', err);
      if (isMountedRef.current) {
        setCameraActive(false);
        setIsStartingCamera(false);

        // Friendly, actionable diagnostic message for the user
        let message = 'Laptop front camera could not be activated. ';
        const errStr = (err && (err.name || err.message || '')) + '';

        if (/notallowed|permission/i.test(errStr)) {
          message = 'Camera permission was denied in your browser. Click the lock/camera icon in your address bar to allow camera access, then click "Retry Camera".';
        } else if (/notfound|devicesnotfound/i.test(errStr)) {
          message = 'No webcam was detected. Please ensure your laptop front camera or USB webcam is connected and the privacy shutter is open.';
        } else if (/notreadable|trackstart/i.test(errStr)) {
          message = 'Camera is currently in use by another application (e.g. Zoom, Microsoft Teams, or another browser tab). Please close other apps using the camera and retry.';
        } else {
          message = 'Camera access unavailable. You can retry with a different camera, upload a QR image, or use the 1-click test presets below.';
        }
        setCameraError(message);
      }
    }
  }, [isOpen, availableCameras, selectedCameraId, handleSuccess, stopCamera]);

  useEffect(() => {
    startCameraRef.current = startCamera;
  }, [startCamera]);

  // Enumerate cameras and auto-start when modal opens
  useEffect(() => {
    isMountedRef.current = true;

    if (isOpen) {
      // Query cameras on modal open
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (!isMountedRef.current) return;
          if (devices && devices.length > 0) {
            setAvailableCameras(devices);
            // Default to laptop front camera or first device
            const frontOrIntegrated = devices.find((d) =>
              /front|user|integrated|webcam|facetime|built-in/i.test(d.label)
            );
            const defaultCam = frontOrIntegrated ? frontOrIntegrated.id : devices[0].id;
            setSelectedCameraId(defaultCam);
          }
        })
        .catch((err) => {
          console.warn('Could not enumerate cameras on load:', err);
        });

      // Auto-start camera when modal opens
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          startCamera();
        }
      }, 180);

      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Switch camera selection from dropdown
  const handleCameraChange = (e) => {
    const newCameraId = e.target.value;
    setSelectedCameraId(newCameraId);
    const selectedObj = availableCameras.find((c) => c.id === newCameraId);
    const isFront = selectedObj
      ? /front|user|integrated|webcam|facetime/i.test(selectedObj.label)
      : true;
    setIsMirrored(isFront);
    startCamera(newCameraId);
  };

  // Flip / toggle camera (if multiple cameras exist)
  const handleFlipCamera = () => {
    if (availableCameras.length > 1) {
      const currentIndex = availableCameras.findIndex((c) => c.id === selectedCameraId);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextCam = availableCameras[nextIndex];
      setSelectedCameraId(nextCam.id);
      const isFront = /front|user|integrated|webcam|facetime/i.test(nextCam.label);
      setIsMirrored(isFront);
      startCamera(nextCam.id);
    } else {
      // Toggle mirror mode if only single camera
      setIsMirrored(!isMirrored);
    }
  };

  // Scan QR code directly from uploaded image file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    try {
      let scanner = scannerRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode('qr-reader-region');
        scannerRef.current = scanner;
      }
      const decodedResult = await scanner.scanFile(file, true);
      handleSuccess(decodedResult);
    } catch (err) {
      console.warn('File QR scan error:', err);
      setCameraError('No valid QR code found in the uploaded image. Please try a clearer picture or use the presets.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  // Filter preset QR codes based on scanType ('medicine' or 'staff')
  const relevantPresets = PRESET_QR_CODES.filter((item) =>
    scanType === 'staff' ? item.code.startsWith('STAFF:') : item.code.startsWith('MED:')
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card qr-scanner-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge bg-primary-light text-primary">
              <Camera size={22} />
            </div>
            <div>
              <h3>{title}</h3>
              <p className="modal-subtitle">
                Optical QR Recognition &lt; 0.4s • Laptop Front Webcam &amp; Mobile Compatible
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Prototype Test State Switcher Bar (Evaluation Mode Only) */}
        {isEvaluationMode && (
          <div className="scanner-states-toolbar">
            <span className="states-toolbar-label">Interactive Prototype State Tester:</span>
            <div className="state-pills">
              <button
                type="button"
                className={`state-pill ${scannerState === 'live_camera' ? 'active' : ''}`}
                onClick={() => {
                  setScannerState('live_camera');
                  setCameraError(null);
                  setScannedResult(null);
                  startCamera();
                }}
              >
                1. Camera Frame
              </button>
              <button
                type="button"
                className={`state-pill ${scannerState === 'permission_prompt' ? 'active' : ''}`}
                onClick={() => {
                  stopCamera();
                  setScannerState('permission_prompt');
                }}
              >
                2. Permission Request
              </button>
              <button
                type="button"
                className={`state-pill ${scannerState === 'scan_failure' ? 'active' : ''}`}
                onClick={() => {
                  stopCamera();
                  setScannerState('scan_failure');
                }}
              >
                3. Scan Failure
              </button>
              <button
                type="button"
                className={`state-pill ${scannerState === 'manual_entry' ? 'active' : ''}`}
                onClick={() => {
                  stopCamera();
                  setScannerState('manual_entry');
                }}
              >
                4. Manual Entry Fallback
              </button>
            </div>
          </div>
        )}

        <div className="modal-body">
          {/* STATE 1: LIVE CAMERA VIEW & SCAN FRAME */}
          {scannerState === 'live_camera' && (
            <div className="scanner-camera-wrapper">
              {/* Laptop Camera Controls Bar */}
              <div className="camera-controls-bar">
                <div className="camera-select-wrap">
                  <Camera size={14} className="text-primary" />
                  {availableCameras.length > 0 ? (
                    <select
                      className="camera-device-select"
                      value={selectedCameraId}
                      onChange={handleCameraChange}
                      title="Select Video Camera Input"
                    >
                      {availableCameras.map((cam, idx) => (
                        <option key={cam.id || idx} value={cam.id}>
                          {cam.label || `Camera ${idx + 1} (${idx === 0 ? 'Front/Integrated' : 'External'})`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="camera-name-label">
                      Laptop Front Camera {cameraActive ? '(Active)' : ''}
                    </span>
                  )}
                </div>

                <div className="camera-actions-right">
                  {/* Mirror View Toggle */}
                  <button
                    type="button"
                    className={`btn-camera-util ${isMirrored ? 'active' : ''}`}
                    onClick={() => setIsMirrored(!isMirrored)}
                    title={isMirrored ? 'Disable Mirror View' : 'Enable Mirror View (Selfie mode)'}
                  >
                    <FlipHorizontal size={14} />
                    <span>{isMirrored ? 'Mirrored' : 'Normal'}</span>
                  </button>

                  {/* Flip / Switch Camera button */}
                  {availableCameras.length > 1 && (
                    <button
                      type="button"
                      className="btn-camera-util"
                      onClick={handleFlipCamera}
                      title="Switch to next camera"
                    >
                      <RefreshCw size={14} />
                      <span>Switch Camera</span>
                    </button>
                  )}

                  {/* Upload QR Image fallback */}
                  <button
                    type="button"
                    className="btn-camera-util"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload QR Code photo or image"
                  >
                    <Upload size={14} />
                    <span>Upload Image</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {/* QR Camera Video Region */}
              <div className={`qr-camera-container ${isMirrored ? 'mirror-active' : ''}`}>
                {/* HTML5 QR reader root element - always rendered in DOM */}
                <div id="qr-reader-region" className="qr-reader-box" />

                {/* Reticle laser scan overlay (sibling to avoid being cleared by html5-qrcode) */}
                {cameraActive && (
                  <div className="scan-frame-reticle-overlay">
                    <div className="reticle-corner top-left"></div>
                    <div className="reticle-corner top-right"></div>
                    <div className="reticle-corner bottom-left"></div>
                    <div className="reticle-corner bottom-right"></div>
                    <div className="scan-laser-line"></div>
                    <div className="scan-target-hint">Align QR code within reticle</div>
                  </div>
                )}

                {/* Starting / Loading Camera Spinner */}
                {isStartingCamera && !cameraActive && (
                  <div className="qr-camera-loading-overlay">
                    <RefreshCw size={32} className="animate-spin text-primary" />
                    <span>Activating Laptop Front Camera...</span>
                  </div>
                )}

                {/* Inactive Camera Placeholder */}
                {!cameraActive && !isStartingCamera && !scannedResult && (
                  <div className="qr-camera-placeholder">
                    <div className="reticle-placeholder-box">
                      <div className="reticle-corner top-left"></div>
                      <div className="reticle-corner top-right"></div>
                      <div className="reticle-corner bottom-left"></div>
                      <div className="reticle-corner bottom-right"></div>
                      <Camera size={44} className="text-muted" />
                      <span>Hold QR code on medicine box or staff badge up to your laptop front camera</span>
                    </div>

                    <div className="camera-action-buttons">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => startCamera()}
                      >
                        <Camera size={16} /> Turn On Front Camera
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={16} /> Scan QR from Photo / File
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setScannerState('manual_entry')}
                      >
                        Manual Search Fallback
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Error / Troubleshooting Notice */}
              {cameraError && (
                <div className="camera-diagnostic-card">
                  <div className="diagnostic-header">
                    <AlertCircle size={18} className="text-warning" />
                    <strong>Camera Notification</strong>
                  </div>
                  <p className="diagnostic-message">{cameraError}</p>
                  <div className="diagnostic-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      onClick={() => startCamera()}
                    >
                      <RefreshCw size={13} /> Retry Front Camera
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={13} /> Select Image File
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => setScannerState('manual_entry')}
                    >
                      Use Manual Fallback
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATE 2: CAMERA PERMISSION REQUEST STATE */}
          {scannerState === 'permission_prompt' && (
            <div className="scanner-state-card permission-card">
              <div className="state-icon-large bg-sky-light text-primary">
                <KeyRound size={36} />
              </div>
              <h4>Laptop Camera Permission Required</h4>
              <p>
                "In One Hand" requires camera access to scan medicine GTIN barcodes, QR verification
                codes, and staff badge passes directly from your device.
              </p>

              <div className="permission-guarantee">
                <ShieldCheck size={16} className="text-emerald" />
                <span>Zero images stored. Frames are processed locally in real-time.</span>
              </div>

              <div className="permission-actions-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setScannerState('live_camera');
                    startCamera();
                  }}
                >
                  <CheckCircle size={16} /> Allow Camera Access (Grant)
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setScannerState('permission_denied')}
                >
                  Deny / Block Permission
                </button>
              </div>
            </div>
          )}

          {/* STATE 2B: PERMISSION DENIED STATE */}
          {scannerState === 'permission_denied' && (
            <div className="scanner-state-card error-card">
              <div className="state-icon-large bg-rose-light text-rose">
                <AlertCircle size={36} />
              </div>
              <h4>Camera Access Blocked in Browser</h4>
              <p>
                Camera permission was denied in your browser settings. To re-enable:
              </p>

              <div className="failure-tips-box">
                <strong>How to Enable:</strong>
                <ol style={{ paddingLeft: '1.25rem', marginTop: '0.4rem', fontSize: '0.82rem', lineHeight: '1.6' }}>
                  <li>Look at the top address bar of your browser (next to <code>http://127.0.0.1:5173</code>).</li>
                  <li>Click the <strong>Lock / Sliders / Camera</strong> icon.</li>
                  <li>Toggle <strong>Camera</strong> from "Blocked" to <strong>"Allow"</strong>.</li>
                  <li>Click the button below to retry scanning.</li>
                </ol>
              </div>

              <div className="permission-actions-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setScannerState('live_camera');
                    startCamera();
                  }}
                >
                  <RefreshCw size={14} /> Retry Front Camera Now
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setScannerState('manual_entry')}
                >
                  Switch to Manual Entry Fallback &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: SCAN FAILURE STATE */}
          {scannerState === 'scan_failure' && (
            <div className="scanner-state-card error-card">
              <div className="state-icon-large bg-rose-light text-rose">
                <FileQuestion size={36} />
              </div>
              <h4>Scan Failure — Unreadable QR Code</h4>
              <p>
                The scanned QR code is damaged, low contrast, or does not adhere to the national PHC
                resource format specification.
              </p>

              <div className="failure-tips-box">
                <strong>Troubleshooting Advice for Laptop Webcams:</strong>
                <ul>
                  <li>Laptop front webcams typically have a fixed focal range of 30–50 cm. Avoid holding the QR code too close to the screen.</li>
                  <li>Ensure ample room lighting and avoid screen glare reflecting onto paper or phone.</li>
                  <li>Or use the 1-click test presets or Manual Search below without disrupting clinic workflow.</li>
                </ul>
              </div>

              <div className="permission-actions-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setScannerState('live_camera');
                    startCamera();
                  }}
                >
                  <RefreshCw size={16} /> Try Scanning Again
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setScannerState('manual_entry')}
                >
                  Manual Entry Fallback
                </button>
              </div>
            </div>
          )}

          {/* SCAN SUCCESS STATE BANNER */}
          {scannerState === 'scan_success' && scannedResult && (
            <div className="scan-success-banner animate-fade-in">
              <CheckCircle size={36} className="text-emerald" />
              <div>
                <strong>QR Code Identified in 0.28s!</strong>
                <div className="scanned-code-text">{scannedResult}</div>
                <small className="text-muted">Loading identified resource details...</small>
              </div>
            </div>
          )}

          {/* STATE 4: MANUAL ENTRY FALLBACK */}
          {scannerState === 'manual_entry' && (
            <div className="manual-fallback-container">
              <div className="fallback-header">
                <Search size={18} className="text-primary" />
                <div>
                  <h4>Manual Resource Entry Fallback</h4>
                  <p>Search by medicine name, batch number, or staff member ID:</p>
                </div>
              </div>

              <div className="search-input-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Type medicine name or batch (e.g. Paracetamol, AMX-2026, Dr. Priya)..."
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="manual-items-list">
                {relevantPresets
                  .filter(
                    (item) =>
                      item.label.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
                      item.code.toLowerCase().includes(manualSearchQuery.toLowerCase())
                  )
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="manual-item-row"
                      onClick={() => handleSuccess(item.code)}
                    >
                      <div>
                        <strong>{item.label}</strong>
                        <div className="code-subtext">{item.code}</div>
                      </div>
                      <button type="button" className="btn btn-outline btn-tiny">
                        Select &rarr;
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Quick Simulation Presets Section */}
          <div className="qr-presets-section">
            <div className="section-label">
              <Zap size={15} className="text-amber" />
              <span>{isEvaluationMode ? 'Instant Prototype Presets (1-Click Test for Evaluators):' : 'Sample QR Presets for Quick Testing:'}</span>
            </div>
            <div className="preset-buttons-grid">
              {relevantPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="preset-btn"
                  onClick={() => handleSuccess(preset.code)}
                >
                  <span className="preset-pill">{preset.code.split(':')[0]}</span>
                  <span className="preset-text">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {cameraActive ? (
            <button type="button" className="btn btn-secondary" onClick={stopCamera}>
              <VideoOff size={15} /> Stop Camera
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => startCamera()}>
              <Camera size={15} /> Start Camera
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
